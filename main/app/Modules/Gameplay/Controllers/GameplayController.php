<?php

namespace App\Modules\Gameplay\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Gameplay\Services\GameplayService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameplayController extends Controller
{
    use ApiResponse;

    protected GameplayService $gameplayService;

    public function __construct(GameplayService $gameplayService)
    {
        $this->gameplayService = $gameplayService;
    }

    /**
     * The current user's furthest completed level per difficulty for
     * a deck — what a level-select screen needs to decide what's
     * unlocked. A level is "completed" once any attempt at it is
     * marked completed.
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
            $highest[$difficulty] = max($highest[$difficulty] ?? 0, (int) $row->level);
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
}