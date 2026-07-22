/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { EventModel, Guest, User, RecentActivity, GuestbookEntry, EventStatus, ThemeId, PortfolioItem, Testimonial, Package } from '../types';

// Helper to simulate network latency
const delay = (ms: number = 350) => new Promise(resolve => setTimeout(resolve, ms));

const INITIAL_EVENTS: EventModel[] = [
  {
    id: 'evt-1',
    type: 'wedding',
    status: 'published',
    name: "Evelyn & Arthur's Wedding Nuptials",
    brideName: "Evelyn Vance",
    groomName: "Arthur Pendelton",
    date: "2026-09-12",
    time: "15:30",
    venue: "The Glasshouse Conservatory, Seattle, WA",
    description: "Please join us in celebrating our union, surrounded by towering glass walls, lush ferns, and beautiful candlelight. Dinner, cocktails, and dancing to follow.",
    themeId: 'luxury',
    themeColor: '#D4AF37',
    dressCode: "Black Tie Optional - Elegant shades of emerald and champagne are encouraged.",
    mapLink: "https://maps.google.com/?q=The+Glasshouse+Conservatory+Seattle",
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600"
    ],
    heroBackground: "https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200",
    guestCount: 22,
    rsvpCount: 16,
    createdAt: "2026-05-15T09:30:00Z",
    clientId: "usr-client",
    clientNumber: "211",
    slug: "factory-a",
    musicUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    musicTitle: "Acoustic Piano Romance",
    musicAutoPlay: true,
    dashboardData: { dailyAnomalyRate: "0.14%", currentTemperature: "42.1°C", queueLoad: "4%" }
  },
  {
    id: 'evt-2',
    type: 'birthday',
    status: 'published',
    name: "Benjamin's Gatsby 30th Gala",
    birthdayPerson: "Benjamin Carter",
    date: "2026-10-24",
    time: "20:00",
    venue: "The Speakeasy Vault, Chicago, IL",
    description: "Welcome to the Roaring Twenties! A high-energy evening of live jazz, curated mixology, and dynamic retro dance beats. Feathers, gold trim, and sharp suits are strictly expected.",
    themeId: 'modern',
    themeColor: '#1E40AF',
    dressCode: "1920s Speakeasy Chic - Velvet, pearls, bowties, and gold accents.",
    mapLink: "https://maps.google.com/?q=The+Speakeasy+Vault+Chicago",
    coverImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
    ],
    heroBackground: "https://images.unsplash.com/photo-1481162854517-d9e353af153d?auto=format&fit=crop&q=80&w=1200",
    guestCount: 15,
    rsvpCount: 9,
    createdAt: "2026-05-20T14:15:00Z",
    clientId: "usr-client",
    clientNumber: "212",
    slug: "factory-b",
    musicUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73229.mp3?filename=jazzy-abstract-beat-11254.mp3",
    musicTitle: "Gatsby Speakeasy Jazz",
    musicAutoPlay: true,
    dashboardData: { dailyAnomalyRate: "0.08%", currentTemperature: "38.5°C", queueLoad: "2%" }
  },
  {
    id: 'evt-3',
    type: 'wedding',
    status: 'draft',
    name: "Sophia & Mateo's Rustic Barn Nuptials",
    brideName: "Sophia Miller",
    groomName: "Mateo Silva",
    date: "2026-11-07",
    time: "14:00",
    venue: "Heritage Oak Farm, Sonoma, CA",
    description: "An intimate country gathering among ancient oaks, field stone fences, and string lit timber arches.",
    themeId: 'rustic',
    themeColor: '#15803D',
    dressCode: "Country Smart Casual - Earthy tones, boots welcome, cozy layers suggested.",
    mapLink: "https://maps.google.com/?q=Heritage+Oak+Farm+Sonoma",
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200",
    galleryImages: [],
    heroBackground: "https://images.unsplash.com/photo-1510076857177-747389181798?auto=format&fit=crop&q=80&w=1200",
    guestCount: 5,
    rsvpCount: 0,
    createdAt: "2026-06-10T11:00:00Z",
    clientId: "usr-client",
    clientNumber: "213",
    slug: "sonoma-barn"
  },
  {
    id: 'evt-4',
    type: 'wedding',
    status: 'pending_approval',
    name: "Isabella & Oliver's Botanical Garden Marriage",
    brideName: "Isabella Rose",
    groomName: "Oliver Thorne",
    date: "2026-08-28",
    time: "16:00",
    venue: "Royal Botanical Greenhouse, London, UK",
    description: "An elegant glasshouse celebration with botanical mocktails, fresh rose petal distributions, and classical harp accompaniment.",
    themeId: 'floral',
    themeColor: '#DB2777',
    dressCode: "Floral Formal - Pastel suits, flower accessories, elegant hats.",
    mapLink: "https://maps.google.com/?q=Kew+Botanical+Gardens+London",
    coverImage: "https://images.unsplash.com/photo-1544078751-58feb2dcbfa7?auto=format&fit=crop&q=80&w=1200",
    galleryImages: [],
    heroBackground: "https://images.unsplash.com/photo-1490750967868-882361d1b86c?auto=format&fit=crop&q=80&w=1200",
    guestCount: 8,
    rsvpCount: 2,
    createdAt: "2026-06-25T16:45:00Z",
    clientId: "usr-client",
    clientNumber: "214",
    slug: "london-botanical"
  }
];

const INITIAL_GUESTS: Guest[] = [
  // Guests for Evelyn & Arthur's Wedding
  { id: 'gst-1', eventId: 'evt-1', name: "Jonathan & Mary Sterling", phone: "+1 (206) 555-0143", email: "sterling.j@outlook.com", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'accepted', mealOption: 'Salmon Duo', companionsCount: 1, invitationOpened: true, lastOpenedTime: "2026-06-20T15:20:00Z", token: "evt1-ster" },
  { id: 'gst-2', eventId: 'evt-1', name: "Eleanor Vance", phone: "+1 (206) 555-0188", email: "vance.eleanor@gmail.com", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'accepted', mealOption: 'Vegan Garden Tart', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-21T10:12:00Z", token: "evt1-vanc" },
  { id: 'gst-3', eventId: 'evt-1', name: "Marcus Brody", phone: "+1 (312) 555-9234", email: "marcus.brody@museum.org", isVip: false, isFamily: false, tableNumber: "Table 4", rsvpStatus: 'accepted', mealOption: 'Prime Filet', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-25T11:45:00Z", token: "evt1-brod" },
  { id: 'gst-4', eventId: 'evt-1', name: "Dr. Henry Jones Jr.", phone: "+1 (213) 555-1290", email: "indy.j@marshall.edu", isVip: true, isFamily: false, tableNumber: "Table 2", rsvpStatus: 'declined', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-22T08:30:00Z", token: "evt1-jone" },
  { id: 'gst-5', eventId: 'evt-1', name: "Sarah & David Albright", phone: "+1 (206) 555-4819", email: "salbright@hotmail.com", isVip: false, isFamily: true, tableNumber: "Table 2", rsvpStatus: 'pending', companionsCount: 1, invitationOpened: false, token: "evt1-albr" },
  { id: 'gst-6', eventId: 'evt-1', name: "Julian & Clara Pendelton", phone: "+1 (617) 555-8831", email: "c.pendelton@post.harvard.edu", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'accepted', mealOption: 'Prime Filet', companionsCount: 1, invitationOpened: true, lastOpenedTime: "2026-06-24T18:10:00Z", token: "evt1-pend" },
  { id: 'gst-7', eventId: 'evt-1', name: "Michael Chang", phone: "+1 (415) 555-7721", email: "chang.m@techcorp.com", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'accepted', mealOption: 'Salmon Duo', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-26T22:15:00Z", token: "evt1-chan" },
  { id: 'gst-8', eventId: 'evt-1', name: "Jessica Abbott", phone: "+1 (206) 555-2200", email: "jess.abbott@outlook.com", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'pending', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-28T14:40:00Z", token: "evt1-abbo" },
  { id: 'gst-9', eventId: 'evt-1', name: "Siddharth Nair", phone: "+1 (206) 555-3941", email: "snair@consulting.com", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'declined', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-23T09:15:00Z", token: "evt1-nair" },
  { id: 'gst-10', eventId: 'evt-1', name: "Professor Helena Shaw", phone: "+44 7700 900077", email: "h.shaw@archaeology.ox.ac.uk", isVip: false, isFamily: false, tableNumber: "Table 4", rsvpStatus: 'accepted', mealOption: 'Vegan Garden Tart', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-27T17:12:00Z", token: "evt1-shaw" },
  { id: 'gst-11', eventId: 'evt-1', name: "John Smith", phone: "+1 (206) 555-9081", email: "johnsmith@gmail.com", isVip: false, isFamily: false, tableNumber: "Table 5", rsvpStatus: 'pending', companionsCount: 0, invitationOpened: false, token: "evt1-smit" },

  // Guests for Benjamin's Gatsby 30th Gala
  { id: 'gst-12', eventId: 'evt-2', name: "Daisy Buchanan", phone: "+1 (312) 555-1922", email: "daisy@east-egg.com", isVip: true, isFamily: false, tableNumber: "VIP Couch A", rsvpStatus: 'accepted', mealOption: 'Lobster Croquette', companionsCount: 1, invitationOpened: true, lastOpenedTime: "2026-06-22T21:05:00Z", token: "evt2-dais" },
  { id: 'gst-13', eventId: 'evt-2', name: "Nick Carraway", phone: "+1 (312) 555-1925", email: "nick.carraway@bondtrader.com", isVip: true, isFamily: false, tableNumber: "VIP Couch B", rsvpStatus: 'accepted', mealOption: 'Prime Filet Rib', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-23T11:45:00Z", token: "evt2-nick" },
  { id: 'gst-14', eventId: 'evt-2', name: "Jordan Baker", phone: "+1 (312) 555-8912", email: "jordan.b@golf-pro.org", isVip: false, isFamily: false, tableNumber: "Table 2", rsvpStatus: 'accepted', mealOption: 'Lobster Croquette', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-24T14:30:00Z", token: "evt2-jord" },
  { id: 'gst-15', eventId: 'evt-2', name: "George Wilson", phone: "+1 (708) 555-3041", email: "wilson.garage@yahoo.com", isVip: false, isFamily: false, tableNumber: "Table 4", rsvpStatus: 'declined', companionsCount: 0, invitationOpened: true, lastOpenedTime: "2026-06-21T09:22:00Z", token: "evt2-geor" },
  { id: 'gst-16', eventId: 'evt-2', name: "Catherine & Tom Meyers", phone: "+1 (312) 555-4491", email: "meyers.cat@gmail.com", isVip: false, isFamily: true, tableNumber: "Table 3", rsvpStatus: 'pending', companionsCount: 1, invitationOpened: false, token: "evt2-caty" },
  { id: 'gst-17', eventId: 'evt-2', name: "Meyer Wolfsheim", phone: "+1 (212) 555-0010", email: "meyer@cufflinks.net", isVip: true, isFamily: false, tableNumber: "VIP Box", rsvpStatus: 'accepted', mealOption: 'Prime Filet Rib', companionsCount: 2, invitationOpened: true, lastOpenedTime: "2026-06-26T23:50:00Z", token: "evt2-wolf" }
];

const INITIAL_GUESTBOOK_ENTRIES: GuestbookEntry[] = [
  { id: 'gb-1', eventId: 'evt-1', name: "Jonathan & Mary Sterling", message: "We are absolutely overjoyed to witness your beautiful day! Counting down the seconds!", timestamp: "2026-06-20T15:25:00Z" },
  { id: 'gb-2', eventId: 'evt-1', name: "Eleanor Vance", message: "My dear Evelyn, you are going to be the most breathtaking bride. Arthur, welcome to our family. All my infinite love!", timestamp: "2026-06-21T10:15:00Z" },
  { id: 'gb-3', eventId: 'evt-1', name: "Julian & Clara Pendelton", message: "Congratulations Arthur and Evelyn! We are so looking forward to raising a glass with you in Seattle.", timestamp: "2026-06-24T18:15:00Z" },
  { id: 'gb-4', eventId: 'evt-2', name: "Daisy Buchanan", message: "Benjamin! 30 looks sparkling on you, darling! Gatsby himself would be absolutely jealous of this grand venue.", timestamp: "2026-06-22T21:10:00Z" }
];

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { id: 'p-1', title: "Evelyn & Arthur's Conservatory Union", type: 'wedding', image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600", client: "Evelyn Vance", date: "Sept 2026", description: "An organic greenhouse wonderland illuminated by floating candelabras and lush cascading foliage." },
  { id: 'p-2', title: "Aria's Secret Garden 1st Birthday", type: 'birthday', image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600", client: "Clarissa Montgomery", date: "May 2026", description: "Whimsical floral structures, giant bunny plush assemblies, and interactive bubble performance zones." },
  { id: 'p-3', title: "Elena & Richard's Coastal Minimal Wedding", type: 'wedding', image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600", client: "Elena Rostova", date: "April 2026", description: "High architectural symmetry on a cliff overlooking the Pacific, utilizing stark white marble elements." }
];

const INITIAL_TESTIMONIALS: Testimonial[] = [
  { id: 't-1', name: "Madeline & Robert", role: "Wedding Clients", text: "The microsite builder was an absolute dream. Our guests were stunned by the elegant gold accents and the interactive timeline. The RSVP portal saved us endless coordination hours!", rating: 5, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
  { id: 't-2', name: "Xavier Hernandez", role: "Gala Birthday Client", text: "We wanted a sleek, tech-forward feel for my 40th, and the Modern Navy theme delivered exactly that. Direct Google Maps links and custom food option tallies were perfect.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" },
  { id: 't-3', name: "Victoria Thorne", role: "Wedding Coordinator", text: "As a professional planner, the admin approval stream and clean CSV guest spreadsheet import are absolute lifesavers. This is the highest standard in digital invites today.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" }
];

const INITIAL_PACKAGES: Package[] = [
  { id: 'pkg-1', name: "Essential digital", price: "$299", description: "The essential digital invitation package with standard premium styling templates.", features: ["Single Event Website", "2 Premium Standard Themes", "Up to 100 Guest RSVPs", "Email Delivery Dashboard", "Direct Map Integrations", "Standard Support"] },
  { id: 'pkg-2', name: "Elite Celebration", price: "$599", description: "Perfect for full-scale weddings and larger parties requiring advanced personalization and tools.", features: ["Single Event Website", "All 7 Premium Themes", "Unlimited Guest RSVPs", "Personalized Guest Tokens & Welcomes", "Interactive QR Code Generator", "Dynamic Meal & RSVP Analytics", "Photo & Video Gallery (Up to 2GB)", "Priority Support"], popular: true },
  { id: 'pkg-3', name: "Platinum Media Bundle", price: "$1,499", description: "A high-end comprehensive service including physical photography, videography, and microsite setup.", features: ["All Elite Digital Features", "Creative Consultation Block (2 hours)", "Professional Photo Session (4 hours)", "Drone Venue Footage Video Clip", "Assigned Concierge Designer", "Premium Domain Mapping Support", "Dedicated VIP WhatsApp Assistance"] }
];

// Seed databases in localStorage if not already present
function initDb() {
  if (!localStorage.getItem('event_platform_events')) {
    localStorage.setItem('event_platform_events', JSON.stringify(INITIAL_EVENTS));
  } else {
    // Migration: ensure every existing event has a clientNumber, slug, and camera configurations
    try {
      const stored = localStorage.getItem('event_platform_events');
      if (stored) {
        const events: EventModel[] = JSON.parse(stored);
        let changed = false;
        events.forEach((evt, idx) => {
          if (!evt.clientNumber) {
            // map evt-1, evt-2, evt-3, evt-4 directly, others incrementally
            if (evt.id === 'evt-1') evt.clientNumber = '211';
            else if (evt.id === 'evt-2') evt.clientNumber = '212';
            else if (evt.id === 'evt-3') evt.clientNumber = '213';
            else if (evt.id === 'evt-4') evt.clientNumber = '214';
            else {
              evt.clientNumber = (215 + idx).toString();
            }
            changed = true;
          }
          if (!evt.slug) {
            if (evt.id === 'evt-1' || evt.clientNumber === '211') evt.slug = 'factory-a';
            else if (evt.id === 'evt-2' || evt.clientNumber === '212') evt.slug = 'factory-b';
            else if (evt.id === 'evt-3' || evt.clientNumber === '213') evt.slug = 'sonoma-barn';
            else if (evt.id === 'evt-4' || evt.clientNumber === '214') evt.slug = 'london-botanical';
            else {
              evt.slug = `site-${evt.clientNumber || evt.id}`;
            }
            changed = true;
          }
          if (!evt.dashboardData) {
            evt.dashboardData = evt.slug === 'factory-b'
              ? { dailyAnomalyRate: "0.08%", currentTemperature: "38.5°C", queueLoad: "2%" }
              : { dailyAnomalyRate: "0.14%", currentTemperature: "42.1°C", queueLoad: "4%" };
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('event_platform_events', JSON.stringify(events));
        }
      }
    } catch (err) {
      console.warn("Migration failed to parse events:", err);
    }
  }
  if (!localStorage.getItem('event_platform_guests')) {
    localStorage.setItem('event_platform_guests', JSON.stringify(INITIAL_GUESTS));
  }
  if (!localStorage.getItem('event_platform_guestbook')) {
    localStorage.setItem('event_platform_guestbook', JSON.stringify(INITIAL_GUESTBOOK_ENTRIES));
  }
  if (!localStorage.getItem('event_platform_portfolio')) {
    localStorage.setItem('event_platform_portfolio', JSON.stringify(INITIAL_PORTFOLIO));
  }
  if (!localStorage.getItem('event_platform_testimonials')) {
    localStorage.setItem('event_platform_testimonials', JSON.stringify(INITIAL_TESTIMONIALS));
  }
  if (!localStorage.getItem('event_platform_packages')) {
    localStorage.setItem('event_platform_packages', JSON.stringify(INITIAL_PACKAGES));
  }
  // Seeding master users list
  const usersStr = localStorage.getItem('event_platform_users');
  const defaultUsers: User[] = [
    { id: 'usr-admin', name: "Marcus Aurelius (Admin)", email: "admin@test.com", role: 'admin', eventLimit: 999, isBlocked: false, password: '123456789', avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" },
    { id: 'usr-client', name: "Eleanor Vance", email: "client@test.com", role: 'client', eventLimit: 3, isBlocked: false, password: '123456789', avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" }
  ];
  if (!usersStr) {
    localStorage.setItem('event_platform_users', JSON.stringify(defaultUsers));
  } else {
    // Overwrite/update 'any' or missing passwords for demo accounts to '123456789' for robustness
    try {
      let parsedUsers: User[] = JSON.parse(usersStr);
      let changed = false;
      parsedUsers = parsedUsers.map(u => {
        if (u.email.toLowerCase() === 'admin@test.com' && (u.password === 'any' || !u.password)) {
          u.password = '123456789';
          changed = true;
        }
        if (u.email.toLowerCase() === 'client@test.com' && (u.password === 'any' || !u.password)) {
          u.password = '123456789';
          changed = true;
        }
        return u;
      });
      if (changed) {
        localStorage.setItem('event_platform_users', JSON.stringify(parsedUsers));
      }
    } catch (e) {
      localStorage.setItem('event_platform_users', JSON.stringify(defaultUsers));
    }
  }
  // Simulated Logged-In User
  if (!localStorage.getItem('event_platform_current_user')) {
    const defaultUser: User = { id: 'usr-client', name: "Eleanor Vance", email: "client@test.com", role: 'client', eventLimit: 3, isBlocked: false, password: '123456789', avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" };
    localStorage.setItem('event_platform_current_user', JSON.stringify(defaultUser));
  }
  
  // Asynchronously seed Firestore if empty
  (async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        const users: User[] = JSON.parse(localStorage.getItem('event_platform_users') || '[]');
        for (const u of users) {
          await setDoc(doc(db, 'users', u.id), u);
        }
      }
      const eventsSnap = await getDocs(collection(db, 'events'));
      if (eventsSnap.empty) {
        const events: EventModel[] = JSON.parse(localStorage.getItem('event_platform_events') || '[]');
        for (const e of events) {
          await setDoc(doc(db, 'events', e.id), e);
        }
      }
    } catch (e) {
      console.warn("Firestore initialization sync skipped:", e);
    }
  })();
}

initDb();

export const mockApi = {
  // Authentication Actions
  async getCurrentUser(): Promise<User | null> {
    await delay(150);
    const data = localStorage.getItem('event_platform_current_user');
    if (!data) return null;
    const currentUser: User = JSON.parse(data);
    
    // Always refresh user info from master list to reflect real-time blocking/unblocking
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    const users: User[] = JSON.parse(usersStr);
    const refreshed = users.find(u => u.id === currentUser.id);
    if (refreshed) {
      if (refreshed.isBlocked) {
        localStorage.removeItem('event_platform_current_user');
        localStorage.removeItem('wokemedia_logged_in_user');
        return null;
      }
      return refreshed;
    }
    return currentUser;
  },

  async login(email: string, password?: string): Promise<User> {
    await delay(400);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);

    // Find if user already exists
    let matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      throw new Error("Account not found. Please register or check your credentials.");
    }

    if (password && matchedUser.password !== password) {
      throw new Error("Invalid password. Please try again.");
    }

    if (matchedUser.isBlocked) {
      throw new Error("This account has been blocked by the administrator.");
    }

    // Keep logged-in user state in sync across keys
    localStorage.setItem('event_platform_current_user', JSON.stringify(matchedUser));
    localStorage.setItem('wokemedia_logged_in_user', JSON.stringify(matchedUser));
    return matchedUser;
  },

  async logout(): Promise<void> {
    await delay(100);
    localStorage.removeItem('event_platform_current_user');
    localStorage.removeItem('wokemedia_logged_in_user');
  },

  // Users Management API (Admin only)
  async getUsers(): Promise<User[]> {
    await delay(200);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    return JSON.parse(usersStr);
  },

  async createUser(name: string, email: string, role: 'client' | 'admin', eventLimit: number, password = 'any'): Promise<User> {
    await delay(300);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    const users: User[] = JSON.parse(usersStr);

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("A user with this email address already exists.");
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      eventLimit: role === 'admin' ? 999 : eventLimit,
      isBlocked: false,
      password,
      avatar: role === 'admin' 
        ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    };

    users.push(newUser);
    localStorage.setItem('event_platform_users', JSON.stringify(users));

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${newUser.id}`);
    }

    return newUser;
  },

  async createClientUser(name: string, email: string, eventLimit: number, password = 'any'): Promise<User> {
    return this.createUser(name, email, 'client', eventLimit, password);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(200);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);

    let updated: User | null = null;
    users = users.map(u => {
      if (u.id === id) {
        updated = { ...u, ...updates };
        return updated;
      }
      return u;
    });

    if (!updated) throw new Error("User not found.");
    localStorage.setItem('event_platform_users', JSON.stringify(users));

    try {
      await updateDoc(doc(db, 'users', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${id}`);
    }

    return updated;
  },

  async deleteUser(id: string): Promise<void> {
    await delay(250);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);
    users = users.filter(u => u.id !== id);
    localStorage.setItem('event_platform_users', JSON.stringify(users));

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }

    // Cascade delete events created by this user
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    let events: EventModel[] = JSON.parse(eventsStr);
    const userEvents = events.filter(e => e.clientId === id);
    const userEventIds = userEvents.map(e => e.id);
    
    events = events.filter(e => e.clientId !== id);
    localStorage.setItem('event_platform_events', JSON.stringify(events));

    // Cascade delete guests from those events
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);
    guests = guests.filter(g => !userEventIds.includes(g.eventId));
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));
  },

  async bulkUpdateUsersBlockStatus(ids: string[], isBlocked: boolean): Promise<void> {
    await delay(300);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);

    users = users.map(u => {
      if (ids.includes(u.id)) {
        return { ...u, isBlocked };
      }
      return u;
    });

    localStorage.setItem('event_platform_users', JSON.stringify(users));
  },

  async bulkUpdateUsersQuota(ids: string[], eventLimit: number): Promise<void> {
    await delay(300);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);

    users = users.map(u => {
      if (ids.includes(u.id)) {
        return { ...u, eventLimit: u.role === 'admin' ? 999 : eventLimit };
      }
      return u;
    });

    localStorage.setItem('event_platform_users', JSON.stringify(users));
  },

  async bulkDeleteUsers(ids: string[]): Promise<void> {
    await delay(400);
    const usersStr = localStorage.getItem('event_platform_users') || '[]';
    let users: User[] = JSON.parse(usersStr);
    users = users.filter(u => !ids.includes(u.id));
    localStorage.setItem('event_platform_users', JSON.stringify(users));

    // Cascade delete events created by these users
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    let events: EventModel[] = JSON.parse(eventsStr);
    const affectedEvents = events.filter(e => ids.includes(e.clientId));
    const affectedEventIds = affectedEvents.map(e => e.id);

    events = events.filter(e => !ids.includes(e.clientId));
    localStorage.setItem('event_platform_events', JSON.stringify(events));

    // Cascade delete guests from those events
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);
    guests = guests.filter(g => !affectedEventIds.includes(g.eventId));
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));
  },

  // Events API
  async getEvents(): Promise<EventModel[]> {
    await delay(400);
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    const events: EventModel[] = JSON.parse(eventsStr);
    
    // Recalculate guest count & rsvp count dynamically from guests table
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    const guests: Guest[] = JSON.parse(guestsStr);

    return events.map(evt => {
      const evtGuests = guests.filter(g => g.eventId === evt.id);
      return {
        ...evt,
        guestCount: evtGuests.length,
        rsvpCount: evtGuests.filter(g => g.rsvpStatus !== 'pending').length
      };
    });
  },

  async getEventById(id: string): Promise<EventModel | null> {
    await delay(250);
    const events = await this.getEvents();
    return events.find(e => 
      e.id === id || 
      e.clientNumber === id || 
      (e.slug && e.slug.toLowerCase() === id.toLowerCase())
    ) || null;
  },

  async createEvent(eventData: Omit<EventModel, 'id' | 'createdAt' | 'clientId' | 'guestCount' | 'rsvpCount'>): Promise<EventModel> {
    await delay(600);
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    const events: EventModel[] = JSON.parse(eventsStr);
    
    // Auto-generate a progressive client number starting from 215
    let maxClientNumber = 214;
    events.forEach(e => {
      if (e.clientNumber) {
        const num = parseInt(e.clientNumber, 10);
        if (!isNaN(num) && num > maxClientNumber) {
          maxClientNumber = num;
        }
      }
    });
    const nextClientNumber = (maxClientNumber + 1).toString();

    const currentUser = await this.getCurrentUser();
    
    // Check event creation quota limit for standard clients
    if (currentUser && currentUser.role === 'client') {
      const allEvents = await this.getEvents();
      const userEvents = allEvents.filter(e => e.clientId === currentUser.id);
      const limit = currentUser.eventLimit !== undefined ? currentUser.eventLimit : 3;
      if (userEvents.length >= limit) {
        throw new Error(`Quota limit reached! You are permitted to create at most ${limit} events. Please contact the administrator.`);
      }
    }

    const cleanSlug = eventData.slug 
      ? eventData.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '')
      : `site-${nextClientNumber}`;

    const newEvent: EventModel = {
      ...eventData,
      slug: cleanSlug,
      dashboardData: eventData.dashboardData || { dailyAnomalyRate: "0.00%", currentTemperature: "32.0°C", queueLoad: "0%" },
      id: `evt-${Date.now()}`,
      clientNumber: nextClientNumber,
      createdAt: new Date().toISOString(),
      clientId: currentUser?.id || 'usr-client',
      guestCount: 0,
      rsvpCount: 0
    };

    events.unshift(newEvent);
    localStorage.setItem('event_platform_events', JSON.stringify(events));

    try {
      await setDoc(doc(db, 'events', newEvent.id), newEvent);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `events/${newEvent.id}`);
    }

    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<EventModel>): Promise<EventModel> {
    await delay(400);
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    let events: EventModel[] = JSON.parse(eventsStr);

    let updatedEvent: EventModel | null = null;
    events = events.map(evt => {
      if (evt.id === id) {
        updatedEvent = { ...evt, ...updates };
        return updatedEvent;
      }
      return evt;
    });

    if (!updatedEvent) throw new Error('Event not found');
    localStorage.setItem('event_platform_events', JSON.stringify(events));

    try {
      await updateDoc(doc(db, 'events', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${id}`);
    }

    return updatedEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    await delay(400);
    const eventsStr = localStorage.getItem('event_platform_events') || '[]';
    let events: EventModel[] = JSON.parse(eventsStr);
    events = events.filter(e => e.id !== id);
    localStorage.setItem('event_platform_events', JSON.stringify(events));

    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `events/${id}`);
    }

    // Also cascade delete guests
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);
    guests = guests.filter(g => g.eventId !== id);
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));
  },

  // Guests API
  async getGuests(eventId: string): Promise<Guest[]> {
    await delay(300);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    const guests: Guest[] = JSON.parse(guestsStr);
    return guests.filter(g => g.eventId === eventId);
  },

  async getAllGuests(): Promise<Guest[]> {
    await delay(200);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    return JSON.parse(guestsStr);
  },

  async getGuestByToken(token: string): Promise<Guest | null> {
    await delay(200);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    const guests: Guest[] = JSON.parse(guestsStr);
    return guests.find(g => g.token.toLowerCase() === token.toLowerCase()) || null;
  },

  async addGuest(eventId: string, guestData: Omit<Guest, 'id' | 'eventId' | 'invitationOpened' | 'token'>): Promise<Guest> {
    await delay(300);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    const guests: Guest[] = JSON.parse(guestsStr);

    const cleanToken = `evt-${eventId.replace('evt-', '')}-${guestData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)}`;

    const newGuest: Guest = {
      ...guestData,
      id: `gst-${Date.now()}`,
      eventId,
      invitationOpened: false,
      token: cleanToken
    };

    guests.push(newGuest);
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));

    try {
      await setDoc(doc(db, 'events', eventId, 'guests', newGuest.id), newGuest);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `events/${eventId}/guests/${newGuest.id}`);
    }

    return newGuest;
  },

  async addBulkGuests(eventId: string, rawList: Array<Omit<Guest, 'id' | 'eventId' | 'invitationOpened' | 'token'>>): Promise<Guest[]> {
    await delay(500);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    const guests: Guest[] = JSON.parse(guestsStr);

    const added: Guest[] = [];
    for (let idx = 0; idx < rawList.length; idx++) {
      const g = rawList[idx];
      const cleanToken = `evt-${eventId.replace('evt-', '')}-${g.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4)}-${idx}`;
      const newGuest: Guest = {
        ...g,
        id: `gst-${Date.now()}-${idx}`,
        eventId,
        invitationOpened: false,
        token: cleanToken
      };
      guests.push(newGuest);
      added.push(newGuest);

      try {
        await setDoc(doc(db, 'events', eventId, 'guests', newGuest.id), newGuest);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `events/${eventId}/guests/${newGuest.id}`);
      }
    }

    localStorage.setItem('event_platform_guests', JSON.stringify(guests));
    return added;
  },

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    await delay(250);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);

    let updatedGuest: Guest | null = null;
    guests = guests.map(g => {
      if (g.id === id) {
        updatedGuest = { ...g, ...updates };
        return updatedGuest;
      }
      return g;
    });

    if (!updatedGuest) throw new Error('Guest not found');
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));

    const targetGuest = updatedGuest as Guest;
    try {
      await updateDoc(doc(db, 'events', targetGuest.eventId, 'guests', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${targetGuest.eventId}/guests/${id}`);
    }

    return targetGuest;
  },

  async deleteGuest(id: string): Promise<void> {
    await delay(200);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);
    const target = guests.find(g => g.id === id);
    guests = guests.filter(g => g.id !== id);
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));

    if (target) {
      try {
        await deleteDoc(doc(db, 'events', target.eventId, 'guests', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `events/${target.eventId}/guests/${id}`);
      }
    }
  },

  async deleteBulkGuests(ids: string[]): Promise<void> {
    await delay(300);
    const guestsStr = localStorage.getItem('event_platform_guests') || '[]';
    let guests: Guest[] = JSON.parse(guestsStr);
    guests = guests.filter(g => !ids.includes(g.id));
    localStorage.setItem('event_platform_guests', JSON.stringify(guests));
  },

  // Guestbook API
  async getGuestbook(eventId: string): Promise<GuestbookEntry[]> {
    await delay(200);
    const entriesStr = localStorage.getItem('event_platform_guestbook') || '[]';
    const entries: GuestbookEntry[] = JSON.parse(entriesStr);
    return entries.filter(e => e.eventId === eventId);
  },

  async getGuestbookEntries(eventId: string): Promise<GuestbookEntry[]> {
    return this.getGuestbook(eventId);
  },

  async addGuestbookEntry(eventId: string, name: string, message: string, imageUrl?: string): Promise<GuestbookEntry> {
    await delay(300);
    const entriesStr = localStorage.getItem('event_platform_guestbook') || '[]';
    const entries: GuestbookEntry[] = JSON.parse(entriesStr);

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      eventId,
      name,
      message,
      imageUrl,
      timestamp: new Date().toISOString()
    };

    entries.unshift(newEntry);
    localStorage.setItem('event_platform_guestbook', JSON.stringify(entries));

    try {
      await setDoc(doc(db, 'events', eventId, 'guestbook', newEntry.id), newEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `events/${eventId}/guestbook/${newEntry.id}`);
    }

    // Register this in recent activity
    this.addRecentActivity(eventId, name, 'guestbook_entry', `left a message: "${message.slice(0, 30)}..."`);

    return newEntry;
  },

  // Recent Activity Log API
  async getRecentActivities(eventId?: string): Promise<RecentActivity[]> {
    const defaultActivities: RecentActivity[] = [
      { id: 'act-1', eventId: 'evt-1', eventName: "Evelyn & Arthur's Wedding", guestName: "Jonathan Sterling", action: 'rsvp_accepted', detail: "accepted invitation with 1 companion (Meal: Salmon Duo)", timestamp: "2026-06-29T11:45:00Z" },
      { id: 'act-2', eventId: 'evt-1', eventName: "Evelyn & Arthur's Wedding", guestName: "Helena Shaw", action: 'opened_invitation', detail: "opened the personalized website", timestamp: "2026-06-29T10:12:00Z" },
      { id: 'act-3', eventId: 'evt-1', eventName: "Evelyn & Arthur's Wedding", guestName: "Eleanor Vance", action: 'guestbook_entry', detail: "left a warm wedding blessing on the Guestbook", timestamp: "2026-06-28T22:30:00Z" },
      { id: 'act-4', eventId: 'evt-1', eventName: "Evelyn & Arthur's Wedding", guestName: "Dr. Henry Jones Jr.", action: 'rsvp_declined', detail: "declined invitation (Conflict of interest)", timestamp: "2026-06-28T18:15:00Z" },
      { id: 'act-5', eventId: 'evt-2', eventName: "Benjamin's Gatsby Gala", guestName: "Daisy Buchanan", action: 'rsvp_accepted', detail: "accepted with 1 companion (Meal: Lobster Croquette)", timestamp: "2026-06-28T14:10:00Z" }
    ];

    const key = 'event_platform_activities';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultActivities));
    }

    const raw = localStorage.getItem(key) || '[]';
    const activities: RecentActivity[] = JSON.parse(raw);

    if (eventId) {
      return activities.filter(a => a.eventId === eventId);
    }
    return activities;
  },

  async addRecentActivity(eventId: string, guestName: string, action: RecentActivity['action'], detail: string): Promise<void> {
    const key = 'event_platform_activities';
    const raw = localStorage.getItem(key) || '[]';
    const activities: RecentActivity[] = JSON.parse(raw);

    const events = JSON.parse(localStorage.getItem('event_platform_events') || '[]') as EventModel[];
    const matchedEvent = events.find(e => e.id === eventId);
    const eventName = matchedEvent ? matchedEvent.name : 'Unknown Event';

    const newAct: RecentActivity = {
      id: `act-${Date.now()}`,
      eventId,
      eventName,
      guestName,
      action,
      detail,
      timestamp: new Date().toISOString()
    };

    activities.unshift(newAct);
    localStorage.setItem(key, JSON.stringify(activities.slice(0, 100))); // Cap at 100

    try {
      await setDoc(doc(db, 'events', eventId, 'activities', newAct.id), newAct);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `events/${eventId}/activities/${newAct.id}`);
    }
  },

  // Marketing Site Portfolio, Testimonials, Packages APIs
  async getPortfolio(): Promise<PortfolioItem[]> {
    return JSON.parse(localStorage.getItem('event_platform_portfolio') || '[]');
  },

  async getTestimonials(): Promise<Testimonial[]> {
    return JSON.parse(localStorage.getItem('event_platform_testimonials') || '[]');
  },

  async getPackages(): Promise<Package[]> {
    return JSON.parse(localStorage.getItem('event_platform_packages') || '[]');
  }
};
