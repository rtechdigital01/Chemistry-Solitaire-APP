<?php

use App\Modules\Chemistry\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/chemistry/categories',
        [CategoryController::class, 'index']
    );

    Route::get(
        '/chemistry/board',
        [CategoryController::class, 'board']
    );

    Route::get(
        '/chemistry/decks',
        [CategoryController::class, 'decks']
    );

    Route::get(
        '/biology/decks',
        [CategoryController::class, 'decks']
    );

    Route::get(
        '/physics/decks',
        [CategoryController::class, 'decks']
    );
});