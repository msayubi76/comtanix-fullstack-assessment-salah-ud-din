<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PublicQuoteRequestController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::post('/public/quote-requests', [PublicQuoteRequestController::class, 'store'])->middleware('throttle:public-quote');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
