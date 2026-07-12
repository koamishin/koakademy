<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Official Receipt</title></head>
<body style="margin:0;background:#f4f6f8;color:#17202a;font-family:Arial,sans-serif;line-height:1.5">
    <div style="max-width:620px;margin:0 auto;padding:32px 16px">
        <div style="background:#fff;border:1px solid #dfe4ea;border-radius:12px;overflow:hidden">
            <div style="padding:26px 30px;border-bottom:3px solid #17202a">
                <div style="font-size:13px;color:#68717d">{{ $receipt['institution']['name'] }}</div>
                <h1 style="margin:6px 0 0;font-size:24px">Official receipt</h1>
                <div style="margin-top:4px;color:#68717d;font-family:monospace">No. {{ $receipt['transaction_number'] }}</div>
            </div>
            <div style="padding:26px 30px">
                <p>Hello {{ $receipt['student_name'] }},</p>
                <p>We received your payment on {{ $receipt['date'] }} at {{ $receipt['time'] }}. A printable PDF copy of your official receipt is attached.</p>
                <table style="width:100%;margin:24px 0;border-collapse:collapse">
                    @foreach($receipt['items'] as $key => $amount)
                        <tr><td style="padding:9px 0;border-bottom:1px solid #edf0f3">{{ Illuminate\Support\Str::headline($key === 'tuition_fee' ? 'tuition fee payment' : $key) }}</td><td style="padding:9px 0;border-bottom:1px solid #edf0f3;text-align:right">{{ Illuminate\Support\Number::currency((float) $amount, in: $receipt['currency']) }}</td></tr>
                    @endforeach
                    <tr><td style="padding-top:14px;font-size:17px;font-weight:bold">Total paid</td><td style="padding-top:14px;text-align:right;font-size:17px;font-weight:bold">{{ Illuminate\Support\Number::currency((float) $receipt['amount'], in: $receipt['currency']) }}</td></tr>
                </table>
                <p style="color:#68717d;font-size:13px">Payment method: {{ $receipt['method'] }}<br>Processed by: {{ $receipt['cashier'] }}</p>
            </div>
        </div>
        <p style="text-align:center;color:#7c8591;font-size:12px">This is a system-generated message. Please retain the attached receipt for your records.</p>
    </div>
</body>
</html>
