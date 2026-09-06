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


        $query = Category::query()
            ->where('deck', $deck)
            ->where('key_stage', $keyStage);


        if ($difficulty) {
            $query->whereRaw(
                'LOWER(difficulty) = ?',
                [strtolower($difficulty)]
            );
        }


        $categories = $query
            ->get()
            ->filter(function ($category) {
                return is_array($category->card_pool)
                    && count($category->card_pool) >= 4;
            });


        if ($categories->count() < 4) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Not enough categories available to generate this board.'
            ], 422);
        }


        // Pick 4 random categories
        $selectedCategories = $categories
            ->shuffle()
            ->take(4)
            ->values();


        // Pick 4–7 random cards from each category
        $board = $selectedCategories->map(
            function ($category) {

                $pool = collect($category->card_pool)
                    ->shuffle();

                $maximumCards = min(
                    7,
                    $pool->count()
                );

                $numberOfCards = random_int(
                    4,
                    $maximumCards
                );

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'difficulty' => $category->difficulty,
                    'icon_type' => $category->icon_type,
                    'cards' => $pool
                        ->take($numberOfCards)
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
            ],
            'Game board generated successfully'
        );
    }
}