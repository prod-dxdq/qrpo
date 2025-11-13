# AI Chatbot Setup Instructions

## 🤖 Enable AI-Powered Responses

Your finance chatbot is ready, but needs an OpenAI API key to provide intelligent responses.

### Quick Setup (5 minutes):

#### 1. Get OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Sign up or log in
- Click "Create new secret key"
- Copy the key (starts with `sk-...`)

#### 2. Install OpenAI Package
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install openai
```

#### 3. Set Environment Variable

**Option A: For current session (temporary)**
```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
```

**Option B: For permanent setup**
```powershell
# Add to PowerShell profile
$profilePath = $PROFILE.CurrentUserAllHosts
Add-Content $profilePath '$env:OPENAI_API_KEY="sk-your-key-here"'
```

**Option C: Create .env file (recommended)**
```powershell
# In backend/ directory
echo 'OPENAI_API_KEY=sk-your-key-here' > .env
```

Then update `main.py` to load from .env:
```python
from dotenv import load_dotenv
load_dotenv()  # Add this at top of main.py
```

#### 4. Restart Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH="$pwd"
$env:OPENAI_API_KEY="sk-your-key-here"  # If using Option A
uvicorn api.main:app --reload --port 8000
```

### 🧪 Test the Chatbot

1. Open the app: http://localhost:3000
2. Click the bot icon (bottom-right)
3. Ask: **"What stocks should I buy right now?"**
4. Get AI-powered response!

### 💰 Cost Estimate

- Model: GPT-4o-mini (fast & cheap)
- Cost: ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Average conversation: ~$0.01-0.02
- 100 questions ≈ $1-2

### ⚠️ Without API Key

The chatbot will still work but show this message:
```
⚠️ OpenAI API key not configured. 
Please set OPENAI_API_KEY environment variable.
```

### 🔒 Security Best Practices

1. **Never commit API keys to Git**
   ```bash
   # Add to .gitignore
   .env
   *.key
   ```

2. **Use environment variables** (not hardcoded)

3. **Set spending limits** on OpenAI dashboard

4. **Rotate keys regularly** (every 90 days)

### 🚀 What the Chatbot Can Do

Once configured, it can answer ANY question:

**Stock Recommendations:**
- "What stocks should I buy now?"
- "Should I sell my TSLA shares?"
- "Best tech stocks for 2025?"

**Portfolio Advice:**
- "How do I build a $10k portfolio?"
- "What's a good asset allocation for retirement?"
- "Should I rebalance my portfolio?"

**Market Analysis:**
- "What's happening in the market today?"
- "Is this a good time to invest?"
- "Explain the current bull/bear market"

**Technical Questions:**
- "What is quantum portfolio optimization?"
- "How does QAOA work?"
- "Explain Modern Portfolio Theory"

### 🔧 Troubleshooting

**Error: "Import openai could not be resolved"**
```powershell
pip install openai
```

**Error: "Invalid API key"**
- Check key starts with `sk-`
- Verify it's active on OpenAI dashboard
- Make sure no extra spaces

**Error: "Connection refused"**
- Backend must be running on port 8000
- Check CORS is enabled in FastAPI

**Slow responses?**
- Normal (GPT-4o-mini takes 2-5 seconds)
- Using streaming would make it faster

### 📚 Next Steps

**Enhance the Chatbot:**
1. Add conversation memory (save to localStorage)
2. Add voice input (speech-to-text)
3. Add copy button for responses
4. Show typing animation
5. Add "regenerate response" button

**Advanced Features:**
1. Switch models (GPT-4, Claude, Gemini)
2. Adjust temperature for creativity
3. Add RAG (search your documents)
4. Fine-tune on your portfolio data
5. Add real-time market data to context

---

## ✅ You're All Set!

Once you set the API key, your chatbot becomes a **real AI financial advisor** that can answer any question! 🎉
