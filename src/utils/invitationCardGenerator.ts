import { EventModel } from '../types';

export function formatInvitationMessage(event: Partial<EventModel>, link: string, guestName?: string): string {
  const isWedding = !event.type || event.type === 'wedding';
  const brideName = event.brideName?.trim() || '';
  const groomName = event.groomName?.trim() || '';
  
  let hostNames = '';
  if (brideName && groomName) {
    hostNames = `${brideName} & ${groomName}`;
  } else if (brideName || groomName) {
    hostNames = brideName || groomName;
  } else if (event.birthdayPerson?.trim()) {
    hostNames = event.birthdayPerson.trim();
  } else {
    hostNames = event.name || 'Hosts';
  }

  let salutation = '';
  if (guestName && guestName.trim() && guestName.trim().toLowerCase() !== 'dear guest') {
    salutation = `Dear ${guestName.trim()},\n\n`;
  }

  if (isWedding) {
    return `You're Invited!\n\n` +
      `${salutation}` +
      `Together with their families,\n\n` +
      `*${hostNames}*\n\n` +
      `warmly invite you to celebrate their wedding.\n\n` +
      `We would be honoured to have you join us on our special day.\n\n` +
      `View the invitation, event details, and RSVP here:\n` +
      `${link}\n\n` +
      `We can't wait to celebrate this beautiful occasion with you!`;
  } else {
    const eventTitle = event.name || 'Special Celebration';
    return `You're Invited!\n\n` +
      `${salutation}` +
      `*${eventTitle}*\n\n` +
      `You are cordially invited to join us for a special celebration.\n\n` +
      `We would be honoured to have you celebrate with us.\n\n` +
      `View the invitation, event details, and RSVP here:\n` +
      `${link}\n\n` +
      `We look forward to seeing you there!`;
  }
}

/**
 * Format event date into human readable string e.g. "Saturday, September 12, 2026"
 */
function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Helper to wrap text into multiple lines for HTML5 Canvas
 */
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Safely load an HTMLImageElement asynchronously with crossOrigin support
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates a high-resolution (1400x1900px) Luxury Enclosure Invitation Card PNG Data URL
 * Clean white background, precise content margins, theme-aware typography, and real asset graphics.
 */
export async function generateInvitationCardDataUrl(
  event: Partial<EventModel>,
  qrCodeUrl: string,
  guestName?: string
): Promise<string> {
  // Proportional A4 Enclosure Card Dimensions (2100 x 2970 px - 210mm x 297mm ratio)
  const width = 2100;
  const height = 2970;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not create canvas context");

  const themeId = event.themeId || 'luxury';
  const isWedding = !event.type || event.type === 'wedding';
  const brideName = event.brideName?.trim() || '';
  const groomName = event.groomName?.trim() || '';
  const birthdayPerson = event.birthdayPerson?.trim() || '';

  let coupleTitle = '';
  if (brideName && groomName) {
    coupleTitle = `${brideName} & ${groomName}`;
  } else if (brideName || groomName) {
    coupleTitle = brideName || groomName;
  } else if (birthdayPerson) {
    coupleTitle = birthdayPerson;
  } else {
    coupleTitle = event.name || 'Celebration';
  }

  const formattedDate = formatEventDate(event.date);
  const venueDisplay = event.venueName?.trim() || event.venue?.split(',')[0]?.trim() || 'Venue TBD';

  // Define Theme Style Configuration for Luxury Stationery (Clean White Background)
  type ThemeConfig = {
    titleColor: string;       // Headings (Bride & Groom, Event name)
    accentColor: string;      // Taglines, dividers, frame accents
    bodyColor: string;        // Dark charcoal for main text readability
    borderPrimary: string;    // Main outer border frame
    borderSecondary: string;  // Hairline inner border frame
    cornerAsset: string;      // Image path for corner watermark
    headerAsset: string;      // Image path for top emblem
    fontSerif: string;
    fontSans: string;
  };

  let themeCfg: ThemeConfig;

  switch (themeId) {
    case 'luxury':
      themeCfg = {
        titleColor: '#C5A028',
        accentColor: '#D4AF37',
        bodyColor: '#1E293B',
        borderPrimary: '#D4AF37',
        borderSecondary: '#E6C687',
        cornerAsset: '/IMG-20260728-WA0007.png',
        headerAsset: '/IMG-20260728-WA0007.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    case 'elegant':
      themeCfg = {
        titleColor: '#334155',
        accentColor: '#B8860B',
        bodyColor: '#0F172A',
        borderPrimary: '#94A3B8',
        borderSecondary: '#CBD5E1',
        cornerAsset: '/IMG-20260728-WA0003.png',
        headerAsset: '/IMG-20260728-WA0007.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    case 'modern':
      themeCfg = {
        titleColor: '#1E3A8A',
        accentColor: '#2563EB',
        bodyColor: '#0F172A',
        borderPrimary: '#1E3A8A',
        borderSecondary: '#93C5FD',
        cornerAsset: '/IMG-20260728-WA0003.png',
        headerAsset: '/IMG-20260728-WA0007.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    case 'rustic':
      themeCfg = {
        titleColor: '#9A3412',
        accentColor: '#C97064',
        bodyColor: '#1C1917',
        borderPrimary: '#C97064',
        borderSecondary: '#FDBA74',
        cornerAsset: '/IMG-20260728-WA0005.png',
        headerAsset: '/IMG-20260728-WA0003.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    case 'floral':
      themeCfg = {
        titleColor: '#9D174D',
        accentColor: '#DB2777',
        bodyColor: '#1E293B',
        borderPrimary: '#F472B6',
        borderSecondary: '#FBCFE8',
        cornerAsset: '/IMG-20260728-WA0014.png',
        headerAsset: '/IMG-20260728-WA0014.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    case 'traditional':
      themeCfg = {
        titleColor: '#78350F',
        accentColor: '#B45309',
        bodyColor: '#1F2937',
        borderPrimary: '#B45309',
        borderSecondary: '#FDE68A',
        cornerAsset: '/IMG-20260728-WA0003.png',
        headerAsset: '/IMG-20260728-WA0007.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;

    default: // ultra minimal / standard
      themeCfg = {
        titleColor: '#171717',
        accentColor: '#525252',
        bodyColor: '#262626',
        borderPrimary: '#525252',
        borderSecondary: '#D4D4D4',
        cornerAsset: '/IMG-20260728-WA0007.png',
        headerAsset: '/IMG-20260728-WA0007.png',
        fontSerif: 'Georgia, serif',
        fontSans: 'sans-serif'
      };
      break;
  }

  // 1. Clean White Primary Canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Load Decorative Image Assets (Corner Watermarks, Header Ornament, & Wedding Rings)
  const [cornerImg, headerImg, ringsImg] = await Promise.all([
    loadImage(themeCfg.cornerAsset),
    loadImage(themeCfg.headerAsset),
    loadImage('/ChatGPT Image Jul 28, 2026, 12_01_58 PM.png')
  ]);

  // Draw Subtle Decorative Corner Watermarks (Opacity ~ 8-10%)
  if (cornerImg) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    const cornerSize = 220;

    // Top-Left Corner
    ctx.drawImage(cornerImg, 30, 30, cornerSize, cornerSize);

    // Top-Right Corner (Flipped horizontally)
    ctx.save();
    ctx.translate(width - 30, 30);
    ctx.scale(-1, 1);
    ctx.drawImage(cornerImg, 0, 0, cornerSize, cornerSize);
    ctx.restore();

    // Bottom-Left Corner (Flipped vertically)
    ctx.save();
    ctx.translate(30, height - 30);
    ctx.scale(1, -1);
    ctx.drawImage(cornerImg, 0, 0, cornerSize, cornerSize);
    ctx.restore();

    // Bottom-Right Corner (Flipped both)
    ctx.save();
    ctx.translate(width - 30, height - 30);
    ctx.scale(-1, -1);
    ctx.drawImage(cornerImg, 0, 0, cornerSize, cornerSize);
    ctx.restore();

    ctx.restore();
  }

  // 3. Elegant Thin Frame Border with Generous Safe Padding
  const margin = 70;
  const outerX = margin;
  const outerY = margin;
  const outerW = width - margin * 2;
  const outerH = height - margin * 2;

  // Outer primary thin border
  ctx.strokeStyle = themeCfg.borderPrimary;
  ctx.lineWidth = 4;
  ctx.strokeRect(outerX, outerY, outerW, outerH);

  // Inset hairline border
  const inset = 16;
  ctx.strokeStyle = themeCfg.borderSecondary;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(outerX + inset, outerY + inset, outerW - inset * 2, outerH - inset * 2);

  // Corner Dots
  const cornerDots = [
    { x: outerX + inset, y: outerY + inset },
    { x: outerX + outerW - inset, y: outerY + inset },
    { x: outerX + inset, y: outerY + outerH - inset },
    { x: outerX + outerW - inset, y: outerY + outerH - inset }
  ];
  ctx.fillStyle = themeCfg.borderPrimary;
  cornerDots.forEach(cd => {
    ctx.beginPath();
    ctx.arc(cd.x, cd.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const centerX = width / 2;
  let currentY = 150;

  // 4. Header Ornament Motif (Using Real Image Asset)
  if (headerImg) {
    const emblemWidth = 90;
    const emblemHeight = (headerImg.height / headerImg.width) * emblemWidth;
    ctx.drawImage(headerImg, centerX - emblemWidth / 2, currentY, emblemWidth, emblemHeight);
    currentY += emblemHeight + 25;
  } else {
    currentY += 40;
  }

  // 5. Header Tagline ("TOGETHER WITH THEIR FAMILIES" or "YOU'RE CORDIALLY INVITED")
  ctx.textAlign = 'center';
  ctx.fillStyle = themeCfg.accentColor;
  ctx.font = `bold 28px ${themeCfg.fontSerif}`;
  const headerTag = isWedding ? "TOGETHER WITH THEIR FAMILIES" : "YOU'RE CORDIALLY INVITED";
  ctx.fillText(headerTag, centerX, currentY);

  currentY += 85;

  // 6. Bride & Groom / Couple Title (Reduced prominence by ~25%)
  ctx.fillStyle = themeCfg.titleColor;
  ctx.font = `italic bold 62px ${themeCfg.fontSerif}`;
  ctx.fillText(coupleTitle, centerX, currentY);

  currentY += 55;

  // Elegant Divider Line
  ctx.strokeStyle = themeCfg.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 180, currentY);
  ctx.lineTo(centerX + 180, currentY);
  ctx.stroke();

  // Small Diamond in middle
  ctx.fillStyle = themeCfg.accentColor;
  ctx.beginPath();
  ctx.arc(centerX, currentY, 5, 0, Math.PI * 2);
  ctx.fill();

  currentY += 60;

  // 7. Wedding Date ONLY
  ctx.fillStyle = themeCfg.titleColor;
  ctx.font = `bold 36px ${themeCfg.fontSerif}`;
  ctx.fillText(formattedDate.toUpperCase(), centerX, currentY);

  currentY += 70;

  // 8. Short Elegant Invitation Message
  ctx.fillStyle = themeCfg.bodyColor;
  ctx.font = `26px ${themeCfg.fontSerif}`;

  const messageText = isWedding
    ? "Together with our families, we warmly invite you to celebrate one of the happiest days of our lives."
    : "We warmly invite you to share in this special celebration with us and make unforgettable memories together.";

  const messageLines = wrapCanvasText(ctx, messageText, 1100);
  messageLines.forEach(line => {
    ctx.fillText(line, centerX, currentY);
    currentY += 38;
  });

  if (guestName && guestName.trim() && guestName.toLowerCase() !== 'dear guest') {
    currentY += 10;
    ctx.font = `bold 26px ${themeCfg.fontSerif}`;
    ctx.fillText(`Honoured Guest: ${guestName.trim()}`, centerX, currentY);
    currentY += 30;
  }

  currentY += 50;

  // 9. QR HERO SECTION HEADER
  ctx.fillStyle = themeCfg.titleColor;
  ctx.font = `italic 42px ${themeCfg.fontSerif}`;
  ctx.fillText("Your complete invitation awaits", centerX, currentY);

  currentY += 45;

  ctx.fillStyle = '#475569';
  ctx.font = `bold 22px ${themeCfg.fontSans}`;
  ctx.fillText("SCAN TO ACCESS:", centerX, currentY);

  currentY += 35;

  // Dynamic Features List
  const canvasFeatures: string[] = [];
  if (isWedding) canvasFeatures.push('• Ceremony details');
  else canvasFeatures.push('• Event details');
  if (event.venue || event.venueName || event.mapLink) canvasFeatures.push('• Venue & directions');
  if (!(event as any).disableRsvp) canvasFeatures.push('• RSVP');
  if (event.timelineSteps && event.timelineSteps.length > 0) canvasFeatures.push('• Event schedule');
  if (event.dressCode && event.dressCode.trim()) canvasFeatures.push('• Dress code');
  if (event.ecocashNumber || (event as any).giftRegistry) canvasFeatures.push('• Gift registry');
  canvasFeatures.push('• Additional information');

  ctx.fillStyle = themeCfg.bodyColor;
  ctx.font = `22px ${themeCfg.fontSerif}`;
  ctx.fillText(canvasFeatures.join('   '), centerX, currentY);

  currentY += 50;

  // 9. FOCAL POINT: Large High-Quality QR Code (With Generous Quiet Zone)
  const qrBoxSize = 560;
  const qrBoxX = centerX - qrBoxSize / 2;
  const qrBoxY = currentY;

  // Pure White Quiet Zone Background Box
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  const cornerRadius = 24;
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, cornerRadius);
  ctx.fill();

  // Subtle Border Frame around QR Box
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = themeCfg.borderPrimary;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Load and Draw QR Code Image
  const qrImage = await loadImage(qrCodeUrl);
  if (qrImage) {
    const qrInnerPadding = 50;
    const qrSize = qrBoxSize - qrInnerPadding * 2;
    ctx.drawImage(qrImage, qrBoxX + qrInnerPadding, qrBoxY + qrInnerPadding, qrSize, qrSize);
  }

  // Draw Center Logo Badge on QR Code
  const logoBadgeSize = 85;
  const logoBadgeX = centerX - logoBadgeSize / 2;
  const logoBadgeY = qrBoxY + qrBoxSize / 2 - logoBadgeSize / 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = themeCfg.borderPrimary;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(logoBadgeX, logoBadgeY, logoBadgeSize, logoBadgeSize, 14);
  ctx.fill();
  ctx.stroke();

  // Load and draw Pam's Events Logo inside center badge
  const logoImg = await loadImage('/logo.jpg');
  if (logoImg) {
    ctx.drawImage(logoImg, logoBadgeX + 8, logoBadgeY + 8, logoBadgeSize - 16, logoBadgeSize - 16);
  } else {
    ctx.fillStyle = '#171717';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('PE', centerX, logoBadgeY + 52);
  }

  // Draw Real Wedding Rings Image Asset near lower right of QR Box
  if (ringsImg) {
    const ringW = 190;
    const ringH = (ringsImg.height / ringsImg.width) * ringW;
    ctx.drawImage(ringsImg, qrBoxX + qrBoxSize - ringW / 2, qrBoxY + qrBoxSize - ringH / 2, ringW, ringH);
  }

  ctx.restore();

  // 10. Footer CTA
  currentY = qrBoxY + qrBoxSize + 70;

  ctx.fillStyle = themeCfg.titleColor;
  ctx.font = `bold 30px ${themeCfg.fontSerif}`;
  ctx.fillText("SCAN TO VIEW INVITATION & RSVP", centerX, currentY);

  currentY += 40;

  ctx.fillStyle = '#64748B';
  ctx.font = `bold 20px ${themeCfg.fontSans}`;
  ctx.fillText("PAM'S EVENTS • OFFICIAL DIGITAL INVITATION CARD", centerX, currentY);

  return canvas.toDataURL('image/png');
}
