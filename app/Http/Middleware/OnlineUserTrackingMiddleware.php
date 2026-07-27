<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\OnlineUserPresenceService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class OnlineUserTrackingMiddleware
{
    public function __construct(private OnlineUserPresenceService $onlineUserPresence) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $userId = $request->user()?->id;

        if ($userId !== null) {
            $this->onlineUserPresence->recordActivity((int) $userId);
        }

        return $response;
    }
}
