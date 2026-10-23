import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'kk' | 'ru';
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ isOpen, onClose, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (status === 'listening') setStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        const textRecorded = transcriptRef.current.trim();
        if (textRecorded.length > 1) {
          handleSendVoice(textRecorded);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopAll();
    };
  }, [isOpen, language]);

  const stopAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setStatus('idle');
  };

  const toggleListening = () => {
    if (status === 'speaking') {
      stopAudioPlayback();
    }
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setStatus('idle');
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  };

  const playVoiceResponse = async (text: string) => {
    if (!audioEnabled) {
      setStatus('idle');
      return;
    }
    setStatus('speaking');
    try {
      // Attempt server Gemini TTS first (studio grade WAV audio)
      const data = await api.getVoiceAudio(text, 'Kore');
      if (data?.audioBase64) {
        const audioBlobUrl = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioBlobUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => {
          setStatus('idle');
        };
        audio.onerror = () => {
          fallbackBrowserSpeech(text);
        };
        await audio.play();
        return;
      }
    } catch {
      // fallback to browser speech synthesis
    }
    fallbackBrowserSpeech(text);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setStatus('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 400));
    utterance.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';
    utterance.rate = 1.05;
    utterance.onend = () => {
      setStatus('idle');
    };
    utterance.onerror = () => {
      setStatus('idle');
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSendVoice = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend) return;
    setStatus('thinking');
    setTranscript(textToSend);
    try {
      const response = await api.sendChatMessage(
        textToSend,
        [],
        'finance',
        language
      );
      setAiResponse(response.text);
      await playVoiceResponse(response.text);
    } catch {
      setAiResponse('Кешіріңіз, сұрақты өңдеуде ақау болды. Қайталап көріңіз.');
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100a06]/85 backdrop-blur-xl p-4 transition-all">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#251810] to-[#1a100a] border border-[#4a3325] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#f7ede2] flex flex-col items-center">
        {/* Header Controls */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dba77b] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#dba77b]">
              Gemini Live Voice Assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-xl bg-[#2e1f16] text-[#c98e60] hover:text-[#f7ede2] transition-colors cursor-pointer"
              title={audioEnabled ? 'Дыбысты өшіру' : 'Дыбысты қосу'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-[#dba77b]" /> : <VolumeX className="w-4 h-4 text-[#8f6449]" />}
            </button>
            <button
              onClick={() => {
                stopAll();
                onClose();
              }}
              className="p-2 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#c98e60] hover:text-[#f7ede2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Coffee Bean Glowing Orb */}
        <div className="my-8 relative flex items-center justify-center">
          {/* Animated Glow Rings in warm caramel & crema */}
          <div
            className={`absolute w-44 h-44 rounded-full transition-all duration-700 ${
              status === 'listening'
                ? 'bg-[#c98e60]/30 scale-125 animate-ping'
                : status === 'speaking'
                ? 'bg-[#dba77b]/30 scale-110 animate-pulse'
                : status === 'thinking'
                ? 'bg-[#f59e0b]/25 scale-105 animate-spin'
                : 'bg-[#8f6449]/15'
            }`}
          />
          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-[#8f6449] via-[#c98e60] to-[#dba77b] shadow-[#c98e60]/50 scale-105'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-[#6b4a36] via-[#b5805a] to-[#ebd3be] shadow-[#dba77b]/50 animate-pulse'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-[#b45309] to-[#d97706] shadow-[#d97706]/50'
                : 'bg-gradient-to-tr from-[#2d1d14] to-[#3a271c] shadow-[#110905]/60 hover:scale-102'
            }`}
            onClick={toggleListening}
          >
            {status === 'thinking' ? (
              <RefreshCw className="w-12 h-12 text-[#110905] animate-spin" />
            ) : status === 'speaking' ? (
              <Volume2 className="w-12 h-12 text-[#110905] animate-bounce" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-[#110905] animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-[#dba77b]" />
            )}
          </div>
        </div>

        {/* Status Indicator Text */}
        <div className="text-center min-h-[3rem] px-4 flex flex-col items-center justify-center mb-4">
          <p className="text-sm font-semibold text-[#ebd3be]">
            {status === 'listening' && 'Тыңдап тұрмын... (Сөйлеңіз)'}
            {status === 'thinking' && 'Gemini 3.8 талдауда...'}
            {status === 'speaking' && 'Gemini жауап беруде...'}
            {status === 'idle' && 'Сөйлесуді бастау үшін түймені басыңыз'}
          </p>
          {transcript && (
            <p className="text-xs text-[#dba77b] mt-1.5 italic max-w-sm line-clamp-2">
              &quot;{transcript}&quot;
            </p>
          )}
        </div>

        {/* AI Response Preview */}
        {aiResponse && (
          <div className="w-full bg-[#170e09]/80 border border-[#3a271c] rounded-2xl p-4 max-h-36 overflow-y-auto text-xs text-[#ebd3be] leading-relaxed mb-6 scrollbar-thin">
            <div className="flex items-center gap-1.5 text-[#dba77b] font-bold mb-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini жауабы:
            </div>
            {aiResponse}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full flex items-center justify-center gap-3">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] shadow-[#b5805a]/25'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Тоқтату
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Дауыспен сұрау
              </>
            )}
          </button>
          {status === 'speaking' && (
            <button
              onClick={stopAudioPlayback}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f87171] text-xs font-semibold border border-[#4a3325] transition-colors cursor-pointer"
            >
              Дыбысты үзу
            </button>
          )}
        </div>

        {/* Kazakh Financial Voice Quick Suggestions */}
        <div className="w-full mt-6 pt-4 border-t border-[#3a271c]">
          <p className="text-[11px] text-[#c98e60] mb-2 font-medium text-center">
            Жылдам дауыстық сұрақтар:
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              '0-0-12 бөліп төлеу қалай жұмыс істейді?',
              'Кредиттік рейтингті қалай арттыруға болады?',
              'ЭЦҚ және SMS OTP заңды ма?',
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendVoice(preset)}
                className="text-[10px] bg-[#2e1f16] hover:bg-[#3d291e] text-[#ebd3be] px-2.5 py-1.5 rounded-xl border border-[#4a3325] transition-colors text-left cursor-pointer"
              >
                &quot;{preset}&quot;
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
