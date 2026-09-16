<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('subject')->default('Chemistry')->after('id');
        });

        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->string('subject')->default('Chemistry')->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('subject');
        });

        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->dropColumn('subject');
        });
    }
};
