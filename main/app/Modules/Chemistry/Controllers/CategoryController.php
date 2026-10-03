<?php

namespace App\Modules\Chemistry\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chemistry\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    /**
     * Default deck per subject / key stage. UK students (KS3) play the
     * UK datasets; Nigerian students (SS1-SS3) are routed to the deck
     * matching their own senior-secondary level per subject.
     */
    private const DEFAULT_DECKS = [
        'UK' => [
            'science' => 'science-foundation',
            'chemistry' => 'periodic-table-groups',
        ],
        'Nigeria' => [
            'biology' => ['SS1' => 'ss1-biology', 'SS2' => 'ss2-biology', 'SS3' => 'ss3-biology'],
            'chemistry' => ['SS1' => 'ss1-chemistry', 'SS2' => 'ss2-chemistry', 'SS3' => 'ss3-chemistry'],
            'physics' => ['SS1' => 'ss1-physics', 'SS2' => 'ss2-physics', 'SS3' => 'ss3-physics'],
        ],
    ];

    /**
     * Resolve the current user's key stage: explicit query param first,
     * then the stored profile, then the country default (UK -> KS3,
     * Nigeria -> SS1).
     */
    private function resolveKeyStage(Request $request): string
    {
        $requested = strtoupper(
            $request->query('key_stage', '')
        );

        if ($requested) {
            return $requested;
        }

        $user = $request->user();

        if ($user && $user->key_stage) {
            return strtoupper($user->key_stage);
        }

        return ($user && $user->country === 'Nigeria') ? 'SS1' : 'KS3';
    }

    /**
     * Resolve the deck for a subject: an explicitly requested deck
     * always wins when it has data for the user's key stage; otherwise
     * fall back to that country/grade's default deck for the subject.
     */
    private function resolveDeck(Request $request, string $subject, string $keyStage): string
    {
        $user = $request->user();
        $country = $user?->country === 'Nigeria' ? 'Nigeria' : 'UK';

        $requested = $request->query('deck');

        if ($requested) {
            $exists = Category::query()
                ->where('deck', $requested)
                ->where('key_stage', $keyStage)
                ->exists();

            if ($exists) {
                return $requested;
            }
        }

        $defaults = self::DEFAULT_DECKS[$country][$subject] ?? null;

        if (is_array($defaults)) {
            return $defaults[$keyStage]
                ?? $defaults['SS1']
                ?? reset($defaults);
        }

        return $defaults ?: $requested ?: 'periodic-table-groups';
    }

    /**
     * The user's country — used to decide which dataset family a
     * student may browse.
     */
    private function resolveCountry(Request $request): string
    {
        return $request->user()?->country === 'Nigeria' ? 'Nigeria' : 'UK';
    }

    /**
     * Return all categories for a deck.
     */
    public function index(Request $request): JsonResponse
    {
        $deck = $request->query(
            'deck',
            'periodic-table-groups'
        );

        $keyStage = strtoupper(
            $request->query('key_stage', 'KS3')
        );

        $categories = Category::query()
            ->where('deck', $deck)
            ->where('key_stage', $keyStage)
            ->orderBy('serial_number')
            ->get();

        return $this->successResponse(
            $categories,
            'Categories loaded successfully'
        );
    }


    /**
     * List every playable deck the *current user* is entitled to:
     * only decks matching the user's key stage (UK students see UK
     * datasets, Nigerian students see decks for their own SS level).
     */
    public function decks(Request $request): JsonResponse
    {
        $categoryCount = 5;

        $keyStage = $this->resolveKeyStage($request);

        $rows = Category::query()
            ->where('key_stage', $keyStage)
            ->select('deck', 'key_stage', 'difficulty', 'card_pool')
            ->get()
            ->filter(function ($category) {
                return is_array($category->card_pool)
                    && count($category->card_pool) >= 3;
            })
            ->groupBy(function ($row) {
                return $row->deck . '|' . $row->key_stage;
            });

        $decks = $rows->map(function ($rows, $key) use ($categoryCount) {
            [$deck, $keyStage] = explode('|', $key);

            $byDifficulty = $rows->groupBy(function ($row) {
                return ucfirst(strtolower($row->difficulty));
            });

            $levels = [];
            $totalLevels = 0;

            foreach (['Easy', 'Medium', 'Hard'] as $difficulty) {
                $count = ($byDifficulty->get($difficulty) ?? collect())->count();
                $maxLevels = $count >= $categoryCount
                    ? intdiv($count, $categoryCount)
                    : 0;

                $levels[] = [
                    'difficulty' => $difficulty,
                    'available_categories' => $count,
                    'max_levels' => $maxLevels,
                ];

                $totalLevels += $maxLevels;
            }

            return [
                'deck' => $deck,
                'key_stage' => $keyStage,
                'categories_per_level' => $categoryCount,
                'total_levels' => $totalLevels,
                'difficulties' => $levels,
            ];
        })->values();

        return $this->successResponse(
            $decks,
            'Decks loaded successfully'
        );
    }

    /**
     * Generate a random Solitaire game board.
     *
     * A level is a closed universe of selected category definitions: the
     * level deck contains only the base/crown card and the full matching
     * card pool belonging to the categories chosen for this board, and
     * nothing from an unselected category is ever allowed to leak in.
     */
    public function board(Request $request): JsonResponse
    {
        // Route shape: /api/{subject}/board -> subject is segment 2.
        $subject = $request->segment(2) ?: 'chemistry';

        $keyStage = $this->resolveKeyStage($request);
        $deck = $this->resolveDeck($request, $subject, $keyStage);

        $difficulty = $request->query('difficulty');

        // Number of category definitions to select for this level.
        // Bounded to keep the board playable — the UI has 5 category slots.
        $categoryCount = (int) $request->query('categories', 5);
        $categoryCount = max(3, min(8, $categoryCount));

        $query = Category::query()
            ->where('deck', $deck)
            ->where('key_stage', $keyStage);

        if ($difficulty) {
            // Difficulty is normalized at import time, but filter
            // case-insensitively regardless so stale rows can't leak in.
            $query->whereRaw(
                'LOWER(difficulty) = ?',
                [strtolower($difficulty)]
            );
        }

        $categories = $query
            ->get()
            ->filter(function ($category) {
                return is_array($category->card_pool)
                    && count($category->card_pool) >= 3;
            });

        $availableCategories = $categories->count();

        if ($availableCategories < 3) {
            \Illuminate\Support\Facades\Log::info('Categories count: ' . $availableCategories . ' Deck: ' . $deck . ' KS: ' . $keyStage);
            \Illuminate\Support\Facades\Log::info('Raw count: ' . $query->count());

            return response()->json([
                'status' => 'Error',
                'message' => 'Not enough categories available to generate this board.'
            ], 422);
        }

        // How many distinct levels this difficulty tier can actually
        // support, derived from the real dataset rather than a guessed
        // constant: every level consumes $categoryCount categories, so
        // the tier is exhausted once we've cycled through them all.
        $maxLevels = max(1, intdiv($availableCategories, $categoryCount));

        // Freeze the selected category set for this level — everything
        // downstream (cards, shuffle, stacks) is generated only from these.
        $selectedCategories = $categories
            ->shuffle()
            ->take(min($categoryCount, $availableCategories))
            ->values();

        // Every pool card belongs to exactly one category (its parent
        // row's id). The whole pool travels — no random truncation or
        // padding — the UI decides how much of it is visible at once.
        $board = $selectedCategories->map(
            function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'difficulty' => $category->difficulty,
                    'icon_type' => strtolower((string) $category->icon_type),
                    'cards' => collect($category->card_pool)
                        ->shuffle()
                        ->values()
                        ->all(),
                ];
            }
        );

        return $this->successResponse(
            [
                'deck' => $deck,
                'key_stage' => $keyStage,
                'subject' => $subject,
                'categories' => $board,
                'categories_per_level' => $categoryCount,
                'total_categories_available' => $availableCategories,
                'max_levels' => $maxLevels,
            ],
            'Game board generated successfully'
        );
    }
}