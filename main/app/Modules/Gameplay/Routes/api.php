<?php

use App\Modules\Gameplay\Controllers\GameplayController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

    Route::post(
        '/gameplay/attempt',
        [GameplayController::class, 'saveAttempt']
    );

    Route::get(
        '/gameplay/progress',
        [GameplayController::class, 'progress']
    );


    Route::get(
        '/gameplay/feedback/eligibility',
        [GameplayController::class, 'feedbackEligibility']
    );


    Route::post(
        '/gameplay/feedback',
        [GameplayController::class, 'saveFeedback']
    );

});