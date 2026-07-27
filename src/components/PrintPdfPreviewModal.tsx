import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Sliders,
  QrCode,
  Calendar,
  MapPin,
  Users,
  Eye,
  FileCheck2,
  Clock
} from 'lucide-react';
import { EventModel, Guest, RecentActivity } from '../types';

interface PrintPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventModel;
  guests: Guest[];
  activities?: RecentActivity[];
}

export const PrintPdfPreviewModal: React.FC<PrintPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  event,
  guests,
  activities = [],
}) => {
  const [includeGuestLedger, setIncludeGuestLedger] = useState(true);
  const [includeActivityLog, setIncludeActivityLog] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [includeApprovalBlock, setIncludeApprovalBlock] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  if (!isOpen) return null;

  // Compute headcount totals
  const totalGuests = guests.length;
  const acceptedGuests = guests.filter((g) => g.rsvpStatus === 'accepted');
  const acceptedCount = acceptedGuests.length;
  const companionTotal = acceptedGuests.reduce(
    (sum, g) => sum + ((g as any).companionsCount || (g as any).hasCompanion ? 1 : 0),
    0
  );
  const aggregateHeadcount = acceptedCount + companionTotal;
  const declinedCount = guests.filter((g) => g.rsvpStatus === 'declined').length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'pending').length;
  const responsePercent = totalGuests > 0 ? Math.round(((acceptedCount + declinedCount) / totalGuests) * 100) : 0;

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
          className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Modal Toolbar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-zinc-800 bg-zinc-900/90 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-serif">Print as PDF Preview</h3>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                    High-Fidelity PDF Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Applies precise print rules for an elegant invitation & event coordination summary.
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
              <span>PDF SECTION OPTIONS:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-medium text-zinc-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={includeGuestLedger}
                  onChange={(e) => setIncludeGuestLedger(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Guest Ledger</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={includeActivityLog}
                  onChange={(e) => setIncludeActivityLog(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Activity Log</span>
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

              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={includeApprovalBlock}
                  onChange={(e) => setIncludeApprovalBlock(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Sign-off Block</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-800"
                />
                <span>Watermark</span>
              </label>
            </div>
          </div>

          {/* Paper Sheet Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/90 custom-scrollbar">
            <div className="pdf-paper-preview printable-area my-2">
              {showWatermark && <div className="print-watermark">CONFIDENTIAL</div>}

              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 relative z-10">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    Woke Media Event Coordination Brief
                  </span>
                  <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900 mt-1">
                    Event Invitation & Executive Summary
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    GENERATED ON {new Date().toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                    {event.status === 'published' ? '● Published Live' : '⏰ Drafting Sheet'}
                  </span>
                  <p className="text-[11px] font-mono text-slate-400 mt-2">ID: {event.id}</p>
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
                    OFFICIAL ANNOUNCEMENT
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">{event.name}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-300 pl-3">
                    "{event.description || 'No formal description supplied.'}"
                  </p>
                </div>
              </div>

              {/* Crucial Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-slate-300 rounded-xl p-4 bg-slate-50/60 mb-8 print-avoid-break relative z-10">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Primary Venue</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{event.venue || 'TBD Venue'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Target Date</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{event.date || 'TBD Date'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Scheduled Time</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{event.time || 'TBD Time'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Client Ref</span>
                  <p className="text-xs font-bold text-slate-900 font-mono mt-1">
                    {event.clientNumber || 'REF-STANDARD'}
                  </p>
                </div>
              </div>

              {/* Statistical Ledger Overview */}
              <div className="mb-8 print-avoid-break relative z-10">
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 border-b border-slate-300 pb-1.5 mb-4">
                  RSVP Executive Metrics
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-slate-300 rounded-xl p-4 text-center bg-white">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase block mb-1">
                      Invited Total
                    </span>
                    <span className="text-2xl font-bold font-serif text-slate-900">{totalGuests}</span>
                  </div>
                  <div className="border border-emerald-300/80 rounded-xl p-4 text-center bg-emerald-50/40">
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 uppercase block mb-1">
                      Attending Head
                    </span>
                    <span className="text-2xl font-bold font-serif text-emerald-800">{aggregateHeadcount}</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">
                      {acceptedCount} primary, {companionTotal} extra
                    </p>
                  </div>
                  <div className="border border-rose-300/80 rounded-xl p-4 text-center bg-rose-50/40">
                    <span className="text-[10px] font-mono font-semibold text-rose-700 uppercase block mb-1">
                      Declined
                    </span>
                    <span className="text-2xl font-bold font-serif text-rose-800">{declinedCount}</span>
                  </div>
                  <div className="border border-amber-300/80 rounded-xl p-4 text-center bg-amber-50/40">
                    <span className="text-[10px] font-mono font-semibold text-amber-700 uppercase block mb-1">
                      Pending
                    </span>
                    <span className="text-2xl font-bold font-serif text-amber-800">{pendingCount}</span>
                  </div>
                </div>

                <div className="mt-4 border border-slate-300 rounded-xl p-3 bg-white">
                  <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-slate-600 mb-1">
                    <span>RSVP Response Progression</span>
                    <span>{responsePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all"
                      style={{ width: `${responsePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Public QR Code & Check-in Badge */}
              {includeQrCode && (
                <div className="mb-8 border border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6 print-avoid-break relative z-10">
                  <div className="flex-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      PUBLIC INVITATION ENTRY POINT
                    </span>
                    <h4 className="text-sm font-serif font-bold text-slate-900">Guest Access & Mobile Check-in</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Scan the QR code below or visit the URL to access the responsive invitation portal and submit RSVPs online.
                    </p>
                    <p className="text-[11px] font-mono font-bold text-indigo-700 mt-2 underline break-all">
                      {publicLink}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center">
                    <img src={qrCodeUrl} className="w-28 h-28" alt="Invitation QR Code" />
                    <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 uppercase">Scan for Guest RSVP</span>
                  </div>
                </div>
              )}

              {/* Detailed Guest Ledger Table */}
              {includeGuestLedger && (
                <div className="mb-8 print-avoid-break relative z-10">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-4">
                    <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500">
                      Official Guest Registry ({guests.length} Entries)
                    </h3>
                  </div>

                  {guests.length === 0 ? (
                    <p className="text-xs italic text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded-xl">
                      No guests are currently registered in this database.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs border border-slate-300 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 uppercase font-mono text-[9px] tracking-wider">
                          <th className="py-2.5 px-3 border-b border-slate-300">Guest Name</th>
                          <th className="py-2.5 px-3 border-b border-slate-300">RSVP Status</th>
                          <th className="py-2.5 px-3 border-b border-slate-300">Table No.</th>
                          <th className="py-2.5 px-3 border-b border-slate-300">Companions</th>
                          <th className="py-2.5 px-3 border-b border-slate-300">Contact Email</th>
                          <th className="py-2.5 px-3 border-b border-slate-300 text-center">Badges</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {guests.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{g.name}</td>
                            <td className="py-2 px-3">
                              {g.rsvpStatus === 'accepted' && (
                                <span className="text-emerald-700 font-bold font-mono text-[10px]">
                                  ✓ Confirmed
                                </span>
                              )}
                              {g.rsvpStatus === 'declined' && (
                                <span className="text-rose-700 font-bold font-mono text-[10px]">
                                  ✗ Declined
                                </span>
                              )}
                              {g.rsvpStatus === 'pending' && (
                                <span className="text-amber-700 font-bold font-mono text-[10px]">
                                  ? Pending
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono font-medium text-slate-700">
                              {g.tableNumber || 'N/A'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {g.companionsCount > 0 ? `+${g.companionsCount}` : 'None'}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-slate-600 truncate max-w-[160px]">
                              {g.email || 'N/A'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex gap-1 justify-center">
                                {g.isVip && (
                                  <span className="bg-amber-100 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-300">
                                    VIP
                                  </span>
                                )}
                                {g.isFamily && (
                                  <span className="bg-blue-100 text-blue-900 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-300">
                                    FAM
                                  </span>
                                )}
                                {!g.isVip && !g.isFamily && <span className="text-slate-300">-</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Activity Log & Telemetry */}
              {includeActivityLog && (
                <div className="mb-8 print-avoid-break relative z-10">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 border-b border-slate-300 pb-1.5 mb-3">
                    Recent Operational Activity Log
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.slice(0, 4).map((act) => (
                      <div key={act.id} className="text-[11px] border-l-2 border-slate-400 pl-3 py-1 bg-slate-50/50 rounded-r-lg">
                        <span className="text-slate-400 font-mono text-[9px] block">
                          {new Date(act.timestamp).toLocaleDateString()} at{' '}
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p className="text-slate-800 leading-normal mt-0.5 font-medium">
                          {act.detail || (act as any).description || `${act.guestName} - ${act.action}`}
                        </p>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-xs italic text-slate-400 col-span-2">No activity records logged.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Operational Sign-off Block */}
              {includeApprovalBlock && (
                <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/40 print-avoid-break relative z-10 mt-6">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Official Sign-Off & Verification Block
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    This document serves as the official event coordination brief prepared by Woke Media Event Systems. Please confirm table assignments and headcounts prior to vendor setup.
                  </p>
                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
                    <div>
                      <div className="border-b border-slate-400 h-8" />
                      <p className="text-[10px] font-mono font-bold text-slate-600 uppercase mt-1">
                        Lead Event Coordinator Signature
                      </p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 h-8" />
                      <p className="text-[10px] font-mono font-bold text-slate-600 uppercase mt-1">
                        Host / Client Representative Signature
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Woke Media Event Coordination Brief • Page 1 of 1</span>
                <span>System Reference: {event.id.substring(0, 12)}</span>
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
