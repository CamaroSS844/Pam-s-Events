/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Music, MessageSquare, Phone, User, AlertTriangle, CheckCircle2, Clock, Trash2, Edit3, RotateCcw, Camera, Upload, Info } from 'lucide-react';
import { EventModel, Guest } from '../../types';
import { mockApi } from '../../services/mockApi';
import { COUNTRY_CODES, DEFAULT_COUNTRY, CountryCodeInfo, normalizePhoneNumber, validatePhoneNumber, parsePhoneForDisplay } from '../../utils/phoneUtils';

interface RsvpFormProps {
  event: EventModel;
  guest: Guest | null;
  onRsvpSuccess: (updatedGuest: Guest) => void;
  themeId: string;
  theme: any;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({
  event,
  guest,
  onRsvpSuccess,
  themeId,
  theme
}) => {
  // Form input states
  const [rsvpStatus, setRsvpStatusState] = useState<'accepted' | 'declined'>('accepted');
  const [guestName, setGuestName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeInfo>(DEFAULT_COUNTRY);
  const [localPhone, setLocalPhone] = useState('');
  const [guestsAttending, setGuestsAttending] = useState(1);
  const [songRequest, setSongRequest] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('');

  // Derived normalized E.164 phone string
  const phone = React.useMemo(() => {
    return normalizePhoneNumber(localPhone, selectedCountry.dialCode);
  }, [localPhone, selectedCountry.dialCode]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid picture file (JPG, PNG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && typeof ev.target.result === 'string') {
          setUploadedPhoto(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedGuest, setSavedGuest] = useState<Guest | null>(guest);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if RSVP Deadline has passed
  const isDeadlinePassed = React.useMemo(() => {
    if (!event.rsvpDeadline) return false;
    const deadlineDate = new Date(event.rsvpDeadline);
    // End of deadline day
    deadlineDate.setHours(23, 59, 59, 999);
    return new Date() > deadlineDate;
  }, [event.rsvpDeadline]);

  // Load existing guest or stored RSVP state on mount
  useEffect(() => {
    // 1. Check if guest is provided via invitation link token
    if (guest) {
      setGuestName(guest.name || '');
      if (guest.phone) {
        const parsedP = parsePhoneForDisplay(guest.phone);
        setSelectedCountry(parsedP.country);
        setLocalPhone(parsedP.localPart);
      }
      setRsvpStatusState(guest.rsvpStatus === 'declined' ? 'declined' : 'accepted');
      setGuestsAttending(guest.companionsCount ? guest.companionsCount + 1 : 1);
      if (guest.songRequest) setSongRequest(guest.songRequest);
      if (guest.personalMessage) setPersonalMessage(guest.personalMessage);
      setSavedGuest(guest);
      
      if (guest.rsvpStatus && guest.rsvpStatus !== 'pending') {
        setRsvpSubmitted(true);
      }
      return;
    }

    // 2. Otherwise check browser localStorage for previous response to this specific event
    const storageKey = `user_rsvp_${event.id}`;
    const storedRsvpStr = localStorage.getItem(storageKey);
    if (storedRsvpStr) {
      try {
        const parsed = JSON.parse(storedRsvpStr);
        if (parsed) {
          if (parsed.guestName) setGuestName(parsed.guestName);
          if (parsed.phone) {
            const parsedP = parsePhoneForDisplay(parsed.phone);
            setSelectedCountry(parsedP.country);
            setLocalPhone(parsedP.localPart);
          }
          if (parsed.rsvpStatus) setRsvpStatusState(parsed.rsvpStatus);
          if (parsed.guestsAttending) setGuestsAttending(parsed.guestsAttending);
          if (parsed.songRequest) setSongRequest(parsed.songRequest);
          if (parsed.personalMessage) setPersonalMessage(parsed.personalMessage);
          if (parsed.guestObj) setSavedGuest(parsed.guestObj);
          setRsvpSubmitted(true);
        }
      } catch (e) {
        console.warn("Failed to parse stored RSVP state", e);
      }
    }
  }, [guest, event.id]);

  // Format deadline date cleanly
  const formatDeadlineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleStatusChange = (status: 'accepted' | 'declined') => {
    if (isDeadlinePassed) return;
    setRsvpStatusState(status);
  };

  // Submit RSVP Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlinePassed) return;

    if (!guestName.trim()) {
      setErrorMsg('Please enter your full name so we can identify your invitation.');
      return;
    }

    if (!localPhone.trim()) {
      setErrorMsg('Please enter your phone number so we can identify your invitation.');
      return;
    }

    // Validate phone number for selected country
    const phoneVal = validatePhoneNumber(localPhone, selectedCountry);
    if (!phoneVal.isValid) {
      setErrorMsg(phoneVal.error || 'Please enter a valid phone number for the selected country.');
      return;
    }

    const normSubmittedPhone = phoneVal.normalized;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const timestampString = new Date().toISOString();
      const friendlyDateString = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // Query all existing guests for this event to validate phone number uniqueness
      const allGuests = await mockApi.getGuests(event.id);

      const existingByPhone = allGuests.find((g) => {
        if (!g.phone) return false;
        const normGuestPhone = normalizePhoneNumber(g.phone, selectedCountry.dialCode);
        return normGuestPhone === normSubmittedPhone;
      });

      let targetGuestToUpdate: Guest | null = guest || savedGuest || null;

      if (existingByPhone) {
        const isSameGuest =
          (guest && guest.id === existingByPhone.id) ||
          (savedGuest && savedGuest.id === existingByPhone.id) ||
          (targetGuestToUpdate && targetGuestToUpdate.id === existingByPhone.id);

        if (!isSameGuest) {
          if (existingByPhone.rsvpStatus === 'pending') {
            // Host pre-added guest with pending status - claim & update this record
            targetGuestToUpdate = existingByPhone;
          } else {
            // Phone number has already responded
            setErrorMsg("We've already received an RSVP from this phone number. If you believe this is a mistake, please contact the event organiser.");
            setIsSubmitting(false);
            return;
          }
        }
      }

      let updatedGuestObj: Guest;

      if (targetGuestToUpdate && targetGuestToUpdate.id) {
        updatedGuestObj = await mockApi.updateGuest(targetGuestToUpdate.id, {
          name: guestName.trim(),
          phone: normSubmittedPhone,
          rsvpStatus: rsvpStatus,
          companionsCount: rsvpStatus === 'accepted' ? Math.max(0, guestsAttending - 1) : 0,
          songRequest: rsvpStatus === 'accepted' ? songRequest.trim() : undefined,
          personalMessage: personalMessage.trim(),
          responseDate: friendlyDateString,
          rsvpTimestamp: timestampString
        });
      } else {
        updatedGuestObj = await mockApi.addGuest(event.id, {
          name: guestName.trim(),
          phone: normSubmittedPhone,
          email: '',
          isVip: false,
          isFamily: false,
          tableNumber: 'General Assembly',
          rsvpStatus: rsvpStatus,
          companionsCount: rsvpStatus === 'accepted' ? Math.max(0, guestsAttending - 1) : 0,
          songRequest: rsvpStatus === 'accepted' ? songRequest.trim() : undefined,
          personalMessage: personalMessage.trim(),
          responseDate: friendlyDateString,
          rsvpTimestamp: timestampString
        });
      }

      if (personalMessage.trim() || uploadedPhoto) {
        try {
          await mockApi.addGuestbookEntry(
            event.id, 
            guestName.trim(), 
            personalMessage.trim() || "Shared a celebration photo memory!", 
            uploadedPhoto || undefined
          );
        } catch (gbErr) {
          console.error("Error writing message to public guestbook:", gbErr);
        }
      }

      try {
        mockApi.addRecentActivity(
          event.id,
          guestName.trim(),
          rsvpStatus === 'accepted' ? 'rsvp_accepted' : 'rsvp_declined',
          rsvpStatus === 'accepted'
            ? `accepted (Party of ${guestsAttending})`
            : `declined invitation`
        );
      } catch (actErr) {
        console.error("Activity logging bypassed:", actErr);
      }

      // Store response persistently in browser localStorage
      const storageKey = `user_rsvp_${event.id}`;
      const localData = {
        rsvpStatus,
        guestName: guestName.trim(),
        phone: normSubmittedPhone,
        guestsAttending: rsvpStatus === 'accepted' ? guestsAttending : 0,
        songRequest: rsvpStatus === 'accepted' ? songRequest.trim() : '',
        personalMessage: personalMessage.trim(),
        guestObj: updatedGuestObj,
        timestamp: timestampString
      };
      localStorage.setItem(storageKey, JSON.stringify(localData));

      setSavedGuest(updatedGuestObj);
      setShowCancelConfirm(false);
      setRsvpSubmitted(true);
      onRsvpSuccess(updatedGuestObj);
    } catch (err: any) {
      console.error("RSVP Submission Error:", err);
      setErrorMsg("Something went wrong while submitting your RSVP. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Decline Reservation
  const handleCancelReservation = async () => {
    if (isDeadlinePassed) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const timestampString = new Date().toISOString();
      const friendlyDateString = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      let updatedGuestObj: Guest | null = null;
      const targetGuest = savedGuest || guest;

      if (targetGuest && targetGuest.id) {
        updatedGuestObj = await mockApi.updateGuest(targetGuest.id, {
          rsvpStatus: 'declined',
          companionsCount: 0,
          responseDate: friendlyDateString,
          rsvpTimestamp: timestampString
        });
      } else {
        updatedGuestObj = await mockApi.addGuest(event.id, {
          name: guestName.trim() || 'Guest',
          phone: phone.trim() || 'N/A',
          email: '',
          isVip: false,
          isFamily: false,
          tableNumber: 'General Assembly',
          rsvpStatus: 'declined',
          companionsCount: 0,
          responseDate: friendlyDateString,
          rsvpTimestamp: timestampString
        });
      }

      try {
        mockApi.addRecentActivity(
          event.id,
          guestName.trim() || targetGuest?.name || 'Guest',
          'rsvp_declined',
          'canceled reservation (declined invitation)'
        );
      } catch (actErr) {
        console.error("Activity logging bypassed:", actErr);
      }

      // Update local storage to show 'declined'
      const storageKey = `user_rsvp_${event.id}`;
      const localData = {
        rsvpStatus: 'declined',
        guestName: guestName.trim() || targetGuest?.name || '',
        phone: phone.trim() || targetGuest?.phone || '',
        guestsAttending: 0,
        songRequest: '',
        personalMessage: '',
        guestObj: updatedGuestObj,
        timestamp: timestampString
      };
      localStorage.setItem(storageKey, JSON.stringify(localData));

      setRsvpStatusState('declined');
      setGuestsAttending(1);
      setSavedGuest(updatedGuestObj);
      setShowCancelConfirm(false);
      setRsvpSubmitted(true);
      if (updatedGuestObj) {
        onRsvpSuccess(updatedGuestObj);
      }
    } catch (err: any) {
      console.error("Cancel Reservation Error:", err);
      setErrorMsg("Something went wrong while submitting your RSVP. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine theme-specific CSS styling classes
  const styles = React.useMemo(() => {
    switch (themeId) {
      case 'luxury':
        return {
          wrapper: "border-2 border-[#D4AF37]/50 p-6 sm:p-10 bg-[#1a1815]/80 text-[#F5F5DC] rounded-xl shadow-2xl relative backdrop-blur-md",
          input: "w-full bg-[#2C2C2C] border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] font-sans text-[#F5F5DC] placeholder-stone-400 transition-all",
          radioActiveAccept: "bg-[#D4AF37] border-[#D4AF37] text-stone-950 font-bold shadow-md",
          radioActiveDecline: "bg-[#CD7F32] border-[#CD7F32] text-white font-bold shadow-md",
          radioInactive: "border-[#D4AF37]/30 text-[#D4AF37] bg-[#2C2C2C]/60 hover:bg-[#2C2C2C]",
          submitBtn: "w-full py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all bg-[#D4AF37] hover:bg-[#b8952b] text-stone-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/10",
          accentText: "text-[#CD7F32]",
          primaryText: "text-[#F5F5DC]",
          successCard: "p-6 sm:p-8 text-center bg-[#2C2C2C]/90 border-2 border-[#D4AF37]/60 rounded-xl shadow-2xl text-[#F5F5DC]",
          declineCard: "p-6 sm:p-8 text-center bg-[#2C2C2C]/90 border border-[#CD7F32]/60 rounded-xl shadow-xl text-[#F5F5DC]",
          successIconBadge: "w-14 h-14 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mx-auto mb-4 text-[#D4AF37] shadow-inner",
          declineIconBadge: "w-14 h-14 rounded-full bg-[#CD7F32]/20 border border-[#CD7F32] flex items-center justify-center mx-auto mb-4 text-[#CD7F32]",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CD7F32]/15 border border-[#CD7F32]/40 text-[10px] font-mono font-bold text-[#CD7F32] uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#F5F5DC] tracking-tight",
          declineHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#F5F5DC] tracking-tight",
          detailsBox: "mt-6 p-4 sm:p-5 bg-[#1a1815] border border-[#D4AF37]/30 rounded-xl text-left text-xs text-[#F5F5DC] space-y-2 font-sans shadow-md",
          errorBox: "p-4 bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs rounded-xl shadow-sm",
          warningBox: "p-4 bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs rounded-xl shadow-sm"
        };
      case 'elegant':
        return {
          wrapper: "border border-zinc-200 p-6 sm:p-10 bg-white text-zinc-900 rounded-none shadow-xl relative",
          input: "w-full bg-white border border-zinc-300 rounded-none px-4 py-3 text-xs focus:outline-none focus:border-zinc-900 text-zinc-900 transition-all",
          radioActiveAccept: "bg-zinc-900 border-zinc-900 text-white font-medium",
          radioActiveDecline: "bg-stone-600 border-stone-600 text-white font-medium",
          radioInactive: "border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50",
          submitBtn: "w-full py-4 rounded-none text-xs font-medium uppercase tracking-[0.15em] transition-all bg-zinc-900 hover:bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-zinc-500",
          primaryText: "text-zinc-900",
          successCard: "p-6 sm:p-8 text-center bg-zinc-950 border border-zinc-800 text-white rounded-none shadow-2xl",
          declineCard: "p-6 sm:p-8 text-center bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-none shadow-xl",
          successIconBadge: "w-14 h-14 bg-zinc-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4",
          declineIconBadge: "w-14 h-14 bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto mb-4",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-700 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-serif font-black tracking-tight text-white",
          declineHeading: "text-2xl sm:text-3xl font-serif font-black tracking-tight text-white",
          detailsBox: "mt-6 p-4 sm:p-5 bg-zinc-900 border border-zinc-800 text-left text-xs text-zinc-300 font-mono space-y-2",
          errorBox: "p-4 bg-zinc-900 border border-rose-500/50 text-rose-300 text-xs shadow-sm",
          warningBox: "p-4 bg-zinc-900 border border-amber-500/50 text-amber-300 text-xs shadow-sm"
        };
      case 'modern':
        return {
          wrapper: "bg-[#111c30] border border-[#2c3d5e]/50 p-6 sm:p-10 rounded-2xl shadow-2xl text-white relative",
          input: "w-full bg-[#0d1525] border border-[#2c3d5e] rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all",
          radioActiveAccept: "bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white font-bold",
          radioActiveDecline: "bg-gradient-to-r from-rose-500 to-pink-600 border-transparent text-white font-bold",
          radioInactive: "border-[#2c3d5e] text-zinc-400 bg-[#0d1525]/50 hover:bg-[#0d1525]",
          submitBtn: "w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-95 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/10",
          accentText: "text-[#D4AF37]",
          primaryText: "text-white",
          successCard: "p-6 sm:p-8 text-center bg-[#111c30] border border-[#2c3d5e] rounded-2xl text-white shadow-2xl",
          declineCard: "p-6 sm:p-8 text-center bg-[#111c30] border border-[#2c3d5e] rounded-2xl text-white shadow-xl",
          successIconBadge: "w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400",
          declineIconBadge: "w-14 h-14 rounded-2xl bg-slate-800 border border-[#2c3d5e] flex items-center justify-center mx-auto mb-4 text-slate-400",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-bold tracking-tight text-white",
          declineHeading: "text-2xl sm:text-3xl font-bold tracking-tight text-white",
          detailsBox: "mt-6 p-4 sm:p-5 bg-[#0d1525] border border-[#2c3d5e] rounded-xl text-left text-xs text-slate-300 font-mono space-y-2",
          errorBox: "p-4 bg-[#0d1525] border border-rose-500/40 text-rose-300 text-xs rounded-xl shadow-sm",
          warningBox: "p-4 bg-[#0d1525] border border-amber-500/40 text-amber-300 text-xs rounded-xl shadow-sm"
        };
      case 'rustic':
        return {
          wrapper: "border border-dashed border-[#D4C4B0] p-6 sm:p-10 bg-[#FAF6F0] rounded-2xl text-stone-850 shadow-md relative",
          input: "w-full bg-white border border-[#D4C4B0]/65 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8c7a6b] text-stone-900 transition-all",
          radioActiveAccept: "bg-[#8c7a6b] border-[#8c7a6b] text-white font-bold",
          radioActiveDecline: "bg-stone-600 border-stone-600 text-white font-bold",
          radioInactive: "border-[#D4C4B0]/40 text-stone-500 bg-white hover:bg-[#FAF6F0]/40",
          submitBtn: "w-full py-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all bg-[#8c7a6b] hover:bg-[#766659] text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-[#8c7a6b]",
          primaryText: "text-[#5c4d42]",
          successCard: "p-6 sm:p-8 text-center bg-[#FAF6F0] border border-dashed border-[#8c7a6b]/60 rounded-2xl text-stone-900 shadow-lg",
          declineCard: "p-6 sm:p-8 text-center bg-[#FAF6F0] border border-dashed border-stone-300 rounded-2xl text-stone-800 shadow-md",
          successIconBadge: "w-14 h-14 rounded-full bg-[#8c7a6b]/15 border border-[#8c7a6b]/40 flex items-center justify-center mx-auto mb-4 text-[#8c7a6b]",
          declineIconBadge: "w-14 h-14 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center mx-auto mb-4 text-stone-500",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8c7a6b]/15 border border-[#8c7a6b]/30 text-[10px] font-mono font-bold text-[#5c4d42] uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#5c4d42] tracking-tight",
          declineHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#5c4d42] tracking-tight",
          detailsBox: "mt-6 p-4 sm:p-5 bg-white/90 border border-[#D4C4B0] rounded-xl text-left text-xs text-stone-800 space-y-2",
          errorBox: "p-4 bg-white border border-rose-300 text-rose-800 text-xs rounded-xl shadow-sm",
          warningBox: "p-4 bg-white border border-amber-300 text-amber-900 text-xs rounded-xl shadow-sm"
        };
      case 'floral':
        return {
          wrapper: "border border-[#F4E4E6] p-6 sm:p-10 bg-[#FFFBFB] rounded-3xl text-[#3D5A3D] shadow-xl relative",
          input: "w-full bg-white border border-[#F4E4E6] rounded-full px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A5A5] text-stone-850 transition-all",
          radioActiveAccept: "bg-[#D4A5A5] border-[#D4A5A5] text-white font-semibold",
          radioActiveDecline: "bg-stone-500 border-stone-500 text-white font-semibold",
          radioInactive: "border-[#F4E4E6] text-stone-400 bg-white hover:bg-stone-50",
          submitBtn: "w-full py-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all bg-[#D4A5A5] hover:bg-[#c99595] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
          accentText: "text-[#D4A5A5]",
          primaryText: "text-[#3D5A3D]",
          successCard: "p-6 sm:p-8 text-center bg-[#FFFBFB] border border-[#D4A5A5]/60 rounded-3xl text-[#3D5A3D] shadow-xl",
          declineCard: "p-6 sm:p-8 text-center bg-[#FFFBFB] border border-[#F4E4E6] rounded-3xl text-stone-700 shadow-md",
          successIconBadge: "w-14 h-14 rounded-full bg-[#D4A5A5]/20 border border-[#D4A5A5]/50 flex items-center justify-center mx-auto mb-4 text-[#3D5A3D]",
          declineIconBadge: "w-14 h-14 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-4 text-stone-500",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/40 text-[10px] font-mono font-bold text-[#3D5A3D] uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#3D5A3D] tracking-tight",
          declineHeading: "text-2xl sm:text-3xl font-serif font-bold text-[#3D5A3D] tracking-tight",
          detailsBox: "mt-6 p-4 sm:p-5 bg-white border border-[#F4E4E6] rounded-2xl text-left text-xs text-[#3D5A3D] space-y-2",
          errorBox: "p-4 bg-white border border-rose-300 text-rose-800 text-xs rounded-2xl shadow-sm",
          warningBox: "p-4 bg-white border border-amber-300 text-amber-900 text-xs rounded-2xl shadow-sm"
        };
      case 'traditional':
        return {
          wrapper: "border-4 border-double border-amber-900/30 p-6 sm:p-8 bg-amber-50/20 text-stone-850 relative",
          input: "w-full bg-white border border-amber-900/30 rounded px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900 text-stone-900 transition-all",
          radioActiveAccept: "bg-amber-900 border-amber-900 text-white font-bold",
          radioActiveDecline: "bg-stone-700 border-stone-700 text-white font-bold",
          radioInactive: "border-amber-900/20 text-amber-900/60 bg-white hover:bg-stone-50",
          submitBtn: "w-full py-4 rounded text-xs font-bold uppercase tracking-wider transition-all bg-amber-900 hover:bg-amber-950 text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-amber-800",
          primaryText: "text-[#582f0e]",
          successCard: "p-6 sm:p-8 text-center bg-[#FAF6F0] border-4 border-double border-amber-900/40 rounded text-amber-950 shadow-xl",
          declineCard: "p-6 sm:p-8 text-center bg-[#FAF6F0] border-4 border-double border-stone-400/30 rounded text-stone-850 shadow-md",
          successIconBadge: "w-14 h-14 rounded bg-amber-900/15 border border-amber-900/30 flex items-center justify-center mx-auto mb-4 text-amber-900",
          declineIconBadge: "w-14 h-14 rounded bg-stone-200 border border-stone-300 flex items-center justify-center mx-auto mb-4 text-stone-600",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 bg-amber-900/10 border border-amber-900/30 text-[10px] font-mono font-bold text-amber-900 uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 bg-stone-200 text-[10px] font-mono font-bold text-stone-700 uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-serif font-bold text-amber-950 tracking-tight",
          declineHeading: "text-2xl sm:text-3xl font-serif font-bold text-amber-950 tracking-tight",
          detailsBox: "mt-6 p-4 sm:p-5 bg-white/90 border border-amber-900/20 rounded text-left text-xs text-stone-800 space-y-2",
          errorBox: "p-4 bg-white border border-rose-300 text-rose-900 text-xs shadow-sm",
          warningBox: "p-4 bg-white border border-amber-300 text-amber-900 text-xs shadow-sm"
        };
      case 'minimal':
      default:
        return {
          wrapper: "border border-black p-6 sm:p-8 bg-white text-black relative",
          input: "w-full bg-white border border-black rounded-none px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-black font-mono text-black transition-all",
          radioActiveAccept: "bg-black border-black text-white font-bold",
          radioActiveDecline: "bg-zinc-600 border-zinc-600 text-white font-bold",
          radioInactive: "border-zinc-300 text-zinc-500 bg-white hover:bg-zinc-50",
          submitBtn: "w-full py-4 rounded-none text-xs font-bold uppercase tracking-widest transition-all bg-black hover:bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-zinc-600",
          primaryText: "text-black",
          successCard: "p-6 sm:p-8 text-center bg-white border-2 border-black text-black font-mono shadow-none",
          declineCard: "p-6 sm:p-8 text-center bg-white border border-black text-black font-mono shadow-none",
          successIconBadge: "w-14 h-14 bg-black text-white flex items-center justify-center mx-auto mb-4 font-bold",
          declineIconBadge: "w-14 h-14 border border-black bg-zinc-100 text-black flex items-center justify-center mx-auto mb-4",
          statusPill: "inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-widest mb-3",
          declineStatusPill: "inline-flex items-center gap-1.5 px-3 py-1 border border-black text-[10px] font-mono font-bold text-black uppercase tracking-widest mb-3",
          successHeading: "text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight",
          declineHeading: "text-2xl sm:text-3xl font-mono font-bold text-black tracking-tight",
          detailsBox: "mt-6 p-4 sm:p-5 bg-zinc-50 border border-black text-left text-xs text-black font-mono space-y-2",
          errorBox: "p-4 bg-white border border-rose-600 text-rose-900 font-mono text-xs shadow-sm",
          warningBox: "p-4 bg-white border border-amber-600 text-amber-900 font-mono text-xs shadow-sm"
        };
    }
  }, [themeId]);

  // Derived maximum allowed guest count (from host event configuration)
  const maxSelectable = event.maxGuestsPerInvitation || 4;

  return (
    <div className={styles.wrapper}>
      {/* RSVP Deadline Banner */}
      <div className="mb-8 text-center pb-6 border-b border-zinc-200/40">
        <span className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-80 block mb-1">
          RSVP REQUEST
        </span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Clock className="w-3.5 h-3.5 opacity-60" />
          <span className="text-xs sm:text-sm font-semibold">
            Please respond by:{' '}
            <span className="underline font-bold">
              {event.rsvpDeadline ? formatDeadlineDate(event.rsvpDeadline) : "August 15, 2026"}
            </span>
          </span>
        </div>
      </div>

      {rsvpSubmitted ? (
        rsvpStatus === 'accepted' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={styles.successCard}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
              className={styles.successIconBadge}
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </motion.div>

            <span className={styles.statusPill}>
              <Check className="w-3.5 h-3.5" /> Reservation Confirmed
            </span>

            <h3 className={styles.successHeading}>
              🎉 You're on the guest list!
            </h3>
            
            <div className="mt-2 space-y-1">
              <p className="font-semibold text-sm">Thank you for confirming your attendance.</p>
              <p className="text-xs opacity-90 leading-relaxed max-w-md mx-auto">
                We can't wait to celebrate this special day with you. See you soon!
              </p>
            </div>

            {/* Details Box */}
            <div className={styles.detailsBox}>
              <div className="flex justify-between items-center border-b border-zinc-500/20 pb-2">
                <span className="text-[10px] uppercase font-bold opacity-60">Guest Name:</span>
                <span className="font-bold">{guestName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-500/20 pb-2">
                <span className="text-[10px] uppercase font-bold opacity-60">Contact Phone:</span>
                <span className="font-bold font-mono flex items-center gap-1.5">
                  <span>{selectedCountry.flag}</span>
                  <span>{phone}</span>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-500/20 pb-2">
                <span className="text-[10px] uppercase font-bold opacity-60">RSVP Status:</span>
                <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Joyfully Accepted
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold opacity-60">Party Size:</span>
                <span className="font-bold">{guestsAttending} {guestsAttending > 1 ? 'Guests' : 'Guest'}</span>
              </div>
              {songRequest && (
                <div className="pt-2 border-t border-zinc-500/20">
                  <span className="text-[10px] uppercase font-bold opacity-60 block mb-0.5">Song Request:</span>
                  <span className="italic">"{songRequest}"</span>
                </div>
              )}
              {personalMessage && (
                <div className="pt-2 border-t border-zinc-500/20">
                  <span className="text-[10px] uppercase font-bold opacity-60 block mb-0.5">Message to Hosts:</span>
                  <span className="italic">"{personalMessage}"</span>
                </div>
              )}
            </div>

            {/* Cancel / Update Actions */}
            {!isDeadlinePassed && (
              <div className="mt-6 pt-4 border-t border-zinc-500/20 flex flex-col gap-3">
                {showCancelConfirm ? (
                  <div className={styles.warningBox}>
                    <div className="flex items-start gap-2.5 text-left">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Cancel your reservation?</p>
                        <p className="text-[11px] opacity-90 mt-0.5">This will update your status to declined and release your reservation.</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-500/20 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-3.5 py-2 rounded-lg border border-zinc-400/30 bg-black/10 hover:bg-black/20 font-bold text-[11px] uppercase tracking-wider"
                      >
                        Keep Reservation
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleCancelReservation}
                        className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {isSubmitting ? 'Canceling...' : 'Yes, Cancel Reservation'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRsvpSubmitted(false)}
                      className="px-4 py-2.5 rounded-lg border border-zinc-500/30 hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cancel Reservation</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={styles.declineCard}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
              className={styles.declineIconBadge}
            >
              <X className="w-7 h-7" />
            </motion.div>

            <span className={styles.declineStatusPill}>
              Response Logged
            </span>

            <h3 className={styles.declineHeading}>
              We'll miss you.
            </h3>

            <div className="mt-2 space-y-1">
              <p className="font-semibold text-sm">Thank you for letting us know.</p>
              <p className="text-xs opacity-90 leading-relaxed max-w-md mx-auto">
                Although you won't be joining us, we truly appreciate your response and hope to celebrate together another time.
              </p>
            </div>

            {!isDeadlinePassed && (
              <div className="mt-6 pt-4 border-t border-zinc-500/20">
                <button 
                  type="button"
                  onClick={() => {
                    setRsvpStatusState('accepted');
                    setRsvpSubmitted(false);
                  }}
                  className="px-5 py-3 rounded-xl bg-[#8c7a6b] hover:bg-[#766659] text-white font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Changed your mind? Accept Invitation</span>
                </button>
              </div>
            )}
          </motion.div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isDeadlinePassed && (
            <div className={styles.errorBox}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                <div>
                  <p className="font-bold uppercase tracking-wider">RSVP Closed</p>
                  <p className="mt-1 leading-normal">
                    The RSVP deadline has passed. Please contact the host if you have any questions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Known Guest Banner */}
          {guest && (
            <div className="p-3 bg-black/10 border border-zinc-500/20 rounded-xl flex items-center justify-between text-[11px] opacity-80 font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PERSONALIZED INVITATION MATCHED
              </span>
              {guest.tableNumber && (
                <span className="bg-black/20 px-2.5 py-0.5 rounded font-bold font-mono">
                  {guest.tableNumber}
                </span>
              )}
            </div>
          )}

          {/* Required Full Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 opacity-80 uppercase tracking-wide">
              <User className="w-3.5 h-3.5 opacity-60" />
              <span>Your Full Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              disabled={isDeadlinePassed}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Johnathan Smith"
              className={styles.input}
            />
          </div>

          {/* Required Phone Number Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 opacity-80 uppercase tracking-wide">
              <Phone className="w-3.5 h-3.5 opacity-60" />
              <span>Contact Phone Number <span className="text-rose-500">*</span></span>
            </label>
            
            <div className="flex gap-2 items-stretch">
              {/* Country Code Selector Dropdown */}
              <div className="relative shrink-0 w-[125px] sm:w-[150px]">
                <select
                  disabled={isDeadlinePassed}
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className={`${styles.input} pr-7 font-medium cursor-pointer appearance-none truncate`}
                  title="Select Country Dialing Code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={`${c.code}-${c.dialCode}`} value={c.code} className="bg-zinc-900 text-zinc-100">
                      {c.flag} {c.dialCode} ({c.name})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none opacity-60 text-[10px]">
                  ▼
                </div>
              </div>

              {/* Local Phone Number Field */}
              <div className="flex-1 min-w-0">
                <input
                  type="tel"
                  required
                  disabled={isDeadlinePassed}
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  placeholder="e.g. 771234567"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Live Normalization Format Indicator */}
            <div className="flex items-center justify-between text-[10px] opacity-70 font-mono px-1 pt-0.5">
              <span className="truncate">
                {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dialCode})
              </span>
              {localPhone.trim() ? (
                <span className="text-emerald-500 font-bold shrink-0 ml-2">
                  Saved as: {phone}
                </span>
              ) : (
                <span className="opacity-50 shrink-0 ml-2">Default: 🇿🇼 +263</span>
              )}
            </div>
          </div>

          {/* Attendance Selection (Visual Radio) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold opacity-80 uppercase tracking-wide">
              Will you be joining us? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <button
                type="button"
                disabled={isDeadlinePassed}
                onClick={() => handleStatusChange('accepted')}
                className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                  rsvpStatus === 'accepted' ? styles.radioActiveAccept : styles.radioInactive
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Joyfully Accepts</span>
              </button>
              <button
                type="button"
                disabled={isDeadlinePassed}
                onClick={() => handleStatusChange('declined')}
                className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                  rsvpStatus === 'declined' ? styles.radioActiveDecline : styles.radioInactive
                }`}
              >
                <X className="w-4 h-4" />
                <span>Regretfully Declines</span>
              </button>
            </div>
          </div>

          {/* Conditional Fields using AnimatePresence / motion */}
          <AnimatePresence initial={false}>
            {rsvpStatus === 'accepted' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden space-y-6"
              >
                {/* Number of Guests Attending Field */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-bold opacity-80 uppercase tracking-wide">
                    Number of Guests Attending <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      disabled={isDeadlinePassed}
                      value={guestsAttending}
                      onChange={(e) => setGuestsAttending(parseInt(e.target.value, 10))}
                      className={`${styles.input} appearance-none pr-10`}
                    >
                      {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((val) => (
                        <option key={val} value={val}>
                          {val} {val === 1 ? 'Guest' : 'Guests'} (Max {maxSelectable})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-60">
                      ▼
                    </div>
                  </div>
                  <p className="text-[10px] opacity-60 font-mono leading-normal">
                    * Derived dynamically from event invitation configuration. Max allowed: {maxSelectable}.
                  </p>
                </div>

                {/* Optional Song Request Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold flex items-center gap-1 opacity-80 uppercase tracking-wide">
                    <Music className="w-3.5 h-3.5 opacity-60" />
                    <span>Song Request (Optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isDeadlinePassed}
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                    placeholder="What song will get you on the dance floor?"
                    className={styles.input}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message to the Couple/Host (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 opacity-80 uppercase tracking-wide">
              <MessageSquare className="w-3.5 h-3.5 opacity-60" />
              <span>Leave a Message / Wishes (Optional)</span>
            </label>
            <textarea
              disabled={isDeadlinePassed}
              rows={3}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Leave a message or well wishes for the hosts..."
              className={`${styles.input} rounded-xl resize-none`}
            />
          </div>

          {/* Optional Picture Upload for Guestbook / Wishes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 opacity-80 uppercase tracking-wide">
              <Camera className="w-3.5 h-3.5 opacity-60" />
              <span>Attach a Picture / Memory (Optional)</span>
            </label>

            <input 
              type="file" 
              id="guest-photo-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoChange} 
              disabled={isDeadlinePassed}
            />

            {uploadedPhoto ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-500/20 bg-black/10 p-2 flex items-center gap-3">
                <img src={uploadedPhoto} alt="Guest memory preview" className="w-16 h-16 object-cover rounded-lg shrink-0 border border-zinc-500/20" />
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <span className="text-xs font-bold truncate">Photo Memory Attached</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Ready to post with your blessing</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedPhoto('')}
                  className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 transition-colors"
                  title="Remove picture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isDeadlinePassed}
                onClick={() => {
                  const input = document.getElementById('guest-photo-upload') as HTMLInputElement | null;
                  if (input) input.click();
                }}
                className="w-full py-3 px-4 border border-dashed border-zinc-500/30 hover:border-amber-500/50 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-semibold opacity-80 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 opacity-80" />
                <span>Upload a photo with your message</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className={
                  errorMsg.includes("already received") || errorMsg.includes("already responded")
                    ? styles.warningBox
                    : styles.errorBox
                }
              >
                <div className="flex items-start gap-2.5">
                  {errorMsg.includes("already received") || errorMsg.includes("already responded") ? (
                    <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                  )}
                  <div className="flex-1 text-xs font-medium leading-relaxed">
                    {errorMsg}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit RSVP Button */}
          <button
            type="submit"
            disabled={isDeadlinePassed || isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                LOCKING RESERVATION...
              </span>
            ) : (
              <span>SUBMIT RSVP DETAILS</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
