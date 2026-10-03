<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Models\User;
use App\Modules\Gameplay\Models\GameplayAttempt;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminGameplayController extends Controller
{
    use ApiResponse;

    /**
     * Detailed overview numbers (additive to /admin/overview).
     */
    public function overview(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        // All students are in scope for admins.
        $cohortIds = User::where('role', 'student')->pluck('id');

        $totals = GameplayAttempt::query()
            ->whereIn('user_id', $cohortIds)
            ->selectRaw(
                'count(*) as attempts, sum(score) as score, sum(moves) as moves, sum(time_spent) as time_spent, sum(correct_matches) as correct, sum(incorrect_matches) as incorrect, sum(coins_earned) as coins'
            )
            ->first();

        $perDeck = GameplayAttempt::query()
            ->whereIn('user_id', $cohortIds)
            ->where('completed', true)
            ->selectRaw('deck, count(*) as attempts, round(avg(score), 1) as avg_score, sum(coins_earned) as coins')
            ->groupBy('deck')
            ->get();

        $perDifficulty = GameplayAttempt::query()
            ->whereIn('user_id', $cohortIds)
            ->where('completed', true)
            ->selectRaw('difficulty, count(*) as attempts, round(avg(score), 1) as avg_score')
            ->groupBy('difficulty')
            ->get();

        $accuracy = ($totals->correct + $totals->incorrect) > 0
            ? round(($totals->correct / ($totals->correct + $totals->incorrect)) * 100, 1)
            : 0;

        return $this->successResponse([
            'totals' => [
                'attempts' => (int) $totals->attempts,
                'score' => (int) $totals->score,
                'moves' => (int) $totals->moves,
                'time_spent_seconds' => (int) $totals->time_spent,
                'correct_matches' => (int) $totals->correct,
                'incorrect_matches' => (int) $totals->incorrect,
                'coins_earned' => (int) $totals->coins,
                'accuracy_percent' => (float) $accuracy,
            ],
            'per_deck' => $perDeck->map(fn ($r) => [
                'deck' => $r->deck,
                'attempts' => (int) $r->attempts,
                'avg_score' => (float) $r->avg_score,
                'coins' => (int) $r->coins,
            ]),
            'per_difficulty' => $perDifficulty->map(fn ($r) => [
                'difficulty' => $r->difficulty,
                'attempts' => (int) $r->attempts,
                'avg_score' => (float) $r->avg_score,
            ]),
        ], 'Gameplay overview loaded successfully');
    }

    /**
     * Drill-down into one student: every attempt, ranked newest first.
     */
    public function studentActivity(Request $request, int $studentId): JsonResponse
    {
        $this->authorizeAdmin($request);

        $student = User::findOrFail($studentId);

        $attempts = GameplayAttempt::query()
            ->where('user_id', $studentId)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return $this->successResponse([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'country' => $student->country,
                'education_level' => $student->education_level,
                'key_stage' => $student->key_stage,
            ],
            'attempts' => [
                'data' => collect($attempts->items())->map(fn ($a) => [
                    'id' => $a->id,
                    'subject' => $a->subject,
                    'topic' => $a->topic,
                    'deck' => $a->deck,
                    'key_stage' => $a->key_stage,
                    'difficulty' => $a->difficulty,
                    'level' => $a->level,
                    'score' => $a->score,
                    'coins_earned' => $a->coins_earned,
                    'moves' => $a->moves,
                    'correct_matches' => $a->correct_matches,
                    'incorrect_matches' => $a->incorrect_matches,
                    'hints_used' => $a->hints_used,
                    'time_spent' => $a->time_spent,
                    'retries' => $a->retries,
                    'completed' => (bool) $a->completed,
                    'created_at' => $a->created_at,
                ]),
                'current_page' => $attempts->currentPage(),
                'last_page' => $attempts->lastPage(),
                'total' => $attempts->total(),
            ],
        ], 'Student activity loaded successfully');
    }

    /**
     * Leaderboard: top students by best aggregate score.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $top = GameplayAttempt::query()
            ->where('completed', true)
            ->selectRaw('user_id, deck, key_stage, difficulty, max(score) as best_score, sum(score) as total_score, count(*) as attempts, sum(coins_earned) as coins')
            ->groupBy('user_id', 'deck', 'key_stage', 'difficulty')
            ->orderByDesc('total_score')
            ->limit(100)
            ->get();

        $userIds = $top->pluck('user_id')->unique();
        $users = User::whereIn('id', $userIds)->pluck('name', 'id');

        return $this->successResponse([
            'top' => $top->map(fn ($r) => [
                'user_id' => $r->user_id,
                'name' => $users[$r->user_id] ?? 'Unknown',
                'deck' => $r->deck,
                'key_stage' => $r->key_stage,
                'difficulty' => $r->difficulty,
                'best_score' => (int) $r->best_score,
                'total_score' => (int) $r->total_score,
                'attempts' => (int) $r->attempts,
                'coins' => (int) $r->coins,
            ]),
        ], 'Leaderboard loaded successfully');
    }

    /**
     * Per-deck analytics (completion rates, accuracy, attempts).
     */
    public function deckAnalytics(Request $request, string $deck): JsonResponse
    {
        $this->authorizeAdmin($request);

        $cohortIds = User::where('role', 'student')->pluck('id');

        $summary = GameplayAttempt::query()
            ->where('deck', $deck)
            ->whereIn('user_id', $cohortIds)
            ->selectRaw('count(*) as total, sum(completed) as completed, sum(score) as score, sum(moves) as moves, sum(time_spent) as time_spent, sum(correct_matches) as correct, sum(incorrect_matches) as incorrect, sum(coins_earned) as coins')
            ->first();

        $total = (int) $summary->total;

        return $this->successResponse([
            'deck' => $deck,
            'total_attempts' => $total,
            'completed_attempts' => (int) $summary->completed,
            'completion_rate_percent' => $total > 0 ? round((($summary->completed / $total) * 100), 1) : 0,
            'total_score' => (int) $summary->score,
            'avg_score_per_attempt' => $total > 0 ? round(($summary->score / $total), 1) : 0,
            'total_moves' => (int) $summary->moves,
            'total_time_spent_seconds' => (int) $summary->time_spent,
            'total_correct_matches' => (int) $summary->correct,
            'total_incorrect_matches' => (int) $summary->incorrect,
            'accuracy_percent' => (($summary->correct + $summary->incorrect) > 0)
                ? round((($summary->correct / ($summary->correct + $summary->incorrect)) * 100), 1)
                : 0,
            'coins_earned' => (int) $summary->coins,
        ], 'Deck analytics loaded successfully');
    }

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Admin access required.');
        }
    }
}
