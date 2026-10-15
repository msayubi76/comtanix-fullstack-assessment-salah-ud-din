<?php

namespace Database\Seeders;

use App\Enums\QuoteStatus;
use App\Enums\UserRole;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuoteRequestSeeder extends Seeder
{
    public function run(): void
    {
        $staffIds = User::where('role', UserRole::Staff)->pluck('id');

        QuoteRequest::factory()
            ->count(200)
            ->state(function () use ($staffIds) {
                $status = fake()->randomElement(QuoteStatus::cases());
                return [
                    'status' => $status,
                    'assigned_to' => $status === QuoteStatus::New ? null : $staffIds->random(),
                ];
            })
            ->create();
    }
}
