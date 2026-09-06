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

    public function saveAttempt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic' => 'required|string|max:100',
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