<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('game_datasets')) {
            Schema::create('game_datasets', function (Blueprint $table) {
                $table->id();
                $table->string('dataset_key')->unique();
                $table->string('country')->nullable();
                $table->string('key_stage')->nullable();
                $table->string('subject');
                $table->string('topic')->nullable();
                $table->string('deck');
                $table->string('label')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_datasets');
    }
};
