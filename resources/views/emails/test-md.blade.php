<x-mail::message>
# Mail Configuration Test

This is a **markdown** test email sent from {{ $appName }}.

Your SMTP mail server configuration is working correctly. This email was rendered using Laravel's markdown mail component.

<x-mail::panel>
**Test Details**

- **Sent At:** {{ now()->format('F j, Y \a\t g:i A') }}
- **Email Type:** Markdown
- **Environment:** {{ app()->environment() }}
</x-mail::panel>

<x-mail::table>
| Field | Value |
|-------|-------|
| Organization | {{ $orgName }} |
| Application | {{ $appName }} |
| Sent | {{ now()->format('Y-m-d H:i:s') }} |
</x-mail::table>

If you received this email, your outbound mail settings are properly configured. Both HTML and Markdown email formats should work correctly.

Thanks,<br>
{{ $appName }}
</x-mail::message>
