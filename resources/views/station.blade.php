<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>Station</title>
    <link rel="stylesheet" href="{{ asset('vendor/station/css/app.css') }}">
    @inertiaHead
</head>

<body>
    @routes
    @inertia
    <script src="{{ asset('vendor/station/js/app.js') }}" defer></script>
</body>

</html>
