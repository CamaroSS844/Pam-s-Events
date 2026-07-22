/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  ArrowLeft, ArrowRight, Eye, Edit2, Play, Trash2, Archive, Users, CheckCircle2, 
  XCircle, Clock, BookOpen, Search, Filter, SortAsc, Plus, Download, 
  Trash, Link2, QrCode, FileSpreadsheet, Upload, Film, EyeOff, Heart, Star,
  HelpCircle, Globe, AlertTriangle
} from 'lucide-react';
import { mockApi } from '../../services/mockApi';
import { THEMES } from '../../data/themes';
import { Countdown } from '../../components/Countdown';
import { EventModel, Guest, RecentActivity, ThemeConfig, ThemeId } from '../../types';
import { RSVPLineChart, GuestCategoryDonut } from '../../components/AnalyticsCharts';
import { ThemePreviewModal } from '../../components/ThemePreviewModal';
import { exportEventToGoogleSheets, GoogleSheetsExportResult } from '../../services/googleSheetsService';

interface EventDashboardProps {
  eventId: string;
  onBackToDashboard: () => void;
  onPreviewEvent: (eventId: string, token?: string) => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({
  eventId,
  onBackToDashboard,
  onPreviewEvent,
  toast
}) => {
  const [event, setEvent] = useState<EventModel | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'rsvps' | 'gallery' | 'templates'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [guestSearch, setGuestSearch] = useState('');
  const [filterVip, setFilterVip] = useState<'all' | 'vip' | 'non-vip'>('all');
  const [filterFamily, setFilterFamily] = useState<'all' | 'family' | 'non-family'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [sortField, setSortField] = useState<'name' | 'table'>('name');

  // Manual Add State
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addTable, setAddTable] = useState('');
  const [addVip, setAddVip] = useState(false);
  const [addFamily, setAddFamily] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Bulk Delete Selection
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  // QR & Link Modals
  const [qrModalGuest, setQrModalGuest] = useState<Guest | null>(null);
  const [eventQrModal, setEventQrModal] = useState<EventModel | null>(null);
  const [guestQrCodeUrl, setGuestQrCodeUrl] = useState<string>('');
  const [eventQrCodeUrl, setEventQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (qrModalGuest && event) {
      const identifier = event.slug || event.clientNumber || event.id;
      const url = `${window.location.origin}/${identifier}?guest=${qrModalGuest.token}`;
      QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff'
        }
      })
      .then(setGuestQrCodeUrl)
      .catch(err => console.error("Failed to generate guest QR", err));
    } else {
      setGuestQrCodeUrl('');
    }
  }, [qrModalGuest, event]);

  useEffect(() => {
    if (eventQrModal) {
      const identifier = eventQrModal.slug || eventQrModal.clientNumber || eventQrModal.id;
      const url = `${window.location.origin}/${identifier}`;
      QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff'
        }
      })
      .then(setEventQrCodeUrl)
      .catch(err => console.error("Failed to generate event QR", err));
    } else {
      setEventQrCodeUrl('');
    }
  }, [eventQrModal]);

  // Gallery Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Theme browser search / favoriting state
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'serif' | 'modern' | 'minimal'>('all');
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>(['luxury']);
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);

  // Take down & Delete modal state
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  // Google Sheets Export & Post-Event Feedback loop state
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<GoogleSheetsExportResult | null>(null);
  const [eventRating, setEventRating] = useState<number>(5);
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  const handleSheetsExport = async (deleteAfter: boolean = false) => {
    if (!event) return;
    setIsExportingToSheets(true);
    try {
      const guestbookEntries = await mockApi.getGuestbookEntries(event.id);
      const res = await exportEventToGoogleSheets({
        event,
        guests,
        guestbookEntries,
        rating: eventRating,
        comments: feedbackComments
      });

      setSheetsResult(res);

      // Save rating, feedback, and archive flag to Firebase event document
      await mockApi.updateEvent(event.id, {
        rating: eventRating,
        feedbackComments: feedbackComments,
        archivedToSheets: true,
        sheetsUrl: res.spreadsheetUrl || event.sheetsUrl || ''
      });

      toast(res.message, "success");

      if (deleteAfter) {
        toast("Archive saved to Google Sheets! Executing post-event cleanup and deletion...", "info");
        setTimeout(async () => {
          await mockApi.deleteEvent(event.id);
          setConfirmDeleteModal(false);
          setShowSheetsModal(false);
          onBackToDashboard();
        }, 1200);
      }
    } catch (err: any) {
      toast(err.message || "Failed to export archive to Google Sheets.", "error");
    } finally {
      setIsExportingToSheets(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const evt = await mockApi.getEventById(eventId);
        if (evt) {
          setEvent(evt);
          const gst = await mockApi.getGuests(eventId);
          setGuests(gst);
          const act = await mockApi.getRecentActivities(eventId);
          setActivities(act);
        }
      } catch (e) {
        toast("Failed to coordinate event data.", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  if (isLoading || !event) {
    return (
      <div className="py-24 text-center bg-stone-50 min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-semibold text-zinc-500 font-mono">Opening event coordination capsule...</span>
      </div>
    );
  }

  // Calculate quick stats
  const totalGuests = guests.length;
  const acceptedCount = guests.filter(g => g.rsvpStatus === 'accepted').length;
  const declinedCount = guests.filter(g => g.rsvpStatus === 'declined').length;
  const pendingCount = guests.filter(g => g.rsvpStatus === 'pending').length;
  const companionTotal = guests.filter(g => g.rsvpStatus === 'accepted').reduce((sum, g) => sum + g.companionsCount, 0);
  const aggregateHeadcount = acceptedCount + companionTotal;
  const respondedCount = acceptedCount + declinedCount;
  const responsePercent = totalGuests > 0 ? Math.round((respondedCount / totalGuests) * 100) : 0;

  // Actions
  const handlePublish = async () => {
    try {
      const updated = await mockApi.updateEvent(event.id, { status: 'published' });
      setEvent(updated);
      toast("Event published live successfully!", "success");
    } catch (e) {
      toast("Failed to publish event.", "error");
    }
  };

  const handleToggleTakeDown = async () => {
    try {
      const newStatus = event.status === 'taken_down' ? 'published' : 'taken_down';
      const updated = await mockApi.updateEvent(event.id, { status: newStatus });
      setEvent(updated);
      if (newStatus === 'taken_down') {
        toast("Site taken down! Public visitors will now see an offline notice.", "info");
      } else {
        toast("Site republished live! Public visitors can now view the invitation page.", "success");
      }
    } catch (e) {
      toast("Failed to update site status.", "error");
    }
  };

  const handleDeleteSite = async () => {
    try {
      await mockApi.deleteEvent(event.id);
      setConfirmDeleteModal(false);
      toast("Event site deleted permanently.", "info");
      onBackToDashboard();
    } catch (e) {
      toast("Failed to delete event.", "error");
    }
  };

  const handleArchive = async () => {
    try {
      const updated = await mockApi.updateEvent(event.id, { status: 'archived' });
      setEvent(updated);
      toast("Event moved to local archive sheets.", "info");
    } catch (e) {
      toast("Failed to archive event.", "error");
    }
  };

  const handleAddManualGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) return;
    try {
      const newGuest = await mockApi.addGuest(event.id, {
        name: addName,
        email: addEmail || 'none@provided.com',
        phone: addPhone || 'N/A',
        isVip: addVip,
        isFamily: addFamily,
        tableNumber: addTable || 'TBD Table',
        rsvpStatus: 'pending',
        companionsCount: 0
      });
      setGuests([...guests, newGuest]);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddTable('');
      setAddVip(false);
      setAddFamily(false);
      setIsAddingGuest(false);
      toast(`${newGuest.name} added to guest list.`, "success");
    } catch (e) {
      toast("Failed to append guest.", "error");
    }
  };

  const handleImportBulk = async () => {
    // mock spreadsheet import
    const rawList = [
      { name: "Robert Crawley", email: "grantham@downton.com", phone: "+1 555-0101", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'pending' as const, companionsCount: 0 },
      { name: "Cora Crawley", email: "cora@downton.com", phone: "+1 555-0102", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'pending' as const, companionsCount: 0 },
      { name: "Matthew Crawley", email: "matthew@crawley.com", phone: "+1 555-0103", isVip: false, isFamily: true, tableNumber: "Table 2", rsvpStatus: 'pending' as const, companionsCount: 1 },
      { name: "Tom Branson", email: "tom.branson@motors.com", phone: "+1 555-0104", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'pending' as const, companionsCount: 0 }
    ];
    try {
      const added = await mockApi.addBulkGuests(event.id, rawList);
      setGuests([...guests, ...added]);
      toast(`Successfully imported ${added.length} guests from spreadsheet.`, "success");
    } catch (e) {
      toast("Spreadsheet parse mismatch.", "error");
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await mockApi.deleteGuest(id);
      setGuests(guests.filter(g => g.id !== id));
      toast("Guest removed from coordinates.", "success");
    } catch (e) {
      toast("Delete action failed.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGuestIds.length === 0) return;
    try {
      await mockApi.deleteBulkGuests(selectedGuestIds);
      setGuests(guests.filter(g => !selectedGuestIds.includes(g.id)));
      setSelectedGuestIds([]);
      toast("Bulk deleted selected guests.", "success");
    } catch (e) {
      toast("Bulk delete failed.", "error");
    }
  };

  const toggleSelectGuest = (id: string) => {
    if (selectedGuestIds.includes(id)) {
      setSelectedGuestIds(selectedGuestIds.filter(gid => gid !== id));
    } else {
      setSelectedGuestIds([...selectedGuestIds, id]);
    }
  };

  const handleExportCSV = () => {
    // Generate a physical CSV file inside browser memory and trigger actual download!
    const headers = "Name,Email,Phone,VIP,Family,Table,RSVP Status,Companions,Response Date\n";
    const rows = guests.map(g => 
      `"${g.name}","${g.email}","${g.phone}","${g.isVip ? 'YES':'NO'}","${g.isFamily ? 'YES':'NO'}","${g.tableNumber}","${g.rsvpStatus}","${g.companionsCount}","${g.responseDate || 'N/A'}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_guestlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Guest list spreadsheet exported successfully!", "success");
  };

  // Drag & drop & file upload handlers for gallery & cover images
  const [isDragging, setIsDragging] = useState(false);

  const processUploadedPictureFiles = (files: FileList | File[], targetField: 'gallery' | 'cover' | 'hero' = 'gallery') => {
    if (!event || !files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i));

    if (fileArray.length === 0) {
      toast("Please select valid picture files (JPG, PNG, WEBP, GIF).", "error");
      return;
    }

    setUploadProgress(10);
    const loadedImages: string[] = [];
    let completed = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          loadedImages.push(e.target.result);
        }
        completed++;
        const pct = Math.min(95, Math.round((completed / fileArray.length) * 100));
        setUploadProgress(pct);

        if (completed === fileArray.length) {
          setTimeout(() => {
            setUploadProgress(100);
            if (targetField === 'cover' && loadedImages[0]) {
              const updatedEvent = { ...event, coverImage: loadedImages[0] };
              setEvent(updatedEvent);
              mockApi.updateEvent(event.id, { coverImage: loadedImages[0] });
              toast("Splash cover photo updated successfully!", "success");
            } else if (targetField === 'hero' && loadedImages[0]) {
              const updatedEvent = { ...event, heroBackground: loadedImages[0] };
              setEvent(updatedEvent);
              mockApi.updateEvent(event.id, { heroBackground: loadedImages[0] });
              toast("Countdown background photo updated successfully!", "success");
            } else {
              const updatedList = [...loadedImages, ...(event.galleryImages || [])];
              const updatedEvent = { ...event, galleryImages: updatedList };
              setEvent(updatedEvent);
              mockApi.updateEvent(event.id, { galleryImages: updatedList });
              toast(`${fileArray.length} picture${fileArray.length > 1 ? 's' : ''} uploaded to microsite gallery!`, "success");
            }
            setTimeout(() => setUploadProgress(null), 500);
          }, 300);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleToggleFavoriteTheme = (themeId: string) => {
    if (favoriteThemes.includes(themeId)) {
      setFavoriteThemes(favoriteThemes.filter(id => id !== themeId));
      toast("Removed theme from dashboard favorites.", "info");
    } else {
      setFavoriteThemes([...favoriteThemes, themeId]);
      toast("Added theme to favorites panel!", "success");
    }
  };

  // Filtered Guests
  const filteredGuests = guests.filter(g => {
    const searchMatch = g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                        g.email.toLowerCase().includes(guestSearch.toLowerCase());
    
    const vipMatch = filterVip === 'all' || 
                     (filterVip === 'vip' && g.isVip) || 
                     (filterVip === 'non-vip' && !g.isVip);

    const familyMatch = filterFamily === 'all' || 
                        (filterFamily === 'family' && g.isFamily) || 
                        (filterFamily === 'non-family' && !g.isFamily);

    const statusMatch = filterStatus === 'all' || g.rsvpStatus === filterStatus;

    return searchMatch && vipMatch && familyMatch && statusMatch;
  }).sort((a, b) => {
    if (sortField === 'name') return a.name.localeCompare(b.name);
    return a.tableNumber.localeCompare(b.tableNumber);
  });

  // Filtered Templates
  const filteredThemes = THEMES.filter(t => {
    const sMatch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
                   t.description.toLowerCase().includes(templateSearch.toLowerCase());
    
    const catMatch = templateFilter === 'all' || 
                     (templateFilter === 'serif' && t.fontHeading.includes('serif')) || 
                     (templateFilter === 'modern' && t.fontHeading.includes('sans')) || 
                     (templateFilter === 'minimal' && t.id === 'minimal');
    return sMatch && catMatch;
  });

  return (
    <div className="p-6 sm:p-10 bg-stone-50 min-h-screen text-left">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Navigation back and title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="flex flex-col gap-2">
            <button 
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-800 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all workspaces</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900">{event.name}</h2>
              {event.status === 'published' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">● Published Live</span>
              )}
              {event.status === 'taken_down' && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">🚫 Taken Down (Offline)</span>
              )}
              {event.status === 'pending_approval' && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">⏰ Pending Approval</span>
              )}
              {event.status === 'draft' && (
                <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">○ Draft</span>
              )}
              {event.status === 'archived' && (
                <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Archived</span>
              )}
            </div>
            <span className="text-xs text-zinc-400 font-mono">ID: {event.id} — Scheduled on {new Date(event.date).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => onPreviewEvent(event.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 bg-white rounded-xl text-xs font-bold text-zinc-700 hover:bg-stone-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-zinc-500" />
              <span>Preview Website</span>
            </button>

            <button 
              onClick={() => {
                toast("Compiling event brief & guest ledger summary...", "info");
                setTimeout(() => {
                  window.print();
                }, 400);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-200/60 bg-amber-50/75 hover:bg-amber-100/90 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01]"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Download PDF Summary</span>
            </button>

            <button 
              onClick={() => {
                const identifier = event.slug || event.clientNumber || event.id;
                const url = `${window.location.origin}/${identifier}`;
                navigator.clipboard.writeText(url);
                toast("Event public link copied to clipboard!", "success");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 bg-white rounded-xl text-xs font-bold text-zinc-700 hover:bg-stone-50 transition-colors"
            >
              <Link2 className="w-4 h-4 text-zinc-500" />
              <span>Copy Link</span>
            </button>

            <button 
              onClick={() => setShowSheetsModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-emerald-300/80 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export to Google Sheets</span>
            </button>

            <button 
              onClick={() => {
                setEventQrModal(event);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 bg-white rounded-xl text-xs font-bold text-zinc-700 hover:bg-stone-50 transition-colors"
            >
              <QrCode className="w-4 h-4 text-zinc-500" />
              <span>Get QR Code</span>
            </button>

            {/* Take Down / Republish Toggle */}
            {event.status === 'taken_down' ? (
              <button 
                onClick={handleToggleTakeDown}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Globe className="w-4 h-4 text-emerald-100" />
                <span>Publish Live</span>
              </button>
            ) : (
              <button 
                onClick={handleToggleTakeDown}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-sm transition-colors"
                title="Take down site so visitors see an offline notice"
              >
                <EyeOff className="w-4 h-4" />
                <span>Take Down Site</span>
              </button>
            )}

            <button 
              onClick={() => setConfirmDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-250 hover:border-rose-200 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
              title="Delete site permanently"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Site</span>
            </button>
          </div>
        </div>

        {/* Offline Taken Down Banner */}
        {event.status === 'taken_down' && (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950">This Invitation Site is Currently Taken Down (Offline)</h4>
                <p className="text-xs text-rose-700 mt-0.5">Guests visiting your public microsite URL will see an offline notice. You can republish it live at any time.</p>
              </div>
            </div>
            <button
              onClick={handleToggleTakeDown}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Publish Live Now</span>
            </button>
          </div>
        )}

        {/* Countdown Timer Banner */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">Time Remaining Until Event Start Date</span>
            <span className="text-sm font-bold text-zinc-800">Your celebration scheduled on <span className="font-serif italic text-indigo-600">{new Date(event.date).toLocaleDateString([], { dateStyle: 'long' })}</span> is counting down!</span>
          </div>
          <div className="bg-stone-50 border border-zinc-150 px-6 py-2 rounded-xl self-start md:self-auto">
            <Countdown targetDate={`${event.date}T${event.time}:00`} themeFontHeading="font-sans" themeColor="#4f46e5" />
          </div>
        </div>

        {/* Dashboard Menu Tabs */}
        <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-px">
          {[
            { id: 'overview', label: 'Overview & Analytics' },
            { id: 'guests', label: 'Guest List Coordinator' },
            { id: 'rsvps', label: 'Meal & RSVP Planner' },
            { id: 'gallery', label: 'Gallery Asset Studio' },
            { id: 'templates', label: 'Canva Design Templates' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 relative ${
                activeTab === tab.id 
                  ? 'border-stone-900 text-stone-900 font-bold' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ACTIVE TAB RENDERERS */}
        <div className="flex flex-col gap-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Analytics Summary */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Real-time RSVP Progress Summary Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-br from-stone-900 to-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Users className="w-32 h-32 text-white" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-emerald-400">REAL-TIME TELEMETRY CONNECTED</span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-stone-100">RSVP Campaign Velocity</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Real-time compilation of verified responses and seat coordinates.</p>
                    </div>
                    
                    <div className="bg-zinc-800/60 border border-zinc-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-300">Response Rate:</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{responsePercent}%</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>{respondedCount} Responded</span>
                      <span>{pendingCount} Pending</span>
                      <span>{totalGuests} Total Invited</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${responsePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Live Summary Grid */}
                  <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Primary Guests</span>
                      <span className="text-2xl font-bold font-mono text-stone-100 mt-1">{totalGuests} <span className="text-xs text-zinc-500 font-normal">invited</span></span>
                    </div>
                    <div className="flex flex-col border-l border-zinc-800 pl-4">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Attending Companions</span>
                      <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">+{companionTotal} <span className="text-xs text-zinc-500 font-normal">guests</span></span>
                    </div>
                    <div className="flex flex-col border-l border-zinc-800 pl-4">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Aggregate Seats</span>
                      <span className="text-2xl font-bold font-mono text-amber-400 mt-1">{aggregateHeadcount} <span className="text-xs text-zinc-500 font-normal">secured</span></span>
                    </div>
                  </div>
                </motion.div>

                {/* Visual Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                    className="bg-white p-5 rounded-xl border border-zinc-150 flex flex-col gap-1.5 shadow-sm"
                  >
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Invited Total</span>
                    <span className="text-2xl font-bold text-zinc-800 font-display">{totalGuests}</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    className="bg-white p-5 rounded-xl border border-zinc-150 flex flex-col gap-1.5 shadow-sm"
                  >
                    <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">Attending Headcount</span>
                    <span className="text-2xl font-bold text-emerald-600 font-display">{aggregateHeadcount}</span>
                    <span className="text-[9px] text-zinc-400">{acceptedCount} primary, {companionTotal} companions</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                    className="bg-white p-5 rounded-xl border border-zinc-150 flex flex-col gap-1.5 shadow-sm"
                  >
                    <span className="text-[9px] font-mono font-bold text-rose-500 uppercase">Declined</span>
                    <span className="text-2xl font-bold text-rose-600 font-display">{declinedCount}</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    className="bg-white p-5 rounded-xl border border-zinc-150 flex flex-col gap-1.5 shadow-sm"
                  >
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">Pending responses</span>
                    <span className="text-2xl font-bold text-amber-600 font-display">{pendingCount}</span>
                  </motion.div>
                </div>

                {/* RSVP Over Time line chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-zinc-800">RSVP Progress Stream</h4>
                      <span className="text-[10px] text-zinc-400">Total accepted vs declined over time</span>
                    </div>
                    <span className="bg-stone-50 border border-zinc-200 py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold text-zinc-600">Live telemetry</span>
                  </div>
                  <RSVPLineChart guests={guests} />
                </motion.div>

                {/* Recent Activities */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4"
                >
                  <h4 className="text-sm font-serif font-bold text-zinc-800 border-b border-zinc-100 pb-2">Active telemetry log</h4>
                  <div className="flex flex-col gap-3 text-xs max-h-[180px] overflow-y-auto no-scrollbar">
                    {activities.map((act) => (
                      <div key={act.id} className="flex gap-3 justify-between items-start text-zinc-500">
                        <div className="flex gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 shrink-0" />
                          <p><strong className="text-zinc-800">{act.guestName}</strong> {act.detail}</p>
                        </div>
                        <span className="text-[9px] font-mono shrink-0">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    {activities.length === 0 && <span className="text-zinc-400 italic">No activity recorded for this event.</span>}
                  </div>
                </motion.div>

              </div>

              {/* Pie segments side panel */}
              <div className="lg:col-span-4 flex flex-col gap-6">

                {/* Google Sheets Loop Feedback & Archival Card */}
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-md flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <FileSpreadsheet className="w-28 h-28 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-800/80 text-emerald-200 border border-emerald-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
                        <span>Master Sheets Loop</span>
                      </span>
                      {event.archivedToSheets && (
                        <span className="bg-emerald-400 text-stone-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          ✓ Exported
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-base font-serif font-bold text-stone-100">Post-Event Google Sheets Archival</h4>
                    <p className="text-xs text-emerald-200/80 leading-relaxed mt-1">
                      Automatically exports couple names, location, attended headcount ({acceptedCount + companionTotal}), theme used, ratings, and feedback comments before post-wedding deletion.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-emerald-800/60">
                    <button
                      type="button"
                      onClick={() => setShowSheetsModal(true)}
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{event.archivedToSheets ? 'View / Re-export to Sheets' : 'Export Feedback to Google Sheets'}</span>
                    </button>

                    {(sheetsResult?.spreadsheetUrl || event.sheetsUrl) && (
                      <a
                        href={sheetsResult?.spreadsheetUrl || event.sheetsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center text-[11px] font-mono text-emerald-300 hover:underline pt-1 flex items-center justify-center gap-1"
                      >
                        <span>Open Live Master Google Sheet</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
                
                {/* Guest category donuts */}
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4"
                >
                  <h4 className="text-sm font-serif font-bold text-zinc-800 border-b border-zinc-100 pb-2">Guest Categories ratio</h4>
                  <GuestCategoryDonut />
                </motion.div>

                {/* Event Cover detail preview */}
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden p-4 shadow-sm"
                >
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-3">Live Page Settings</span>
                  <div className="rounded-xl overflow-hidden h-36 border border-zinc-200 relative mb-4">
                    <img src={event.coverImage} className="w-full h-full object-cover" alt="Cover" />
                    <div className="absolute inset-0 bg-stone-950/20" />
                    <div className="absolute bottom-3 left-3 bg-white/95 border border-zinc-150 text-[10px] font-bold py-1 px-2 rounded-lg text-zinc-800">
                      Active Theme: <strong className="text-amber-600 font-mono font-bold">{event.themeId.toUpperCase()}</strong>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                      <span className="text-zinc-400">Venue Address</span>
                      <span className="font-semibold text-zinc-800 truncate max-w-[150px]">{event.venue}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                      <span className="text-zinc-400">Date/Time</span>
                      <span className="font-semibold text-zinc-800">{event.date} — {event.time}</span>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          )}

          {/* GUEST LIST COORDINATOR */}
          {activeTab === 'guests' && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6">
              
              {/* Header Action Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex flex-1 items-center gap-3 max-w-md border border-zinc-250 py-1.5 px-3 rounded-xl bg-stone-50">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search guest names or coordinates..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="w-full bg-transparent border-none text-xs outline-none text-zinc-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleImportBulk}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-stone-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Import Sheet</span>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-stone-50"
                  >
                    <Download className="w-4 h-4 text-zinc-500" />
                    <span>Export CSV</span>
                  </button>
                  <button 
                    onClick={() => setIsAddingGuest(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Guest</span>
                  </button>
                </div>
              </div>

              {/* Tab Filters */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500 bg-stone-50 p-2.5 rounded-xl border border-zinc-150">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Filters:</span>
                </div>
                
                {/* VIP filter */}
                <select value={filterVip} onChange={(e: any) => setFilterVip(e.target.value)} className="bg-white border border-zinc-200 rounded py-1 px-1.5 outline-none font-medium">
                  <option value="all">VIP Status: All</option>
                  <option value="vip">Only VIPs</option>
                  <option value="non-vip">Non VIPs</option>
                </select>

                {/* Family filter */}
                <select value={filterFamily} onChange={(e: any) => setFilterFamily(e.target.value)} className="bg-white border border-zinc-200 rounded py-1 px-1.5 outline-none font-medium">
                  <option value="all">Category: All</option>
                  <option value="family">Only Family</option>
                  <option value="non-family">Non Family</option>
                </select>

                {/* RSVP filter */}
                <select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)} className="bg-white border border-zinc-200 rounded py-1 px-1.5 outline-none font-medium">
                  <option value="all">RSVP: All</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="pending">Pending</option>
                </select>

                {/* Sorter */}
                <select value={sortField} onChange={(e: any) => setSortField(e.target.value)} className="bg-white border border-zinc-200 rounded py-1 px-1.5 outline-none font-medium ml-auto">
                  <option value="name">Sort by: Name (A-Z)</option>
                  <option value="table">Sort by: Table number</option>
                </select>
              </div>

              {/* Interactive Add Manual form Drawer/Popup */}
              <AnimatePresence>
                {isAddingGuest && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddManualGuest}
                    className="p-4 border border-zinc-200 rounded-xl bg-stone-50/50 flex flex-col gap-4 text-xs font-sans overflow-hidden"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
                      <span className="font-bold text-zinc-700">Add Guest Manually</span>
                      <button type="button" onClick={() => setIsAddingGuest(false)} className="text-zinc-400 hover:text-zinc-600"><XCircle className="w-4.5 h-4.5" /></button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-zinc-500">Guest / Family Name</label>
                        <input type="text" required placeholder="Mr. & Mrs. Sterling" value={addName} onChange={(e) => setAddName(e.target.value)} className="px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-zinc-500">Email Address</label>
                        <input type="email" placeholder="sterling@email.com" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className="px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-zinc-500">Phone Coordinate</label>
                        <input type="text" placeholder="+1 555-0199" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} className="px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-zinc-500">Table Placement</label>
                        <input type="text" placeholder="Table 5" value={addTable} onChange={(e) => setAddTable(e.target.value)} className="px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={addVip} onChange={(e) => setAddVip(e.target.checked)} className="rounded text-amber-500" />
                          <span className="font-semibold text-zinc-600">VIP Status</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={addFamily} onChange={(e) => setAddFamily(e.target.checked)} className="rounded text-amber-500" />
                          <span className="font-semibold text-zinc-600">Family Group</span>
                        </label>
                      </div>

                      <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all">Save Guest Entry</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Guest table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3 pl-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedGuestIds.length === filteredGuests.length && filteredGuests.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGuestIds(filteredGuests.map(g => g.id));
                            } else {
                              setSelectedGuestIds([]);
                            }
                          }}
                          className="rounded text-amber-500"
                        />
                      </th>
                      <th className="p-3">Guest Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Table No.</th>
                      <th className="p-3">Attributes</th>
                      <th className="p-3">Personal Invitation Links</th>
                      <th className="p-3">QR Codes</th>
                      <th className="p-3 pr-4 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150">
                    {filteredGuests.map((g) => {
                      const isSelected = selectedGuestIds.includes(g.id);
                      return (
                        <tr key={g.id} className={`hover:bg-stone-50/50 ${isSelected ? 'bg-amber-50/10' : ''}`}>
                          <td className="p-3 pl-4">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectGuest(g.id)}
                              className="rounded text-amber-500"
                            />
                          </td>
                          <td className="p-3">
                            <div>
                              <span className="font-semibold text-zinc-800">{g.name}</span>
                              <span className="block text-[10px] text-zinc-400 mt-0.5">{g.phone}</span>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-500 font-mono text-[11px]">{g.email}</td>
                          <td className="p-3 font-mono font-semibold text-zinc-600">{g.tableNumber}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {g.isVip && <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">VIP</span>}
                              {g.isFamily && <span className="bg-blue-100 text-blue-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">FAM</span>}
                              {!g.isVip && !g.isFamily && <span className="text-zinc-300">-</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Link2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                              <span className="font-mono text-[10px] select-all max-w-[120px] truncate" title={`${window.location.origin}/${event?.slug || event?.clientNumber || event?.id || eventId}?guest=${g.token}`}>
                                {window.location.host}/{event?.slug || event?.clientNumber || event?.id || eventId}?guest={g.token}
                              </span>
                              <button 
                                onClick={() => {
                                  const identifier = event?.slug || event?.clientNumber || event?.id || eventId;
                                  navigator.clipboard.writeText(`${window.location.origin}/${identifier}?guest=${g.token}`);
                                  toast(`Copied custom invitation link for ${g.name}!`, "success");
                                }}
                                className="text-amber-600 hover:text-amber-700 font-semibold font-sans text-[10px] shrink-0"
                              >
                                Copy Link
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => setQrModalGuest(g)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-zinc-200 rounded-lg text-[10px] font-semibold text-zinc-600"
                            >
                              <QrCode className="w-3 h-3 text-zinc-500" />
                              <span>Show QR</span>
                            </button>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <button onClick={() => handleDeleteGuest(g.id)} className="text-zinc-400 hover:text-rose-600 p-0.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredGuests.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-400">No guests match the current active filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bulk operations bar */}
              {selectedGuestIds.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-xs text-rose-800">
                  <span className="font-semibold">{selectedGuestIds.length} guests selected for bulk operation</span>
                  <button 
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* MEAL & RSVP PLANNER */}
          {activeTab === 'rsvps' && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6 text-left">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-zinc-800">Attendance & RSVP Sheet</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Summary of attendance, companions, and total seat count calculations.</p>
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-stone-50"
                >
                  <Download className="w-4 h-4 text-zinc-500" />
                  <span>Download RSVP CSV Spreadsheet</span>
                </button>
              </div>

              {/* Attendance summary block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-lg font-bold font-mono">👥</div>
                  <div>
                    <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">Primary Guests</span>
                    <span className="text-xl font-bold font-display text-indigo-950 block mt-0.5">{guests.filter(g => g.rsvpStatus === 'accepted').length} accepted</span>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center text-lg font-bold font-mono">➕</div>
                  <div>
                    <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Companions</span>
                    <span className="text-xl font-bold font-display text-rose-950 block mt-0.5">{guests.filter(g => g.rsvpStatus === 'accepted').reduce((sum, g) => sum + (g.companionsCount || 0), 0)} attending</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center text-lg font-bold font-mono">🎪</div>
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Total Headcount</span>
                    <span className="text-xl font-bold font-display text-amber-950 block mt-0.5">
                      {guests.filter(g => g.rsvpStatus === 'accepted').length + guests.filter(g => g.rsvpStatus === 'accepted').reduce((sum, g) => sum + (g.companionsCount || 0), 0)} total seats
                    </span>
                  </div>
                </div>
              </div>

              {/* RSVP Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3 pl-4">Guest</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Companions</th>
                      <th className="p-3">Date Responded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150">
                    {guests.filter(g => g.rsvpStatus !== 'pending').map((g) => (
                      <tr key={g.id} className="hover:bg-stone-50/50">
                        <td className="p-3 pl-4">
                          <span className="font-semibold text-zinc-800 block">{g.name}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">{g.email}</span>
                        </td>
                        <td className="p-3">
                          {g.rsvpStatus === 'accepted' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 py-0.5 px-2.5 rounded-full font-bold">✓ Attending</span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 py-0.5 px-2.5 rounded-full font-bold">✗ Declined</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-semibold text-zinc-600">{g.rsvpStatus === 'accepted' ? `+ ${g.companionsCount} companions` : '-'}</td>
                        <td className="p-3 text-zinc-400 font-mono">{g.responseDate || 'Jun 28'}</td>
                      </tr>
                    ))}

                    {guests.filter(g => g.rsvpStatus !== 'pending').length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-400">No RSVP responses received yet. Send guest links to receive updates.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* GALLERY ASSET STUDIO */}
          {activeTab === 'gallery' && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6 text-left font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-zinc-800">Media Asset Studio</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Upload pictures from your computer or device. Photos added here will instantly render inside your invitation microsite gallery.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hidden inputs for direct upload */}
                  <input 
                    type="file" 
                    id="dash-gallery-upload" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && processUploadedPictureFiles(e.target.files, 'gallery')}
                  />
                  <input 
                    type="file" 
                    id="dash-cover-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && processUploadedPictureFiles(e.target.files, 'cover')}
                  />
                  <input 
                    type="file" 
                    id="dash-hero-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && processUploadedPictureFiles(e.target.files, 'hero')}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('dash-cover-upload') as HTMLInputElement | null;
                      if (input) input.click();
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload Cover Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('dash-hero-upload') as HTMLInputElement | null;
                      if (input) input.click();
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload Hero Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('dash-gallery-upload') as HTMLInputElement | null;
                      if (input) input.click();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pictures</span>
                  </button>
                </div>
              </div>

              {/* Drag Zone */}
              <div 
                onClick={() => {
                  const input = document.getElementById('dash-gallery-upload') as HTMLInputElement | null;
                  if (input) input.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processUploadedPictureFiles(e.dataTransfer.files, 'gallery');
                  }
                }}
                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-50/50 scale-[1.01] shadow-inner' 
                    : 'border-zinc-200 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50/90'
                }`}
              >
                {uploadProgress !== null ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-600">Reading and processing picture files...</span>
                    <div className="w-64 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-400">{uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-10 h-10 ${isDragging ? 'text-amber-500 animate-bounce' : 'text-zinc-400'}`} />
                    <span className="text-sm font-semibold text-zinc-700">
                      {isDragging ? 'Drop picture files here!' : 'Drag & drop pictures here, or '}
                      {!isDragging && <span className="text-amber-700 underline font-bold">browse from your computer</span>}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Supports JPG, PNG, WEBP, GIF, HEIC</span>
                  </div>
                )}
              </div>

              {/* Primary Key Photos */}
              <div className="flex flex-col gap-3 pt-2">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Primary Event Pictures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cover Photo */}
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-3 flex gap-3 items-center">
                    <img src={event.coverImage} className="w-20 h-20 object-cover rounded-lg border border-stone-200 shrink-0" alt="Cover" />
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">Splash Cover Photo</span>
                        <p className="text-xs text-zinc-500 mt-1">Displayed when guests first open the invitation</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('dash-cover-upload') as HTMLInputElement | null;
                          if (input) input.click();
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 mt-2"
                      >
                        <Upload className="w-3 h-3" /> Change Cover Picture
                      </button>
                    </div>
                  </div>

                  {/* Hero Background */}
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-3 flex gap-3 items-center">
                    <img src={event.heroBackground} className="w-20 h-20 object-cover rounded-lg border border-stone-200 shrink-0" alt="Hero Backdrop" />
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded uppercase">Countdown Background</span>
                        <p className="text-xs text-zinc-500 mt-1">Displayed behind event titles & countdown timer</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('dash-hero-upload') as HTMLInputElement | null;
                          if (input) input.click();
                        }}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 mt-2"
                      >
                        <Upload className="w-3 h-3" /> Change Background Picture
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Gallery Pictures grid */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Gallery Grid Pictures ({(event.galleryImages || []).length})
                  </h4>
                  {(event.galleryImages || []).length > 0 && (
                    <span className="text-[11px] text-stone-500">Hover over any picture to assign its role or delete</span>
                  )}
                </div>

                {(event.galleryImages || []).length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-500">
                    No gallery pictures uploaded yet. Click "Add Pictures" above to upload photos of your celebration!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(event.galleryImages || []).map((imgUrl, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-zinc-200 relative group h-44 bg-stone-100">
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`Gallery asset ${idx + 1}`} />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold bg-stone-900/90 text-stone-200 px-2 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <button 
                              title="Delete picture"
                              onClick={async () => {
                                const updatedList = (event.galleryImages || []).filter((_, i) => i !== idx);
                                const updatedEvent = { ...event, galleryImages: updatedList };
                                setEvent(updatedEvent);
                                await mockApi.updateEvent(event.id, { galleryImages: updatedList });
                                toast("Picture removed from gallery.", "success");
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                const updatedEvent = { ...event, coverImage: imgUrl };
                                setEvent(updatedEvent);
                                await mockApi.updateEvent(event.id, { coverImage: imgUrl });
                                toast("Set as Splash Cover photo!", "success");
                              }}
                              className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 text-[10px] font-bold rounded flex items-center justify-center gap-1"
                            >
                              Set as Cover
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const updatedEvent = { ...event, heroBackground: imgUrl };
                                setEvent(updatedEvent);
                                await mockApi.updateEvent(event.id, { heroBackground: imgUrl });
                                toast("Set as Countdown Background!", "success");
                              }}
                              className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                            >
                              Set as Background
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TEMPLATES SELECTOR (Canva-style) */}
          {activeTab === 'templates' && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6 text-left font-sans">
              
              {/* Canva search & filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-zinc-800">Canva Template Shop</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Browse premium layout skins. Pick the skin that best aligns with your celebration branding.</p>
                </div>

                <div className="flex flex-1 items-center gap-3 max-w-xs border border-zinc-250 py-1 px-3 rounded-xl bg-stone-50">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full bg-transparent border-none text-xs outline-none text-zinc-800"
                  />
                </div>
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {[
                  { id: 'all', label: 'All Templates' },
                  { id: 'serif', label: 'Calligraphy & Editorial' },
                  { id: 'modern', label: 'Geometric Modern' },
                  { id: 'minimal', label: 'Ultra Minimalist' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setTemplateFilter(btn.id as any)}
                    className={`py-1.5 px-4 rounded-xl border transition-all ${
                      templateFilter === btn.id 
                        ? 'bg-stone-900 border-stone-950 text-white font-bold' 
                        : 'border-zinc-200 text-zinc-500 hover:bg-stone-50'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Templates card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredThemes.map((theme) => {
                  const isCurrent = event.themeId === theme.id;
                  const isFav = favoriteThemes.includes(theme.id);
                  return (
                    <div 
                      key={theme.id}
                      className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between group relative transition-all ${
                        isCurrent ? 'border-indigo-600 shadow-indigo-200/15 ring-2 ring-indigo-600/10' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {/* Canva like overlay */}
                      <div className="h-44 relative bg-zinc-950 overflow-hidden">
                        {/* Simulated Canvas layout preview */}
                        <div className={`absolute inset-0 p-5 ${theme.bgColor} text-stone-900 flex flex-col justify-between font-sans scale-100 group-hover:scale-105 transition-transform duration-500`}>
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.primaryColor }}>
                            <span>💍 Union Invitation</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                          </div>
                          
                          <div className="text-center py-4">
                            <h4 className={`text-base font-bold ${theme.fontHeading}`} style={{ color: theme.primaryColor }}>
                              {theme.name} Skin
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-mono font-medium">Fonts: {theme.fontHeading.replace('font-', '')} / {theme.fontBody.replace('font-', '')}</span>
                          </div>

                          <div className="h-px bg-zinc-200/50 w-full" />
                        </div>

                        {/* Hover Overlay triggers */}
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                          <button 
                            onClick={() => setPreviewThemeId(theme.id as ThemeId)}
                            className="bg-white/95 text-stone-900 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-100 flex items-center gap-1 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Preview</span>
                          </button>
                          
                          <button 
                            onClick={async () => {
                              const updated = await mockApi.updateEvent(event.id, { themeId: theme.id, themeColor: theme.primaryColor });
                              setEvent(updated);
                              toast(`Website layout skin successfully changed to ${theme.name}!`, "success");
                            }}
                            className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>Use Design</span>
                          </button>
                        </div>

                        {/* Top-right Favoriting heart icon */}
                        <button 
                          onClick={() => handleToggleFavoriteTheme(theme.id)}
                          className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow hover:scale-110 transition-transform"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : 'text-zinc-400'}`} />
                        </button>
                      </div>

                      <div className="p-5 bg-white border-t border-zinc-150">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-zinc-800">{theme.name}</h4>
                          {isCurrent && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-250 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">Active skin</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-normal mt-1.5">{theme.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* GUEST QR CODE PREVIEW MODAL */}
      <AnimatePresence>
        {qrModalGuest && (
          <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full overflow-hidden shadow-2xl p-6 text-center flex flex-col gap-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Invitation Credentials</span>
                <button onClick={() => setQrModalGuest(null)} className="text-zinc-400 hover:text-zinc-600"><XCircle className="w-5 h-5" /></button>
              </div>

              <div>
                <h4 className="text-base font-bold text-zinc-800">{qrModalGuest.name}</h4>
                <span className="text-xs text-zinc-400">Section Assignment: {qrModalGuest.tableNumber}</span>
              </div>

              {/* Dynamic generated QR Code */}
              <div className="bg-stone-50 border border-zinc-150 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="w-40 h-40 border-4 border-white shadow-md bg-white p-2 relative flex items-center justify-center">
                  {guestQrCodeUrl ? (
                    <img 
                      src={guestQrCodeUrl} 
                      className="w-full h-full object-contain" 
                      alt="Guest QR Code" 
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-zinc-400 font-mono">Generating...</div>
                  )}
                  {/* Floating app icon inside center of QR code */}
                  <div className="absolute w-10 h-10 bg-white border-2 border-stone-200 rounded-lg flex items-center justify-center p-0.5 shadow-sm select-none">
                    <img src="/logo.jpg" className="w-full h-full object-contain" alt="PE" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">SECURED BY PAM'S EVENTS</span>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const identifier = event?.slug || event?.clientNumber || event?.id || eventId;
                    navigator.clipboard.writeText(`${window.location.origin}/${identifier}?guest=${qrModalGuest.token}`);
                    toast(`Copied personalized link for ${qrModalGuest.name}!`, "success");
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Link2 className="w-4 h-4 text-white" />
                  <span>Copy invitation URL link</span>
                </button>
                
                <button 
                  onClick={() => {
                    if (!guestQrCodeUrl) return;
                    const link = document.createElement('a');
                    link.href = guestQrCodeUrl;
                    link.download = `pamsevents_guest_${qrModalGuest.name.toLowerCase().replace(/\s+/g, '_')}_qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast(`Downloaded QR code for ${qrModalGuest.name}!`, "success");
                    setQrModalGuest(null);
                  }}
                  className="w-full py-2 border border-zinc-250 hover:bg-stone-50 text-zinc-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>Download High-Res QR code image</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVENT SITE SPECIFIC QR CODE PREVIEW MODAL */}
      <AnimatePresence>
        {eventQrModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full overflow-hidden shadow-2xl p-6 text-center flex flex-col gap-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Microsite QR Code</span>
                <button onClick={() => setEventQrModal(null)} className="text-zinc-400 hover:text-zinc-600"><XCircle className="w-5 h-5" /></button>
              </div>

              <div>
                <h4 className="text-base font-bold text-zinc-800">{eventQrModal.name}</h4>
                <span className="text-xs text-zinc-400">Share Public Event Website</span>
              </div>

              {/* Dynamic generated QR Code */}
              <div className="bg-stone-50 border border-zinc-150 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="w-40 h-40 border-4 border-white shadow-md bg-white p-2 relative flex items-center justify-center">
                  {eventQrCodeUrl ? (
                    <img 
                      src={eventQrCodeUrl} 
                      className="w-full h-full object-contain" 
                      alt="Event QR Code" 
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xs text-zinc-400 font-mono">Generating...</div>
                  )}
                  {/* Floating app icon inside center of QR code */}
                  <div className="absolute w-10 h-10 bg-white border-2 border-stone-200 rounded-lg flex items-center justify-center p-0.5 shadow-sm select-none">
                    <img src="/logo.jpg" className="w-full h-full object-contain" alt="PE" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">SECURED BY PAM'S EVENTS</span>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const identifier = eventQrModal.slug || eventQrModal.clientNumber || eventQrModal.id;
                    navigator.clipboard.writeText(`${window.location.origin}/${identifier}`);
                    toast(`Copied public link for ${eventQrModal.name}!`, "success");
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Link2 className="w-4 h-4 text-white" />
                  <span>Copy public link</span>
                </button>
                
                <button 
                  onClick={() => {
                    if (!eventQrCodeUrl) return;
                    const link = document.createElement('a');
                    link.href = eventQrCodeUrl;
                    link.download = `pamsevents_${eventQrModal.name.toLowerCase().replace(/\s+/g, '_')}_qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast(`Downloaded QR code for ${eventQrModal.name}!`, "success");
                    setEventQrModal(null);
                  }}
                  className="w-full py-2 border border-zinc-250 hover:bg-stone-50 text-zinc-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>Download High-Res QR code image</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewThemeId && (
          <ThemePreviewModal
            isOpen={!!previewThemeId}
            onClose={() => setPreviewThemeId(null)}
            themeId={previewThemeId}
            onSelect={async (id) => {
              const theme = THEMES.find(t => t.id === id);
              if (theme) {
                const updated = await mockApi.updateEvent(event.id, { themeId: id, themeColor: theme.primaryColor });
                setEvent(updated);
                toast(`Website layout skin successfully changed to ${theme.name}!`, "success");
              }
            }}
            eventData={event}
          />
        )}
      </AnimatePresence>

      {/* 
        =========================================
        HIGH-FIDELITY PRINTABLE AREA (PDF PREVIEW)
        =========================================
      */}
      <div className="hidden print:block printable-area bg-white text-zinc-900 p-8 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-stone-850 pb-5 mb-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold">Woke Media Studio SaaS</span>
            <h1 className="text-3xl font-serif font-black tracking-tight text-zinc-900 mt-1">Event Coordination Brief</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">GENERATED ON {new Date().toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-stone-900 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
              {event.status === 'published' ? '● Published Live' : '⏰ Drafting Sheet'}
            </span>
            <p className="text-[11px] font-mono text-zinc-400 mt-2">ID: {event.id}</p>
          </div>
        </div>

        {/* Cover Thumbnail & Description section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 print-avoid-break">
          {event.coverImage && (
            <div className="md:col-span-4 h-32 rounded-xl overflow-hidden border border-zinc-250">
              <img src={event.coverImage} className="w-full h-full object-cover" alt="Cover" />
            </div>
          )}
          <div className={`${event.coverImage ? 'md:col-span-8' : 'md:col-span-12'} flex flex-col justify-center`}>
            <h2 className="text-xl font-serif font-bold text-zinc-800 mb-2">{event.name}</h2>
            <p className="text-xs text-zinc-600 leading-relaxed italic">"{event.description || 'No description supplied.'}"</p>
          </div>
        </div>

        {/* Crucial Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 mb-8 print-avoid-break">
          <div>
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Primary Venue</span>
            <p className="text-xs font-bold text-zinc-800 mt-1">{event.venue}</p>
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Target Date</span>
            <p className="text-xs font-bold text-zinc-800 mt-1">{event.date}</p>
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Scheduled Time</span>
            <p className="text-xs font-bold text-zinc-800 mt-1">{event.time}</p>
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Client Number</span>
            <p className="text-xs font-bold text-zinc-800 font-mono mt-1">{event.clientNumber || 'TBD Reference'}</p>
          </div>
        </div>

        {/* Statistical Ledger Overview */}
        <div className="mb-8 print-avoid-break">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400 border-b border-zinc-200 pb-1.5 mb-4">Executive Indicators</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-zinc-200 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase block mb-1">Invited Total</span>
              <span className="text-2xl font-bold font-serif text-zinc-800">{totalGuests}</span>
            </div>
            <div className="border border-zinc-200 rounded-xl p-4 text-center bg-emerald-50/30">
              <span className="text-[10px] font-mono font-semibold text-emerald-600 uppercase block mb-1">Attending (Head)</span>
              <span className="text-2xl font-bold font-serif text-emerald-700">{aggregateHeadcount}</span>
              <p className="text-[8px] text-zinc-400 mt-0.5">{acceptedCount} primary, {companionTotal} extra</p>
            </div>
            <div className="border border-zinc-200 rounded-xl p-4 text-center bg-rose-50/30">
              <span className="text-[10px] font-mono font-semibold text-rose-500 uppercase block mb-1">Declined</span>
              <span className="text-2xl font-bold font-serif text-rose-700">{declinedCount}</span>
            </div>
            <div className="border border-zinc-200 rounded-xl p-4 text-center bg-amber-50/30">
              <span className="text-[10px] font-mono font-semibold text-amber-500 uppercase block mb-1">Pending</span>
              <span className="text-2xl font-bold font-serif text-amber-700">{pendingCount}</span>
            </div>
          </div>

          <div className="mt-4 border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-zinc-500 mb-1">
                <span>RSVP Completion Rate</span>
                <span>{responsePercent}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-zinc-800 h-full rounded-full" style={{ width: `${responsePercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Guest Ledger */}
        <div className="mb-8 print-avoid-break">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400 border-b border-zinc-200 pb-1.5 mb-4">Official Guest Registry</h3>
          {guests.length === 0 ? (
            <p className="text-xs italic text-zinc-400 text-center py-4 border border-dashed border-zinc-200 rounded-xl">No guests are currently registered in this database.</p>
          ) : (
            <table className="w-full text-left text-xs border border-zinc-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 uppercase font-mono text-[9px] tracking-wider">
                  <th className="py-2.5 px-3 border-b border-zinc-200">Guest Name</th>
                  <th className="py-2.5 px-3 border-b border-zinc-200">RSVP Status</th>
                  <th className="py-2.5 px-3 border-b border-zinc-200">Table No.</th>
                  <th className="py-2.5 px-3 border-b border-zinc-200">Companions</th>
                  <th className="py-2.5 px-3 border-b border-zinc-200">Contact Details</th>
                  <th className="py-2.5 px-3 border-b border-zinc-200 text-center">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {guests.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-3 font-semibold text-zinc-800">{g.name}</td>
                    <td className="py-2 px-3">
                      {g.rsvpStatus === 'accepted' && (
                        <span className="text-emerald-700 font-bold font-mono text-[10px]">✓ Confirmed</span>
                      )}
                      {g.rsvpStatus === 'declined' && (
                        <span className="text-rose-600 font-bold font-mono text-[10px]">✗ Declined</span>
                      )}
                      {g.rsvpStatus === 'pending' && (
                        <span className="text-amber-600 font-bold font-mono text-[10px]">? Pending</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-zinc-600">{g.tableNumber || 'N/A'}</td>
                    <td className="py-2 px-3 font-mono text-zinc-500">{g.companionsCount > 0 ? `+${g.companionsCount}` : 'None'}</td>
                    <td className="py-2 px-3 text-[11px]">
                      <p className="text-zinc-600 truncate">{g.email}</p>
                      <p className="text-zinc-400 text-[10px]">{g.phone}</p>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {g.isVip && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">VIP</span>
                        )}
                        {g.isFamily && (
                          <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">FAM</span>
                        )}
                        {!g.isVip && !g.isFamily && <span className="text-zinc-300">-</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Telemetry log & Activity Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-avoid-break">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400 border-b border-zinc-200 pb-1.5 mb-3">Recent Operational Activity</h3>
            <div className="flex flex-col gap-2.5 max-h-[160px] overflow-hidden">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="text-[11px] border-l-2 border-zinc-200 pl-2.5 py-0.5">
                  <span className="text-zinc-400 font-mono text-[9px] block">
                    {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-zinc-700 leading-normal mt-0.5">{act.description}</p>
                </div>
              ))}
              {activities.length === 0 && <p className="text-xs italic text-zinc-400">No telemetry records exist.</p>}
            </div>
          </div>

          <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between bg-zinc-50/20">
            <div>
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-2">Operational Approval Block</span>
              <p className="text-xs text-zinc-500 leading-relaxed">This brief provides the official coordination list as preserved by Woke Media Event Systems. Please cross-reference table IDs prior to venue setup.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="border-t border-zinc-300 pt-1.5 text-center">
                <span className="text-[8px] font-mono uppercase text-zinc-400 block">Lead Planner Sign-Off</span>
              </div>
              <div className="border-t border-zinc-300 pt-1.5 text-center">
                <span className="text-[8px] font-mono uppercase text-zinc-400 block">Venue Director Approval</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Event Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-stone-100">Delete Event Site & Credentials?</h3>
                <p className="text-xs text-zinc-500 dark:text-stone-400">Post-event cleanup & permanent purge</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-950 p-3.5 rounded-xl border border-zinc-200 dark:border-stone-800">
              Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-stone-100 font-bold">{event.name}</strong>? All guest invitations, RSVPs, meal choices, guestbook messages, gallery photos, and client credentials will be removed.
            </p>

            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Recommended: Google Sheets Backup</span>
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                You can automatically export event details, host names, location, attended headcount, rating, and feedback comments to Google Sheets before purging.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteModal(false);
                  setShowSheetsModal(true);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to Sheets First</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteSite}
                className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Immediately</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Export & Feedback Loop Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-stone-100">Google Sheets Archive & Loop Feedback</h3>
                  <p className="text-xs text-zinc-500 dark:text-stone-400">Export event records & client feedback directly to Google Sheets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-stone-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Export Payload Preview */}
            <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-zinc-200 dark:border-stone-800 text-xs">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Event Name</span>
                <span className="font-bold text-zinc-800 dark:text-stone-200">{event.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Couple / Host Names</span>
                <span className="font-bold text-zinc-800 dark:text-stone-200">
                  {event.type === 'wedding'
                    ? `${event.brideName || 'Bride'} & ${event.groomName || 'Groom'}`
                    : (event.birthdayPerson || event.name)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Location / Venue</span>
                <span className="font-medium text-zinc-700 dark:text-stone-300">{event.venue}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Event Date</span>
                <span className="font-medium text-zinc-700 dark:text-stone-300">{event.date}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Attended Headcount</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{acceptedCount + companionTotal} Guests (Accepted)</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Theme Applied</span>
                <span className="font-medium text-amber-600 uppercase font-mono">{event.themeId}</span>
              </div>
            </div>

            {/* Feedback Rating & Comments Form */}
            <div className="flex flex-col gap-4 border-t border-zinc-200 dark:border-stone-800 pt-4">
              <div>
                <label className="text-xs font-bold text-zinc-800 dark:text-stone-200 block mb-1.5">
                  Post-Event Satisfaction Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEventRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= eventRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-amber-600 ml-2">{eventRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-800 dark:text-stone-200 block mb-1.5">
                  Client Feedback & Event Retrospective Notes
                </label>
                <textarea
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Add any host notes, vendor performance notes, or feedback regarding the event execution..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Status / Live Google Sheet link */}
            {(sheetsResult?.spreadsheetUrl || event.sheetsUrl) && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                  ✓ Master Google Sheet archive connected.
                </span>
                <a
                  href={sheetsResult?.spreadsheetUrl || event.sheetsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open in Google Sheets</span>
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-stone-400 dark:hover:text-stone-100 rounded-xl"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isExportingToSheets}
                onClick={() => handleSheetsExport(false)}
                className="px-4 py-2.5 text-xs font-bold bg-zinc-100 dark:bg-stone-800 hover:bg-zinc-200 dark:hover:bg-stone-700 text-zinc-800 dark:text-stone-200 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isExportingToSheets ? (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                )}
                <span>Export to Sheets (Keep Live)</span>
              </button>

              <button
                type="button"
                disabled={isExportingToSheets}
                onClick={() => handleSheetsExport(true)}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isExportingToSheets ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Export & Delete Event Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
