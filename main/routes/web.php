<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

// Generic route to serve HTML files without the .html extension
Route::get('/{page}', function ($page) {
    $path = public_path($page . '.html');
    if (file_exists($path)) {
        return response()->file($path);
    }
    abort(404);
})->where('page', '[a-zA-Z0-9\-]+');