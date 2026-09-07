<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('user_name');
            $table->string('role')->default('student');
            $table->integer('rating')->default(5);
            $table->text('comment');
            $table->timestamps();
        });

        // Insert initial seed data
        DB::table('reviews')->insert([
            [
                'user_name' => 'Sarah J.',
                'role' => 'Year 11 Student',
                'rating' => 5,
                'comment' => 'The card matching makes memorising the periodic table so much easier. I actually enjoy revising now!',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_name' => 'Mr. Davies',
                'role' => 'Head of Science',
                'rating' => 5,
                'comment' => 'A fantastic resource for homework assignments. The ability to track which topics students struggle with is invaluable.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_name' => 'Toby',
                'role' => 'Year 9 Student',
                'rating' => 5,
                'comment' => 'Got an A on my last end-of-topic test because of this app. The active recall really works.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
