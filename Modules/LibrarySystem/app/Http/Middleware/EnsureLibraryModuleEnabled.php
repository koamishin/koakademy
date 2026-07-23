<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Middleware;

use App\Services\GeneralSettingsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureLibraryModuleEnabled
{
    public function __construct(
        private readonly GeneralSettingsService $settings,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            (bool) $this->settings->getGlobalSetting('library_module_enabled', false),
            403,
            'The Digital Library is currently unavailable.'
        );

        return $next($request);
    }
}
