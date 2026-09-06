<?php

use App\Modules\Chemistry\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

Route::get(
    '/chemistry/categories',
    [CategoryController::class, 'index']
);

Route::get(
    '/chemistry/board',
    [CategoryController::class, 'board']
);