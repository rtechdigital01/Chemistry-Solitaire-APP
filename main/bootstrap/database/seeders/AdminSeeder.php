<?php

namespace Database\Seeders;

use App\Modules\Auth\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the platform admin account.
 *
 * Credentials can be overridden via env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 * Defaults exist only for local development.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@sciencesolitaire.com')],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'Admin@123')),
                'country' => 'UK',
                'role' => 'admin',
                'education_level' => null,
                'key_stage' => null,
            ],
        );
    }
}
