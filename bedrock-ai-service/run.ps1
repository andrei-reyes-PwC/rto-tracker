$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot
$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Creating the Python virtual environment..."
    py -3 -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create .venv. Install Python 3.11 or newer and make sure the 'py' launcher is available."
    }
}

if (-not (Test-Path (Join-Path $PSScriptRoot ".env"))) {
    Copy-Item (Join-Path $PSScriptRoot ".env.example") (Join-Path $PSScriptRoot ".env")
    Write-Host "Created .env from .env.example. Review its AWS region and model settings if needed."
}

& $python -c "import importlib.util, sys; sys.exit(0 if all(importlib.util.find_spec(name) for name in ('uvicorn', 'httpx', 'jwt', 'tzdata')) else 1)" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing service dependencies..."
    & $python -m pip install .
    if ($LASTEXITCODE -ne 0) {
        throw "Dependency installation failed. Check your internet connection and Python installation."
    }
}

Write-Host "Starting the Bedrock AI service at http://127.0.0.1:8010 (Ctrl+C to stop)."
& $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
exit $LASTEXITCODE
