<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Modules\Auth\Controllers\AuthController;
// use App\Http\Controllers\ReviewController;



/*
|--------------------------------------------------------------------------
| User
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::post('/auth/register', [AuthController::class, 'register']);

Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/auth/logout', [AuthController::class, 'logout']);


/*
|--------------------------------------------------------------------------
| Reviews
|--------------------------------------------------------------------------
*/

// Route::get('/reviews', [ReviewController::class, 'index']);


/*
|--------------------------------------------------------------------------
| Science Boards
|--------------------------------------------------------------------------
*/

Route::get('/chemistry/board', [
    \App\Modules\Chemistry\Controllers\CategoryController::class,
    'board'
]);

Route::get('/biology/board', [
    \App\Modules\Chemistry\Controllers\CategoryController::class,
    'board'
]);

Route::get('/physics/board', [
    \App\Modules\Chemistry\Controllers\CategoryController::class,
    'board'
]);