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

        while (($row = fgetcsv($fileStream)) !== false) {

            // S/N, Category, Difficulty, Card Pool, Icon Type
            if (count($row) < 5) {
                continue;
            }

            $serialNumber = (int) trim($row[0]);
            $name = trim($row[1]);
            $difficulty = trim($row[2]);

            /*
             * Convert comma-separated card pool
             * into an array for Laravel's JSON cast.
             */
            $cardPool = array_values(
                array_filter(
                    array_map(
                        'trim',
                        explode(',', $row[3])
                    )
                )
            );

            $iconType = trim($row[4]);

            Category::updateOrCreate(
                [
                    'deck' => $deck,
                    'key_stage' => $keyStage,
                    'name' => $name,
                ],
                [
                    'serial_number' => $serialNumber,
                    'difficulty' => $difficulty,
                    'card_pool' => $cardPool,
                    'icon_type' => $iconType ?: null,
                ]
            );

            $count++;
        }

        fclose($fileStream);

        $this->info(
            "Successfully imported {$count} categories for {$deck} / {$keyStage}."
        );

        return Command::SUCCESS;
    }
}