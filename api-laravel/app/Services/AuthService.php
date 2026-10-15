<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(Request $request, string $email, string $password): array
    {
        $credentials = ['email' => $email, 'password' => $password];

        // requests from the dashboard get a session cookie, other clients get a token
        if ($request->hasSession()) {
            if (! Auth::guard('web')->attempt($credentials)) {
                $this->failed();
            }

            $request->session()->regenerate();

            return [Auth::guard('web')->user(), null];
        }

        if (! Auth::once($credentials)) {
            $this->failed();
        }

        $user = Auth::user();

        return [$user, $user->createToken('api-token')->plainTextToken];
    }

    public function logout(Request $request): void
    {
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return;
        }

        $request->user()->currentAccessToken()->delete();
    }

    private function failed(): never
    {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }
}
