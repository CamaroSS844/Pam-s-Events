/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, MapPin, Gift, Clock, Sparkles, MessageSquare, 
  MapIcon, User, Heart, HelpCircle, Check 
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { EventModel, Guest, GuestbookEntry } from '../../types';
import { Countdown } from '../../components/Countdown';
import { RsvpForm } from './RsvpForm';

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

export const getVenueFirstLine = (venueStr?: string) => {
  if (!venueStr || typeof venueStr !== 'string' || !venueStr.trim()) return 'Venue TBD';
  const parts = venueStr.trim().split(',');
  return parts[0] ? parts[0].trim() : (venueStr || 'Venue TBD');
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
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.8, ease: [0.21, 1.02, 0.43, 1.01] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

const rawApiKey = (
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
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

export const ThemeRenderer: React.FC<ThemeRendererProps> = (props) => {
  const { event } = props;

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
  return (
    <div className="flex-1 flex flex-col font-luxury-body bg-[#F5F5DC] text-[#2C2C2C] selection:bg-[#D4AF37] selection:text-white">
      {/* Hero / Header with Gold Metallic Gradients & Art Deco details */}
      <section className="relative py-32 px-6 text-center overflow-hidden border-b-4 border-[#D4AF37] bg-gradient-to-b from-[#1C1C1C] via-[#2D2D2D] to-[#1C1C1C] text-white">
        {/* Decorative Art Deco Grid overlay at 4% opacity */}
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0), linear-gradient(to right, rgba(212,175,55,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,175,55,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px, 20px 20px, 20px 20px'
        }} />
        <div className="absolute inset-0 z-0 opacity-30">
          <img src={event.coverImage} className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.1] blur-[1px]" alt="Luxury BG" />
        </div>
        
        {/* Top/Bottom Art Deco Border */}
        <div className="absolute top-6 left-6 right-6 bottom-6 border border-[#D4AF37]/30 pointer-events-none z-10" />
        <div className="absolute top-8 left-8 right-8 bottom-8 border border-[#D4AF37]/15 pointer-events-none z-10" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center">
          <div className="flex items-center gap-3 text-[#D4AF37]">
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            <span className="text-[11px] tracking-[0.3em] font-medium uppercase">EXCLUSIVE CELEBRATION</span>
            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>

          {/* Majestic Monogram Frame */}
          <div className="relative w-48 h-48 rounded-full border-2 border-[#D4AF37] p-2 bg-[#2C2C2C] shadow-[0_0_30px_rgba(212,175,55,0.3)] mt-2">
            <div className="absolute -inset-1 border border-[#CD7F32] rounded-full animate-spin-slow opacity-65" style={{ animationDuration: '20s' }} />
            <div className="w-full h-full rounded-full border border-[#D4AF37]/50 overflow-hidden relative">
              <img src={event.coverImage} className="w-full h-full object-cover rounded-full filter hover:scale-110 transition-transform duration-700" alt="Portrait" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-luxury-heading tracking-wide text-white leading-tight mt-4">
            {event.type === 'wedding' ? (
              <span className="flex flex-col gap-2">
                <span className="font-light tracking-wide">{event.brideName}</span>
                <span className="text-3xl font-luxury-script text-[#D4AF37] my-1 lowercase">and</span>
                <span className="font-light tracking-wide">{event.groomName}</span>
              </span>
            ) : (
              <span className="font-light tracking-wide">{event.birthdayPerson}</span>
            )}
          </h1>

          <p className="text-base font-luxury-script text-[#D4AF37] max-w-xl mx-auto leading-relaxed px-4">
            {event.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6">
            <div className="border border-[#D4AF37]/40 px-8 py-3 bg-[#1C1C1C]/80 backdrop-blur-sm shadow-xl rounded-lg">
              <span className="block text-[9px] text-[#D4AF37] uppercase tracking-[0.25em] mb-1">THE EVENT DATE</span>
              <span className="text-sm text-white font-medium">{formatDateSafe(event.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="border border-[#D4AF37]/40 px-8 py-3 bg-[#1C1C1C]/80 backdrop-blur-sm shadow-xl rounded-lg">
              <span className="block text-[9px] text-[#D4AF37] uppercase tracking-[0.25em] mb-1">THE COMMENCEMENT</span>
              <span className="text-sm text-white font-medium">{event.time} PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Ticker Countdown */}
      <section className="bg-[#2C2C2C] border-b border-[#D4AF37]/30 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
        <span className="text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase block mb-3">T-MINUS TO OPULENT HOURS</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-luxury-heading" themeColor="#D4AF37" />
      </section>

      {/* Ornate Letters Block with Deco filigrees */}
      <section className="py-24 px-6 relative overflow-hidden bg-cover bg-center" style={{
        backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}>
        <div className="max-w-2xl mx-auto border-2 border-[#D4AF37]/40 p-12 sm:p-16 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-lg relative">
          {/* Filigree Corner Accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/50" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/50" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/50" />

          <div className="text-[#D4AF37] text-xl mb-4 font-luxury-heading">✦ ⚜ ✦</div>
          <h2 className="text-2xl sm:text-3xl font-luxury-heading font-medium text-[#2C2C2C] uppercase tracking-widest">Our Story</h2>
          <p className="text-xs text-[#CD7F32] font-luxury-heading tracking-widest uppercase mt-1">A Celebration of Love & Destiny</p>
          
          <p className="text-base text-stone-600 leading-relaxed mt-8 font-luxury-heading italic">
            "Under elegant glass structures and grand coordinates, we cordially request the pleasure of your company to bear witness to our vows, share exquisite cuisines, and toast to the beautiful years ahead under golden skies."
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-8" />
        </div>
      </section>

      {/* Timeline Section */}
      {showProgram && (
        <section className="py-24 bg-white border-y border-[#D4AF37]/20 relative">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">THE CHRONOLOGY</span>
              <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest">ORDER OF CELEBRATION</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
            </div>

            <div className="relative border-l-2 border-[#D4AF37]/30 pl-8 ml-4 sm:ml-12 flex flex-col gap-12">
              {(timelineSteps || []).map((item, idx) => (
                <div key={idx} className="relative group transition-all duration-300 hover:translate-x-1">
                  <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-[#2C2C2C] border-2 border-[#D4AF37] flex items-center justify-center shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-xs text-[#D4AF37] tracking-[0.2em] font-semibold bg-[#2C2C2C] border border-[#D4AF37]/40 px-4 py-1 rounded-full uppercase font-luxury-body">
                      {item.time}
                    </span>
                    <h3 className="text-lg font-luxury-heading font-medium text-[#2C2C2C] mt-3 uppercase tracking-wider">{item.title}</h3>
                    <p className="text-sm text-stone-500 mt-2 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-24 bg-[#F5F5DC]/40 relative">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">VISUAL LOOKBOOK</span>
              <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest">GALLERY MEMORIES</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#D4AF37]/20 shadow-xl rounded-lg hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/60 transition-all duration-500 hover:-translate-y-1">
                  <div className="h-64 overflow-hidden rounded-md relative group">
                    <img src={img} className="w-full h-full object-cover filter transition-all duration-750 group-hover:scale-105" alt="Gallery" />
                    <div className="absolute inset-0 bg-[#2C2C2C]/10 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue section */}
      <section className="py-24 bg-white border-b border-[#D4AF37]/20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="text-left flex flex-col gap-6">
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] font-bold block mb-2 uppercase">THE GRAND AMBIANCE</span>
              <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-wider leading-tight">{getVenueFirstLine(event.venue)}</h2>
              <div className="w-12 h-1 bg-[#D4AF37] mt-3" />
            </div>
            
            <p className="text-sm text-stone-500 leading-relaxed font-light">
              We look forward to hosting our exclusive circle of companions at <strong className="text-stone-800 font-medium">{event.venue || 'Venue TBD'}</strong>. Professional security coordinators and valet stewards will check registrations upon carriage arrival.
            </p>

            <div className="flex flex-col gap-4 text-sm text-[#2C2C2C] border-y border-[#D4AF37]/20 py-6 my-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-light">{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-light">Attire Directives: <strong className="text-[#CD7F32] font-semibold uppercase tracking-wider text-xs">{event.dressCode}</strong></span>
              </div>
            </div>

            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2C2C2C] text-white hover:bg-[#D4AF37] hover:text-[#2C2C2C] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 rounded shadow-lg self-start">
              <MapIcon className="w-4 h-4" />
              <span>LAUNCH GPS NAVIGATION</span>
            </a>
          </div>

          <div className="border border-[#D4AF37]/40 p-3 bg-white shadow-2xl rounded-xl h-[300px] overflow-hidden">
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-lg" />
          </div>
        </div>
      </section>

      {/* Gift Registries */}
      <section className="py-24 bg-[#F5F5DC]/40 relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="mb-16">
            <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">TRIBUTE LISTINGS</span>
            <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest">EXCLUSIVE REGISTRIES</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {(registryItems || []).map((item, idx) => (
              <div key={idx} className="bg-white border border-[#D4AF37]/20 p-8 shadow-xl rounded-xl flex flex-col justify-between h-56 hover:border-[#D4AF37]/60 hover:shadow-[#D4AF37]/5 transition-all duration-300">
                <div>
                  <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-[0.2em] font-luxury-body border-b border-stone-100 pb-3">{item.store}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed mt-4 font-light">{item.note}</p>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#D4AF37] hover:text-[#CD7F32] uppercase tracking-wider flex items-center gap-1.5 pt-4 border-t border-stone-100 mt-4 transition-colors">
                  <span>ENTER STORE</span>
                  <span className="text-xs">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section id="rsvp-anchor" className="py-24 bg-white relative">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">RESPONSE ENVELOPE</span>
            <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest">KINDLY REPLY</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="luxury"
            theme={theme}
          />
        </div>
      </section>

      {/* Guestbook section with elegant cards */}
      <section className="py-24 bg-[#F5F5DC]/40 border-t border-[#D4AF37]/20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase block mb-2 font-semibold">CELESTIAL BLESSINGS</span>
            <h2 className="text-3xl font-luxury-heading text-[#2C2C2C] uppercase tracking-widest">THE ROYAL GUESTBOOK</h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-sm text-stone-400 py-6 font-light italic">No luxury signatures inscribed yet. Be the first to leave a golden blessing!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-8 bg-white border border-[#D4AF37]/20 shadow-xl rounded-lg flex flex-col justify-between min-h-[11rem] h-auto relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#CD7F32]" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-[#D4AF37]/30 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-sm text-stone-600 italic leading-relaxed font-light font-luxury-heading">"{entry.message}"</p>
                  <div className="border-t border-stone-100 pt-4 mt-4 flex justify-between items-center text-[11px] font-luxury-heading">
                    <span className="font-bold uppercase tracking-wider text-[#2C2C2C]">{entry.name}</span>
                    <span className="text-[#CD7F32] font-medium">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-16 text-center border-t-2 border-[#D4AF37] text-xs">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4">
          <span className="text-lg font-luxury-script text-[#D4AF37] font-medium">Pam's Events Wedding & Gala Collections</span>
          <p className="text-stone-400 leading-relaxed text-[11px] font-light tracking-wide">Sharing in the beautiful unions of high societies. Under stewardship of our royal media registries.</p>
          <div className="h-[1px] bg-white/10 my-6" />
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
  return (
    <div className="flex-1 flex flex-col font-elegant-body bg-[#FEFEFE] text-[#3A3A3A] selection:bg-[#3A3A3A] selection:text-white">
      {/* Pristine Gallery Hero Section */}
      <section className="relative py-32 px-8 md:px-24 bg-[#FEFEFE] border-b border-[#C0C0C0]/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch justify-between gap-16">
          
          {/* Left Block - Asymmetrical Title & Scaling */}
          <div className="flex flex-col justify-center md:w-3/5 text-left gap-10">
            <div className="flex items-center gap-4 text-[#9E9E9E]">
              <span className="w-1.5 h-1.5 bg-[#3A3A3A] rounded-full" />
              <span className="text-[10px] tracking-[0.3em] font-medium uppercase">EXHIBIT NO. 02 / GALLERY</span>
            </div>

            {/* Extreme scale contrast heading */}
            <h1 className="text-6xl sm:text-8xl font-elegant-heading tracking-tight leading-[0.9] text-[#3A3A3A] uppercase font-light">
              {event.type === 'wedding' ? (
                <span className="flex flex-col gap-4">
                  <span className="block border-b border-[#C0C0C0]/30 pb-4">{event.brideName}</span>
                  <span className="text-3xl font-elegant-heading lowercase tracking-widest text-[#9E9E9E] py-2">and</span>
                  <span className="block pt-2">{event.groomName}</span>
                </span>
              ) : (
                <span className="block">{event.birthdayPerson}</span>
              )}
            </h1>

            <div className="h-[0.5px] w-24 bg-[#C0C0C0]" />

            <p className="text-sm tracking-wide leading-relaxed text-[#9E9E9E] max-w-lg font-light">
              {event.description}
            </p>

            {/* Minimalist Date Box */}
            <div className="grid grid-cols-2 gap-8 text-[11px] uppercase tracking-[0.2em] text-[#3A3A3A] border-t border-[#C0C0C0]/40 pt-8 max-w-sm">
              <div>
                <span className="text-[#9E9E9E] block mb-1">DATE / CALENDAR</span>
                <strong className="font-medium block">{formatDateSafe(event.date, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
              <div>
                <span className="text-[#9E9E9E] block mb-1">HOURS / METRIC</span>
                <strong className="font-medium block">{event.time} PM CET</strong>
              </div>
            </div>
          </div>

          {/* Right Block - Portrait layout Lookbook */}
          <div className="flex items-center justify-center md:w-2/5">
            <div className="relative p-3 bg-[#F7F7F7] border border-[#C0C0C0]/30 max-w-[320px] w-full aspect-[3/4] shadow-sm flex flex-col justify-between">
              {/* Minimal Circle Accent */}
              <div className="absolute -top-4 -left-4 w-12 h-12 border border-[#C0C0C0]/20 rounded-full pointer-events-none" />
              <div className="w-full h-[90%] overflow-hidden bg-white">
                <img src={event.coverImage} className="w-full h-full object-cover filter grayscale contrast-115 transition-all duration-700 hover:grayscale-0" alt="Editorial Frame" />
              </div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-center py-2 text-[#9E9E9E] font-medium border-t border-[#C0C0C0]/20 mt-2">
                UNION / PORTRAIT COUTURE
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Whisper-Quiet Minimalist Ticker Countdown */}
      <section className="bg-[#F7F7F7] border-b border-[#C0C0C0]/40 py-8 px-8 text-left">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-light">REMAINING DURATION SECONDS /</span>
          <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-elegant-heading" themeColor="#3A3A3A" />
        </div>
      </section>

      {/* Quiet Gallery Story Block */}
      <section className="py-32 px-8 bg-white relative">
        {/* Subtle Single Line Botanical Decoration */}
        <div className="absolute right-12 bottom-12 opacity-15 pointer-events-none text-[#C0C0C0]">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75">
            <path d="M50 90 C 50 50, 20 40, 20 20 M50 70 C 50 40, 80 30, 80 15 M50 90 L50 10" />
            <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            <circle cx="80" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 text-left items-start">
          <div className="md:col-span-7 flex flex-col gap-6">
            <h2 className="text-3xl sm:text-4xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light leading-tight">THE ANTHOLOGY OF SPACE</h2>
            <div className="w-12 h-[0.5px] bg-[#3A3A3A]" />
            <p className="text-sm leading-relaxed text-[#9E9E9E] font-light tracking-wide">
              We stand in appreciation of negative space, slow tempos, and deliberate architecture. Our shared lifeworks are a testament to pure beginnings, where each detail is handled with absolute care. We welcome you to this gallery.
            </p>
          </div>
          <div className="md:col-span-5 border-l border-[#C0C0C0]/40 pl-8 md:pt-4">
            <p className="text-xl font-elegant-heading italic text-[#9E9E9E] leading-snug">
              "A quiet union curated for beloved minds, celebrating pristine lines and endless horizons."
            </p>
          </div>
        </div>
      </section>

      {/* Itinerary / Program */}
      {showProgram && (
        <section className="py-32 bg-[#F7F7F7] border-y border-[#C0C0C0]/40 text-left relative">
          <div className="max-w-4xl mx-auto px-8">
            <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">CURATIVE CHRONOLOGY</span>
            <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light mb-16">CHRONOLOGY TIMELINE</h2>
            
            <div className="relative border-l border-[#3A3A3A]/20 pl-8 ml-2 flex flex-col gap-16">
              {(timelineSteps || []).map((item, idx) => (
                <div key={idx} className="relative">
                  {/* 0.5px precise dot */}
                  <div className="absolute -left-[36.5px] top-1 w-2.5 h-2.5 bg-white border border-[#3A3A3A] rounded-full" />
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 items-start">
                    <span className="text-xs font-mono tracking-widest text-[#9E9E9E] uppercase w-24 sm:pt-0.5">
                      {item.time} PM
                    </span>
                    <div className="max-w-xl">
                      <h3 className="text-base font-elegant-heading font-semibold text-[#3A3A3A] uppercase tracking-wide">{item.title}</h3>
                      <p className="text-xs text-[#9E9E9E] mt-2 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery / Visual Stream */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-32 bg-white border-b border-[#C0C0C0]/40">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-20">
              <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">LOOKBOOK EXHIBITS</span>
              <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light">VISUAL ARCHIVES</h2>
              <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="border border-[#C0C0C0]/20 p-4 bg-[#FEFEFE] shadow-sm hover:border-[#3A3A3A] transition-colors duration-500">
                  <div className="h-72 overflow-hidden bg-[#F7F7F7]">
                    <img src={img} className="w-full h-full object-cover filter grayscale contrast-110 transition-all duration-700 hover:grayscale-0 hover:scale-102" alt="Exhibit Details" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue Section with high contrast details */}
      <section className="py-32 bg-white text-left relative">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] block uppercase font-semibold">LOCATIONS COORDINATE</span>
            <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light leading-tight">{getVenueFirstLine(event.venue)}</h2>
            <div className="w-12 h-[0.5px] bg-[#3A3A3A]" />
            
            <p className="text-xs text-[#9E9E9E] leading-relaxed font-light tracking-wide">
              The commemorative exhibit is staged at <strong className="text-[#3A3A3A] font-medium">{event.venue || 'Venue TBD'}</strong>. In alignment with museum guidelines, guests are requested to register coordinates with stewards at the entrance porticoes.
            </p>

            <div className="flex flex-col gap-4 text-xs text-[#3A3A3A] border-y border-[#C0C0C0]/30 py-8 my-2 font-light">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#9E9E9E]" />
                <span>{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#9E9E9E]" />
                <span>Attire Guidelines: <strong className="text-[#3A3A3A] font-semibold uppercase tracking-wider text-[11px]">{event.dressCode}</strong></span>
              </div>
            </div>

            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3A3A3A] text-white hover:bg-[#9E9E9E] text-[10px] font-sans tracking-[0.2em] uppercase transition-colors rounded-none shadow-md self-start">
              <MapIcon className="w-4 h-4 text-[#C0C0C0]" />
              <span>LAUNCH POSITION MAP</span>
            </a>
          </div>

          <div className="border border-[#C0C0C0]/40 bg-[#F7F7F7] p-2 h-[280px] overflow-hidden">
            <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Registry Vouchers */}
      <section className="py-32 bg-[#F7F7F7] border-t border-[#C0C0C0]/40">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="mb-20">
            <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">TRIBUTE DIRECTORIES</span>
            <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light">GIFT DIRECTORIES</h2>
            <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-left">
            {(registryItems || []).map((item, idx) => (
              <div key={idx} className="bg-white border border-[#C0C0C0]/30 p-8 flex flex-col justify-between h-56 hover:border-[#3A3A3A] transition-colors duration-300 shadow-sm">
                <div>
                  <h3 className="text-xs font-semibold text-[#3A3A3A] uppercase tracking-[0.2em] pb-3 border-b border-[#C0C0C0]/20">{item.store}</h3>
                  <p className="text-xs text-[#9E9E9E] leading-relaxed mt-4 font-light tracking-wide">{item.note}</p>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#3A3A3A] hover:text-[#9E9E9E] uppercase tracking-widest border-t border-[#C0C0C0]/20 pt-4 mt-4 transition-colors">
                  ENTER REGISTER →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
       {/* RSVP Minimal form */}
      <section id="rsvp-anchor" className="py-32 bg-white relative">
        <div className="max-w-lg mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">ATTENDANCE DIRECTORY</span>
            <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light">KINDLY REPLY</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="elegant"
            theme={theme}
          />
        </div>
      </section>

      {/* Guestbook registers */}
      <section className="py-32 bg-[#F7F7F7] border-t border-[#C0C0C0]/40">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.25em] text-[#9E9E9E] uppercase font-semibold block mb-2">BLESSINGS REGISTRY</span>
            <h2 className="text-3xl font-elegant-heading text-[#3A3A3A] uppercase tracking-tight font-light">THE VISITOR REGISTER</h2>
            <div className="w-8 h-[0.5px] bg-[#3A3A3A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-xs text-[#9E9E9E] py-6 font-light italic">No entries cataloged. Be the first to stamp the visitor registers.</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-8 bg-white border border-[#C0C0C0]/30 flex flex-col justify-between min-h-[11rem] h-auto hover:border-[#3A3A3A] transition-all duration-300 shadow-sm rounded-none">
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-none overflow-hidden border border-[#C0C0C0]/40 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3A3A3A] italic leading-relaxed font-light font-elegant-heading">"{entry.message}"</p>
                  <div className="border-t border-[#C0C0C0]/20 pt-4 mt-4 flex justify-between items-center text-[10px] font-sans">
                    <span className="font-bold uppercase tracking-wider text-[#3A3A3A]">{entry.name}</span>
                    <span className="text-[#9E9E9E] font-mono">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="bg-[#3A3A3A] text-white py-16 text-center text-xs">
        <div className="max-w-xl mx-auto px-8 flex flex-col gap-4 font-sans">
          <span className="text-xs uppercase tracking-[0.25em] font-bold">PAM'S EVENTS DESIGN PLATFORMS</span>
          <p className="text-[#9E9E9E] leading-relaxed text-[11px] font-light">Fine art, curated layouts, and beautiful memories. Under strict curation of our media divisions.</p>
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
  return (
    <div className="flex-1 flex flex-col font-modern-body bg-[#FAF8F3] text-[#2D2D2D] selection:bg-[#1A2B4A] selection:text-[#FAF8F3]">
      
      {/* Editorial Splitscreen Bento-Grid Header */}
      <div className="max-w-6xl mx-auto px-6 py-16 w-full grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Tile 1: Master Hero card (span 8) in Deep Navy */}
        <div className="md:col-span-8 bg-[#1A2B4A] text-[#FAF8F3] rounded-2xl p-8 sm:p-12 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between min-h-[360px] relative overflow-hidden group">
          {/* Subtle geometric line overlays */}
          <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-[#C9A961]/20 rounded-bl-full pointer-events-none" />
          
          <div className="relative z-10">
            <span className="bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 text-[#C9A961] text-[10px] font-modern-heading uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-none inline-block">
              Milestone Navigation Portal
            </span>
            
            <h1 className="text-4xl sm:text-6xl font-modern-heading font-bold tracking-tight text-white mt-8 leading-none uppercase">
              {event.type === 'wedding' ? (
                <span>
                  {event.brideName} <span className="text-[#C9A961] font-light italic text-2xl lowercase font-modern-body my-1 block sm:inline">and</span> {event.groomName}
                </span>
              ) : (
                <span>{event.birthdayPerson}</span>
              )}
            </h1>
            
            <p className="text-sm text-[#FAF8F3]/80 mt-6 max-w-xl leading-relaxed font-light">
              {event.description} Join us as we register this highly anticipated celebration within Seattle's beautiful waterways.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 relative z-10 border-t border-[#FAF8F3]/10 pt-6">
            <div className="flex items-center gap-2 text-xs font-modern-heading tracking-wider uppercase text-[#C9A961]">
              <Calendar className="w-4 h-4 text-white" />
              <span>{formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span className="text-[#FAF8F3]/30 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-xs font-modern-heading tracking-wider uppercase text-white">
              <Clock className="w-4 h-4 text-[#C9A961]" />
              <span>{event.time} PM PACIFIC</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Countdown ticker (span 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-8 border border-[#5B7C99]/30 shadow-md flex flex-col justify-between items-center text-center min-h-[300px]">
          <span className="text-[10px] font-modern-heading text-[#1A2B4A] font-bold tracking-[0.2em] uppercase">DURATION PARAMETER</span>
          
          <div className="my-auto py-6">
            <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-modern-heading text-2xl font-bold" themeColor="#1A2B4A" />
          </div>
          
          <div className="w-12 h-[2px] bg-[#C9A961] mb-2" />
          <span className="text-[9px] font-mono text-[#5B7C99] uppercase tracking-wider">REALTIME GPS CHRONOMETER</span>
        </div>

        {/* Tile 3: Lookbook Image Portrait (span 4) */}
        <div className="md:col-span-4 bg-[#1A2B4A] rounded-2xl overflow-hidden border border-[#C9A961]/30 shadow-lg relative min-h-[260px] group">
          <img src={event.coverImage} className="w-full h-full object-cover filter brightness-[0.8] contrast-105 transition-all duration-750 group-hover:scale-105 group-hover:brightness-90" alt="Exhibition Frame" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4A] via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-5 left-5">
            <span className="bg-[#C9A961] text-[#1A2B4A] text-[9px] font-modern-heading uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-none shadow-md">
              COUTURE COVER
            </span>
          </div>
        </div>

        {/* Tile 4: Deep story description (span 8) */}
        <div className="md:col-span-8 bg-white rounded-2xl p-8 sm:p-10 border border-[#5B7C99]/20 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-modern-heading tracking-[0.2em] text-[#5B7C99] uppercase font-bold">OUR STORY</span>
            <h2 className="text-2xl sm:text-3xl font-modern-heading font-bold tracking-tight text-[#1A2B4A] uppercase mt-4 mb-4">CONFIDENT INCEPTION</h2>
            <p className="text-sm text-[#2D2D2D] leading-relaxed max-w-xl font-light">
              We started from random coffee shop dialogues and expanded into a polished, modern union of shared dreams. On this celebratory occasion, we gather our closest creative directory to share exquisite acoustic sets, fine cuisine, and beautiful views of the marina.
            </p>
          </div>
          <div className="text-[10px] font-modern-heading text-[#C9A961] font-bold mt-6 tracking-widest border-t border-[#FAF8F3] pt-4 uppercase">
            ESTABLISHED DATABASE SYSTEM ACTIVE ✓
          </div>
        </div>

        {showProgram ? (
          <>
            {/* Tile 5: Timeline Sequencer (span 6) */}
            <div className="md:col-span-6 bg-white rounded-2xl p-8 border border-[#C9A961]/30 shadow-md">
              <span className="text-[10px] font-modern-heading text-[#1A2B4A] font-bold uppercase tracking-[0.2em] block mb-6">THE SEQUENCER METRIC</span>
              
              <div className="flex flex-col gap-5">
                {(timelineSteps || []).map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#FAF8F3] border border-[#5B7C99]/20 rounded-xl flex items-start gap-4 hover:border-[#C9A961] transition-colors">
                    <span className="bg-[#1A2B4A] text-white border border-[#C9A961] text-[9px] font-modern-heading px-3 py-1 rounded-none mt-0.5 shrink-0 uppercase tracking-widest">
                      {item.time} PM
                    </span>
                    <div>
                      <h4 className="text-sm font-modern-heading font-bold text-[#1A2B4A] uppercase tracking-wide">{item.title}</h4>
                      <p className="text-xs text-[#2D2D2D]/70 mt-1 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tile 6: Map directions / venue (span 6) */}
            <div className="md:col-span-6 bg-[#1A2B4A] text-white rounded-2xl p-8 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.25em] block mb-4">VENUE CODES</span>
                <h3 className="text-2xl font-modern-heading font-bold text-white uppercase tracking-wide">{getVenueFirstLine(event.venue)}</h3>
                <div className="w-12 h-[1px] bg-[#C9A961] my-4" />
                
                <p className="text-xs text-[#FAF8F3]/80 leading-relaxed font-light tracking-wide">
                  The maritime assembly is anchored at <strong className="text-white font-medium">{event.venue || 'Venue TBD'}</strong>. In compliance with security codes, guests are requested to verify their passes.
                </p>
                
                <div className="flex flex-col gap-3 mt-6 text-xs text-[#FAF8F3]/80 font-light">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#C9A961]" />
                    <span>{event.venue || 'Venue TBD'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                    <span>Attire: <strong className="text-white font-medium uppercase tracking-wider text-[11px]">{event.dressCode}</strong></span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl overflow-hidden h-[180px] border border-[#C9A961]/20">
                  <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
                </div>
              </div>
              
              <a href={event.mapLink} target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-[#C9A961] hover:bg-[#FAF8F3] hover:text-[#1A2B4A] text-[#1A2B4A] rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase mt-8 block transition-colors">
                LAUNCH POSITION MAP
              </a>
            </div>
          </>
        ) : (
          /* Tile 6: Map directions / venue (span 12) */
          <div className="md:col-span-12 bg-[#1A2B4A] text-white rounded-2xl p-8 border border-[#C9A961]/40 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.25em] block mb-4">VENUE CODES</span>
              <h3 className="text-2xl font-modern-heading font-bold text-white uppercase tracking-wide">{getVenueFirstLine(event.venue)}</h3>
              <div className="w-12 h-[1px] bg-[#C9A961] my-4" />
              
              <p className="text-xs text-[#FAF8F3]/80 leading-relaxed font-light tracking-wide">
                The maritime assembly is anchored at <strong className="text-white font-medium">{event.venue || 'Venue TBD'}</strong>. In compliance with security codes, guests are requested to verify their passes.
              </p>
              
              <div className="flex flex-col gap-3 mt-6 text-xs text-[#FAF8F3]/80 font-light">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A961]" />
                  <span>{event.venue || 'Venue TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#C9A961]" />
                  <span>Attire: <strong className="text-white font-medium uppercase tracking-wider text-[11px]">{event.dressCode}</strong></span>
                </div>
              </div>

              <div className="mt-6 rounded-xl overflow-hidden h-[180px] border border-[#C9A961]/20">
                <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
              </div>
            </div>
            
            <a href={event.mapLink} target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-[#C9A961] hover:bg-[#FAF8F3] hover:text-[#1A2B4A] text-[#1A2B4A] rounded-none text-xs font-modern-heading font-bold tracking-widest uppercase mt-8 block transition-colors">
              LAUNCH POSITION MAP
            </a>
          </div>
        )}

        {/* Tile 7: Digital Registries (span 12) */}
        <div className="md:col-span-12 bg-white rounded-2xl p-8 border border-[#5B7C99]/30 shadow-md">
          <span className="text-[10px] font-modern-heading text-[#1A2B4A] font-bold uppercase tracking-[0.2em] block mb-6">TRIBUTE REGISTRIES</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(registryItems || []).map((item, idx) => (
              <div key={idx} className="p-6 bg-[#FAF8F3] border border-[#5B7C99]/20 rounded-xl flex flex-col justify-between h-40 hover:border-[#C9A961] transition-all">
                <div>
                  <h4 className="text-xs font-modern-heading font-bold text-[#1A2B4A] uppercase tracking-widest border-b border-[#5B7C99]/10 pb-2">{item.store}</h4>
                  <p className="text-xs text-[#2D2D2D]/70 leading-relaxed mt-3 font-light">{item.note}</p>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#C9A961] hover:text-[#1A2B4A] uppercase tracking-widest pt-2 flex items-center gap-1 transition-colors">
                  ENTER INDEX →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Tile 8: RSVP Form Console (span 12) */}
        <div id="rsvp-anchor" className="md:col-span-12 bg-[#1A2B4A] text-white rounded-2xl p-8 sm:p-12 border border-[#C9A961]/40 shadow-xl">
          <div className="max-w-xl mx-auto text-center flex flex-col gap-2 items-center mb-10">
            <span className="text-[10px] font-modern-heading text-[#C9A961] uppercase tracking-[0.25em]">RSVP TRANSMITTER</span>
            <h2 className="text-3xl font-modern-heading font-bold text-white uppercase tracking-tight">TRANSMIT ATTENDANCE LOGS</h2>
          </div>
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="modern"
            theme={theme}
          />
        </div>

        {/* Tile 9: Guestbook feedback registry signatures (span 12) */}
        <div className="md:col-span-12 bg-white rounded-2xl p-8 border border-[#5B7C99]/30 shadow-md">
          <div className="text-center mb-12">
            <span className="text-[10px] font-modern-heading text-[#5B7C99] uppercase tracking-[0.2em] block mb-2">SHARED ARCHIVES</span>
            <h2 className="text-2xl font-modern-heading font-bold text-[#1A2B4A] uppercase tracking-tight">THE SIGNATURE LEDGER</h2>
            <div className="w-8 h-[1.5px] bg-[#C9A961] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-xs text-[#5B7C99] py-8 font-light italic">Empty ledgers. Be the first to launch a blessing coordinate!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-6 bg-[#FAF8F3] border border-[#5B7C99]/20 flex flex-col justify-between min-h-[10rem] h-auto hover:border-[#C9A961] transition-colors rounded-xl shadow-sm">
                  {entry.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-[#5B7C99]/30 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#2D2D2D] leading-relaxed italic font-light font-modern-body">"{entry.message}"</p>
                  <div className="border-t border-[#5B7C99]/15 pt-3 mt-4 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#1A2B4A] uppercase tracking-wider">{entry.name}</span>
                    <span className="text-[#5B7C99] font-mono">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modern Footer */}
      <footer className="bg-[#1A2B4A] text-[#FAF8F3]/60 py-16 text-center border-t border-[#C9A961]/40 font-modern-heading text-xs mt-auto">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4">
          <span className="text-xs text-[#C9A961] uppercase tracking-[0.2em] font-bold">PAM'S EVENTS PLATFORM SYSTEM</span>
          <p className="leading-relaxed text-[11px] text-[#FAF8F3]/80 font-light">Fine maritime curation, scalable vector registries, and beautiful layouts. Under supervision of our media divisions.</p>
          <div className="h-[0.5px] bg-[#C9A961]/30 my-6" />
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
  return (
    <div className="flex-1 flex flex-col font-rustic-body bg-[#FFF8E7] text-[#3E3E3E] selection:bg-[#5C4033] selection:text-[#FFF8E7]">
      
      {/* Handcrafted Golden-Hour Hero Section */}
      <section className="relative py-28 px-6 text-center border-b border-[#D4C4B0]/60 relative overflow-hidden">
        {/* Subtle decorative leaf ornaments */}
        <div className="absolute top-12 left-12 opacity-15 pointer-events-none text-[#9CAF88] hidden md:block">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M10 80 Q 40 40 80 10 M80 10 Q 50 30 10 80 M45 45 Q 60 25 75 15 M30 60 Q 45 40 55 35" />
          </svg>
        </div>
        <div className="absolute bottom-12 right-12 opacity-15 pointer-events-none text-[#9CAF88] hidden md:block">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="rotate-180">
            <path d="M10 80 Q 40 40 80 10 M80 10 Q 50 30 10 80 M45 45 Q 60 25 75 15 M30 60 Q 45 40 55 35" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-6 items-center">
          <span className="text-[#9CAF88] font-bold text-xs tracking-[0.25em] uppercase font-sans">🌿 HANDCRAFTED WOODLAND INVITATION 🌿</span>
          
          {/* Deckled Edge Card Mockup */}
          <div className="p-8 sm:p-12 border border-[#D4C4B0] rounded-2xl bg-[#FAF6F0] shadow-md max-w-2xl w-full flex flex-col gap-6 relative">
            <div className="absolute inset-2 border border-dashed border-[#D4C4B0]/60 rounded-xl pointer-events-none" />
            
            <h1 className="text-4xl sm:text-6xl font-rustic-heading text-[#5C4033] tracking-tight leading-none font-bold">
              {event.type === 'wedding' ? (
                <span>
                  {event.brideName} <span className="text-[#C97064] font-light italic font-serif">&</span> {event.groomName}
                </span>
              ) : (
                <span>{event.birthdayPerson}</span>
              )}
            </h1>
            
            <div className="text-[#9CAF88] text-sm tracking-widest">✦ ✦ ✦</div>
            
            <p className="text-sm sm:text-base text-[#3E3E3E] leading-relaxed italic max-w-lg mx-auto font-light">
              "{event.description}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6 text-xs font-semibold text-[#5C4033] font-sans tracking-wide">
            <div className="bg-[#FAF6F0] border border-[#D4C4B0]/40 px-5 py-3 rounded-xl shadow-sm">
              📅 DATE / {formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="bg-[#FAF6F0] border border-[#D4C4B0]/40 px-5 py-3 rounded-xl shadow-sm">
              ⏱️ TIME / {event.time} PM PACIFIC
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Rustic barn style) */}
      <section className="bg-[#9CAF88]/10 border-b border-[#D4C4B0]/50 py-8 text-center">
        <span className="text-[10px] tracking-widest text-[#5C4033] uppercase font-bold block mb-2 font-sans">COZY HOUR TICKER T-MINUS</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-rustic-heading font-bold" themeColor="#5C4033" />
      </section>

      {/* Rustic Journal Story */}
      <section className="py-24 bg-white relative">
        <div className="max-w-2xl mx-auto px-6 text-center flex flex-col gap-6 items-center">
          <span className="text-[10px] font-sans tracking-[0.25em] text-[#C97064] font-bold uppercase">OUR CHRONICLE JOURNAL</span>
          <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide">Earthy Beginnings</h2>
          <div className="w-16 h-0.5 bg-[#9CAF88]" />
          <p className="text-sm leading-relaxed text-[#3E3E3E] italic max-w-xl font-light">
            "Nestled underneath golden hills and ancient pine tree boughs, we gather our closest kin to celebrate our next chapter. Let us share local harvest cuisines, acoustic strings, and organic wines in natural, joyful elegance."
          </p>
          <div className="text-[#D4C4B0] mt-2">✿ ~ ✿ ~ ✿</div>
        </div>
      </section>

      {/* Alternate zig-zag Timeline */}
      {showProgram && (
        <section className="py-24 bg-[#FFF8E7] border-y border-[#D4C4B0]/40">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">THE PATHWAYS</span>
              <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide">THE CELEBRATION PATHS</h2>
            </div>

            <div className="flex flex-col gap-10">
              {(timelineSteps || []).map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className={`flex flex-col sm:flex-row gap-6 items-start ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    <div className="w-full sm:w-1/2 p-6 bg-[#FAF6F0] rounded-2xl border border-[#D4C4B0]/40 shadow-sm relative hover:border-[#9CAF88] transition-colors duration-300">
                      <div className="absolute top-4 right-4 text-[10px] font-mono text-[#9CAF88] font-bold">{idx + 1} / STEP</div>
                      <span className="text-[10px] font-bold text-[#C97064] uppercase tracking-wider block mb-2 font-sans">{item.time} PM</span>
                      <h3 className="text-base font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide">{item.title}</h3>
                      <p className="text-xs text-[#3E3E3E] mt-2.5 leading-relaxed font-light">{item.desc}</p>
                    </div>
                    <div className="hidden sm:flex w-1/12 justify-center items-center h-full pt-8">
                      <div className="w-3 h-3 rounded-full bg-[#9CAF88] border-2 border-white shadow-sm" />
                    </div>
                    <div className="w-full sm:w-5/12" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Cozy snap lookbook */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">OUR GALLERY POLAROIDS</span>
            <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase mb-16">COZY SNAPSHOTS</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="p-4 bg-[#FAF6F0] rounded-xl shadow-md border border-[#D4C4B0]/40 hover:scale-[1.01] transition-transform duration-300">
                  <div className="h-64 rounded-lg overflow-hidden bg-white">
                    <img src={img} className="w-full h-full object-cover filter brightness-95" alt="Rustic Polaroid Snap" />
                  </div>
                  <div className="text-[11px] font-sans text-[#5C4033] mt-3 font-semibold uppercase tracking-wide">
                    MOMENT NO. {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue Section with Organic path */}
      <section className="py-24 bg-white border-t border-[#D4C4B0]/40 text-left">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] tracking-widest text-[#9CAF88] font-bold block uppercase font-sans">WOODLAND DIRECTIONS</span>
            <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase leading-tight">{getVenueFirstLine(event.venue)}</h2>
            <div className="w-12 h-0.5 bg-[#C97064]" />
            
            <p className="text-xs text-[#3E3E3E] leading-relaxed font-light tracking-wide">
              We look forward to welcoming you at <strong className="text-[#5C4033] font-medium">{event.venue || 'Venue TBD'}</strong>. Valet path assistance is designated for our list of attendees. High heels are discouraged due to woodsy garden paths.
            </p>

            <div className="flex flex-col gap-4 text-xs text-[#3E3E3E] border-y border-[#D4C4B0]/30 py-6 my-2 font-sans">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#C97064]" />
                <span>{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#9CAF88]" />
                <span>Suggested Dress: <strong className="text-[#5C4033] font-bold uppercase tracking-wider text-[11px]">{event.dressCode}</strong></span>
              </div>
            </div>

            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C97064] hover:bg-[#5C4033] text-white rounded-xl text-xs font-bold font-sans tracking-wider uppercase shadow-md transition-colors self-start">
              <MapIcon className="w-4 h-4 text-amber-100" />
              <span>VALET GPS DIRECTION MAP</span>
            </a>
          </div>

          <div className="border border-[#D4C4B0]/40 p-2 bg-[#FAF6F0] rounded-2xl h-[280px] shadow-inner overflow-hidden">
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Registry Vouchers */}
      <section className="py-24 bg-[#FFF8E7] border-t border-[#D4C4B0]/40">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="mb-16">
            <span className="text-[10px] tracking-[0.2em] text-[#9CAF88] uppercase font-bold block mb-2 font-sans">GIFTING DIRECTORIES</span>
            <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase">REGISTRY DIRECTORIES</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {(registryItems || []).map((item, idx) => (
              <div key={idx} className="bg-[#FAF6F0] border border-[#D4C4B0]/40 p-6 rounded-xl flex flex-col justify-between h-48 hover:border-[#9CAF88] transition-colors shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-[#5C4033] uppercase tracking-widest pb-2 border-b border-[#D4C4B0]/20 font-sans">{item.store}</h3>
                  <p className="text-xs text-[#3E3E3E] leading-relaxed mt-4 font-light">{item.note}</p>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#C97064] hover:text-[#5C4033] uppercase tracking-wider pt-2 flex items-center gap-1 transition-colors font-sans">
                  LAUNCH REGISTER →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP Postcard */}
      <section id="rsvp-anchor" className="py-24 bg-[#FFF8E7] border-t border-[#D4C4B0]/30">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2 font-sans">REGISTRY LOGS</span>
            <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase">RSVP POSTCARD</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="rustic"
            theme={theme}
          />
        </div>
      </section>

      {/* Guestbook display */}
      <section className="py-24 bg-white border-t border-[#D4C4B0]/40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#9CAF88] font-bold uppercase block mb-2">SHARED SIGNATURES</span>
            <h2 className="text-2xl sm:text-3xl font-rustic-heading font-bold text-[#5C4033] uppercase tracking-wide">THE VISITOR REGISTRY</h2>
            <div className="w-8 h-[1px] bg-[#C97064] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-xs text-stone-400 py-6 font-sans italic">Empty registers. Be the first to stamp warm blessings on this trail!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-8 bg-[#FAF6F0] rounded-xl border border-[#D4C4B0]/40 flex flex-col justify-between min-h-[11rem] h-auto hover:border-[#9CAF88] transition-colors duration-300 shadow-sm relative">
                  <div className="absolute top-0 right-8 w-4 h-8 bg-[#9CAF88]/10 border-b border-x border-[#9CAF88]/20 rounded-b-md" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-[#D4C4B0]/50 max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3E3E3E] italic leading-relaxed font-light font-rustic-heading">"{entry.message}"</p>
                  <div className="border-t border-[#D4C4B0]/20 pt-4 mt-4 flex justify-between items-center text-[10px] font-sans">
                    <span className="font-bold uppercase tracking-wider text-[#5C4033]">{entry.name}</span>
                    <span className="text-[#9CAF88] font-mono">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Rustic Footer */}
      <footer className="bg-[#5C4033] text-[#FFF8E7]/85 py-16 text-center border-t-2 border-[#D4C4B0] text-xs">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4 font-sans">
          <span className="text-xs text-[#9CAF88] font-bold uppercase tracking-widest">PAM'S EVENTS WOODLANDS CO.</span>
          <p className="leading-relaxed text-[11px] text-[#FFF8E7]/70 font-light">Fine wood craftsmanship, organic trail paths, and digital coordinates. Dedicated to high organic standards.</p>
          <div className="h-[0.5px] bg-[#FFF8E7]/20 my-6" />
          <span className="text-[10px] text-[#9CAF88] tracking-widest font-mono">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
};

/* ==========================================
   5. FLORAL ROSE THEME (Romantic pastels & cursive)
   ========================================== */
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
  return (
    <div className="flex-1 flex flex-col font-floral-body bg-[#FFF9F5] text-[#3D5A3D] selection:bg-[#D4A5A5] selection:text-white">
      
      {/* Whimsical Romantic Arch Hero */}
      <section className="relative py-32 px-6 text-center border-b border-[#F4E4E6] bg-[#FFF9F5] overflow-hidden">
        {/* Subtle romantic organic backdrop graphics */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F4E4E6]/45 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#A8B5A0]/20 blur-3xl -z-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-6 items-center">
          <span className="text-[11px] font-sans tracking-[0.25em] font-bold text-[#A8B5A0] uppercase">🌹 You Are Cordially Invited To Gather 🌹</span>
          
          {/* Portrait Curved Arch Frame - High Couture Bridal Look */}
          <div className="w-60 h-80 rounded-t-full border-4 border-[#F4E4E6] p-2 bg-white shadow-xl overflow-hidden my-4 transform hover:scale-[1.02] transition-transform duration-500">
            <img src={event.coverImage} className="w-full h-full object-cover rounded-t-full" alt="Lush Romantic Arch Portrait" />
          </div>

          <h1 className="text-5xl sm:text-7xl text-[#3D5A3D] font-floral-heading font-medium tracking-tight mt-3">
            {event.type === 'wedding' ? (
              <span className="flex flex-col items-center gap-1">
                <span className="text-4xl sm:text-5xl font-light font-sans text-[#D4A5A5] tracking-wide">The Marriage of</span>
                <span className="italic font-floral-heading">{event.brideName}</span>
                <span className="font-floral-script text-5xl sm:text-6xl text-[#C97064] my-1 font-bold">&</span>
                <span className="italic font-floral-heading">{event.groomName}</span>
              </span>
            ) : (
              <span className="italic font-floral-heading">{event.birthdayPerson}</span>
            )}
          </h1>

          <div className="w-24 h-[1px] bg-[#D4A5A5] my-2" />

          <p className="text-sm sm:text-base font-floral-heading italic text-[#D4A5A5] max-w-xl mx-auto leading-relaxed px-4">
            "{event.description}"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6 text-xs text-[#3D5A3D] tracking-wider font-semibold font-sans">
            <div className="bg-[#F4E4E6]/40 border border-[#D4A5A5]/30 px-6 py-3 rounded-full shadow-sm hover:bg-white transition-colors duration-300">
              🌸 DATE / {formatDateSafe(event.date, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="bg-[#F4E4E6]/40 border border-[#D4A5A5]/30 px-6 py-3 rounded-full shadow-sm hover:bg-white transition-colors duration-300">
              ⏱️ TIME / {event.time} PM STANDARD
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Romantic floral bloom circles) */}
      <section className="bg-[#F4E4E6]/30 border-b border-[#F4E4E6]/60 py-8 text-center">
        <span className="text-[10px] tracking-widest text-[#D4A5A5] uppercase font-bold block mb-2 font-sans">FLORAL BLOOM COUNTDOWN T-MINUS</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-floral-heading italic" themeColor="#D4A5A5" />
      </section>

      {/* Story (Lush watercolored journal entry) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-2xl mx-auto px-6 text-center flex flex-col gap-6 items-center">
          <Heart className="w-8 h-8 text-[#D4A5A5] fill-[#F4E4E6] animate-pulse" />
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase">BOTANICAL STORIES</span>
          <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic">Watercolored Roots</h2>
          <div className="w-16 h-0.5 bg-[#F4E4E6]" />
          <p className="text-sm sm:text-base leading-relaxed text-[#3D5A3D]/90 italic max-w-lg mt-2 font-light">
            "Like spring rose petals unfolding gently in the garden mist, we embark upon this watercolor journey. We invite you to witness our garden vows and share in our pastel dinner celebration."
          </p>
          <span className="font-floral-script text-4xl text-[#C97064]">Beautiful Together</span>
        </div>
      </section>

      {/* Itinerary (Botanical Leaf timeline nodes) */}
      {showProgram && (
        <section className="py-24 bg-[#FFF9F5] border-y border-[#F4E4E6] text-left">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">OUR ITINERARY FLOW</span>
              <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic">The Garden Proceedings</h2>
            </div>

            <div className="relative border-l-2 border-[#F4E4E6] pl-8 ml-6 flex flex-col gap-12">
              {(timelineSteps || []).map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Leaf indicator */}
                  <div className="absolute -left-[39px] top-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#D4A5A5] flex items-center justify-center shadow-sm group-hover:border-[#3D5A3D] transition-colors duration-300">
                    <span className="text-[8px] text-[#D4A5A5]">✿</span>
                  </div>
                  <div className="p-6 bg-white border border-[#F4E4E6] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <span className="text-[10px] font-sans font-bold text-[#C97064] tracking-wider bg-[#FFF9F5] border border-[#F4E4E6] px-3 py-1 rounded-full">
                      {item.time} PM
                    </span>
                    <h3 className="text-base font-floral-heading text-[#3D5A3D] mt-3 italic font-semibold">{item.title}</h3>
                    <p className="text-xs text-[#3D5A3D]/80 mt-2 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery (Botanical portraits) */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">OUR LOVE SNAPSHOTS</span>
            <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic mb-16">Lush Portraits</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="p-2 bg-white border border-[#F4E4E6] rounded-3xl shadow-md overflow-hidden hover:scale-[1.01] transition-transform duration-300 h-64">
                  <img src={img} className="w-full h-full object-cover rounded-2xl" alt="Lush Garden Frame" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue (Rose-framed botanical garden coordinates) */}
      <section className="py-24 bg-white border-t border-[#F4E4E6]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="text-left flex flex-col gap-6">
            <span className="text-[10px] font-sans tracking-widest text-[#A8B5A0] font-bold block uppercase">VENUE FLORA COORDINATES</span>
            <h2 className="text-3xl font-floral-heading text-[#3D5A3D] italic leading-tight">{getVenueFirstLine(event.venue)}</h2>
            <div className="w-12 h-0.5 bg-[#D4A5A5]" />
            
            <p className="text-xs text-[#3D5A3D]/90 leading-relaxed font-light">
              Join us amidst our glass greenhouse spaces at <strong className="text-[#3D5A3D] font-medium">{event.venue || 'Venue TBD'}</strong>. Soft pastel palettes, garden footwear, and romantic joy are highly encouraged.
            </p>

            <div className="flex flex-col gap-4 text-xs text-[#3D5A3D]/90 border-y border-[#F4E4E6]/50 py-6 my-2 font-sans">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#C97064]" />
                <span>{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#A8B5A0]" />
                <span>Dress Directives: <strong className="text-[#C97064] uppercase tracking-wider font-bold text-[11px]">{event.dressCode}</strong></span>
              </div>
            </div>

            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C97064] hover:bg-[#3D5A3D] text-white rounded-full text-xs font-bold tracking-wider font-sans uppercase shadow-md hover:shadow-lg transition-all self-start">
              <MapIcon className="w-4 h-4 text-white" />
              <span>LAUNCH GOOGLE DIRECTIONS MAP</span>
            </a>
          </div>

          <div className="border border-[#F4E4E6] p-2.5 bg-white rounded-3xl h-[280px] shadow-md overflow-hidden">
            <EventGoogleMap address={event.venue || ''} className="w-full h-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Gift Registry */}
      <section className="py-24 bg-[#FFF9F5] border-t border-[#F4E4E6]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="mb-16">
            <span className="text-[10px] tracking-[0.2em] text-[#A8B5A0] uppercase font-bold block mb-2 font-sans font-semibold">GIFT REGISTRY PORTALS</span>
            <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic">Rosy Gift Portals</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {(registryItems || []).map((item, idx) => (
              <div key={idx} className="bg-white border border-[#F4E4E6] p-8 rounded-3xl flex flex-col justify-between h-52 hover:shadow-md transition-shadow duration-300">
                <div>
                  <h3 className="text-xs font-bold text-[#3D5A3D] uppercase tracking-wider pb-2 border-b border-[#F4E4E6]/50 font-sans">{item.store}</h3>
                  <p className="text-xs text-[#3D5A3D]/80 leading-relaxed mt-4 font-light italic">"{item.note}"</p>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#C97064] hover:text-[#3D5A3D] uppercase tracking-wider pt-2 flex items-center gap-1 transition-colors font-sans">
                  LAUNCH REGISTER →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP Section (Couture wedding postcard) */}
      <section id="rsvp-anchor" className="py-24 bg-[#FFF9F5] border-t border-[#F4E4E6]/80">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2 font-sans">KINDLY CORRESPOND</span>
            <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic">Reserve Seat Presence</h2>
          </div>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="floral"
            theme={theme}
          />
        </div>
      </section>

      {/* Guestbook display */}
      <section className="py-24 bg-white border-t border-[#F4E4E6]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] font-sans tracking-[0.2em] text-[#A8B5A0] font-bold uppercase block mb-2">SHARED BLESSINGS</span>
            <h2 className="text-2xl sm:text-3xl font-floral-heading text-[#3D5A3D] italic">Visitor Floral Signatures</h2>
            <div className="w-8 h-[1px] bg-[#C97064] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-xs text-[#3D5A3D]/60 py-6 font-sans italic">Empty registers. Be the first to leave a blooming stamp!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-8 bg-[#FFF9F5] rounded-3xl border border-[#F4E4E6] flex flex-col justify-between min-h-[11rem] h-auto hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-[#F4E4E6]/25 rounded-bl-full pointer-events-none" />
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-[#F4E4E6] max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#3D5A3D]/90 italic leading-relaxed font-light font-floral-heading">"{entry.message}"</p>
                  <div className="border-t border-[#F4E4E6] pt-4 mt-4 flex justify-between items-center text-[10px] font-sans font-semibold">
                    <span className="uppercase tracking-wider text-[#3D5A3D]">{entry.name}</span>
                    <span className="text-[#A8B5A0] font-mono">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Floral Footer */}
      <footer className="bg-[#3D5A3D] text-[#FFF9F5]/90 py-16 text-center border-t border-[#F4E4E6] text-xs">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4 font-sans">
          <span className="text-xs text-[#A8B5A0] tracking-widest font-bold uppercase">PAM'S EVENTS GARDENS INC.</span>
          <p className="leading-relaxed text-[11px] text-[#FFF9F5]/70 font-light italic">"Sharing fine watercolor moments, glass greenhouse memories, and beautiful digital pathways."</p>
          <div className="h-[0.5px] bg-[#FFF9F5]/20 my-6" />
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
  return (
    <div className="flex-1 flex flex-col font-serif bg-amber-50/20 text-amber-950">
      {/* Heritage Letterpress Hero */}
      <section className="relative py-24 px-6 text-center border-b-4 border-double border-amber-900/40">
        <div className="absolute inset-0 z-0">
          <img src={event.coverImage} className="w-full h-full object-cover opacity-10 filter sepia-[30%]" alt="Heritage BG" />
          <div className="absolute inset-0 bg-amber-50/5" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 items-center">
          <span className="text-[10px] tracking-[0.25em] font-serif font-bold text-amber-800 uppercase">THE TRADITIONAL ANNOUNCEMENT</span>
          
          {/* Print Stock Card */}
          <div className="p-8 border-4 border-double border-amber-900/30 bg-white shadow-md w-full flex flex-col gap-4">
            <span className="text-amber-800 text-lg">⚜ Monogram ⚜</span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-amber-950 uppercase leading-none">
              {event.type === 'wedding' ? `${event.brideName} & ${event.groomName}` : event.birthdayPerson}
            </h1>
            <p className="text-xs text-amber-850 leading-relaxed max-w-md mx-auto italic mt-2">
              "{event.description}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4 text-xs font-semibold text-amber-900">
            <div className="bg-white border border-amber-200 px-4 py-2">
              📅 {formatDateSafe(event.date)}
            </div>
            <div className="bg-white border border-amber-200 px-4 py-2">
              ⏱️ {event.time} PM Standard Coordinate
            </div>
          </div>
        </div>
      </section>

      {/* Countdown (Traditional clock) */}
      <section className="bg-amber-100/40 border-b-2 border-double border-amber-900/30 py-6 text-center">
        <span className="text-[9px] tracking-widest text-amber-900 uppercase font-bold block mb-2">Heritage Time Remaining</span>
        <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-serif font-bold" themeColor="#78350f" />
      </section>

      {/* Traditional Letter Announcement */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-4 border border-amber-200 p-10 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-amber-950 uppercase">Dearest Friends and Family</h2>
          <p className="text-xs text-amber-850 leading-relaxed italic">
            "We take absolute honor in announcing the forthcoming celebration. Sharing in our lifework coordinates has been a true joy. We hope you will mark your coordinates to share in this celebratory program."
          </p>
          <div className="text-amber-400 mt-2">⚜ Signature ⚜</div>
        </div>
      </section>

      {/* Double column timeline */}
      {showProgram && (
        <section className="py-20 bg-amber-50/10 border-y border-amber-200 text-left">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 text-center uppercase tracking-wide mb-12">The Celebration Program</h2>
            <div className="flex flex-col gap-6">
              {(timelineSteps || []).map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-4 border-b border-amber-100 pb-4">
                  <div className="sm:col-span-3">
                    <span className="text-xs font-mono font-bold text-amber-800">{item.time} PM</span>
                  </div>
                  <div className="sm:col-span-9">
                    <h3 className="text-sm font-bold text-amber-950 uppercase">{item.title}</h3>
                    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 uppercase tracking-wider mb-12">Historical Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="border-2 border-double border-amber-900/30 p-1.5 bg-white h-60 overflow-hidden">
                  <img src={img} className="w-full h-full object-cover filter sepia-[20%]" alt="Traditional frame" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue coordinates */}
      <section className="py-20 bg-white border-t border-amber-200 text-left">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] tracking-widest text-amber-800 font-bold block mb-2 uppercase">VENUE REGISTRIES</span>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 uppercase mb-4">{getVenueFirstLine(event.venue)}</h2>
            <p className="text-xs text-amber-850 leading-relaxed mb-6 font-serif">
              Join us at our grand historical banquet halls located at <strong className="text-amber-950 font-semibold">{event.venue || 'Venue TBD'}</strong>. Valet carriage directors will coordinate your entrance pathways.
            </p>
            <div className="flex flex-col gap-3 text-xs text-amber-850 mb-6 font-serif">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-850" />
                <span>{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-850" />
                <span>Dress Guide: <strong className="text-amber-950">{event.dressCode}</strong></span>
              </div>
            </div>
            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-950 hover:bg-amber-900 text-white text-xs font-serif uppercase tracking-widest shadow-sm">
              <MapIcon className="w-4 h-4 text-amber-300" />
              <span>LAUNCH CARRIAGE GPS MAP</span>
            </a>
          </div>
          <div className="border-4 border-double border-amber-900/30 p-2 bg-white h-[240px] overflow-hidden">
            <EventGoogleMap address={event.venue || ''} className="w-full h-full" />
          </div>
        </div>
      </section>
      <section id="rsvp-anchor" className="py-20 bg-amber-50/20">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-950 text-center uppercase mb-10">RESPONSES CARD</h2>
 
          <RsvpForm
            event={event}
            guest={guest}
            onRsvpSuccess={onRsvpSuccess}
            themeId="traditional"
            theme={theme}
          />
        </div>
      </section>

      {/* Guestbook signature register */}
      <section className="py-20 bg-white border-t border-amber-200">
        <div className="max-w-2xl mx-auto px-6 text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-950 text-center uppercase tracking-wide mb-12">The Historical Guestbook</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-center text-xs text-amber-400">No classical registers logged yet. Be the first to stamp!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-6 bg-white border-2 border-double border-amber-900/20 flex flex-col justify-between min-h-[10rem] h-auto">
                  {entry.imageUrl && (
                    <div className="mb-3 border border-amber-900/30 p-1 bg-white max-h-48">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-40 object-cover filter sepia-[15%]" />
                    </div>
                  )}
                  <p className="text-xs text-amber-850 italic">"{entry.message}"</p>
                  <div className="border-t border-amber-100 pt-3 mt-4 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-amber-900">{entry.name}</span>
                    <span className="text-amber-450">{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Traditional Footer */}
      <footer className="bg-amber-950 text-amber-200/60 py-12 text-center border-t border-amber-900/60 text-xs">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-2 font-serif">
          <span className="text-xs text-amber-200 uppercase tracking-widest font-bold">PAM'S EVENTS HISTORICAL SYSTEMS</span>
          <p className="leading-normal text-[10px] text-amber-400/40">Sharing in the classical unions of societies. Under media coordinate registries.</p>
          <div className="h-[1px] bg-amber-900/60 my-4" />
          <span className="text-[9px] text-amber-400 tracking-wider">© 2026 PAM'S EVENTS PLATFORM LLC. ALL RIGHTS RESERVED.</span>
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
  return (
    <div className="flex-1 flex flex-col font-mono bg-white text-black text-left select-none p-6 sm:p-12">
      {/* Brutalist Raw Stack */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 font-mono text-xs">
        
        {/* Hero Section */}
        <header className="border-b border-black pb-12 flex flex-col gap-4">
          <span className="text-[9px] text-stone-400 uppercase tracking-widest">--- RAW_INPUT_INVITATION_SYS_STABLE ---</span>
          <h1 className="text-3xl sm:text-6xl uppercase tracking-widest font-bold text-black leading-none my-4">
            {event.type === 'wedding' ? `${event.brideName} / ${event.groomName}` : event.birthdayPerson}
          </h1>
          <p className="leading-relaxed text-black max-w-xl border-l-2 border-black pl-4">
            [ DESCRIPTION ]: {event.description}
          </p>
          <div className="flex flex-col gap-1 text-[10px] mt-2 text-stone-500">
            <div>DATE_METRIC : {formatDateSafe(event.date)}</div>
            <div>TIME_METRIC : {event.time} PM COORDINATES</div>
          </div>
        </header>

        {/* Countdown Ticker */}
        <section className="border-b border-black pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-3">[ T-MINUS CLOCK ]</span>
          <div className="flex justify-start">
            <Countdown targetDate={`${event.date || ''}T${event.time || ''}:00`} themeFontHeading="font-mono font-bold" themeColor="#000000" />
          </div>
        </section>

        {/* Narrative */}
        <section className="border-b border-black pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ NARRATIVE ]</span>
          <p className="leading-relaxed max-w-xl">
            This is a stark information terminal displaying instructions for the celebration of our milestone. Our database is verified, our paths are aligned, and our registers are open for submission.
          </p>
        </section>

        {/* Timeline table */}
        {showProgram && (
          <section className="border-b border-black pb-12">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ SCHEDULER_TABLE ]</span>
            <table className="w-full text-left border-collapse font-mono text-xs max-w-xl">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-2 uppercase font-bold text-black w-24">TIME</th>
                  <th className="py-2 uppercase font-bold text-black">DESCRIPTION_TAG</th>
                </tr>
              </thead>
              <tbody>
                {(timelineSteps || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-stone-200 font-light text-stone-700">
                    <td className="py-2.5 font-bold text-black">{item.time} PM</td>
                    <td className="py-2.5">
                      <div className="font-bold text-black uppercase">{item.title}</div>
                      <div className="text-[10px] mt-0.5 leading-relaxed">{item.desc}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Gallery */}
        {event.galleryImages && event.galleryImages.length > 0 && (
          <section className="border-b border-black pb-12">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ VISUAL_STREAM ]</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(event.galleryImages || []).map((img, idx) => (
                <div key={idx} className="border border-black aspect-video overflow-hidden">
                  <img src={img} className="w-full h-full object-cover filter grayscale" alt="Minimal stream" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Venue coordinates */}
        <section className="border-b border-black pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ VENUE_COORDINATES ]</span>
          <div className="max-w-xl">
            <h3 className="text-sm font-bold uppercase mb-2">{event.venue || 'Venue TBD'}</h3>
            <p className="text-stone-600 leading-relaxed mb-4">
              Direct valets to the coordinates listed below. Valet systems will match names against credential registers.
            </p>
            <div className="flex flex-col gap-1 text-[10px] text-stone-500 mb-6">
              <div>📍 LOC_MAP: {event.venue || 'Venue TBD'}</div>
              <div>👗 CODES: {event.dressCode}</div>
            </div>

            <div className="border border-black p-1 bg-white mb-6 h-[220px] overflow-hidden">
              <EventGoogleMap address={event.venue || ''} className="w-full h-full grayscale filter contrast-[1.15]" />
            </div>

            <a href={event.mapLink} target="_blank" rel="noreferrer" className="inline-block border border-black px-4 py-2 hover:bg-black hover:text-white uppercase font-bold text-[10px] tracking-widest transition-all">
              GO_GOOGLE_MAPS_REDIRECT
            </a>
          </div>
        </section>

        {/* RSVP FORM stark console */}
        <section id="rsvp-anchor" className="border-b border-black pb-12">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ RSVP_PORTAL ]</span>
          <div className="max-w-md">
            <RsvpForm
              event={event}
              guest={guest}
              onRsvpSuccess={onRsvpSuccess}
              themeId="minimal"
              theme={theme}
            />
          </div>
        </section>

        {/* Guestbook Board */}
        <section className="pb-12 border-b border-black">
          <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-4">[ BLESSINGS_MEM_LOGS ]</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(guestbook || []).length === 0 ? (
              <div className="col-span-2 text-stone-400 text-xs">No signatures registered. Be the first to append signature registers!</div>
            ) : (
              (guestbook || []).map((entry) => (
                <div key={entry.id} className="p-4 border border-black flex flex-col justify-between min-h-[9rem] h-auto">
                  {entry.imageUrl && (
                    <div className="mb-3 border border-black max-h-48 overflow-hidden">
                      <img src={entry.imageUrl} alt="Attached blessing memory" className="w-full h-36 object-cover grayscale" />
                    </div>
                  )}
                  <p className="text-black italic">"{entry.message}"</p>
                  <div className="border-t border-stone-200 pt-2 mt-4 flex justify-between items-center text-[9px] text-stone-500">
                    <span className="font-bold text-black uppercase">{entry.name}</span>
                    <span>{formatDateSafe(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-stone-400 text-[10px] pb-12 flex flex-col gap-1">
          <div>--- END_OF_STARK_TERMINAL_INSTRUCTIONS ---</div>
          <div className="uppercase">PAM'S EVENTS MINIMALIST SYSTEMS INC // ALL SYSTEM ENGINES ACTIVE</div>
          <div className="text-stone-300 font-mono mt-4">© 2026 PAM'S EVENTS. RIGHTS PERSIST.</div>
        </footer>

      </div>
    </div>
  );
};
