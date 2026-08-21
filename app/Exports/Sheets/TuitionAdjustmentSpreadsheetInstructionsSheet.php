<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

final class TuitionAdjustmentSpreadsheetInstructionsSheet implements FromArray, WithColumnWidths, WithStyles, WithTitle
{
    public function array(): array
    {
        return [
            ['TUITION ADJUSTMENT WORKBOOK — START HERE'],
            ['Use this simple guide before you type anything. Uploading the file only prepares it for review; tuition changes only after a finance admin confirms them.'],
            [null],
            ['STEP 1 — On the website, choose the correct School Year and Semester.'],
            ['Then open the “Tuition Adjustments” tab at the bottom of this workbook.'],
            [null],
            ['STEP 2 — Fill in only the YELLOW columns first. They are required for every student.'],
            ['Student Number', 'Type the student number exactly as it appears in the system. Do not use a name or email address.'],
            ['Reason', 'Use a short explanation, for example: “Approved scholarship correction”. This becomes part of the audit record.'],
            ['New Total Fees', 'Type the final tuition amount after the change. Use plain numbers only, for example 15000.'],
            [null],
            ['STEP 3 — BLUE and GRAY columns are optional. Leave them blank unless you need to change them.'],
            ['Opening Paid + fee components', 'Leave blank to keep the student’s current amount. Never enter less than the cashier’s verified payment.'],
            ['Discount % + Required Downpayment', 'Use plain numbers: 12.5 means 12.5%. Leave blank to keep the current setting.'],
            ['Prelim + Midterm + Finals', 'Leave all three blank to use the school payment schedule. If you enter one, you must enter all three and their total must equal the balance.'],
            [null],
            ['BEFORE YOU UPLOAD — CHECK THESE ITEMS'],
            ['✓ One student per row  •  ✓ Student Number only  •  ✓ No duplicate student numbers  •  ✓ Do not rename or move the blue headers'],
            [null],
            ['WORKED EXAMPLE — LOOK ONLY. ENTER YOUR REAL STUDENTS ON THE “TUITION ADJUSTMENTS” TAB.'],
            ['1. Student no.', '2. Reason', '3. New total fees', 'Optional fields'],
            ['2026-0001', 'Approved scholarship correction', 15000, 'Leave every optional field blank when only the total fee changes.'],
            ['Important: use numbers without ₱ signs or commas. If a row has an error, correct it in a new workbook and upload again.'],
        ];
    }

    public function title(): string
    {
        return 'Instructions';
    }

    public function columnWidths(): array
    {
        return ['A' => 24, 'B' => 44, 'C' => 22, 'D' => 48, 'E' => 14, 'F' => 14, 'G' => 16, 'H' => 13, 'I' => 21, 'J' => 14, 'K' => 14, 'L' => 14];
    }

    public function styles(Worksheet $sheet): array
    {
        foreach ([1, 2, 4, 5, 7, 12, 17, 18, 20, 24] as $row) {
            $sheet->mergeCells("A{$row}:L{$row}");
        }

        $sheet->setShowGridlines(false);
        $sheet->getSheetView()->setZoomScale(110);
        $sheet->getStyle('A1:L24')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(34);
        $sheet->getRowDimension(2)->setRowHeight(34);
        foreach ([4, 5, 7, 12, 17, 18, 20, 24] as $row) {
            $sheet->getRowDimension($row)->setRowHeight(28);
        }

        $sheet->getStyle('A1:L1')->getFont()->setBold(true)->setSize(18)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle('A1:L1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E3A8A');
        $sheet->getStyle('A2:L2')->getFont()->setSize(12)->getColor()->setRGB('1E293B');
        $sheet->getStyle('A2:L2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('DBEAFE');

        foreach ([4, 7, 12, 17, 20] as $row) {
            $sheet->getStyle("A{$row}:L{$row}")->getFont()->setBold(true)->setSize(12)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('2563EB');
        }
        $sheet->getStyle('A17:L17')->getFill()->getStartColor()->setRGB('B45309');
        $sheet->getStyle('A18:L18')->getFont()->setBold(true);
        $sheet->getStyle('A18:L18')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FEF3C7');
        $sheet->getStyle('A8:A10')->getFont()->setBold(true);
        $sheet->getStyle('A8:A10')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FEF3C7');
        $sheet->getStyle('A13:A15')->getFont()->setBold(true);
        $sheet->getStyle('A13:A15')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('DBEAFE');

        $sheet->getStyle('A21:D21')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle('A21:D21')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('475569');
        $sheet->getStyle('A21:D22')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('94A3B8');
        $sheet->getStyle('A22:C22')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER_00);
        $sheet->getStyle('A22:D22')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8FAFC');
        $sheet->getStyle('A24:L24')->getFont()->setItalic(true)->getColor()->setRGB('991B1B');

        return [];
    }
}
