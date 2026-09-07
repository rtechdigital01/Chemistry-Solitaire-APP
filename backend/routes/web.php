<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/index.html');
});

Route::get('/setup-database', function () {
    try {
        // Run database migrations
        \Illuminate\Support\Facades\Artisan::call('migrate:force');
        
        // Generate app key if missing
        if (!env('APP_KEY')) {
            \Illuminate\Support\Facades\Artisan::call('key:generate', ['--force' => true]);
        }

        // Cache config & routes for performance
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        \Illuminate\Support\Facades\Artisan::call('config:cache');
        \Illuminate\Support\Facades\Artisan::call('route:cache');
        \Illuminate\Support\Facades\Artisan::call('view:cache');

        return response()->json([
            'status' => 'success',
            'message' => 'Database migrations and production optimization completed successfully!',
            'migration_output' => \Illuminate\Support\Facades\Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});
