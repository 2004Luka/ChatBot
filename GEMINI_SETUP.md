# 🚀 How to Switch to Google Gemini API

## ✅ Step-by-Step Setup Guide

### Step 1: Get Your FREE Gemini API Key

1. **Visit Google AI Studio:**
   - Go to: **https://aistudio.google.com/app/apikey**
   - Or: **https://makersuite.google.com/app/apikey**

2. **Sign In:**
   - Sign in with your Google account (Gmail account works)

3. **Create API Key:**
   - Click **"Create API Key"** button
   - Select **"Create API key in new project"** (or choose existing project)
   - Copy your API key (it looks like: `AIzaSy...`)

4. **Important Notes:**
   - ✅ **FREE tier:** 15 requests per minute (RPM)
   - ✅ **No credit card required**
   - ✅ **Perfect for personal projects and testing**

### Step 2: Add API Key to Your Project

1. **Create `.env` file** in the root of your project (same level as `package.json`):
   ```
   VITE_API_KEY=your_actual_api_key_here
   ```

2. **Replace `your_actual_api_key_here`** with the API key you copied

3. **Example:**
   ```
   VITE_API_KEY=AIzaSyABC123xyz789...
   ```

### Step 3: Restart Your Development Server

1. **Stop your current server** (if running) - Press `Ctrl+C`

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Why?** Environment variables are loaded when the server starts

### Step 4: Test It!

1. Open your app in the browser
2. Type a message
3. The app will now use **Google Gemini** instead of the previous models!

---

## 📝 What Changed in the Code

### Models Now Using:
- **Primary Model:** `gemini-2.0-flash-exp` (Fast and latest)
- **Alternative Options Available:**
  - `gemini-1.5-flash` - Fast and reliable
  - `gemini-1.5-pro` - More capable but slower
  - `gemini-1.5-flash-8b` - Ultra-fast lightweight

### Code Changes:
- ✅ Replaced OpenRouter API with Google Gemini API
- ✅ Updated API endpoint to Gemini format
- ✅ Simplified model selection (one model for all tasks)
- ✅ Added conversation history support
- ✅ Better error handling for Gemini-specific errors

---

## 🔧 Switching Models (Optional)

If you want to use a different Gemini model, edit `src/utils/chatUtils.ts`:

```typescript
export const GEMINI_MODEL = "gemini-1.5-flash"; // Change this line
```

Available models:
- `gemini-2.0-flash-exp` - Latest experimental
- `gemini-1.5-flash` - Fast and reliable
- `gemini-1.5-pro` - More capable
- `gemini-1.5-flash-8b` - Ultra-lightweight

---

## ❗ Troubleshooting

### Error: "API key is not set"
- Make sure `.env` file exists in project root
- Check that it contains: `VITE_API_KEY=your_key`
- Restart your dev server after creating/editing `.env`

### Error: "Invalid API key"
- Double-check your API key in `.env` file
- Make sure there are no extra spaces or quotes
- Verify the key works at https://aistudio.google.com

### Error: "Rate limit exceeded"
- Gemini free tier: 15 requests per minute
- Wait a minute and try again
- Consider upgrading for higher limits

---

## 🎉 You're Done!

Your app is now using **Google Gemini** instead of the previous models. Enjoy your free AI chat assistant!

