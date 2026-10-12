<?php

namespace App\Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;

class LessonSummary extends Model
{
    protected $table = 'lesson_summaries';

    protected $fillable = [
        'subject',
        'key_stage',
        'deck',
        'topic',
        'title',
        'youtube_url',
        'youtube_id',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Extract a clean YouTube 11-char video ID from any format.
     */
    public static function extractYoutubeId(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        $url = trim($url);

        // Pattern matching standard watch?v=, youtu.be/, embed/, shorts/
        if (preg_match('/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i', $url, $matches)) {
            return $matches[1];
        }

        // Direct 11-char ID
        if (preg_match('/^[\w-]{11}$/', $url)) {
            return $url;
        }

        return null;
    }

    /**
     * Boot hook to automatically calculate youtube_id when saving.
     */
    protected static function booted()
    {
        static::saving(function ($summary) {
            if ($summary->youtube_url && empty($summary->youtube_id)) {
                $summary->youtube_id = self::extractYoutubeId($summary->youtube_url);
            }
        });
    }
}
