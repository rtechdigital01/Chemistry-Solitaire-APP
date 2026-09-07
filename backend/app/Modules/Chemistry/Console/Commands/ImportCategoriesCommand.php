<?php

namespace App\Modules\Chemistry\Console\Commands;

use Illuminate\Console\Command;
use App\Modules\Chemistry\Models\Category;
use Illuminate\Support\Facades\File;

class ImportCategoriesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chemistry:import-categories {--file= : The path to the CSV file (relative to base_path)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Chemistry Categories from a CSV file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->option('file') ?? 'Datasets/KS3_Master_Category_Bank.csv';
        $fullPath = storage_path('app/' . $filePath);

        if (!file_exists($fullPath)) {
            $this->error("File not found at path: {$fullPath}");
            return Command::FAILURE;
        }

        $this->info("Importing categories from: {$fullPath}");

        $fileStream = fopen($fullPath, 'r');
        
        // Skip header
        $header = fgetcsv($fileStream);

        $count = 0;
        while (($row = fgetcsv($fileStream)) !== false) {
            // S/N,Category,Difficulty,Card Pool,Icon Type
            if (count($row) < 5) continue;

            $serialNumber = (int) $row[0];
            $name = mb_convert_encoding($row[1], 'UTF-8', 'UTF-8');
            $difficulty = mb_convert_encoding($row[2], 'UTF-8', 'UTF-8');
            
            // Process Card Pool, splitting by comma and trimming
            $cardPoolRaw = mb_convert_encoding($row[3], 'UTF-8', 'UTF-8');
            $cardPool = array_filter(array_map('trim', explode(',', $cardPoolRaw)));
            
            $iconType = mb_convert_encoding($row[4], 'UTF-8', 'UTF-8');

            Category::updateOrCreate(
                ['name' => $name],
                [
                    'serial_number' => $serialNumber,
                    'difficulty' => $difficulty,
                    'card_pool' => $cardPool,
                    'icon_type' => $iconType,
                ]
            );

            $count++;
        }

        fclose($fileStream);

        $this->info("Successfully imported {$count} categories.");
        return Command::SUCCESS;
    }
}
