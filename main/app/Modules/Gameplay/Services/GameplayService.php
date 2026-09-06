<?php

namespace App\Modules\Gameplay\Services;

use App\Modules\Gameplay\Models\GameplayAttempt;
use App\Modules\Auth\Models\User;
use Illuminate\Support\Facades\DB;

class GameplayService
{
    public function saveAttempt(User $user, array $data): GameplayAttempt
    {
        return DB::transaction(function () use ($user, $data) {

            $correct = (int) $data['correct_matches'];
            $incorrect = (int) $data['incorrect_matches'];
            $timeSpent = (int) $data['time_spent'];
            $completed = (bool) $data['completed'];

            /*
             * Accuracy
             */
            $totalAttempts = $correct + $incorrect;

            $accuracy = $totalAttempts > 0
                ? ($correct / $totalAttempts) * 100
                : 0;

            /*
             * Coins from correct matches
             * 10 coins per correct match
             */
            $matchCoins = $correct * 10;

            /*
             * Completion bonus
             * Maximum 50 coins at 100% accuracy
             */
            $completionBonus = $completed
                ? (int) round(($accuracy / 100) * 50)
                : 0;

            /*
             * Time bonus
             * Under 5 minutes = 10 coins
             * 5 minutes or more = 0 coins
             */
            $timeBonus = ($completed && $timeSpent < 300)
                ? 10
                : 0;

            /*
             * Total coins earned
             */
            $coinsEarned =
                $matchCoins +
                $completionBonus +
                $timeBonus;

            /*
             * Save gameplay attempt
             */
            $attempt = GameplayAttempt::create([
                'user_id' => $user->id,
                'topic' => $data['topic'],
                'level' => $data['level'],
                'score' => $data['score'],
                'coins_earned' => $coinsEarned,
                'moves' => $data['moves'],
                'correct_matches' => $correct,
                'incorrect_matches' => $incorrect,
                'hints_used' => $data['hints_used'],
                'time_spent' => $timeSpent,
                'retries' => $data['retries'] ?? 0,
                'completed' => $completed,
            ]);

            /*
             * Add coins to user's permanent balance
             */
           $user->increment('coin_balance', $coinsEarned);
                $freshAttempt = $attempt->fresh();
                $freshUser = $user->fresh();
                
                $freshAttempt->setAttribute(
                    'coin_balance',
                    $freshUser->coin_balance
                );
                
                return $freshAttempt;
        });
    }
}