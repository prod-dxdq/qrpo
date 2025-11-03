# Start QRPO Backend Server
# This script activates the virtual environment, sets PYTHONPATH, and starts uvicorn

$BackendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BackendPath

Write-Host "🚀 Starting QRPO Backend Server..." -ForegroundColor Cyan
Write-Host "📁 Backend directory: $BackendPath" -ForegroundColor Gray

# Activate virtual environment
& ".\.venv\Scripts\Activate.ps1"

# Set PYTHONPATH to backend directory
$env:PYTHONPATH = $BackendPath

# Start uvicorn server
Write-Host "🌐 Server will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "📖 API docs at: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn api.main:app --reload --port 8000
