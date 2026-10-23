import React, { useState, useRef } from 'react';
import {
  Calculator,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Smartphone,
  Laptop,
  Car,
  Tv,
  KeyRound,
  Download,
  Camera,
  Image as ImageIcon,
  ScanLine,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Contract } from '../types';
import { api } from '../services/api';
import { generateContractPDF } from '../utils/pdfGenerator';
import { CameraModal } from './CameraModal';

interface DealsTabProps {
  user: UserProfile | null;
  onContractCreated: (contract: Contract) => void;
  onOpenAuthModal: () => void;
}

export const DealsTab: React.FC<DealsTabProps> = ({
  user,
  onContractCreated,
  onOpenAuthModal,
}) => {
  const [productName, setProductName] = useState('Apple iPhone 16 Pro 256GB');
  const [totalAmount, setTotalAmount] = useState<number>(680000);
  const [paymentType, setPaymentType] = useState<'CREDIT_INSTALLMENT' | 'FULL_PAYMENT'>('CREDIT_INSTALLMENT');
  const [months, setMonths] = useState<number>(12);
  const [initialFee, setInitialFee] = useState<number>(0);
  const [sellerName, setSellerName] = useState('TOO "TechnoSmart Kazakhstan"');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Scanner state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);

  // Signing modal state
  const [activeCreatedContract, setActiveCreatedContract] = useState<Contract | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signMessage, setSignMessage] = useState('');

  // Calculations
  const financedAmount = Math.max(0, totalAmount - initialFee);
  const monthlyPayment =
    paymentType === 'CREDIT_INSTALLMENT' ? Math.round(financedAmount / months) : financedAmount;

  const handleScanImage = async (dataUrl: string, mimeType = 'image/jpeg') => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.scanReceipt({ data: dataUrl, mimeType });
      if (res.productName) setProductName(res.productName);
      if (res.totalAmount && res.totalAmount > 0) setTotalAmount(res.totalAmount);
      if (res.sellerName) setSellerName(res.sellerName);
      setScanMessage(`Чектен анықталды: ${res.productName} (${res.totalAmount.toLocaleString()} ₸)`);
      setTimeout(() => setScanMessage(null), 5000);
    } catch {
      alert('Чекті тану кезінде қате орын алды.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGalleryReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleScanImage(dataUrl, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePresetProduct = (name: string, price: number) => {
    setProductName(name);
    setTotalAmount(price);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await api.analyzeDeal({
        productName,
        totalAmount,
        months,
        monthlyPayment,
      });
      setAiAnalysis(res.analysis);
    } catch {
      setAiAnalysis('AI талдау уақытша қолжетімсіз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateContract = async () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    if (!user.iin) {
      alert('Шартты рәсімдеу үшін ЖСН/ИИН нөмірін толтырыңыз!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createContract({
        productName,
        totalAmount,
        type: paymentType,
        months,
        initialFee,
        sellerName,
      });
      setActiveCreatedContract(res.contract);
      setOtpInput(res.otpCode); // Pre-fill with returned SMS OTP for instant convenience
      onContractCreated(res.contract);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Келісімшарт жасау қатесі';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignContract = async () => {
    if (!activeCreatedContract || !otpInput) return;
    setSignStatus('signing');
    try {
      const res = await api.signContract(activeCreatedContract.id, otpInput);
      setSignStatus('success');
      setSignMessage(res.message);
      setActiveCreatedContract(res.contract);
      onContractCreated(res.contract);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP растау қатесі';
      setSignStatus('error');
      setSignMessage(msg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-[#f7ede2]">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#fff9f5] via-[#f7ede2] to-[#dba77b] bg-clip-text text-transparent">
          Бөліп төлеу және Келісімшарт жасау
        </h1>
        <p className="text-xs text-[#c98e60] mt-1">
          Қазақстанның кез келген тауарына 0-0-12 және 0-0-24 ресми онлайн бөліп төлеу шартын рәсімдеңіз
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Product & Term Selection */}
        <div className="lg:col-span-7 space-y-5">
          {/* AI Photo Scanner Banner (Coffee Bean Card) */}
          <div className="bg-gradient-to-r from-[#241710] to-[#2e1f16] border border-[#5a3e2b] rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3a271c] border border-[#5a3e2b] text-[#dba77b] flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5 text-[#dba77b]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#f7ede2] flex items-center gap-1.5">
                    <span>Чек немесе бағаны суреттен тану</span>
                    <span className="px-1.5 py-0.5 bg-[#c98e60]/20 text-[#dba77b] text-[9px] font-bold rounded">AI Vision</span>
                  </h4>
                  <p className="text-[11px] text-[#ebd3be]/70 mt-0.5">
                    Камерамен түсіріңіз немесе галереядан чекті жүктеңіз
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Камерадан түсіру"
                >
                  <Camera className="w-4 h-4" />
                  <span>Камера</span>
                </button>
                <button
                  type="button"
                  onClick={() => receiptFileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a100a] hover:bg-[#251810] text-[#f7ede2] border border-[#4a3325] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Файлды таңдау"
                >
                  <ImageIcon className="w-4 h-4 text-[#dba77b]" />
                  <span>Галерея</span>
                </button>
                <input
                  ref={receiptFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryReceipt}
                  className="hidden"
                />
              </div>
            </div>

            {/* Scanning Status */}
            {isScanning && (
              <div className="mt-3 pt-3 border-t border-[#4a3325] flex items-center gap-2 text-xs text-[#dba77b]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#dba77b]" />
                <span>Gemini Vision талдауда...</span>
              </div>
            )}
            {scanMessage && (
              <div className="mt-3 pt-3 border-t border-[#4a3325] flex items-center gap-2 text-xs text-[#4ade80] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="bg-[#221710] border border-[#3a271c] rounded-2xl p-4">
            <label className="text-xs font-semibold text-[#ebd3be] mb-2 block">
              Танымал тауарлар үлгісі:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Apple iPhone 16 Pro', price: 680000, icon: Smartphone },
                { name: 'MacBook Air M3 512GB', price: 790000, icon: Laptop },
                { name: 'Samsung 65" QLED 4K', price: 420000, icon: Tv },
                { name: 'Автобөлшектер жинағы', price: 250000, icon: Car },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isSelected = productName === item.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetProduct(item.name, item.price)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3a271c] border-[#c98e60] text-[#fff9f5] shadow-md shadow-[#8f6449]/20'
                        : 'bg-[#1a100a] border-[#3a271c] text-[#c98e60] hover:text-[#f7ede2] hover:border-[#5a3e2b]'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-[#dba77b]" />
                    <span className="text-[11px] font-semibold truncate w-full">{item.name}</span>
                    <span className="text-[10px] text-[#ebd3be]/70 mt-0.5 tabular-nums">
                      {item.price.toLocaleString()} ₸
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="bg-[#221710] border border-[#3a271c] rounded-2xl p-5 space-y-4">
            {/* Product Name */}
            <div>
              <label className="text-xs font-semibold text-[#ebd3be] block mb-1.5">
                Тауардың толық атауы
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Мысалы: Asus ROG Strix G16"
                className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl px-3.5 py-2.5 text-sm text-[#f7ede2] focus:outline-none focus:border-[#c98e60]"
              />
            </div>

            {/* Total Amount */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#ebd3be]">
                  Тауардың құны (KZT)
                </label>
                <span className="text-xs font-bold text-[#dba77b] tabular-nums">
                  {totalAmount.toLocaleString()} ₸
                </span>
              </div>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Math.max(1000, Number(e.target.value)))}
                className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl px-3.5 py-2.5 text-sm text-[#f7ede2] font-mono tabular-nums focus:outline-none focus:border-[#c98e60] mb-2"
              />
              <div className="flex gap-2">
                {[150000, 350000, 500000, 750000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTotalAmount(amt)}
                    className="flex-1 py-1 rounded-lg bg-[#2e1f16] hover:bg-[#3a271c] text-[10px] font-medium text-[#ebd3be] transition-colors cursor-pointer tabular-nums"
                  >
                    {(amt / 1000).toFixed(0)} мың
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="text-xs font-semibold text-[#ebd3be] block mb-1.5">
                Төлем түрі
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('CREDIT_INSTALLMENT')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentType === 'CREDIT_INSTALLMENT'
                      ? 'bg-[#3a271c] border-[#c98e60] text-[#fff9f5] shadow-md'
                      : 'bg-[#1a100a] border-[#3a271c] text-[#c98e60] hover:border-[#5a3e2b]'
                  }`}
                >
                  <p className="text-xs font-bold text-[#dba77b]">Бөліп төлеу (Рассрочка)</p>
                  <p className="text-[11px] text-[#ebd3be]/70 mt-0.5">0% артық төлемсіз</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('FULL_PAYMENT')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentType === 'FULL_PAYMENT'
                      ? 'bg-[#3a271c] border-[#c98e60] text-[#fff9f5] shadow-md'
                      : 'bg-[#1a100a] border-[#3a271c] text-[#c98e60] hover:border-[#5a3e2b]'
                  }`}
                >
                  <p className="text-xs font-bold text-[#f7ede2]">Бірден толық төлем (100%)</p>
                  <p className="text-[11px] text-[#ebd3be]/70 mt-0.5">Бір реттік есеп айырысу</p>
                </button>
              </div>
            </div>

            {/* Months Selector (if installment) */}
            {paymentType === 'CREDIT_INSTALLMENT' && (
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1.5">
                  Бөліп төлеу мерзімі:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        months === m
                          ? 'bg-gradient-to-r from-[#b5805a] to-[#c98e60] border-[#dba77b] text-[#110905] shadow-md'
                          : 'bg-[#1a100a] border-[#3a271c] text-[#c98e60] hover:border-[#5a3e2b]'
                      }`}
                    >
                      {m} айға
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Initial Down payment */}
            {paymentType === 'CREDIT_INSTALLMENT' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#ebd3be]">
                    Бастапқы жарна (Down Payment)
                  </label>
                  <span className="text-xs font-bold text-[#dba77b] tabular-nums">
                    {initialFee.toLocaleString()} ₸
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 0.1, 0.2, 0.3].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setInitialFee(Math.round(totalAmount * pct))}
                      className={`py-1.5 rounded-lg border text-xs transition-colors cursor-pointer tabular-nums ${
                        initialFee === Math.round(totalAmount * pct)
                          ? 'bg-[#3a271c] border-[#c98e60] text-[#dba77b] font-bold'
                          : 'bg-[#1a100a] border-[#3a271c] text-[#c98e60] hover:text-[#f7ede2]'
                      }`}
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Card & AI Feasibility in Coffee Bean Style */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-gradient-to-b from-[#221710] to-[#1a100a] border border-[#4a3325] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-[#ebd3be] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#dba77b]" />
              Төлем кестесінің қорытындысы
            </h3>

            {/* Big monthly payment display */}
            <div className="bg-[#150d08] border border-[#3a271c] rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-[#c98e60]">
                {paymentType === 'CREDIT_INSTALLMENT' ? 'Ай сайынғы төлем:' : 'Жалпы төленетін құны:'}
              </p>
              <p className="text-3xl font-black text-[#fff9f5] mt-1 bg-gradient-to-r from-[#dba77b] to-[#ebd3be] bg-clip-text text-transparent tabular-nums">
                {monthlyPayment.toLocaleString()} ₸
                {paymentType === 'CREDIT_INSTALLMENT' && (
                  <span className="text-sm font-normal text-[#c98e60]"> / айына</span>
                )}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] text-[11px] font-semibold border border-[#4ade80]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Артық төлем: 0 ₸ (0-0-{months} акциясы)
              </div>
            </div>

            {/* Breakdown table */}
            <div className="space-y-2 text-xs border-b border-[#3a271c] pb-4 mb-4">
              <div className="flex justify-between text-[#ebd3be]/70">
                <span>Тауардың бастапқы бағасы:</span>
                <span className="font-semibold text-[#f7ede2] tabular-nums">{totalAmount.toLocaleString()} ₸</span>
              </div>
              {initialFee > 0 && (
                <div className="flex justify-between text-[#ebd3be]/70">
                  <span>Бастапқы жарна:</span>
                  <span className="font-semibold text-[#f7ede2] tabular-nums">{initialFee.toLocaleString()} ₸</span>
                </div>
              )}
              <div className="flex justify-between text-[#ebd3be]/70">
                <span>Бөліп төленетін сома:</span>
                <span className="font-semibold text-[#f7ede2] tabular-nums">{financedAmount.toLocaleString()} ₸</span>
              </div>
              <div className="flex justify-between text-[#ebd3be]/70">
                <span>Мерзімі:</span>
                <span className="font-semibold text-[#f7ede2]">
                  {paymentType === 'CREDIT_INSTALLMENT' ? `${months} ай` : '1 рет'}
                </span>
              </div>
              <div className="flex justify-between text-[#ebd3be]/70">
                <span>Сыйақы мөлшерлемесі (СЭСВ):</span>
                <span className="font-bold text-[#4ade80] tabular-nums">0.0%</span>
              </div>
            </div>

            {/* User Check Indicator */}
            <div className="flex items-center justify-between text-xs mb-5 bg-[#170e09] p-3 rounded-xl border border-[#3a271c]">
              <span className="text-[#c98e60]">Клиенттің скорингі:</span>
              <span className="font-bold text-[#dba77b] flex items-center gap-1 tabular-nums">
                {user?.creditScore || 755} ұпай
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCreateContract}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] font-black text-sm shadow-lg shadow-[#b5805a]/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {isSubmitting ? 'Рәсімделуде...' : 'Шарт жасау & SMS OTP алу'}
              </button>
              <button
                type="button"
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f7ede2] font-semibold text-xs border border-[#4a3325] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#dba77b]" />
                {isAnalyzing ? 'Gemini 3.8 талдауда...' : 'Gemini AI талдауын алу'}
              </button>
            </div>
          </div>

          {/* AI Analysis Result Card */}
          {aiAnalysis && (
            <div className="bg-[#221710] border border-[#c98e60]/30 rounded-2xl p-4 text-xs text-[#ebd3be] leading-relaxed shadow-lg">
              <div className="flex items-center gap-2 text-[#dba77b] font-bold mb-2">
                <Sparkles className="w-4 h-4 text-[#dba77b]" />
                Gemini AI Қорытындысы:
              </div>
              <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
          )}
        </div>
      </div>

      {/* SMS OTP Digital Signature Modal */}
      {activeCreatedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100a06]/85 backdrop-blur-md p-4">
          <div className="bg-[#221710] border border-[#4a3325] rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-[#f7ede2]">
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#3a271c] border border-[#5a3e2b] text-[#dba77b] flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#f7ede2]">
                Сандық қол қою (SMS OTP)
              </h3>
              <p className="text-xs text-[#c98e60] mt-1">
                Келісімшарт No: <span className="font-mono text-[#dba77b]">{activeCreatedContract.id}</span>
              </p>
            </div>

            {/* Deal preview in modal */}
            <div className="bg-[#150d08] rounded-2xl p-4 text-xs space-y-2 mb-5 border border-[#3a271c]">
              <div className="flex justify-between">
                <span className="text-[#c98e60]">Тауар:</span>
                <span className="font-bold text-[#f7ede2] truncate max-w-[200px]">
                  {activeCreatedContract.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c98e60]">Сомасы:</span>
                <span className="font-bold text-[#dba77b] tabular-nums">
                  {activeCreatedContract.totalAmount.toLocaleString()} ₸
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c98e60]">Айына:</span>
                <span className="font-bold text-[#f7ede2] tabular-nums">
                  {activeCreatedContract.monthlyPayment.toLocaleString()} ₸
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c98e60]">Сатып алушы:</span>
                <span className="text-[#ebd3be]">{user?.fullName} (ЖСН: {user?.iin})</span>
              </div>
            </div>

            {/* OTP Section */}
            {signStatus !== 'success' ? (
              <div className="space-y-4">
                <div className="bg-[#3a271c]/50 border border-[#c98e60]/30 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-[#dba77b]">
                    Телефоныңызға ({user?.phone || '+7 775 842 9102'}) 6 таңбалы код жіберілді:
                  </p>
                  <p className="text-xl font-mono font-black text-[#f7ede2] tracking-widest mt-1">
                    {activeCreatedContract.signatureOtp}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                    OTP растау кодын енгізіңіз:
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    placeholder="Мысалы: 123456"
                    className="w-full bg-[#150d08] border border-[#3a271c] rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-[#dba77b] focus:outline-none focus:border-[#c98e60]"
                  />
                </div>

                {signStatus === 'error' && (
                  <p className="text-xs text-[#f87171] text-center font-medium bg-[#3b1212]/40 p-2 rounded-lg">
                    {signMessage}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCreatedContract(null)}
                    className="flex-1 py-3 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#ebd3be] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Бас тарту
                  </button>
                  <button
                    type="button"
                    onClick={handleSignContract}
                    disabled={otpInput.length < 6 || signStatus === 'signing'}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] text-xs font-black shadow-lg shadow-[#b5805a]/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {signStatus === 'signing' ? 'Қол қойылуда...' : 'ЭЦҚ-мен қол қою'}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Signed Stamp */
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#f7ede2]">
                    Келісімшартқа сәтті қол қойылды!
                  </h4>
                  <p className="text-xs text-[#4ade80] font-mono mt-1">
                    Сертификат: {activeCreatedContract.digitalCertificate}
                  </p>
                  <p className="text-[11px] text-[#c98e60] mt-2">
                    Құжат заңды күшіне енді. PDF нұсқасын жүктеп ала аласыз.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => generateContractPDF(activeCreatedContract, user)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    PDF жүктеу
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreatedContract(null)}
                    className="py-3 px-4 rounded-xl bg-[#2e1f16] hover:bg-[#3d291e] text-[#f7ede2] text-xs font-semibold cursor-pointer"
                  >
                    Жабу
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Camera Modal for Scanning Receipt / Product */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleScanImage}
      />
    </div>
  );
};
