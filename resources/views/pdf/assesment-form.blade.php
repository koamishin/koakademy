<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Assessment Form</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body {
            margin: 0;
            color: #111827;
            background: #ffffff;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 7pt;
            line-height: 1.25;
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 7px;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #111827;
        }

        .logo-cell,
        .header-text {
            display: table-cell;
            vertical-align: middle;
        }

        .logo-cell {
            width: 58px;
        }

        .logo {
            width: 46px;
            max-height: 46px;
            object-fit: contain;
        }

        .header-text {
            text-align: center;
        }

        .school-name {
            margin: 0 0 2px;
            font-size: 12pt;
            font-weight: 700;
            text-transform: uppercase;
        }

        .school-details {
            margin: 0 0 3px;
            color: #374151;
            font-size: 6.5pt;
        }

        .document-title {
            margin: 0;
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
        }

        .layout {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        .left-column,
        .right-column {
            display: table-cell;
            vertical-align: top;
        }

        .left-column {
            width: 67%;
            padding-right: 8px;
        }

        .right-column {
            width: 33%;
            padding-left: 8px;
            border-left: 1px solid #d1d5db;
        }

        .student-info,
        .fees-panel {
            border: 1px solid #d1d5db;
            border-radius: 3px;
            background: #f9fafb;
        }

        .student-info {
            margin-bottom: 7px;
            padding: 6px 8px;
        }

        .student-info p {
            margin: 0 0 2px;
        }

        table {
            width: 100%;
            margin-bottom: 7px;
            border-collapse: collapse;
            table-layout: fixed;
        }

        th {
            padding: 4px 5px;
            border: 1px solid #1e3a8a;
            color: #ffffff;
            background: #1e40af;
            font-size: 6.5pt;
            font-weight: 700;
            text-align: left;
        }

        td {
            padding: 3px 5px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            vertical-align: top;
            overflow-wrap: anywhere;
            word-break: normal;
            white-space: normal;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .subjects-table .code-column {
            width: 16%;
        }

        .subjects-table .title-column {
            width: 34%;
        }

        .subjects-table .type-column {
            width: 13%;
        }

        .subjects-table .units-column {
            width: 9%;
        }

        .subjects-table .fee-column {
            width: 14%;
        }

        .schedule-table {
            font-size: 5.8pt;
        }

        .schedule-table .subject-column {
            width: 22%;
        }

        .schedule-table .day-column {
            width: 13%;
        }

        .subject-code {
            display: block;
            font-weight: 700;
            color: #111827;
        }

        .subject-title {
            display: block;
            margin-top: 1px;
            color: #374151;
            line-height: 1.2;
        }

        .schedule-cell-filled {
            background: #dbeafe;
        }

        .schedule-entry {
            padding: 2px 0;
            border-bottom: 1px solid #bfdbfe;
        }

        .schedule-entry:last-child {
            border-bottom: 0;
        }

        .schedule-time,
        .schedule-section,
        .schedule-room {
            display: block;
            line-height: 1.18;
        }

        .schedule-time {
            font-weight: 700;
        }

        .schedule-room {
            margin-top: 1px;
            color: #1e3a8a;
        }

        .muted {
            color: #6b7280;
        }

        .total-row td {
            background: #e5e7eb;
            font-weight: 700;
        }

        .badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 5.7pt;
            font-weight: 700;
        }

        .badge-regular {
            color: #6b7280;
        }

        .badge-modular {
            color: #6b21a8;
            background: #f3e8ff;
        }

        .modular-note td {
            color: #6b21a8;
            background: #faf5ff;
            font-size: 6pt;
        }

        .fees-panel {
            padding: 7px;
        }

        .fees-title {
            margin: 0 0 7px;
            padding-bottom: 5px;
            border-bottom: 1.5px solid #1e40af;
            font-size: 9pt;
            font-weight: 700;
        }

        .fee-box,
        .summary-box {
            margin-bottom: 7px;
            padding: 7px;
            border: 1px solid #d1d5db;
            border-radius: 3px;
            background: #ffffff;
        }

        .summary-box {
            border-color: #93c5fd;
            background: #eff6ff;
        }

        .fee-box p,
        .summary-box p {
            margin: 0 0 3px;
        }

        .box-title {
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 700;
        }

        .fee-total,
        .grand-total {
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid #d1d5db;
            font-weight: 700;
        }

        .balance {
            color: #1e40af;
            font-size: 9pt;
            font-weight: 700;
        }

        .required-tag {
            color: #dc2626;
            font-size: 5.8pt;
        }

        .signatures {
            margin-top: 16px;
        }

        .signature-line {
            margin-bottom: 16px;
        }

        .signature-line div {
            width: 150px;
            border-bottom: 1px solid #111827;
        }

        .signature-line p {
            margin: 3px 0 0;
            color: #374151;
            font-size: 6.5pt;
        }
    </style>
</head>
<body>
    @php
        $assessment = $assessment ?? [];
        $subjects = collect(data_get($assessment, 'subjects', []));
        $additionalFees = collect(data_get($assessment, 'additional_fees', []));
        $tuition = data_get($assessment, 'tuition');
        $school = data_get($assessment, 'school', []);
        $totals = data_get($assessment, 'totals', []);
        $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $money = fn ($amount): string => 'PHP '.number_format((float) ($amount ?? 0), 2);
        $studentName = data_get($assessment, 'student.full_name', 'N/A');
        $studentId = data_get($assessment, 'student.student_id', 'N/A');
        $courseCode = data_get($assessment, 'student.course_code', 'N/A');
        $semesterLabel = data_get($assessment, 'enrollment.semester_label', $semester ?? '');
        $schoolYear = data_get($assessment, 'enrollment.school_year', $school_year ?? '');
    @endphp

    <div class="header">
        <div class="logo-cell">
            <img src="{{ data_get($school, 'logo', asset('logo.png')) }}" alt="School Logo" class="logo">
        </div>
        <div class="header-text">
            <h1 class="school-name">{{ data_get($school, 'name', config('app.name')) }}</h1>
            <p class="school-details">
                {{ data_get($school, 'address', '') }}
                @if(data_get($school, 'contact'))
                    | Tel: {{ data_get($school, 'contact') }}
                @endif
                @if(data_get($school, 'email'))
                    | Email: {{ data_get($school, 'email') }}
                @endif
            </p>
            <p class="document-title">Assessment Form</p>
        </div>
    </div>

    <div class="layout">
        <div class="left-column">
            <div class="student-info">
                <p><strong>Course:</strong> {{ $courseCode }}</p>
                <p><strong>Full Name:</strong> {{ $studentName }} | <strong>ID:</strong> {{ $studentId }}</p>
                <p><strong>Semester/School Year:</strong> {{ $semesterLabel }} {{ $schoolYear }}</p>
                <p><strong>Date Generated:</strong> {{ data_get($assessment, 'generated_at', now()->format('m-d-Y')) }}</p>
            </div>

            <table class="subjects-table">
                <thead>
                    <tr>
                        <th class="code-column">Code</th>
                        <th class="title-column">Subject Title</th>
                        <th class="type-column text-center">Type</th>
                        <th class="units-column text-center">Units</th>
                        <th class="fee-column text-right">Lec Fee</th>
                        <th class="fee-column text-right">Lab Fee</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($subjects as $subject)
                        <tr>
                            <td>{{ data_get($subject, 'code', 'N/A') }}</td>
                            <td>{{ data_get($subject, 'title', 'Unknown Subject') }}</td>
                            <td class="text-center">
                                @if(data_get($subject, 'is_modular'))
                                    <span class="badge badge-modular">Modular</span>
                                @else
                                    <span class="badge-regular">Regular</span>
                                @endif
                            </td>
                            <td class="text-center">{{ data_get($subject, 'units', 0) }}</td>
                            <td class="text-right">{{ number_format((float) data_get($subject, 'lecture_fee', 0), 2) }}</td>
                            <td class="text-right">{{ number_format((float) data_get($subject, 'laboratory_fee', 0), 2) }}</td>
                        </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="3">TOTAL</td>
                        <td class="text-center">{{ data_get($totals, 'units', 0) }}</td>
                        <td class="text-right">{{ number_format((float) data_get($totals, 'lecture', 0), 2) }}</td>
                        <td class="text-right">{{ number_format((float) data_get($totals, 'laboratory', 0), 2) }}</td>
                    </tr>
                    @if((int) data_get($totals, 'modular_subjects', 0) > 0)
                        <tr class="modular-note">
                            <td colspan="6">
                                * {{ data_get($totals, 'modular_subjects', 0) }} Modular Subject(s) @ {{ $money(2400) }} each = {{ $money(data_get($totals, 'modular_fee', 0)) }}
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>

            <table class="schedule-table">
                <thead>
                    <tr>
                        <th class="subject-column">Subject</th>
                        @foreach ($dayLabels as $dayLabel)
                            <th class="day-column text-center">{{ $dayLabel }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach ($subjects as $subject)
                        <tr>
                            <td>
                                <span class="subject-code">{{ data_get($subject, 'code', 'N/A') }}</span>
                                <span class="subject-title">{{ data_get($subject, 'title', 'Unknown Subject') }}</span>
                            </td>
                            @foreach ($daysOfWeek as $day)
                                @php
                                    $entries = collect(data_get($subject, "schedule.{$day}", []));
                                @endphp
                                <td class="{{ $entries->isNotEmpty() ? 'schedule-cell-filled' : 'text-center muted' }}">
                                    @forelse ($entries as $entry)
                                        <div class="schedule-entry">
                                            <span class="schedule-time">{{ data_get($entry, 'time', 'TBA') }}</span>
                                            @if(data_get($entry, 'section'))
                                                <span class="schedule-section">Sec: {{ data_get($entry, 'section') }}</span>
                                            @endif
                                            <span class="schedule-room">Room: {{ data_get($entry, 'room', 'TBA') }}</span>
                                        </div>
                                    @empty
                                        -
                                    @endforelse
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="right-column">
            <div class="fees-panel">
                <h2 class="fees-title">Breakdown of Fees</h2>

                <div class="fee-box">
                    <p class="box-title">Tuition Fee Details</p>
                    <p>Sub-Total (Tuition): {{ $money(data_get($totals, 'lecture', 0)) }}</p>
                    <p>Discount: {{ data_get($tuition, 'discount', 0) }}%</p>
                    <p class="fee-total">Total Tuition: {{ $money(data_get($tuition, 'total_lectures', 0)) }}</p>
                </div>

                <div class="fee-box">
                    <p class="box-title">Additional Fees</p>
                    <p>Laboratory Fee: {{ $money(data_get($tuition, 'total_laboratory', 0)) }}</p>
                    <p>Miscellaneous Fee: {{ $money(data_get($tuition, 'total_miscelaneous_fees', 0)) }}</p>
                    @if((int) data_get($totals, 'modular_subjects', 0) > 0)
                        <p>Modular Fee ({{ data_get($totals, 'modular_subjects', 0) }} subjects): {{ $money(data_get($totals, 'modular_fee', 0)) }}</p>
                    @endif
                    @foreach($additionalFees as $fee)
                        <p>
                            {{ data_get($fee, 'name', 'Additional Fee') }}: {{ $money(data_get($fee, 'amount', 0)) }}
                            @if(data_get($fee, 'is_required'))
                                <span class="required-tag">(Required)</span>
                            @endif
                        </p>
                    @endforeach
                </div>

                <div class="summary-box">
                    <p class="box-title">Payment Summary</p>
                    <p>Tuition Fee: {{ $money(data_get($tuition, 'total_lectures', 0)) }}</p>
                    <p>Laboratory Fee: {{ $money(data_get($tuition, 'total_laboratory', 0)) }}</p>
                    <p>Miscellaneous Fee: {{ $money(data_get($tuition, 'total_miscelaneous_fees', 0)) }}</p>
                    @if((float) data_get($assessment, 'additional_fees_total', 0) > 0)
                        <p>Additional Fees: {{ $money(data_get($assessment, 'additional_fees_total', 0)) }}</p>
                    @endif
                    <p class="grand-total">Total Amount: {{ $money(data_get($tuition, 'overall_tuition', data_get($assessment, 'total_amount', 0))) }}</p>
                    <p>Downpayment: {{ $money(data_get($tuition, 'downpayment', 0)) }}</p>
                    <p class="balance">Balance: {{ $money(data_get($tuition, 'total_balance', 0)) }}</p>
                </div>

                <div class="signatures">
                    <div class="signature-line">
                        <div></div>
                        <p>Assessed By</p>
                    </div>
                    <div class="signature-line">
                        <div></div>
                        <p>Student Signature</p>
                    </div>
                    <div class="signature-line">
                        <div></div>
                        <p>Registrar</p>
                    </div>
                    <div class="signature-line">
                        <div></div>
                        <p>Cashier</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
