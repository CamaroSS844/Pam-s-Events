/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, CalendarCheck, EyeOff } from 'lucide-react';
import { getTheme } from '../../data/themes';
import { EventModel, Guest, GuestbookEntry } from '../../types';
import { mockApi } from '../../services/mockApi';
import { ThemeRenderer } from './ThemeRenderers';
import { BackgroundMusicPlayer } from '../../components/BackgroundMusicPlayer';

interface EventWebsiteProps {
  eventId: string;
  guestToken?: string | null;
  isGuestPreview?: boolean;
  customEventData?: Partial<EventModel>; // Used for live preview in Wizard
}

export const EventWebsite: React.FC<EventWebsiteProps> = ({
  eventId,
  guestToken,
  isGuestPreview = false,
  customEventData
}) => {
  // Load event details
  const [event, setEvent] = useState<EventModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  
  // RSVP Form States
  const [rsvpStatus, setRsvpStatus] = useState<'accepted' | 'declined'>('accepted');
  const [mealOption, setMealOption] = useState('Salmon Duo');
  const [companions, setCompanions] = useState(0);
  const [guestbookMsg, setGuestbookMsg] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Fallback Selector State to let users play with the Personalized Welcome features easily
  const [availableGuests, setAvailableGuests] = useState<Guest[]>([]);
  const [activeGuestToken, setActiveGuestToken] = useState<string>(guestToken || '');

  useEffect(() => {
    async function loadData() {
      if (eventId === 'preview' && customEventData) {
        // Mock preview event
        setEvent({
          id: 'preview',
          type: customEventData.type || 'wedding',
          status: 'draft',
          name: customEventData.name || "Preview Celebration",
          brideName: customEventData.brideName,
          groomName: customEventData.groomName,
          birthdayPerson: customEventData.birthdayPerson,
          date: customEventData.date || '2026-09-12',
          time: customEventData.time || '16:00',
          venue: customEventData.venue || 'The Glasshouse Conservatory, Seattle',
          description: customEventData.description || 'Join us for this special occasion!',
          themeId: customEventData.themeId || 'luxury',
          themeColor: customEventData.themeColor || '#D4AF37',
          dressCode: customEventData.dressCode || 'Formal Cocktail',
          mapLink: customEventData.mapLink || 'https://maps.google.com',
          coverImage: customEventData.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
          galleryImages: customEventData.galleryImages || [],
          heroBackground: customEventData.heroBackground || 'https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200',
          createdAt: new Date().toISOString(),
          clientId: 'mock-user',
          rsvpDeadline: customEventData.rsvpDeadline,
          musicUrl: customEventData.musicUrl,
          musicTitle: customEventData.musicTitle,
          musicAutoPlay: customEventData.musicAutoPlay
        });

        // Set static guest for preview mode
        setGuest({
          id: 'gst-preview',
          eventId: 'preview',
          name: "John Smith",
          phone: "+1 555-0100",
          email: "johnsmith@gmail.com",
          isVip: true,
          isFamily: false,
          tableNumber: "VIP Table 1",
          rsvpStatus: 'pending',
          companionsCount: 0,
          invitationOpened: true,
          token: 'evt1-smit'
        });

        setGuestbook([
          { id: 'gb-1', eventId: 'preview', name: 'Eleanor Vance', message: 'Absolutely stunning! Can’t wait to join you both!', timestamp: '2026-06-25T12:00:00Z' },
          { id: 'gb-2', eventId: 'preview', name: 'Benjamin Carter', message: 'A legendary party is cooking! See you there!', timestamp: '2026-06-26T14:30:00Z' }
        ]);
        setLoading(false);
        return;
      }

      // Load Real Event from DB
      setLoading(true);
      try {
        const matchedEvent = await mockApi.getEventById(eventId);
        if (matchedEvent) {
          setEvent(matchedEvent);
          const gb = await mockApi.getGuestbook(eventId);
          setGuestbook(gb);

          // Load Event Guests to allow interactive switching
          const allGuests = await mockApi.getGuests(eventId);
          setAvailableGuests(allGuests);

          // Find current guest
          if (activeGuestToken) {
            const matchedGuest = allGuests.find(g => g.token.toLowerCase() === activeGuestToken.toLowerCase());
            if (matchedGuest) {
              setGuest(matchedGuest);
              setRsvpStatus(matchedGuest.rsvpStatus === 'declined' ? 'declined' : 'accepted');
              if (matchedGuest.mealOption) setMealOption(matchedGuest.mealOption);
              setCompanions(matchedGuest.companionsCount);
              
              // Mark as opened
              if (!matchedGuest.invitationOpened) {
                await mockApi.updateGuest(matchedGuest.id, {
                  invitationOpened: true,
                  lastOpenedTime: new Date().toISOString()
                });
                mockApi.addRecentActivity(eventId, matchedGuest.name, 'opened_invitation', 'opened the invitation microsite');
              }
            }
          } else {
            setGuest(null);
          }
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error(err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId, activeGuestToken, customEventData]);

  // Dynamic Scroll Animation observer hook for smooth fade-in entrance animations
  useEffect(() => {
    if (loading || !event) return;

    // 1. Inject custom scroll animation CSS styles once
    const styleId = 'scroll-fade-in-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .scroll-fade-in {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .scroll-fade-in.is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // 2. Query and observe all content sections inside the template
    const timeout = setTimeout(() => {
      const sections = document.querySelectorAll('section');
      
      const observerOptions = {
        root: null,
        rootMargin: '-50px 0px -50px 0px',
        threshold: 0.05,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, observerOptions);

      sections.forEach((sec, idx) => {
        sec.classList.add('scroll-fade-in');
        // Instantly display the top hero section for a snappy initial loading experience
        if (idx === 0) {
          sec.classList.add('is-visible');
        } else {
          observer.observe(sec);
        }
      });

      return () => {
        observer.disconnect();
      };
    }, 100);

    return () => clearTimeout(timeout);
  }, [loading, event]);

  if (loading) {
    return (
      <div className="py-24 text-center bg-stone-50 min-h-screen flex flex-col items-center justify-center font-mono">
        <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <span className="text-xs text-zinc-500">Loading elegant event layouts...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-24 text-center bg-stone-50 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-amber-600">?</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-stone-100 mb-2">Microsite Not Found</h2>
          <p className="text-xs text-zinc-500 dark:text-stone-400 mb-6 leading-relaxed">
            The celebration microsite with reference or custom URL <code className="bg-stone-100 dark:bg-stone-950 px-1.5 py-0.5 rounded font-mono font-semibold">/{eventId}</code> was not found. Please verify the URL, or register a new site slug in your dashboard.
          </p>
          <a
            href="/"
            className="inline-flex justify-center items-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all"
          >
            Go to SaaS Console
          </a>
        </div>
      </div>
    );
  }

  if (event.status === 'taken_down') {
    return (
      <div className="py-24 text-center bg-stone-900 text-white min-h-screen flex flex-col items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-stone-950 border border-stone-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <EyeOff className="w-7 h-7" />
          </div>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
            Site Taken Down
          </span>
          <h2 className="text-xl font-bold font-serif text-white mb-2">{event.name}</h2>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            This invitation microsite has been taken down by the host and is currently offline. Please contact the event organizer directly for any event details or updates.
          </p>
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl text-[11px] text-stone-300 mb-6 flex flex-col gap-1.5 font-mono text-left">
            <span className="text-stone-500 font-bold uppercase text-[9px]">Event Reference</span>
            <span className="truncate">{event.venue}</span>
            <span className="text-amber-400 font-bold">{new Date(event.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <a
            href="/"
            className="inline-flex justify-center items-center w-full bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs px-5 py-3 rounded-xl transition-all border border-stone-700"
          >
            Go to SaaS Platform
          </a>
        </div>
      </div>
    );
  }

  // Get active theme settings
  const theme = getTheme(event.themeId);

  // Use customized timeline steps if available, otherwise fall back to defaults
  const timelineSteps = event.timelineSteps || (event.type === 'wedding' ? [
    { time: "3:30 PM", title: "Ceremonial Reception & Guest Entrance", desc: "Arrive at the glass conservatory garden paths, soundscape piano acoustics begin." },
    { time: "4:00 PM", title: "Vows Exchange & Sand Distribution", desc: "The couples deliver customized letters beneath the timber flower arch." },
    { time: "5:00 PM", title: "Cocktails & Photo Session Session", desc: "Enjoy champagne, botanic mocktails, and fresh visual portrait captures." },
    { time: "6:30 PM", title: "Dinner Banquets & Heartfelt Speeches", desc: "A curated three-course dinner, followed by sibling and parent toasts." },
    { time: "8:30 PM", title: "DJ Grooves & Dancefloor Expansion", desc: "Live music mixers, high energy visual lights, and late-night visual cake service." }
  ] : [
    { time: "7:30 PM", title: "Speakeasy Secret Ingress", desc: "Unlock the gate coordinates, dress code credential validations." },
    { time: "8:00 PM", title: "Jazz Quintet & Mixology Pairings", desc: "Craft cocktails served beside comfortable leather lounge chairs." },
    { time: "9:30 PM", title: "Gala Toasting & Roast Speeches", desc: "Friends deliver retrospective stories of Benjamin’s decades." },
    { time: "10:30 PM", title: "Midnight Beats & Dynamic DJ Tunnels", desc: "Dance and celebrate into the late hours under custom neon arches." }
  ]);

  // Registry options
  const registryItems = [
    { store: "Crate & Barrel Wedding", link: "https://www.crateandbarrel.com", note: "Kitchen utensils, fine glass collection, and organic dining linens." },
    { store: "Amazon Global Register", link: "https://www.amazon.com/wedding", note: "Home robotics, travel luggage arrays, and garden furniture." },
    { store: "Honeyfund Honeymoon Escape", link: "https://www.honeyfund.com", note: "Contribute to our flight coordinates and food tasting tours across Italy." }
  ];

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRsvp(true);

    try {
      if (guest) {
        // Save guest rsvp status
        const updated = await mockApi.updateGuest(guest.id, {
          rsvpStatus: rsvpStatus,
          mealOption: rsvpStatus === 'accepted' ? mealOption : undefined,
          companionsCount: rsvpStatus === 'accepted' ? companions : 0,
          responseDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        setGuest(updated);

        // Add guestbook message if filled
        if (guestbookMsg) {
          await mockApi.addGuestbookEntry(event.id, guest.name, guestbookMsg);
          const freshGb = await mockApi.getGuestbook(event.id);
          setGuestbook(freshGb);
          setGuestbookMsg('');
        }

        // Add recent activities log
        mockApi.addRecentActivity(
          event.id, 
          guest.name, 
          rsvpStatus === 'accepted' ? 'rsvp_accepted' : 'rsvp_declined',
          rsvpStatus === 'accepted' 
            ? `accepted invitation (Meal: ${mealOption}, Party of ${companions + 1})`
            : `declined invitation`
        );

        setRsvpSubmitted(true);
      } else {
        // Anonymous/Public Guest RSVP submission
        await mockApi.addGuestbookEntry(event.id, "Public Supporter", guestbookMsg || "Wishing you absolute happiness!");
        const freshGb = await mockApi.getGuestbook(event.id);
        setGuestbook(freshGb);
        setGuestbookMsg('');
        setRsvpSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleScrollToRsvp = () => {
    const element = document.getElementById('rsvp-anchor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRsvpSuccess = (updatedGuest: Guest) => {
    setGuest(updatedGuest);
    setRsvpStatus(updatedGuest.rsvpStatus === 'declined' ? 'declined' : 'accepted');
    setCompanions(updatedGuest.companionsCount);
    setRsvpSubmitted(true);
    mockApi.getGuestbook(eventId).then(gb => setGuestbook(gb));
  };

  return (
    <div className={`min-h-screen ${theme.bgColor} ${theme.textColor} ${theme.fontBody} flex flex-col justify-between selection:bg-stone-900 selection:text-white transition-all duration-300`}>
      
      {/* Personalized Welcome Header Bar (Float) */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-zinc-150 py-3.5 px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold shadow-sm text-zinc-800">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="font-serif italic text-zinc-900 font-bold">{event.name}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Personalized Welcomer Callout */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Greeting Tone:</span>
            {guest ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 py-1 px-3 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Welcome, {guest.name}
              </span>
            ) : (
              <span className="bg-stone-100 text-zinc-600 border border-zinc-200 py-1 px-3 rounded-full font-bold">
                Dear Guest
              </span>
            )}
          </div>

          {/* Guest Selector Widget for testing */}
          {!isGuestPreview && availableGuests.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Test Guest Token:</label>
              <select 
                value={activeGuestToken} 
                onChange={(e) => setActiveGuestToken(e.target.value)}
                className="bg-white border border-zinc-250 py-1 px-2.5 rounded-lg text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="">Generic (Dear Guest)</option>
                {availableGuests.map(g => (
                  <option key={g.id} value={g.token}>{g.name} ({g.rsvpStatus})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Multi-Theme Page Body */}
      <ThemeRenderer 
        event={event}
        guest={guest}
        guestbook={guestbook}
        rsvpStatus={rsvpStatus}
        setRsvpStatus={setRsvpStatus}
        mealOption={mealOption}
        setMealOption={setMealOption}
        companions={companions}
        setCompanions={setCompanions}
        guestbookMsg={guestbookMsg}
        setGuestbookMsg={setGuestbookMsg}
        isSubmittingRsvp={isSubmittingRsvp}
        rsvpSubmitted={rsvpSubmitted}
        setRsvpSubmitted={setRsvpSubmitted}
        handleRsvpSubmit={handleRsvpSubmit}
        onRsvpSuccess={handleRsvpSuccess}
        timelineSteps={timelineSteps}
        registryItems={registryItems}
        theme={theme}
      />

      {/* Background Music & Audio Controller */}
      <BackgroundMusicPlayer
        musicUrl={event.musicUrl}
        musicTitle={event.musicTitle || event.name}
        autoPlay={event.musicAutoPlay !== false}
        primaryColor={theme.primaryColor}
      />

      {/* Floating RSVP Quick Access Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative group">
          {/* Animated pulsing background glow ring */}
          <div 
            className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 blur-md transition duration-1000 group-hover:duration-200 animate-pulse"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <button
            id="rsvp-fab-button"
            onClick={handleScrollToRsvp}
            className="relative px-5 py-3.5 rounded-full flex items-center gap-2.5 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: theme.primaryColor, 
              color: '#ffffff',
              boxShadow: `0 10px 25px -5px ${theme.primaryColor}50`
            }}
          >
            <CalendarCheck className="w-4 h-4 text-white animate-bounce" />
            <span className="tracking-wider uppercase font-semibold">RSVP Quick Access</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
