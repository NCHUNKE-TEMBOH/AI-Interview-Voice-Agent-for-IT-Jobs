"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function MicrophoneTest({ onTestComplete }) {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [microphoneWorking, setMicrophoneWorking] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  
  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  const startMicrophoneTest = async () => {
    setIsTestRunning(true);
    setTestMessage('');
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      setMicrophoneAccess(true);
      
      // Set up audio analysis
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Start monitoring audio levels
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(average);
        
        // If we detect sound above threshold, microphone is working
        if (average > 20) {
          setMicrophoneWorking(true);
        }
        
        if (isTestRunning) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      checkAudioLevel();
      
      // Set a timeout to end the test after 5 seconds
      setTimeout(() => {
        if (isTestRunning) {
          stopMicrophoneTest();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicrophoneAccess(false);
      setTestMessage('Microphone access denied. Please check your browser permissions.');
      setIsTestRunning(false);
    }
  };
  
  const stopMicrophoneTest = () => {
    setIsTestRunning(false);
    
    // Stop the microphone stream
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Set test result message
    if (microphoneWorking) {
      setTestMessage('Microphone is working properly! You can proceed with the interview.');
    } else {
      setTestMessage('No audio detected. Please check your microphone settings and try again.');
    }
    
    // Notify parent component
    if (onTestComplete) {
      onTestComplete(microphoneWorking);
    }
  };
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border mb-6">
      <h3 className="text-lg font-medium mb-2">Microphone Test</h3>
      <p className="text-sm text-gray-500 mb-4">
        Before starting the interview, please test your microphone to ensure it's working properly.
      </p>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {microphoneAccess === true ? (
            <Mic className={`h-6 w-6 ${microphoneWorking ? 'text-green-500' : 'text-gray-400'}`} />
          ) : microphoneAccess === false ? (
            <MicOff className="h-6 w-6 text-red-500" />
          ) : (
            <Mic className="h-6 w-6 text-gray-400" />
          )}
          <span className="ml-2">
            {microphoneAccess === true 
              ? (microphoneWorking ? 'Microphone working' : 'Waiting for sound...') 
              : microphoneAccess === false 
                ? 'Microphone access denied' 
                : 'Microphone not tested'}
          </span>
        </div>
        
        {isTestRunning && (
          <div className="flex items-center">
            <Volume2 className={`h-6 w-6 ${audioLevel > 10 ? 'text-green-500' : 'text-gray-400'}`} />
            <div className="w-32 bg-gray-200 rounded-full h-2.5 ml-2">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {testMessage && (
        <div className={`p-3 rounded mb-4 ${microphoneWorking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {testMessage}
        </div>
      )}
      
      <div className="flex justify-center">
        {!isTestRunning ? (
          <Button 
            onClick={startMicrophoneTest}
            disabled={isTestRunning}
          >
            Test Microphone
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={stopMicrophoneTest}
          >
            Stop Test
          </Button>
        )}
      </div>
    </div>
  );
}
