{{--
Expected data: studentName, studentEmail, schoolYear, semester, classChanges, changeReason,
siteSettings, logoUrl, organizationName, pdfAttached.
--}}
@php
    $themeColor = $siteSettings['themeColor'] ?? '#0f172a';
    $organizationName = $siteSettings['organizationName'] ?? config('app.name');
    $surfaceColor = '#ffffff';
    $softSurfaceColor = '#f8fafc';
    $borderColor = '#e2e8f0';
    $mutedColor = '#64748b';
    $textColor = '#0f172a';
    $infoColor = '#1e40af';
    $infoSurfaceColor = '#eff6ff';
    $warningColor = '#92400e';
    $warningSurfaceColor = '#fffbeb';
    $spaceXs = '4px';
    $spaceSm = '8px';
    $spaceMd = '12px';
    $spaceLg = '16px';
    $spaceXl = '24px';
    $radiusSm = '8px';
    $radiusMd = '12px';
    $radiusLg = '18px';
@endphp
@component('mail::message')
<div style="text-align: center; padding: {{ $spaceXl }} {{ $spaceLg }}; border-bottom: 2px solid {{ $themeColor }}; margin-bottom: {{ $spaceXl }}; background: linear-gradient(135deg, {{ $softSurfaceColor }} 0%, {{ $surfaceColor }} 100%); border-radius: {{ $radiusLg }} {{ $radiusLg }} {{ $radiusSm }} {{ $radiusSm }};">
@if(!empty($logoUrl))
<img src="{{ $logoUrl }}" alt="{{ $organizationName }}" style="max-height: 64px; margin-bottom: {{ $spaceMd }}; display: inline-block;">
@endif
<h2 style="margin: 0; color: {{ $themeColor }}; font-size: 21px; line-height: 1.25; font-family: system-ui, -apple-system, sans-serif;">
{{ $organizationName }}
</h2>
@if(!empty($siteSettings['tagline']))
<p style="margin: {{ $spaceSm }} 0 0; color: {{ $mutedColor }}; font-size: 13px; line-height: 1.5; font-family: system-ui, -apple-system, sans-serif; text-align: center;">
{{ $siteSettings['tagline'] }}
</p>
@endif
</div>

<div style="border-left: 4px solid {{ $themeColor }}; padding-left: {{ $spaceLg }}; margin-bottom: {{ $spaceXl }};">
<p style="margin: 0 0 {{ $spaceSm }}; color: {{ $mutedColor }}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif;">
Class Schedule Update
</p>
<h1 style="margin: 0; color: {{ $textColor }}; font-size: 24px; line-height: 1.25; font-family: system-ui, -apple-system, sans-serif;">
Your Class Schedule Has Been Updated
</h1>
</div>

Dear {{ $studentName }},

Your class schedule for **{{ $schoolYear }}**, **{{ $semester }}** has been updated. Please review the changes below.

### Class Changes

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: {{ $spaceLg }} 0 {{ $spaceXl }}; border: 1px solid {{ $borderColor }}; border-radius: {{ $radiusMd }}; overflow: hidden; background: {{ $surfaceColor }};">
<thead>
<tr style="background: {{ $softSurfaceColor }};">
<th style="padding: {{ $spaceMd }} {{ $spaceLg }}; text-align: left; color: {{ $mutedColor }}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif;">Subject</th>
<th style="padding: {{ $spaceMd }} {{ $spaceLg }}; text-align: left; color: {{ $mutedColor }}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif;">Previous Section</th>
<th style="padding: {{ $spaceMd }} {{ $spaceLg }}; text-align: left; color: {{ $mutedColor }}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif;">New Section</th>
</tr>
</thead>
<tbody>
@foreach($classChanges as $change)
<tr style="border-top: 1px solid {{ $borderColor }};">
<td style="padding: {{ $spaceMd }} {{ $spaceLg }}; color: {{ $textColor }}; font-size: 14px; font-family: system-ui, -apple-system, sans-serif;">
<div style="font-weight: 600;">{{ $change['subject_code'] }}</div>
<div style="color: {{ $mutedColor }}; font-size: 12px;">{{ $change['subject_title'] }}</div>
</td>
<td style="padding: {{ $spaceMd }} {{ $spaceLg }}; color: {{ $textColor }}; font-size: 14px; font-family: system-ui, -apple-system, sans-serif;">
<span style="display: inline-block; padding: 2px 10px; border-radius: 12px; background: {{ $softSurfaceColor }}; font-weight: 600;">{{ $change['old_section'] }}</span>
</td>
<td style="padding: {{ $spaceMd }} {{ $spaceLg }}; color: {{ $textColor }}; font-size: 14px; font-family: system-ui, -apple-system, sans-serif;">
<span style="display: inline-block; padding: 2px 10px; border-radius: 12px; background: {{ $infoSurfaceColor }}; font-weight: 600; color: {{ $infoColor }};">{{ $change['new_section'] }}</span>
</td>
</tr>
@endforeach
</tbody>
</table>

@if(!empty($changeReason))
<div style="margin: {{ $spaceLg }} 0; padding: {{ $spaceLg }}; border-left: 4px solid {{ $warningColor }}; border-radius: {{ $radiusSm }}; background: {{ $warningSurfaceColor }};">
<p style="margin: 0 0 {{ $spaceSm }}; color: {{ $warningColor }}; font-size: 13px; font-weight: 700; font-family: system-ui, -apple-system, sans-serif;">
Reason for Change
</p>
<p style="margin: 0; color: {{ $warningColor }}; font-size: 14px; line-height: 1.6; font-family: system-ui, -apple-system, sans-serif;">
{{ $changeReason }}
</p>
</div>
@endif

### Important Notes

1. **Review your new schedule:** Please check the attached Assessment Form PDF for your updated class schedule, room assignments, and payment details.
2. **Keep your records:** The attached PDF serves as your official proof of enrollment with the updated schedule.
3. **Contact us:** If you have any questions about these changes, please contact the Registrar's Office.

@if(!empty($pdfAttached) && $pdfAttached)
<div style="margin: {{ $spaceXl }} 0; padding: {{ $spaceLg }}; border-left: 4px solid {{ $infoColor }}; border-radius: {{ $radiusSm }}; background: {{ $infoSurfaceColor }};">
<p style="margin: 0; color: {{ $infoColor }}; font-size: 14px; line-height: 1.6; font-family: system-ui, -apple-system, sans-serif;">
Your updated Assessment Form PDF is attached to this email for your reference.
</p>
</div>
@endif

Thank you,<br>
**{{ $organizationName }}**<br>
Registrar's Office

<div style="margin-top: {{ $spaceXl }}; padding-top: {{ $spaceLg }}; border-top: 1px solid {{ $borderColor }}; text-align: center;">
<p style="margin: 0; color: {{ $mutedColor }}; font-size: 12px; font-family: system-ui, -apple-system, sans-serif;">
This is an automated notification from {{ $organizationName }}. Please do not reply to this email.
</p>
</div>
@endcomponent
