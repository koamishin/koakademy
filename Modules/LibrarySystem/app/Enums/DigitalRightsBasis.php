<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Enums;

enum DigitalRightsBasis: string
{
    case DccpOwned = 'dccp_owned';
    case WrittenPermission = 'written_permission';
    case Licensed = 'licensed';
    case OpenLicense = 'open_license';
    case PublicDomain = 'public_domain';

    public function label(): string
    {
        return match ($this) {
            self::DccpOwned => 'DCCP-owned work',
            self::WrittenPermission => 'Written permission',
            self::Licensed => 'Licensed digital distribution',
            self::OpenLicense => 'Open license',
            self::PublicDomain => 'Public domain',
        };
    }
}
