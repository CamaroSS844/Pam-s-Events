/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MailOpen, Heart, ChevronDown, X, Clock, MapPin, 
  Calendar, Check, Copy, Maximize2, Star, ShieldCheck, 
  ChevronLeft, ChevronRight, HelpCircle, Info, Image as ImageIcon
} from 'lucide-react';

/* ==========================================
   1. GALLERY LIGHTBOX & INTERACTIVE GRID
   ========================================== */
export const GalleryLightboxModal: React.FC<{
  images: string[];
  selectedIndex: number | null;
  onClose: () => void;
}> = ({ images, selectedIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(selectedIndex ?? 0);

  React.useEffect(() => {
    if (selectedIndex !== null) setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  if (selectedIndex === null || !images || images.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 select-none"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Active Image */}
          <div className="relative w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-white/10 bg-black/50">
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-between w-full mt-4 text-white/90 text-xs font-mono px-2">
            <button
              disabled={images.length <= 1}
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-white/60 tracking-wider">
              {currentIndex + 1} / {images.length}
            </span>

            <button
              disabled={images.length <= 1}
              onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const InteractiveGalleryGrid: React.FC<{
  images: string[];
  themeId: string;
  cardBorderClass?: string;
  cardBgClass?: string;
}> = ({ images, themeId, cardBorderClass = 'border-stone-200', cardBgClass = 'bg-white' }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => setSelectedIdx(idx)}
            className={`group relative overflow-hidden rounded-xl border ${cardBorderClass} ${cardBgClass} shadow-md cursor-pointer aspect-video sm:aspect-square flex items-center justify-center`}
          >
            <img
              src={img}
              alt={`Gallery image ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Hover overlay with zoom icon */}
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Maximize2 className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <GalleryLightboxModal
        images={images}
        selectedIndex={selectedIdx}
        onClose={() => setSelectedIdx(null)}
      />
    </>
  );
};

/* ==========================================
   2. INTERACTIVE PROGRAM TIMELINE
   ========================================== */
export const InteractiveProgramTimeline: React.FC<{
  steps: { time: string; title: string; desc: string }[];
  themeId: string;
  accentColor?: string;
  lineColor?: string;
  headingFont?: string;
}> = ({ steps, themeId, accentColor = '#D4AF37', lineColor = 'border-amber-200', headingFont = 'font-serif' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  if (!steps || steps.length === 0) return null;

  return (
    <div className={`relative border-l-2 ${lineColor} pl-6 sm:pl-10 ml-3 sm:ml-8 flex flex-col gap-6 sm:gap-10 text-left`}>
      {steps.map((item, idx) => {
        const isActive = activeIndex === idx;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            onClick={() => setActiveIndex(idx)}
            className="relative cursor-pointer group"
          >
            {/* Interactive Timeline Node Marker */}
            <motion.div
              animate={{
                scale: isActive ? 1.25 : 1,
                backgroundColor: isActive ? accentColor : '#ffffff',
                borderColor: accentColor,
              }}
              className="absolute -left-[31px] sm:-left-[49px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isActive ? '#ffffff' : accentColor }}
              />
            </motion.div>

            {/* Content Box */}
            <div
              className={`p-5 sm:p-6 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-xl ring-2 ring-offset-1'
                  : 'bg-white/70 hover:bg-white border-stone-200/80 shadow-sm hover:shadow-md'
              }`}
              style={{
                borderColor: isActive ? accentColor : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    color: accentColor,
                    borderColor: `${accentColor}40`,
                    backgroundColor: `${accentColor}10`,
                  }}
                >
                  <Clock className="w-3 h-3 inline-block mr-1 text-current" />
                  {item.time} PM
                </span>

                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                  Stage 0{idx + 1}
                </span>
              </div>

              <h3 className={`text-base sm:text-lg font-bold mt-3 text-stone-900 ${headingFont}`}>
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed font-light">
                {item.desc}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ==========================================
   3. INTERACTIVE FAQ & EVENT NOTES ACCORDION
   ========================================== */
export const InteractiveFaqAccordion: React.FC<{
  themeId: string;
  accentColor?: string;
  borderColor?: string;
  textColor?: string;
  headingFont?: string;
}> = ({ themeId, accentColor = '#D4AF37', borderColor = 'border-stone-200', textColor = 'text-stone-800', headingFont = 'font-serif' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    {
      q: "Arrival & Parking Information",
      a: "Valet and reserved guest parking are provided at the main venue entrance. Please plan to arrive 15-20 minutes prior to the scheduled start time to be seated comfortably."
    },
    {
      q: "Dress Code & Attire Recommendations",
      a: "Please follow the dress code guidelines listed above. We suggest elegant cocktail, formal, or festive traditional attire matching the celebratory theme."
    },
    {
      q: "Gift Registry & Digital Blessings",
      a: "Your presence is our absolute greatest blessing! If you wish to gift us, registry links and monetary gift voucher options are provided in the Registry section."
    },
    {
      q: "Children & Dietary Accommodation Requests",
      a: "To ensure a seamless experience for every guest, please include any dietary preferences, special requirements, or additional companion counts in your RSVP note."
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 text-left">
      {faqItems.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <motion.div
            key={idx}
            initial={false}
            className={`border ${borderColor} rounded-xl overflow-hidden bg-white/90 shadow-sm transition-all duration-300 ${isOpen ? 'shadow-md ring-1 ring-stone-200' : 'hover:shadow-sm'}`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-medium transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${textColor} ${headingFont}`}>
                  {item.q}
                </span>
              </div>

              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: accentColor }}
                className="shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-stone-100"
                >
                  <div className="p-4 sm:p-5 text-xs text-stone-600 leading-relaxed bg-stone-50/60 font-light">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ==========================================
   4. INTERACTIVE ENVELOPE / CARD UNSEAL HERO
   ========================================== */
export const InteractiveEnvelopeHero: React.FC<{
  title: string;
  subtitle: string;
  themeId: string;
  accentColor: string;
}> = ({ title, subtitle, themeId, accentColor }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Asset selection according to theme
  const envelopeBgImage = themeId === 'floral' ? '/IMG-20260728-WA0014.png' : themeId === 'rustic' ? '/IMG-20260728-WA0005.png' : '/ChatGPT Image Jul 28, 2026, 12_27_45 PM.png';

  return (
    <div className="w-full flex flex-col items-center justify-center my-4">
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transition-all border border-current relative overflow-hidden group"
        style={{ color: accentColor, backgroundColor: `${accentColor}15`, borderColor: `${accentColor}50` }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <img src="/logo.jpg" className="w-5 h-5 rounded-full object-cover border border-amber-400/50 shadow-sm" alt="Seal" />
          <span>{isOpen ? 'Fold Invitation Message' : 'Unseal Interactive Welcome Note'}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-4 p-6 sm:p-8 rounded-2xl bg-white/95 shadow-2xl border border-stone-200 max-w-lg w-full text-center space-y-4 overflow-hidden relative"
          >
            {/* Background texture from public */}
            <div className="absolute inset-0 opacity-10 mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("${envelopeBgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

            <div className="relative z-10 flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 via-amber-500 to-amber-200 shadow-md">
                <img src="/IMG-20260728-WA0003.png" className="w-full h-full rounded-full object-cover" alt="Botanical Ring Seal" />
              </div>

              <h4 className="text-base font-bold text-stone-900 uppercase tracking-widest">{title}</h4>
              <p className="text-xs text-stone-600 leading-relaxed italic max-w-md mx-auto">{subtitle}</p>
              
              <div className="pt-2 w-full">
                <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 border-t border-stone-200/60 pt-2.5 block">
                  Official Digital Event Pass
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==========================================
   5. DECORATIVE AMBIENT MOTION BACKGROUNDS
   ========================================== */

/** Gold Shimmer Particles for Luxury Gold Theme */
export const GoldShimmerParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-[#FFF3A8]/10 to-transparent blur-3xl"
      />
      {/* Floating Gold Wreath Watermark */}
      <motion.img
        src="/ChatGPT Image Jul 28, 2026, 12_01_58 PM.png"
        alt=""
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-16 -left-16 w-64 h-64 opacity-15 mix-blend-screen"
      />
      {/* Floating Gold Crest Watermark */}
      <motion.img
        src="/ChatGPT Image Jul 28, 2026, 12_21_45 PM.png"
        alt=""
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 right-4 w-48 h-48 opacity-10 mix-blend-screen"
      />
    </div>
  );
};

/** Pearlescent Flourish BG for Elegant White Theme */
export const PearlescentFlourishBG: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <div 
        className="absolute inset-0 opacity-15 mix-blend-multiply" 
        style={{ backgroundImage: `url("/ChatGPT Image Jul 28, 2026, 12_27_45 PM.png")`, backgroundSize: 'cover' }} 
      />
      <motion.img
        src="/ChatGPT Image Jul 28, 2026, 12_25_25 PM.png"
        alt=""
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-80 h-80 opacity-20 pointer-events-none"
      />
    </div>
  );
};

/** Geometric Grid Lines BG for Modern Navy Theme */
export const GeometricGridLinesBG: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.img
        src="/ChatGPT Image Jul 28, 2026, 12_25_25 PM.png"
        alt=""
        animate={{ opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
      />
    </div>
  );
};

/** Falling Leaves BG for Rustic Warmth Theme */
export const FallingLeavesBG: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.img
        src="/IMG-20260728-WA0003.png"
        alt=""
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-full max-w-xl opacity-20 mix-blend-multiply"
      />
      <motion.img
        src="/IMG-20260728-WA0005.png"
        alt=""
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-0 w-full max-w-xl opacity-20 mix-blend-multiply"
      />
    </div>
  );
};

/** Floating Petals BG for Floral Rose Theme */
export const FloatingPetalsBG: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <div 
        className="absolute inset-0 opacity-25 mix-blend-multiply"
        style={{ backgroundImage: `url("/IMG-20260728-WA0014.png")`, backgroundSize: 'cover' }}
      />
      <motion.img
        src="/IMG-20260728-WA0011.png"
        alt=""
        animate={{ y: [-5, 10, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 w-full h-auto opacity-30 mix-blend-multiply"
      />
    </div>
  );
};

/** Filigree Mandala BG for Traditional Brown Theme */
export const FiligreeMandalaBG: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-25 flex items-center justify-center">
      <motion.img
        src="/IMG-20260728-WA0007.png"
        alt=""
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full h-full object-cover mix-blend-multiply"
      />
    </div>
  );
};

/** Minimal Architectural Lines BG for Ultra Minimal Theme */
export const MinimalArchitecturalLines: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-20">
      <div 
        className="w-full h-full"
        style={{ backgroundImage: `url("/ChatGPT Image Jul 28, 2026, 12_27_45 PM.png")`, backgroundSize: 'cover' }}
      />
    </div>
  );
};
