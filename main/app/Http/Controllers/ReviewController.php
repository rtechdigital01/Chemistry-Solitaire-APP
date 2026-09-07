<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::latest()->take(3)->get();
        return response()->json([
            'status' => 'Success',
            'data' => $reviews
        ]);
    }
}
