<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName }} — Test Email</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f1eb; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f1eb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width: 640px; width: 100%; background: #ffffff; border: 1px solid #e2ddd5;">
                    <tr>
                        <td style="background: #1a365d; padding: 36px 40px; text-align: center;">
                            <p style="font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">System Test</p>
                            <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0; line-height: 1.3;">Email Delivery Test Successful</h1>
                            <p style="font-size: 14px; color: rgba(255,255,255,0.75); margin: 12px 0 0;">Your mail configuration is working correctly.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="font-size: 16px; line-height: 1.8; color: #2d3748; margin: 0 0 24px;">
                                This is a test email sent from your {{ $appName }} system. It confirms that your SMTP mail server settings are properly configured and outbound email delivery is functioning.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #faf9f7; border: 1px solid #e2ddd5; margin-bottom: 28px;">
                                <tr>
                                    <td colspan="2" style="padding: 14px 20px; background: #f4f1eb; border-bottom: 1px solid #e2ddd5; font-size: 16px; font-weight: 700; color: #1a365d;">Test Details</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px; border-bottom: 1px solid #e2ddd5; color: #718096; width: 40%;">Sent At</td>
                                    <td style="padding: 10px 20px; border-bottom: 1px solid #e2ddd5; color: #1a365d; font-weight: 600;">{{ now()->format('F j, Y \a\t g:i A') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px; border-bottom: 1px solid #e2ddd5; color: #718096;">Email Type</td>
                                    <td style="padding: 10px 20px; border-bottom: 1px solid #e2ddd5; color: #1a365d; font-weight: 600;">{{ strtoupper($testType) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 20px; color: #718096;">Environment</td>
                                    <td style="padding: 10px 20px; color: #1a365d; font-weight: 600;">{{ app()->environment() }}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin-bottom: 28px;">
                                <span style="display: inline-block; padding: 14px 28px; background: #f0fff4; border: 2px solid #c6f6d5; border-radius: 8px; font-size: 16px; font-weight: 700; color: #276749;">Configuration Verified</span>
                            </div>

                            <p style="border-left: 3px solid #1a365d; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4a5568; margin: 0;">
                                If you received this email, your outbound mail settings are correctly configured. You can now use the system to send transactional and notification emails.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f4f1eb; padding: 22px 40px; border-top: 1px solid #e2ddd5; text-align: center;">
                            <p style="font-size: 12px; color: #718096; margin: 0 0 6px;">This is an automated test message from {{ $appName }}.</p>
                            <p style="font-size: 11px; color: #a0aec0; margin: 0;">{{ $orgName }} &bull; &copy; {{ date('Y') }} All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
