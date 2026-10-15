<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Http\Responses\ApiResponse;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        [$user, $token] = $this->authService->login($request->validated('email'), $request->validated('password'));

        return ApiResponse::success('Login successful.', [
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success('Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success('Authenticated user.', [
            'user' => new UserResource($request->user()),
        ]);
    }
}
