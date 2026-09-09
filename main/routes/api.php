<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    $user = $request->user();
    $attempts = \App\Models\GameAttempt::where('user_id', $user->id)->get();
    
    // Append computed stats
    $user->decks_played = $attempts->count();
    $user->average_accuracy = (int) round($attempts->avg('accuracy') ?? 0);
    
    return $user;
})->middleware('auth:sanctum');

Route::post('/auth/register', [\App\Http\Controllers\AuthController::class, 'register']);
Route::post('/auth/login', [\App\Http\Controllers\AuthController::class, 'login']);
Route::post('/auth/forgot-password', [\App\Http\Controllers\AuthController::class, 'forgotPassword']);
Route::post('/auth/logout', [\App\Http\Controllers\AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::get('/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chemistry/board', [\App\Http\Controllers\BoardController::class, 'getChemistryBoard']);
    Route::get('/biology/board', [\App\Http\Controllers\BoardController::class, 'getBiologyBoard']);
    Route::get('/physics/board', [\App\Http\Controllers\BoardController::class, 'getPhysicsBoard']);
    Route::post('/gameplay/attempt', [\App\Http\Controllers\BoardController::class, 'saveAttempt']);
});
