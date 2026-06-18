import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Slide,
  CircularProgress
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as SpeakerIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { coordinatorService } from '../services/api';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [hasVoiceSupport, setHasVoiceSupport] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasVoiceSupport(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
      setResponse('');
      // Stop any current reading
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error', event);
      setTranscript('Error listening. Try again.');
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = async (event) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      setIsLoading(true);

      try {
        // Send transcript to backend multi-agent coordinator
        const res = await coordinatorService.processVoice(resultText);
        const voiceText = res.data.voice_response;
        const fullReport = res.data.text_response;
        
        setResponse(voiceText);
        setIsLoading(false);
        
        // Speak the response back
        speak(voiceText);
      } catch (err) {
        console.error(err);
        setResponse('Failed to contact coordinator.');
        setIsLoading(false);
      }
    };

    recognitionRef.current = rec;
  }, []);

  const toggleMic = () => {
    if (!hasVoiceSupport) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsOpen(true);
      recognitionRef.current.start();
    }
  };

  const speak = (text) => {
    if (!synthRef.current) return;

    // Stop current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Choose a pleasant female voice if available
    const voices = synthRef.current.getVoices();
    const targetVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Female') || voice.name.includes('Zira'));
    if (targetVoice) utterance.voice = targetVoice;

    synthRef.current.speak(utterance);
  };

  const closeAssistant = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthRef.current) synthRef.current.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setIsOpen(false);
  };

  if (!hasVoiceSupport) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1300 }}>
      {/* Floating Toggle Button */}
      <IconButton
        onClick={isOpen ? closeAssistant : toggleMic}
        className={isListening ? 'pulse-cyan-glow' : isSpeaking ? 'pulse-red-glow' : ''}
        sx={{
          width: 60,
          height: 60,
          backgroundColor: isListening 
            ? 'rgba(56, 189, 248, 0.2)' 
            : isSpeaking 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(30, 41, 59, 0.9)',
          border: '1px solid',
          borderColor: isListening 
            ? '#38bdf8' 
            : isSpeaking 
              ? '#ef4444' 
              : 'rgba(255, 255, 255, 0.1)',
          color: isListening 
            ? '#38bdf8' 
            : isSpeaking 
              ? '#f87171' 
              : '#94a3b8',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: isListening 
              ? 'rgba(56, 189, 248, 0.3)' 
              : isSpeaking 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(30, 41, 59, 1)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isListening ? (
          <MicIcon sx={{ fontSize: 28 }} />
        ) : isSpeaking ? (
          <SpeakerIcon sx={{ fontSize: 28 }} />
        ) : (
          <MicIcon sx={{ fontSize: 28 }} />
        )}
      </IconButton>

      {/* Floating Dialog Box */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          className="glass-panel"
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 0,
            width: 320,
            p: 2.5,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#38bdf8' }}>
              Health Assistant Intellegent Voice Assistant
            </Typography>
            <IconButton size="small" onClick={closeAssistant} sx={{ color: '#94a3b8' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Wave animation state indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
            {isListening && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Box className="pulse-cyan-glow" sx={{ width: 8, height: 24, borderRadius: 4, backgroundColor: '#38bdf8' }} />
                <Box className="pulse-cyan-glow" sx={{ width: 8, height: 36, borderRadius: 4, backgroundColor: '#38bdf8', animationDelay: '0.2s' }} />
                <Box className="pulse-cyan-glow" sx={{ width: 8, height: 28, borderRadius: 4, backgroundColor: '#38bdf8', animationDelay: '0.4s' }} />
                <Box className="pulse-cyan-glow" sx={{ width: 8, height: 16, borderRadius: 4, backgroundColor: '#38bdf8', animationDelay: '0.6s' }} />
              </Box>
            )}
            {isSpeaking && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Box className="pulse-red-glow" sx={{ width: 8, height: 16, borderRadius: 4, backgroundColor: '#ef4444' }} />
                <Box className="pulse-red-glow" sx={{ width: 8, height: 28, borderRadius: 4, backgroundColor: '#ef4444', animationDelay: '0.2s' }} />
                <Box className="pulse-red-glow" sx={{ width: 8, height: 36, borderRadius: 4, backgroundColor: '#ef4444', animationDelay: '0.4s' }} />
                <Box className="pulse-red-glow" sx={{ width: 8, height: 20, borderRadius: 4, backgroundColor: '#ef4444', animationDelay: '0.6s' }} />
              </Box>
            )}
            {isLoading && <CircularProgress size={24} sx={{ color: '#8b5cf6' }} />}
            {!isListening && !isSpeaking && !isLoading && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Click mic to speak to coordinator
              </Typography>
            )}
          </Box>

          {/* Transcript box */}
          {transcript && (
            <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', p: 1.5, borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 0.5 }}>
                You said:
              </Typography>
              <Typography variant="body2" sx={{ color: '#e6edf3', fontWeight: 500 }}>
                {transcript}
              </Typography>
            </Box>
          )}

          {/* Response box */}
          {response && (
            <Box sx={{ backgroundColor: 'rgba(56, 189, 248, 0.05)', p: 1.5, borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#38bdf8', mb: 0.5 }}>
                Assistant:
              </Typography>
              <Typography variant="body2" sx={{ color: '#e6edf3', fontStyle: 'italic' }}>
                "{response}"
              </Typography>
            </Box>
          )}
        </Paper>
      </Slide>
    </Box>
  );
}
