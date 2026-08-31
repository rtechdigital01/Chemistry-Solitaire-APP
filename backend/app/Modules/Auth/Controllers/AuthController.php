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
        ]);

        $result = $this->authService->register($data);

        return $this->successResponse($result, 'User registered successfully', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $result = $this->authService->login($data);

        return $this->successResponse($result, 'User logged in successfully');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(null, 'User logged out successfully');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse($request->user(), 'User profile retrieved successfully');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email',
        ]);

        $this->authService->forgotPassword($data['email']);

        // Always return success to prevent email enumeration
        return $this->successResponse(null, 'If the email exists, a password reset link has been sent.');
    }
}
