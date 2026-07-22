/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Music, MessageSquare, Phone, User, AlertTriangle, Sparkles, Clock, Trash2, Edit3, RotateCcw, Image, Camera, Upload } from 'lucide-react';
import { EventModel, Guest } from '../../types';
import { mockApi } from '../../services/mockApi';

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
  const [phone, setPhone] = useState('');
  const [guestsAttending, setGuestsAttending] = useState(1);
  const [songRequest, setSongRequest] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('');
  
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
          setErrorMsg('');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Validation, confirmation and status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [savedGuest, setSavedGuest] = useState<Guest | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Sync with guest object or browser localStorage
  useEffect(() => {
    const storageKey = `user_rsvp_${event.id}`;
    let savedLocal: any = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedLocal = JSON.parse(raw);
    } catch (e) {
      console.error("Error reading local RSVP storage:", e);
    }

    if (guest && guest.rsvpStatus && guest.rsvpStatus !== 'pending') {
      // Prioritize explicit guest token match from URL/DB
      setGuestName(guest.name || '');
      setPhone(guest.phone || '');
      setRsvpStatusState(guest.rsvpStatus === 'declined' ? 'declined' : 'accepted');
      setGuestsAttending(guest.companionsCount ? guest.companionsCount + 1 : 1);
      setSongRequest(guest.songRequest || '');
      setPersonalMessage(guest.personalMessage || '');
      setSavedGuest(guest);
      setRsvpSubmitted(true);

      // Keep local storage in sync
      const localData = {
        rsvpStatus: guest.rsvpStatus,
        guestName: guest.name || '',
        phone: guest.phone || '',
        guestsAttending: guest.companionsCount ? guest.companionsCount + 1 : 1,
        songRequest: guest.songRequest || '',
        personalMessage: guest.personalMessage || '',
        guestObj: guest,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(localData));
    } else if (savedLocal) {
      // Use saved response from this browser session
      setGuestName(savedLocal.guestName || (guest?.name || ''));
      setPhone(savedLocal.phone || (guest?.phone || ''));
      setRsvpStatusState(savedLocal.rsvpStatus === 'declined' ? 'declined' : 'accepted');
      setGuestsAttending(savedLocal.guestsAttending || 1);
      setSongRequest(savedLocal.songRequest || '');
      setPersonalMessage(savedLocal.personalMessage || '');
      if (savedLocal.guestObj) {
        setSavedGuest(savedLocal.guestObj);
      }
      setRsvpSubmitted(true);
    } else {
      // Clear or set defaults for fresh guest
      setGuestName(guest?.name || '');
      setPhone(guest?.phone || '');
      setRsvpStatusState('accepted');
      setGuestsAttending(1);
      setSongRequest('');
      setPersonalMessage('');
      setRsvpSubmitted(false);
      setSavedGuest(null);
    }
  }, [guest, event.id]);

  // Check if RSVP deadline has passed
  const isDeadlinePassed = React.useMemo(() => {
    if (!event.rsvpDeadline) return false;
    const deadline = new Date(event.rsvpDeadline);
    deadline.setHours(23, 59, 59, 999);
    const now = new Date();
    return now > deadline;
  }, [event.rsvpDeadline]);

  // Format deadline date for elegant display
  const formatDeadlineDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
      setErrorMsg('Please provide your full name.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('A contact phone number is required.');
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const phoneRegex = /^[\d\-+()]{7,18}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('Please enter a valid phone number (e.g., +1 555-0100).');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const timestampString = new Date().toISOString();
      const friendlyDateString = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      let updatedGuestObj: Guest;

      if (guest || savedGuest) {
        const targetId = guest?.id || savedGuest?.id;
        updatedGuestObj = await mockApi.updateGuest(targetId!, {
          name: guestName.trim(),
          phone: phone.trim(),
          rsvpStatus: rsvpStatus,
          companionsCount: rsvpStatus === 'accepted' ? guestsAttending - 1 : 0,
          songRequest: rsvpStatus === 'accepted' ? songRequest.trim() : undefined,
          personalMessage: personalMessage.trim(),
          responseDate: friendlyDateString,
          rsvpTimestamp: timestampString
        });
      } else {
        updatedGuestObj = await mockApi.addGuest(event.id, {
          name: guestName.trim(),
          phone: phone.trim(),
          email: '',
          isVip: false,
          isFamily: false,
          tableNumber: 'General Assembly',
          rsvpStatus: rsvpStatus,
          companionsCount: rsvpStatus === 'accepted' ? guestsAttending - 1 : 0,
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
        phone: phone.trim(),
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
      setErrorMsg(err.message || 'An error occurred while submitting your RSVP.');
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
      setErrorMsg(err.message || 'Failed to cancel reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine theme-specific CSS styling classes
  const styles = React.useMemo(() => {
    switch (themeId) {
      case 'luxury':
        return {
          wrapper: "border-2 border-[#D4AF37]/50 p-6 sm:p-10 bg-[#F5F5DC]/20 text-[#2C2C2C] rounded-xl shadow-2xl relative",
          input: "w-full bg-white border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-sans text-stone-800 transition-all",
          radioActiveAccept: "bg-[#2C2C2C] border-[#2C2C2C] text-white",
          radioActiveDecline: "bg-[#CD7F32] border-[#CD7F32] text-white",
          radioInactive: "border-[#D4AF37]/30 text-[#8C7A6B] bg-white hover:bg-stone-50",
          submitBtn: "w-full py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all bg-[#2C2C2C] hover:bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
          accentText: "text-[#CD7F32]",
          primaryText: "text-[#2C2C2C]"
        };
      case 'elegant':
        return {
          wrapper: "border border-zinc-200 p-6 sm:p-10 bg-white text-zinc-800 rounded-none shadow-xl relative",
          input: "w-full bg-white border border-zinc-300 rounded-none px-4 py-3 text-xs focus:outline-none focus:border-zinc-800 text-zinc-900 transition-all",
          radioActiveAccept: "bg-zinc-900 border-zinc-900 text-white",
          radioActiveDecline: "bg-stone-600 border-stone-600 text-white",
          radioInactive: "border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50",
          submitBtn: "w-full py-4 rounded-none text-xs font-medium uppercase tracking-[0.15em] transition-all bg-zinc-900 hover:bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-zinc-500",
          primaryText: "text-zinc-900"
        };
      case 'modern':
        return {
          wrapper: "bg-[#111c30] border border-[#2c3d5e]/50 p-6 sm:p-10 rounded-2xl shadow-2xl text-white relative",
          input: "w-full bg-[#0d1525] border border-[#2c3d5e] rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all",
          radioActiveAccept: "bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white",
          radioActiveDecline: "bg-gradient-to-r from-rose-500 to-pink-600 border-transparent text-white",
          radioInactive: "border-[#2c3d5e] text-zinc-400 bg-[#0d1525]/50 hover:bg-[#0d1525]",
          submitBtn: "w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-95 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/10",
          accentText: "text-[#D4AF37]",
          primaryText: "text-white"
        };
      case 'rustic':
        return {
          wrapper: "border border-dashed border-[#D4C4B0] p-6 sm:p-10 bg-[#FAF6F0] rounded-2xl text-stone-850 shadow-md relative",
          input: "w-full bg-white border border-[#D4C4B0]/65 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8c7a6b] text-stone-900 transition-all",
          radioActiveAccept: "bg-[#8c7a6b] border-[#8c7a6b] text-white",
          radioActiveDecline: "bg-stone-600 border-stone-600 text-white",
          radioInactive: "border-[#D4C4B0]/40 text-stone-500 bg-white hover:bg-[#FAF6F0]/40",
          submitBtn: "w-full py-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all bg-[#8c7a6b] hover:bg-[#766659] text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-[#8c7a6b]",
          primaryText: "text-[#5c4d42]"
        };
      case 'floral':
        return {
          wrapper: "border border-[#F4E4E6] p-6 sm:p-10 bg-[#FFFBFB] rounded-3xl text-[#3D5A3D] shadow-xl relative",
          input: "w-full bg-white border border-[#F4E4E6] rounded-full px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A5A5] text-stone-850 transition-all",
          radioActiveAccept: "bg-[#D4A5A5] border-[#D4A5A5] text-white",
          radioActiveDecline: "bg-stone-500 border-stone-500 text-white",
          radioInactive: "border-[#F4E4E6] text-stone-400 bg-white hover:bg-stone-50",
          submitBtn: "w-full py-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all bg-[#D4A5A5] hover:bg-[#c99595] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
          accentText: "text-[#D4A5A5]",
          primaryText: "text-[#3D5A3D]"
        };
      case 'traditional':
        return {
          wrapper: "border-4 border-double border-amber-900/30 p-6 sm:p-8 bg-amber-50/20 text-stone-850 relative",
          input: "w-full bg-white border border-amber-900/30 rounded px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900 text-stone-900 transition-all",
          radioActiveAccept: "bg-amber-900 border-amber-900 text-white",
          radioActiveDecline: "bg-stone-700 border-stone-700 text-white",
          radioInactive: "border-amber-900/20 text-amber-900/60 bg-white hover:bg-stone-50",
          submitBtn: "w-full py-4 rounded text-xs font-bold uppercase tracking-wider transition-all bg-amber-900 hover:bg-amber-950 text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-amber-800",
          primaryText: "text-[#582f0e]"
        };
      case 'minimal':
      default:
        return {
          wrapper: "border border-black p-6 sm:p-8 bg-white text-black relative",
          input: "w-full bg-white border border-black rounded-none px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-black font-mono text-black transition-all",
          radioActiveAccept: "bg-black border-black text-white",
          radioActiveDecline: "bg-zinc-600 border-zinc-600 text-white",
          radioInactive: "border-zinc-300 text-zinc-500 bg-white hover:bg-zinc-50",
          submitBtn: "w-full py-4 rounded-none text-xs font-bold uppercase tracking-widest transition-all bg-black hover:bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed",
          accentText: "text-zinc-600",
          primaryText: "text-black"
        };
    }
  }, [themeId]);

  // Derived maximum allowed guest count (from host event configuration)
  const maxSelectable = event.maxGuestsPerInvitation || 4;

  return (
    <div className={styles.wrapper}>
      {/* RSVP Deadline Banner */}
      <div className="mb-8 text-center pb-6 border-b border-zinc-200/50">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 text-center bg-emerald-500/10 border border-emerald-500/25 rounded-xl"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest mb-3">
              <Check className="w-3.5 h-3.5" /> Reservation Confirmed
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
              See You There! 🎉
            </h3>
            <p className="text-xs text-emerald-800/90 mt-1.5 leading-relaxed max-w-md mx-auto">
              Thank you, <span className="font-bold">{guestName}</span>! Your acceptance has been saved in your browser and locked in for the hosts.
            </p>

            {/* Details Box */}
            <div className="mt-6 p-4 sm:p-5 bg-white/90 dark:bg-stone-900/90 border border-emerald-500/20 rounded-xl text-left text-xs text-zinc-700 dark:text-stone-300 space-y-2 font-mono shadow-sm">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-stone-800 pb-2 mb-2">
                <span className="text-zinc-400 uppercase text-[10px]">Guest Name:</span>
                <span className="font-bold text-zinc-900 dark:text-stone-100">{guestName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 uppercase text-[10px]">Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Joyfully Accepted
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 uppercase text-[10px]">Party Size:</span>
                <span className="font-bold">{guestsAttending} {guestsAttending > 1 ? 'Guests' : 'Guest'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 uppercase text-[10px]">Contact Phone:</span>
                <span className="font-bold">{phone}</span>
              </div>
              {songRequest && (
                <div className="pt-2 border-t border-zinc-150 dark:border-stone-800">
                  <span className="text-zinc-400 uppercase text-[10px] block mb-0.5">Song Request:</span>
                  <span className="italic text-zinc-800 dark:text-stone-200">"{songRequest}"</span>
                </div>
              )}
              {personalMessage && (
                <div className="pt-2 border-t border-zinc-150 dark:border-stone-800">
                  <span className="text-zinc-400 uppercase text-[10px] block mb-0.5">Message to Hosts:</span>
                  <span className="italic text-zinc-800 dark:text-stone-200">"{personalMessage}"</span>
                </div>
              )}
            </div>

            {/* Cancel / Update Actions */}
            {!isDeadlinePassed && (
              <div className="mt-6 pt-4 border-t border-emerald-500/20 flex flex-col gap-3">
                {showCancelConfirm ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs space-y-3">
                    <div className="flex items-start gap-2.5 text-rose-900 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Cancel your reservation?</p>
                        <p className="text-[11px] text-rose-700 mt-0.5">This will update your status to declined and release your reservation.</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-[11px] uppercase tracking-wider"
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
                      className="px-4 py-2.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50/90 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel Reservation</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 text-center bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-stone-600 dark:text-stone-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-3">
              Status: Declined
            </div>

            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">
              Invitation Declined
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed max-w-md mx-auto">
              Thank you for letting us know, <span className="font-bold">{guestName || 'Guest'}</span>. We're sorry you won't be able to make it!
            </p>

            {!isDeadlinePassed && (
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button 
                  type="button"
                  onClick={() => {
                    setRsvpStatusState('accepted');
                    setRsvpSubmitted(false);
                  }}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-sm"
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
            <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-xl text-xs text-rose-700 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800 uppercase tracking-wider">RSVP Closed</p>
                <p className="mt-1 leading-normal">
                  The RSVP deadline has passed. Please contact the host if you have any questions.
                </p>
              </div>
            </div>
          )}

          {/* Known Guest Banner */}
          {guest && (
            <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PERSONALIZED INVITATION MATCHED
              </span>
              {guest.tableNumber && (
                <span className="bg-zinc-200 px-2.5 py-0.5 rounded font-bold font-mono">
                  {guest.tableNumber}
                </span>
              )}
            </div>
          )}

          {/* Required Full Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 text-zinc-500 uppercase tracking-wide">
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
            <label className="text-xs font-bold flex items-center gap-1 text-zinc-500 uppercase tracking-wide">
              <Phone className="w-3.5 h-3.5 opacity-60" />
              <span>Contact Phone Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="tel"
              required
              disabled={isDeadlinePassed}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0100"
              className={styles.input}
            />
          </div>

          {/* Attendance Selection (Visual Radio) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
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
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
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
                  <p className="text-[10px] text-zinc-400 font-mono leading-normal">
                    * Derived dynamically from event invitation configuration. Max allowed: {maxSelectable}.
                  </p>
                </div>

                {/* Optional Song Request Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold flex items-center gap-1 text-zinc-500 uppercase tracking-wide">
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
            <label className="text-xs font-bold flex items-center gap-1 text-zinc-500 uppercase tracking-wide">
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
            <label className="text-xs font-bold flex items-center gap-1 text-zinc-500 uppercase tracking-wide">
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
              <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-2 flex items-center gap-3">
                <img src={uploadedPhoto} alt="Guest memory preview" className="w-16 h-16 object-cover rounded-lg shrink-0 border border-stone-200" />
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <span className="text-xs font-bold text-stone-800 truncate">Photo Memory Attached</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Ready to post with your blessing</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedPhoto('')}
                  className="p-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 text-stone-600 hover:text-rose-600 transition-colors"
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
                className="w-full py-3 px-4 border border-dashed border-stone-300 hover:border-amber-500 rounded-xl bg-stone-50/50 hover:bg-stone-50 text-xs font-semibold text-stone-600 hover:text-amber-700 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Upload a photo with your message</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 rounded-lg">
              {errorMsg}
            </div>
          )}

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
