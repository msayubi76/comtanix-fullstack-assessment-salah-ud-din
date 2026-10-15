<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserService
{
    public function list(): Collection
    {
        return User::orderBy('name')->get();
    }
}
