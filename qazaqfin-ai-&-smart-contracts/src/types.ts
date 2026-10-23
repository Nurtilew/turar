export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  iin: string;
  phone: string;
  balance: number;
  creditScore: number;
  createdAt: string;
}

export interface Contract {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  audioBase64?: string;
  isLoadingAudio?: boolean;
}

export type AssistantMode = 'finance' | 'legal' | 'general' | 'scoring';
