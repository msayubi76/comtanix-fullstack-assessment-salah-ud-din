<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@comtanix.test',
        ]);

        User::factory()->create([
            'name' => 'Staff One',
            'email' => 'staff1@comtanix.test',
        ]);

        User::factory()->create([
            'name' => 'Staff Two',
            'email' => 'staff2@comtanix.test',
        ]);
    }
}
