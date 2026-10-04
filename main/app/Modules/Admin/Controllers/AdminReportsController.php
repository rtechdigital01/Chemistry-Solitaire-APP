<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Models\User;
use App\Modules\Gameplay\Models\GameplayAttempt;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    use ApiResponse;

    /**
     * Reviews shown as testimonials on the landing page. Admins can
     * moderate them from the Feedback tab.
     */
     
public function homepageReviews(): JsonResponse
{
    $rows = DB::table('reviews')
        ->leftJoin('users', 'reviews.user_id', '=', 'users.id')
        ->where('reviews.is_featured', 1)
        ->select(
            'reviews.id',
            'reviews.rating',
            'reviews.feedback as comment',
            'users.name as user_name',
            'users.role as role'
        )
        ->orderByDesc('reviews.created_at')
        ->get();

    return $this->successResponse(
        $rows,
        'Homepage reviews loaded successfully'
    );
}
     
     
      public function feedback(): JsonResponse
        {
            $rows = DB::table('reviews')
                ->leftJoin('users', 'reviews.user_id', '=', 'users.id')
                ->select(
                    'reviews.id',
                    'reviews.user_id',
                    'users.name as name',
                    'users.role as role',
                    'reviews.subject',
                    'reviews.deck',
                    'reviews.key_stage',
                    'reviews.difficulty',
                    'reviews.level',
                    'reviews.rating',
                    'reviews.feedback as comment',
                    'reviews.is_featured',
                    'reviews.created_at'
                )
                ->orderByDesc('reviews.created_at')
                ->get();
        
            $average = $rows->count() > 0
                ? round($rows->avg('rating'), 2)
                : 0;
        
            return $this->successResponse(
                [
                    'average_rating' => (float) $average,
                    'total' => $rows->count(),
                    'reviews' => $rows,
                ],
                'Feedback loaded successfully'
            );
        }
        
        
public function featureFeedback(Request $request, int $reviewId): JsonResponse
{
    $review = DB::table('reviews')
        ->where('id', $reviewId)
        ->first();

    if (!$review) {
        return response()->json([
            'message' => 'Review not found.'
        ], 404);
    }

    $newStatus = !$review->is_featured;

    DB::table('reviews')
        ->where('id', $reviewId)
        ->update([
            'is_featured' => $newStatus,
            'updated_at' => now(),
        ]);

    return $this->successResponse(
        [
            'review_id' => $reviewId,
            'is_featured' => $newStatus,
        ],
        $newStatus
            ? 'Review added to homepage'
            : 'Review removed from homepage'
    );
}

    public function deleteFeedback(Request $request, int $reviewId): JsonResponse
    {
        $deleted = DB::table('reviews')->where('id', $reviewId)->delete();

        return $this->successResponse(
            ['deleted' => $deleted],
            'Review deleted successfully'
        );
    }

    /**
     * Coins: economy-wide totals and the top holders.
     */
    public function coins(): JsonResponse
    {
        $totals = User::query()
            ->selectRaw('sum(coin_balance) as balance, count(*) as users')
            ->first();

        $earned = GameplayAttempt::query()
            ->selectRaw('sum(coins_earned) as coins, count(*) as attempts')
            ->first();

        $topHolders = User::query()
            ->where('coin_balance', '>', 0)
            ->orderByDesc('coin_balance')
            ->limit(25)
            ->get(['id', 'name', 'email', 'role', 'country', 'coin_balance']);

        return $this->successResponse(
            [
                'total_balance_in_circulation' => (int) $totals->balance,
                'users_holding_coins' => User::where('coin_balance', '>', 0)->count(),
                'coins_earned_all_time' => (int) $earned->coins,
                'total_attempts' => (int) $earned->attempts,
                'average_coins_per_attempt' => $earned->attempts > 0
                    ? round($earned->coins / $earned->attempts, 1)
                    : 0,
                'top_holders' => $topHolders,
            ],
            'Coins loaded successfully'
        );
    }

    /**
     * Reports: registrations and activity broken down by country and
     * education level, plus a 30-day registration trend.
     */
    public function reports(): JsonResponse
    {
        $byCountry = User::query()
            ->selectRaw('country, count(*) as total')
            ->groupBy('country')
            ->orderByDesc('total')
            ->get();

        $byEducation = User::query()
            ->where('role', 'student')
            ->selectRaw('education_level, key_stage, count(*) as total')
            ->groupBy('education_level', 'key_stage')
            ->orderByDesc('total')
            ->get();

        $byRole = User::query()
            ->selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->get();

        // Registrations per day for the last 30 days.
        $dailyRegistrations = User::query()
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('date(created_at) as day, count(*) as total')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Attempts per day for the last 30 days.
        $dailyAttempts = GameplayAttempt::query()
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('date(created_at) as day, count(*) as total, sum(completed) as completed')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $deckCoverage = GameplayAttempt::query()
            ->selectRaw('deck, key_stage, count(distinct user_id) as students, count(*) as attempts')
            ->groupBy('deck', 'key_stage')
            ->orderByDesc('attempts')
            ->get();

        return $this->successResponse(
            [
                'by_country' => $byCountry,
                'by_education_level' => $byEducation,
                'by_role' => $byRole,
                'daily_registrations_30d' => $dailyRegistrations,
                'daily_attempts_30d' => $dailyAttempts,
                'deck_coverage' => $deckCoverage,
            ],
            'Reports loaded successfully'
        );
    }
}
