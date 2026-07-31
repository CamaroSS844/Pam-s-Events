import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  X,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { EventModel, Guest, RecentActivity } from '../types';
import { getVenueFirstLine } from '../features/invitation/ThemeRenderers';

interface PrintPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventModel;
  guests?: Guest[];
  activities?: RecentActivity[];
  isPublicInvitationView?: boolean;
}

export const PrintPdfPreviewModal: React.FC<PrintPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [includeProgram, setIncludeProgram] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);

  if (!isOpen) return null;

  const timelineSteps = event.timelineSteps || (event.type === 'wedding' ? [
    { time: '15:00', title: 'Guest Arrival', desc: 'Welcome drinks and live acoustic string quartet in the gardens.' },
    { time: '16:00', title: 'Holy Matrimony', desc: 'Sacred vows exchange at the main altar stage.' },
    { time: '17:30', title: 'Cocktail Hour & Photos', desc: 'Sunset photo session and signature cocktails served.' },
    { time: '19:00', title: 'Grand Entrance & Banquet', desc: 'Celebratory 3-course dinner, speeches, and first dance.' }
  ] : [
    { time: '18:00', title: 'Welcome Drinks', desc: 'Arrival mocktails and ambient DJ set.' },
    { time: '19:00', title: 'Celebration Dinner', desc: 'Gourmet buffet and birthday toasts.' },
    { time: '21:00', title: 'Cake Cutting & Afterparty', desc: 'Cake cutting ceremony followed by open dance floor.' }
  ]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const publicLink = `${window.location.origin}/${event.slug || event.clientNumber || event.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(publicLink)}&color=0f172a`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md modal-overlay-no-print overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Modal Toolbar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-zinc-800 bg-zinc-900/90 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-serif">
                    Print Invitation
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                    Pam's Events PDF Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Generates a clean event invitation card with venue, date, time, program schedule, and QR code.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings & Customization Drawer Bar */}
          <div className="bg-zinc-950/70 border-b border-zinc-800/80 px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] font-semibold">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>PRINT SECTION OPTIONS:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-medium text-zinc-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={includeProgram}
                  onChange={(e) => setIncludeProgram(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Program Schedule</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={includeQrCode}
                  onChange={(e) => setIncludeQrCode(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Invitation QR Code</span>
              </label>
            </div>
          </div>

          {/* Paper Sheet Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/90 custom-scrollbar">
            <div className="pdf-paper-preview printable-area my-2">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 relative z-10">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-800 dark:text-amber-600 uppercase font-bold">
                    Official Celebration Invitation
                  </span>
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900 mt-1">
                    {event.name || "Celebration Invitation"}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    ISSUED ON {new Date().toLocaleDateString([], { dateStyle: 'long' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                    {event.status === 'published' ? '● Published Live' : '⏰ Official Invitation'}
                  </span>
                </div>
              </div>

              {/* Event Showcase & Description */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 print-avoid-break relative z-10">
                {event.coverImage && (
                  <div className="md:col-span-4 h-36 rounded-xl overflow-hidden border border-slate-300">
                    <img src={event.coverImage} className="w-full h-full object-cover" alt="Cover" />
                  </div>
                )}
                <div
                  className={`${
                    event.coverImage ? 'md:col-span-8' : 'md:col-span-12'
                  } flex flex-col justify-center`}
                >
                  <span className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-widest mb-1">
                    YOU ARE CORDIALLY INVITED
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">{event.name}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-amber-500 pl-3">
                    "{event.description || 'You are cordially invited to celebrate this historic day with us. Event schedule and venue details are available below.'}"
                  </p>
                </div>
              </div>

              {/* Crucial Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border border-slate-300 rounded-xl p-4 bg-slate-50/60 mb-8 print-avoid-break relative z-10">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Primary Venue</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {getVenueFirstLine(event.venue, event.venueName)}
                  </p>
                  {event.venue && event.venue !== getVenueFirstLine(event.venue, event.venueName) && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{event.venue}</p>
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Target Date</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{event.date || 'TBD Date'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Scheduled Time</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{event.time || 'TBD Time'}</p>
                </div>
              </div>

              {/* Event Program / Timeline Schedule */}
              {includeProgram && timelineSteps && timelineSteps.length > 0 && (
                <div className="mb-8 print-avoid-break relative z-10">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 border-b border-slate-300 pb-1.5 mb-4">
                    Event Program & Schedule
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {timelineSteps.map((step, idx) => (
                      <div key={idx} className="p-3 border border-slate-300 rounded-xl bg-slate-50/50 flex items-start gap-3">
                        <span className="bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shrink-0 mt-0.5">
                          {step.time}
                        </span>
                        <div>
                          <h4 className="text-xs font-serif font-bold text-slate-900">{step.title}</h4>
                          {step.desc && <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public QR Code & Check-in Badge */}
              {includeQrCode && (
                <div className="mb-8 border border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6 print-avoid-break relative z-10">
                  <div className="flex-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      PUBLIC INVITATION & ONLINE RSVP
                    </span>
                    <h4 className="text-sm font-serif font-bold text-slate-900">Guest Access & Digital Invitation Portal</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Scan the QR code or visit the link below to view interactive event features, map directions, and submit RSVPs online.
                    </p>
                    <p className="text-[11px] font-mono font-bold text-amber-700 mt-2 underline break-all">
                      {publicLink}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center">
                    <img src={qrCodeUrl} className="w-28 h-28" alt="Invitation QR Code" />
                    <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 uppercase">Scan for Invitation Site</span>
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Pam's Events Invitation • Page 1 of 1</span>
                <span>Invitation Reference: {event.id.substring(0, 12)}</span>
              </div>
            </div>
          </div>

          {/* Modal Bottom Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Print Stylesheet compiled and optimized for paper printing & PDF exports.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
