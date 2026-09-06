<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user and return the token.
     */
   public function register(array $data): array
{
    $user = User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => Hash::make($data['password']),
        'country' => $data['country'],
        'education_level' => $data['education_level'],
        'key_stage' => $data['key_stage'],
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return [
        'user' => $user,
        'token' => $token,
    ];
}
    /**
     * Authenticate user and return the token.
     */
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Update user's profile.
     */
    public function updateProfile(
        User $user,
        array $data,
        ?UploadedFile $photo = null
    ): User {
        $updateData = [
            'display_name' => $data['display_name'],
            'avatar' => $data['avatar'] ?? 'chemist',
        ];

        if ($photo) {
            $uploadDirectory = public_path('uploads/avatars');

            if (!is_dir($uploadDirectory)) {
                mkdir($uploadDirectory, 0755, true);
            }

            $fileName = time()
                . '_'
                . uniqid()
                . '.'
                . $photo->extension();

            $photo->move($uploadDirectory, $fileName);

            $updateData['profile_photo'] =
                'uploads/avatars/' . $fileName;

            $updateData['avatar'] = 'photo';
        }

        $user->update($updateData);

        return $user->fresh();
    }

    /**
     * Logout user by revoking current token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Handle forgot password request.
     */
    public function forgotPassword(string $email): void
    {
        \Illuminate\Support\Facades\Password::sendResetLink(
            ['email' => $email]
        );
    }
}