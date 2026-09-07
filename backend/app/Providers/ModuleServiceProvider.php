<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * The modules that should be loaded.
     */
    protected array $modules = [
        'Auth',
        'Chemistry',
        'Gameplay',
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        // Register any module-specific bindings here if needed
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        foreach ($this->modules as $module) {
            $this->registerModule($module);
        }
    }

    /**
     * Register a single module's routes, views, migrations, etc.
     */
    protected function registerModule(string $moduleName): void
    {
        $basePath = app_path("Modules/{$moduleName}");

        // 1. Load API Routes
        $apiRoutesPath = "{$basePath}/Routes/api.php";
        if (file_exists($apiRoutesPath)) {
            Route::prefix('api')
                ->middleware('api')
                ->group($apiRoutesPath);
        }

        // 2. Load Web Routes (if applicable)
        $webRoutesPath = "{$basePath}/Routes/web.php";
        if (file_exists($webRoutesPath)) {
            Route::middleware('web')
                ->group($webRoutesPath);
        }

        // 3. Load Migrations
        $migrationsPath = "{$basePath}/Database/Migrations";
        if (is_dir($migrationsPath)) {
            $this->loadMigrationsFrom($migrationsPath);
        }

        // 4. Register Console Commands
        if ($this->app->runningInConsole()) {
            $commandsPath = "{$basePath}/Console/Commands";
            if (is_dir($commandsPath)) {
                $commandFiles = glob("{$commandsPath}/*.php");
                $commands = [];
                foreach ($commandFiles as $file) {
                    $class = "App\\Modules\\{$moduleName}\\Console\\Commands\\" . basename($file, '.php');
                    if (class_exists($class)) {
                        $commands[] = $class;
                    }
                }
                if (!empty($commands)) {
                    $this->commands($commands);
                }
            }
        }
    }
}
