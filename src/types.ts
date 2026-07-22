/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventType = 'wedding' | 'birthday';

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'archived' | 'taken_down';

export type ThemeId = 'luxury' | 'elegant' | 'modern' | 'rustic' | 'floral' | 'traditional' | 'minimal';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  textMutedColor: string;
  fontHeading: string;
  fontBody: string;
  borderStyle: string; // e.g., 'border-amber-200 rounded-none' or 'border-gray-100 rounded-2xl'
  buttonStyle: string;
  heroOverlay: string;
  badgeStyle: string;
}

export interface EventModel {
  id: string;
  type: EventType;
  status: EventStatus;
  name: string;
  brideName?: string;
  groomName?: string;
  birthdayPerson?: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  themeId: ThemeId;
  themeColor: string;
  dressCode: string;
  mapLink: string;
  coverImage: string;
  galleryImages: string[];
  heroBackground: string;
  timelineSteps?: { time: string; title: string; desc: string }[];
  guestCount?: number;
  rsvpCount?: number;
  createdAt: string;
  clientId: string;
  clientNumber?: string;
  rsvpDeadline?: string;
  maxGuestsPerInvitation?: number;
  slug?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicAutoPlay?: boolean;
  dashboardData?: Record<string, any>;
  rating?: number;
  feedbackComments?: string;
  autoDeleteDate?: string;
  archivedToSheets?: boolean;
  sheetsUrl?: string;
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  isVip: boolean;
  isFamily: boolean;
  tableNumber: string;
  rsvpStatus: 'pending' | 'accepted' | 'declined';
  mealOption?: string;
  companionsCount: number;
  invitationOpened: boolean;
  lastOpenedTime?: string;
  token: string;
  responseDate?: string;
  songRequest?: string;
  personalMessage?: string;
  rsvpTimestamp?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
  avatar?: string;
  eventLimit?: number;
  isBlocked?: boolean;
  password?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  type: EventType;
  image: string;
  client: string;
  date: string;
  description: string;
}

export interface Package {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface RecentActivity {
  id: string;
  eventId: string;
  eventName: string;
  guestName: string;
  action: 'rsvp_accepted' | 'rsvp_declined' | 'opened_invitation' | 'guestbook_entry';
  detail: string;
  timestamp: string;
}

export interface GuestbookEntry {
  id: string;
  eventId: string;
  name: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
}
