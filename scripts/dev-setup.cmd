@echo off

setlocal



set "SCRIPT_DIR=%~dp0"

set "PS_SCRIPT=%SCRIPT_DIR%dev-setup.ps1"
set "HERD_BIN=%USERPROFILE%\.config\herd\bin"



if not exist "%PS_SCRIPT%" (

    echo [ERROR] Could not find "%PS_SCRIPT%".

    exit /b 1

)



if exist "%HERD_BIN%" (
    set "PATH=%HERD_BIN%;%PATH%"
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

set "EXIT_CODE=%ERRORLEVEL%"



endlocal & exit /b %EXIT_CODE%
