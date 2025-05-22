"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function SimpleMicTest() {
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('default');
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [log, setLog] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  
  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    // Get available audio devices
    const getDevices = async () => {
      try {
        addLog('Requesting microphone permission...');
        // First get permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
        
        addLog('Permission granted, enumerating devices...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        addLog(`Found ${audioInputs.length} audio input devices`);
        audioInputs.forEach((device, index) => {
          addLog(`Device ${index + 1}: ${device.label || 'Unnamed device'} (${device.deviceId.substring(0, 8)}...)`);
        });
        
        setAudioDevices(audioInputs);
        
        if (audioInputs.length > 0) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      } catch (error) {
        addLog(`Error getting devices: ${error.message}`);
        setErrorMessage(`Error accessing microphone: ${error.message}`);
      }
    };
    
    getDevices();
    
    return () => {
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      setErrorMessage('');
      addLog(`Starting recording with device: ${selectedDevice}`);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get the stream with the selected device
      const constraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      
      addLog('Requesting media stream with constraints...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      addLog('Stream obtained successfully');
      
      // Set up audio context for level monitoring
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Start monitoring audio levels
      const checkAudioLevel = () => {
        if (!analyserRef.current || !isRecording) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(average);
        
        if (average > 5) {
          addLog(`Audio detected! Level: ${average.toFixed(2)}`);
        }
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      // Create a MediaRecorder
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          addLog(`Recorded data size: ${event.data.size} bytes`);
          
          // Create an audio element to play back the recording
          const audioBlob = new Blob([event.data], { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = document.createElement('audio');
          audio.src = audioUrl;
          audio.controls = true;
          
          const playbackContainer = document.getElementById('playback-container');
          if (playbackContainer) {
            playbackContainer.innerHTML = '';
            playbackContainer.appendChild(audio);
          }
        }
      };
      
      mediaRecorderRef.current.onstart = () => {
        addLog('MediaRecorder started');
        setIsRecording(true);
        checkAudioLevel();
      };
      
      mediaRecorderRef.current.onstop = () => {
        addLog('MediaRecorder stopped');
        setIsRecording(false);
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        addLog(`MediaRecorder error: ${event.error}`);
        setErrorMessage(`Recording error: ${event.error}`);
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      
    } catch (error) {
      addLog(`Error starting recording: ${error.message}`);
      setErrorMessage(`Error starting recording: ${error.message}`);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      addLog('Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      addLog('Stopping media stream');
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Simple Microphone Test</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Microphone:</label>
        <select 
          className="w-full p-2 border rounded"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          disabled={isRecording}
        >
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
            </option>
          ))}
          {audioDevices.length === 0 && (
            <option value="default" disabled>No microphones found</option>
          )}
        </select>
      </div>
      
      <div className="flex gap-4 mb-6">
        {!isRecording ? (
          <Button onClick={startRecording} disabled={audioDevices.length === 0}>
            Start Recording
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopRecording}>
            Stop Recording
          </Button>
        )}
      </div>
      
      {isRecording && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Audio Level:</h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-200"
              style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Level: {audioLevel.toFixed(2)}
          </p>
        </div>
      )}
      
      <div id="playback-container" className="mb-6"></div>
      
      <div className="border rounded p-4 bg-gray-50">
        <h2 className="text-lg font-medium mb-2">Debug Log:</h2>
        <div className="h-64 overflow-y-auto bg-black text-green-400 p-2 font-mono text-sm">
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
