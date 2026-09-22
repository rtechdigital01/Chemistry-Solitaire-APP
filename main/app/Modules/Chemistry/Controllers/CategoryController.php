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
     * Generate a random Solitaire game board.
     *
     * A level is a closed universe of selected category definitions: the
     * level deck contains only the base/crown card and the full matching
     * card pool belonging to the categories chosen for this board, and
     * nothing from an unselected category is ever allowed to leak in.
     */
    public function board(Request $request): JsonResponse
    {
        $deck = $request->query(
            'deck',
            'periodic-table-groups'
        );

        $keyStage = strtoupper(
            $request->query('key_stage', 'KS3')
        );

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
                'categories' => $board,
                'categories_per_level' => $categoryCount,
                'total_categories_available' => $availableCategories,
                'max_levels' => $maxLevels,
            ],
            'Game board generated successfully'
        );
    }
}