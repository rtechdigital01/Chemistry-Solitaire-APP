<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject',
        'deck',
        'score',
        'moves',
        'accuracy',
        'time_spent'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
