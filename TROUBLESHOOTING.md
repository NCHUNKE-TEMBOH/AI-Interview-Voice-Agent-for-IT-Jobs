# Troubleshooting Guide

This guide will help you resolve common issues with the AI Interview application.

## Interview Process Issues

### Microphone Not Working

If your microphone is not being detected or not working during the interview:

1. **Check Browser Permissions**:
   - Make sure you've granted microphone permissions to the website
   - Click the lock icon in your browser's address bar and ensure microphone access is allowed

2. **Test Your Microphone**:
   - Go to [https://mictests.com/](https://mictests.com/) to test if your microphone is working properly
   - Try using a different microphone if available

3. **Browser Compatibility**:
   - Use Chrome or Edge for best compatibility
   - Firefox and Safari may have issues with the voice API

4. **Restart Your Browser**:
   - Close and reopen your browser
   - Try in an incognito/private window

### AI Not Responding to Voice

If the AI interviewer doesn't respond to your voice:

1. **Check for Background Noise**:
   - Ensure you're in a quiet environment
   - Speak clearly and at a normal volume

2. **Wait for the AI to Finish**:
   - Make sure the AI has finished speaking before you respond
   - Look for visual cues that it's your turn to speak

3. **Check Network Connection**:
   - Ensure you have a stable internet connection
   - Try connecting to a different network if possible

4. **Refresh the Page**:
   - Sometimes refreshing the page and starting over can resolve issues

### Interview Ends Unexpectedly

If the interview ends abruptly:

1. **Check for Timeouts**:
   - Long pauses might cause the system to think the interview is over
   - Try to respond promptly to questions

2. **Check Browser Console**:
   - Press F12 to open developer tools
   - Look for error messages in the Console tab
   - Report any errors to support

## API Key Issues

If you're experiencing issues with API keys:

1. **Verify OpenRouter API Key**:
   - Run `node verify-api-key.js` to check if your OpenRouter API key is valid
   - Make sure the key is correctly set in your .env file

2. **Verify Vapi API Key**:
   - Run `node verify-vapi-key.js` to check if your Vapi API key is valid
   - Ensure the key is correctly set in your .env file

3. **Check for Rate Limits**:
   - API providers may have rate limits that could be affecting your application
   - Check your API usage dashboard for any limits or restrictions

## Database Issues

If you're experiencing database-related issues:

1. **Run Database Scripts**:
   - Execute the SQL scripts in the project to fix database relationships:
     ```
     psql -U your_username -d your_database -f fix_relationships.sql
     psql -U your_username -d your_database -f fix_database_issues.sql
     ```
   - Or run them directly in the Supabase SQL Editor

2. **Check Supabase Policies**:
   - Ensure your Row Level Security (RLS) policies are correctly set up
   - Verify that the authenticated user has the necessary permissions

3. **Verify Database Structure**:
   - Make sure all required tables and columns exist
   - Check for any missing foreign key relationships

## Getting Help

If you continue to experience issues:

1. **Check the Console Logs**:
   - Press F12 to open developer tools
   - Go to the Console tab
   - Copy any error messages you see

2. **Create a Detailed Report**:
   - Describe the steps to reproduce the issue
   - Include any error messages from the console
   - Note your browser and operating system

3. **Contact Support**:
   - Submit your detailed report to support
   - Include screenshots if possible
