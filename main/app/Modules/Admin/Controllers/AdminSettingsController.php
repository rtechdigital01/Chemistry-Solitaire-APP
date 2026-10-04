<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Datasets live in the repo root /Datasets folder. The admin can
     * also upload a fresh CSV for any registered dataset name; the
     * upload overwrites the file in place and the next import picks
     * it up.
     */
   public function uploadDataset(Request $request)
        {
            $data = $request->validate([
                'dataset' => 'required|string|exists:game_datasets,dataset_key',
                'file' => 'required|file|mimes:csv,txt|max:10240',
            ]);
        
            $name = $data['dataset'];
        
            $request->file('file')->move(
                dirname($this->datasetPath($name)),
                basename($this->datasetPath($name))
            );
        
            return app(AdminDatasetController::class)->replace($request);
        }
        
  private function datasetPath(string $name): string
        {
            return base_path('../Datasets/' . $name . '.csv');
        }

}
