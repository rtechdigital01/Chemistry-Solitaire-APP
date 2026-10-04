<?php

namespace App\Modules\Gameplay\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Gameplay\Services\GameplayService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameplayController extends Controller
{
    use ApiResponse;

    protected GameplayService $gameplayService;

    public function __construct(GameplayService $gameplayService)
    {
        $this->gameplayService = $gameplayService;
    }

    /**
     * The current user's furthest completed level per difficulty
     * for a deck.
     */
    public function progress(Request $request): JsonResponse
    {
        $deck = $request->query('deck', 'periodic-table-groups');
        $keyStage = strtoupper($request->query('key_stage', 'KS3'));

        $rows = \App\Modules\Gameplay\Models\GameplayAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('deck', $deck)
            ->where('key_stage', $keyStage)
            ->where('completed', true)
            ->get(['difficulty', 'level']);

        $highest = [];

        foreach ($rows as $row) {
            $difficulty = ucfirst(strtolower((string) $row->difficulty));

            $highest[$difficulty] = max(
                $highest[$difficulty] ?? 0,
                (int) $row->level
            );
        }

        return $this->successResponse(
            [
                'deck' => $deck,
                'key_stage' => $keyStage,
                'highest_completed_level' => $highest,
            ],
            'Progress loaded successfully'
        );
    }


    /**
     * Save gameplay attempt.
     */
    public function saveAttempt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic' => 'required|string|max:100',
            'deck' => 'nullable|string|max:100',
            'key_stage' => 'nullable|string|max:20',
            'difficulty' => 'nullable|string|max:20',
            'level' => 'required|integer|min:1',
            'score' => 'required|integer|min:0',
            'moves' => 'required|integer|min:0',
            'correct_matches' => 'required|integer|min:0',
            'incorrect_matches' => 'required|integer|min:0',
            'hints_used' => 'required|integer|min:0',
            'time_spent' => 'required|integer|min:0',
            'retries' => 'nullable|integer|min:0',
            'completed' => 'required|boolean',
        ]);

        $attempt = $this->gameplayService->saveAttempt(
            $request->user(),
            $data
        );

        return $this->successResponse(
            $attempt,
            'Gameplay attempt saved successfully',
            201
        );
    }


    /**
     * Save feedback after completing a level.
     */
    public function saveFeedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => 'required|string|max:50',
            'deck' => 'required|string|max:191',
            'key_stage' => 'required|string|max:20',
            'difficulty' => 'required|string|max:20',
            'level' => 'required|integer|min:1',
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'required|string|max:500',
        ]);

        $reviewId = DB::table('reviews')->insertGetId([
            'user_id' => $request->user()->id,
            'subject' => strtolower($data['subject']),
            'deck' => $data['deck'],
            'key_stage' => strtoupper($data['key_stage']),
            'difficulty' => strtolower($data['difficulty']),
            'level' => $data['level'],
            'rating' => $data['rating'],
            'feedback' => $data['feedback'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->successResponse(
            [
                'review_id' => $reviewId,
            ],
            'Feedback submitted successfully',
            201
        );
    }
}