<?php

namespace App\Modules\Chemistry\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'subject',
        'serial_number',
        'deck',
        'key_stage',
        'name',
        'difficulty',
        'card_pool',
        'icon_type',
    ];

    protected $casts = [
        'card_pool' => 'array',
    ];
}
