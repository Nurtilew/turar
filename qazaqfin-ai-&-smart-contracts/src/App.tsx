import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatTab } from './components/ChatTab';
import { DealsTab } from './components/DealsTab';
import { ContractsTab } from './components/ContractsTab';
import { ProfileTab } from './components/ProfileTab';
import { VoiceChatModal } from './components/VoiceChatModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile, Contract } from './types';
import { api, getAuthToken, removeAuthToken } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'deals' | 'contracts' | 'profile'>('chat');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [language, setLanguage] = useState<'kk' | 'ru'>('kk');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initial session restoration
  useEffect(() => {
    const initData = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const profile = await api.getProfile();
          setUser(profile);
          const userContracts = await api.getMyContracts();
          setContracts(userContracts);
        } else {
          // Auto login demo user for frictionless immediate experience
          const demoRes = await api.login('nurik.nur478@gmail.com', '123456');
          setUser(demoRes.user);
          const userContracts = await api.getMyContracts();
          setContracts(userContracts);
        }
      } catch (e) {
        console.warn('Initial session restore fallback:', e);
        try {
          const demoRes = await api.login('nurik.nur478@gmail.com', '123456');
          setUser(demoRes.user);
          const userContracts = await api.getMyContracts();
          setContracts(userContracts);
        } catch (err) {
          console.error('Demo login fallback error:', err);
        }
      }
    };
    initData();
  }, []);

  const handleRefreshContracts = async () => {
    try {
      const userContracts = await api.getMyContracts();
      setContracts(userContracts);
    } catch (e) {
      console.warn('Failed to refresh contracts', e);
    }
  };

  const handleRefreshUser = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (e) {
      console.warn('Failed to refresh user', e);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setContracts([]);
  };

  return (
    <div className="min-h-screen bg-[#150d08] text-[#f7ede2] flex flex-col font-sans selection:bg-[#c98e60] selection:text-[#110905]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        contractsCount={contracts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-4">
        {activeTab === 'chat' && (
          <ChatTab
            language={language}
            setLanguage={setLanguage}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          />
        )}

        {activeTab === 'deals' && (
          <DealsTab
            user={user}
            onContractCreated={(newContract) => {
              setContracts((prev) => [newContract, ...prev.filter((c) => c.id !== newContract.id)]);
              handleRefreshUser();
            }}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab
            contracts={contracts}
            user={user}
            onRefreshContracts={handleRefreshContracts}
            onNavigateToDeals={() => setActiveTab('deals')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            onUpdateProfile={(updated) => setUser(updated)}
            onRefreshUser={handleRefreshUser}
          />
        )}
      </main>

      {/* Live Voice Assistant Modal */}
      <VoiceChatModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
      />

      {/* Auth / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          handleRefreshContracts();
        }}
      />
    </div>
  );
}
