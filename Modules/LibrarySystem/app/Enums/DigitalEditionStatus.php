<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Enums;

enum DigitalEditionStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}
