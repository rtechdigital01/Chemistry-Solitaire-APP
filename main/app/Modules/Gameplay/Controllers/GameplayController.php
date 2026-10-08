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
    $user = $request->user();
    $deck = $request->query('deck', 'periodic-table-groups');
    $keyStage = strtoupper($request->query('key_stage', 'KS3'));
    $levelRows =
        \App\Modules\Gameplay\Models\GameplayAttempt::query()
            ->where('user_id', $user->id)
            ->where('deck', $deck)
            ->where('key_stage', $keyStage)
            ->where('completed', true)
            ->get(['difficulty', 'level']);
    $highest = [];
    foreach ($levelRows as $row) {
        $difficulty =
            ucfirst(
                strtolower(
                    (string) $row->difficulty
                )
            );
        $highest[$difficulty] =
            max(
                $highest[$difficulty] ?? 0,
                (int) $row->level
            );
    }
    $weekStart = now()->startOfWeek();
    $weekEnd = now()->endOfWeek();

    $weeklyAttempts =
        \App\Modules\Gameplay\Models\GameplayAttempt::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->get();

    $weeklySessions =
        $weeklyAttempts->count();

    $weeklyCorrect =
        (int) $weeklyAttempts->sum('correct_matches');

    $weeklyIncorrect =
        (int) $weeklyAttempts->sum('incorrect_matches');

    $weeklyCards =
        $weeklyCorrect + $weeklyIncorrect;

    $weeklyAccuracy =
        $weeklyCards > 0
            ? round(($weeklyCorrect / $weeklyCards) * 100)
            : 0;

    $weeklyCoins =
        (int) $weeklyAttempts->sum('coins_earned');


    $allCompletedAttempts =
        \App\Modules\Gameplay\Models\GameplayAttempt::query()
            ->where('user_id', $user->id)
            ->where('completed', true)
            ->get();


    $subjects = [];

    foreach (['chemistry', 'biology', 'physics'] as $subject) {

        $subjectAttempts =
            $allCompletedAttempts->filter(function ($attempt) use ($subject) {
                return strtolower((string) $attempt->subject) === $subject;
            });

        $completedDecks =
            $subjectAttempts
                ->pluck('deck')
                ->filter()
                ->unique()
                ->count();

        $correct =
            (int) $subjectAttempts->sum('correct_matches');

        $incorrect =
            (int) $subjectAttempts->sum('incorrect_matches');

        $total =
            $correct + $incorrect;

        $accuracy =
            $total > 0
                ? round(($correct / $total) * 100)
                : 0;

        $subjects[$subject] = [
            'completed_decks' => $completedDecks,
            'accuracy' => $accuracy,
            'correct_matches' => $correct,
            'incorrect_matches' => $incorrect,
        ];
    }

    return $this->successResponse(
    [
        'deck' => $deck,
        'key_stage' => $keyStage,
        'highest_completed_level' => $highest,
        'weekly' => [
                'cards' => $weeklyCards,
                'sessions' => $weeklySessions,
                'accuracy' => $weeklyAccuracy,
                'coins' => $weeklyCoins,
            ],

            'subjects' => $subjects,

            'coin_balance' =>
                (int) $user->coin_balance,
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
            'subject' => 'required|string|max:50',
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
 * Check whether the user can submit gameplay feedback.
 */
public function feedbackEligibility(Request $request): JsonResponse
{
    $lastFeedback = DB::table('reviews')
        ->where('user_id', $request->user()->id)
        ->orderByDesc('created_at')
        ->first();

    $hasPreviousFeedback = $lastFeedback !== null;

    $eligible = !$hasPreviousFeedback ||
        \Carbon\Carbon::parse($lastFeedback->created_at)
            ->addDays(30)
            ->lte(now());

    return $this->successResponse([
        'eligible' => $eligible,
        'has_previous_feedback' => $hasPreviousFeedback,
    ], 'Feedback eligibility checked');
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


$lastFeedback = DB::table('reviews')
    ->where('user_id', $request->user()->id)
    ->orderByDesc('created_at')
    ->first();

if ($lastFeedback) {
    $nextAllowedDate = \Carbon\Carbon::parse($lastFeedback->created_at)
        ->addDays(30);

    if (now()->lt($nextAllowedDate)) {
        return response()->json([
            'message' => 'You can submit feedback again after 30 days.',
        ], 429);
    }
} elseif ((int) $data['level'] !== 1) {
    return response()->json([
        'message' => 'Your first feedback must be submitted after Level 1.',
    ], 403);
}


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