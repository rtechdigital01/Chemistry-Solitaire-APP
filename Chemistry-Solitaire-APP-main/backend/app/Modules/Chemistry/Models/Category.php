<?php

namespace App\Modules\Chemistry\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'serial_number',
        'name',
        'difficulty',
        'card_pool',
        'icon_type',
    ];

    protected $casts = [
        'card_pool' => 'array',
    ];
}
