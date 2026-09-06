<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gameplay_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('topic');
            $table->unsignedInteger('level');

            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('moves')->default(0);

            $table->unsignedInteger('correct_matches')->default(0);
            $table->unsignedInteger('incorrect_matches')->default(0);
            $table->unsignedInteger('hints_used')->default(0);

            $table->unsignedInteger('time_spent')->default(0);
            $table->unsignedInteger('retries')->default(0);

            $table->boolean('completed')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gameplay_attempts');
    }
};