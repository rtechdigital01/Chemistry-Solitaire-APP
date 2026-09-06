<?php

namespace App\Modules\Gameplay\Models;

use Illuminate\Database\Eloquent\Model;

class GameplayAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'topic',
        'level',
        'score',
        'coins_earned',
        'moves',
        'correct_matches',
        'incorrect_matches',
        'hints_used',
        'time_spent',
        'retries',
        'completed',
    ];

    protected $casts = [
        'completed' => 'boolean',
    ];
}