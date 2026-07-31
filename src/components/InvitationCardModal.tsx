import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Download, Link2, Sparkles, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { EventModel, Guest } from '../types';
import { formatInvitationMessage, generateInvitationCardDataUrl } from '../utils/invitationCardGenerator';

interface InvitationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Partial<EventModel>;
  guest?: Guest | null;
  qrCodeUrl: string;
}

interface ThemePalette {
  borderColor: string;
  borderLightColor: string;
  headingColor: string;
  scriptColor: string;
  accentColor: string;
}

const themePalettes: Record<string, ThemePalette> = {
  luxury: {
    borderColor: '#D4AF37',       // Metallic gold
    borderLightColor: '#E6C687',
    headingColor: '#856404',      // Deep bronze gold
    scriptColor: '#C5A028',       // Script gold
    accentColor: '#B8860B'
  },
  elegant: {
    borderColor: '#334155',       // Charcoal / Dark Slate
    borderLightColor: '#CBD5E1',
    headingColor: '#0F172A',
    scriptColor: '#475569',
    accentColor: '#334155'
  },
  modern: {
    borderColor: '#1E3A8A',       // Navy blue
    borderLightColor: '#93C5FD',
    headingColor: '#1E3A8A',
    scriptColor: '#2563EB',
    accentColor: '#1D4ED8'
  },
  floral: {
    borderColor: '#DB2777',       // Rose gold / Magenta Pink
    borderLightColor: '#FBCFE8',
    headingColor: '#831843',
    scriptColor: '#BE185D',
    accentColor: '#E11D48'
  },
  rustic: {
    borderColor: '#C97064',       // Warm brown
    borderLightColor: '#FFEDD5',
    headingColor: '#7C2D12',
    scriptColor: '#C97064',
    accentColor: '#9A3412'
  },
  traditional: {
    borderColor: '#B45309',       // Dark bronze / Amber brown
    borderLightColor: '#FEF3C7',
    headingColor: '#78350F',
    scriptColor: '#B45309',
    accentColor: '#92400E'
  },
  minimal: {
    borderColor: '#475569',       // Charcoal
    borderLightColor: '#CBD5E1',
    headingColor: '#1E293B',
    scriptColor: '#334155',
    accentColor: '#475569'
  }
};

export const InvitationCardModal: React.FC<InvitationCardModalProps> = ({
  isOpen,
  onClose,
  event,
  guest,
  qrCodeUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

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
  } else if (event.name) {
    coupleTitle = event.name;
  } else {
    coupleTitle = 'Tafadzwa & Tapiwa';
  }

  // Dynamic feature list based on available event details
  const featureList: string[] = [];
  if (isWedding) {
    featureList.push('Ceremony details');
  } else {
    featureList.push('Event details');
  }
  if (event.venue || event.venueName || event.mapLink) {
    featureList.push('Venue & directions');
  }
  if (!(event as any).disableRsvp) {
    featureList.push('RSVP');
  }
  if (event.timelineSteps && event.timelineSteps.length > 0) {
    featureList.push('Event schedule');
  }
  if (event.dressCode && event.dressCode.trim().length > 0) {
    featureList.push('Dress code');
  }
  if (event.ecocashNumber || (event as any).giftRegistry || (event as any).enableRegistry) {
    featureList.push('Gift registry');
  }
  featureList.push('Additional information');

  const identifier = event.slug || event.clientNumber || event.id || 'preview';
  const baseUrl = `${window.location.origin}/${identifier}`;
  const invitationUrl = guest?.token ? `${baseUrl}?guest=${guest.token}` : baseUrl;

  const themeId = event.themeId || 'luxury';
  const theme = themePalettes[themeId] || themePalettes.luxury;

  const handleCopyLink = () => {
    const formattedMsg = formatInvitationMessage(event, invitationUrl, guest?.name);
    navigator.clipboard.writeText(formattedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCard = async () => {
    setIsGenerating(true);
    try {
      if (cardRef.current) {
        if (document.fonts) {
          await document.fonts.ready;
        }

        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 3, // Crisp 3x high-resolution PNG export
          cacheBust: true,
          quality: 0.98,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });

        const fileName = `pamsevents_${coupleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_qr_invitation.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("Card DOM element reference not available");
      }
    } catch (err) {
      console.warn("DOM PNG export fallback triggered", err);
      try {
        const fallbackDataUrl = await generateInvitationCardDataUrl(event, qrCodeUrl, guest?.name);
        const fileName = `pamsevents_${coupleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_qr_invitation.png`;
        const link = document.createElement('a');
        link.href = fallbackDataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("Failed to generate QR card image", fallbackErr);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                Luxury A4 QR Invitation Card (210 × 297 mm)
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-1"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Preview Area */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center bg-zinc-950">
            
            {/* 1:1 CANONICAL A4 REACT PREVIEW & PNG EXPORT COMPONENT (210mm x 297mm Ratio) */}
            <div
              ref={cardRef}
              id="qr-invitation-card-node"
              className="w-full max-w-[420px] bg-white text-slate-800 rounded-lg p-5 sm:p-7 relative shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden select-none"
              style={{ backgroundColor: '#ffffff', aspectRatio: '210 / 297' }}
            >
              {/* DOUBLE LINE CONCAVE NOTCH BORDER FRAME WITH CORNER DOTS (A4 Coordinate Space 2100 x 2970) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
                viewBox="0 0 2100 2970"
                preserveAspectRatio="none"
              >
                {/* Outer Concave Notch Frame */}
                <path
                  d="M 180 90 L 1920 90 A 90 90 0 0 0 2010 180 L 2010 2790 A 90 90 0 0 0 1920 2880 L 180 2880 A 90 90 0 0 0 90 2790 L 90 180 A 90 90 0 0 0 180 90 Z"
                  fill="none"
                  stroke={theme.borderColor}
                  strokeWidth="7"
                />

                {/* Inner Concave Notch Frame */}
                <path
                  d="M 190 110 L 1910 110 A 80 80 0 0 0 1990 190 L 1990 2780 A 80 80 0 0 0 1910 2860 L 190 2860 A 80 80 0 0 0 110 2780 L 110 190 A 80 80 0 0 0 190 110 Z"
                  fill="none"
                  stroke={theme.borderColor}
                  strokeWidth="3.5"
                />

                {/* 3 Dotted Corner Flourishes Outside Each Notch */}
                {/* Top Left */}
                <circle cx="54" cy="54" r="6" fill={theme.borderColor} />
                <circle cx="36" cy="36" r="6" fill={theme.borderColor} />
                <circle cx="18" cy="18" r="6" fill={theme.borderColor} />

                {/* Top Right */}
                <circle cx="2046" cy="54" r="6" fill={theme.borderColor} />
                <circle cx="2064" cy="36" r="6" fill={theme.borderColor} />
                <circle cx="2082" cy="18" r="6" fill={theme.borderColor} />

                {/* Bottom Left */}
                <circle cx="54" cy="2916" r="6" fill={theme.borderColor} />
                <circle cx="36" cy="2934" r="6" fill={theme.borderColor} />
                <circle cx="18" cy="2952" r="6" fill={theme.borderColor} />

                {/* Bottom Right */}
                <circle cx="2046" cy="2916" r="6" fill={theme.borderColor} />
                <circle cx="2064" cy="2934" r="6" fill={theme.borderColor} />
                <circle cx="2082" cy="2952" r="6" fill={theme.borderColor} />
              </svg>

              {/* BOTANICAL FLORAL ARTWORK WATERMARKS (~10-12% OPACITY) */}
              {/* Top Right Floral Illustration */}
              <img
                src="/IMG-20260728-WA0014.png"
                alt=""
                className="absolute -top-3 -right-3 w-40 sm:w-48 h-auto object-contain opacity-12 pointer-events-none z-0"
              />

              {/* Left Side Faded Botanical Leaves */}
              <img
                src="/IMG-20260728-WA0003.png"
                alt=""
                className="absolute top-1/4 -left-7 w-32 sm:w-40 h-auto object-contain opacity-10 pointer-events-none z-0"
              />

              {/* Bottom Left Large Floral Arrangement */}
              <img
                src="/IMG-20260728-WA0014.png"
                alt=""
                className="absolute -bottom-5 -left-5 w-40 sm:w-48 h-auto object-contain opacity-12 pointer-events-none z-0"
              />

              {/* Bottom Right Faded Leaf Watermark */}
              <img
                src="/IMG-20260728-WA0003.png"
                alt=""
                className="absolute -bottom-7 -right-7 w-36 sm:w-44 h-auto object-contain opacity-10 pointer-events-none z-0 -scale-x-100"
              />
              {/* CARD INNER CONTENT STACK WITH A4 SAFE MARGINS */}
              <div className="w-full h-full flex flex-col items-center justify-between py-1.5 sm:py-2 px-2 z-10 relative">

                {/* 1. HEADER SECTION */}
                <div className="flex flex-col items-center w-full">
                  {/* Top Ornamental Flourish */}
                  <div className="flex items-center justify-center my-0.5">
                    <svg className="w-24 sm:w-28 h-3.5 sm:h-4" viewBox="0 0 200 30" fill="none" style={{ color: theme.scriptColor }}>
                      <path d="M 100 12 C 97 7, 90 9, 93 15 L 100 22 L 107 15 C 110 9, 103 7, 100 12 Z" fill="currentColor" />
                      <path d="M 90 16 C 70 16, 65 8, 50 13 C 40 16, 45 22, 52 19 C 60 15, 55 9, 48 11 L 10 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                      <path d="M 110 16 C 130 16, 135 8, 150 13 C 160 16, 155 22, 148 19 C 140 15, 145 9, 152 11 L 190 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="192" cy="16" r="1.5" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Header Script */}
                  <h1
                    className="font-luxury-script text-2.5xl sm:text-3.5xl font-normal tracking-wide my-0.5 leading-none"
                    style={{ color: theme.scriptColor }}
                  >
                    You're Invited
                  </h1>

                  {/* Subtitle */}
                  <p className="text-[9px] sm:text-[10px] font-serif font-bold tracking-[0.22em] text-slate-800 uppercase my-0.5">
                    {isWedding ? "TO CELEBRATE THE WEDDING OF" : `TO CELEBRATE THE ${event.type ? event.type.toUpperCase() : 'OCCASION'} OF`}
                  </p>

                  {/* Participant Names - Reduced Visual Prominence by 20-30% */}
                  <h2
                    className="text-lg sm:text-xl md:text-2xl font-serif font-normal tracking-wide my-0.5 leading-tight px-1 text-center"
                    style={{ color: theme.headingColor }}
                  >
                    {coupleTitle}
                  </h2>

                  {/* Horizontal Ornament Divider */}
                  <div className="flex items-center justify-center gap-2 w-32 my-0.5">
                    <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
                    <span className="text-[10px] font-serif select-none" style={{ color: theme.scriptColor }}>♡</span>
                    <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
                  </div>

                  {/* 2. WEDDING DATE ONLY (Beneath couple names) */}
                  <p
                    className="text-xs sm:text-sm font-serif font-bold tracking-wider my-0.5 uppercase text-center"
                    style={{ color: theme.headingColor }}
                  >
                    {event.date
                      ? new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Saturday, 14 November 2026'}
                  </p>
                </div>

                {/* 3. SHORT ELEGANT INVITATION MESSAGE */}
                <div className="flex flex-col items-center w-full space-y-0.5 my-1">
                  <div className="text-[10.5px] sm:text-[11px] font-serif leading-snug text-slate-800 max-w-xs text-center space-y-0.5">
                    {isWedding ? (
                      <>
                        <p>Together with our families,</p>
                        <p>we warmly invite you to celebrate</p>
                        <p>one of the happiest days of our lives.</p>
                      </>
                    ) : (
                      <>
                        <p>We warmly invite you to share in</p>
                        <p>this special celebration with us and</p>
                        <p>make unforgettable memories together.</p>
                      </>
                    )}
                    {guest?.name && (
                      <p className="text-[10.5px] font-bold text-slate-900 mt-0.5">Honoured Guest: {guest.name}</p>
                    )}
                  </div>
                </div>

                {/* 4. MAKE THE QR SECTION THE HERO */}
                <div className="flex flex-col items-center w-full my-0.5 text-center">
                  <p
                    className="font-luxury-script text-xl sm:text-2.5xl font-normal leading-tight"
                    style={{ color: theme.scriptColor }}
                  >
                    Your complete invitation awaits
                  </p>
                  <p className="text-[9px] sm:text-[9.5px] font-serif font-bold text-slate-700 tracking-wider uppercase mt-1 mb-0.5">
                    Scan to access:
                  </p>
                  <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 max-w-xs px-2 my-0.5">
                    {featureList.map((feature, idx) => (
                      <span key={idx} className="text-[9px] sm:text-[9.5px] font-serif text-slate-800 font-medium flex items-center gap-1">
                        <span className="text-[8px]" style={{ color: theme.scriptColor }}>•</span>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5. QR CODE CONTAINER & MANDATORY WEDDING RINGS */}
                <div className="relative my-0.5 z-10 flex flex-col items-center">
                  <div
                    className="bg-white p-2 sm:p-2.5 rounded-2xl border shadow-md flex flex-col items-center justify-center relative"
                    style={{ borderColor: theme.borderLightColor }}
                  >
                    <div className="w-28 h-28 sm:w-34 sm:h-34 relative flex items-center justify-center p-1 bg-white rounded-xl">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Invitation QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                          Generating QR...
                        </div>
                      )}

                      {/* Center App Icon Logo Badge */}
                      <div
                        className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-white border rounded-lg flex items-center justify-center p-0.5 shadow-xs"
                        style={{ borderColor: theme.borderLightColor }}
                      >
                        <img
                          src="/logo.jpg"
                          alt="PE"
                          className="w-full h-full object-contain rounded-md"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MANDATORY REAL WEDDING RINGS ASSET */}
                  <img
                    src="/ChatGPT Image Jul 28, 2026, 12_01_58 PM.png"
                    alt="Wedding Rings"
                    className="absolute -bottom-3 -right-4 sm:-bottom-3.5 sm:-right-5 w-16 sm:w-20 h-auto object-contain filter drop-shadow-md z-20 pointer-events-none select-none"
                  />
                </div>

                {/* 6. CLOSING SCRIPT & FOOTER */}
                <div className="flex flex-col items-center justify-center w-full">
                  <p
                    className="font-luxury-script text-2xl sm:text-2.5xl font-normal my-0.5"
                    style={{ color: theme.scriptColor }}
                  >
                    We can't wait to celebrate with you!
                  </p>

                  {/* Footer Divider with Heart */}
                  <div className="flex items-center justify-center gap-2 w-28 my-0.5">
                    <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
                    <span className="text-[9px]" style={{ color: theme.accentColor }}>♥</span>
                    <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
                  </div>

                  <p
                    className="text-[9px] sm:text-[9.5px] font-serif font-bold tracking-[0.2em] uppercase my-0.5"
                    style={{ color: theme.headingColor }}
                  >
                    {!(event as any).disableRsvp ? 'SCAN TO VIEW INVITATION & RSVP' : 'SCAN TO VIEW DIGITAL INVITATION'}
                  </p>

                  <div className="text-[9.5px] mt-0.5" style={{ color: theme.scriptColor }}>~ ♡ ~</div>
                </div>

              </div>

            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied Formatted Link & Message!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-white" />
                  <span>Copy Ready-to-Send Message</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <span>Generating High-Res PNG...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>Download High-Res Card (PNG)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
