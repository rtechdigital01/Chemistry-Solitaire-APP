<?php

namespace App\Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;

class GameDataset extends Model
{
    protected $table = 'game_datasets';

    protected $fillable = [
        'dataset_key',
        'country',
        'key_stage',
        'subject',
        'topic',
        'deck',
        'label',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}