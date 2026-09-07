<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BoardController extends Controller
{
    /**
     * Get Chemistry Board
     */
    public function getChemistryBoard(Request $request): JsonResponse
    {
        // Try to parse the CSV file
        $csvPath = base_path('../Datasets/KS3_Master_Category_Bank.csv');
        $categories = [];

        if (file_exists($csvPath)) {
            $handle = fopen($csvPath, "r");
            $header = fgetcsv($handle); // Skip header

            $idCounter = 1;
            while (($data = fgetcsv($handle)) !== FALSE) {
                // S/N, Category, Difficulty, Card Pool, Icon Type
                if (count($data) >= 4) {
                    $categoryName = $data[1];
                    $cardPoolRaw = $data[3];
                    $cards = array_map('trim', explode(',', $cardPoolRaw));
                    
                    // only take 4 items max for UI purposes, or take all depending on need
                    // taking 3 for matching UI design limits if needed, but lets just take what we have
                    
                    // We only want a few categories to keep the board playable
                    if ($idCounter <= 4) {
                        $categories[] = [
                            'id' => (string) $idCounter,
                            'name' => $categoryName,
                            'cards' => array_slice($cards, 0, 4) // Limit to 4 cards per category for solitaire board
                        ];
                        $idCounter++;
                    }
                }
            }
            fclose($handle);
        } else {
            // Fallback mock data
            $categories = [
                [
                    'id' => '1',
                    'name' => 'Atomic Structure',
                    'cards' => ['Proton', 'Neutron', 'Electron']
                ],
                [
                    'id' => '2',
                    'name' => 'Bonding',
                    'cards' => ['Covalent', 'Ionic', 'Metallic']
                ],
                [
                    'id' => '3',
                    'name' => 'States of Matter',
                    'cards' => ['Solid', 'Liquid', 'Gas']
                ]
            ];
        }

        return response()->json([
            'status' => 'Success',
            'data' => [
                'categories' => $categories
            ]
        ]);
    }

    /**
     * Get Biology Board
     */
    public function getBiologyBoard(Request $request): JsonResponse
    {
        // Placeholder data since Biology dataset isn't provided yet
        $categories = [
            [
                'id' => '1',
                'name' => 'Cell Structure',
                'cards' => ['Nucleus', 'Mitochondria', 'Cell Membrane', 'Ribosome']
            ],
            [
                'id' => '2',
                'name' => 'Human Organs',
                'cards' => ['Heart', 'Lungs', 'Brain', 'Liver']
            ],
            [
                'id' => '3',
                'name' => 'Photosynthesis',
                'cards' => ['Chloroplast', 'Sunlight', 'Water', 'Carbon Dioxide']
            ]
        ];

        return response()->json([
            'status' => 'Success',
            'data' => [
                'categories' => $categories
            ]
        ]);
    }

    /**
     * Get Physics Board
     */
    public function getPhysicsBoard(Request $request): JsonResponse
    {
        // Placeholder data since Physics dataset isn't provided yet
        $categories = [
            [
                'id' => '1',
                'name' => 'Forces',
                'cards' => ['Gravity', 'Friction', 'Magnetism', 'Tension']
            ],
            [
                'id' => '2',
                'name' => 'Energy Types',
                'cards' => ['Kinetic', 'Potential', 'Thermal', 'Chemical']
            ],
            [
                'id' => '3',
                'name' => 'Waves',
                'cards' => ['Amplitude', 'Frequency', 'Wavelength', 'Speed']
            ]
        ];

        return response()->json([
            'status' => 'Success',
            'data' => [
                'categories' => $categories
            ]
        ]);
    }
}
