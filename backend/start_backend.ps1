$ErrorActionPreference = "Stop"

$venvPath = Join-Path $PSScriptRoot ".venv"
if (-not (Test-Path $venvPath)) {
    python -m venv $venvPath
}

$pythonExe = Join-Path $venvPath "Scripts\python.exe"
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
& $pythonExe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
