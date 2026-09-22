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

            $cards = array_map(function ($card) {
                return trim(mb_convert_encoding($card, 'UTF-8', 'UTF-8'));
            }, explode(',', $data['Card Pool'] ?? ''));
            $cards = array_values(array_filter($cards, fn ($c) => $c !== ''));

            $name = trim(mb_convert_encoding($data['Category'] ?? '', 'UTF-8', 'UTF-8'));
            $difficulty = $this->normalizeDifficulty($data['Difficulty'] ?? 'Easy');
            $iconType = strtolower(trim(mb_convert_encoding($data['Icon Type'] ?? 'Element', 'UTF-8', 'UTF-8')));
            $serialNumber = (int) ($data['S/N'] ?? 0);

            if ($name === '' || count($cards) < 3) {
                continue;
            }

            /*
             * The dataset has duplicate Category names (e.g. "Hydrogen"
             * appears three times under different difficulties). The row's
             * serial number is the stable identity for a category
             * definition — never the display name — so each source row
             * always becomes its own category.
             */
            Category::updateOrCreate(
                [
                    'deck' => 'periodic-table-groups',
                    'key_stage' => 'KS3',
                    'serial_number' => $serialNumber,
                ],
                [
                    'subject' => 'chemistry',
                    'name' => $name,
                    'difficulty' => $difficulty,
                    'card_pool' => $cards,
                    'icon_type' => $iconType,
                ]
            );
        }
        fclose($file);
    }

    /**
     * Difficulty belongs to the category definition, not individual cards.
     * The source CSV mixes casing (e.g. "Hard" and "hard") so it must be
     * normalized rather than trusted verbatim.
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
