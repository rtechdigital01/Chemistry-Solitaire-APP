<?php

namespace App\Modules\Chemistry\Console\Commands;

use Illuminate\Console\Command;
use App\Modules\Chemistry\Models\Category;

class ImportCategoriesCommand extends Command
{
    protected $signature = 'chemistry:import-categories
        {--file=KS3_Atomic_Structure_Isotopes.csv : CSV file inside storage/app}
        {--deck=atomic-structure-isotopes : Deck identifier}
        {--key-stage=KS3 : Key Stage}';

    protected $description =
        'Import Chemistry categories from a CSV dataset';

    public function handle()
    {
        $filePath = $this->option('file');
        $deck = $this->option('deck');
        $keyStage = strtoupper($this->option('key-stage'));

        $fullPath = storage_path('app/' . $filePath);

        if (!file_exists($fullPath)) {
            $this->error(
                "File not found at path: {$fullPath}"
            );

            return Command::FAILURE;
        }

        $this->info(
            "Importing {$deck} / {$keyStage} from {$fullPath}"
        );

        $fileStream = fopen($fullPath, 'r');

        // Skip CSV header
        fgetcsv($fileStream);

        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($fileStream)) !== false) {

            // S/N, Category, Difficulty, Card Pool, Icon Type
            if (count($row) < 5) {
                continue;
            }

            $serialNumber = (int) trim($row[0]);
            $name = trim($row[1]);
            $difficulty = $this->normalizeDifficulty($row[2]);

            /*
             * Convert comma-separated card pool
             * into an array for Laravel's JSON cast.
             * Every value belongs exclusively to this category row;
             * trimming happens after splitting the already-parsed CSV field.
             */
            $cardPool = array_values(
                array_filter(
                    array_map(
                        'trim',
                        explode(',', $row[3])
                    ),
                    fn ($card) => $card !== ''
                )
            );

            $iconType = strtolower(trim($row[4]));

            if ($name === '' || count($cardPool) < 3) {
                $skipped++;
                continue;
            }

            /*
             * The dataset contains duplicate Category names (e.g. "Hydrogen"
             * appears under three different difficulty rows). The source
             * row's serial number — not the display name — is the stable
             * identity for a category definition, so every row becomes its
             * own category even when the name collides.
             */
            Category::updateOrCreate(
                [
                    'deck' => $deck,
                    'key_stage' => $keyStage,
                    'serial_number' => $serialNumber,
                ],
                [
                    'name' => $name,
                    'difficulty' => $difficulty,
                    'card_pool' => $cardPool,
                    'icon_type' => $iconType ?: null,
                ]
            );

            $count++;
        }

        fclose($fileStream);

        if ($skipped > 0) {
            $this->warn("Skipped {$skipped} row(s) missing a name or with fewer than 3 pool cards.");
        }

        $this->info(
            "Successfully imported {$count} categories for {$deck} / {$keyStage}."
        );

        return Command::SUCCESS;
    }

    /**
     * Difficulty belongs to the category definition, not to individual
     * cards. The source CSV mixes casing (e.g. "Hard" and "hard"), so it
     * must be normalized here rather than trusted verbatim — otherwise
     * difficulty-based filtering silently drops rows.
     */
    private function normalizeDifficulty(string $raw): string
    {
        $value = strtolower(trim($raw));

        return match ($value) {
            'easy', 'medium', 'hard' => ucfirst($value),
            default => ucfirst($value) ?: 'Easy',
        };
    }
}