<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->string('deck')->nullable()->after('topic');
            $table->string('key_stage')->nullable()->after('deck');
            $table->string('difficulty')->nullable()->after('key_stage');
        });
    }

    public function down(): void
    {
        Schema::table('gameplay_attempts', function (Blueprint $table) {
            $table->dropColumn(['deck', 'key_stage', 'difficulty']);
        });
    }
};
