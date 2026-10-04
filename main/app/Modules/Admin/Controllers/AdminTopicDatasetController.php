<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admin\Models\GameDataset;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTopicDatasetController extends Controller
{
    public function create(Request $request)
    {
        $data = $request->validate([
            'country' => 'required|string|in:Nigeria,UK',
            'key_stage' => 'required|string|in:SS1,SS2,SS3,KS3,KS4,KS5',
            'subject' => 'required|string|in:biology,chemistry,physics,science',
            'topic' => 'required|string|max:150',
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $country = $data['country'];
        $keyStage = strtoupper($data['key_stage']);
        $subject = strtolower($data['subject']);
        $topic = trim($data['topic']);

        $topicSlug = Str::slug($topic);

        $deck =
            strtolower($keyStage)
            . '-'
            . $subject
            . '-'
            . $topicSlug;

        $topicKey = preg_replace(
            '/[^A-Za-z0-9]+/',
            '_',
            $topic
        );

        $datasetKey =
            $keyStage
            . '_'
            . ucfirst($subject)
            . '_'
            . trim($topicKey, '_');

        $label =
            $topic
            . ' ('
            . $country
            . ' '
            . $keyStage
            . ' '
            . ucfirst($subject)
            . ')';

        GameDataset::updateOrCreate(
            [
                'country' => $country,
                'key_stage' => $keyStage,
                'subject' => $subject,
                'topic' => $topic,
            ],
            [
                'dataset_key' => $datasetKey,
                'deck' => $deck,
                'label' => $label,
                'is_active' => true,
            ]
        );

        $path = base_path('../Datasets/' . $datasetKey . '.csv');

        $request->file('file')->move(
            dirname($path),
            basename($path)
        );

        $request->merge([
            'dataset' => $datasetKey,
        ]);

        return app(AdminDatasetController::class)->replace($request);
    }
}