/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Laptop, Tablet, Smartphone, Check, Sparkles, Info } from 'lucide-react';
import { getTheme, THEMES } from '../data/themes';
import { ThemeId, EventModel } from '../types';
import { EventWebsite } from '../features/invitation/EventWebsite';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeId: ThemeId;
  onSelect?: (themeId: ThemeId) => void;
  eventData: Partial<EventModel>;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  isOpen,
  onClose,
  themeId,
  onSelect,
  eventData
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const theme = getTheme(themeId);

  if (!isOpen) return null;

  // Compile rich preview data
  const previewEventData: Partial<EventModel> = {
    type: eventData.type || 'wedding',
    name: eventData.name || (eventData.type === 'birthday' ? `${eventData.birthdayPerson || 'Benjamin'}'s Gala Celebration` : `${eventData.brideName || 'Sarah'} & ${eventData.groomName || 'Mark'}'s Wedding`),
    brideName: eventData.brideName || 'Sarah',
    groomName: eventData.groomName || 'Mark',
    birthdayPerson: eventData.birthdayPerson || 'Benjamin',
    date: eventData.date || '2026-09-12',
    time: eventData.time || '18:00',
    venue: eventData.venue || 'The Glasshouse Conservatory, Seattle, WA',
    description: eventData.description || 'From a cozy coffee shop downtown to a lifetime of shared dreams. We invite you to toast to love, laughter, and a beautiful journey ahead.',
    themeId: themeId,
    themeColor: theme.primaryColor,
    dressCode: eventData.dressCode || 'Formal Cocktail Attire',
    mapLink: eventData.mapLink || 'https://maps.google.com',
    coverImage: eventData.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    galleryImages: eventData.galleryImages && eventData.galleryImages.length > 0 ? eventData.galleryImages : [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600"
    ],
    heroBackground: eventData.heroBackground || 'https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Animated Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden z-10 text-left"
      >
        {/* Header Bar */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: theme.primaryColor }}>
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-semibold">Skin Design /</span>
                <span className="text-slate-900 text-sm font-bold">{theme.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">{theme.description}</p>
            </div>
          </div>

          {/* Viewport controls */}
          <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'desktop', icon: <Laptop className="w-4 h-4" />, label: 'Desktop' },
              { id: 'tablet', icon: <Tablet className="w-4 h-4" />, label: 'Tablet' },
              { id: 'mobile', icon: <Smartphone className="w-4 h-4" />, label: 'Mobile' }
            ].map((dev) => (
              <button
                key={dev.id}
                onClick={() => setDevice(dev.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  device === dev.id 
                    ? 'bg-white shadow-sm text-slate-900 font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {dev.icon}
                <span>{dev.label}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Split Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
          
          {/* Viewport Frame Area */}
          <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto min-h-0 relative">
            
            {device === 'mobile' && (
              <div className="w-[340px] h-[95%] rounded-[36px] border-[12px] border-slate-900 shadow-xl bg-white overflow-y-auto no-scrollbar relative shrink-0">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
                <div className="scale-100 origin-top text-xs">
                  <EventWebsite 
                    eventId="preview"
                    isGuestPreview={true}
                    guestToken="guest"
                    customEventData={previewEventData}
                  />
                </div>
              </div>
            )}

            {device === 'tablet' && (
              <div className="w-[580px] h-[95%] rounded-[24px] border-[10px] border-slate-900 shadow-xl bg-white overflow-y-auto no-scrollbar relative shrink-0">
                <div className="scale-100 origin-top text-xs">
                  <EventWebsite 
                    eventId="preview"
                    isGuestPreview={true}
                    guestToken="guest"
                    customEventData={previewEventData}
                  />
                </div>
              </div>
            )}

            {device === 'desktop' && (
              <div className="w-full h-full rounded-xl border border-slate-200 shadow-xl bg-white overflow-y-auto relative text-xs no-scrollbar flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 h-8 flex items-center gap-2 px-4 sticky top-0 z-20 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="bg-white border border-slate-200 text-[10px] text-slate-400 font-mono py-0.5 px-6 rounded-md w-96 mx-auto truncate text-center select-none">
                    {window.location.host}/preview-live
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <EventWebsite 
                    eventId="preview"
                    isGuestPreview={true}
                    guestToken="guest"
                    customEventData={previewEventData}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar Details */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 bg-white flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-mono tracking-widest text-indigo-600 font-bold uppercase">Design Archetype Specs</span>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Headings Font</span>
                  <span className="font-semibold text-slate-800 uppercase font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                    {theme.fontHeading.replace('font-', '')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Borders style</span>
                  <span className="text-slate-800 text-[11px] font-medium max-w-[140px] truncate" title={theme.borderStyle}>
                    {theme.borderStyle.split(' ').filter(c => c.includes('border') || c.includes('rounded')).join(' ') || 'Standard Clean'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Primary Accent</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: theme.primaryColor }} />
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-600">{theme.primaryColor}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Secondary Tone</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: theme.accentColor }} />
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-600">{theme.accentColor}</span>
                  </div>
                </div>
              </div>

              {/* Theme Element Blueprint Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[9px] font-mono tracking-widest text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>UI Element Preview</span>
                </span>
                
                {/* Button Mockup */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Button Class</span>
                  <button className={`w-full py-2 ${theme.buttonStyle} text-[10px] font-bold shadow-sm pointer-events-none`}>
                    Action Button
                  </button>
                </div>

                {/* Badge Mockup */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Badge Class</span>
                  <div className="flex justify-start">
                    <span className={`px-2 py-1 text-[10px] font-semibold ${theme.badgeStyle || 'bg-slate-200 text-slate-700'}`}>
                      Theme Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick selection actions */}
            <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100">
              {onSelect && (
                <button
                  onClick={() => {
                    onSelect(themeId);
                    onClose();
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Choose Theme Skin</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                Go Back
              </button>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
};
