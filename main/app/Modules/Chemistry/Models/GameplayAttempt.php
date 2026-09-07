<?php

namespace App\Modules\Chemistry\Models;

use Illuminate\Database\Eloquent\Model;

class GameplayAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'subject',
        'topic',
        'level',
        'score',
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