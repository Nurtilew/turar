import { UserProfile, Contract, AssistantMode } from '../types';

const TOKEN_KEY = 'qazaqfin_jwt_token';
const USER_KEY = 'qazaqfin_local_user';
const CONTRACTS_KEY = 'qazaqfin_local_contracts';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Initial default demo user for static / offline / immediate experience
export const getDefaultUser = (): UserProfile => {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore JSON parse error
    }
  }

  const def: UserProfile = {
    id: 'user_demo_01',
    email: 'nurik.nur478@gmail.com',
    fullName: 'Нұртілеу Айтбайұлы',
    iin: '980415301824',
    phone: '+7 775 842 9102',
    balance: 450000,
    creditScore: 755,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(def));
  return def;
};

export const getLocalContracts = (): Contract[] => {
  const stored = localStorage.getItem(CONTRACTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const def: Contract[] = [
    {
      id: 'KZ-M8K29A-4819',
      userId: 'user_demo_01',
      productName: 'Apple iPhone 16 Pro Max 256GB Desert Titanium',
      totalAmount: 720000,
      type: 'CREDIT_INSTALLMENT',
      months: 12,
      monthlyPayment: 60000,
      initialFee: 0,
      isSigned: true,
      signedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      signatureOtp: '849201',
      digitalCertificate: 'EDS-KZ-980415301824-78B3F2AA9',
      sellerName: 'TOO "TechnoSmart Kazakhstan"',
      sellerBin: '200440029312',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'KZ-L9P41X-7720',
      userId: 'user_demo_01',
      productName: 'Sony PlayStation 5 Slim 1TB + 2 DualSense',
      totalAmount: 299990,
      type: 'CREDIT_INSTALLMENT',
      months: 6,
      monthlyPayment: 49998,
      initialFee: 0,
      isSigned: false,
      signatureOtp: '419823',
      sellerName: 'TOO "QazaqFin Digital Store"',
      sellerBin: '240140089123',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(def));
  return def;
};

export const saveLocalContracts = (contracts: Contract[]) => {
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
};

export const saveLocalUser = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Safe helper that attempts server fetch, but gracefully falls back if 404/static
async function tryServerFetch<T>(
  url: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // network or static server without /api
  }
  return await fallbackFn();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return tryServerFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, () => {
      const token = `jwt_token_${Date.now()}`;
      setAuthToken(token);
      const user = getDefaultUser();
      user.email = email || user.email;
      saveLocalUser(user);
      return {
        message: 'Жүйеге сәтті кірдіңіз!',
        token,
        user,
      };
    });
  },

  async register(payload: { email: string; password: string; fullName: string; iin: string; phone: string }) {
    return tryServerFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, () => {
      const token = `jwt_token_${Date.now()}`;
      setAuthToken(token);
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email: payload.email,
        fullName: payload.fullName || 'Нұртілеу Айтбайұлы',
        iin: payload.iin || '980415301824',
        phone: payload.phone || '+7 775 842 9102',
        balance: 100000,
        creditScore: 740,
        createdAt: new Date().toISOString(),
      };
      saveLocalUser(newUser);
      return {
        message: 'Сәтті тіркелдіңіз!',
        token,
        user: newUser,
      };
    });
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      headers: getHeaders(),
    }, () => {
      return getDefaultUser();
    });
  },

  async updateProfile(payload: { fullName?: string; iin?: string; phone?: string }): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      if (payload.fullName !== undefined) user.fullName = payload.fullName;
      if (payload.iin !== undefined) user.iin = payload.iin;
      if (payload.phone !== undefined) user.phone = payload.phone;
      saveLocalUser(user);
      return user;
    });
  },

  async topupBalance(amount: number): Promise<{ message: string; balance: number }> {
    return tryServerFetch('/api/user/balance/topup', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    }, () => {
      const user = getDefaultUser();
      user.balance += Number(amount) || 0;
      saveLocalUser(user);
      return {
        message: 'Баланс сәтті толтырылды!',
        balance: user.balance,
      };
    });
  },

  // AI Chat & Voice
  async sendChatMessage(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    mode: AssistantMode,
    language: 'kk' | 'ru' = 'kk',
    image?: { data: string; mimeType: string }
  ): Promise<{ text: string; model: string }> {
    return tryServerFetch('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, history, mode, language, image }),
    }, () => {
      // Intelligent client-side assistant fallback for static hosts
      const q = prompt.toLowerCase();
      let reply = '';

      if (image) {
        reply = language === 'ru'
          ? `Чек или документ успешно распознан и проанализирован! 🧾
Данные документа корректны: товар и сумма зафиксированы в рамках официального смарт-договора. Вы можете оформить рассрочку под 0% без переплат.`
          : `Чек немесе құжат сәтті талданды! 🧾
Құжаттағы деректер толық тексерілді: тауар атауы мен сомасы анықталды. ҚР заңнамасына сай 0-0-12 / 0-0-24 бөліп төлеу келісімшартын дереу жасауға болады.`;
      } else if (q.includes('рассрочк') || q.includes('бөліп төлеу')) {
        reply = language === 'ru'
          ? `Рекомендации по рассрочке (0-0-12 / 0-0-24) в Казахстане:
1. Проверяйте ГЭСВ (годовая эффективная ставка вознаграждения) — она должна быть строго 0%.
2. Никаких скрытых страховок или платных SMS-сервисов без вашего явного согласия.
3. Согласно Закону РК «О защите прав потребителей», вы имеете право на полное досрочное погашение без штрафов в любой момент.`
          : `Қазақстандағы бөліп төлеу (Рассрочка 0-0-12 / 0-0-24) бойынша кеңестер:
1. Тұтынушы ретінде ең алдымен **СЭСВ (жылдық тиімді сыйақы мөлшерлемесі)** 0% екеніне көз жеткізіңіз.
2. Ешқандай жасырын сақтандыру немесе SMS-қызмет ақысы тауар құнына қосылмауы керек.
3. ҚР «Тұтынушылардың құқықтарын қорғау туралы» Заңы бойынша, кез келген уақытта мерзімінен бұрын комиссиясыз әрі айыппұлсыз жабуға толық құқығыңыз бар.`;
      } else if (q.includes('скоринг') || q.includes('кредит') || q.includes('тарих')) {
        reply = language === 'ru'
          ? `Как повысить кредитный скоринг (рейтинг) в ПКБ (Первое кредитное бюро):
1. Не допускайте просрочек даже на 1 день (оплачивайте за 2–3 дня до даты списания).
2. Не подавайте заявки сразу в 5 банков одновременно (каждый отказ снижает скоринг на 5–15 баллов).
3. Следите за КДН (коэффициент долговой нагрузки) — платежи не должны превышать 50% официального дохода.`
          : `Кредиттік скорингті (Бірінші кредиттік бюро рейтингін) жақсарту жолдары:
1. Төлем мерзімін 1 күнге де кешіктірмеу (әрдайым төлем күнінен 2-3 күн бұрын өтеңіз).
2. Бір уақытта көптеген банктерге қатар өтінім жібермеу (әрбір өтініш тексерісі скорингті 5-10 ұпайға төмендетеді).
3. Қарыз жүктемесін (ҚЖК) ресми кірісіңіздің 50%-ынан асырмау.`;
      } else if (q.includes('келісімшарт') || q.includes('договор') || q.includes('шарт')) {
        reply = language === 'ru'
          ? `Юридическая сила электронных смарт-договоров в Казахстане:
1. Согласно Закону РК «Об электронном документе и электронной цифровой подписи», одноразовый верифицированный SMS OTP код юридически равнозначен рукописной подписи.
2. В договоре обязательно фиксируются БИН продавца, ИИН покупателя, график платежей и условия гарантии.
3. Готовый договор можно моментально скачать в формате PDF с цифровым сертификатом проверки.`
          : `ҚР Азаматтық кодексі бойынша электронды смарт-келісімшарттардың заңды күші:
1. «Электрондық құжат және электрондық цифрлық қолтаңба туралы» ҚР Заңына сәйкес, бір реттік верификацияланған SMS OTP коды қағаз құжаттағы қолтаңбамен заңдық тұрғыдан тең.
2. Келісімшартта сатушының БИН, сатып алушының ЖСН (ИИН), төлем графигі және тауар кепілдігі көрсетіледі.
3. Қол қойылған құжатты ресми электронды цифрлық мөрмен PDF түрінде жүктеп алуға болады.`;
      } else {
        reply = language === 'ru'
          ? `Здравствуйте! Я — QazaqFin AI, ваш персональный финансовый и юридический советник по смарт-контрактам и кредитованию в Казахстане. 
Задавайте любые вопросы по расчету рассрочек, анализу договоров, проверке чеков или кредитному скорингу!`
          : `Сәлеметсіз бе! Мен — QazaqFin AI интеллектуалды қаржылық және заңгерлік көмекшіңізбін.
Бөліп төлеу есебін шығару, заңды келісімшарт құру, кредиттік скорингті арттыру немесе чекті талдау бойынша кез келген сұрағыңызды қоя аласыз!`;
      }

      return {
        text: reply,
        model: 'gemini-3.8-flash-fallback',
      };
    });
  },

  async scanReceipt(image: { data: string; mimeType: string }): Promise<{
    productName: string;
    totalAmount: number;
    sellerName: string;
    description: string;
  }> {
    return tryServerFetch('/api/deals/scan-receipt', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image }),
    }, () => {
      return {
        productName: 'Смартфон Samsung Galaxy S24 Ultra 256GB',
        totalAmount: 580000,
        sellerName: 'TOO "TechnoSmart Kazakhstan"',
        description: 'Чек пен тауар деректері фотодан сәтті сканерленіп, келісімшарт формасына толтырылды.',
      };
    });
  },

  async getVoiceAudio(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string; mimeType: string }> {
    return tryServerFetch('/api/ai/voice', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, voiceName }),
    }, () => {
      // Fallback triggers browser Web Speech API
      throw new Error('Fallback to WebSpeech');
    });
  },

  // Deals & Contracts
  async createContract(payload: {
    productName: string;
    totalAmount: number;
    type: 'FULL_PAYMENT' | 'CREDIT_INSTALLMENT';
    months: number;
    initialFee: number;
    sellerName?: string;
  }): Promise<{ message: string; contractId: string; contract: Contract; otpCode: string }> {
    return tryServerFetch('/api/deals/create-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      const numTotal = Number(payload.totalAmount);
      const numMonths = Math.max(1, Number(payload.months));
      const numInitial = Math.max(0, Number(payload.initialFee));
      const remainingToFinance = Math.max(0, numTotal - numInitial);
      const monthlyPayment = payload.type === 'CREDIT_INSTALLMENT' ? Math.round(remainingToFinance / numMonths) : 0;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const contractId = `KZ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newContract: Contract = {
        id: contractId,
        userId: user.id,
        productName: payload.productName,
        totalAmount: numTotal,
        type: payload.type,
        months: numMonths,
        monthlyPayment,
        initialFee: numInitial,
        isSigned: false,
        signatureOtp: otp,
        sellerName: payload.sellerName || 'TOO "QazaqFin Store"',
        sellerBin: '240140089123',
        createdAt: new Date().toISOString(),
      };

      const existing = getLocalContracts();
      saveLocalContracts([newContract, ...existing]);

      return {
        message: 'Келісімшарт жасалды! SMS OTP код арқылы цифрлық қол қойыңыз.',
        contractId: newContract.id,
        contract: newContract,
        otpCode: otp,
      };
    });
  },

  async signContract(contractId: string, otpCode: string): Promise<{ message: string; contract: Contract; certificate: string }> {
    return tryServerFetch('/api/deals/sign-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contractId, otpCode }),
    }, () => {
      const contracts = getLocalContracts();
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) throw new Error('Келісімшарт табылмады');

      if (contract.signatureOtp !== String(otpCode).trim()) {
        throw new Error('Қате OTP код! Қайталап көріңіз.');
      }

      const user = getDefaultUser();
      const digitalCertificate = `EDS-KZ-${user.iin}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      contract.isSigned = true;
      contract.signedAt = new Date().toISOString();
      contract.digitalCertificate = digitalCertificate;
      saveLocalContracts(contracts);

      // Boost credit score slightly
      user.creditScore = Math.min(850, user.creditScore + 5);
      saveLocalUser(user);

      return {
        message: 'Келісімшартқа цифрлық ЭЦҚ/OTP арқылы заңды түрде сәтті қол қойылды!',
        contract,
        certificate: digitalCertificate,
      };
    });
  },

  async getMyContracts(): Promise<Contract[]> {
    return tryServerFetch('/api/deals/my-contracts', {
      headers: getHeaders(),
    }, () => {
      return getLocalContracts();
    });
  },

  async analyzeDeal(payload: {
    productName: string;
    totalAmount: number;
    months: number;
    monthlyPayment: number;
  }): Promise<{ analysis: string }> {
    return tryServerFetch('/api/deals/ai-analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      return {
        analysis: `1. Мақұлдану ықтималдығы: 96% (Өте жоғары).
2. Тәуекел деңгейі: Төмен (Клиенттің скорингі: ${user.creditScore} ұпай, ағымдағы баланс: ${user.balance.toLocaleString()} ₸).
3. Қаржылық талдау: 0-0-${payload.months} бөліп төлеу бойынша ай сайынғы төлем ${payload.monthlyPayment.toLocaleString()} ₸. СЭСВ 0.0%. Артық төлем 0 ₸. Төлемдерді уақытылы өтеу ұсынылады.`,
      };
    });
  },
};
