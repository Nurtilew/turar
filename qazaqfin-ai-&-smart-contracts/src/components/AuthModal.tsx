import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Hash, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('nurik.nur478@gmail.com');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState('Нұртілеу Айтбайұлы');
  const [iin, setIin] = useState('980415301824');
  const [phone, setPhone] = useState('+7 775 842 9102');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await api.register({
          email,
          password,
          fullName,
          iin,
          phone,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Авторизация қатесі';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login('nurik.nur478@gmail.com', '123456');
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Кіру қатесі';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100a06]/85 backdrop-blur-md p-4">
      <div className="bg-[#221710] border border-[#4a3325] rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-[#f7ede2]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#3a271c] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8f6449] to-[#c98e60] flex items-center justify-center text-[#110905] font-bold">
              <Sparkles className="w-4 h-4 text-[#110905]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f7ede2]">
                {isRegister ? 'Жаңа аккаунт ашу' : 'Жүйеге кіру'}
              </h3>
              <p className="text-[11px] text-[#c98e60]">QazaqFin AI & Smart Contracts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#b5805a] hover:text-[#f7ede2] hover:bg-[#2e1f16] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-4 bg-gradient-to-r from-[#2e1f16] to-[#3a271c] border border-[#c98e60]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#dba77b]">Жылдам Демо Аккаунт</p>
            <p className="text-[10px] text-[#ebd3be]/70 mt-0.5">Нұртілеу Айтбайұлы (Баланс 450,000 ₸, Скоринг 755)</p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#b5805a] to-[#c98e60] hover:brightness-110 text-[#110905] font-extrabold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            1-Басумен кіру
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  Толық аты-жөні (ФИО)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Аты-жөніңізді енгізіңіз"
                    className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f7ede2] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  ЖСН / ИИН (12 сан)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iin}
                    maxLength={12}
                    onChange={(e) => setIin(e.target.value.replace(/\D/g, ''))}
                    placeholder="980415301824"
                    className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#dba77b] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
                  Телефон нөмірі (SMS OTP үшін)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 775 842 9102"
                    className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f7ede2] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
              Электронды пошта (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nurik.nur478@gmail.com"
                className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f7ede2] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#ebd3be] block mb-1">
              Құпия сөз
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8f6449] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#1a100a] border border-[#3a271c] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f7ede2] placeholder-[#8f6449] focus:outline-none focus:border-[#c98e60]"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#f87171] bg-[#3b1212]/50 border border-[#7f1d1d] rounded-xl p-2.5 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] font-black text-xs shadow-lg shadow-[#b5805a]/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Жүктелуде...' : isRegister ? 'Тіркелуді аяқтау' : 'Жүйеге кіру'}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center mt-4 pt-3 border-t border-[#3a271c]">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#dba77b] hover:underline cursor-pointer"
          >
            {isRegister ? 'Аккаунтыңыз бар ма? Кіру' : 'Аккаунтыңыз жоқ па? Тіркелу'}
          </button>
        </div>
      </div>
    </div>
  );
};
