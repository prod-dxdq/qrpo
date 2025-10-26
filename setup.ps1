Param(
  [switch]$SkipAzureCli
)

Write-Host "==============================" -ForegroundColor Cyan
Write-Host " QRPO Full Environment Setup " -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Verify tools
function Require($cmd, $name) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "$name not found (`$cmd`). Please install it and re-run."
    exit 1
  }
}

Require "python" "Python"
Require "npm" "Node.js (npm)"
Require "code" "Visual Studio Code (code CLI)"

# Backend venv + deps
Push-Location backend
python -m venv .venv
$activate = ".\.venv\Scripts\Activate.ps1"
& $activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate
Pop-Location

# Frontend deps
Push-Location frontend
npm install
Pop-Location

# VS Code extensions
$extensions = @(
  "ms-python.python",
  "ms-python.vscode-pylance",
  "ms-toolsai.jupyter",
  "dbaeumer.vscode-eslint",
  "esbenp.prettier-vscode",
  "dsznajder.es7-react-js-snippets",
  "bradlc.vscode-tailwindcss",
  "rangav.vscode-thunder-client",
  "ms-vscode.vscode-node-azure-pack",
  "mtxr.sqltools",
  "pkief.material-icon-theme",
  "enkia.tokyo-night",
  "yzhang.markdown-all-in-one"
)
foreach ($ext in $extensions) {
  Write-Host "Installing VS Code extension: $ext"
  code --install-extension $ext | Out-Null
}

# Azure CLI (optional, default install)
if (-not $SkipAzureCli) {
  Write-Host "Installing Azure CLI..." -ForegroundColor Yellow
  # Try winget first
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install -e --id Microsoft.AzureCLI --accept-source-agreements --accept-package-agreements
  } else {
    # Fallback to MSI
    $msi = "$env:TEMP\azurecli.msi"
    Invoke-WebRequest -Uri "https://aka.ms/installazurecliwindows" -OutFile $msi
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$msi`" /qn"
    Remove-Item $msi -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "---------------------------------------"
Write-Host "Run backend:"
Write-Host "  cd backend; .\.venv\Scripts\Activate.ps1; uvicorn api.main:app --reload" -ForegroundColor Gray
Write-Host "Run frontend:"
Write-Host "  cd frontend; npm run dev" -ForegroundColor Gray
Write-Host "---------------------------------------"
