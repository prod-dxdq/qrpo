# Quantum-Enhanced RF Portfolio Optimizer (QRPO)

Research-grade starter that treats market time series like RF signals, extracts spectral features, 
and runs classical vs quantum portfolio optimization. Full-stack: FastAPI backend + Next.js frontend.
Includes VS Code workspace and Windows PowerShell setup script.

## Prereqs
- Windows 10/11 with PowerShell
- Python 3.10+
- Node.js 18+ (or 20+)
- Visual Studio Code

## One-time setup (Windows)
```
# In PowerShell from the project root:
./setup.ps1
```

## Run
**Backend**
```
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn api.main:app --reload --port 8000
```

**Frontend**
```
cd frontend
npm run dev
```

## Environment
Create `frontend/.env.local` if needed:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Folders
- `backend/` — FastAPI + ML + Quantum (Qiskit) + database scaffold
- `frontend/` — Next.js + Tailwind + ESLint + Prettier
- `azure/` — Deployment scaffolding (no secrets)
- `qrpo.code-workspace` — VS Code workspace with extension recommendations
- `setup.ps1` — Installs Python deps, Node deps, VS Code extensions, Azure CLI (Windows)
