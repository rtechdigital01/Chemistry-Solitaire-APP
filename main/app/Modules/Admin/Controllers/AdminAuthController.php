<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chemistry\Models\Category;
use App\Modules\Auth\Models\User;
use App\Modules\Gameplay\Models\GameplayAttempt;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])
            ->where('role', 'admin')
            ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return $this->errorResponse(
                'Invalid admin credentials.',
                401
            );
        }

        $token = $user->createToken('admin_token')->plainTextToken;

        return $this->successResponse(
            [
                'user' => $user,
                'token' => $token,
            ],
            'Admin logged in successfully'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(
            null,
            'Admin logged out successfully'
        );
    }

    public function overview(): JsonResponse
    {
        return $this->successResponse(
            [
                'total_users' => User::count(),
                'total_students' => User::where('role', 'student')->count(),
                'total_teachers' => User::where('role', 'teacher')->count(),
                'total_admins' => User::where('role', 'admin')->count(),
                'total_gameplay_attempts' => GameplayAttempt::count(),
                'total_categories' => Category::count(),
                'active_students_7d' => User::where('role', 'student')
                    ->where('updated_at', '>=', now()->subDays(7))
                    ->count(),
            ],
            'Admin overview loaded successfully'
        );
    }

    public function students(): JsonResponse
    {
        return $this->successResponse(
            User::where('role', 'student')
                ->orderBy('created_at', 'desc')
                ->get(['id', 'name', 'email', 'country', 'education_level', 'key_stage', 'coin_balance', 'created_at']),
            'Students loaded successfully'
        );
    }

    public function teachers(): JsonResponse
    {
        return $this->successResponse(
            User::where('role', 'teacher')
                ->orderBy('created_at', 'desc')
                ->get(['id', 'name', 'email', 'country', 'coin_balance', 'created_at']),
            'Teachers loaded successfully'
        );
    }
}
