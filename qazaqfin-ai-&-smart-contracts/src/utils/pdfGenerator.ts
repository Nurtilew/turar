import jsPDF from 'jspdf';
import { Contract, UserProfile } from '../types';

export const generateContractPDF = (contract: Contract, user?: UserProfile | null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header - Dark coffee banner style
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(42, 26, 17); // Dark roast coffee
  doc.text('ELEKTRONIKALYQ SMART KELISIMSHART', pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(112, 82, 60); // Warm mocha
  doc.text('QAZAQSTAN RESPUBLIKASY AZAMATTYQ KODEKSINE SAIKES', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Separator line
  doc.setDrawColor(198, 139, 89); // Golden caramel
  doc.setLineWidth(0.8);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(112, 82, 60);
  doc.text(`Kelisimshart No: ${contract.id}`, 15, y);
  const dateStr = new Date(contract.createdAt).toLocaleDateString('kk-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Kuni: ${dateStr}`, pageWidth - 15, y, { align: 'right' });
  y += 10;

  // Section 1: Parties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(42, 26, 17);
  doc.text('1. TARAPTAR DEREKTERI (PARTIES INFORMATION)', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 40, 28);

  // Seller box - Warm coffee crema
  doc.setFillColor(250, 244, 238);
  doc.setDrawColor(220, 195, 175);
  doc.roundedRect(15, y, (pageWidth - 35) / 2, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(92, 58, 38);
  doc.text('SATUSHY (SELLER):', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(42, 26, 17);
  doc.text(contract.sellerName || 'TOO QazaqFin Store', 18, y + 12);
  doc.text(`BIN: ${contract.sellerBin || '240140089123'}`, 18, y + 18);
  doc.text('Almaty q., Dostyq d-ly, 180', 18, y + 24);

  // Buyer box
  const rightX = 15 + (pageWidth - 35) / 2 + 5;
  doc.setFillColor(250, 244, 238);
  doc.roundedRect(rightX, y, (pageWidth - 35) / 2, 28, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(92, 58, 38);
  doc.text('SATYP ALUSHY (BUYER):', rightX + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(42, 26, 17);
  doc.text(user?.fullName || 'Tirkelgen qoldanushy', rightX + 3, y + 12);
  doc.text(`IIN: ${user?.iin || '980415301824'}`, rightX + 3, y + 18);
  doc.text(`Tel: ${user?.phone || '+7 775 842 9102'}`, rightX + 3, y + 24);

  y += 35;

  // Section 2: Subject & Pricing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(42, 26, 17);
  doc.text('2. SHART MANI JANE TOLEM KESTESI (TERMS & FINANCING)', 15, y);
  y += 6;

  // Product table header
  doc.setFillColor(235, 218, 203);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(74, 46, 30);
  doc.text('Tauar atauly (Product)', 18, y + 5.5);
  doc.text('Turi (Type)', 110, y + 5.5);
  doc.text('Tolem (Amount)', pageWidth - 18, y + 5.5, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(42, 26, 17);
  doc.text(contract.productName, 18, y + 6);
  doc.text(contract.type === 'CREDIT_INSTALLMENT' ? `Rassrochka (${contract.months} ai)` : 'Tolyq tolem', 110, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${contract.totalAmount.toLocaleString()} KZT`, pageWidth - 18, y + 6, { align: 'right' });
  y += 10;

  // Installment Details if applicable
  if (contract.type === 'CREDIT_INSTALLMENT') {
    doc.setFillColor(245, 237, 230);
    doc.setDrawColor(210, 180, 155);
    doc.roundedRect(15, y, pageWidth - 30, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(74, 46, 30);
    doc.text(`- Bastapqy jarna (Down payment): ${contract.initialFee.toLocaleString()} KZT`, 20, y + 6);
    doc.text(`- Bolip toleu merzimi (Duration): ${contract.months} ai (0-0-${contract.months})`, 20, y + 11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(176, 92, 45); // Warm roasted caramel
    doc.text(`- Ai saiyn tolenetin somasy: ${contract.monthlyPayment.toLocaleString()} KZT / ai (Artyq tolem: 0 KZT)`, 20, y + 16);
    y += 26;
  } else {
    y += 4;
  }

  // Section 3: Legal Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(42, 26, 17);
  doc.text('3. ZANDYQ TARTIPTI SHARTTAR (LEGAL CLAUSES)', 15, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 68, 52);

  const legalClauses = [
    '3.1. Mazkur shart Qazaqstan Respublikasy Azamattyq kodeksine jane tutynushylar quqygyn qorgau turaly zanna bagynady.',
    '3.2. Satyp alushy tolem kestesin buzbauga jane belgilengen keste boiynsha ai saiyn tolemdi oryndauga mindetti.',
    '3.3. Tolem keshiktirilgen jagdaiynda Qazaqstan Respublikasy Zannamasyna saikes penya qoldanyluy mumkin.',
    '3.4. Mazkur elektron shart bir rettik SMS OTP kod arqyly kualandyrylyp, zandy kushi qagaz nusqamen ten.',
  ];

  for (const clause of legalClauses) {
    doc.text(clause, 15, y);
    y += 5.5;
  }

  y += 8;

  // Digital Signature / EDS Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(42, 26, 17);
  doc.text('4. CIFRLYQ QOL TANBA MO' + 'RI (DIGITAL VERIFIED STAMP)', 15, y);
  y += 6;

  const stampBoxY = y;
  if (contract.isSigned) {
    doc.setDrawColor(46, 125, 50); // Emerald green stamp border
    doc.setFillColor(242, 250, 243);
    doc.roundedRect(15, stampBoxY, pageWidth - 30, 32, 2, 2, 'FD');

    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('[ V ] QOL QOYILGAN / SIGNED WITH VERIFIED OTP & EDS', 22, stampBoxY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(42, 26, 17);
    doc.text(`Sertifikat: ${contract.digitalCertificate || 'EDS-KZ-VERIFIED-980415301824'}`, 22, stampBoxY + 15);
    const signTime = contract.signedAt ? new Date(contract.signedAt).toLocaleString('kk-KZ') : 'Rastaldy';
    doc.text(`Qol qoyylgan uaqyty: ${signTime}`, 22, stampBoxY + 21);
    doc.text(`SMS OTP kod: ${contract.signatureOtp} (One-Time Password Verified By QazaqFin)`, 22, stampBoxY + 27);
  } else {
    doc.setDrawColor(198, 125, 30); // Caramel warning stamp border
    doc.setFillColor(255, 250, 240);
    doc.roundedRect(15, stampBoxY, pageWidth - 30, 26, 2, 2, 'FD');

    doc.setTextColor(176, 92, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('[ ! ] QOL QOYU KUTILUDE (PENDING DIGITAL SIGNATURE)', 22, stampBoxY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(92, 68, 52);
    doc.text(`Qol qoyu ushin SMS OTP kod: ${contract.signatureOtp}`, 22, stampBoxY + 17);
    doc.text('Kelisimshartty bekitu ushin portal arqyly 6 sandi kodty engiziniz.', 22, stampBoxY + 22);
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(150, 125, 108);
  doc.text('QazaqFin AI Smart Contracts Portal * Respublika Kazakhstan * Barliq quqyqtar qorgalgan', pageWidth / 2, 285, { align: 'center' });

  // Download trigger
  doc.save(`Kelisimshart_${contract.id}.pdf`);
};
