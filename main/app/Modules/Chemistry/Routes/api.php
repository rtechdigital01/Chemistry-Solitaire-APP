<?php

use App\Modules\Chemistry\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

// Public board generation and deck catalog endpoints (supporting guest demo & preview)
Route::get('/chemistry/board', [CategoryController::class, 'board']);
Route::get('/biology/board', [CategoryController::class, 'board']);
Route::get('/physics/board', [CategoryController::class, 'board']);
Route::get('/science/board', [CategoryController::class, 'board']);
Route::get('/science-foundation/board', [CategoryController::class, 'board']);

Route::get('/decks', [CategoryController::class, 'decks']);
Route::get('/chemistry/decks', [CategoryController::class, 'decks']);
Route::get('/biology/decks', [CategoryController::class, 'decks']);
Route::get('/physics/decks', [CategoryController::class, 'decks']);
Route::get('/science/decks', [CategoryController::class, 'decks']);
Route::get('/science-foundation/decks', [CategoryController::class, 'decks']);

// Authenticated administrative / user category endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chemistry/categories', [CategoryController::class, 'index']);
});