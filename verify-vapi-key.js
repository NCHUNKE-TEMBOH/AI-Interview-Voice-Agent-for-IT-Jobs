// This script verifies that the Vapi API key is working correctly
require('dotenv').config();
const fetch = require('node-fetch');

async function verifyVapiKey() {
  console.log('Verifying Vapi API key...');
  
  // Check if the API key is defined
  const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!apiKey) {
    console.error('ERROR: NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined in environment variables');
    console.log('Please add your Vapi API key to the .env file:');
    console.log('NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-api-key-here');
    return false;
  }
  
  console.log(`API key found: ${apiKey}`);
  
  try {
    // Make a request to the Vapi API to check if the key is valid
    const response = await fetch('https://api.vapi.ai/api/assistant/voices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('SUCCESS: API key is valid and working correctly');
      console.log(`Found ${data.length} available voices`);
      return true;
    } else {
      console.error('ERROR: Invalid API key or API request failed');
      console.error('Response status:', response.status);
      console.error('Response text:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('ERROR: Failed to connect to Vapi API');
    console.error('Error details:', error.message);
    return false;
  }
}

// Run the verification
verifyVapiKey()
  .then(isValid => {
    if (isValid) {
      console.log('Vapi API key verification completed successfully');
      process.exit(0);
    } else {
      console.log('Vapi API key verification failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during verification:', error);
    process.exit(1);
  });
