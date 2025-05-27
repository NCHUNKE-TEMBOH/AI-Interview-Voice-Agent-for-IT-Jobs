// This script verifies that the OpenRouter API key is working correctly
require('dotenv').config();
const { OpenAI } = require('openai');

async function verifyApiKey() {
  console.log('Verifying OpenRouter API key...');
  
  // Check if the API key is defined
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY is not defined in environment variables');
    console.log('Please add your OpenRouter API key to the .env file:');
    console.log('OPENROUTER_API_KEY=your-api-key-here');
    return false;
  }
  
  console.log(`API key found: ${process.env.OPENROUTER_API_KEY.substring(0, 10)}...`);
  
  // Initialize the OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://interview-voice-agent.vercel.app',
      'X-Title': 'AI Interview Scheduler',
    },
  });
  
  try {
    // Make a simple request to verify the API key
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Hello, this is a test message to verify my API key is working.'
        }
      ],
      max_tokens: 50,
    });
    
    if (response.choices && response.choices.length > 0) {
      console.log('SUCCESS: API key is valid and working correctly');
      console.log('Response:', response.choices[0].message.content);
      return true;
    } else {
      console.error('ERROR: Received an invalid response from OpenRouter');
      console.log('Response:', response);
      return false;
    }
  } catch (error) {
    console.error('ERROR: Failed to connect to OpenRouter API');
    console.error('Error details:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
}

// Run the verification
verifyApiKey()
  .then(isValid => {
    if (isValid) {
      console.log('API key verification completed successfully');
      process.exit(0);
    } else {
      console.log('API key verification failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during verification:', error);
    process.exit(1);
  });
