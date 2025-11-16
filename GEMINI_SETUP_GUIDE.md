# How to Set Up Google Gemini API

## Step 1: Get Your Gemini API Key (FREE)

1. **Visit Google AI Studio:**
   - Go to: https://aistudio.google.com/app/apikey
   - Or: https://makersuite.google.com/app/apikey

2. **Sign In:**
   - Sign in with your Google account

3. **Create API Key:**
   - Click "Create API Key"
   - Select "Create API key in new project" (or choose existing project)
   - Copy your API key (it starts with `AIza...`)

4. **Store API Key:**
   - Create a `.env` file in your project root
   - Add: `VITE_API_KEY=YOUR_API_KEY_HERE`
   - **Important:** Never commit the `.env` file to git (it should be in `.gitignore`)

## Step 2: Gemini API Models Available

Google offers several Gemini models (all FREE tier available):

- **`gemini-2.0-flash-exp`** - Latest, fast, optimized (Recommended)
- **`gemini-1.5-flash`** - Fast, cost-efficient
- **`gemini-1.5-pro`** - More capable, slower
- **`gemini-1.5-flash-8b`** - Lightweight, ultra-fast

## Step 3: Free Tier Limits

- **Free tier:** 15 requests per minute (RPM)
- **No cost** for reasonable usage
- Good for personal projects and testing

## Step 4: Implementation

The code has been updated to use Gemini API. Just:

1. Add your API key to `.env` file
2. Restart your development server
3. Start chatting!

## API Endpoint

Gemini API endpoint:
```
https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}
```

Example:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY
```

