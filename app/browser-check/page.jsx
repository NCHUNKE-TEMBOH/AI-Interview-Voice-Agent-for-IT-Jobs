"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function BrowserCheck() {
  const [browserInfo, setBrowserInfo] = useState({});
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  const [microphoneDevices, setMicrophoneDevices] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Get browser information
    const browser = {
      userAgent: navigator.userAgent,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
    };
    
    // Detect browser
    let browserName = "Unknown";
    if (navigator.userAgent.indexOf("Chrome") !== -1) {
      browserName = "Google Chrome";
    } else if (navigator.userAgent.indexOf("Firefox") !== -1) {
      browserName = "Mozilla Firefox";
    } else if (navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident") !== -1) {
      browserName = "Internet Explorer";
    } else if (navigator.userAgent.indexOf("Edge") !== -1 || navigator.userAgent.indexOf("Edg") !== -1) {
      browserName = "Microsoft Edge";
    } else if (navigator.userAgent.indexOf("Safari") !== -1) {
      browserName = "Safari";
    } else if (navigator.userAgent.indexOf("Opera") !== -1 || navigator.userAgent.indexOf("OPR") !== -1) {
      browserName = "Opera";
    }
    
    setBrowserInfo({
      ...browser,
      browserName
    });
    
    // Check for MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Your browser does not support the MediaDevices API. Please use a modern browser like Chrome or Edge.');
    }
  }, []);
  
  const checkMicrophonePermission = async () => {
    try {
      setErrorMessage('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get all audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      setMicrophoneDevices(audioInputs);
      setMicrophonePermission('granted');
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicrophonePermission('denied');
      setErrorMessage(`Microphone access denied: ${error.message}`);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Browser Compatibility Check</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
          <div className="space-y-2">
            <p><strong>Browser:</strong> {browserInfo.browserName}</p>
            <p><strong>User Agent:</strong> {browserInfo.userAgent}</p>
            <p><strong>Platform:</strong> {browserInfo.platform}</p>
            <p><strong>Language:</strong> {browserInfo.language}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Microphone Access</h2>
          
          {microphonePermission === 'unknown' ? (
            <div>
              <p className="mb-4">Click the button below to check microphone access:</p>
              <Button onClick={checkMicrophonePermission}>
                Check Microphone Access
              </Button>
            </div>
          ) : microphonePermission === 'granted' ? (
            <div>
              <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                ✅ Microphone access granted
              </div>
              
              <h3 className="font-medium mb-2">Available Microphones:</h3>
              {microphoneDevices.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {microphoneDevices.map((device, index) => (
                    <li key={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No microphone devices found.</p>
              )}
              
              <Button 
                className="mt-4"
                onClick={checkMicrophonePermission}
              >
                Check Again
              </Button>
            </div>
          ) : (
            <div>
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                ❌ Microphone access denied
              </div>
              <p className="mb-4">Please check your browser settings and ensure that microphone access is allowed for this site.</p>
              <Button onClick={checkMicrophonePermission}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">1. Check Browser Permissions</h3>
            <p>Make sure your browser has permission to access your microphone:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Click the lock/info icon in your browser's address bar</li>
              <li>Ensure microphone access is set to "Allow"</li>
              <li>If it's already allowed, try setting it to "Block" and then back to "Allow"</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">2. Try a Different Browser</h3>
            <p>If you're having issues, try using one of these browsers:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Google Chrome (recommended)</li>
              <li>Microsoft Edge</li>
              <li>Mozilla Firefox</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">3. Check System Settings</h3>
            <p>Ensure your microphone is properly configured in your system:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Check if your microphone is muted in system settings</li>
              <li>Make sure the correct microphone is set as the default device</li>
              <li>Try unplugging and reconnecting your microphone</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">4. Clear Browser Data</h3>
            <p>Sometimes clearing browser data can help:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Clear cookies and site data for this website</li>
              <li>Restart your browser</li>
              <li>Try accessing the site again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
