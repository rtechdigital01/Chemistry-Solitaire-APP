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

Route::get('/reviews', [
    \App\Modules\Admin\Controllers\AdminReportsController::class,
    'homepageReviews'
]);

Route::post('/feedback', function (Request $request) {
    $comment = $request->input('message') ?? $request->input('details') ?? 'Pilot feedback';
    $userName = $request->input('name') ?? ($request->input('email') ? explode('@', $request->input('email'))[0] : 'Pilot User');
    $rating = (int) ($request->input('rating') ?? 5);
    $role = $request->input('role') ?? 'Student';

    try {
        \Illuminate\Support\Facades\DB::table('reviews')->insert([
            'user_name'  => $userName,
            'comment'    => substr($comment, 0, 500),
            'rating'     => $rating,
            'role'       => $role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::info("Feedback: " . $comment);
    }

    return response()->json([
        'status'  => 'success',
        'message' => 'Thank you for your feedback! It has been recorded for the pilot review team.'
    ], 201);
});


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

/*
|--------------------------------------------------------------------------
| Dynamic Module Routes
|--------------------------------------------------------------------------
*/
$moduleRoutes = [
    'Admin/Routes/api.php',
    'Auth/Routes/api.php',
    'Chemistry/Routes/api.php',
    'Gameplay/Routes/api.php',
];

foreach ($moduleRoutes as $routeFile) {
    $path = base_path('app/Modules/' . $routeFile);
    if (file_exists($path)) {
        require $path;
    }
}