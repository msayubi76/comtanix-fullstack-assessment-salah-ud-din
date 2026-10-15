<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // the Docker container seeds on every start, so only seed an empty database
        if (User::exists()) {
            $this->command?->info('Database already seeded, skipping.');

            return;
        }

        $this->call([
            UserSeeder::class,
            QuoteRequestSeeder::class,
        ]);
    }
}
