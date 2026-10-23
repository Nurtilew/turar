import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  Plus,
  Search,
  Eye,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Contract, UserProfile } from '../types';
import { api } from '../services/api';
import { generateContractPDF } from '../utils/pdfGenerator';

interface ContractsTabProps {
  contracts: Contract[];
  user: UserProfile | null;
  onRefreshContracts: () => void;
  onNavigateToDeals: () => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
  contracts,
  user,
  onRefreshContracts,
  onNavigateToDeals,
}) => {
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Signing state in modal
  const [otpInput, setOtpInput] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');

  const filteredContracts = contracts.filter((c) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'signed'
        ? c.isSigned
        : !c.isSigned;
    const matchesSearch =
      c.productName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenSign = (contract: Contract) => {
    setSelectedContract(contract);
    setOtpInput(contract.signatureOtp);
    setSignError('');
  };

  const handleSign = async () => {
    if (!selectedContract || !otpInput) return;
    setSignLoading(true);
    setSignError('');
    try {
      await api.signContract(selectedContract.id, otpInput);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onRefreshContracts();
      setSelectedContract((prev) => (prev ? { ...prev, isSigned: true, signedAt: new Date().toISOString() } : null));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'OTP қатесі';
      setSignError(msg);
    } finally {
      setSignLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-[#f7ede2]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#fff9f5] via-[#f7ede2] to-[#dba77b] bg-clip-text text-transparent">
            Смарт Келісімшарттар тізімі
          </h1>
          <p className="text-xs text-[#c98e60] mt-1">
            Барлық рәсімделген және цифрлық қол қойылған құжаттарыңыздың архиві
          </p>
        </div>
        <button
          onClick={onNavigateToDeals}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] font-bold text-xs shadow-md shadow-[#b5805a]/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Жаңа келісімшарт
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-[#221710] border border-[#3a271c] p-3 rounded-2xl">
        {/* Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#3a271c] text-[#fff9f5] shadow-sm border border-[#5a3e2b]'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            Барлығы ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('signed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'signed'
                ? 'bg-[#1b3a24] text-[#4ade80] shadow-sm border border-[#2d5a38]'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            Қол қойылған ({contracts.filter((c) => c.isSigned).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#3b2a12] text-[#fbbf24] shadow-sm border border-[#5c401b]'
                : 'text-[#c98e60] hover:text-[#f7ede2] bg-[#1a100a]'
            }`}
          >
            Күтілуде ({contracts.filter((c) => !c.isSigned).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Тауар немесе ID іздеу..."
            className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#f7ede2] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
          />
        </div>
      </div>

      {/* Contracts List Grid */}
      {filteredContracts.length === 0 ? (
        <div className="bg-[#221710] border border-[#3a271c] rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1a100a] text-[#8f6449] flex items-center justify-center mx-auto mb-4 border border-[#3a271c]">
            <FileText className="w-8 h-8 text-[#8f6449]" />
          </div>
          <h3 className="text-base font-bold text-[#f7ede2] mb-1">
            Келісімшарттар табылмады
          </h3>
          <p className="text-xs text-[#c98e60] max-w-sm mx-auto mb-5">
            Таңдалған санат бойынша келісімшарттар жоқ немесе іздеу нәтижесі бос.
          </p>
          <button
            onClick={onNavigateToDeals}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] text-[#110905] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Алғашқы келісімшартты жасау
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((c) => (
            <div
              key={c.id}
              className="bg-[#221710] border border-[#3a271c] hover:border-[#5a3e2b] rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-[#c98e60]">
                    {c.id}
                  </span>
                  {c.isSigned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Қол қойылған
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 text-[10px] font-semibold">
                      <Clock className="w-3 h-3" />
                      Қол қою күтілуде
                    </span>
                  )}
                </div>

                {/* Product & Price */}
                <h4 className="text-sm font-bold text-[#f7ede2] line-clamp-2 mb-2">
                  {c.productName}
                </h4>

                <div className="bg-[#170e09] rounded-xl p-3 text-xs space-y-1.5 mb-4 border border-[#3a271c]">
                  <div className="flex justify-between">
                    <span className="text-[#c98e60]">Жалпы сомасы:</span>
                    <span className="font-bold text-[#dba77b] tabular-nums">{c.totalAmount.toLocaleString()} ₸</span>
                  </div>
                  {c.type === 'CREDIT_INSTALLMENT' ? (
                    <div className="flex justify-between">
                      <span className="text-[#c98e60]">Ай сайын:</span>
                      <span className="font-semibold text-[#f7ede2] tabular-nums">
                        {c.monthlyPayment.toLocaleString()} ₸ ({c.months} ай)
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-[#c98e60]">Төлем түрі:</span>
                      <span className="font-semibold text-[#f7ede2]">Бірден 100%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8f6449]">Жасалған күні:</span>
                    <span className="text-[#ebd3be]">
                      {new Date(c.createdAt).toLocaleDateString('kk-KZ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#3a271c]">
                <button
                  onClick={() => handleOpenSign(c)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f7ede2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#dba77b]" />
                  Қарау
                </button>
                <button
                  onClick={() => generateContractPDF(c, user)}
                  className="p-2 rounded-xl bg-[#3a271c] hover:bg-[#4a3325] text-[#dba77b] border border-[#5a3e2b] text-xs font-semibold transition-colors cursor-pointer"
                  title="PDF жүктеп алу"
                >
                  <Download className="w-4 h-4" />
                </button>
                {!c.isSigned && (
                  <button
                    onClick={() => handleOpenSign(c)}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    Қол қою
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract Detail & Signature View Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100a06]/85 backdrop-blur-md p-4">
          <div className="bg-[#221710] border border-[#4a3325] rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin text-[#f7ede2]">
            <div className="flex items-center justify-between pb-4 border-b border-[#3a271c] mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#dba77b]" />
                <h3 className="text-base font-bold text-[#f7ede2]">
                  Смарт Келісімшарт No {selectedContract.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1.5 rounded-lg text-[#b5805a] hover:text-[#f7ede2] hover:bg-[#2e1f16] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Body */}
            <div className="space-y-4 text-xs text-[#ebd3be]">
              {/* Status Box */}
              <div className={`p-4 rounded-2xl border ${
                selectedContract.isSigned
                  ? 'bg-[#1b3a24]/40 border-[#2d5a38] text-[#4ade80]'
                  : 'bg-[#3b2a12]/40 border-[#5c401b] text-[#fbbf24]'
              }`}>
                <div className="flex items-center justify-between font-bold text-sm mb-1">
                  <span>Статусы:</span>
                  <span>{selectedContract.isSigned ? 'Қол қойылған (Заңды күшінде)' : 'Қол қою күтілуде'}</span>
                </div>
                {selectedContract.isSigned && (
                  <div className="text-[11px] space-y-0.5 mt-2 opacity-95 font-mono">
                    <p>Сертификат: {selectedContract.digitalCertificate}</p>
                    <p>Уақыты: {new Date(selectedContract.signedAt || '').toLocaleString('kk-KZ')}</p>
                    <p>SMS OTP коды: {selectedContract.signatureOtp}</p>
                  </div>
                )}
              </div>

              {/* Parties info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#170e09] p-3.5 rounded-xl border border-[#3a271c]">
                  <p className="font-bold text-[#c98e60] uppercase text-[10px] mb-1">Сатушы жақ:</p>
                  <p className="font-semibold text-[#f7ede2]">{selectedContract.sellerName}</p>
                  <p className="text-[#8f6449] text-[11px] mt-0.5">БИН: {selectedContract.sellerBin}</p>
                </div>
                <div className="bg-[#170e09] p-3.5 rounded-xl border border-[#3a271c]">
                  <p className="font-bold text-[#c98e60] uppercase text-[10px] mb-1">Сатып алушы жақ:</p>
                  <p className="font-semibold text-[#f7ede2]">{user?.fullName || 'Қолданушы'}</p>
                  <p className="text-[#8f6449] text-[11px] mt-0.5">ЖСН: {user?.iin || 'Көрсетілмеген'}</p>
                  <p className="text-[#8f6449] text-[11px]">Тел: {user?.phone || 'Көрсетілмеген'}</p>
                </div>
              </div>

              {/* Product and Payment terms */}
              <div className="bg-[#170e09] p-4 rounded-xl border border-[#3a271c] space-y-2">
                <p className="font-bold text-[#f7ede2] text-sm">{selectedContract.productName}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#3a271c]">
                  <div>
                    <span className="text-[#8f6449] block text-[10px]">Жалпы сомасы:</span>
                    <span className="font-bold text-[#dba77b] text-sm tabular-nums">
                      {selectedContract.totalAmount.toLocaleString()} ₸
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8f6449] block text-[10px]">Шарт түрі:</span>
                    <span className="font-semibold text-[#f7ede2]">
                      {selectedContract.type === 'CREDIT_INSTALLMENT' ? 'Бөліп төлеу' : 'Бірден төлем'}
                    </span>
                  </div>
                  {selectedContract.type === 'CREDIT_INSTALLMENT' && (
                    <div>
                      <span className="text-[#8f6449] block text-[10px]">Ай сайынғы төлем:</span>
                      <span className="font-bold text-[#4ade80] text-sm tabular-nums">
                        {selectedContract.monthlyPayment.toLocaleString()} ₸ / {selectedContract.months} ай
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal terms snippet */}
              <div className="bg-[#170e09]/60 p-3 rounded-xl border border-[#3a271c] text-[11px] text-[#ebd3be]/80 leading-relaxed">
                <p className="font-semibold text-[#dba77b] mb-1">Заңды негіздеме:</p>
                <p>1. ҚР Азаматтық кодексінің 458-бабы бойынша сатып алу-сату және бөліп төлеу шарты.</p>
                <p>2. Бір реттік верификацияланған SMS OTP коды қағаз қолтаңбамен заңды тең күшке ие.</p>
              </div>

              {/* If not signed yet, show OTP verification box */}
              {!selectedContract.isSigned && (
                <div className="bg-[#2e1f16] border border-[#c98e60]/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#dba77b] font-bold">
                    <KeyRound className="w-4 h-4" />
                    SMS OTP арқылы қол қою
                  </div>
                  <p className="text-[11px] text-[#ebd3be]">
                    Жіберілген растау коды: <span className="font-mono font-bold text-[#fff9f5]">{selectedContract.signatureOtp}</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="6 таңбалы код"
                      maxLength={6}
                      className="bg-[#150d08] border border-[#4a3325] rounded-xl px-3 py-2 text-center font-mono font-bold text-[#dba77b] tracking-wider text-sm flex-1 focus:outline-none focus:border-[#c98e60]"
                    />
                    <button
                      onClick={handleSign}
                      disabled={signLoading || otpInput.length < 6}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {signLoading ? 'Қол қойылуда...' : 'Қол қою'}
                    </button>
                  </div>
                  {signError && <p className="text-xs text-[#f87171]">{signError}</p>}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-[#3a271c] mt-5">
              <button
                onClick={() => generateContractPDF(selectedContract, user)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] text-xs font-black shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ресми PDF жүктеу
              </button>
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f7ede2] text-xs font-semibold cursor-pointer"
              >
                Жабу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
