#
# KoAkademy - Local Development Setup for Windows
#
# This script sets up the local development environment using Laravel Herd
# including:
# - Prerequisites check
# - Herd auto-detection (with fallback guidance)
# - Environment configuration
# - Composer and npm dependencies
# - Herd proxy configuration (domains + SSL)
# - Database setup
#
# Usage:
#   .\scripts\dev-setup.ps1                 # Full setup
#   .\scripts\dev-setup.ps1 -SkipMigrations # Skip migrations
#   .\scripts\dev-setup.ps1 -SkipNpm        # Skip npm install
#
# Re-running on an already-configured environment:
#   If .env already exists, the script prompts:
#     [S] Skip     - Leave .env untouched, skip DB setup and migrations.
#                   (Still runs composer, npm, Herd link/secure, and build.)
#     [C] Continue - Run full setup, but PRESERVE existing database credentials.
#   In both cases, DB_* values in your .env are NEVER modified.
#   You can also opt in to add optional services (Redis, Mailpit). The script
#   will auto-configure the related .env keys (REDIS_*, MAIL_*, CACHE_STORE,
#   QUEUE_CONNECTION) without touching DB_*.

[CmdletBinding()]
param(
    [switch]$SkipMigrations,
    [switch]$SkipNpm
)

# Error handling
$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$HerdBinPath = Join-Path $env:USERPROFILE ".config\herd\bin"

# Default domains (matching config/app.php defaults)
$DefaultAppUrl = "http://koakademy.test"
$PortalHost = "portal.koakademy.test"
$AdminHost = "admin.koakademy.test"

# Colors
function Write-Success
{ param([string]$msg) Write-Host "[OK] $msg" -ForegroundColor Green
}
function Write-Info
{ param([string]$msg) Write-Host "[..] $msg" -ForegroundColor Cyan
}
function Write-Warn
{ param([string]$msg) Write-Host "[!!] $msg" -ForegroundColor Yellow
}
function Write-ErrorMsg
{ param([string]$msg) Write-Host "[XX] $msg" -ForegroundColor Red
}
function Write-Section
{ param([string]$msg)
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Blue
    Write-Host "$msg" -ForegroundColor Blue
    Write-Host "=======================================" -ForegroundColor Blue
    Write-Host ""
}

function Set-EnvValue
{
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    $content = ""
    if (Test-Path $Path)
    {
        $content = Get-Content $Path -Raw
    }

    $escapedKey = [Regex]::Escape($Key)
    if ($content -match "(?m)^$escapedKey=")
    {
        $content = [Regex]::Replace($content, "(?m)^$escapedKey=.*", { "$Key=$Value" })
    } else
    {
        if (-not $content.EndsWith("`n") -and $content.Length -gt 0)
        {
            $content += "`n"
        }
        $content += "$Key=$Value`n"
    }

    Set-Content -Path $Path -Value $content -Encoding UTF8
}

function Test-DockerAvailable
{
    $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCommand)
    {
        return $false
    }

    docker info *> $null
    return $LASTEXITCODE -eq 0
}

function Start-DockerContainer
{
    param(
        [string]$Name,
        [string]$Image,
        [string[]]$Arguments
    )

    $existing = docker ps -a --filter "name=^/$Name$" --format "{{.Names}}" 2>$null
    if ($existing -eq $Name)
    {
        $running = docker ps --filter "name=^/$Name$" --format "{{.Names}}" 2>$null
        if ($running -eq $Name)
        {
            Write-Success "$Name is already running"
            return
        }

        Write-Info "Starting existing container: $Name"
        docker start $Name | Out-Null
        Write-Success "$Name started"
        return
    }

    Write-Info "Creating container: $Name"
    docker run -d --name $Name @Arguments $Image | Out-Null
    if ($LASTEXITCODE -eq 0)
    {
        Write-Success "$Name is running"
    } else
    {
        Write-ErrorMsg "Failed to start $Name"
        exit 1
    }
}

function Read-Choice
{
    param(
        [string]$Prompt,
        [string[]]$Allowed,
        [string]$Default
    )

    $allowedText = $Allowed -join "/"
    $answer = Read-Host "$Prompt [$allowedText] (default: $Default)"
    if ([string]::IsNullOrWhiteSpace($answer))
    {
        return $Default
    }

    $answer = $answer.Trim().ToLowerInvariant()
    if ($Allowed -contains $answer)
    {
        return $answer
    }

    Write-Warn "Invalid choice '$answer'. Using default: $Default"
    return $Default
}

# Banner
Write-Host ""
Write-Host "+-------------------------------------------------------+" -ForegroundColor Blue
Write-Host "|           KoAkademy - Local Development Setup          |" -ForegroundColor Blue
Write-Host "|              (Windows + Laravel Herd)                  |" -ForegroundColor Blue
Write-Host "+-------------------------------------------------------+" -ForegroundColor Blue
Write-Host ""

# ─────────────────────────────────────────────────────
# Step 1: Check prerequisites & auto-detect Herd
# ─────────────────────────────────────────────────────
Write-Section "Checking Prerequisites"

$HerdInstalled = $false

# Check PHP
$phpCommand = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCommand)
{
    Write-ErrorMsg "PHP is not installed or not in PATH"
    Write-Host "Please install PHP or ensure Laravel Herd is properly installed."
    exit 1
}
Write-Success "PHP is installed: $(php -r 'echo PHP_VERSION;')"

# Check Composer
$composerCommand = Get-Command composer -ErrorAction SilentlyContinue
if (-not $composerCommand)
{
    Write-ErrorMsg "Composer is not installed or not in PATH"
    Write-Host "Please install Composer from: https://getcomposer.org/"
    exit 1
}
Write-Success "Composer is installed: $(composer --version | Select-Object -First 1)"

# Check Node.js
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand)
{
    Write-ErrorMsg "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from: https://nodejs.org/"
    exit 1
}
Write-Success "Node.js is installed: $(node --version)"

# Check npm
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCommand)
{
    Write-ErrorMsg "npm is not installed or not in PATH"
    exit 1
}
Write-Success "npm is installed: $(npm --version)"

# Auto-detect Laravel Herd
if (Test-Path $HerdBinPath)
{
    if (-not ($env:PATH -split ';' | Where-Object { $_ -eq $HerdBinPath }))
    {
        $env:PATH = "$HerdBinPath;$env:PATH"
    }
}

$herdCommand = Get-Command herd -ErrorAction SilentlyContinue
if ($herdCommand)
{
    $HerdInstalled = $true
    Write-Success "Laravel Herd is installed"
    Write-Info "Using Herd from: $($herdCommand.Source)"
} else
{
    Write-Warn "Laravel Herd is NOT detected"
    Write-Warn ""
    Write-Warn "Herd is strongly recommended for this project. It provides:"
    Write-Warn "  - Automatic DNS for *.test domains"
    Write-Warn "  - SSL certificate management"
    Write-Warn "  - PHP version management"
    Write-Warn "  - Zero-config local development server"
    Write-Warn ""
    Write-Warn "Without Herd, .test domains will NOT resolve automatically."
    Write-Warn "You will need to manually configure DNS or hosts file entries."
    Write-Warn ""
    Write-Warn "Download Herd from: https://herd.laravel.com/"
    Write-Warn ""

    $response = Read-Host "Continue without Herd? (y/N)"
    if ($response -notmatch '^[yY]')
    {
        Write-Info "Setup aborted. Please install Laravel Herd and try again."
        exit 0
    }

    Write-Info "Continuing without Herd - some features may not work optimally"
    Write-Info "You may need to run: php artisan serve"
    Write-Host ""
}

# ─────────────────────────────────────────────────────
# Step 2: Setup .env file
# ─────────────────────────────────────────────────────
Write-Section "Environment Configuration"

$EnvFile = Join-Path $ProjectRoot ".env"
$EnvExampleFile = Join-Path $ProjectRoot ".env.example"
$EnvAlreadyConfigured = Test-Path $EnvFile
$SkipEnvSetup = $false
$PreserveDbCredentials = $false

if ($EnvAlreadyConfigured)
{
    Write-Warn ".env file already exists at $EnvFile"
    Write-Host ""
    Write-Host "Your environment is already configured." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [S] Skip     - Leave .env untouched, skip DB setup and migrations." -ForegroundColor White
    Write-Host "                 (Still runs composer, npm, Herd link/secure, and build.)" -ForegroundColor DarkGray
    Write-Host "  [C] Continue - Run full setup, but PRESERVE existing database credentials." -ForegroundColor White
    Write-Host ""

    $envChoice = Read-Choice -Prompt "Choose action" -Allowed @("skip", "continue") -Default "skip"

    if ($envChoice -eq "skip")
    {
        $SkipEnvSetup = $true
        $PreserveDbCredentials = $true
        Write-Info "Skipping environment setup. Existing .env and DB credentials will NOT be touched."
    } else
    {
        $PreserveDbCredentials = $true
        Write-Info "Continuing with full setup. Existing database credentials will be PRESERVED."
    }
    Write-Host ""
}

if (-not $SkipEnvSetup)
{
if (-not (Test-Path $EnvFile))
{
    Write-Info "Creating .env from .env.example..."
    if (Test-Path $EnvExampleFile)
    {
        Copy-Item $EnvExampleFile $EnvFile
        Write-Success ".env file created from .env.example"

        # Update key values to match KoAkademy defaults
        $EnvContent = Get-Content $EnvFile -Raw

        # Replace APP_URL if it exists, otherwise add it
        if ($EnvContent -match '(?m)^APP_URL=.*')
        {
            $EnvContent = $EnvContent -replace '(?m)^APP_URL=.*', "APP_URL=$DefaultAppUrl"
        } else
        {
            $EnvContent += "`nAPP_URL=$DefaultAppUrl"
        }

        # Replace/add PORTAL_HOST
        if ($EnvContent -match '(?m)^PORTAL_HOST=.*')
        {
            $EnvContent = $EnvContent -replace '(?m)^PORTAL_HOST=.*', "PORTAL_HOST=$PortalHost"
        } else
        {
            $EnvContent += "`nPORTAL_HOST=$PortalHost"
        }

        # Replace/add ADMIN_HOST
        if ($EnvContent -match '(?m)^ADMIN_HOST=.*')
        {
            $EnvContent = $EnvContent -replace '(?m)^ADMIN_HOST=.*', "ADMIN_HOST=$AdminHost"
        } else
        {
            $EnvContent += "`nADMIN_HOST=$AdminHost"
        }

        Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
        Write-Success "Updated .env with KoAkademy domain defaults"
    } else
    {
        Write-Warn ".env.example not found, creating minimal .env..."
        $MinimalEnv = @(
            "APP_NAME=`"KoAkademy`""
            "APP_ENV=local"
            "APP_KEY="
            "APP_DEBUG=true"
            "APP_URL=$DefaultAppUrl"
            ""
            "LOG_CHANNEL=stack"
            "LOG_DEPRECATIONS_CHANNEL=null"
            "LOG_LEVEL=debug"
            ""
            "BROADCAST_DRIVER=log"
            "CACHE_DRIVER=file"
            "FILESYSTEM_DISK=local"
            "QUEUE_CONNECTION=sync"
            "SESSION_DRIVER=file"
            "SESSION_LIFETIME=120"
            ""
            "PORTAL_HOST=$PortalHost"
            "ADMIN_HOST=$AdminHost"
        )
        $MinimalEnv | Out-File -FilePath $EnvFile -Encoding UTF8
        Write-Success "Minimal .env file created"
    }
} else
{
    Write-Success ".env file already exists"

    # Check and update key values if they're still at defaults
    $EnvContent = Get-Content $EnvFile -Raw
    $NeedsUpdate = $false

    if ($EnvContent -notmatch '(?m)^PORTAL_HOST=')
    {
        $EnvContent += "`nPORTAL_HOST=$PortalHost"
        $NeedsUpdate = $true
    }
    if ($EnvContent -notmatch '(?m)^ADMIN_HOST=')
    {
        $EnvContent += "`nADMIN_HOST=$AdminHost"
        $NeedsUpdate = $true
    }

    if ($NeedsUpdate)
    {
        Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
        Write-Success "Added missing domain configuration to .env"
    }
}
}

# Read domains from .env (in case user customized them)
$EnvContent = Get-Content $EnvFile -Raw
$PortalHost = if ($EnvContent -match 'PORTAL_HOST=(.*)')
{ $matches[1].Trim() 
} else
{ $PortalHost 
}
$AdminHost = if ($EnvContent -match 'ADMIN_HOST=(.*)')
{ $matches[1].Trim() 
} else
{ $AdminHost 
}
$Domains = @($PortalHost, $AdminHost) | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

Write-Info "Configured domains:"
foreach ($domain in $Domains)
{
    Write-Host "  - $domain" -ForegroundColor Cyan
}

# -----------------------------------------------------------------------------
# Step 3: Optional Docker-backed local services
# -----------------------------------------------------------------------------
Write-Section "Local Services"

if ($PreserveDbCredentials)
{
    # Report existing DB config; never modify DB_* values
    $currentEnvContent = Get-Content $EnvFile -Raw
    $currentDbConnection = "sqlite"
    $currentDbDatabase = "database/database.sqlite"
    $currentDbHost = ""
    $currentDbPort = ""
    $currentDbUsername = ""

    if ($currentEnvContent -match '(?m)^DB_CONNECTION=(.*)')
    {
        $currentDbConnection = $matches[1].Trim()
    }
    if ($currentEnvContent -match '(?m)^DB_DATABASE=(.*)')
    {
        $currentDbDatabase = $matches[1].Trim()
    }
    if ($currentEnvContent -match '(?m)^DB_HOST=(.*)')
    {
        $currentDbHost = $matches[1].Trim()
    }
    if ($currentEnvContent -match '(?m)^DB_PORT=(.*)')
    {
        $currentDbPort = $matches[1].Trim()
    }
    if ($currentEnvContent -match '(?m)^DB_USERNAME=(.*)')
    {
        $currentDbUsername = $matches[1].Trim()
    }

    Write-Info "Preserving existing database credentials (DB_* values will NOT be modified)"
    Write-Host ""
    Write-Host "  DB_CONNECTION: $currentDbConnection" -ForegroundColor Cyan
    if ($currentDbConnection -ne "sqlite")
    {
        if ($currentDbHost) { Write-Host "  DB_HOST:       $currentDbHost" -ForegroundColor Cyan }
        if ($currentDbPort) { Write-Host "  DB_PORT:       $currentDbPort" -ForegroundColor Cyan }
        if ($currentDbDatabase) { Write-Host "  DB_DATABASE:   $currentDbDatabase" -ForegroundColor Cyan }
        if ($currentDbUsername) { Write-Host "  DB_USERNAME:   $currentDbUsername" -ForegroundColor Cyan }
        Write-Host "  DB_PASSWORD:   ******** (preserved)" -ForegroundColor Cyan
    } else
    {
        Write-Host "  DB_DATABASE:   $currentDbDatabase" -ForegroundColor Cyan
    }
    Write-Host ""

    if ($currentDbConnection -eq "sqlite")
    {
        $sqlitePath = Join-Path $ProjectRoot $currentDbDatabase
        if (-not (Test-Path $sqlitePath))
        {
            New-Item -Path $sqlitePath -ItemType File -Force | Out-Null
            Write-Success "Created SQLite database file at $currentDbDatabase"
        } else
        {
            Write-Success "SQLite database file exists at $currentDbDatabase"
        }
    } else
    {
        Write-Info "External database ($currentDbConnection) - skipping local service setup"
    }

    # Ask whether to add optional services (Redis, Mailpit). DB_* is never touched;
    # only service-related keys (REDIS_*, MAIL_*, CACHE_STORE, QUEUE_CONNECTION) are written.
    Write-Host ""
    $addServicesChoice = Read-Choice -Prompt "Add optional services (e.g. Redis, Mailpit)?" -Allowed @("yes", "no") -Default "no"

    if ($addServicesChoice -eq "yes")
    {
        $DockerAvailableForServices = Test-DockerAvailable
        if (-not $DockerAvailableForServices)
        {
            Write-Warn "Docker is not installed or is not running - cannot start optional services."
            Write-Info "Install Docker Desktop and re-run, or configure services manually in .env."
        } else
        {
            Write-Success "Docker is available - configuring optional services"

            $redisChoice = Read-Choice -Prompt "Start Redis with Docker?" -Allowed @("yes", "no") -Default "no"
            if ($redisChoice -eq "yes")
            {
                Start-DockerContainer -Name "koakademy-redis" -Image "redis:7-alpine" -Arguments @(
                    "-p", "6379:6379",
                    "-v", "koakademy-redis:/data"
                )

                Set-EnvValue -Path $EnvFile -Key "REDIS_HOST" -Value "127.0.0.1"
                Set-EnvValue -Path $EnvFile -Key "REDIS_PORT" -Value "6379"
                Set-EnvValue -Path $EnvFile -Key "CACHE_STORE" -Value "redis"
                Set-EnvValue -Path $EnvFile -Key "QUEUE_CONNECTION" -Value "redis"
                Write-Success "Auto-configured .env for Redis (REDIS_HOST, REDIS_PORT, CACHE_STORE, QUEUE_CONNECTION)"
            }

            $mailpitChoice = Read-Choice -Prompt "Start Mailpit with Docker?" -Allowed @("yes", "no") -Default "no"
            if ($mailpitChoice -eq "yes")
            {
                Start-DockerContainer -Name "koakademy-mailpit" -Image "axllent/mailpit:latest" -Arguments @(
                    "-p", "1025:1025",
                    "-p", "8025:8025"
                )

                Set-EnvValue -Path $EnvFile -Key "MAIL_MAILER" -Value "smtp"
                Set-EnvValue -Path $EnvFile -Key "MAIL_HOST" -Value "127.0.0.1"
                Set-EnvValue -Path $EnvFile -Key "MAIL_PORT" -Value "1025"
                Set-EnvValue -Path $EnvFile -Key "MAIL_USERNAME" -Value "null"
                Set-EnvValue -Path $EnvFile -Key "MAIL_PASSWORD" -Value "null"
                Set-EnvValue -Path $EnvFile -Key "MAIL_ENCRYPTION" -Value "null"
                Write-Success "Auto-configured .env for Mailpit (MAIL_MAILER, MAIL_HOST, MAIL_PORT, etc.)"
            }
        }
    } else
    {
        Write-Info "Skipping optional services"
    }
} else
{
$DockerAvailable = Test-DockerAvailable
if ($DockerAvailable)
{
    Write-Success "Docker is installed and running"
    Write-Info "SQLite is the default database and does not require Docker."

    $databaseChoice = Read-Choice -Prompt "Choose database for local development" -Allowed @("sqlite", "pgsql", "mysql") -Default "sqlite"

    if ($databaseChoice -eq "sqlite")
    {
        Set-EnvValue -Path $EnvFile -Key "DB_CONNECTION" -Value "sqlite"
        Set-EnvValue -Path $EnvFile -Key "DB_DATABASE" -Value "database/database.sqlite"
        $sqlitePath = Join-Path $ProjectRoot "database\database.sqlite"
        if (-not (Test-Path $sqlitePath))
        {
            New-Item -Path $sqlitePath -ItemType File -Force | Out-Null
            Write-Success "Created SQLite database at database/database.sqlite"
        } else
        {
            Write-Success "SQLite database already exists"
        }
    } elseif ($databaseChoice -eq "pgsql")
    {
        $pgsqlPassword = Read-Host "PostgreSQL password (default: koakademy)"
        if ([string]::IsNullOrWhiteSpace($pgsqlPassword))
        { $pgsqlPassword = "koakademy" 
        }

        Start-DockerContainer -Name "koakademy-pgsql" -Image "postgres:17-alpine" -Arguments @(
            "-p", "5432:5432",
            "-e", "POSTGRES_DB=koakademy",
            "-e", "POSTGRES_USER=koakademy",
            "-e", "POSTGRES_PASSWORD=$pgsqlPassword",
            "-v", "koakademy-pgsql:/var/lib/postgresql/data"
        )

        Set-EnvValue -Path $EnvFile -Key "DB_CONNECTION" -Value "pgsql"
        Set-EnvValue -Path $EnvFile -Key "DB_HOST" -Value "127.0.0.1"
        Set-EnvValue -Path $EnvFile -Key "DB_PORT" -Value "5432"
        Set-EnvValue -Path $EnvFile -Key "DB_DATABASE" -Value "koakademy"
        Set-EnvValue -Path $EnvFile -Key "DB_USERNAME" -Value "koakademy"
        Set-EnvValue -Path $EnvFile -Key "DB_PASSWORD" -Value $pgsqlPassword
    } elseif ($databaseChoice -eq "mysql")
    {
        $mysqlPassword = Read-Host "MySQL password (default: koakademy)"
        if ([string]::IsNullOrWhiteSpace($mysqlPassword))
        { $mysqlPassword = "koakademy" 
        }
        $mysqlRootPassword = Read-Host "MySQL root password (default: root)"
        if ([string]::IsNullOrWhiteSpace($mysqlRootPassword))
        { $mysqlRootPassword = "root" 
        }

        Start-DockerContainer -Name "koakademy-mysql" -Image "mysql:8.4" -Arguments @(
            "-p", "3306:3306",
            "-e", "MYSQL_DATABASE=koakademy",
            "-e", "MYSQL_USER=koakademy",
            "-e", "MYSQL_PASSWORD=$mysqlPassword",
            "-e", "MYSQL_ROOT_PASSWORD=$mysqlRootPassword",
            "-v", "koakademy-mysql:/var/lib/mysql"
        )

        Set-EnvValue -Path $EnvFile -Key "DB_CONNECTION" -Value "mysql"
        Set-EnvValue -Path $EnvFile -Key "DB_HOST" -Value "127.0.0.1"
        Set-EnvValue -Path $EnvFile -Key "DB_PORT" -Value "3306"
        Set-EnvValue -Path $EnvFile -Key "DB_DATABASE" -Value "koakademy"
        Set-EnvValue -Path $EnvFile -Key "DB_USERNAME" -Value "koakademy"
        Set-EnvValue -Path $EnvFile -Key "DB_PASSWORD" -Value $mysqlPassword
    }

    $redisChoice = Read-Choice -Prompt "Start Redis with Docker?" -Allowed @("yes", "no") -Default "no"
    if ($redisChoice -eq "yes")
    {
        Start-DockerContainer -Name "koakademy-redis" -Image "redis:7-alpine" -Arguments @(
            "-p", "6379:6379",
            "-v", "koakademy-redis:/data"
        )

        Set-EnvValue -Path $EnvFile -Key "REDIS_HOST" -Value "127.0.0.1"
        Set-EnvValue -Path $EnvFile -Key "REDIS_PORT" -Value "6379"
        Set-EnvValue -Path $EnvFile -Key "CACHE_STORE" -Value "redis"
        Set-EnvValue -Path $EnvFile -Key "QUEUE_CONNECTION" -Value "redis"
    } else
    {
        Set-EnvValue -Path $EnvFile -Key "CACHE_STORE" -Value "database"
        Set-EnvValue -Path $EnvFile -Key "QUEUE_CONNECTION" -Value "sync"
    }

    $mailpitChoice = Read-Choice -Prompt "Start Mailpit with Docker?" -Allowed @("yes", "no") -Default "no"
    if ($mailpitChoice -eq "yes")
    {
        Start-DockerContainer -Name "koakademy-mailpit" -Image "axllent/mailpit:latest" -Arguments @(
            "-p", "1025:1025",
            "-p", "8025:8025"
        )

        Set-EnvValue -Path $EnvFile -Key "MAIL_MAILER" -Value "smtp"
        Set-EnvValue -Path $EnvFile -Key "MAIL_HOST" -Value "127.0.0.1"
        Set-EnvValue -Path $EnvFile -Key "MAIL_PORT" -Value "1025"
        Set-EnvValue -Path $EnvFile -Key "MAIL_USERNAME" -Value "null"
        Set-EnvValue -Path $EnvFile -Key "MAIL_PASSWORD" -Value "null"
        Set-EnvValue -Path $EnvFile -Key "MAIL_ENCRYPTION" -Value "null"
    } else
    {
        Set-EnvValue -Path $EnvFile -Key "MAIL_MAILER" -Value "log"
    }
} else
{
    Write-Warn "Docker is not installed or is not running."
    Write-Info "Using SQLite, database cache, sync queues, and log mail by default."

    Set-EnvValue -Path $EnvFile -Key "DB_CONNECTION" -Value "sqlite"
    Set-EnvValue -Path $EnvFile -Key "DB_DATABASE" -Value "database/database.sqlite"
    Set-EnvValue -Path $EnvFile -Key "CACHE_STORE" -Value "database"
    Set-EnvValue -Path $EnvFile -Key "QUEUE_CONNECTION" -Value "sync"
    Set-EnvValue -Path $EnvFile -Key "MAIL_MAILER" -Value "log"

    $sqlitePath = Join-Path $ProjectRoot "database\database.sqlite"
    if (-not (Test-Path $sqlitePath))
    {
        New-Item -Path $sqlitePath -ItemType File -Force | Out-Null
        Write-Success "Created SQLite database at database/database.sqlite"
    }
}
}

# -----------------------------------------------------------------------------
# Step 4: Install Composer dependencies
# -----------------------------------------------------------------------------
Write-Section "Composer Dependencies"

Set-Location $ProjectRoot
Write-Info "Installing Composer packages..."
Write-Info "This may take a few minutes..."

$composerArgs = @("install", "--ignore-platform-req=ext-pcntl", "--ignore-platform-req=ext-posix")
$composerProcess = Start-Process composer -ArgumentList $composerArgs -NoNewWindow -Wait -PassThru

if ($composerProcess.ExitCode -eq 0)
{
    Write-Success "Composer dependencies installed"
} else
{
    Write-ErrorMsg "Failed to install Composer dependencies"
    exit 1
}

# Generate APP_KEY via Artisan if not set
$EnvContent = Get-Content $EnvFile -Raw
$AppKeyLine = ($EnvContent -split "`r?`n") | Where-Object { $_ -match '^APP_KEY=' } | Select-Object -First 1
$HasAppKey = $false
if ($AppKeyLine)
{
    $AppKeyValue = ($AppKeyLine -replace '^APP_KEY=', '').Trim()
    $HasAppKey = -not [string]::IsNullOrWhiteSpace($AppKeyValue)
}

if (-not $SkipEnvSetup)
{
    if (-not $HasAppKey)
    {
        Write-Info "Generating APP_KEY using Artisan..."
        Set-Location $ProjectRoot
        $keyGenerateOutput = php artisan key:generate --force 2>&1

        if ($LASTEXITCODE -eq 0)
        {
            Write-Success "APP_KEY generated successfully"
        } else
        {
            Write-ErrorMsg "Failed to generate APP_KEY"
            Write-Host $keyGenerateOutput
            exit 1
        }
    } else
    {
        Write-Success "APP_KEY already exists"
    }
} else
{
    if ($HasAppKey)
    {
        Write-Success "APP_KEY already exists (env setup skipped)"
    } else
    {
        Write-Warn "APP_KEY is missing and env setup was skipped - run 'php artisan key:generate' manually"
    }
}

# ─────────────────────────────────────────────────────
# Step 4: Install npm dependencies
# ─────────────────────────────────────────────────────
if (-not $SkipNpm)
{
    Write-Section "NPM Dependencies"

    Write-Info "Installing npm packages..."
    Write-Info "This may take a few minutes..."

    Set-Location $ProjectRoot

    try
    {
        $npmOutput = npm install 2>&1
        if ($LASTEXITCODE -eq 0)
        {
            Write-Success "npm dependencies installed"
        } else
        {
            Write-Warn "npm install had some issues, but continuing..."
            Write-Host $npmOutput
        }
    } catch
    {
        Write-Warn "npm install failed, but continuing..."
    }
} else
{
    Write-Info "Skipping npm install (-SkipNpm flag set)"
}

# ─────────────────────────────────────────────────────
# Step 5: Herd domain configuration
# ─────────────────────────────────────────────────────
if ($HerdInstalled)
{
    Write-Section "Herd Domain Configuration"

    Write-Info "Configuring Herd domains..."
    Set-Location $ProjectRoot

    $LinkedCount = 0
    $LinkExisting = 0
    $ExistingLinksOutput = herd links 2>&1

    foreach ($domain in $Domains)
    {
        try
        {
            if ($ExistingLinksOutput -match [Regex]::Escape($domain))
            {
                Write-Info "Domain already linked: $domain"
                $LinkExisting++
                continue
            }

            $linkOutput = herd link $domain 2>&1

            if ($LASTEXITCODE -eq 0)
            {
                Write-Success "Linked domain to project: $domain"
                $LinkedCount++
                $ExistingLinksOutput = "$ExistingLinksOutput`n$linkOutput"
            } elseif ($linkOutput -match "already" -or $linkOutput -match "exists" -or $linkOutput -match "linked")
            {
                Write-Info "Domain already linked: $domain"
                $LinkExisting++
            } else
            {
                Write-Warn "Could not link domain: $domain"
                Write-Host $linkOutput
            }
        } catch
        {
            Write-Warn "Error linking ${domain}: $_"
        }
    }

    if ($LinkedCount -gt 0)
    {
        Write-Success "Linked $LinkedCount domain(s)"
    }
    if ($LinkExisting -gt 0)
    {
        Write-Success "$LinkExisting domain(s) were already linked"
    }

    Write-Success "Project directory: $ProjectRoot"

    # ─────────────────────────────────────────────────────
    # Step 6: Secure domains with HTTPS
    # ─────────────────────────────────────────────────────
    Write-Section "SSL Certificate Setup"

    Write-Info "Securing domains with Herd SSL certificates..."
    $SecuredCount = 0
    $AlreadySecured = 0
    $SecuredSitesOutput = herd secured 2>&1

    foreach ($domain in $Domains)
    {
        try
        {
            if ($SecuredSitesOutput -match [Regex]::Escape($domain))
            {
                Write-Info "Already secured: $domain"
                $AlreadySecured++
                continue
            }

            $secureOutput = herd secure $domain 2>&1

            if ($LASTEXITCODE -eq 0)
            {
                Write-Success "Secured: $domain"
                $SecuredCount++
                $SecuredSitesOutput = "$SecuredSitesOutput`n$secureOutput"
            } elseif ($secureOutput -match "already secured" -or $secureOutput -match "already")
            {
                Write-Info "Already secured: $domain"
                $AlreadySecured++
            } else
            {
                Write-Warn "Failed to secure: $domain"
                Write-Host $secureOutput
            }
        } catch
        {
            Write-Warn "Error securing ${domain}: $_"
        }
    }

    if ($SecuredCount -gt 0)
    {
        Write-Success "Secured $SecuredCount new domain(s) with HTTPS"
    }
    if ($AlreadySecured -gt 0)
    {
        Write-Success "$AlreadySecured domain(s) were already secured"
    }
} else
{
    Write-Section "Herd Domain Configuration"

    Write-Warn "Herd is not installed - skipping domain linking and SSL setup"
    Write-Warn "When running without Herd, use: php artisan serve"
    Write-Warn "To access the portal, you may need to add hosts file entries:"
    foreach ($domain in $Domains)
    {
        Write-Host "  127.0.0.1 $domain" -ForegroundColor Yellow
    }
}

# ─────────────────────────────────────────────────────
# Step 7: Run migrations
# ─────────────────────────────────────────────────────
if (-not $SkipMigrations)
{
    if ($SkipEnvSetup)
    {
        Write-Info "Skipping database migrations (environment setup was skipped)"
        Write-Info "Run migrations manually with: php artisan migrate"
    } else
    {
        Write-Section "Database Setup"

        Write-Info "Running database migrations..."
        Set-Location $ProjectRoot

        try
        {
            $migrateOutput = php artisan migrate --force 2>&1
            Write-Success "Database migrations completed"
        } catch
        {
            Write-Warn "Migration had some issues: $_"
        }
    }
} else
{
    Write-Info "Skipping database migrations (-SkipMigrations flag set)"
}

# ─────────────────────────────────────────────────────
# Step 8: Build frontend assets
# ─────────────────────────────────────────────────────
Write-Section "Frontend Assets Build"

Write-Info "Building frontend assets..."
Set-Location $ProjectRoot

try
{
    $buildOutput = npm run build 2>&1
    Write-Success "Frontend assets built successfully"
} catch
{
    Write-Warn "Frontend build had some issues, but continuing..."
    Write-Host $buildOutput
}

# ─────────────────────────────────────────────────────
# Step 9: Summary
# ─────────────────────────────────────────────────────
Write-Section "Setup Complete!"

Write-Host "Your development environment is ready!" -ForegroundColor Green
Write-Host ""

if ($HerdInstalled)
{
    Write-Host "Access your application at:" -ForegroundColor Cyan
    Write-Host "  Portal:            https://$PortalHost"
    Write-Host "  Admin:             https://$AdminHost"
    Write-Host ""

    Write-Host "Herd Status:" -ForegroundColor Cyan
    try
    {
        herd status 2>&1 | ForEach-Object { Write-Host "  $_" }
    } catch
    {
        Write-Host "  Herd is running" -ForegroundColor Green
    }
    Write-Host ""
} else
{
    Write-Host "Running without Herd - use the built-in server:" -ForegroundColor Cyan
    Write-Host "  php artisan serve"
    Write-Host ""
    Write-Host "Access at:  http://localhost:8000" -ForegroundColor Yellow
    Write-Host ""
    Write-Warn "NOTE: Domain-based routing (portal/admin) requires Herd"
    Write-Warn "Install Herd from: https://herd.laravel.com/"
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review and configure .env file as needed"
if ($HerdInstalled)
{
    Write-Host "  2. Start Octane for better performance: php artisan octane:start"
    Write-Host "  3. For development with hot-reload, run: npm run dev"
    Write-Host "  4. Or simply access your app - Herd is already serving it!"
} else
{
    Write-Host "  2. Run: php artisan serve"
    Write-Host "  3. For development with hot-reload, run: npm run dev"
}
Write-Host ""

if ($HerdInstalled)
{
    Write-Host "Note:" -ForegroundColor Yellow
    Write-Host "  All domains are secured with HTTPS via Herd"
    Write-Host "  Your application is ready to use at the URLs above"
    Write-Host ""
}

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  php artisan migrate:fresh --seed    - Fresh migration with seeding"
Write-Host "  php artisan tinker                 - Interactive REPL"
Write-Host "  php artisan queue:work             - Process queue jobs"
if ($HerdInstalled)
{
    Write-Host "  php artisan octane:start           - Start Octane server"
    Write-Host "  herd restart                       - Restart Herd"
}
Write-Host ""

Write-Host "Happy coding!" -ForegroundColor Green
Write-Host ""
