import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  CreditCard,
  Save,
  Sparkles,
  Phone,
  Hash,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface ProfileTabProps {
  user: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onRefreshUser: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onUpdateProfile,
  onRefreshUser,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [iin, setIin] = useState(user?.iin || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Topup state
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateProfile({ fullName, iin, phone });
      onUpdateProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Сақтау қатесі';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopup = async () => {
    if (topupAmount <= 0) return;
    setIsTopupLoading(true);
    setTopupSuccess(false);
    try {
      await api.topupBalance(topupAmount);
      onRefreshUser();
      setTopupSuccess(true);
      setTimeout(() => setTopupSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Толтыру қатесі';
      alert(msg);
    } finally {
      setIsTopupLoading(false);
    }
  };

  const score = user?.creditScore || 755;
  const scorePercent = Math.min(100, Math.max(0, ((score - 300) / (850 - 300)) * 100));

  let scoreGrade = 'Өте сенімді (A+)';
  let scoreColor = 'text-[#4ade80]';
  let scoreBg = 'from-[#4ade80] to-[#22c55e]';

  if (score < 550) {
    scoreGrade = 'Тәуекелі жоғары (D)';
    scoreColor = 'text-[#f87171]';
    scoreBg = 'from-[#f87171] to-[#ef4444]';
  } else if (score < 680) {
    scoreGrade = 'Орташа деңгей (B)';
    scoreColor = 'text-[#fbbf24]';
    scoreBg = 'from-[#fbbf24] to-[#f59e0b]';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 text-[#f7ede2] space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#fff9f5] via-[#f7ede2] to-[#dba77b] bg-clip-text text-transparent">
          Жеке кабинет және Кредиттік Скоринг
        </h1>
        <p className="text-xs text-[#c98e60] mt-1">
          Деректеріңізді басқарыңыз, қаржылық балансыңызды қадағалаңыз және ресми скорингті көріңіз
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Credit Scoring & Balance */}
        <div className="lg:col-span-5 space-y-5">
          {/* Credit Score Gauge Card */}
          <div className="bg-gradient-to-b from-[#221710] to-[#1a100a] border border-[#4a3325] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c98e60] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#dba77b]" />
                Кредиттік рейтинг (1CB / ПКБ)
              </span>
              <span className="text-[10px] bg-[#150d08] px-2 py-0.5 rounded-md text-[#c98e60] border border-[#3a271c] font-mono">
                Макс: 850
              </span>
            </div>

            {/* Score Big Display */}
            <div className="text-center my-4">
              <div className="inline-block relative">
                <span className="text-5xl font-black tracking-tight bg-gradient-to-r from-[#fff9f5] via-[#f7ede2] to-[#dba77b] bg-clip-text text-transparent font-mono tabular-nums">
                  {score}
                </span>
                <span className="text-xs font-bold text-[#c98e60] ml-1">ұпай</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${scoreColor}`}>
                {scoreGrade}
              </p>
            </div>

            {/* Score Progress Bar in warm coffee/crema */}
            <div className="space-y-1 mb-4">
              <div className="h-3 w-full bg-[#150d08] rounded-full overflow-hidden p-0.5 border border-[#3a271c]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreBg} transition-all duration-1000 shadow-md`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#8f6449] font-mono tabular-nums">
                <span>300 (Тәуекел)</span>
                <span>650 (Орташа)</span>
                <span>850 (Мінсіз)</span>
              </div>
            </div>

            <div className="bg-[#150d08]/80 border border-[#3a271c] rounded-2xl p-3.5 text-xs text-[#ebd3be] space-y-2">
              <div className="flex items-center gap-1.5 text-[#dba77b] font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                Мақұлдану ықтималдығы: 95%
              </div>
              <p className="text-[11px] text-[#ebd3be]/70 leading-relaxed">
                Сіздің рейтингіңіз кез келген банк немесе дүкеннен 0-0-12 және 0-0-24 бөліп төлеу алуға толық жетеді.
              </p>
            </div>
          </div>

          {/* Balance & Topup Card */}
          <div className="bg-[#221710] border border-[#4a3325] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c98e60] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#4ade80]" />
                Жеке шот балансы
              </span>
              <span className="text-[10px] text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-md border border-[#4ade80]/20 font-semibold">
                Белсенді
              </span>
            </div>

            <div className="my-2">
              <p className="text-3xl font-black text-[#fff9f5] font-mono tabular-nums">
                {(user?.balance || 0).toLocaleString()} ₸
              </p>
              <p className="text-xs text-[#c98e60] mt-0.5">
                Бөліп төлеулерді өтеуге және тауар сатып алуға қолжетімді
              </p>
            </div>

            {/* Quick Topup */}
            <div className="pt-4 border-t border-[#3a271c] space-y-3">
              <label className="text-xs font-semibold text-[#ebd3be] block">
                Баланс толтыру (Kaspi Pay / Карта):
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                      topupAmount === amt
                        ? 'bg-[#3a271c] border-[#c98e60] text-[#dba77b] font-bold'
                        : 'bg-[#150d08] border-[#3a271c] text-[#c98e60] hover:text-[#f7ede2]'
                    }`}
                  >
                    +{(amt / 1000).toFixed(0)} мың
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  placeholder="Соманы енгізіңіз"
                  className="w-full bg-[#150d08] border border-[#3a271c] rounded-xl px-3 py-2 text-xs text-[#f7ede2] font-mono tabular-nums focus:outline-none focus:border-[#c98e60]"
                />
                <button
                  type="button"
                  onClick={handleTopup}
                  disabled={isTopupLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] font-black text-xs shadow-md shadow-[#b5805a]/20 transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                >
                  {isTopupLoading ? 'Өңделуде...' : 'Толтыру'}
                </button>
              </div>

              {topupSuccess && (
                <p className="text-xs text-[#4ade80] flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Баланс сәтті толықтырылды!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Information Form */}
        <div className="lg:col-span-7">
          <div className="bg-[#221710] border border-[#4a3325] rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#f7ede2] mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-[#dba77b]" />
              Клиенттің жеке деректері
            </h3>
            <p className="text-xs text-[#c98e60] mb-5">
              Келісімшарттарға ресми түрде қол қою үшін деректердің дұрыстығын тексеріңіз
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  Толық аты-жөніңіз (ФИО)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8f6449] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Аты-жөніңіз"
                    className="w-full bg-[#150d08] border border-[#3a271c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f7ede2] focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
              </div>

              {/* IIN */}
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  ЖСН / ИИН (12 таңбалы сан)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#8f6449] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iin}
                    maxLength={12}
                    onChange={(e) => setIin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Мысалы: 980415301824"
                    className="w-full bg-[#150d08] border border-[#3a271c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#dba77b] font-mono tabular-nums focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#8f6449] mt-1">
                  Келісімшартта сатып алушының ресми сәйкестендіргіші ретінде қолданылады
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  Телефон нөмірі (SMS OTP растау үшін)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8f6449] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 775 842 9102"
                    className="w-full bg-[#150d08] border border-[#3a271c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f7ede2] font-mono focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  Email мекенжайы
                </label>
                <input
                  type="email"
                  value={user?.email || 'nurik.nur478@gmail.com'}
                  disabled
                  className="w-full bg-[#150d08]/60 border border-[#3a271c] rounded-xl px-4 py-2.5 text-sm text-[#8f6449] cursor-not-allowed"
                />
              </div>

              {/* Status and Save button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] font-black text-xs shadow-lg shadow-[#b5805a]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Сақталуда...' : 'Өзгерістерді сақтау'}
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Профиль мәліметтері сәтті жаңартылды!
                </div>
              )}
            </form>

            {/* Legal Security Badge */}
            <div className="mt-6 pt-5 border-t border-[#3a271c] flex items-start gap-3 text-xs text-[#c98e60]">
              <ShieldCheck className="w-5 h-5 text-[#4ade80] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#ebd3be]">Дербес деректерді қорғау кепілдігі</p>
                <p className="text-[11px] text-[#8f6449] mt-0.5">
                  Барлық ақпарат ҚР «Дербес деректер және оларды қорғау туралы» 94-IV Заңына сай шифрланған түрде сақталады.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
