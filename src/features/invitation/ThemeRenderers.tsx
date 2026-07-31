/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { 
  Calendar, MapPin, Gift, Clock, Tag, MessageSquare, 
  MapIcon, User, Heart, HelpCircle, Check, Copy, ExternalLink, Navigation,
  Crown, Star, Flower, Feather, Compass, Info, ShieldCheck, ChevronDown
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { EventModel, Guest, GuestbookEntry } from '../../types';
import { Countdown } from '../../components/Countdown';
import { RsvpForm } from './RsvpForm';
import {
  InteractiveGalleryGrid,
  InteractiveProgramTimeline,
  InteractiveFaqAccordion,
  InteractiveEnvelopeHero,
  InteractiveGiftRegistry,
  GoldShimmerParticles,
  PearlescentFlourishBG,
  GeometricGridLinesBG,
  FallingLeavesBG,
  FloatingPetalsBG,
  FiligreeMandalaBG,
  MinimalArchitecturalLines
} from './InteractiveThemeComponents';

export const formatDateSafe = (dateStr?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return 'TBD Date';
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', options || { month: 'long', day: 'numeric', year: 'numeric' });
        }
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', options || { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateStr || 'TBD Date';
  } catch {
    return dateStr || 'TBD Date';
  }
};

export const isPlusCode = (str: string): boolean => {
  if (!str) return false;
  const trimmed = str.trim();
  return /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,5}/i.test(trimmed);
};

export const getVenueFirstLine = (venueStr?: string, venueNameStr?: string) => {
  // 1. Manual venue name takes priority if provided and not a plus code
  if (venueNameStr && typeof venueNameStr === 'string' && venueNameStr.trim()) {
    const trimmedName = venueNameStr.trim();
    if (!isPlusCode(trimmedName)) {
      return trimmedName;
    }
  }

  if (!venueStr || typeof venueStr !== 'string' || !venueStr.trim()) return 'Venue TBD';
  const trimmedVenue = venueStr.trim();

  // If the venue string itself is or starts with a Plus Code
  if (isPlusCode(trimmedVenue)) {
    const parts = trimmedVenue.split(',');
    const nonPlusParts = parts.filter(p => !isPlusCode(p.trim()) && p.trim().length > 0);
    if (nonPlusParts.length > 0) {
      return nonPlusParts[0].trim();
    }
    return 'Venue Location';
  }

  const parts = trimmedVenue.split(',');
  return parts[0] ? parts[0].trim() : (trimmedVenue || 'Venue TBD');
};

export const isRsvpDeadlinePassed = (deadlineDateString?: string) => {
  if (!deadlineDateString || typeof deadlineDateString !== 'string') return false;
  try {
    const parts = deadlineDateString.split('-');
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    
    // Create date in local timezone representing the END of the deadline day (23:59:59)
    const deadlineDate = new Date(year, month, day, 23, 59, 59, 999);
    if (isNaN(deadlineDate.getTime())) return false;
    const now = new Date();
    return now.getTime() > deadlineDate.getTime();
  } catch (e) {
    return false;
  }
};

export const formatDeadlineDate = (dateStr?: string) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return formatDateSafe(dateStr);
};

export const CopyAddressButton: React.FC<{ address: string; className?: string; iconColor?: string }> = ({ address, className, iconColor }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {});
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCopy}
      className={className}
      title="Copy venue address to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Address Copied!</span>
        </>
      ) : (
        <>
          <Copy className={`w-3.5 h-3.5 shrink-0 ${iconColor || ''}`} />
          <span>Copy Address</span>
        </>
      )}
    </motion.button>
  );
};

export const isProgramRevealed = (eventDateString?: string) => {
  if (!eventDateString) return true;
  try {
    const parts = eventDateString.split('-');
    if (parts.length !== 3) return true;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    
    // Event start date
    const eventDate = new Date(year, month, day);
    
    // Today's date at start of day
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate difference in days
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Revealed if diffDays is 1 day or less
    return diffDays <= 1;
  } catch (e) {
    return true;
  }
};

export const FadeInSection: React.FC<{ children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }> = ({ children, className, id, style }) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
      className={className}
      style={style}
    >
      {children}
    </motion.section>
  );
};

const rawApiKey = (
  import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env.GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env.VITE_GOOGLE_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  ''
).trim().replace(/^["']|["']$/g, '');

const API_KEY = rawApiKey;

const MapInner: React.FC<{ address: string }> = ({ address }) => {
  const map = useMap();
  const [position, setPosition] = React.useState<google.maps.LatLngLiteral | null>(null);

  React.useEffect(() => {
    if (!map || !address) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const pos = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        setPosition(pos);
        map.setCenter(pos);
        map.setZoom(14);
      }
    });
  }, [map, address]);

  return (
    <>
      {position && (
        <AdvancedMarker position={position}>
          <Pin background="#EAB308" glyphColor="#fff" />
        </AdvancedMarker>
      )}
    </>
  );
};

const EventGoogleMap: React.FC<{ address: string; className?: string }> = ({ address, className }) => {
  const hasValidKey = Boolean(API_KEY) && API_KEY.startsWith('AIzaSy') && API_KEY.length >= 30;

  if (!hasValidKey) {
    return (
      <div className={`flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 text-xs p-4 text-center ${className}`}>
        <p className="font-bold">Google Maps API Key Required</p>
        <p className="text-[10px] mt-1 text-zinc-400">Configure GOOGLE_MAPS_PLATFORM_KEY to view interactive map.</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: 37.42, lng: -122.08 }}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={true}
        >
          <MapInner address={address} />
        </Map>
      </APIProvider>
    </div>
  );
};

interface ThemeRendererProps {
  event: EventModel;
  guest: Guest | null;
  guestbook: GuestbookEntry[];
  rsvpStatus: 'accepted' | 'declined';
  setRsvpStatus: (status: 'accepted' | 'declined') => void;
  mealOption: string;
  setMealOption: (option: string) => void;
  companions: number;
  setCompanions: (count: number) => void;
  guestbookMsg: string;
  setGuestbookMsg: (msg: string) => void;
  isSubmittingRsvp: boolean;
  rsvpSubmitted: boolean;
  setRsvpSubmitted: (submitted: boolean) => void;
  handleRsvpSubmit: (e: React.FormEvent) => void;
  onRsvpSuccess: (updatedGuest: Guest) => void;
  timelineSteps: { time: string; title: string; desc: string }[];
  registryItems: { store: string; link: string; note: string }[];
  theme: any;
}

export const ScrollProgressBar: React.FC<{ themeId?: string }> = ({ themeId }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const getAccentColor = (id?: string) => {
    switch (id) {
      case 'luxury':
        return '#D4AF37';
      case 'elegant':
        return '#334155';
      case 'modern':
        return '#C9A961';
      case 'rustic':
        return '#5C4033';
      case 'floral':
        return '#C97064';
      case 'traditional':
        return '#B45309';
      case 'minimal':
        return '#18181B';
      default:
        return '#D4AF37';
    }
  };

  const accentColor = getAccentColor(themeId);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-[100] origin-left pointer-events-none"
      style={{
        scaleX,
        backgroundColor: accentColor,
        boxShadow: `0 0 12px ${accentColor}A0`
      }}
    />
  );
};

export const ThemeRenderer: React.FC<ThemeRendererProps> = (props) => {
  const { event } = props;

  const renderContent = () => {
    switch (event.themeId) {
      case 'luxury':
        return <LuxuryTheme {...props} />;
      case 'elegant':
        return <ElegantTheme {...props} />;
      case 'modern':
        return <ModernTheme {...props} />;
      case 'rustic':
        return <RusticTheme {...props} />;
      case 'floral':
        return <FloralTheme {...props} />;
      case 'traditional':
        return <TraditionalTheme {...props} />;
      case 'minimal':
        return <MinimalTheme {...props} />;
      default:
        return <LuxuryTheme {...props} />;
    }
  };

  return (
    <>
      <ScrollProgressBar themeId={event.themeId} />
      {renderContent()}
    </>
  );
};

/* ==========================================
   1. LUXURY GOLD THEME (Royal symmetry & gold accents)
   ========================================== */
const LuxuryTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -130]);
  return (
    <div className="flex-1 flex flex-col font-luxury-body bg-[#F5F5DC] text-[#2C2C2C] selection:bg-[#D4AF37] selection:text-white relative">
      <GoldShimmerParticles />

      {/* Hero / Header with Gold Metallic Gradients & Art Deco details */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 text-center overflow-hidden border-b-4 border-[#D4AF37] bg-[#1C1C1C] text-white min-h-[500px] sm:min-h-[600px] flex flex-col justify-center items-center">
        {/* Full-bleed Hero Background Image Backdrop */}
        <div className="absolute inset-0 z-0">
          <img 
            src={event.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'} 
            className="w-full h-full object-cover filter brightness-[0.50] contrast-[1.1] scale-105 pointer-events-none" 
            alt="Luxury Hero Background" 
          />
          {/* Subtle dark gold gradient overlay ensuring rich text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/80 via-[#1C1C1C]/65 to-[#1C1C1C]/95 pointer-events-none" />
        </div>

        {/* Decorative Art Deco Grid overlay */}
        <div className="absolute inset-0 z-0 opacity-15 mix-blend-overlay pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0), linear-gradient(to right, rgba(212,175,55,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,175,55,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px, 20px 20px, 20px 20px'
        }} />
        
        {/* Top/Bottom Art Deco Border */}
        <div className="absolute top-3 left-3 right-3 bottom-3 sm:top-6 sm:left-6 sm:right-6 sm:bottom-6 border border-[#D4AF37]/30 pointer-events-none z-10" />
        <div className="absolute top-5 left-5 right-5 bottom-5 sm:top-8 sm:left-8 sm:right-8 sm:bottom-8 border border-[#D4AF37]/15 pointer-events-none z-10" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 items-center">
          <div className="flex items-center gap-2 sm:gap-3 text-[#D4AF37]">
            <span className="h-[1px] w-6 sm:w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] animate-pulse shrink-0" />
            <span className="text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] font-medium uppercase truncate">Event Invitation</span>
            <span className="h-[1px] w-6 sm:w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>

          {/* Interactive Envelope Hero Toggle */}
          <InteractiveEnvelopeHero
            title="A Cordial Invitation"
            subtitle={`We invite you to celebrate this royal union with ${event.brideName || event.birthdayPerson || 'us'}.`}
            themeId="luxury"
            accentColor="#D4AF37"
          />

          {/* Decorative Gold Rings Accent */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-20 sm:w-28 sm:h-28 my-1 flex items-center justify-center relative pointer-events-none"
          >
            <img 
              src="/assets/invitation/wedding-rings.png" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] mix-blend-screen opacity-90" 
              alt="Decorative Gold Rings" 
            />
          </motion.div>

          {/* Majestic Monogram Frame */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full border-2 border-[#D4AF37] p-1.5 sm:p-2 bg-[#2C2C2C] shadow-[0_0_30px_rgba(212,175,55,0.3)] mt-2 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full border border-[#D4AF37]/50 overflow-hidden relative z-10">
              <img src={event.coverImage} className="w-full h-full object-cover rounded-full filter hover:scale-110 transition-transform duration-700" alt="Portrait" />
            </div>
          </motion.div>

          {/* Royal Gold Crest Ornament */}
          <div className="w-28 sm:w-36 h-auto my-1 opacity-90">
            <img src="/assets/invitation/golden-ornament-frame.png" className="w-full h-auto object-contain filter drop-shadow-md" alt="Gold Crest Ornament" />
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-6xl font-luxury-heading tracking-wide text-white leading-tight mt-1 sm:mt-2 break-words max-w-full">
            {event.type === 'wedding' ? (
              <span className="flex flex-col gap-1 sm:gap-2">
                <span className="font-light tracking-wide break-words">{event.brideName}</span>
                <span className="text-2xl sm:text-3xl font-luxury-script text-[#D4AF37] my-0.5 sm:my-1 lowercase">and</span>
                <span className="font-light tracking-wide break-words">{event.groomName}</span>
              </span>
            ) : (
              <span className="font-light tracking-wide break-words">{event.birthdayPerson}</span>
            )}
          </h1>

          <p className="text-sm sm:text-base font-luxury-script text-[#D4AF37] max-w-xl mx-auto leading-relaxed px-2 sm:px-4 break-words">
            "{event.description}"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 w-full max-w-lg">
            <div className="w-full sm:w-auto border border-[#D4AF37]/40 px-4 sm:px-8 py-2.5 sm:py-3 bg-[#1C1C1C]/80 backdrop-blur-sm shadow-xl rounded-lg text-center">
              <span className="block text-[8px] sm:text-[9px] text-[#D4AF37] uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-0.5 sm:mb-1">Date</span>
              <span className="text-xs sm:text-sm text-white font-medium">{formatDateSafe(event.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="w-full sm:w-auto border border-[#D4AF37]/40 px-4 sm:px-8 py-2.5 sm:py-3 bg-[#1C1C1C]/80 backdrop-blur-sm shadow-xl rounded-lg text-center">
              <span className="block text-[8px] sm:text-[9px] text-[#D4AF37] uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-0.5 sm:mb-1">Time</span>
              <span className="text-xs sm:text-sm text-white font-medium">{event.time} PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Ticker Countdown */}
      <FadeInSection className="bg-[#2C2C2C] border-b border-[#D4AF37]/30 py-6 sm:py-10 text-center relative overflow-hidden px-3">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
        
        {/* Subtle Side Filigree Corner Accents */}
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-6 -left-6 w-24 h-24 object-contain pointer-events-none opacity-25 mix-blend-screen" alt="Filigree Corner" />
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-6 -right-6 w-24 h-24 object-contain pointer-events-none opacity-25 mix-blend-screen -scale-x-100" alt="Filigree Corner" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <img src="/assets/invitation/gold-vine-ornament.png" className="w-6 h-10 object-contain opacity-75 mb-1 pointer-events-none" alt="Gold Vine" />
          <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#D4AF37] uppercase block mb-2 sm:mb-3">Time Remaining</span>
          <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-luxury-heading" themeColor="#D4AF37" />
        </div>
      </FadeInSection>

      {/* Ornate Letters Block (Our Story) */}
      <FadeInSection className="py-16 sm:py-24 md:py-28 px-4 sm:px-6 relative overflow-hidden bg-cover bg-center" style={{
        backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.04) 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}>
        {/* Long Golden Ribbon Flowing Across Background */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-4xl h-auto object-contain pointer-events-none opacity-40 mix-blend-multiply drop-shadow-md z-0 rotate-[-2deg]" 
          alt="Golden Ribbon Accent" 
        />

        {/* Botanical Rose Arrangement Peeking From Top-Left Corner */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/rose-floral-arch.png" 
          className="absolute -top-12 -left-12 sm:-top-16 sm:-left-16 w-48 sm:w-72 h-auto object-contain pointer-events-none opacity-85 mix-blend-multiply z-10 filter drop-shadow-sm" 
          alt="Rose Floral Accent" 
        />

        {/* Sage Leaves Peeking From Bottom-Right Corner */}
        <motion.img 
          style={{ y: parallaxYReverse }}
          src="/assets/invitation/sage-botanical-leaves.png" 
          className="absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 w-40 sm:w-56 h-auto object-contain pointer-events-none opacity-80 mix-blend-multiply z-10" 
          alt="Sage Leaf Accent" 
        />

        <div className="max-w-2xl mx-auto border-2 border-[#D4AF37]/40 p-6 sm:p-12 md:p-16 bg-white/95 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-lg relative text-center z-20">
          {/* Filigree Lace Corner Overlays */}
          <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-3 -left-3 w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none opacity-40 mix-blend-multiply" alt="Filigree Corner" />
          <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-3 -right-3 w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none opacity-40 mix-blend-multiply -scale-x-100" alt="Filigree Corner" />
          <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -bottom-3 -left-3 w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none opacity-40 mix-blend-multiply -scale-y-100" alt="Filigree Corner" />
          <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -bottom-3 -right-3 w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none opacity-40 mix-blend-multiply rotate-180" alt="Filigree Corner" />

          <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-3">
            <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
          </div>
          <h2 className="text-xl sm:text-3xl font-luxury-heading font-medium text-[#2C2C2C] uppercase tracking-widest break-words">Our Story</h2>
          <p className="text-[10px] sm:text-xs text-[#CD7F32] font-luxury-heading tracking-widest uppercase mt-1">Welcome to Our Celebration</p>
          
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed mt-6 sm:mt-8 font-luxury-heading italic break-words">
            "We warmly invite you to join us as we celebrate this special occasion with family and friends. We look forward to sharing an unforgettable day together."
          </p>
          <div className="w-20 sm:w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-6 sm:mt-8" />
        </div>
      </FadeInSection>

      {/* Interactive Program Timeline Section */}
      {showProgram && (
        <FadeInSection className="py-16 sm:py-24 md:py-28 bg-white border-y border-[#D4AF37]/20 relative overflow-hidden">
          {/* Hanging Botanical Garland Peeking From Top-Right Edge */}
          <motion.img 
            style={{ y: parallaxYMedium }}
            src="/assets/invitation/botanical-eucalyptus-garland.png" 
            className="absolute -top-10 -right-12 sm:-right-16 w-52 sm:w-80 h-auto object-contain pointer-events-none opacity-85 mix-blend-multiply z-10" 
            alt="Eucalyptus Garland" 
          />

          {/* Golden Ribbon accent behind title */}
          <motion.img 
            style={{ y: parallaxYSlow }}
            src="/assets/invitation/long-golden-ribbon.png" 
            className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-0" 
            alt="Golden Ribbon Accent" 
          />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-20">
            <div className="text-center mb-10 sm:mb-16 flex flex-col items-center">
              <img src="/assets/invitation/gold-vine-ornament.png" className="w-5 h-9 object-contain opacity-75 mb-1 pointer-events-none" alt="Gold Vine" />
              <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">Schedule</span>
              <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Event Schedule</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
            </div>

            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="luxury"
              accentColor="#D4AF37"
              lineColor="border-[#D4AF37]/30"
              headingFont="font-luxury-heading"
            />
          </div>
        </FadeInSection>
      )}

      {/* Interactive Gallery Section */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <FadeInSection className="py-16 sm:py-24 md:py-28 bg-[#F5F5DC]/40 relative overflow-hidden">
          {/* Art Deco Pattern Overlay */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `url("/assets/invitation/geometric-gold-frame.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />

          {/* Rose Floral Arrangement Peeking From Bottom-Left Corner */}
          <motion.img 
            style={{ y: parallaxYFast }}
            src="/assets/invitation/rose-floral-arch.png" 
            className="absolute -bottom-16 -left-16 w-52 sm:w-80 h-auto object-contain pointer-events-none opacity-85 mix-blend-multiply z-10 rotate-90" 
            alt="Rose Floral Accent" 
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-20">
            <div className="text-center mb-10 sm:mb-16 flex flex-col items-center">
              <img src="/assets/invitation/golden-ornament-frame.png" className="w-16 h-auto object-contain opacity-80 mb-2 pointer-events-none" alt="Royal Crest" />
              <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">Photos</span>
              <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Photo Gallery</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
            </div>

            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="luxury"
              cardBorderClass="border-[#D4AF37]/30"
              cardBgClass="bg-white"
            />
          </div>
        </FadeInSection>
      )}

      {/* Venue Section (Luxury Gold) */}
      <FadeInSection className="py-16 sm:py-24 md:py-28 bg-white text-left relative border-t border-[#D4AF37]/20 overflow-hidden">
        {/* Long Golden Ribbon Floating Across Top Boundary */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -top-10 right-0 w-full max-w-3xl h-auto object-contain pointer-events-none opacity-35 mix-blend-multiply z-0 rotate-[1deg]" 
          alt="Golden Ribbon Accent" 
        />

        {/* Botanical Eucalyptus Garland Peeking From Top-Left */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-12 -left-12 sm:-top-16 sm:-left-16 w-48 sm:w-72 h-auto object-contain pointer-events-none opacity-80 mix-blend-multiply z-10" 
          alt="Botanical Garland" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center relative z-20">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <img src="/assets/invitation/gold-vine-ornament.png" className="w-4 h-8 object-contain opacity-80 pointer-events-none" alt="Gold Vine" />
              <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase font-semibold block">Venue & Location</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">{getVenueFirstLine(event.venue, event.venueName)}</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37]" />
            
            <p className="text-xs text-stone-600 leading-relaxed font-light font-luxury-heading break-words">
              We look forward to welcoming you to our celebration. Tap below to copy the address or view the venue location on Google Maps.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 text-xs text-[#2C2C2C] border-y border-[#D4AF37]/20 py-6 my-1 font-light">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#CD7F32] uppercase tracking-widest font-semibold block mb-0.5">Venue Address</span>
                  <span className="break-words">{event.venue || 'Venue TBD'}</span>
                </div>
              </div>

              {event.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#CD7F32] uppercase tracking-widest font-semibold block mb-0.5">Date & Time</span>
                    <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                  </div>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#CD7F32] uppercase tracking-widest font-semibold block mb-0.5">Dress Code</span>
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-[#2C2C2C]">{event.dressCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2C2C2C] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-[10px] font-luxury-heading tracking-[0.15em] uppercase transition-colors rounded-lg shadow-md"
              >
                <MapIcon className="w-4 h-4 shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#D4AF37]/40 text-[#2C2C2C] hover:bg-[#F5F5DC] text-[10px] font-luxury-heading tracking-[0.15em] uppercase transition-colors rounded-lg"
                iconColor="text-[#D4AF37]"
              />
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="border border-[#D4AF37]/30 bg-[#2C2C2C] p-2 rounded-lg h-[260px] sm:h-[300px] overflow-hidden relative shadow-lg"
          >
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-md" />
          </motion.div>
        </div>
      </FadeInSection>

      {/* Gift Registry */}
      <FadeInSection className="py-16 sm:py-24 md:py-28 bg-[#F5F5DC]/40 border-t border-[#D4AF37]/20 relative overflow-hidden">
        {/* Subtle Filigree Corner Accents */}
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-2 left-2 w-20 h-20 object-contain pointer-events-none opacity-30 mix-blend-multiply" alt="Filigree Corner" />
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute bottom-2 right-2 w-20 h-20 object-contain pointer-events-none opacity-30 mix-blend-multiply rotate-180" alt="Filigree Corner" />

        {/* Botanical Sage Leaf Accent Peeking Bottom-Right */}
        <motion.img 
          style={{ y: parallaxYReverse }}
          src="/assets/invitation/sage-botanical-leaves.png" 
          className="absolute -bottom-8 -right-8 w-44 h-44 object-contain pointer-events-none opacity-70 mix-blend-multiply" 
          alt="Sage Leaf" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="mb-10 sm:mb-16 flex flex-col items-center">
            <img src="/assets/invitation/gold-vine-ornament.png" className="w-5 h-9 object-contain opacity-75 mb-1 pointer-events-none" alt="Gold Vine" />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">Registry</span>
            <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Gift Registry</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <InteractiveGiftRegistry
            event={event}
            themeId="luxury"
            cardBgClass="bg-white/95 backdrop-blur-sm"
            cardBorderClass="border-[#D4AF37]/30 hover:border-[#D4AF37]/60"
            titleColorClass="text-[#2C2C2C]"
            descColorClass="text-stone-600 font-light"
            ctaColorClass="text-[#CD7F32] hover:text-[#D4AF37]"
            headingFont="font-luxury-heading"
            cornerDecor={
              <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-4 -right-4 w-14 h-14 object-contain pointer-events-none opacity-15 mix-blend-multiply group-hover:opacity-35 transition-opacity" alt="Filigree Corner" />
            }
          />
        </div>
      </FadeInSection>

      {/* RSVP Section */}
      <FadeInSection id="rsvp-anchor" className="py-16 sm:py-24 md:py-28 bg-white border-t border-[#D4AF37]/20 relative overflow-hidden">
        {/* Long Golden Ribbon Flowing Across Top */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-3xl h-auto object-contain pointer-events-none opacity-45 mix-blend-multiply z-0" 
          alt="Golden Ribbon Accent" 
        />

        {/* Rose Floral Arch Peeking From Top-Right Corner */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/rose-floral-arch.png" 
          className="absolute -top-12 -right-12 sm:-top-16 sm:-right-16 w-52 sm:w-80 h-auto object-contain pointer-events-none opacity-85 mix-blend-multiply z-10 -scale-x-100" 
          alt="Rose Floral Accent" 
        />

        <div className="max-w-lg mx-auto px-4 sm:px-6 relative z-20">
          <div className="text-center mb-10 sm:mb-16 flex flex-col items-center">
            <img src="/assets/invitation/golden-ornament-frame.png" className="w-16 h-auto object-contain opacity-85 mb-2 pointer-events-none" alt="Royal Crest" />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">RSVP</span>
            <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Confirm Attendance</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="luxury"
            theme={theme}
          />
        </div>
      </FadeInSection>

      {/* Guestbook section with elegant cards */}
      <FadeInSection className="py-16 sm:py-24 md:py-28 bg-[#F5F5DC]/40 border-t border-[#D4AF37]/20 relative overflow-hidden">
        {/* Hanging Floral Canopy Peeking From Top-Left */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/hanging-lavender-canopy.png" 
          className="absolute -top-8 -left-8 w-56 sm:w-80 h-auto object-contain pointer-events-none opacity-50 mix-blend-multiply z-10" 
          alt="Hanging Lavender Canopy" 
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20">
          <div className="text-center mb-10 sm:mb-16 flex flex-col items-center">
            <img src="/assets/invitation/gold-vine-ornament.png" className="w-5 h-9 object-contain opacity-75 mb-1 pointer-events-none" alt="Gold Vine" />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">Guestbook</span>
            <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Guestbook Messages</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs sm:text-sm text-stone-400 py-6 font-light italic">No messages yet. Be the first to sign the guestbook and leave a message!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-5 sm:p-8 bg-white border border-[#D4AF37]/20 shadow-xl rounded-lg flex flex-col justify-between min-h-[10rem] h-auto relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#CD7F32]" />
                  <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-1 right-1 w-12 h-12 object-contain pointer-events-none opacity-20 mix-blend-multiply" alt="Filigree Corner" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-[#D4AF37]/30 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-stone-600 italic leading-relaxed font-light font-luxury-heading break-words">"{entry.message}"</p>
                  <div className="border-t border-stone-100 pt-3 sm:pt-4 mt-3 sm:mt-4 flex justify-between items-center text-[10px] sm:text-[11px] font-luxury-heading">
                    <span className="font-bold uppercase tracking-wider text-[#2C2C2C] truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-[#CD7F32] font-medium shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeInSection>

      {/* Interactive FAQ & Event Guidelines */}
      <FadeInSection className="py-16 sm:py-24 bg-white relative border-t border-[#D4AF37]/20 overflow-hidden">
        {/* Subtle Golden Ribbon Flowing Across Bottom */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -bottom-10 left-0 w-full max-w-3xl h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-0" 
          alt="Golden Ribbon Accent" 
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
            <img src="/assets/invitation/golden-ornament-frame.png" className="w-14 h-auto object-contain opacity-80 mb-2 pointer-events-none" alt="Royal Crest" />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">Guidelines</span>
            <h2 className="text-2xl sm:text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest break-words">Event Details & FAQ</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <InteractiveFaqAccordion
            themeId="luxury"
            accentColor="#D4AF37"
            borderColor="border-[#D4AF37]/30"
            textColor="text-[#2C2C2C]"
            headingFont="font-luxury-heading"
          />
        </div>
      </FadeInSection>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-16 text-center border-t-2 border-[#D4AF37] text-xs relative overflow-hidden">
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-2 left-2 w-20 h-20 object-contain pointer-events-none opacity-15 mix-blend-screen" alt="Filigree Corner" />
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-2 right-2 w-20 h-20 object-contain pointer-events-none opacity-15 mix-blend-screen -scale-x-100" alt="Filigree Corner" />

        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4 items-center relative z-10">
          <img src="/assets/invitation/gold-vine-ornament.png" className="w-6 h-10 object-contain opacity-75 pointer-events-none" alt="Gold Vine" />
          <span className="text-lg font-luxury-script text-[#D4AF37] font-medium">Pam's Events</span>
          <p className="text-stone-400 leading-relaxed text-[11px] font-light tracking-wide">Creating memorable events, seamless RSVPs, and beautiful digital invitations.</p>
          <div className="h-[1px] bg-white/10 my-4 w-full" />
          <span className="text-[10px] text-stone-500 tracking-[0.25em] font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   2. ELEGANT WHITE THEME (High-fashion editorial split)
   ========================================== */
const ElegantTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -110]);

  return (
    <div className="flex-1 flex flex-col font-elegant-body bg-[#FEFEFE] text-[#3A3A3A] selection:bg-[#3A3A3A] selection:text-white relative overflow-hidden">
      <PearlescentFlourishBG />

      {/* Pristine Gallery Hero Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-24 bg-[#FEFEFE] border-b border-[#C0C0C0]/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch justify-between gap-10 md:gap-16">
          
          {/* Left Block - Asymmetrical Title & Scaling */}
          <div className="flex flex-col justify-center w-full md:w-3/5 text-left gap-6 sm:gap-10">
            <div className="flex items-center gap-3 text-[#9E9E9E]">
              <span className="w-1.5 h-1.5 bg-[#3A3A3A] rounded-full shrink-0" />
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] font-medium uppercase truncate">Event Invitation</span>
            </div>

            {/* Interactive Envelope Hero Toggle */}
            <InteractiveEnvelopeHero
              title="Welcome Note"
              subtitle={`Join us for the celebration with ${event.brideName || event.birthdayPerson || 'us'}.`}
              themeId="elegant"
              accentColor="#3A3A3A"
            />

            {/* Extreme scale contrast heading */}
            <h1 className="text-3xl sm:text-6xl md:text-8xl font-elegant-heading tracking-tight leading-[1.0] sm:leading-[0.9] text-[#3A3A3A] uppercase font-light break-words max-w-full">
              {event.type === 'wedding' ? (
                <span className="flex flex-col gap-2 sm:gap-4">
                  <span className="block border-b border-[#C0C0C0]/30 pb-2 sm:pb-4 break-words">{event.brideName}</span>
                  <span className="text-xl sm:text-3xl font-elegant-heading lowercase tracking-widest text-[#9E9E9E] py-1 sm:py-2">and</span>
                  <span className="block pt-1 sm:pt-2 break-words">{event.groomName}</span>
                </span>
              ) : (
                <span className="block break-words">{event.birthdayPerson}</span>
              )}
            </h1>

            <div className="h-[0.5px] w-20 sm:w-24 bg-[#C0C0C0]" />

            <p className="text-xs sm:text-sm tracking-wide leading-relaxed text-[#9E9E9E] max-w-lg font-light break-words">
              {event.description}
            </p>

            {/* Minimalist Date Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#3A3A3A] border-t border-[#C0C0C0]/40 pt-6 sm:pt-8 max-w-sm">
              <div>
                <span className="text-[#9E9E9E] block mb-0.5 sm:mb-1">Date</span>
                <strong className="font-medium block break-words">{formatDateSafe(event.date, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
              <div>
                <span className="text-[#9E9E9E] block mb-0.5 sm:mb-1">Time</span>
                <strong className="font-medium block break-words">{event.time} PM</strong>
              </div>
            </div>
          </div>

          {/* Right Block - Portrait layout Lookbook */}
          <div className="flex items-center justify-center w-full md:w-2/5">
            <div className="relative p-2.5 sm:p-3 bg-[#F7F7F7] border border-[#C0C0C0]/30 max-w-[280px] sm:max-w-[320px] w-full aspect-[3/4] shadow-sm flex flex-col justify-between overflow-hidden">
              {/* Real Silver & Gold Lace Corner Accents */}
              <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-4 -right-4 w-28 h-28 object-contain pointer-events-none opacity-30 mix-blend-multiply" alt="Filigree Corner" />
              <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -bottom-4 -left-4 w-28 h-28 object-contain pointer-events-none opacity-30 mix-blend-multiply rotate-180" alt="Filigree Corner" />

              <div className="w-full h-[90%] overflow-hidden bg-white z-10 relative">
                <img src={event.coverImage} className="w-full h-full object-cover filter grayscale contrast-115 transition-all duration-700 hover:grayscale-0" alt="Editorial Frame" />
              </div>
              <div className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-center py-1.5 sm:py-2 text-[#9E9E9E] font-medium border-t border-[#C0C0C0]/20 mt-2 truncate z-10 relative">
                Event Photo
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Whisper-Quiet Minimalist Ticker Countdown */}
      <FadeInSection className="bg-[#F7F7F7] border-b border-[#C0C0C0]/40 py-6 sm:py-8 px-4 sm:px-8 text-left relative overflow-hidden">
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-6 -left-6 w-20 h-20 object-contain pointer-events-none opacity-15 mix-blend-multiply" alt="Filigree Corner" />
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 relative z-10">
          <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-light">Time Remaining</span>
          <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-elegant-heading" themeColor="#3A3A3A" />
        </div>
      </FadeInSection>

      {/* Quiet Gallery Story Block */}
      <FadeInSection className="py-16 sm:py-24 md:py-32 px-4 sm:px-8 bg-white relative overflow-hidden">
        {/* Parallax Floating Ribbon Background */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-3xl h-auto object-contain pointer-events-none opacity-20 mix-blend-multiply z-0 rotate-[2deg]" 
          alt="Silk Ribbon Accent" 
        />
        {/* Parallax Botanical Garland */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-12 -left-12 w-44 sm:w-64 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
          alt="Botanical Garland Accent" 
        />

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 text-left items-start relative z-20">
          <div className="md:col-span-7 flex flex-col gap-4 sm:gap-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light leading-tight break-words">About Our Event</h2>
            <div className="w-12 h-[0.5px] bg-[#3A3A3A]" />
            <p className="text-xs sm:text-sm leading-relaxed text-[#9E9E9E] font-light tracking-wide break-words">
              We are excited to celebrate this milestone with our closest family and friends. Join us for an unforgettable gathering.
            </p>
          </div>
          <div className="md:col-span-5 border-l border-[#C0C0C0]/40 pl-4 sm:pl-8 md:pt-4">
            <p className="text-lg sm:text-xl font-elegant-heading italic text-[#9E9E9E] leading-snug break-words">
              "Thank you for being a part of our journey and sharing in our celebration."
            </p>
          </div>
        </div>
      </FadeInSection>

      {/* Itinerary / Program Timeline */}
      {showProgram && (
        <FadeInSection className="py-16 sm:py-24 md:py-32 bg-[#F7F7F7] border-y border-[#C0C0C0]/40 text-left relative overflow-hidden">
          {/* Parallax Sage Leaves Peeking Right */}
          <motion.img 
            style={{ y: parallaxYReverse }}
            src="/assets/invitation/sage-botanical-leaves.png" 
            className="absolute -top-10 -right-10 w-40 sm:w-56 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
            alt="Sage Leaf Accent" 
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-20">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">Schedule</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light mb-10 sm:mb-16 break-words">Event Timeline</h2>
            
            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="elegant"
              accentColor="#3A3A3A"
              lineColor="border-[#C0C0C0]/40"
              headingFont="font-elegant-heading"
            />
          </div>
        </FadeInSection>
      )}

      {/* Gallery / Visual Stream */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <FadeInSection className="py-16 sm:py-24 md:py-32 bg-white border-b border-[#C0C0C0]/40 relative overflow-hidden">
          {/* Parallax Rose Floral Accent */}
          <motion.img 
            style={{ y: parallaxYFast }}
            src="/assets/invitation/rose-floral-arch.png" 
            className="absolute -bottom-12 -left-12 w-48 sm:w-72 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
            alt="Rose Accent" 
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-20">
            <div className="text-center mb-12 sm:mb-20">
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">Photos</span>
              <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light break-words">Photo Gallery</h2>
              <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-3 sm:mt-4" />
            </div>

            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="elegant"
              cardBorderClass="border-[#C0C0C0]/30"
              cardBgClass="bg-[#F7F7F7]"
            />
          </div>
        </FadeInSection>
      )}

      {/* Venue Section (Elegant Grayscale/Charcoal) */}
      <FadeInSection 
        className="py-16 sm:py-24 md:py-32 bg-white text-left relative overflow-hidden"
      >
        {/* Silver Filigree Corner Overlay */}
        <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-2 left-2 w-20 h-20 object-contain pointer-events-none opacity-20 mix-blend-multiply" alt="Filigree Corner" />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center relative z-10">
          <div className="flex flex-col gap-4 sm:gap-6">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] block uppercase font-semibold">Location & Venue</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light leading-tight break-words">{getVenueFirstLine(event.venue, event.venueName)}</h2>
            <div className="w-12 h-[0.5px] bg-[#3A3A3A]" />
            
            <p className="text-xs text-[#9E9E9E] leading-relaxed font-light tracking-wide break-words">
              We look forward to welcoming you. Tap below to copy the address or view the venue location on Google Maps.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 text-xs text-[#3A3A3A] border-y border-[#C0C0C0]/30 py-6 sm:py-8 my-1 sm:my-2 font-light">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#9E9E9E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#9E9E9E] uppercase tracking-widest font-semibold block mb-0.5">Venue Address</span>
                  <span className="break-words">{event.venue || 'Venue TBD'}</span>
                </div>
              </div>

              {event.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#9E9E9E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#9E9E9E] uppercase tracking-widest font-semibold block mb-0.5">Date & Time</span>
                    <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                  </div>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-[#9E9E9E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#9E9E9E] uppercase tracking-widest font-semibold block mb-0.5">Dress Code</span>
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-[#3A3A3A]">{event.dressCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3A3A3A] text-white hover:bg-[#9E9E9E] text-[10px] font-sans tracking-[0.15em] uppercase transition-colors rounded-none shadow-md"
              >
                <MapIcon className="w-4 h-4 text-[#C0C0C0] shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#C0C0C0] text-[#3A3A3A] hover:bg-[#F7F7F7] text-[10px] font-sans tracking-[0.15em] uppercase transition-colors rounded-none"
                iconColor="text-[#9E9E9E]"
              />
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="border border-[#C0C0C0]/40 bg-[#F7F7F7] p-2 h-[260px] sm:h-[300px] overflow-hidden"
          >
            <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
          </motion.div>
        </div>
      </FadeInSection>

      {/* Gift Registry */}
      <FadeInSection className="py-16 sm:py-24 md:py-32 bg-[#F7F7F7] border-t border-[#C0C0C0]/40 relative overflow-hidden">
        {/* Parallax Ribbon */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/long-golden-ribbon.png" 
          className="absolute -top-6 left-0 w-full max-w-3xl h-auto object-contain pointer-events-none opacity-15 mix-blend-multiply z-0" 
          alt="Ribbon Accent" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <div className="mb-12 sm:mb-20">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">Registry</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light break-words">Gift Registry</h2>
            <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-3 sm:mt-4" />
          </div>

          <InteractiveGiftRegistry
            event={event}
            themeId="elegant"
            cardBgClass="bg-white"
            cardBorderClass="border-[#C0C0C0]/30 hover:border-[#3A3A3A]"
            titleColorClass="text-[#3A3A3A]"
            descColorClass="text-[#9E9E9E] font-light tracking-wide"
            ctaColorClass="text-[#3A3A3A] hover:text-[#9E9E9E]"
            headingFont="font-elegant-heading"
            cornerDecor={
              <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute -top-3 -right-3 w-12 h-12 object-contain pointer-events-none opacity-15 mix-blend-multiply group-hover:opacity-35 transition-opacity" alt="Filigree Corner" />
            }
          />
        </div>
      </FadeInSection>

      {/* RSVP Minimal form */}
      <FadeInSection id="rsvp-anchor" className="py-16 sm:py-24 md:py-32 bg-white relative border-t border-[#C0C0C0]/40 overflow-hidden">
        {/* Parallax Botanical Garland */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-10 -right-10 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
          alt="Garland Accent" 
        />

        <div className="max-w-lg mx-auto px-4 sm:px-8 relative z-20">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">RSVP</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light break-words">Confirm Attendance</h2>
          </div>

          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="elegant"
            theme={theme}
          />
        </div>
      </FadeInSection>

      {/* Guestbook registers */}
      <FadeInSection className="py-16 sm:py-24 md:py-32 bg-[#F7F7F7] border-t border-[#C0C0C0]/40 relative overflow-hidden">
        {/* Parallax Canopy */}
        <motion.img 
          style={{ y: parallaxYFast }}
          src="/assets/invitation/hanging-lavender-canopy.png" 
          className="absolute -top-8 -left-8 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
          alt="Canopy Accent" 
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-20">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">Guestbook</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light break-words">Guestbook Messages</h2>
            <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-3 sm:mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs text-[#9E9E9E] py-6 font-light italic">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-5 sm:p-8 bg-white border border-[#C0C0C0]/30 flex flex-col justify-between min-h-[10rem] h-auto hover:border-[#3A3A3A] transition-all duration-300 shadow-sm rounded-none relative overflow-hidden">
                  <img src="/assets/invitation/filigree-corner-ornament.png" className="absolute top-1 right-1 w-10 h-10 object-contain pointer-events-none opacity-15 mix-blend-multiply" alt="Filigree Corner" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-none overflow-hidden border border-[#C0C0C0]/40 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3A3A3A] italic leading-relaxed font-light font-elegant-heading break-words">"{entry.message}"</p>
                  <div className="border-t border-[#C0C0C0]/20 pt-3 sm:pt-4 mt-3 sm:mt-4 flex justify-between items-center text-[10px] font-sans">
                    <span className="font-bold uppercase tracking-wider text-[#3A3A3A] truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-[#9E9E9E] font-mono shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeInSection>

      {/* Interactive FAQ & Event Details */}
      <FadeInSection className="py-16 sm:py-24 bg-white border-t border-[#C0C0C0]/40 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <div className="mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">Guidelines</span>
            <h2 className="text-2xl sm:text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light break-words">Event Details & FAQ</h2>
            <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-3 sm:mt-4" />
          </div>

          <InteractiveFaqAccordion
            themeId="elegant"
            accentColor="#3A3A3A"
            borderColor="border-[#C0C0C0]/40"
            textColor="text-[#3A3A3A]"
            headingFont="font-elegant-heading"
          />
        </div>
      </FadeInSection>

      {/* Elegant Footer */}
      <footer className="bg-[#3A3A3A] text-white py-16 text-center text-xs">
        <div className="max-w-xl mx-auto px-8 flex flex-col gap-4 font-sans">
          <span className="text-xs uppercase tracking-[0.25em] font-bold">PAM'S EVENTS</span>
          <p className="text-[#9E9E9E] leading-relaxed text-[11px] font-light">Modern event platform for seamless invitations and guest management.</p>
          <div className="h-[0.5px] bg-[#C0C0C0]/30 my-6" />
          <span className="text-[10px] text-[#9E9E9E] tracking-[0.2em] font-mono">© 2026 PAM'S EVENTS DIGITAL CO. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   3. MODERN NAVY BENTO-GRID THEME (Futuristic dashboard)
   ========================================== */
const ModernTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="flex-1 flex flex-col font-modern-body bg-[#FAF8F3] text-[#2D2D2D] selection:bg-[#1A2B4A] selection:text-[#FAF8F3] relative overflow-hidden">
      <GeometricGridLinesBG />
      
      {/* Editorial Splitscreen Bento-Grid Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 text-left relative z-10">
        
        {/* Tile 1: Master Hero card (span 8) in Deep Navy */}
        <div className="md:col-span-8 bg-[#1A2B4A] text-[#FAF8F3] rounded-2xl p-5 sm:p-8 md:p-12 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between min-h-[300px] sm:min-h-[360px] relative overflow-hidden group">
          {/* Real Art Deco Geometric Frame Overlay */}
          <img src="/assets/invitation/geometric-gold-frame.png" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen pointer-events-none" alt="Geometric Frame" />
          
          {/* Subtle geometric line overlays */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 border-b border-l border-[#C9A961]/20 rounded-bl-full pointer-events-none" />
          
          <div className="relative z-10">
            <span className="bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 text-[#C9A961] text-[9px] sm:text-[10px] font-modern-heading uppercase tracking-[0.2em] sm:tracking-[0.25em] px-3 py-1 sm:py-1.5 rounded-none inline-block max-w-full truncate">
              You're Invited
            </span>

            <InteractiveEnvelopeHero
              title="Official Event Invitation"
              subtitle={`We request the pleasure of your company with ${event.brideName || event.birthdayPerson || 'us'}.`}
              themeId="modern"
              accentColor="#C9A961"
            />
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-modern-heading font-bold tracking-tight text-white mt-6 sm:mt-8 leading-tight uppercase break-words">
              {event.type === 'wedding' ? (
                <span>
                  {event.brideName} <span className="text-[#C9A961] font-light italic text-xl sm:text-2xl lowercase font-modern-body my-1 block sm:inline">and</span> {event.groomName}
                </span>
              ) : (
                <span>{event.birthdayPerson}</span>
              )}
            </h1>
            
            <p className="text-xs sm:text-sm text-[#FAF8F3]/80 mt-4 sm:mt-6 max-w-xl leading-relaxed font-light break-words">
              {event.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 relative z-10 border-t border-[#FAF8F3]/10 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 text-xs font-modern-heading tracking-wider uppercase text-[#C9A961]">
              <Calendar className="w-4 h-4 text-white shrink-0" />
              <span className="break-words">{formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span className="text-[#FAF8F3]/30 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs font-modern-heading tracking-wider uppercase text-white">
              <Clock className="w-4 h-4 text-[#C9A961] shrink-0" />
              <span className="break-words">{event.time} PM</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Countdown ticker (span 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-5 sm:p-8 border border-[#5B7C99]/30 shadow-md flex flex-col justify-between items-center text-center min-h-[260px] sm:min-h-[300px] relative overflow-hidden">
          <motion.img 
            style={{ y: parallaxYSlow }}
            src="/assets/invitation/long-golden-ribbon.png" 
            className="absolute -top-4 left-0 w-full h-auto object-contain pointer-events-none opacity-20 mix-blend-multiply" 
            alt="Golden Ribbon Accent" 
          />
          <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#1A2B4A] font-bold tracking-[0.2em] uppercase relative z-10">Time Remaining</span>
          
          <div className="my-auto py-4 sm:py-6 w-full relative z-10">
            <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-modern-heading text-xl sm:text-2xl font-bold" themeColor="#1A2B4A" />
          </div>
          
          <div className="w-12 h-[2px] bg-[#C9A961] mb-2 relative z-10" />
          <span className="text-[9px] font-mono text-[#5B7C99] uppercase tracking-wider relative z-10">Countdown</span>
        </div>

        {/* Tile 3: Lookbook Image Portrait (span 4) */}
        <div className="md:col-span-4 bg-[#1A2B4A] rounded-2xl overflow-hidden border border-[#C9A961]/30 shadow-lg relative min-h-[220px] sm:min-h-[260px] group">
          <img src={event.coverImage} className="w-full h-full object-cover filter brightness-[0.8] contrast-105 transition-all duration-750 group-hover:scale-105 group-hover:brightness-90" alt="Exhibition Frame" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4A] via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
            <span className="bg-[#C9A961] text-[#1A2B4A] text-[8px] sm:text-[9px] font-modern-heading uppercase tracking-[0.2em] font-bold px-2.5 sm:px-3 py-1 rounded-none shadow-md">
              Event Cover
            </span>
          </div>
        </div>

        {/* Tile 4: Deep story description (span 8) */}
        <div className="md:col-span-8 bg-white rounded-2xl p-5 sm:p-8 md:p-10 border border-[#5B7C99]/20 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Parallax Sage Accent */}
          <motion.img 
            style={{ y: parallaxYMedium }}
            src="/assets/invitation/sage-botanical-leaves.png" 
            className="absolute -top-8 -right-8 w-40 h-auto object-contain pointer-events-none opacity-20 mix-blend-multiply z-0" 
            alt="Sage Accent" 
          />
          <div className="relative z-10">
            <span className="text-[9px] sm:text-[10px] font-modern-heading tracking-[0.2em] text-[#5B7C99] uppercase font-bold">OUR STORY</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-modern-heading font-bold tracking-tight text-[#1A2B4A] uppercase mt-2 sm:mt-4 mb-3 sm:mb-4 break-words">WELCOME TO OUR CELEBRATION</h2>
            <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed max-w-xl font-light break-words">
              We are so excited to bring together our friends and family for this special occasion. Join us for good food, music, and wonderful memories as we celebrate together.
            </p>
          </div>
          <div className="text-[9px] sm:text-[10px] font-modern-heading text-[#C9A961] font-bold mt-4 sm:mt-6 tracking-widest border-t border-[#FAF8F3] pt-3 sm:pt-4 uppercase truncate relative z-10">
            CELEBRATE WITH US
          </div>
        </div>

        {showProgram ? (
          <>
            {/* Tile 5: Timeline Sequencer (span 6) */}
            <div className="md:col-span-6 bg-white rounded-2xl p-5 sm:p-8 border border-[#C9A961]/30 shadow-md">
              <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#1A2B4A] font-bold uppercase tracking-[0.2em] block mb-4 sm:mb-6">SCHEDULE</span>
              
              <InteractiveProgramTimeline
                steps={timelineSteps || []}
                themeId="modern"
                accentColor="#C9A961"
                lineColor="border-[#5B7C99]/30"
                headingFont="font-modern-heading"
              />
            </div>

            {/* Tile 6: Map directions / venue */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${showProgram ? 'md:col-span-6' : 'md:col-span-12'} bg-[#1A2B4A] text-white rounded-2xl p-5 sm:p-8 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between`}
            >
              <div>
                <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.2em] block mb-3 sm:mb-4">VENUE & LOCATION</span>
                <h3 className="text-xl sm:text-2xl font-modern-heading font-bold text-white uppercase tracking-wide break-words">{getVenueFirstLine(event.venue, event.venueName)}</h3>
                <div className="w-12 h-[1px] bg-[#C9A961] my-3 sm:my-4" />
                
                <p className="text-xs text-[#FAF8F3]/80 leading-relaxed font-light tracking-wide break-words">
                  Tap below to view location on the interactive map or get directions to the venue.
                </p>
                
                <div className="flex flex-col gap-2.5 sm:gap-3 mt-4 text-xs text-[#FAF8F3]/90 font-light">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Address</span>
                      <span className="break-words">{event.venue || 'Venue TBD'}</span>
                    </div>
                  </div>

                  {event.date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Date & Time</span>
                        <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                      </div>
                    </div>
                  )}

                  {event.dressCode && (
                    <div className="flex items-start gap-3">
                      <Tag className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Dress Code</span>
                        <span className="text-white font-medium uppercase tracking-wider text-[11px]">{event.dressCode}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-xl overflow-hidden h-[160px] sm:h-[180px] border border-[#C9A961]/20">
                  <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 text-center py-3 bg-[#C9A961] hover:bg-[#FAF8F3] hover:text-[#1A2B4A] text-[#1A2B4A] rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  <span>Open in Google Maps</span>
                </motion.a>

                <CopyAddressButton
                  address={event.venue || ''}
                  className="flex-1 text-center py-3 border border-[#C9A961]/50 hover:bg-[#C9A961]/20 text-white rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                  iconColor="text-[#C9A961]"
                />
              </div>
            </motion.div>
          </>
        ) : (
          /* Tile 6: Map directions / venue (span 12) */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-12 bg-[#1A2B4A] text-white rounded-2xl p-5 sm:p-8 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.2em] block mb-3 sm:mb-4">VENUE & LOCATION</span>
              <h3 className="text-xl sm:text-2xl font-modern-heading font-bold text-white uppercase tracking-wide break-words">{getVenueFirstLine(event.venue, event.venueName)}</h3>
              <div className="w-12 h-[1px] bg-[#C9A961] my-3 sm:my-4" />
              
              <p className="text-xs text-[#FAF8F3]/80 leading-relaxed font-light tracking-wide break-words">
                Tap below to view location on the interactive map or get directions to the venue.
              </p>
              
              <div className="flex flex-col gap-2.5 sm:gap-3 mt-4 text-xs text-[#FAF8F3]/90 font-light">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Address</span>
                    <span className="break-words">{event.venue || 'Venue TBD'}</span>
                  </div>
                </div>

                {event.date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Date & Time</span>
                      <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                    </div>
                  </div>
                )}

                {event.dressCode && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-[#C9A961] uppercase tracking-wider font-semibold block">Dress Code</span>
                      <span className="text-white font-medium uppercase tracking-wider text-[11px]">{event.dressCode}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-xl overflow-hidden h-[160px] sm:h-[180px] border border-[#C9A961]/20">
                <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 text-center py-3 bg-[#C9A961] hover:bg-[#FAF8F3] hover:text-[#1A2B4A] text-[#1A2B4A] rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="flex-1 text-center py-3 border border-[#C9A961]/50 hover:bg-[#C9A961]/20 text-white rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                iconColor="text-[#C9A961]"
              />
            </div>
          </motion.div>
        )}

        {/* Tile 7: Digital Registries (span 12) */}
        <FadeInSection className="md:col-span-12 bg-white rounded-2xl p-5 sm:p-8 border border-[#5B7C99]/30 shadow-md">
          <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#1A2B4A] font-bold uppercase tracking-[0.2em] block mb-4 sm:mb-6">GIFT REGISTRY</span>
          
          <InteractiveGiftRegistry
            event={event}
            themeId="modern"
            cardBgClass="bg-[#FAF8F3]"
            cardBorderClass="border-[#5B7C99]/20 hover:border-[#C9A961]"
            titleColorClass="text-[#1A2B4A]"
            descColorClass="text-[#2D2D2D]/70 font-light"
            ctaColorClass="text-[#C9A961] hover:text-[#1A2B4A]"
            headingFont="font-modern-heading"
          />
        </FadeInSection>

        {/* Tile 8: RSVP Form Console (span 12) */}
        <FadeInSection id="rsvp-anchor" className="md:col-span-12 bg-[#1A2B4A] text-white rounded-2xl p-5 sm:p-8 md:p-12 border border-[#C9A961]/40 shadow-xl">
          <div className="max-w-xl mx-auto text-center flex flex-col gap-2 items-center mb-8 sm:mb-10">
            <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.2em] sm:tracking-[0.25em]">RSVP</span>
            <h2 className="text-2xl sm:text-3xl font-modern-heading font-bold text-white uppercase tracking-tight break-words">CONFIRM YOUR ATTENDANCE</h2>
          </div>
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="modern"
            theme={theme}
          />
        </FadeInSection>

        {/* Tile 9: Guestbook feedback registry signatures (span 12) */}
        <FadeInSection className="md:col-span-12 bg-white rounded-2xl p-5 sm:p-8 border border-[#5B7C99]/30 shadow-md">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#5B7C99] uppercase tracking-[0.2em] block mb-2">GUESTBOOK</span>
            <h2 className="text-xl sm:text-2xl font-modern-heading font-bold text-[#1A2B4A] uppercase tracking-tight break-words">LEAVE A MESSAGE</h2>
            <div className="w-8 h-[1.5px] bg-[#C9A961] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs text-[#5B7C99] py-8 font-light italic">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-4 sm:p-6 bg-[#FAF8F3] border border-[#5B7C99]/20 flex flex-col justify-between min-h-[9rem] h-auto hover:border-[#C9A961] transition-colors rounded-xl shadow-sm">
                  {entry.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-[#5B7C99]/30 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#2D2D2D] leading-relaxed italic font-light font-modern-body break-words">"{entry.message}"</p>
                  <div className="border-t border-[#5B7C99]/15 pt-3 mt-3 sm:mt-4 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#1A2B4A] uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-[#5B7C99] font-mono shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeInSection>

        {/* Tile 10: Interactive FAQ Accordion (span 12) */}
        <FadeInSection className="md:col-span-12 bg-white rounded-2xl p-5 sm:p-8 border border-[#C9A961]/30 shadow-md">
          <span className="text-[9px] sm:text-[10px] font-modern-heading text-[#1A2B4A] font-bold uppercase tracking-[0.2em] block mb-4 sm:mb-6">EVENT DETAILS & FAQ</span>
          <InteractiveFaqAccordion
            themeId="modern"
            accentColor="#C9A961"
            borderColor="border-[#5B7C99]/30"
            textColor="text-[#1A2B4A]"
            headingFont="font-modern-heading"
          />
        </FadeInSection>

      </div>

      {/* Modern Footer */}
      <footer className="bg-[#1A2B4A] text-[#FAF8F3]/60 py-12 sm:py-16 text-center border-t border-[#C9A961]/40 font-modern-heading text-xs mt-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
          <span className="text-xs text-[#C9A961] uppercase tracking-[0.2em] font-bold">PAM'S EVENTS</span>
          <p className="leading-relaxed text-[11px] text-[#FAF8F3]/80 font-light">Modern event platform for seamless invitations and guest management.</p>
          <div className="h-[0.5px] bg-[#C9A961]/30 my-4 sm:my-6" />
          <span className="text-[10px] text-[#C9A961] tracking-widest font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   4. RUSTIC WARMTH THEME (Handcrafted journal & green)
   ========================================== */
const RusticTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -75]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -110]);

  return (
    <div className="flex-1 flex flex-col font-rustic-body bg-[#FFF8E7] text-[#3E3E3E] selection:bg-[#5C4033] selection:text-[#FFF8E7] relative overflow-hidden">
      <FallingLeavesBG />

      {/* Handcrafted Golden-Hour Hero Section */}
      <section className="relative py-16 sm:py-24 md:py-28 px-4 sm:px-6 text-center border-b border-[#D4C4B0]/60 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 items-center">
          <div className="flex items-center gap-2 text-[#9CAF88] font-bold text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase font-sans">
            <Heart className="w-3.5 h-3.5 text-[#C97064] fill-current" />
            <span>YOU'RE INVITED</span>
            <Heart className="w-3.5 h-3.5 text-[#C97064] fill-current" />
          </div>

          <InteractiveEnvelopeHero
            title="Warm Invitation Note"
            subtitle={`Join us for a cozy gathering with ${event.brideName || event.birthdayPerson || 'us'}.`}
            themeId="rustic"
            accentColor="#5C4033"
          />
          
          {/* Deckled Edge Card Mockup with Eucalyptus Garland Frame (4.png) */}
          <div className="p-5 sm:p-8 md:p-12 border border-[#D4C4B0] rounded-2xl bg-[#FAF6F0] shadow-md max-w-2xl w-full flex flex-col gap-4 sm:gap-6 relative overflow-hidden">
            <div className="absolute inset-1.5 sm:inset-2 border border-dashed border-[#D4C4B0]/60 rounded-xl pointer-events-none" />
            
            {/* Real Eucalyptus Garland Arch Overlay */}
            <img src="/assets/invitation/botanical-eucalyptus-garland.png" className="absolute top-0 left-0 right-0 w-full h-auto max-h-24 object-cover opacity-25 mix-blend-multiply pointer-events-none" alt="Botanical Garland" />
            <img src="/assets/invitation/sage-botanical-leaves.png" className="absolute bottom-0 right-0 w-32 h-32 object-contain opacity-20 mix-blend-multiply pointer-events-none" alt="Sage Leaves" />

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-rustic-heading text-[#5C4033] tracking-tight leading-tight sm:leading-none font-bold break-words relative z-10 pt-4">
              {event.type === 'wedding' ? (
                <span>
                  {event.brideName} <span className="text-[#C97064] font-light italic font-serif">&</span> {event.groomName}
                </span>
              ) : (
                <span>{event.birthdayPerson}</span>
              )}
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-[#9CAF88]">
              <Heart className="w-4 h-4 fill-current text-[#C97064]" />
            </div>
            
            <p className="text-xs sm:text-sm md:text-base text-[#3E3E3E] leading-relaxed italic max-w-lg mx-auto font-light break-words">
              "{event.description}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs font-semibold text-[#5C4033] font-sans tracking-wide w-full max-w-md sm:max-w-none">
            <div className="bg-[#FAF6F0] border border-[#D4C4B0]/40 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-sm w-full sm:w-auto flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-[#9CAF88]" />
              <span>Date: {formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="bg-[#FAF6F0] border border-[#D4C4B0]/40 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-sm w-full sm:w-auto flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#9CAF88]" />
              <span>Time: {event.time} PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Rustic barn style) */}
      <FadeInSection className="bg-[#9CAF88]/10 border-b border-[#D4C4B0]/50 py-6 sm:py-8 px-4 text-center relative overflow-hidden">
        <span className="text-[9px] sm:text-[10px] tracking-widest text-[#5C4033] uppercase font-bold block mb-2 font-sans relative z-10">Time Remaining</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-rustic-heading font-bold" themeColor="#5C4033" />
      </FadeInSection>

      {/* Rustic Journal Story */}
      <FadeInSection className="py-16 sm:py-24 bg-white relative overflow-hidden">
        {/* Parallax Hanging Botanical Garland */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-10 -left-10 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-10" 
          alt="Botanical Garland" 
        />
        {/* Parallax Sage Leaves Peeking Right */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/sage-botanical-leaves.png" 
          className="absolute -bottom-10 -right-10 w-40 sm:w-56 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
          alt="Sage Leaves" 
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-4 sm:gap-6 items-center relative z-20">
          <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] sm:tracking-[0.25em] text-[#C97064] font-bold uppercase">OUR STORY</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide break-words">Welcome To Our Event</h2>
          <div className="w-16 h-0.5 bg-[#9CAF88]" />
          <p className="text-xs sm:text-sm leading-relaxed text-[#3E3E3E] italic max-w-xl font-light break-words">
            "We are so excited to gather our family and friends to celebrate this special day with us. Join us for good food, music, and great company."
          </p>
          <div className="flex items-center gap-2 text-[#9CAF88] mt-2">
            <Heart className="w-3.5 h-3.5 fill-current text-[#C97064]" />
          </div>
        </div>
      </FadeInSection>

      {/* Interactive Timeline */}
      {showProgram && (
        <FadeInSection className="py-16 sm:py-24 bg-[#FFF8E7] border-y border-[#D4C4B0]/40 relative overflow-hidden">
          {/* Parallax Hanging Lavender Canopy */}
          <motion.img 
            style={{ y: parallaxYReverse }}
            src="/assets/invitation/hanging-lavender-canopy.png" 
            className="absolute -top-8 left-0 right-0 w-full h-auto max-h-36 object-cover opacity-25 mix-blend-multiply pointer-events-none z-10" 
            alt="Lavender Canopy" 
          />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-20">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">SCHEDULE</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide break-words">EVENT TIMELINE</h2>
            </div>

            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="rustic"
              accentColor="#5C4033"
              lineColor="border-[#9CAF88]/40"
              headingFont="font-rustic-heading"
            />
          </div>
        </FadeInSection>
      )}

      {/* Cozy snap lookbook gallery */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <FadeInSection className="py-16 sm:py-24 bg-white relative overflow-hidden">
          {/* Parallax Rose Floral Accent */}
          <motion.img 
            style={{ y: parallaxYFast }}
            src="/assets/invitation/rose-floral-arch.png" 
            className="absolute -bottom-10 -left-10 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
            alt="Rose Accent" 
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-20">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">PHOTOS</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase mb-10 sm:mb-16 break-words">PHOTO GALLERY</h2>
            
            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="rustic"
              cardBorderClass="border-[#D4C4B0]/40"
              cardBgClass="bg-[#FAF6F0]"
            />
          </div>
        </FadeInSection>
      )}

      {/* Venue Section (Rustic Organic) */}
      <FadeInSection className="py-16 sm:py-24 bg-white border-t border-[#D4C4B0]/40 text-left relative overflow-hidden">
        {/* Parallax Garland Top */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-12 -right-12 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-10" 
          alt="Eucalyptus Garland" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center relative z-20">
          <div className="flex flex-col gap-4 sm:gap-6">
            <span className="text-[9px] sm:text-[10px] tracking-widest text-[#9CAF88] font-bold block uppercase font-sans">Venue & Location</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase leading-tight break-words">{getVenueFirstLine(event.venue, event.venueName)}</h2>
            <div className="w-12 h-0.5 bg-[#C97064]" />
            
            <p className="text-xs text-[#3E3E3E] leading-relaxed font-light tracking-wide break-words">
              We look forward to seeing you here. Tap below to copy the address or view map directions.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 text-xs text-[#3E3E3E] border-y border-[#D4C4B0]/30 py-4 sm:py-6 my-1 sm:my-2 font-sans">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C97064] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#9CAF88] uppercase tracking-wider font-bold block">Venue Location</span>
                  <span className="break-words">{event.venue || 'Venue TBD'}</span>
                </div>
              </div>

              {event.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#C97064] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#9CAF88] uppercase tracking-wider font-bold block">Date & Time</span>
                    <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                  </div>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-[#9CAF88] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#9CAF88] uppercase tracking-wider font-bold block">Dress Code</span>
                    <span className="font-bold uppercase tracking-wider text-[11px] text-[#5C4033]">{event.dressCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C97064] hover:bg-[#5C4033] text-white rounded-xl text-xs font-bold font-sans tracking-wider uppercase shadow-md transition-colors"
              >
                <MapIcon className="w-4 h-4 text-amber-100 shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#9CAF88] text-[#5C4033] hover:bg-[#9CAF88]/10 rounded-xl text-xs font-bold font-sans tracking-wider uppercase transition-colors"
                iconColor="text-[#9CAF88]"
              />
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="border border-[#D4C4B0]/60 p-2 bg-[#FAF6F0] rounded-2xl shadow-lg h-[260px] sm:h-[300px] overflow-hidden"
          >
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-xl" />
          </motion.div>
        </div>
      </FadeInSection>

      {/* Registry Vouchers */}
      <FadeInSection className="py-16 sm:py-24 bg-[#FFF8E7] border-t border-[#D4C4B0]/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#9CAF88] uppercase font-bold block mb-2 font-sans">REGISTRY</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase break-words">GIFT REGISTRY</h2>
          </div>

          <InteractiveGiftRegistry
            event={event}
            themeId="rustic"
            cardBgClass="bg-[#FAF6F0]"
            cardBorderClass="border-[#D4C4B0]/40 hover:border-[#9CAF88]"
            titleColorClass="text-[#5C4033]"
            descColorClass="text-[#3E3E3E] font-light"
            ctaColorClass="text-[#C97064] hover:text-[#5C4033]"
            headingFont="font-rustic-heading"
          />
        </div>
      </FadeInSection>

      {/* RSVP Postcard */}
      <FadeInSection id="rsvp-anchor" className="py-16 sm:py-24 bg-[#FFF8E7] border-t border-[#D4C4B0]/30">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2 font-sans">RSVP</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase break-words">CONFIRM ATTENDANCE</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="rustic"
            theme={theme}
          />
        </div>
      </FadeInSection>

      {/* Guestbook display */}
      <FadeInSection className="py-16 sm:py-24 bg-white border-t border-[#D4C4B0]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">GUESTBOOK</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide break-words">GUESTBOOK MESSAGES</h2>
            <div className="w-8 h-[1px] bg-[#C97064] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs text-stone-400 py-6 font-sans italic">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-5 sm:p-8 bg-[#FAF6F0] rounded-xl border border-[#D4C4B0]/40 flex flex-col justify-between min-h-[10rem] h-auto hover:border-[#9CAF88] transition-colors duration-300 shadow-sm relative">
                  <div className="absolute top-0 right-6 sm:right-8 w-4 h-8 bg-[#9CAF88]/10 border-b border-x border-[#9CAF88]/20 rounded-b-md" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-[#D4C4B0]/50 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3E3E3E] italic leading-relaxed font-light font-rustic-heading break-words">"{entry.message}"</p>
                  <div className="border-t border-[#D4C4B0]/20 pt-3 sm:pt-4 mt-3 sm:mt-4 flex justify-between items-center text-[10px] font-sans">
                    <span className="font-bold uppercase tracking-wider text-[#5C4033] truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-[#9CAF88] font-mono shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeInSection>

      {/* Interactive FAQ Accordion */}
      <FadeInSection className="py-16 sm:py-20 bg-[#FFF8E7] border-t border-[#D4C4B0]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">DETAILS</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase mb-8 sm:mb-12 break-words">EVENT DETAILS & FAQ</h2>
          
          <InteractiveFaqAccordion
            themeId="rustic"
            accentColor="#5C4033"
            borderColor="border-[#D4C4B0]/40"
            textColor="text-[#5C4033]"
            headingFont="font-rustic-heading"
          />
        </div>
      </FadeInSection>

      {/* Rustic Footer */}
      <footer className="bg-[#5C4033] text-[#FFF8E7]/85 py-12 sm:py-16 text-center border-t-2 border-[#D4C4B0] text-xs">
        <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-4 font-sans">
          <span className="text-xs text-[#9CAF88] font-bold uppercase tracking-widest">PAM'S EVENTS</span>
          <p className="leading-relaxed text-[11px] text-[#FFF8E7]/70 font-light">Warm event platform for seamless invitations and guest management.</p>
          <div className="h-[0.5px] bg-[#FFF8E7]/20 my-4 sm:my-6" />
          <span className="text-[10px] text-[#9CAF88] tracking-widest font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   5. FLORAL ROSE THEME (Romantic pastels & cursive)
   ========================================== */
const FloralTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -35]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div className="flex-1 flex flex-col font-floral-body bg-[#FFF9F5] text-[#3D5A3D] selection:bg-[#D4A5A5] selection:text-white relative overflow-hidden">
      <FloatingPetalsBG />

      {/* Whimsical Romantic Arch Hero */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 text-center border-b border-[#F4E4E6] bg-[#FFF9F5] overflow-hidden">
        {/* Hanging Lavender & Rose Canopy Overlay */}
        <img src="/assets/invitation/hanging-lavender-canopy.png" className="absolute top-0 left-0 right-0 w-full h-auto max-h-40 object-cover opacity-35 mix-blend-multiply pointer-events-none z-0" alt="Hanging Lavender Canopy" />

        {/* Subtle romantic organic backdrop graphics */}
        <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-[#F4E4E6]/45 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#A8B5A0]/20 blur-3xl -z-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 items-center pt-8">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-sans tracking-[0.2em] sm:tracking-[0.25em] font-bold text-[#A8B5A0] uppercase">
            <Heart className="w-3.5 h-3.5 text-[#C97064] fill-current" />
            <span>YOU ARE CORDIALLY INVITED</span>
            <Heart className="w-3.5 h-3.5 text-[#C97064] fill-current" />
          </div>

          <InteractiveEnvelopeHero
            title="A Floral Invitation"
            subtitle={`Together with their families, ${event.brideName || event.birthdayPerson || 'we'} invite you.`}
            themeId="floral"
            accentColor="#C97064"
          />
          
          {/* Portrait Curved Arch Frame with Dusty Rose Arch Overlay */}
          <div className="relative my-2 sm:my-4">
            <img src="/assets/invitation/rose-floral-arch.png" className="absolute -top-12 -left-12 -right-12 w-[calc(100%+6rem)] max-w-none h-auto object-contain pointer-events-none z-20 mix-blend-multiply opacity-90" alt="Rose Floral Arch" />
            
            <div className="w-48 sm:w-60 h-64 sm:h-80 rounded-t-full border-4 border-[#F4E4E6] p-2 bg-white shadow-xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-500 relative z-10">
              <img src={event.coverImage} className="w-full h-full object-cover rounded-t-full" alt="Lush Romantic Arch Portrait" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-7xl text-[#3D5A3D] font-floral-heading font-medium tracking-tight mt-2 sm:mt-3 break-words max-w-full">
            {event.type === 'wedding' ? (
              <span className="flex flex-col items-center gap-1">
                <span className="text-2xl sm:text-4xl md:text-5xl font-light font-sans text-[#D4A5A5] tracking-wide break-words">The Wedding of</span>
                <span className="italic font-floral-heading break-words">{event.brideName}</span>
                <span className="font-floral-script text-4xl sm:text-5xl md:text-6xl text-[#C97064] my-1 font-bold">&</span>
                <span className="italic font-floral-heading break-words">{event.groomName}</span>
              </span>
            ) : (
              <span className="italic font-floral-heading break-words">{event.birthdayPerson}</span>
            )}
          </h1>

          <div className="w-20 sm:w-24 h-[1px] bg-[#D4A5A5] my-1 sm:my-2" />

          <p className="text-xs sm:text-sm md:text-base font-floral-heading italic text-[#D4A5A5] max-w-xl mx-auto leading-relaxed px-2 sm:px-4 break-words">
            "{event.description}"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs text-[#3D5A3D] tracking-wider font-semibold font-sans w-full max-w-md sm:max-w-none">
            <div className="bg-[#F4E4E6]/40 border border-[#D4A5A5]/30 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-sm hover:bg-white transition-colors duration-300 w-full sm:w-auto flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-[#C97064]" />
              <span>Date: {formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="bg-[#F4E4E6]/40 border border-[#D4A5A5]/30 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-sm hover:bg-white transition-colors duration-300 w-full sm:w-auto flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#C97064]" />
              <span>Time: {event.time} PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Romantic floral bloom circles) */}
      <FadeInSection className="bg-[#F4E4E6]/30 border-b border-[#F4E4E6]/60 py-6 sm:py-8 px-4 text-center relative overflow-hidden">
        <span className="text-[9px] sm:text-[10px] tracking-widest text-[#D4A5A5] uppercase font-bold block mb-2 font-sans relative z-10">Time Remaining</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-floral-heading italic" themeColor="#D4A5A5" />
      </FadeInSection>

      {/* Story (Lush watercolored journal entry) */}
      <FadeInSection className="py-16 sm:py-24 bg-white relative overflow-hidden">
        {/* Parallax Rose Blossom Arch Accent */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/rose-floral-arch.png" 
          className="absolute -top-12 -right-12 w-56 sm:w-80 h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-10" 
          alt="Rose Arch Accent" 
        />
        {/* Parallax Sage Leaf Spray */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/sage-botanical-leaves.png" 
          className="absolute -bottom-10 -left-10 w-44 sm:w-60 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
          alt="Sage Spray" 
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-4 sm:gap-6 items-center relative z-20">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4A5A5] fill-[#F4E4E6] animate-pulse" />
          <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase">OUR STORY</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic break-words">Welcome To Our Celebration</h2>
          <div className="w-16 h-0.5 bg-[#F4E4E6]" />
          <p className="text-xs sm:text-sm md:text-base leading-relaxed text-[#3D5A3D]/90 italic max-w-lg mt-1 sm:mt-2 font-light break-words">
            "We are delighted to invite you to celebrate this milestone with us. Thank you for being a wonderful part of our lives."
          </p>
          <span className="font-floral-script text-3xl sm:text-4xl text-[#C97064] break-words">Better Together</span>
        </div>
      </FadeInSection>

      {/* Itinerary (Botanical Leaf timeline nodes) */}
      {showProgram && (
        <FadeInSection className="py-16 sm:py-24 bg-[#FFF9F5] border-y border-[#F4E4E6] text-left relative overflow-hidden">
          {/* Parallax Hanging Lavender Canopy */}
          <motion.img 
            style={{ y: parallaxYReverse }}
            src="/assets/invitation/hanging-lavender-canopy.png" 
            className="absolute -top-10 left-0 right-0 w-full h-auto max-h-40 object-cover opacity-30 mix-blend-multiply pointer-events-none z-10" 
            alt="Lavender Canopy" 
          />

          <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-20">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">SCHEDULE</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic break-words">Event Timeline</h2>
            </div>

            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="floral"
              accentColor="#C97064"
              lineColor="border-[#F4E4E6]"
              headingFont="font-floral-heading"
            />
          </div>
        </FadeInSection>
      )}

      {/* Gallery (Botanical portraits) */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <FadeInSection className="py-16 sm:py-24 bg-white relative overflow-hidden">
          {/* Parallax White Lace Ribbon Accent */}
          <motion.img 
            style={{ y: parallaxYFast }}
            src="/assets/invitation/white-lace-ribbon.png" 
            className="absolute -bottom-10 right-0 w-64 sm:w-96 h-auto object-contain pointer-events-none opacity-25 mix-blend-multiply z-10" 
            alt="White Lace Accent" 
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-20">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">PHOTOS</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic mb-10 sm:mb-16 break-words">Photo Gallery</h2>
            
            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="floral"
              cardBorderClass="border-[#F4E4E6]"
              cardBgClass="bg-white"
            />
          </div>
        </FadeInSection>
      )}

      {/* Venue Section (Floral Botanical) */}
      <FadeInSection className="py-16 sm:py-24 bg-white border-t border-[#F4E4E6] relative overflow-hidden">
        {/* Parallax Eucalyptus Garland Top */}
        <motion.img 
          style={{ y: parallaxYSlow }}
          src="/assets/invitation/botanical-eucalyptus-garland.png" 
          className="absolute -top-12 -left-12 w-52 sm:w-72 h-auto object-contain pointer-events-none opacity-30 mix-blend-multiply z-10" 
          alt="Eucalyptus Garland" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center relative z-20">
          <div className="text-left flex flex-col gap-4 sm:gap-6">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-widest text-[#A8B5A0] font-bold block uppercase">Venue & Location</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic leading-tight break-words">{getVenueFirstLine(event.venue, event.venueName)}</h2>
            <div className="w-12 h-0.5 bg-[#D4A5A5]" />
            
            <p className="text-xs text-[#3D5A3D]/90 leading-relaxed font-light break-words">
              We look forward to seeing you here. Tap below to copy the address or open location directions in Google Maps.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 text-xs text-[#3D5A3D]/90 border-y border-[#F4E4E6]/80 py-4 sm:py-6 my-1 sm:my-2 font-sans">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C97064] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#A8B5A0] uppercase tracking-wider font-bold block">Venue Location</span>
                  <span className="break-words">{event.venue || 'Venue TBD'}</span>
                </div>
              </div>

              {event.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#C97064] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#A8B5A0] uppercase tracking-wider font-bold block">Date & Time</span>
                    <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                  </div>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-[#A8B5A0] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#A8B5A0] uppercase tracking-wider font-bold block">Dress Code</span>
                    <span className="uppercase tracking-wider font-bold text-[11px] text-[#C97064]">{event.dressCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C97064] hover:bg-[#3D5A3D] text-white rounded-full text-xs font-bold tracking-wider font-sans uppercase shadow-md transition-all"
              >
                <MapIcon className="w-4 h-4 text-pink-100 shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#D4A5A5] text-[#3D5A3D] hover:bg-[#F4E4E6]/50 rounded-full text-xs font-bold tracking-wider font-sans uppercase transition-all"
                iconColor="text-[#C97064]"
              />
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="border-2 border-[#F4E4E6] p-2 bg-pink-50/30 rounded-3xl shadow-lg h-[260px] sm:h-[300px] overflow-hidden"
          >
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-2xl" />
          </motion.div>
        </div>
      </FadeInSection>

      {/* Gift Registry */}
      <FadeInSection className="py-16 sm:py-24 bg-[#FFF9F5] border-t border-[#F4E4E6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#A8B5A0] uppercase font-bold block mb-2 font-sans font-semibold">REGISTRY</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic break-words">Gift Registry</h2>
          </div>

          <InteractiveGiftRegistry
            event={event}
            themeId="floral"
            cardBgClass="bg-white"
            cardBorderClass="border-[#F4E4E6] rounded-3xl"
            titleColorClass="text-[#3D5A3D]"
            descColorClass="text-[#3D5A3D]/80 font-light italic"
            ctaColorClass="text-[#C97064] hover:text-[#3D5A3D]"
            headingFont="font-floral-heading"
          />
        </div>
      </FadeInSection>

      {/* RSVP Section (Couture wedding postcard) */}
      <FadeInSection id="rsvp-anchor" className="py-16 sm:py-24 bg-[#FFF9F5] border-t border-[#F4E4E6]/80">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2 font-sans">RSVP</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic break-words">Confirm Attendance</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="floral"
            theme={theme}
          />
        </div>
      </FadeInSection>

      {/* Guestbook display */}
      <FadeInSection className="py-16 sm:py-24 bg-white border-t border-[#F4E4E6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">GUESTBOOK</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic break-words">Guestbook Messages</h2>
            <div className="w-8 h-[1px] bg-[#C97064] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs text-[#3D5A3D]/60 py-6 font-sans italic">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-5 sm:p-8 bg-[#FFF9F5] rounded-3xl border border-[#F4E4E6] flex flex-col justify-between min-h-[10rem] h-auto hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-[#F4E4E6]/25 rounded-bl-full pointer-events-none" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-[#F4E4E6] max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3D5A3D]/90 italic leading-relaxed font-light font-floral-heading break-words">"{entry.message}"</p>
                  <div className="border-t border-[#F4E4E6] pt-3 sm:pt-4 mt-3 sm:mt-4 flex justify-between items-center text-[10px] font-sans font-semibold">
                    <span className="uppercase tracking-wider text-[#3D5A3D] truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-[#A8B5A0] font-mono shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeInSection>

      {/* Interactive FAQ Accordion */}
      <FadeInSection className="py-16 sm:py-20 bg-[#FFF9F5] border-t border-[#F4E4E6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">GUIDELINES</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-floral-heading text-[#3D5A3D] italic mb-8 sm:mb-12 break-words">Event Details & FAQ</h2>
          
          <InteractiveFaqAccordion
            themeId="floral"
            accentColor="#C97064"
            borderColor="border-[#F4E4E6]"
            textColor="text-[#3D5A3D]"
            headingFont="font-floral-heading"
          />
        </div>
      </FadeInSection>

      {/* Floral Footer */}
      <footer className="bg-[#3D5A3D] text-[#FFF9F5]/90 py-12 sm:py-16 text-center border-t border-[#F4E4E6] text-xs">
        <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-4 font-sans">
          <span className="text-xs text-[#A8B5A0] tracking-widest font-bold uppercase">PAM'S EVENTS</span>
          <p className="leading-relaxed text-[11px] text-[#FFF9F5]/70 font-light italic">Modern event platform for seamless invitations and guest management.</p>
          <div className="h-[0.5px] bg-[#FFF9F5]/20 my-4 sm:my-6" />
          <span className="text-[10px] text-[#D4A5A5] tracking-widest font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   6. TRADITIONAL BROWN THEME (Heritage double-bordered)
   ========================================== */
const TraditionalTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="flex-1 flex flex-col font-serif bg-amber-50/20 text-amber-950 relative overflow-hidden">
      <GoldShimmerParticles />

      {/* Heritage Letterpress Hero */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 text-center border-b-4 border-double border-amber-900/40">
        <div className="absolute inset-0 z-0">
          <img src={event.coverImage} className="w-full h-full object-cover opacity-10 filter sepia-[30%]" alt="Heritage BG" />
          <div className="absolute inset-0 bg-amber-50/5" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6 items-center">
          <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] font-serif font-bold text-amber-800 uppercase">YOU ARE CORDIALLY INVITED</span>

          <InteractiveEnvelopeHero
            title="Heritage Announcement"
            subtitle={`Formal invitation to honor ${event.brideName || event.birthdayPerson || 'our event'}.`}
            themeId="traditional"
            accentColor="#78350f"
          />
          
          {/* Print Stock Card with Terracotta Filigree Frame */}
          <div className="p-5 sm:p-8 border-4 border-double border-amber-900/30 bg-white shadow-md w-full flex flex-col gap-4 relative overflow-hidden">
            {/* Real Terracotta Filigree Arch Background Overlay */}
            <img src="/assets/invitation/terracotta-arch-frame.png" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply pointer-events-none" alt="Terracotta Arch Frame" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-amber-800 text-xs tracking-widest uppercase font-serif block mb-1">Heritage Crest</span>
              
              {/* Vertical Gold Vine Divider */}
              <img src="/assets/invitation/gold-vine-ornament.png" className="w-6 h-12 object-contain opacity-60 my-1" alt="Gold Vine Ornament" />

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-amber-950 uppercase leading-tight sm:leading-none break-words my-2">
                {event.type === 'wedding' ? `${event.brideName} & ${event.groomName}` : event.birthdayPerson}
              </h1>

              <p className="text-xs text-amber-850 leading-relaxed max-w-md mx-auto italic mt-2 break-words">
                "{event.description}"
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4 text-xs font-semibold text-amber-900 w-full max-w-md sm:max-w-none">
            <div className="bg-white border border-amber-200 px-4 py-2.5 w-full sm:w-auto flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-amber-800" />
              <span>Date: {formatDateSafe(event.date)}</span>
            </div>
            <div className="bg-white border border-amber-200 px-4 py-2.5 w-full sm:w-auto flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-800" />
              <span>Time: {event.time} PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Traditional clock) */}
      <FadeInSection className="bg-amber-100/40 border-b-2 border-double border-amber-900/30 py-6 px-4 text-center relative overflow-hidden">
        <span className="text-[9px] tracking-widest text-amber-900 uppercase font-bold block mb-2 relative z-10">Time Remaining</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-serif font-bold" themeColor="#78350f" />
      </FadeInSection>

      {/* Traditional Letter Announcement */}
      <FadeInSection className="py-14 sm:py-20 bg-white text-center relative overflow-hidden">
        {/* Parallax Terracotta Filigree Left Accent */}
        <motion.img 
          style={{ y: parallaxYMedium }}
          src="/assets/invitation/terracotta-arch-frame.png" 
          className="absolute -top-10 -left-10 w-48 sm:w-64 h-auto object-contain pointer-events-none opacity-20 mix-blend-multiply z-10" 
          alt="Terracotta Filigree" 
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 relative z-20">
          <div className="flex flex-col gap-4 border border-amber-200 p-6 sm:p-10 bg-white relative">
            <h2 className="text-base sm:text-xl font-bold text-amber-950 uppercase break-words">Dear Friends and Family</h2>
            <p className="text-xs text-amber-850 leading-relaxed italic break-words">
              "We take great joy in announcing our upcoming event. We hope you will join us in celebrating this special occasion together."
            </p>
            <div className="text-amber-800 text-xs mt-2 font-serif">Welcome</div>
          </div>
        </div>
      </FadeInSection>

      {/* Double column timeline */}
      {showProgram && (
        <FadeInSection className="py-14 sm:py-20 bg-amber-50/10 border-y border-amber-200 text-left relative overflow-hidden">
          {/* Parallax Gold Vine Accent */}
          <motion.img 
            style={{ y: parallaxYReverse }}
            src="/assets/invitation/gold-vine-ornament.png" 
            className="absolute top-4 right-4 w-12 sm:w-16 h-auto object-contain pointer-events-none opacity-40 mix-blend-multiply z-10" 
            alt="Gold Vine" 
          />

          <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-20">
            <h2 className="text-lg sm:text-2xl font-bold text-amber-950 text-center uppercase tracking-wide mb-8 sm:mb-12 break-words">Event Schedule</h2>
            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="traditional"
              accentColor="#78350f"
              lineColor="border-amber-200"
              headingFont="font-serif"
            />
          </div>
        </FadeInSection>
      )}

      {/* Gallery */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <FadeInSection className="py-14 sm:py-20 bg-white relative overflow-hidden">
          {/* Parallax Ribbon Footer Accent */}
          <motion.img 
            style={{ y: parallaxYFast }}
            src="/assets/invitation/long-golden-ribbon.png" 
            className="absolute -bottom-6 left-0 right-0 w-full h-auto max-h-20 object-contain pointer-events-none opacity-20 mix-blend-multiply z-10" 
            alt="Golden Ribbon Accent" 
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-20">
            <h2 className="text-lg sm:text-2xl font-bold text-amber-950 uppercase tracking-wider mb-8 sm:mb-12 break-words">Photo Gallery</h2>
            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="traditional"
              cardBorderClass="border-amber-200"
              cardBgClass="bg-white"
            />
          </div>
        </FadeInSection>
      )}

      {/* Venue Section (Traditional Heritage) */}
      <FadeInSection className="py-14 sm:py-20 bg-white border-t border-amber-200 text-left relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-20">
          <div>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-amber-800 font-bold block mb-2 uppercase">Venue & Location</span>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-950 uppercase mb-3 break-words">{getVenueFirstLine(event.venue, event.venueName)}</h2>
            
            <p className="text-xs text-amber-900/80 leading-relaxed mb-4 font-serif break-words">
              We look forward to seeing you here. See venue location details and directions below.
            </p>

            <div className="flex flex-col gap-3 text-xs text-amber-900 mb-6 font-serif border-y border-amber-200/60 py-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-amber-800 uppercase tracking-widest font-bold block">Location</span>
                  <span className="break-words">{event.venue || 'Venue TBD'}</span>
                </div>
              </div>

              {event.date && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-amber-800 uppercase tracking-widest font-bold block">Date & Time</span>
                    <span>{formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</span>
                  </div>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-start gap-2.5">
                  <Tag className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-amber-800 uppercase tracking-widest font-bold block">Dress Code</span>
                    <span className="text-amber-950 font-semibold">{event.dressCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-950 hover:bg-amber-900 text-white text-xs font-serif uppercase tracking-widest shadow-sm"
              >
                <MapIcon className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Open in Google Maps</span>
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-800/40 text-amber-950 hover:bg-amber-100/50 text-xs font-serif uppercase tracking-widest"
                iconColor="text-amber-800"
              />
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="border-4 border-double border-amber-900/30 p-2 bg-white h-[240px] sm:h-[270px] overflow-hidden"
          >
            <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
          </motion.div>
        </div>
      </FadeInSection>

      {/* Gift Registry */}
      <FadeInSection className="py-14 sm:py-20 bg-amber-50/10 border-t border-amber-200 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-20">
          <div className="mb-10 sm:mb-14">
            <span className="text-[9px] sm:text-[10px] tracking-widest text-amber-800 font-bold block mb-2 uppercase font-serif">REGISTRY</span>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-950 uppercase tracking-wide break-words font-serif">GIFT REGISTRY</h2>
            <div className="w-12 h-0.5 bg-amber-800/40 mx-auto mt-2" />
          </div>

          <InteractiveGiftRegistry
            event={event}
            themeId="traditional"
            cardBgClass="bg-white"
            cardBorderClass="border-2 border-double border-amber-900/30 hover:border-amber-800"
            titleColorClass="text-amber-950 font-serif"
            descColorClass="text-amber-900/80 font-serif"
            ctaColorClass="text-amber-900 hover:text-amber-700"
            headingFont="font-serif font-bold"
          />
        </div>
      </FadeInSection>

      {/* RSVP Section */}
      <FadeInSection id="rsvp-anchor" className="py-14 sm:py-20 bg-amber-50/20 border-t border-amber-200 relative overflow-hidden">
        <div className="max-w-lg mx-auto px-4 sm:px-6 relative z-20">
          <h2 className="text-lg sm:text-2xl font-bold text-amber-950 text-center uppercase mb-8 sm:mb-10 break-words">CONFIRM ATTENDANCE</h2>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="traditional"
            theme={theme}
          />
        </div>
      </FadeInSection>

      {/* Guestbook signature register */}
      <FadeInSection className="py-14 sm:py-20 bg-white border-t border-amber-200 relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-left relative z-20">
          <h2 className="text-lg sm:text-2xl font-bold text-amber-950 text-center uppercase tracking-wide mb-8 sm:mb-12 break-words">Guestbook Messages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-center text-xs text-amber-800/60 font-serif italic">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-4 sm:p-6 bg-white border-2 border-double border-amber-900/20 flex flex-col justify-between min-h-[10rem] h-auto">
                  {entry.imageUrl && (
                    <div className="mb-3 border border-amber-900/30 p-1 bg-white max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover filter sepia-[15%]" />
                    </div>
                  )}
                  <p className="text-xs text-amber-850 italic break-words">"{entry.message}"</p>
                  <div className="border-t border-amber-100 pt-3 mt-4 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-amber-900 truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="text-amber-800/60 font-mono shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeInSection>

      {/* Interactive FAQ Accordion */}
      <FadeInSection className="py-14 sm:py-20 bg-amber-50/20 border-t border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[9px] tracking-widest text-amber-800 uppercase font-bold block mb-2">INFORMATION</span>
          <h2 className="text-lg sm:text-2xl font-bold text-amber-950 uppercase tracking-wide mb-8 sm:mb-12 break-words">EVENT DETAILS & FAQ</h2>
          
          <InteractiveFaqAccordion
            themeId="traditional"
            accentColor="#78350f"
            borderColor="border-amber-200"
            textColor="text-amber-950"
            headingFont="font-serif"
          />
        </div>
      </FadeInSection>

      {/* Traditional Footer */}
      <footer className="bg-amber-950 text-amber-200/60 py-10 sm:py-12 text-center border-t border-amber-900/60 text-xs">
        <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-2 font-serif">
          <span className="text-xs text-amber-200 uppercase tracking-widest font-bold">PAM'S EVENTS</span>
          <p className="leading-normal text-[10px] text-amber-400/40">Event invitation and guest management platform.</p>
          <div className="h-[1px] bg-amber-900/60 my-4" />
          <span className="text-[9px] text-amber-400 tracking-wider font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   7. ULTRA MINIMAL THEME (Stark typewriter monospace)
   ========================================== */
const MinimalTheme: React.FC<ThemeRendererProps> = ({
  event, guest, guestbook, rsvpStatus, setRsvpStatus, mealOption, setMealOption,
  companions, setCompanions, guestbookMsg, setGuestbookMsg, isSubmittingRsvp,
  rsvpSubmitted, setRsvpSubmitted, handleRsvpSubmit, onRsvpSuccess, timelineSteps, registryItems, theme
}) => {
  const isDeadlinePassed = event.rsvpDeadline ? isRsvpDeadlinePassed(event.rsvpDeadline) : false;
  const showProgram = event.type !== 'wedding' || isProgramRevealed(event.date);

  const { scrollYProgress } = useScroll();
  const parallaxYSlow = useTransform(scrollYProgress, [0, 1], [0, -25]);
  const parallaxYMedium = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const parallaxYReverse = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const parallaxYFast = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div className="flex-1 flex flex-col font-mono bg-white text-black text-left select-none p-4 sm:p-8 md:p-12 relative overflow-hidden">
      <MinimalArchitecturalLines />

      {/* Brutalist Raw Stack */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 sm:gap-12 font-mono text-xs relative z-10">
        
        {/* Hero Section */}
        <header className="border-b border-black pb-8 sm:pb-12 flex flex-col gap-3 sm:gap-4 relative">
          {/* Subtle Architectural Grid Overlay with Parallax */}
          <motion.img 
            style={{ y: parallaxYSlow }}
            src="/assets/invitation/geometric-gold-frame.png" 
            className="absolute -top-10 right-0 w-64 h-64 object-cover opacity-10 filter grayscale pointer-events-none" 
            alt="Architectural Grid Accent" 
          />

          <span className="text-[9px] text-stone-400 uppercase tracking-widest break-all relative z-10">YOU ARE INVITED</span>

          <InteractiveEnvelopeHero
            title="INVITATION_RECORD"
            subtitle={`ENTRY AUTHORIZED FOR: ${event.brideName || event.birthdayPerson || 'GUEST'}`}
            themeId="minimal"
            accentColor="#000000"
          />

          <h1 className="text-2xl sm:text-5xl md:text-6xl uppercase tracking-widest font-bold text-black leading-tight sm:leading-none my-2 sm:my-4 break-words relative z-10">
            {event.type === 'wedding' ? `${event.brideName} & ${event.groomName}` : event.birthdayPerson}
          </h1>
          <p className="leading-relaxed text-black max-w-xl border-l-2 border-black pl-3 sm:pl-4 break-words relative z-10">
            {event.description}
          </p>
          <div className="flex flex-col gap-1 text-[10px] mt-2 text-stone-500 font-mono relative z-10">
            <div>DATE: {formatDateSafe(event.date)}</div>
            <div>TIME: {event.time} PM</div>
          </div>
        </header>

        {/* Countdown Ticker */}
        <FadeInSection className="border-b border-black pb-8 sm:pb-12 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-3">TIME REMAINING</span>
          <div className="flex justify-start overflow-x-auto pb-2">
            <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-mono font-bold" themeColor="#000000" />
          </div>
        </FadeInSection>

        {/* Narrative */}
        <FadeInSection className="border-b border-black pb-8 sm:pb-12 relative overflow-hidden">
          {/* Parallax Minimal Corner Marker */}
          <motion.div 
            style={{ y: parallaxYMedium }}
            className="absolute top-0 right-0 w-16 h-16 border-t border-r border-black/30 pointer-events-none" 
          />

          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">ABOUT THE EVENT</span>
          <p className="leading-relaxed max-w-xl break-words relative z-10">
            We look forward to celebrating this event with you. Please review the schedule and venue details below, and confirm your attendance using the RSVP form.
          </p>
        </FadeInSection>

        {/* Timeline table */}
        {showProgram && (
          <FadeInSection className="border-b border-black pb-8 sm:pb-12">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">EVENT SCHEDULE</span>
            <InteractiveProgramTimeline
              steps={timelineSteps || []}
              themeId="minimal"
              accentColor="#000000"
              lineColor="border-black"
              headingFont="font-mono"
            />
          </FadeInSection>
        )}

        {/* Gallery */}
        {event.galleryImages && event.galleryImages.length > 0 && (
          <FadeInSection className="border-b border-black pb-8 sm:pb-12">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">PHOTO GALLERY</span>
            <InteractiveGalleryGrid
              images={event.galleryImages || []}
              themeId="minimal"
              cardBorderClass="border-black"
              cardBgClass="bg-white"
            />
          </FadeInSection>
        )}

        {/* Venue Location Section (Stark Minimalist) */}
        <FadeInSection className="border-b border-black pb-8 sm:pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4 font-mono">
            LOCATION & VENUE
          </span>
          <div className="max-w-xl">
            <h3 className="text-base sm:text-lg font-bold uppercase mb-2 break-words">
              {getVenueFirstLine(event.venue, event.venueName)}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4 break-words">
              See the venue location details and interactive map below.
            </p>

            <div className="flex flex-col gap-2 text-xs text-stone-800 mb-6 font-mono border-y border-black/20 py-3">
              <div className="break-words"><span className="text-stone-400">VENUE:</span> {event.venue || 'Venue TBD'}</div>
              {event.date && <div><span className="text-stone-400">DATE:</span> {formatDateSafe(event.date)} {event.time ? `• ${event.time}` : ''}</div>}
              {event.dressCode && <div><span className="text-stone-400">DRESS CODE:</span> {event.dressCode}</div>}
            </div>

            <div className="border border-black p-1 bg-white mb-6 h-[220px] sm:h-[250px] overflow-hidden">
              <EventGoogleMap address={event.venue || ''} className="w-full h-full grayscale filter contrast-[1.15]" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue || '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-block border border-black px-4 py-2.5 bg-black text-white hover:bg-stone-800 uppercase font-bold text-[10px] tracking-widest transition-all text-center"
              >
                OPEN IN GOOGLE MAPS
              </motion.a>

              <CopyAddressButton
                address={event.venue || ''}
                className="inline-block border border-black px-4 py-2.5 hover:bg-stone-100 uppercase font-bold text-[10px] tracking-widest transition-all text-center text-black"
                iconColor="text-black"
              />
            </div>
          </div>
        </FadeInSection>

        {/* Gift Registry */}
        <FadeInSection className="border-b border-black pb-8 sm:pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4 font-mono">GIFT REGISTRY</span>
          <h3 className="text-base sm:text-lg font-bold font-mono text-black uppercase mb-4">GIFT REGISTRY</h3>
          <InteractiveGiftRegistry
            event={event}
            themeId="minimal"
            cardBgClass="bg-white"
            cardBorderClass="border-black hover:bg-stone-50"
            titleColorClass="text-black font-mono"
            descColorClass="text-stone-700 font-mono"
            ctaColorClass="text-black hover:underline font-mono"
            headingFont="font-mono"
          />
        </FadeInSection>

        {/* RSVP FORM stark console */}
        <FadeInSection id="rsvp-anchor" className="border-b border-black pb-8 sm:pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">RSVP</span>
          <div className="max-w-md w-full">
            <RsvpForm
              event={event}
              guest={guest}
              onRsvpSuccess={onRsvpSuccess}
              themeId="minimal"
              theme={theme}
            />
          </div>
        </FadeInSection>

        {/* Guestbook Board */}
        <FadeInSection className="pb-8 sm:pb-12 border-b border-black">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">GUESTBOOK</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-1 sm:col-span-2 text-stone-400 text-xs font-mono">No messages yet. Be the first to sign the guestbook and leave a message.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-4 border border-black flex flex-col justify-between min-h-[9rem] h-auto">
                  {entry.imageUrl && (
                    <div className="mb-3 border border-black max-h-48 overflow-hidden">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-36 object-cover grayscale" />
                    </div>
                  )}
                  <p className="text-black italic break-words">"{entry.message}"</p>
                  <div className="border-t border-stone-200 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-500 font-mono">
                    <span className="font-bold text-black uppercase truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                    <span className="shrink-0">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeInSection>

        {/* Interactive FAQ Accordion */}
        <FadeInSection className="border-b border-black pb-8 sm:pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">EVENT DETAILS & FAQ</span>
          <InteractiveFaqAccordion
            themeId="minimal"
            accentColor="#000000"
            borderColor="border-black"
            textColor="text-black"
            headingFont="font-mono"
          />
        </FadeInSection>

        {/* Footer */}
        <footer className="text-stone-400 text-[10px] pb-8 sm:pb-12 flex flex-col gap-1 font-mono">
          <div className="uppercase break-words">PAM'S EVENTS PLATFORM</div>
          <div className="text-stone-400 font-mono mt-2">© 2026 PAM'S EVENTS. ALL RIGHTS RESERVED.</div>
        </footer>

      </div>
    </div>
  );
};
