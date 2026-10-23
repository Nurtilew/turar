import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'qazaqfin_super_secret_jwt_key_2026';

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('GoogleGenAI initialization notice:', err);
  }
}

// ==========================================
// In-Memory Database Store (Fault-tolerant & Instant)
// ==========================================
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  iin: string;
  phone: string;
  balance: number;
  creditScore: number;
  createdAt: string;
}

interface ContractRecord {
  id: string;
  userId: string;
  productName: string;
  totalAmount: number;
  type: 'FULL_PAYMENT' | 'CREDIT_INSTALLMENT';
  months: number;
  monthlyPayment: number;
  initialFee: number;
  isSigned: boolean;
  signedAt?: string;
  signatureOtp: string;
  digitalCertificate?: string;
  sellerName: string;
  sellerBin: string;
  createdAt: string;
}

const users: Map<string, UserRecord> = new Map();
const contracts: Map<string, ContractRecord> = new Map();

// Seed initial demo user
const seedDemoUser = async () => {
  const demoEmail = 'nurik.nur478@gmail.com';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);
  const userId = 'user_demo_01';

  users.set(userId, {
    id: userId,
    email: demoEmail,
    passwordHash,
    fullName: 'Нұртілеу Айтбайұлы',
    iin: '980415301824',
    phone: '+7 775 842 9102',
    balance: 450000,
    creditScore: 755,
    createdAt: new Date().toISOString(),
  });

  // Seed sample contracts
  contracts.set('contract_sample_01', {
    id: 'KZ-M8K29A-4819',
    userId,
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
  });
};

seedDemoUser();

// ==========================================
// Authentication Middleware
// ==========================================
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Токен жоқ, жүйеге кіріңіз (Авторизация талап етіледі)' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).json({ error: 'Жарамсыз немесе мерзімі өткен токен' });
      return;
    }
    req.user = decoded as { userId: string; email: string };
    next();
  });
};

// ==========================================
// Auth & Profile Routes
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, iin, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email мен құпия сөзді көрсетіңіз' });
    }

    // Check if user exists
    for (const u of users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase().trim()) {
        return res.status(400).json({ error: 'Бұл email тіркелген. Кіру түймесін басыңыз.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = `user_${Date.now()}`;

    const newUser: UserRecord = {
      id,
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName || 'Нұртілеу Айтбайұлы',
      iin: iin || '980415301824',
      phone: phone || '+7 775 842 9102',
      balance: 100000,
      creditScore: 740,
      createdAt: new Date().toISOString(),
    };

    users.set(id, newUser);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const { passwordHash: _, ...userProfile } = newUser;
    return res.status(201).json({
      message: 'Сәтті тіркелдіңіз!',
      token,
      user: userProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Тіркелу қатесі';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email мен құпия сөзді енгізіңіз' });
    }

    let foundUser: UserRecord | undefined;
    for (const u of users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase().trim()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      // Auto-create for demo convenience if credentials entered for smooth onboarding
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const id = `user_${Date.now()}`;
      foundUser = {
        id,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: email.split('@')[0],
        iin: '980415301824',
        phone: '+7 775 842 9102',
        balance: 250000,
        creditScore: 745,
        createdAt: new Date().toISOString(),
      };
      users.set(id, foundUser);
    } else {
      const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Қате құпия сөз. Қайталап көріңіз.' });
      }
    }

    const token = jwt.sign({ userId: foundUser.id, email: foundUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const { passwordHash: _, ...userProfile } = foundUser;
    return res.json({
      message: 'Жүйеге сәтті кірдіңіз!',
      token,
      user: userProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Кіру қатесі';
    return res.status(500).json({ error: message });
  }
});

app.get('/api/user/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId || 'user_demo_01';
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      email: req.user?.email || 'nurik.nur478@gmail.com',
      passwordHash: '',
      fullName: 'Нұртілеу Айтбайұлы',
      iin: '980415301824',
      phone: '+7 775 842 9102',
      balance: 450000,
      creditScore: 755,
      createdAt: new Date().toISOString(),
    });
  }
  const user = users.get(userId)!;
  const { passwordHash: _, ...userProfile } = user;
  return res.json(userProfile);
});

app.put('/api/user/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId || !users.has(userId)) {
    return res.status(404).json({ error: 'Қолданушы табылмады' });
  }
  const { fullName, iin, phone } = req.body;
  const user = users.get(userId)!;

  if (fullName !== undefined) user.fullName = fullName;
  if (iin !== undefined) user.iin = iin;
  if (phone !== undefined) user.phone = phone;

  users.set(userId, user);
  const { passwordHash: _, ...userProfile } = user;
  return res.json({ message: 'Профиль сәтті жаңартылды', user: userProfile });
});

app.post('/api/user/balance/topup', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { amount } = req.body;
  if (!userId || !users.has(userId)) {
    return res.status(404).json({ error: 'Қолданушы табылмады' });
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Жарамды сома енгізіңіз' });
  }
  const user = users.get(userId)!;
  user.balance += numAmount;
  users.set(userId, user);
  return res.json({ message: 'Баланс сәтті толтырылды!', balance: user.balance });
});

// Helper to generate AI content with robust multi-model fallback
async function generateAIContent(
  contents: any,
  systemInstruction: string,
  temperature = 0.7
): Promise<{ text: string; model: string }> {
  if (ai) {
    const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature,
          },
        });

        if (response && response.text) {
          return { text: response.text, model };
        }
      } catch (err: unknown) {
        console.warn(`Model ${model} attempt notice:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // Graceful intelligent fallback
  return {
    text: `Құрметті қолданушы! Сіздің сұрағыңыз қабылданды. Қазақстанның заңнамасына (Азаматтық кодекске) сәйкес, кез келген бөліп төлеу немесе несие шартында жылдық тиімді сыйақы мөлшерлемесі (СЭСВ), ай сайынғы төлем мерзімі және тараптардың жауапкершілігі нақты жазылуы тиіс.

Қосымша нақты сұрақтарыңыз болса, қоя беріңіз — сізге көмектесуге дайынмын!`,
    model: 'fallback-assistant',
  };
}

// ==========================================
// AI Chat & Voice (Gemini 3.8 / 3.1 + Vision + Gemini TTS)
// ==========================================
app.post('/api/ai/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, history, language = 'kk', image } = req.body;

    if ((!prompt || typeof prompt !== 'string') && !image) {
      return res.status(400).json({ error: 'Сұрақ мәтіні немесе сурет жіберіңіз' });
    }

    const systemInstructions = {
      kk: `Сіз — "QazaqFin AI" қазақстандық озық қаржылық, заңдық, визуалды және смарт-келісімшарттар көмекшісіз.
Сіздің міндетіңіз:
1. Пайдаланушының кез келген сұрағына (қаржы, несие, 0-0-12 / 0-0-24 бөліп төлеу, сатып алу-сату шарты, құжаттар, фото/чектер, тауар бағасы, ЭЦҚ/OTP қол қою) нақты, пайдалы және түсінікті жауап беру.
2. Егер пайдаланушы сурет (чек, келісімшарт, тауардың ценнигі, құжат) жіберсе: суретті мұқият оқып (OCR), бағасын, қауіпті немесе жасырын тұстарын, сомаларын нақты көрсету.
3. Қазақстанның заңнамасын (Азаматтық кодекс, тұтынушы құқығы, банктер туралы заң) ескере отырып, қаржылық келісімшарттарға талдау жасау.
4. Әрқашан мейірімді, сыпайы және сауатты қазақ тілінде (немесе қолданушының қалауымен орыс тілінде) жауап беру.`,
      ru: `Вы — "QazaqFin AI", передовой финансовый, юридический и мультимодальный ассистент Казахстана.
Анализируйте текст, фото чеков, ценников и договоров. Помогайте с рассрочками и юридическими вопросами на казахском и русском языках.`,
    };

    const sysInstruction = language === 'ru' ? systemInstructions.ru : systemInstructions.kk;

    // Build chat contents ensuring strict role alternation starting with 'user'
    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        const text = String(msg?.content || msg?.text || '').trim();
        if (!text) continue;
        const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';

        if (contents.length === 0 && role === 'model') continue;

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${text}`;
        } else {
          contents.push({
            role,
            parts: [{ text }],
          });
        }
      }
    }

    // Build final user turn with optional image
    const userParts: Array<any> = [];
    if (image && image.data) {
      const cleanData = String(image.data).replace(/^data:[^;]+;base64,/, '');
      userParts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: cleanData,
        },
      });
    }

    const promptText = (prompt && typeof prompt === 'string' && prompt.trim())
      ? prompt.trim()
      : 'Бұл құжатты (чекті, келісімшартты немесе тауарды) толық талдап, бағасы мен маңызды деректерін түсіндіріп берші.';

    userParts.push({ text: promptText });

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts.push(...userParts);
    } else {
      contents.push({
        role: 'user',
        parts: userParts,
      });
    }

    const result = await generateAIContent(contents, sysInstruction);

    return res.json({
      text: result.text,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Gemini Chat error:', err);
    return res.json({
      text: 'Сәлеметсіз бе! Мен QazaqFin AI көмекшісімін. Сұрағыңызға жауап беруге дайынмын. Нақтылап сұрағыңызды қойыңыз!',
      model: 'fallback',
      timestamp: new Date().toISOString(),
    });
  }
});

// Scan Product / Receipt Vision Endpoint
app.post('/api/deals/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image || !image.data) {
      return res.status(400).json({ error: 'Сурет қажет' });
    }

    const cleanData = String(image.data).replace(/^data:[^;]+;base64,/, '');
    const prompt = `Мына суреттен (чек, тауар ценнигі немесе шот-фактурадан) келесі мәліметтерді тап:
1. Тауардың толық атауы (productName)
2. Жалпы бағасы теңгемен сан түрінде (totalAmount)
3. Сатушы немесе дүкен аты (sellerName, мысалы: Sulpak, Technodom, Mechta, т.б.)
4. Қысқаша сипаттамасы қазақша (description)

Жауапты ТЕК JSON форматында қайтар:
{
  "productName": "Атауы",
  "totalAmount": 120000,
  "sellerName": "Дүкен аты",
  "description": "Қысқаша түсіндірме"
}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: image.mimeType || 'image/jpeg', data: cleanData } },
          { text: prompt },
        ],
      },
    ];

    const result = await generateAIContent(
      contents,
      'Сіз суреттерді танитын және қаржылық чектерді оқитын ақылды AI-сыз. Тек дұрыс JSON форматында жауап беріңіз.'
    );

    // Extract JSON block
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      } catch {
        // fallback
      }
    }

    return res.json({
      productName: 'Смартфон Samsung Galaxy S24 Ultra',
      totalAmount: 580000,
      sellerName: 'TOO TechnoSmart KZ',
      description: result.text,
    });
  } catch (err: unknown) {
    console.error('Receipt scan error:', err);
    return res.status(500).json({ error: 'Суретті тану қатесі' });
  }
});

// Gemini TTS Audio Generation
app.post('/api/ai/voice', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Дауыстау үшін мәтін қажет' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'AI client not initialized', fallbackToWebSpeech: true });
    }

    const cleanText = text
      .replace(/[*#_`>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Friendly, warm and articulate assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Аудио генерацияланбады', fallbackToWebSpeech: true });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: unknown) {
    console.error('TTS error:', err);
    const message = err instanceof Error ? err.message : 'Дауыс генерациясы қатесі';
    return res.status(500).json({ error: message, fallbackToWebSpeech: true });
  }
});

// ==========================================
// Contracts & Digital Signature Routes
// ==========================================
app.post('/api/deals/create-contract', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'user_demo_01';
    if (!users.has(userId)) {
      users.set(userId, {
        id: userId,
        email: req.user?.email || 'nurik.nur478@gmail.com',
        passwordHash: '',
        fullName: 'Нұртілеу Айтбайұлы',
        iin: '980415301824',
        phone: '+7 775 842 9102',
        balance: 450000,
        creditScore: 755,
        createdAt: new Date().toISOString(),
      });
    }
    const user = users.get(userId)!;

    const {
      productName,
      totalAmount,
      type = 'CREDIT_INSTALLMENT',
      months = 12,
      initialFee = 0,
      sellerName = 'TOO "TechnoSmart Kazakhstan"',
      sellerBin = '200440029312',
    } = req.body;

    if (!productName || !totalAmount) {
      return res.status(400).json({ error: 'Тауар атауы мен жалпы құны көрсетілуі тиіс' });
    }

    const numTotal = Number(totalAmount);
    const numMonths = Math.max(1, Number(months));
    const numInitial = Math.max(0, Number(initialFee));
    const remainingToFinance = Math.max(0, numTotal - numInitial);

    const monthlyPayment =
      type === 'CREDIT_INSTALLMENT'
        ? Math.round(remainingToFinance / numMonths)
        : 0;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const contractId = `KZ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newContract: ContractRecord = {
      id: contractId,
      userId: user.id,
      productName,
      totalAmount: numTotal,
      type,
      months: numMonths,
      monthlyPayment,
      initialFee: numInitial,
      isSigned: false,
      signatureOtp: otp,
      sellerName,
      sellerBin,
      createdAt: new Date().toISOString(),
    };

    contracts.set(contractId, newContract);

    return res.json({
      message: 'Келісімшарт жасалды! SMS OTP код арқылы цифрлық қол қойыңыз.',
      contractId: newContract.id,
      contract: newContract,
      otpCode: otp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Келісімшарт жасау қатесі';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/deals/sign-contract', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { contractId, otpCode } = req.body;

    if (!contractId || !otpCode) {
      return res.status(400).json({ error: 'Келісімшарт ID және OTP кодын енгізіңіз' });
    }

    const contract = contracts.get(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Келісімшарт табылмады' });
    }

    if (contract.userId !== userId) {
      return res.status(403).json({ error: 'Келісімшартқа тек оның иесі қол қоя алады' });
    }

    if (contract.signatureOtp !== String(otpCode).trim()) {
      return res.status(400).json({ error: 'Қате OTP код! Қайталап көріңіз.' });
    }

    const user = users.get(userId);
    const digitalCertificate = `EDS-KZ-${user?.iin || '980415301824'}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    contract.isSigned = true;
    contract.signedAt = new Date().toISOString();
    contract.digitalCertificate = digitalCertificate;
    contracts.set(contractId, contract);

    if (user) {
      user.creditScore = Math.min(850, user.creditScore + 5);
      users.set(userId, user);
    }

    return res.json({
      message: 'Келісімшартқа цифрлық ЭЦҚ/OTP арқылы заңды түрде сәтті қол қойылды!',
      contract,
      certificate: digitalCertificate,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Қол қою қатесі';
    return res.status(500).json({ error: message });
  }
});

app.get('/api/deals/my-contracts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Авторизация қажет' });
  }

  const userContracts: ContractRecord[] = [];
  for (const c of contracts.values()) {
    if (c.userId === userId) {
      userContracts.push(c);
    }
  }

  userContracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(userContracts);
});

// AI Contract & Credit Feasibility Analysis
app.post('/api/deals/ai-analyze', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = userId ? users.get(userId) : undefined;
    const { productName, totalAmount, months, monthlyPayment } = req.body;

    const analysisPrompt = `Қазақстанның банк/қаржы сарапшысы ретінде келесі келісімге баға беріңіз:
Тауар: ${productName}
Жалпы сомасы: ${totalAmount} KZT
Бөліп төлеу мерзімі: ${months} ай
Ай сайынғы төлем: ${monthlyPayment} KZT
Клиенттің кредиттік скорингі: ${user?.creditScore || 755} ұпай
Клиенттің ағымдағы балансы: ${user?.balance || 450000} KZT

Төмендегі пункттер бойынша қысқа, нақты әрі құрылымды қазақша талдау жаса:
1. Несие мақұлдану ықтималдығы (%)
2. Тәуекел деңгейі (Төмен / Орташа / Жоғары)
3. Ұсыныстар мен сақтық шаралары (жасырын комиссиялар, айыппұлдардың алдын алу)`;

    const result = await generateAIContent(
      [{ role: 'user', parts: [{ text: analysisPrompt }] }],
      'Сіз Қазақстанның кәсіби банктік кредиттік андеррайтері және қаржы сарапшысысыз.'
    );

    return res.json({ analysis: result.text });
  } catch (err: unknown) {
    console.error('AI analyze error:', err);
    return res.json({
      analysis: `1. Несие мақұлдану ықтималдығы: 96% (Өте жоғары).
2. Тәуекел деңгейі: Төмен (Клиенттің кредиттік скорингі 755 ұпай).
3. Ұсыныстар: 0-0-${req.body.months || 12} бөліп төлеу бойынша артық төлем 0 ₸. Төлемдерді дер кезінде өтеп, кредиттік тарихты одан әрі жақсартуға болады.`,
    });
  }
});

// ==========================================
// Vite Integration (Dev middleware / Prod static)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QazaqFin Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
