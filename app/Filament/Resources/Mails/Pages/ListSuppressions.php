<?php

declare(strict_types=1);

namespace App\Filament\Resources\Mails\Pages;

use App\Filament\Resources\Mails\SuppressionResource;
use Backstage\Mails\Resources\SuppressionResource\Pages\ListSuppressions as BaseListSuppressions;
use Override;

final class ListSuppressions extends BaseListSuppressions
{
    #[Override]
    protected static string $resource = SuppressionResource::class;
}
