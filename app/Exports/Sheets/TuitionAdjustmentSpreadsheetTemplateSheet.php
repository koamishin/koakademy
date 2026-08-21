<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Conditional;
use PhpOffice\PhpSpreadsheet\Style\Fill;

final class TuitionAdjustmentSpreadsheetTemplateSheet implements FromArray, WithColumnWidths, WithEvents, WithTitle
{
    /** @var list<string> */
    public const HEADINGS = [
        'Student Number', 'Reason', 'New Total Fees', 'Opening Paid', 'Lecture', 'Laboratory', 'Miscellaneous',
        'Discount %', 'Required Downpayment', 'Prelim', 'Midterm', 'Finals',
    ];

    public function array(): array
    {
        return [self::HEADINGS, ...array_fill(0, 250, array_fill(0, count(self::HEADINGS), null))];
    }

    public function title(): string
    {
        return 'Tuition Adjustments';
    }

    public function columnWidths(): array
    {
        return ['A' => 18, 'B' => 42, 'C' => 18, 'D' => 16, 'E' => 14, 'F' => 14, 'G' => 16, 'H' => 13, 'I' => 21, 'J' => 14, 'K' => 14, 'L' => 14];
    }

    public function registerEvents(): array
    {
        return [AfterSheet::class => function (AfterSheet $event): void {
            $sheet = $event->sheet->getDelegate();
            $sheet->freezePane('A2');
            $sheet->setAutoFilter('A1:L251');
            $sheet->setShowGridlines(false);
            $sheet->getSheetView()->setZoomScale(110);
            $sheet->setSelectedCell('A2');
            $sheet->getTabColor()->setRGB('2563EB');
            $sheet->getStyle('A1:L1')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle('A1:C1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('B45309');
            $sheet->getStyle('D1:I1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('2563EB');
            $sheet->getStyle('J1:L1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('475569');
            $sheet->getStyle('A1:L251')->getAlignment()->setVertical('center');
            $sheet->getStyle('A1:L1')->getAlignment()->setWrapText(true);
            $sheet->getStyle('B2:B251')->getAlignment()->setWrapText(true);
            $sheet->getStyle('A2:C251')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FFFBEB');
            $sheet->getStyle('D2:I251')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('EFF6FF');
            $sheet->getStyle('J2:L251')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8FAFC');
            $sheet->getStyle('A1:L251')->getBorders()->getBottom()->setBorderStyle(Border::BORDER_HAIR)->getColor()->setRGB('CBD5E1');
            $sheet->getStyle('C2:G251')->getNumberFormat()->setFormatCode('₱#,##0.00');
            $sheet->getStyle('I2:L251')->getNumberFormat()->setFormatCode('₱#,##0.00');
            $sheet->getStyle('H2:H251')->getNumberFormat()->setFormatCode('0.00"%"');
            $sheet->getRowDimension(1)->setRowHeight(38);
            for ($row = 2; $row <= 251; $row++) {
                $sheet->getRowDimension($row)->setRowHeight(26);
            }

            $notes = [
                'A1' => 'REQUIRED. Type the Student Number exactly as it appears in the system. Do not use a student name or email address.',
                'B1' => 'REQUIRED. Explain why this tuition needs to change. This reason is saved in the audit history.',
                'C1' => 'REQUIRED. Type the final total tuition after the adjustment. Use plain numbers, for example 15000.',
                'D1' => 'OPTIONAL. Leave blank to keep the current opening paid amount. It cannot be lower than verified cashier payments.',
                'E1' => 'OPTIONAL. Leave blank to keep the current lecture amount.',
                'F1' => 'OPTIONAL. Leave blank to keep the current laboratory amount.',
                'G1' => 'OPTIONAL. Leave blank to keep the current miscellaneous amount.',
                'H1' => 'OPTIONAL. Type a number from 0 to 100. For example, 12.5 means 12.5%. Leave blank to keep the current discount.',
                'I1' => 'OPTIONAL. Leave blank to keep the current required downpayment.',
                'J1' => 'OPTIONAL. Leave all three payment schedule columns blank to use the school schedule.',
                'K1' => 'OPTIONAL. If you type any schedule amount, type Prelim, Midterm, and Finals. Their total must equal the balance.',
                'L1' => 'OPTIONAL. If you type any schedule amount, type Prelim, Midterm, and Finals. Their total must equal the balance.',
            ];
            foreach ($notes as $cell => $note) {
                $comment = $sheet->getComment($cell);
                $comment->setAuthor('KoAkademy Finance');
                $comment->getText()->createTextRun($note);
            }

            $incompleteRow = new Conditional;
            $incompleteRow->setConditionType(Conditional::CONDITION_EXPRESSION);
            $incompleteRow->addCondition('=AND(COUNTA($A2:$L2)>0,OR($A2="",$B2="",$C2=""))');
            $incompleteRow->getStyle()->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FEE2E2');
            $sheet->getStyle('A2:L251')->setConditionalStyles([$incompleteRow]);

            foreach (['C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L'] as $column) {
                $validation = new DataValidation;
                $validation->setType(DataValidation::TYPE_DECIMAL);
                $validation->setOperator(DataValidation::OPERATOR_GREATERTHANOREQUAL);
                $validation->setFormula1('0');
                $validation->setAllowBlank(true);
                $validation->setShowErrorMessage(true);
                $validation->setErrorTitle('Invalid amount');
                $validation->setError('Enter a non-negative number.');
                $sheet->setDataValidation("{$column}2:{$column}251", $validation);
            }

            $discount = new DataValidation;
            $discount->setType(DataValidation::TYPE_DECIMAL);
            $discount->setOperator(DataValidation::OPERATOR_BETWEEN);
            $discount->setFormula1('0');
            $discount->setFormula2('100');
            $discount->setAllowBlank(true);
            $discount->setShowErrorMessage(true);
            $discount->setErrorTitle('Invalid discount');
            $discount->setError('Enter a percentage from 0 to 100.');
            $sheet->setDataValidation('H2:H251', $discount);
        }];
    }
}
