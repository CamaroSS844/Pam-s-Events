import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Download, Link2, Sparkles, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

export const A5_DIMENSIONS = {
  width: 800,
  height: 1135, // 148 x 210 mm ratio
  label: 'A5 Portrait Card',
  sublabel: '148 × 210 mm'
};

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

// ============================================================================
// 1. CONCEPT: THE A5 DOCUMENT (Fixed Dimensions 148mm x 210mm / 800px x 1135px)
// ============================================================================
interface DocumentProps {
  event: Partial<EventModel>;
  guest?: Guest | null;
  qrCodeUrl: string;
  theme: ThemePalette;
  coupleTitle: string;
}

export const InvitationCardDocument = forwardRef<HTMLDivElement, DocumentProps>(({
  event,
  guest,
  qrCodeUrl,
  theme,
  coupleTitle
}, ref) => {
  const docWidth = A5_DIMENSIONS.width;
  const docHeight = A5_DIMENSIONS.height;

  // Helper for ordinal day (12th, 1st, 2nd, 3rd, etc.)
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const dateObj = event.date ? new Date(event.date) : new Date(2026, 8, 12);
  const day = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString('en-GB', { month: 'long' });
  const year = dateObj.getFullYear();
  const formattedDate = `${day}${getOrdinal(day)} ${monthName} ${year}`;

  const isWedding = !event.type || event.type === 'wedding';
  const eventTypeName = isWedding ? "wedding" : (event.type || "celebration");

  return (
    <div
      ref={ref}
      id="qr-invitation-card-document"
      className="bg-white text-slate-800 relative shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden select-none shrink-0"
      style={{
        width: `${docWidth}px`,
        height: `${docHeight}px`,
        backgroundColor: '#ffffff'
      }}
    >
      {/* DOUBLE LINE CONCAVE NOTCH BORDER FRAME WITH CORNER DOTS */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
        viewBox="0 0 2100 2979.375"
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
        <circle cx="125" cy="125" r="5" fill={theme.borderColor} />
        <circle cx="110" cy="140" r="3.5" fill={theme.borderColor} />
        <circle cx="140" cy="110" r="3.5" fill={theme.borderColor} />

        <circle cx="1975" cy="125" r="5" fill={theme.borderColor} />
        <circle cx="1990" cy="140" r="3.5" fill={theme.borderColor} />
        <circle cx="1960" cy="110" r="3.5" fill={theme.borderColor} />

        <circle cx="125" cy="2845" r="5" fill={theme.borderColor} />
        <circle cx="110" cy="2830" r="3.5" fill={theme.borderColor} />
        <circle cx="140" cy="2860" r="3.5" fill={theme.borderColor} />

        <circle cx="1975" cy="2845" r="5" fill={theme.borderColor} />
        <circle cx="1990" cy="2830" r="3.5" fill={theme.borderColor} />
        <circle cx="1960" cy="2860" r="3.5" fill={theme.borderColor} />
      </svg>

      {/* DECORATIVE CORNER FLORAL WATERMARKS */}
      <img
        src="/whatsapp-floral-watermark.jpeg"
        alt=""
        className="absolute -top-10 -left-10 w-[260px] h-[260px] object-contain opacity-10 pointer-events-none z-0"
      />
      <img
        src="/whatsapp-floral-watermark.jpeg"
        alt=""
        className="absolute -bottom-10 -right-10 w-[260px] h-[260px] object-contain opacity-10 pointer-events-none z-0 -scale-x-100"
      />

      {/* CARD INNER CONTENT STACK */}
      <div className="w-full h-full flex flex-col items-center justify-between py-[54px] px-[48px] z-10 relative">

        {/* 1. HEADER SECTION & COUPLE DETAILS */}
        <div className="flex flex-col items-center w-full my-auto">
          {/* Top Ornamental Flourish */}
          <div className="flex items-center justify-center my-[8px]">
            <svg className="w-[240px] h-[32px]" viewBox="0 0 200 30" fill="none" style={{ color: theme.scriptColor }}>
              <path d="M 100 12 C 97 7, 90 9, 93 15 L 100 22 L 107 15 C 110 9, 103 7, 100 12 Z" fill="currentColor" />
              <path d="M 90 16 C 70 16, 65 8, 50 13 C 40 16, 45 22, 52 19 C 60 15, 55 9, 48 11 L 10 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="8" cy="16" r="1.5" fill="currentColor" />
              <path d="M 110 16 C 130 16, 135 8, 150 13 C 160 16, 155 22, 148 19 C 140 15, 145 9, 152 11 L 190 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="192" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            className="font-luxury-script text-[64px] font-normal tracking-wide my-[8px] leading-none text-center"
            style={{ color: theme.scriptColor }}
          >
            You're Invited
          </h1>

          {/* Main Text Sentence */}
          <p
            className="text-[22px] font-serif font-medium text-slate-800 my-[12px] px-[20px] max-w-[620px] leading-relaxed text-center"
          >
            You are kindly invited to <span className="font-bold" style={{ color: theme.headingColor }}>{coupleTitle}</span>'s {eventTypeName}.
          </p>

          {/* Divider Line */}
          <div className="flex items-center justify-center gap-[12px] w-[240px] my-[10px]">
            <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
            <span className="text-[14px] font-serif select-none" style={{ color: theme.scriptColor }}>♡</span>
            <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
          </div>

          {/* Wedding Date Only */}
          <p
            className="text-[24px] font-serif font-bold tracking-wider my-[10px] uppercase text-center"
            style={{ color: theme.headingColor }}
          >
            {formattedDate}
          </p>

          {guest?.name && (
            <p className="text-[16px] font-serif font-semibold text-slate-700 mt-[4px]">
              Honoured Guest: {guest.name}
            </p>
          )}
        </div>

        {/* 2. QR CODE SECTION WITH EXACT INSTRUCTION */}
        <div className="flex flex-col items-center w-full my-auto">
          {/* QR Instruction - EXACT REPLACEMENT */}
          <p className="text-[18px] font-serif text-slate-800 font-medium my-[12px] text-center">
            Please scan the QR code for details.
          </p>

          {/* QR Code Container & Wedding Rings */}
          <div className="relative my-[12px] z-10 flex flex-col items-center">
            <div
              className="bg-white p-[18px] rounded-3xl border shadow-md flex flex-col items-center justify-center relative"
              style={{ borderColor: theme.borderLightColor }}
            >
              <div className="w-[260px] h-[260px] relative flex items-center justify-center p-[8px] bg-white rounded-2xl">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Invitation QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[12px] text-slate-400 font-mono">
                    Generating QR...
                  </div>
                )}

                {/* Center App Icon Logo Badge */}
                <div
                  className="absolute w-[52px] h-[52px] bg-white border rounded-xl flex items-center justify-center p-[3px] shadow-sm"
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
              src="/chatgpt-wedding-rings.png"
              alt="Wedding Rings"
              className="absolute -bottom-[24px] -right-[32px] w-[115px] h-auto object-contain filter drop-shadow-md z-20 pointer-events-none select-none"
            />
          </div>
        </div>

        {/* 3. ELEGANT FOOTER */}
        <div className="flex flex-col items-center justify-center w-full my-auto">
          <div className="flex items-center justify-center gap-[10px] w-[200px] my-[8px]">
            <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
            <span className="text-[14px]" style={{ color: theme.accentColor }}>♥</span>
            <div className="h-px flex-1" style={{ backgroundColor: theme.borderColor }} />
          </div>

          <div className="text-[15px]" style={{ color: theme.scriptColor }}>~ ♡ ~</div>
        </div>

      </div>
    </div>
  );
});

InvitationCardDocument.displayName = 'InvitationCardDocument';

// ============================================================================
// MAIN MODAL CONTAINER (A5 Preview Viewer & Export Engine)
// ============================================================================
export const InvitationCardModal: React.FC<InvitationCardModalProps> = ({
  isOpen,
  onClose,
  event,
  guest,
  qrCodeUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomScale, setZoomScale] = useState<number | null>(null); // null = auto-fit width
  const [containerWidth, setContainerWidth] = useState<number>(600);

  const documentRef = useRef<HTMLDivElement>(null);
  const scaledWrapperRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Measure viewer width dynamically so entire document width fits 100%
  useEffect(() => {
    if (!isOpen) return;

    const updateWidth = () => {
      if (viewerRef.current) {
        setContainerWidth(viewerRef.current.clientWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (viewerRef.current) {
      resizeObserver.observe(viewerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const docWidth = A5_DIMENSIONS.width;
  const docHeight = A5_DIMENSIONS.height;

  // Calculate fit width factor so document is NEVER clipped horizontally
  const availableWidth = Math.max(200, containerWidth);
  const autoScale = Math.min(1, availableWidth / docWidth);
  const effectiveScale = zoomScale !== null ? zoomScale : autoScale;

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

  const handleZoomIn = () => {
    const current = effectiveScale;
    setZoomScale(Math.min(2.0, parseFloat((current + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    const current = effectiveScale;
    setZoomScale(Math.max(0.25, parseFloat((current - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomScale(null);
  };

  // EXPORT ENGINE: Exports the exact live rendered state as seen in preview
  const handleDownloadCard = async () => {
    setIsGenerating(true);
    try {
      const targetNode = scaledWrapperRef.current || documentRef.current;
      if (targetNode) {
        if (document.fonts) {
          await document.fonts.ready;
        }

        const dataUrl = await toPng(targetNode, {
          pixelRatio: 3, // High resolution output multiplier preserving live CSS state & layout
          cacheBust: true,
          quality: 0.98,
        });

        const fileName = `pamsevents_${coupleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_a5_qr_invitation.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("Document DOM reference not available");
      }
    } catch (err) {
      console.warn("DOM PNG export fallback triggered", err);
      try {
        const fallbackDataUrl = await generateInvitationCardDataUrl(event, qrCodeUrl, guest?.name);
        const fileName = `pamsevents_${coupleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_a5_qr_invitation.png`;
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
      <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh] h-[90vh]"
        >
          {/* Header Bar - Contains Title, Download Button at TOP, and Close */}
          <div className="px-4 sm:px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase truncate">
                A5 QR Invitation
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Link2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied Message' : 'Copy Message'}</span>
              </button>

              <button
                onClick={handleDownloadCard}
                disabled={isGenerating}
                className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-stone-950" />
                <span>{isGenerating ? 'Exporting...' : 'Download Card (as shown)'}</span>
              </button>

              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoom Controls & Format Indicator Toolbar */}
          <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                A5 Portrait (148 × 210 mm)
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetZoom}
                title="Reset to Fit Width"
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md font-mono text-[10px] flex items-center gap-1 transition-colors"
              >
                <span>{Math.round(effectiveScale * 100)}%</span>
                {zoomScale !== null && <RotateCcw className="w-2.5 h-2.5 text-amber-400" />}
              </button>

              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PREVIEW VIEWER: Outer Scrolling Container with Responsive Padding */}
          <div className="flex-1 w-full overflow-y-auto bg-zinc-950 p-4 sm:p-6 custom-scrollbar relative min-h-[350px]">
            {/* INNER MEASURING CONTAINER: Ref target with no padding, owns overflow-x-hidden */}
            <div
              ref={viewerRef}
              className="w-full overflow-x-hidden flex flex-col items-center justify-start my-auto relative min-h-[350px]"
            >
              {/* SCALED DOCUMENT CONTAINER (EXACT FIT WIDTH, NO CLIPPING) */}
              <div
                className="relative flex justify-center items-center my-auto transition-transform duration-150 ease-out shrink-0"
                style={{
                  width: `${docWidth * effectiveScale}px`,
                  height: `${docHeight * effectiveScale}px`,
                }}
              >
                <div
                  ref={scaledWrapperRef}
                  style={{
                    width: `${docWidth}px`,
                    height: `${docHeight}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'top left',
                  }}
                  className="shadow-2xl rounded-sm overflow-hidden bg-white"
                >
                  <InvitationCardDocument
                    ref={documentRef}
                    event={event}
                    guest={guest}
                    qrCodeUrl={qrCodeUrl}
                    theme={theme}
                    coupleTitle={coupleTitle}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
