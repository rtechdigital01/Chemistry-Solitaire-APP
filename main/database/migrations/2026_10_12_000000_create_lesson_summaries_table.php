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
        Schema::create('lesson_summaries', function (Blueprint $table) {
            $table->id();
            $table->string('subject')->default('chemistry');
            $table->string('key_stage')->nullable();
            $table->string('deck')->nullable();
            $table->string('topic');
            $table->string('title')->nullable();
            $table->string('youtube_url', 500);
            $table->string('youtube_id', 50)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['subject', 'key_stage', 'deck']);
            $table->index('topic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_summaries');
    }
};
