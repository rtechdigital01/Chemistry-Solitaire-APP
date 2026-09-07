<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }


public function register(Request $request): JsonResponse
{
    $data = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8|confirmed',
        'country' => 'required|string|in:UK,Nigeria',
        'education_level' => 'required|string|max:20',
        'role' => 'required|string|in:student,teacher',
    ]);

    $levelMap = [
        'UK' => [
            'Year 7' => 'KS3',
            'Year 8' => 'KS3',
            'Year 9' => 'KS3',
            'Year 10' => 'KS4',
            'Year 11' => 'KS4',
            'Year 12' => 'KS5',
            'Year 13' => 'KS5',
        ],
        'Nigeria' => [
            'SS1' => 'KS3',
            'SS2' => 'KS4',
            'SS3' => 'KS4',
            'A Level' => 'KS5',
        ],
    ];

    if (!isset($levelMap[$data['country']][$data['education_level']])) {
        return response()->json([
            'status' => 'Error',
            'message' => 'Invalid education level for the selected country.',
        ], 422);
    }

    $data['key_stage'] =
        $levelMap[$data['country']][$data['education_level']];

    $result = $this->authService->register($data);

    return $this->successResponse(
        $result,
        'User registered successfully',
        201
    );
}



    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $result = $this->authService->login($data);

        return $this->successResponse(
            $result,
            'User logged in successfully'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(
            null,
            'User logged out successfully'
        );
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            $request->user(),
            'User profile retrieved successfully'
        );
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'display_name' => 'required|string|max:30',
            'avatar' => 'nullable|string|in:chemist,atom,scientist,lab,crystal,molecule,flask,nature',
            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $this->authService->updateProfile(
            $request->user(),
            $data,
            $request->file('profile_photo')
        );

        return $this->successResponse(
            $user,
            'Profile updated successfully'
        );
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email',
        ]);

        $this->authService->forgotPassword($data['email']);

        return $this->successResponse(
            null,
            'If the email exists, a password reset link has been sent.'
        );
    }
}