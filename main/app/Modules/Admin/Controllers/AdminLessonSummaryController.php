<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admin\Models\LessonSummary;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLessonSummaryController extends Controller
{
    use ApiResponse;

    /**
     * List all lesson summaries (Admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = LessonSummary::query()->orderBy('updated_at', 'desc');

        if ($request->has('subject') && $request->subject) {
            $query->where('subject', strtolower($request->subject));
        }

        if ($request->has('key_stage') && $request->key_stage) {
            $query->where('key_stage', strtoupper($request->key_stage));
        }

        if ($request->has('search') && $request->search) {
            $term = trim($request->search);
            $query->where(function ($q) use ($term) {
                $q->where('topic', 'like', "%{$term}%")
                  ->orWhere('title', 'like', "%{$term}%")
                  ->orWhere('deck', 'like', "%{$term}%");
            });
        }

        $summaries = $query->get()->map(function ($item) {
            $youtubeId = $item->youtube_id ?: LessonSummary::extractYoutubeId($item->youtube_url);
            return [
                'id' => $item->id,
                'subject' => $item->subject,
                'key_stage' => $item->key_stage,
                'deck' => $item->deck,
                'topic' => $item->topic,
                'title' => $item->title ?: $item->topic . ' Summary',
                'youtube_url' => $item->youtube_url,
                'youtube_id' => $youtubeId,
                'embed_url' => $youtubeId ? "https://www.youtube-nocookie.com/embed/{$youtubeId}" : null,
                'notes' => $item->notes,
                'is_active' => (bool) $item->is_active,
                'created_at' => $item->created_at?->toIso8601String(),
                'updated_at' => $item->updated_at?->toIso8601String(),
            ];
        });

        return $this->successResponse($summaries, 'Lesson summaries retrieved successfully');
    }

    /**
     * Create or update a lesson summary (Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|integer|exists:lesson_summaries,id',
            'subject' => 'required|string',
            'key_stage' => 'nullable|string',
            'deck' => 'nullable|string',
            'topic' => 'required|string|max:200',
            'title' => 'nullable|string|max:200',
            'youtube_url' => 'required|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $youtubeId = LessonSummary::extractYoutubeId($validated['youtube_url']);
        if (!$youtubeId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide a valid YouTube video URL or Video ID (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).'
            ], 422);
        }

        $subject = strtolower(trim($validated['subject']));
        $keyStage = !empty($validated['key_stage']) ? strtoupper(trim($validated['key_stage'])) : null;
        $topic = trim($validated['topic']);
        $deck = !empty($validated['deck']) ? trim($validated['deck']) : null;
        $title = !empty($validated['title']) ? trim($validated['title']) : ($topic . ' Lesson Summary');

        if (!empty($validated['id'])) {
            $summary = LessonSummary::findOrFail($validated['id']);
            $summary->update([
                'subject' => $subject,
                'key_stage' => $keyStage,
                'deck' => $deck,
                'topic' => $topic,
                'title' => $title,
                'youtube_url' => trim($validated['youtube_url']),
                'youtube_id' => $youtubeId,
                'notes' => $validated['notes'] ?? null,
            ]);
        } else {
            // Find existing summary for same topic/deck/subject/keystage, or create new
            $summary = LessonSummary::updateOrCreate(
                [
                    'subject' => $subject,
                    'key_stage' => $keyStage,
                    'topic' => $topic,
                ],
                [
                    'deck' => $deck,
                    'title' => $title,
                    'youtube_url' => trim($validated['youtube_url']),
                    'youtube_id' => $youtubeId,
                    'notes' => $validated['notes'] ?? null,
                    'is_active' => true,
                ]
            );
        }

        return $this->successResponse([
            'id' => $summary->id,
            'subject' => $summary->subject,
            'key_stage' => $summary->key_stage,
            'deck' => $summary->deck,
            'topic' => $summary->topic,
            'title' => $summary->title,
            'youtube_url' => $summary->youtube_url,
            'youtube_id' => $summary->youtube_id,
            'embed_url' => "https://www.youtube-nocookie.com/embed/{$summary->youtube_id}",
            'notes' => $summary->notes,
        ], 'Lesson summary saved successfully');
    }

    /**
     * Delete a lesson summary (Admin).
     */
    public function destroy($id): JsonResponse
    {
        $summary = LessonSummary::findOrFail($id);
        $summary->delete();

        return $this->successResponse(null, 'Lesson summary deleted successfully');
    }

    /**
     * Retrieve the lesson summary for the active gameplay level (Public / Player).
     */
    public function getForGameplay(Request $request): JsonResponse
    {
        $deck = $request->query('deck');
        $subject = strtolower((string) $request->query('subject', 'chemistry'));
        $keyStage = strtoupper((string) $request->query('key_stage', ''));
        $topic = $request->query('topic');

        $summary = null;

        // 1. Try matching deck + key_stage
        if ($deck && $keyStage) {
            $summary = LessonSummary::where('deck', $deck)
                ->where('key_stage', $keyStage)
                ->where('is_active', true)
                ->first();
        }

        // 2. Try matching deck alone
        if (!$summary && $deck) {
            $summary = LessonSummary::where('deck', $deck)
                ->where('is_active', true)
                ->first();
        }

        // 3. Try matching topic + subject + key_stage
        if (!$summary && $topic) {
            $summary = LessonSummary::whereRaw('LOWER(topic) = ?', [strtolower(trim($topic))])
                ->where('subject', $subject)
                ->where('is_active', true)
                ->first();
        }

        // 4. Try matching topic alone
        if (!$summary && $topic) {
            $summary = LessonSummary::whereRaw('LOWER(topic) = ?', [strtolower(trim($topic))])
                ->where('is_active', true)
                ->first();
        }

        // 5. Try matching stripped deck alias (e.g. ss1-biology -> biology)
        if (!$summary && $deck) {
            $stripped = preg_replace('/^ss[1-3]-/i', '', $deck);
            if ($stripped && $stripped !== $deck) {
                $summary = LessonSummary::where(function ($q) use ($stripped) {
                    $q->where('deck', $stripped)->orWhereRaw('LOWER(topic) LIKE ?', ["%{$stripped}%"]);
                })->where('is_active', true)->first();
            }
        }

        // 6. Fallback to latest summary for that subject / key stage
        if (!$summary && $subject) {
            $query = LessonSummary::where('subject', $subject)->where('is_active', true);
            if ($keyStage) {
                $query->where('key_stage', $keyStage);
            }
            $summary = $query->first();
        }

        if (!$summary) {
            return $this->successResponse(null, 'No lesson summary found for this lesson');
        }

        $youtubeId = $summary->youtube_id ?: LessonSummary::extractYoutubeId($summary->youtube_url);

        return $this->successResponse([
            'id' => $summary->id,
            'topic' => $summary->topic,
            'title' => $summary->title ?: $summary->topic . ' Lesson Summary',
            'subject' => $summary->subject,
            'key_stage' => $summary->key_stage,
            'youtube_url' => $summary->youtube_url,
            'youtube_id' => $youtubeId,
            'embed_url' => $youtubeId ? "https://www.youtube-nocookie.com/embed/{$youtubeId}?autoplay=1&rel=0" : null,
            'notes' => $summary->notes,
        ], 'Lesson summary loaded successfully');
    }
}
