import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  Trash2,
  Scale,
  Coins,
  Camera,
  Image as ImageIcon,
  X,
  FileCheck,
} from 'lucide-react';
import { ChatMessage, AssistantMode } from '../types';
import { api } from '../services/api';
import { CameraModal } from './CameraModal';

interface ChatTabProps {
  language: 'kk' | 'ru';
  setLanguage: (lang: 'kk' | 'ru') => void;
  onOpenVoiceModal: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ language, setLanguage, onOpenVoiceModal }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome_1',
        role: 'assistant',
        content: `Сәлеметсіз бе! **QazaqFin AI** қаржылық және смарт-келісімшарттар жүйесіне қош келдіңіз! ☕

Мен сізге мына бағыттар бойынша көмектесемін:
• **0-0-12 / 0-0-24 бөліп төлеу есебі**: Ай сайынғы төлемді, СЭСВ (0%) және жасырын комиссияларды тексеру.
• **Чектер мен ценниктерді тану (Vision)**: Камера немесе фото арқылы тауар бағасын оқу және шарт жасау.
• **Заңгерлік тексеріс**: ҚР Азаматтық кодексіне сай смарт-шарттар мен SMS OTP цифрлық қол қою заңдылығы.
• **Кредиттік скоринг**: Жеке рейтингіңізді (300-850) арттыру кеңестері.

Сұрағыңызды жазыңыз, дауыспен айтыңыз немесе чектің фотосын жүктеңіз!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('finance');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Attached Image state
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachedImage]);

  // Setup Speech-to-Text for the prompt input bar
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${text}` : text));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMic = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Speech recognition start failed', e);
      }
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAttachedImage({
          data: dataUrl,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCameraCapture = (dataUrl: string) => {
    setAttachedImage({
      data: dataUrl,
      mimeType: 'image/jpeg',
    });
  };

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if ((!query && !attachedImage) || isLoading) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingMessageId(null);
    }

    const currentImage = attachedImage;
    const finalPrompt = query || (currentImage ? 'Осы құжатты/чекті толық талдап беріңіз.' : '');

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      imageUrl: currentImage?.data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant'))
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.sendChatMessage(
        finalPrompt,
        historyPayload,
        mode,
        language,
        currentImage || undefined
      );

      const aiMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Желілік байланыс ақауы';
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Жауап алу мүмкін болмады: ${errorMsg}. Қайталап көріңіз.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = async (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingMessageId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPlayingMessageId(msg.id);

    try {
      const data = await api.getVoiceAudio(msg.content, 'Kore');
      if (data?.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        currentAudioRef.current = audio;
        audio.onended = () => {
          setPlayingMessageId(null);
        };
        audio.onerror = () => {
          fallbackSpeech(msg.content);
        };
        await audio.play();
        return;
      }
    } catch {
      // fallback
    }
    fallbackSpeech(msg.content);
  };

  const fallbackSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setPlayingMessageId(null);
      return;
    }
    const clean = text.replace(/[*#_`]/g, '').slice(0, 450);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';
    utterance.rate = 1.05;
    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Чат тарихын тазалауды растайсыз ба?')) {
      setMessages([
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Чат тарихы тазартылды. Қандай сұрағыңыз бар?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const quickPrompts = [
    {
      label: 'Рассрочка СЭСВ 0%',
      prompt: 'Қазақстандағы бөліп төлеудің (0-0-12) негізгі заңдық шарттары қандай?',
      icon: FileCheck,
    },
    {
      label: 'Скорингті арттыру',
      prompt: 'Кредиттік тарих пен скорингті қалай жақсартуға болады?',
      icon: Coins,
    },
    {
      label: 'SMS OTP заңдылығы',
      prompt: 'SMS OTP коды арқылы қойылған цифрлық қолтаңбаның құқықтық күші бар ма?',
      icon: Scale,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto w-full px-2 sm:px-4">
      {/* Top Bar: Mode Selector & Language in Coffee Bean tones */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3 bg-[#231710] border border-[#3a271c] rounded-2xl mb-3 shadow-md">
        {/* Modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setMode('finance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              mode === 'finance'
                ? 'bg-gradient-to-r from-[#8f6449] to-[#c98e60] text-[#110905] font-bold shadow-sm'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Қаржылық кеңес</span>
          </button>
          <button
            onClick={() => setMode('legal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              mode === 'legal'
                ? 'bg-gradient-to-r from-[#8f6449] to-[#c98e60] text-[#110905] font-bold shadow-sm'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Заңгерлік талдау</span>
          </button>
          <button
            onClick={() => setMode('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              mode === 'general'
                ? 'bg-gradient-to-r from-[#8f6449] to-[#c98e60] text-[#110905] font-bold shadow-sm'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Vision & OCR</span>
          </button>
        </div>

        {/* Right tools: Language & Voice trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#1a100a] rounded-xl p-0.5 border border-[#3a271c] text-xs">
            <button
              onClick={() => setLanguage('kk')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                language === 'kk' ? 'bg-[#c98e60] text-[#110905]' : 'text-[#b5805a] hover:text-[#f7ede2]'
              }`}
            >
              ҚАЗ
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                language === 'ru' ? 'bg-[#c98e60] text-[#110905]' : 'text-[#b5805a] hover:text-[#f7ede2]'
              }`}
            >
              РУС
            </button>
          </div>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#c98e60]/15 text-[#dba77b] border border-[#c98e60]/30 hover:bg-[#c98e60]/25 text-xs font-semibold transition-all cursor-pointer"
            title="Дауыстық сөйлесуді қосу"
          >
            <Mic className="w-3.5 h-3.5 text-[#dba77b]" />
            <span className="hidden sm:inline">Live Дауыс</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-[#b5805a] hover:text-[#f87171] hover:bg-[#3b1212]/30 rounded-xl transition-colors cursor-pointer"
            title="Чатты тазалау"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPlaying = playingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-tr from-[#8f6449] to-[#c98e60] text-[#110905]'
                    : 'bg-[#2e1f16] border border-[#4a3325] text-[#dba77b]'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-[#3d291e] to-[#2d1e16] border border-[#5a3e2b] text-[#fff9f5] rounded-tr-none'
                    : 'bg-[#221710] border border-[#3a271c] text-[#f7ede2] rounded-tl-none'
                }`}
              >
                {/* Uploaded Image Preview if user message had image */}
                {msg.imageUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-[#5a3e2b] max-w-xs shadow-md">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      className="w-full max-h-56 object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                  </div>
                )}

                {/* Text Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* Bubble Footer: Timestamp & Audio controls for Assistant */}
                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-[#3a271c] text-[11px] text-[#c98e60]">
                  <span className="tabular-nums">{msg.timestamp}</span>
                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakMessage(msg)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                          isPlaying
                            ? 'bg-[#c98e60] text-[#110905] font-bold'
                            : 'hover:bg-[#2e1f16] text-[#dba77b]'
                        }`}
                        title={isPlaying ? 'Тоқтату' : 'Дауыстап оқу (TTS)'}
                      >
                        {isPlaying ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#110905] animate-ping"></span>
                            <span>Оқылуда...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#dba77b]" />
                            <span>Тыңдау</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-[#f7ede2] text-[#b5805a] transition-colors cursor-pointer"
                        title="Көшіріп алу"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2e1f16] border border-[#4a3325] text-[#dba77b] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#221710] border border-[#3a271c] rounded-2xl rounded-tl-none px-4 py-3 text-[#c98e60] text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#dba77b] animate-spin" />
              <span>Gemini Vision талдауда...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {messages.length <= 2 && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#231710] hover:bg-[#2e1f16] text-[#ebd3be] hover:text-[#fff9f5] border border-[#3a271c] text-xs shrink-0 transition-all cursor-pointer whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5 text-[#dba77b]" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="pt-2 pb-1">
        {/* Attached Image Preview Thumbnail Pill */}
        {attachedImage && (
          <div className="mb-2 inline-flex items-center gap-2 bg-[#221710] border border-[#c98e60]/50 rounded-xl p-1.5 pr-3 shadow-lg">
            <img
              src={attachedImage.data}
              alt="Attachment"
              className="w-10 h-10 rounded-lg object-cover border border-[#4a3325]"
            />
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#dba77b]">Сурет бекітілді</p>
              <p className="text-[10px] text-[#c98e60]">AI Vision талдайды</p>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg text-[#b5805a] hover:text-[#f87171] hover:bg-[#2e1f16] transition-colors ml-2 cursor-pointer"
              title="Өшіру"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-[#221710] border border-[#3a271c] rounded-2xl p-1.5 focus-within:border-[#c98e60] focus-within:ring-1 focus-within:ring-[#c98e60] transition-all shadow-xl gap-1"
        >
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2.5 rounded-xl text-[#b5805a] hover:text-[#dba77b] hover:bg-[#2e1f16] transition-colors cursor-pointer"
            title="Камерадан чек түсіру"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-[#b5805a] hover:text-[#dba77b] hover:bg-[#2e1f16] transition-colors cursor-pointer"
            title="Галереядан сурет таңдау"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Hidden File Input for Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            className="hidden"
          />

          {/* Microphone toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-md'
                : 'text-[#b5805a] hover:text-[#dba77b] hover:bg-[#2e1f16]'
            }`}
            title={isRecording ? 'Тыңдауды тоқтату' : 'Дауыспен сөйлеу'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? 'Сөйлеңіз...'
                : attachedImage
                ? 'Сурет бойынша сұрағыңызды жазыңыз...'
                : 'Қаржылық немесе заңгерлік сұрағыңызды жазыңыз...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#f7ede2] placeholder-[#8f6449] focus:outline-none"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] text-[#110905] hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-[#8f6449]">
          <span>ҚР Азаматтық кодексі және Тұтынушылар құқығы негізінде</span>
          <span>Gemini Vision & OCR 3.8</span>
        </div>
      </div>

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
