<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class FrontendSyncCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'frontend:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Syncs the frontend templates from the root directory into the backend public directory and injects the API script.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $rootPath = storage_path('app/frontend-templates/');
        $publicPath = public_path();

        if (!File::exists($rootPath . 'index.html')) {
            $this->error("Cannot find the internal frontend templates directory (expected at {$rootPath}).");
            return Command::FAILURE;
        }

        $this->info("Starting frontend sync...");

        // 1. Copy Asset Directories
        $directoriesToCopy = ['css', 'js', 'images', 'components'];
        foreach ($directoriesToCopy as $dir) {
            $sourceDir = $rootPath . $dir;
            $destDir = $publicPath . '/' . $dir;

            if (File::exists($sourceDir)) {
                File::copyDirectory($sourceDir, $destDir);
                $this->info("Copied directory: {$dir}");
            }
        }

        // 2. Process and Copy HTML files
        $htmlFiles = File::glob($rootPath . '*.html');
        foreach ($htmlFiles as $htmlFile) {
            $fileName = basename($htmlFile);
            $content = File::get($htmlFile);

            // Inject the API script right before </body>
            $injection = "<script src=\"./js/api.js\"></script>\n</body>";
            
            // Only inject if it's not already there to avoid duplicates if run multiple times
            if (strpos($content, '<script src="./js/api.js"></script>') === false) {
                $content = str_ireplace('</body>', $injection, $content);
            }

            File::put($publicPath . '/' . $fileName, $content);
            $this->info("Processed and copied HTML file: {$fileName}");
        }

        // 3. Copy our custom api.js from resources to public
        $apiScriptSource = resource_path('js/api.js');
        $apiScriptDest = $publicPath . '/js/api.js';

        if (File::exists($apiScriptSource)) {
            // Ensure the public/js directory exists
            File::ensureDirectoryExists($publicPath . '/js');
            File::copy($apiScriptSource, $apiScriptDest);
            $this->info("Copied custom API script to public/js/api.js");
        } else {
            $this->warn("No custom api.js found at {$apiScriptSource} to copy.");
        }

        $this->info("Frontend sync completed successfully! Your cloned frontend is now available via the Laravel server.");
        
        return Command::SUCCESS;
    }
}
