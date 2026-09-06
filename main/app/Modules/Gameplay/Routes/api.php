<?php

use App\Modules\Gameplay\Controllers\GameplayController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

    Route::post(
        '/gameplay/attempt',
        [GameplayController::class, 'saveAttempt']
    );

});