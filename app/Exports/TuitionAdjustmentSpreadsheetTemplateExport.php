<?php

declare(strict_types=1);

namespace App\Exports;

use App\Exports\Sheets\TuitionAdjustmentSpreadsheetInstructionsSheet;
use App\Exports\Sheets\TuitionAdjustmentSpreadsheetTemplateSheet;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

final class TuitionAdjustmentSpreadsheetTemplateExport implements Export, WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new TuitionAdjustmentSpreadsheetInstructionsSheet,
            new TuitionAdjustmentSpreadsheetTemplateSheet,
        ];
    }
}
