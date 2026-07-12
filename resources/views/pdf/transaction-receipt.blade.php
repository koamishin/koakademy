<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Official Receipt {{ $receipt['transaction_number'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 16mm; }
        * { box-sizing: border-box; }
        html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; color: #17202a; font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; line-height: 1.45; }
        .document { border: 1px solid #d9dee5; }
        .header { padding: 24px 28px; border-bottom: 3px solid #17202a; }
        .header-table, .meta-table, .items-table, .footer-table { width: 100%; border-collapse: collapse; }
        .brand { font-size: 18px; font-weight: 700; letter-spacing: .03em; }
        .muted { color: #68717d; }
        .receipt-title { text-align: right; font-size: 22px; font-weight: 700; letter-spacing: .08em; }
        .receipt-number { text-align: right; margin-top: 4px; font-family: monospace; }
        .section { padding: 20px 28px; border-bottom: 1px solid #e3e7ec; }
        .label { margin-bottom: 4px; color: #68717d; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .value { font-size: 12px; font-weight: 600; }
        .meta-table td { width: 33.333%; padding-right: 18px; vertical-align: top; }
        .items-table th { padding: 9px 0; border-bottom: 1px solid #cdd3da; color: #68717d; font-size: 9px; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
        .items-table td { padding: 10px 0; border-bottom: 1px solid #edf0f3; }
        .items-table .amount { text-align: right; }
        .total-row td { padding-top: 16px; border: 0; font-size: 15px; font-weight: 700; }
        .note { min-height: 48px; padding: 12px; background: #f5f7f9; }
        .footer { padding: 18px 28px; color: #68717d; font-size: 9px; }
        .footer-table td:last-child { text-align: right; }
    </style>
</head>
<body>
    @php
        $formatter = new NumberFormatter($receipt['currency'] === 'USD' ? 'en_US' : 'en_PH', NumberFormatter::CURRENCY);
        $currency = fn (float $amount): string => $formatter->formatCurrency($amount, $receipt['currency']);
        $label = fn (string $key): string => Illuminate\Support\Str::headline($key === 'tuition_fee' ? 'tuition fee payment' : $key);
    @endphp
    <main class="document">
        <header class="header">
            <table class="header-table">
                <tr>
                    <td>
                        <div class="brand">{{ $receipt['institution']['name'] }}</div>
                        @if($receipt['institution']['description'])<div class="muted">{{ $receipt['institution']['description'] }}</div>@endif
                    </td>
                    <td>
                        <div class="receipt-title">OFFICIAL RECEIPT</div>
                        <div class="receipt-number">No. {{ $receipt['transaction_number'] }}</div>
                    </td>
                </tr>
            </table>
        </header>

        <section class="section">
            <table class="meta-table">
                <tr>
                    <td><div class="label">Received from</div><div class="value">{{ $receipt['student_name'] }}</div><div class="muted">Student ID {{ $receipt['student_id'] }}</div></td>
                    <td><div class="label">Date issued</div><div class="value">{{ $receipt['date'] }}</div><div class="muted">{{ $receipt['time'] }}</div></td>
                    <td><div class="label">Reference</div><div class="value">{{ $receipt['reference_number'] ?: '—' }}</div><div class="muted">{{ $receipt['method'] }}</div></td>
                </tr>
            </table>
        </section>

        <section class="section">
            <table class="items-table">
                <thead><tr><th>Payment description</th><th class="amount">Amount</th></tr></thead>
                <tbody>
                    @foreach($receipt['items'] as $key => $amount)
                        <tr><td>{{ $label($key) }}</td><td class="amount">{{ $currency((float) $amount) }}</td></tr>
                    @endforeach
                    <tr class="total-row"><td>Total paid</td><td class="amount">{{ $currency((float) $receipt['amount']) }}</td></tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <table class="meta-table">
                <tr>
                    <td><div class="label">Payment status</div><div class="value">{{ Illuminate\Support\Str::headline($receipt['status']) }}</div></td>
                    <td><div class="label">Payment method</div><div class="value">{{ $receipt['method'] }}</div></td>
                    <td><div class="label">Processed by</div><div class="value">{{ $receipt['cashier'] }}</div></td>
                </tr>
            </table>
        </section>

        <section class="section"><div class="label">Remarks</div><div class="note">{{ $receipt['remarks'] ?: 'No additional remarks.' }}</div></section>

        <footer class="footer">
            <table class="footer-table"><tr><td>This is a system-generated official receipt.</td><td>Transaction ID {{ $receipt['id'] }}</td></tr></table>
        </footer>
    </main>
</body>
</html>
