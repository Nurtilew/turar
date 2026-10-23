import React from 'react';
import {
  FileText,
  Calculator,
  User,
  Mic,
  CreditCard,
  LogOut,
  ShieldCheck,
  Coffee,
  MessageSquare,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'deals' | 'contracts' | 'profile';
  setActiveTab: (tab: 'chat' | 'deals' | 'contracts' | 'profile') => void;
  user: UserProfile | null;
  onOpenVoiceModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  contractsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenVoiceModal,
  onOpenAuthModal,
  onLogout,
  contractsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1a100a]/95 backdrop-blur-md border-b border-[#3a271c] text-[#f7ede2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark (Coffee Bean Aesthetic) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6b4a36] via-[#c98e60] to-[#dba77b] p-0.5 shadow-md shadow-[#8f6449]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#1e140d] rounded-[10px] flex items-center justify-center">
                <Coffee className="w-5 h-5 text-[#dba77b]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#fff9f5] via-[#f7ede2] to-[#dba77b] bg-clip-text text-transparent">
                QazaqFin AI
              </span>
              <span className="text-[10px] font-semibold text-[#c98e60] tracking-wide hidden sm:inline">
                Smart Contracts
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Clean single-line segmented control) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#140d08]/80 p-1 rounded-2xl border border-[#3a271c]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#3a271c] text-[#f7ede2] shadow-sm border border-[#5a3e2b]'
                  : 'text-[#c98e60] hover:text-[#f7ede2] hover:bg-[#251810]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#dba77b]" />
              <span>AI Кеңесші</span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'deals'
                  ? 'bg-[#3a271c] text-[#f7ede2] shadow-sm border border-[#5a3e2b]'
                  : 'text-[#c98e60] hover:text-[#f7ede2] hover:bg-[#251810]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#dba77b]" />
              <span>Бөліп төлеу</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-[#3a271c] text-[#f7ede2] shadow-sm border border-[#5a3e2b]'
                  : 'text-[#c98e60] hover:text-[#f7ede2] hover:bg-[#251810]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#dba77b]" />
              <span>Келісімшарттар</span>
              {contractsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#c98e60] text-[#110905] text-[9px] flex items-center justify-center font-black">
                  {contractsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#3a271c] text-[#f7ede2] shadow-sm border border-[#5a3e2b]'
                  : 'text-[#c98e60] hover:text-[#f7ede2] hover:bg-[#251810]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>Жеке кабинет</span>
            </button>
          </nav>

          {/* Zone 3: Actions (Live Voice + User Profile) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Voice mode trigger */}
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8f6449] via-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] text-xs font-bold shadow-md shadow-[#8f6449]/30 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              title="Дауыспен сөйлесу (Gemini Live Voice)"
            >
              <Mic className="w-3.5 h-3.5 text-[#110905]" />
              <span className="hidden sm:inline">Live Дауыс</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-[#3a271c]">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 bg-[#251810] hover:bg-[#302016] p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#4a3325] transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#3a271c] text-[#dba77b] flex items-center justify-center font-bold text-xs border border-[#5a3e2b]">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'Н'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-[#f7ede2] truncate max-w-[110px]">
                      {user.fullName || 'Қолданушы'}
                    </p>
                    <p className="text-[10px] text-[#4ade80] font-mono tabular-nums">
                      {user.balance.toLocaleString()} ₸
                    </p>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-[#c98e60] hover:text-[#f87171] hover:bg-[#3b1212]/30 rounded-xl transition-colors cursor-pointer"
                  title="Шығу"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#251810] hover:bg-[#302016] text-[#f7ede2] text-xs font-semibold border border-[#4a3325] transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-[#c98e60]" />
                <span>Кіру</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#3a271c]">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'chat' ? 'text-[#dba77b] font-bold' : 'text-[#c98e60]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Кеңес</span>
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'deals' ? 'text-[#dba77b] font-bold' : 'text-[#c98e60]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Бөліп төлеу</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] relative ${
              activeTab === 'contracts' ? 'text-[#dba77b] font-bold' : 'text-[#c98e60]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Шарттар</span>
            {contractsCount > 0 && (
              <span className="absolute -top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#c98e60] text-[#110905] text-[9px] font-black flex items-center justify-center">
                {contractsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'profile' ? 'text-[#dba77b] font-bold' : 'text-[#c98e60]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Кабинет</span>
          </button>
        </div>
      </div>
    </header>
  );
};
