<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->unsignedInteger('coins_earned')
                ->default(0)
                ->after('score');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('coin_balance')
                ->default(0)
                ->after('profile_photo');
        });
    }

    public function down(): void
    {
        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->dropColumn('coins_earned');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('coin_balance');
        });
    }
};