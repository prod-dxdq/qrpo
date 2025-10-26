#!/usr/bin/env bash
set -e

echo "=============================="
echo " QRPO Full Environment Setup "
echo "=============================="

# Check prerequisites
command -v code >/dev/null 2>&1 || { echo >&2 "VS Code not found. Install it first."; exit 1; }
command -v python >/dev/null 2>&1 || { echo >&2 "Python not found."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "Node.js (npm) not found."; exit 1; }

echo "Creating Python virtual environment..."
cd backend
python -m venv .venv
source .venv/bin/activate || source .venv/Scripts/activate
echo "Installing Python dependencies..."
pip install --upgrade pip wheel setuptools
pip install -r requirements.txt
deactivate
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Installing recommended VS Code extensions..."
EXTENSIONS=(
  ms-python.python
  ms-python.vscode-pylance
  ms-toolsai.jupyter
  dbaeumer.vscode-eslint
  esbenp.prettier-vscode
  dsznajder.es7-react-js-snippets
  bradlc.vscode-tailwindcss
  rangav.vscode-thunder-client
  ms-vscode.vscode-node-azure-pack
  mtxr.sqltools
  pkief.material-icon-theme
  enkia.tokyo-night
  yzhang.markdown-all-in-one
)
for ext in "${EXTENSIONS[@]}"; do
  echo "Installing VS Code extension: $ext"
  code --install-extension "$ext" || echo "⚠️  Failed to install $ext (may already exist)"
done

echo ""
echo "✅ Setup complete!"
echo "---------------------------------------"
echo "To run backend:  cd backend && source .venv/bin/activate && uvicorn api.main:app --reload"
echo "To run frontend: cd frontend && npm run dev"
echo "---------------------------------------"
