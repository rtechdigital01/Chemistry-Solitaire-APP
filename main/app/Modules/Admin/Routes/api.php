<?php

use App\Modules\Admin\Controllers\AdminAuthController;
use App\Modules\Admin\Controllers\AdminDatasetController;
use App\Modules\Admin\Controllers\AdminSettingsController;
use App\Modules\Admin\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin authentication (public)
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AdminAuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Admin-only endpoints
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);

    // Dashboard data
    Route::get('/admin/overview', [AdminAuthController::class, 'overview']);
    Route::get('/admin/students', [AdminAuthController::class, 'students']);
    Route::get('/admin/teachers', [AdminAuthController::class, 'teachers']);

    // Dataset management (load / change / replace / delete datasets)
    Route::get('/admin/datasets', [AdminDatasetController::class, 'index']);
    Route::post('/admin/datasets/import', [AdminDatasetController::class, 'import']);
    Route::post('/admin/datasets/replace', [AdminDatasetController::class, 'replace']);
    Route::post('/admin/datasets/upload', [AdminSettingsController::class, 'uploadDataset']);
    Route::delete('/admin/datasets', [AdminDatasetController::class, 'destroy']);
});
