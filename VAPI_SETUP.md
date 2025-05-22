# Setting Up Vapi for Voice Interviews

This guide will walk you through the process of setting up a Vapi account and getting an API key for the voice interview feature.

## Step 1: Create a Vapi Account

1. Go to [https://vapi.ai](https://vapi.ai) and click on "Sign Up" or "Get Started"
2. Create an account using your email or Google/GitHub account
3. Complete the registration process

## Step 2: Create a New Project

1. Once logged in, click on "Create Project" or "New Project"
2. Name your project "AI Interview Assistant" or something similar
3. Select the appropriate settings for your project:
   - Voice: Jennifer (or any voice you prefer)
   - Model: GPT-4 (recommended)
   - Transcriber: Deepgram

## Step 3: Get Your API Key

1. After creating the project, go to the "API Keys" or "Settings" section
2. Look for the "Public API Key" - this is what you'll need for the application
3. Copy this key to your clipboard

## Step 4: Update Your .env File

1. Open the `.env` file in your project
2. Find the line that says `NEXT_PUBLIC_VAPI_PUBLIC_KEY=...`
3. Replace the existing value with your new API key:
   ```
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-new-api-key-here
   ```
4. Save the file

## Step 5: Restart Your Application

1. Stop your application if it's running
2. Start it again with `npm run dev`
3. The voice interview feature should now work correctly

## Troubleshooting

If you're still experiencing issues:

1. **Check Your API Key**: Make sure you're using the Public API Key, not the Secret Key
2. **Verify Your Account**: Ensure your Vapi account is properly set up and verified
3. **Check Usage Limits**: Vapi may have usage limits on free accounts
4. **Browser Compatibility**: Try using Chrome or Edge for best compatibility
5. **Microphone Access**: Ensure your browser has permission to access your microphone

## Vapi Documentation

For more information about Vapi and its features, check out their documentation:
- [Vapi Documentation](https://docs.vapi.ai/)
- [Vapi Web SDK](https://docs.vapi.ai/web-sdk)
- [Vapi API Reference](https://docs.vapi.ai/api-reference)
