<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admin\Models\GameDataset;
use App\Modules\Chemistry\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDatasetController extends Controller
{
    use ApiResponse;

    /**
     * Deck registry: maps a dataset name to the deck / key stage /
     * subject it belongs to. Every student-visible deck must exist
     * here so the loader and importer agree on identities.
     */
    public const DATASETS = [
        // United Kingdom
        'KS3_Science_Foundation' => [
            'deck' => 'science-foundation',
            'key_stage' => 'KS3',
            'subject' => 'science',
            'label' => 'Science Foundation (UK KS3)',
            'country' => 'UK',
        ],
        'KS3_Master_Category_Bank' => [
            'deck' => 'periodic-table-groups',
            'key_stage' => 'KS3',
            'subject' => 'chemistry',
            'label' => 'Periodic Table & Groups (UK KS3 Chemistry)',
            'country' => 'UK',
        ],

        // Nigeria
        'SS1_Biology' => [
            'deck' => 'ss1-biology',
            'key_stage' => 'SS1',
            'subject' => 'biology',
            'label' => 'SS1 Biology (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS1_Chemistry' => [
            'deck' => 'ss1-chemistry',
            'key_stage' => 'SS1',
            'subject' => 'chemistry',
            'label' => 'SS1 Chemistry (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS1_Physics' => [
            'deck' => 'ss1-physics',
            'key_stage' => 'SS1',
            'subject' => 'physics',
            'label' => 'SS1 Physics (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS2_Biology' => [
            'deck' => 'ss2-biology',
            'key_stage' => 'SS2',
            'subject' => 'biology',
            'label' => 'SS2 Biology (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS2_Chemistry' => [
            'deck' => 'ss2-chemistry',
            'key_stage' => 'SS2',
            'subject' => 'chemistry',
            'label' => 'SS2 Chemistry (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS2_Physics' => [
            'deck' => 'ss2-physics',
            'key_stage' => 'SS2',
            'subject' => 'physics',
            'label' => 'SS2 Physics (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS3_Biology' => [
            'deck' => 'ss3-biology',
            'key_stage' => 'SS3',
            'subject' => 'biology',
            'label' => 'SS3 Biology (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS3_Chemistry' => [
            'deck' => 'ss3-chemistry',
            'key_stage' => 'SS3',
            'subject' => 'chemistry',
            'label' => 'SS3 Chemistry (Nigeria)',
            'country' => 'Nigeria',
        ],
        'SS3_Physics' => [
            'deck' => 'ss3-physics',
            'key_stage' => 'SS3',
            'subject' => 'physics',
            'label' => 'SS3 Physics (Nigeria)',
            'country' => 'Nigeria',
        ],
    ];

    /**
     * Dataset name → {key_stage, subject} → deck. A student's decks
     * are always resolved through their own key stage, so a user can
     * only ever see datasets belonging to their grade/country.
     */
    public static function deckFor(string $dataset): ?string
    {
        return self::DATASETS[$dataset]['deck'] ?? null;
    }

    /**
     * List every dataset: its identity, how many categories are
     * currently loaded for it, and how many rows the source CSV has.
     */
    public function index(): JsonResponse
        {
            $datasets = GameDataset::query()
                ->where('is_active', true)
                ->orderBy('country')
                ->orderBy('key_stage')
                ->orderBy('subject')
                ->orderBy('topic')
                ->get()
                ->map(function ($dataset) {
        
                    $csvPath = $this->datasetPath($dataset->dataset_key);
        
                    $loaded = Category::query()
                        ->where('deck', $dataset->deck)
                        ->where('key_stage', $dataset->key_stage)
                        ->where('subject', $dataset->subject)
                        ->count();
        
                    $sourceRows = 0;
        
                    if (is_file($csvPath)) {
                        $sourceRows = max(
                            0,
                            count(
                                file(
                                    $csvPath,
                                    FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
                                )
                            ) - 1
                        );
                    }
        
                    return [
                        'dataset' => $dataset->dataset_key,
                        'deck' => $dataset->deck,
                        'key_stage' => $dataset->key_stage,
                        'subject' => $dataset->subject,
                        'topic' => $dataset->topic,
                        'label' => $dataset->label,
                        'country' => $dataset->country,
                        'loaded' => $loaded,
                        'source_rows' => $sourceRows,
                        'available' => is_file($csvPath),
                    ];
                });
        
            return $this->successResponse(
                $datasets,
                'Datasets loaded successfully'
            );
        }

    /**
     * Import (or re-import) one dataset from its CSV. Re-importing is
     * idempotent: rows are matched on deck + key_stage + serial_number
     * and updated in place, so changing the dataset content for a deck
     * just refreshes it — students always see the current version.
     */
    public function import(Request $request): JsonResponse
    {
       $data = $request->validate([
    'dataset' => 'required|string|exists:game_datasets,dataset_key',
        ]);
        
        $name = $data['dataset'];
        
        $dataset = GameDataset::where('dataset_key', $name)
            ->where('is_active', true)
            ->firstOrFail();
        
        $meta = [
            'deck' => $dataset->deck,
            'key_stage' => $dataset->key_stage,
            'subject' => $dataset->subject,
            'label' => $dataset->label,
            'country' => $dataset->country,
            'topic' => $dataset->topic,
        ];
        
        $csvPath = $this->datasetPath($name);

        if (!is_file($csvPath)) {
            return $this->errorResponse(
                "Dataset file {$name}.csv is missing on the server.",
                404
            );
        }

        $handle = fopen($csvPath, 'r');

        // Detect encoding: some datasets are Latin-1 / Windows-1252.
        $raw = fread($handle, 2048);
        $encoding = mb_check_encoding($raw, 'UTF-8') ? null : 'Windows-1252';
        rewind($handle);

        // Skip CSV header (or any leading blank lines).
        do {
            $header = fgetcsv($handle);
        } while ($header !== false && count($header) < 2);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 4 || trim($row[0] ?? '') === '') {
                $skipped++;
                continue;
            }
            // Fully-empty rows are not imported; just ignored quietly.
            if (trim(implode('', $row)) === '') {
                continue;
            }

            // S/N, Category, Difficulty, Card Pool, Icon Type, Hint
            $serialNumber = (int) trim($row[0]);
            $name = trim($this->toUtf8($row[1], $encoding));
            $difficulty = $this->normalizeDifficulty($row[2]);
            $cardPoolRaw = $row[3];
            $iconType = $row[4] ?? '';
            $hint = isset($row[5]) ? trim($this->toUtf8($row[5], $encoding)) : '';

            $cardPool = array_values(array_filter(
                array_map(fn ($card) => trim($this->toUtf8($card, $encoding)), explode(',', $cardPoolRaw)),
                fn ($card) => $card !== ''
            ));

            $iconType = strtolower(trim($this->toUtf8($iconType, $encoding)));

            if ($name === '' || count($cardPool) < 3) {
                $skipped++;
                continue;
            }

            Category::updateOrCreate(
                [
                    'deck' => $meta['deck'],
                    'key_stage' => $meta['key_stage'],
                    'subject' => $meta['subject'],
                    'serial_number' => $serialNumber,
                ],
                [
                    'name' => $name,
                    'difficulty' => $difficulty,
                    'card_pool' => $cardPool,
                    'icon_type' => $iconType ?: null,
                    'hint' => $hint ?: null,
                ]
            );

            $imported++;
        }

        fclose($handle);

        return $this->successResponse(
            [
                'dataset' => $name,
                'deck' => $meta['deck'],
                'key_stage' => $meta['key_stage'],
                'imported' => $imported,
                'skipped' => $skipped,
            ],
            "Imported {$imported} categories for {$meta['label']}"
        );
    }

    /**
     * Replace a deck's categories wholesale: delete everything loaded
     * for the deck and import the current CSV from scratch. Use when
     * the source serial numbers were renumbered.
     */
    public function replace(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dataset' => 'required|string|exists:game_datasets,dataset_key',
        ]);
        
        $dataset = GameDataset::where('dataset_key', $data['dataset'])
            ->where('is_active', true)
            ->firstOrFail();
        
        $meta = [
            'deck' => $dataset->deck,
            'key_stage' => $dataset->key_stage,
            'subject' => $dataset->subject,
        ];

        Category::query()
            ->where('deck', $meta['deck'])
            ->where('key_stage', $meta['key_stage'])
            ->delete();

        return $this->import($request);
    }

    /**
     * Delete every category belonging to one dataset.
     */
public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dataset' => 'required|string|exists:game_datasets,dataset_key',
        ]);
    
        $dataset = GameDataset::where('dataset_key', $data['dataset'])
            ->where('is_active', true)
            ->firstOrFail();
    
        $deleted = Category::query()
            ->where('deck', $dataset->deck)
            ->where('key_stage', $dataset->key_stage)
            ->where('subject', $dataset->subject)
            ->delete();
    
        $csvPath = $this->datasetPath($dataset->dataset_key);
    
        if (is_file($csvPath)) {
            unlink($csvPath);
        }
    
        $label = $dataset->label;
    
        $dataset->delete();
    
        return $this->successResponse(
            [
                'dataset' => $data['dataset'],
                'deleted' => $deleted,
            ],
            "Deleted {$deleted} categories for {$label}"
        );
    }

private function datasetPath(string $name): string
{
    return base_path('../Datasets/' . $name . '.csv');
}

    private function toUtf8(string $value, ?string $encoding): string
    {
        // Per-field fallback: encodings are detected for the first 2 KB
        // of the file, but mixed-encoding CSVs still slip bytes through.
        if (mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        return mb_convert_encoding(
            $value,
            'UTF-8',
            $encoding ?? 'Windows-1252'
        );
    }

    private function normalizeDifficulty(string $raw): string
    {
        $value = strtolower(trim($raw));

        return match ($value) {
            'easy', 'medium', 'hard' => ucfirst($value),
            default => ucfirst($value) ?: 'Easy',
        };
    }
}
