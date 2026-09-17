<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Chemistry\Models\Category;
use Illuminate\Support\Facades\File;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = database_path('data/KS3_Master_Category_Bank.csv');
        if (!File::exists($csvFile)) {
            return;
        }

        $file = fopen($csvFile, 'r');
        $header = fgetcsv($file); // Read header

        while (($row = fgetcsv($file)) !== false) {
            $data = array_combine($header, $row);
            
            $cards = array_map(function($card) {
                return trim(mb_convert_encoding($card, 'UTF-8', 'UTF-8'));
            }, explode(',', $data['Card Pool'] ?? ''));
            $cards = array_filter($cards);
            
            $name = mb_convert_encoding($data['Category'] ?? 'Unknown', 'UTF-8', 'UTF-8');
            $difficulty = mb_convert_encoding($data['Difficulty'] ?? 'Easy', 'UTF-8', 'UTF-8');
            $iconType = mb_convert_encoding($data['Icon Type'] ?? 'Element', 'UTF-8', 'UTF-8');

            if (count($cards) >= 4) {
                Category::updateOrCreate(
                    [
                        'deck' => 'periodic-table-groups',
                        'key_stage' => 'KS3',
                        'name' => $name,
                    ],
                    [
                        'subject' => 'chemistry',
                        'serial_number' => (int) ($data['S/N'] ?? rand(100, 999)),
                        'difficulty' => $difficulty,
                        'card_pool' => array_values($cards),
                        'icon_type' => $iconType,
                    ]
                );
            }
        }
        fclose($file);
    }
}
