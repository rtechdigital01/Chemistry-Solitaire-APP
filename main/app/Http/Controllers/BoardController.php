<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\GameAttempt;

class BoardController extends Controller
{
    /**
     * Icon type label → short identifier used by the frontend
     */
    private array $iconTypeMap = [
        'Element'     => 'element',
        'Chemical'    => 'chemical',
        'Physical'    => 'physical',
        'Information' => 'information',
        'Trends'      => 'trends',
        'Uses'        => 'uses',
        'Compounds'   => 'compounds',
        'Isotopes'    => 'isotopes',
        'Production'  => 'production',
        'Occurrence'  => 'occurrence',
    ];

    /**
     * Difficulty gate:
     *   easy   → Easy rows only
     *   medium → Easy + Medium
     *   hard   → Easy + Medium + Hard  (all)
     */
    private array $difficultyGate = [
        'easy'   => ['Easy'],
        'medium' => ['Easy', 'Medium'],
        'hard'   => ['Easy', 'Medium', 'Hard'],
    ];

    /**
     * GET /api/{subject}/board
     * Query params: difficulty, key_stage, deck
     */
    public function getChemistryBoard(Request $request): JsonResponse
    {
        $difficulty = strtolower($request->query('difficulty', 'easy'));

        // Normalise to one of our three tiers
        if (!array_key_exists($difficulty, $this->difficultyGate)) {
            $difficulty = 'easy';
        }

        $allowedDifficulties = $this->difficultyGate[$difficulty];

        $csvPath = base_path('../Datasets/KS3_Master_Category_Bank.csv');
        $allRows = [];

        if (file_exists($csvPath)) {
            $handle = fopen($csvPath, 'r');
            fgetcsv($handle); // skip header row

            $idCounter = 1;
            while (($data = fgetcsv($handle)) !== false) {
                // Columns: S/N, Category, Difficulty, Card Pool, Icon Type
                if (count($data) < 4) {
                    continue;
                }

                $rowDifficulty = ucfirst(strtolower(trim($data[2]))); // normalise: "hard" → "Hard"

                if (!in_array($rowDifficulty, $allowedDifficulties, true)) {
                    continue;
                }

                $categoryName = trim($data[1]);
                $cardPoolRaw  = trim($data[3]);
                $iconTypeRaw  = isset($data[4]) ? trim($data[4]) : 'Element';

                // Split card pool and trim each item
                $cards = array_values(array_filter(
                    array_map('trim', explode(',', $cardPoolRaw)),
                    fn($c) => $c !== ''
                ));

                if (empty($cards) || $categoryName === '') {
                    continue;
                }

                $allRows[] = [
                    'id'         => (string) $idCounter,
                    'name'       => $categoryName,
                    'difficulty' => $rowDifficulty,
                    'icon_type'  => $this->iconTypeMap[$iconTypeRaw] ?? 'element',
                    'cards'      => array_slice($cards, 0, 6), // max 6 cards per category
                ];

                $idCounter++;
            }

            fclose($handle);
        }

        // Fallback when CSV is missing or empty after filtering
        if (empty($allRows)) {
            $allRows = $this->fallbackCategories();
        }

        // Pick 4 random categories from the filtered pool
        shuffle($allRows);
        $selected = array_slice($allRows, 0, 4);

        // Re-assign sequential IDs after shuffle so frontend stays consistent
        foreach ($selected as $i => &$cat) {
            $cat['id'] = (string) ($i + 1);
        }
        unset($cat);

        return response()->json([
            'status' => 'Success',
            'data'   => [
                'difficulty'  => $difficulty,
                'key_stage'   => $request->query('key_stage', 'KS3'),
                'categories'  => $selected,
            ],
        ]);
    }

    /**
     * GET /api/biology/board
     */
    public function getBiologyBoard(Request $request): JsonResponse
    {
        $categories = [
            ['id' => '1', 'name' => 'Cell Structure',  'difficulty' => 'Easy',   'icon_type' => 'element',     'cards' => ['Nucleus', 'Mitochondria', 'Cell Membrane', 'Ribosome']],
            ['id' => '2', 'name' => 'Human Organs',    'difficulty' => 'Easy',   'icon_type' => 'information', 'cards' => ['Heart', 'Lungs', 'Brain', 'Liver']],
            ['id' => '3', 'name' => 'Photosynthesis',  'difficulty' => 'Medium', 'icon_type' => 'chemical',    'cards' => ['Chloroplast', 'Sunlight', 'Water', 'Carbon Dioxide']],
            ['id' => '4', 'name' => 'Genetics',        'difficulty' => 'Hard',   'icon_type' => 'trends',      'cards' => ['DNA', 'Chromosome', 'Gene', 'Allele']],
        ];

        return response()->json(['status' => 'Success', 'data' => ['categories' => $categories]]);
    }

    /**
     * GET /api/physics/board
     */
    public function getPhysicsBoard(Request $request): JsonResponse
    {
        $categories = [
            ['id' => '1', 'name' => 'Forces',       'difficulty' => 'Easy',   'icon_type' => 'physical',    'cards' => ['Gravity', 'Friction', 'Magnetism', 'Tension']],
            ['id' => '2', 'name' => 'Energy Types', 'difficulty' => 'Easy',   'icon_type' => 'information', 'cards' => ['Kinetic', 'Potential', 'Thermal', 'Chemical']],
            ['id' => '3', 'name' => 'Waves',        'difficulty' => 'Medium', 'icon_type' => 'trends',      'cards' => ['Amplitude', 'Frequency', 'Wavelength', 'Speed']],
            ['id' => '4', 'name' => 'Electricity',  'difficulty' => 'Hard',   'icon_type' => 'uses',        'cards' => ['Current', 'Voltage', 'Resistance', 'Power']],
        ];

        return response()->json(['status' => 'Success', 'data' => ['categories' => $categories]]);
    }

    /**
     * POST /api/gameplay/attempt
     */
    public function saveAttempt(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic'              => 'nullable|string',
            'level'              => 'nullable|integer',
            'score'              => 'required|integer',
            'moves'              => 'required|integer',
            'correct_matches'   => 'required|integer',
            'incorrect_matches' => 'required|integer',
            'hints_used'        => 'nullable|integer',
            'time_spent'        => 'required|integer',
            'completed'         => 'nullable|boolean',
        ]);

        $totalAttempts = $validated['correct_matches'] + $validated['incorrect_matches'];
        $accuracy      = $totalAttempts > 0
            ? round(($validated['correct_matches'] / $totalAttempts) * 100)
            : 0;

        $attempt = GameAttempt::create([
            'user_id'    => $request->user()->id,
            'subject'    => 'chemistry',
            'deck'       => $validated['topic'] ?? 'periodic-table-groups',
            'score'      => $validated['score'],
            'moves'      => $validated['moves'],
            'accuracy'   => (int) $accuracy,
            'time_spent' => $validated['time_spent'],
        ]);

        return response()->json([
            'status'  => 'Success',
            'message' => 'Game attempt saved successfully.',
            'data'    => $attempt,
        ]);
    }

    // -----------------------------------------------------------------------

    private function fallbackCategories(): array
    {
        return [
            ['id' => '1', 'name' => 'Group 1 Elements',    'difficulty' => 'Easy', 'icon_type' => 'element',     'cards' => ['Lithium', 'Sodium', 'Potassium', 'Rubidium']],
            ['id' => '2', 'name' => 'Group 7 Elements',    'difficulty' => 'Easy', 'icon_type' => 'element',     'cards' => ['Fluorine', 'Chlorine', 'Bromine', 'Iodine']],
            ['id' => '3', 'name' => 'Group 0 Elements',    'difficulty' => 'Easy', 'icon_type' => 'element',     'cards' => ['Helium', 'Neon', 'Argon', 'Krypton']],
            ['id' => '4', 'name' => 'Physical Properties', 'difficulty' => 'Easy', 'icon_type' => 'physical',    'cards' => ['Colour', 'State', 'Density', 'Melting point']],
        ];
    }
}
