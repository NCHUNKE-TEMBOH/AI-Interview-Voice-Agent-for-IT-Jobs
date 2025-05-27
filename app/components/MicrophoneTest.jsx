"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MicrophoneTest({ onTestComplete }) {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [microphoneWorking, setMicrophoneWorking] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('default');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);

  // Get available audio devices
  const getAudioDevices = async () => {
    setIsLoadingDevices(true);
    try {
      // First request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Then enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      console.log('Available audio devices:', audioInputs);
      setAudioDevices(audioInputs);

      // If we have devices and none is selected yet, select the first one
      if (audioInputs.length > 0 && selectedDeviceId === 'default') {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
      setTestMessage('Error accessing microphone. Please check your browser permissions.');
      setMicrophoneAccess(false);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Load audio devices on component mount
  useEffect(() => {
    getAudioDevices();

    // Set up device change listener
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);

    return () => {
      // Clean up
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);

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
    setMicrophoneWorking(false);
    setAudioLevel(0);

    try {
      // Stop any existing stream
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request microphone access with the selected device
      console.log('Starting test with device ID:', selectedDeviceId);
      const constraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
        if (average > 15) {  // Lowered threshold to detect quieter sounds
          setMicrophoneWorking(true);
        }

        if (isTestRunning) {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();

      // Set a timeout to end the test after 8 seconds
      setTimeout(() => {
        if (isTestRunning) {
          stopMicrophoneTest();
        }
      }, 8000);

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
      onTestComplete(microphoneWorking, selectedDeviceId);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border mb-6">
      <h3 className="text-lg font-medium mb-2">Microphone Test</h3>
      <p className="text-sm text-gray-500 mb-4">
        Before starting the interview, please test your microphone to ensure it's working properly.
      </p>

      {/* Device selection */}
      <div className="mb-4">
        <label htmlFor="microphone-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Microphone
        </label>
        <div className="flex gap-2">
          <Select
            value={selectedDeviceId}
            onValueChange={setSelectedDeviceId}
            disabled={isLoadingDevices || isTestRunning}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                </SelectItem>
              ))}
              {audioDevices.length === 0 && (
                <SelectItem value="default" disabled>
                  No microphones found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={getAudioDevices}
            disabled={isLoadingDevices}
            title="Refresh device list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDevices ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

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
              ? (microphoneWorking ? 'Microphone working' : 'Waiting for sound... (try speaking or tapping the mic)')
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
            disabled={isTestRunning || audioDevices.length === 0}
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

      {!microphoneWorking && microphoneAccess !== null && (
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium">Troubleshooting tips:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Make sure your microphone is properly connected</li>
            <li>Try selecting a different microphone from the dropdown</li>
            <li>Check if your microphone is muted in your system settings</li>
            <li>Try refreshing the page and allowing microphone access again</li>
            <li>Speak louder or move closer to the microphone</li>
          </ul>
        </div>
      )}
    </div>
  );
}
