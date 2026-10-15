<?php

use App\Http\Responses\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') || $e instanceof HttpResponseException) {
                return null;
            }

            return match (true) {
                $e instanceof ValidationException => ApiResponse::error($e->getMessage(), 422, $e->errors()),
                $e instanceof AuthenticationException => ApiResponse::error('Unauthenticated.', 401),
                $e instanceof NotFoundHttpException => ApiResponse::error('Resource not found.', 404),
                $e instanceof HttpExceptionInterface => ApiResponse::error(
                    $e->getMessage() ?: (Response::$statusTexts[$e->getStatusCode()] ?? 'Error.'),
                    $e->getStatusCode(),
                    headers: $e->getHeaders(),
                ),
                default => ApiResponse::error(config('app.debug') ? $e->getMessage() : 'Server error.', 500),
            };
        });
    })->create();
