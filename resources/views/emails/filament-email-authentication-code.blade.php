<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName }} — Sign-in code</title>
</head>
<body style="margin: 0; padding: 0; background: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f7f7f7;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table role="presentation" width="570" cellspacing="0" cellpadding="0" style="max-width: 570px; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 0 0 24px;">
                            <div style="font-size: 18px; font-weight: 700; color: #202124;">
                                {{ $appName }}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 32px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                            <h1 style="font-size: 20px; line-height: 1.4; color: #202124; margin: 0 0 16px; font-weight: 700;">
                                Hello!
                            </h1>

                            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 20px;">
                                Use this sign-in code to complete your two-factor authentication.
                            </p>

                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 24px 16px; margin: 0 0 24px; text-align: center;">
                                <p style="font-size: 12px; font-weight: 700; color: #6b7280; letter-spacing: 1.8px; text-transform: uppercase; margin: 0 0 12px;">
                                    Your sign-in code
                                </p>
                                <div style="font-size: 34px; line-height: 1; font-weight: 800; letter-spacing: 8px; color: #1a365d;">
                                    {{ $code }}
                                </div>
                            </div>

                            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 20px;">
                                This code expires in {{ $codeExpiryMinutes }} {{ Str::plural('minute', $codeExpiryMinutes) }}.
                            </p>

                            <div style="border-left: 3px solid #1a365d; padding-left: 16px; margin: 0;">
                                <p style="font-size: 14px; line-height: 1.7; color: #6b7280; margin: 0;">
                                    If you did not attempt to sign in, you can safely ignore this email. For your security, consider changing your password if this keeps happening.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 28px 0 0;">
                            <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; margin: 0 0 6px;">
                                {{ $appName }} &bull; {{ $appUrl }}
                            </p>
                            <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; margin: 0;">
                                &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
