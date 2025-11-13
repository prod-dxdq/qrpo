# Install OpenAI package for AI chatbot
Write-Host "🤖 Installing OpenAI package for AI Chatbot..." -ForegroundColor Cyan

# Navigate to backend
Set-Location "D:\CODE\qrpo\backend"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\.venv\Scripts\Activate.ps1

# Install openai
Write-Host "Installing openai package..." -ForegroundColor Yellow
pip install openai

Write-Host ""
Write-Host "✅ OpenAI package installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Get API key from https://platform.openai.com/api-keys" -ForegroundColor White
Write-Host "2. Set environment variable:" -ForegroundColor White
Write-Host '   $env:OPENAI_API_KEY="sk-your-key-here"' -ForegroundColor Yellow
Write-Host "3. Restart backend:" -ForegroundColor White
Write-Host "   uvicorn api.main:app --reload --port 8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Your AI chatbot is ready to answer ANY question!" -ForegroundColor Green
