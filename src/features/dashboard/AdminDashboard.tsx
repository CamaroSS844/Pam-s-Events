/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Sparkles, CheckCircle, XCircle, Users, Layers, Activity, CalendarCheck, 
  ArrowRight, ShieldCheck, HelpCircle, Eye, AlertCircle, FileCheck2,
  UserPlus, ShieldAlert, Trash2, Ban, Unlock, FileText, Search, UserCheck, MessageSquare,
  Lock, Mail, User as UserIcon, Link2, QrCode, Download, FileSpreadsheet, Star
} from 'lucide-react';
import { mockApi } from '../../services/mockApi';
import { Countdown } from '../../components/Countdown';
import { EventModel, Guest, User } from '../../types';
import { exportEventToGoogleSheets } from '../../services/googleSheetsService';
import { AdminGrowthSummaryChart } from '../../components/AnalyticsCharts';

interface AdminDashboardProps {
  onBackToDashboard: () => void;
  onPreviewEvent: (eventId: string) => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

type AdminTab = 'proposals' | 'clients' | 'cross-metrics' | 'sheets-exports';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToDashboard,
  onPreviewEvent,
  toast
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('proposals');
  const [pendingEvents, setPendingEvents] = useState<EventModel[]>([]);
  const [allEvents, setAllEvents] = useState<EventModel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client form states
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientLimit, setNewClientLimit] = useState(3);
  const [newClientPassword, setNewClientPassword] = useState('123456789');
  const [newClientRole, setNewClientRole] = useState<'client' | 'admin'>('client');

  // Observation state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [metricsSearchQuery, setMetricsSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Event QR Code modals
  const [qrModalEvent, setQrModalEvent] = useState<EventModel | null>(null);
  const [eventQrCodeUrl, setEventQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (qrModalEvent) {
      const identifier = qrModalEvent.slug || qrModalEvent.clientNumber || qrModalEvent.id;
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
  }, [qrModalEvent]);

  const loadData = async () => {
    try {
      const events = await mockApi.getEvents();
      const usersData = await mockApi.getUsers();
      const guestsData = await mockApi.getAllGuests();
      
      setAllEvents(events);
      setPendingEvents(events.filter(e => e.status === 'pending_approval'));
      setUsers(usersData);
      setAllGuests(guestsData);
    } catch (e) {
      toast("Failed to pull system statistics and client rosters.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (eventId: string) => {
    try {
      await mockApi.updateEvent(eventId, { status: 'published' });
      toast("Event website proposal approved and marked live!", "success");
      loadData();
    } catch (e) {
      toast("Action failed.", "error");
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      await mockApi.updateEvent(eventId, { status: 'draft' });
      toast("Proposal rejected. Event reverted to draft states for clients.", "info");
      loadData();
    } catch (e) {
      toast("Action failed.", "error");
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) {
      toast("Please provide both name and email.", "error");
      return;
    }
    try {
      await mockApi.createUser(newClientName, newClientEmail, newClientRole, newClientLimit, newClientPassword);
      toast(`Successfully created ${newClientRole} credentials for ${newClientName}!`, "success");
      setNewClientName('');
      setNewClientEmail('');
      setNewClientLimit(3);
      setNewClientPassword('123456789');
      setNewClientRole('client');
      setIsCreatingClient(false);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create client credentials.", "error");
    }
  };

  const handleToggleBlock = async (user: User) => {
    const nextBlockStatus = !user.isBlocked;
    try {
      await mockApi.updateUser(user.id, { isBlocked: nextBlockStatus });
      toast(
        nextBlockStatus 
          ? `Suspended ${user.name}'s account credentials.` 
          : `Restored access credentials for ${user.name}.`,
        "success"
      );
      loadData();
    } catch (e) {
      toast("Failed to update block status.", "error");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${userName}'s account? This will permanently delete their account, all of their events, and all guest lists.`)) {
      return;
    }
    try {
      await mockApi.deleteUser(userId);
      toast(`Client ${userName} and all associated data permanently deleted.`, "success");
      loadData();
    } catch (e) {
      toast("Failed to delete client account.", "error");
    }
  };

  const handleBulkBlock = async (isBlocked: boolean) => {
    if (selectedUserIds.length === 0) return;
    try {
      await mockApi.bulkUpdateUsersBlockStatus(selectedUserIds, isBlocked);
      toast(
        isBlocked 
          ? `Suspended ${selectedUserIds.length} selected accounts.` 
          : `Restored access for ${selectedUserIds.length} selected accounts.`,
        "success"
      );
      setSelectedUserIds([]);
      loadData();
    } catch (e) {
      toast("Failed to update status for selected accounts.", "error");
    }
  };

  const handleBulkQuota = async (eventLimit: number) => {
    if (selectedUserIds.length === 0) return;
    try {
      await mockApi.bulkUpdateUsersQuota(selectedUserIds, eventLimit);
      toast(`Updated permitted event limit to ${eventLimit} for ${selectedUserIds.length} accounts.`, "success");
      setSelectedUserIds([]);
      loadData();
    } catch (e) {
      toast("Failed to reassign event quotas.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you absolutely sure you want to permanently delete the ${selectedUserIds.length} selected client accounts? This will permanently erase their credentials, all associated wedding/birthday microsites, and guest lists! This is irreversible.`)) {
      return;
    }
    try {
      await mockApi.bulkDeleteUsers(selectedUserIds);
      toast(`Successfully deleted ${selectedUserIds.length} client accounts and all of their wedding/birthday microsites.`, "success");
      setSelectedUserIds([]);
      loadData();
    } catch (e) {
      toast("Failed to complete bulk deletion.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center bg-stone-50 min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-semibold text-zinc-500 font-mono">Opening admin ledger sheets...</span>
      </div>
    );
  }

  // Filtered metrics list
  const filteredEvents = allEvents.filter(evt => {
    const q = metricsSearchQuery.toLowerCase();
    const client = users.find(u => u.id === evt.clientId);
    return (
      evt.name.toLowerCase().includes(q) ||
      evt.type.toLowerCase().includes(q) ||
      (client?.name || '').toLowerCase().includes(q) ||
      (client?.email || '').toLowerCase().includes(q)
    );
  });

  // Consolidated system stats
  const totalSystemGuests = allGuests.length;
  const totalAttendingGuests = allGuests.filter(g => g.rsvpStatus === 'accepted').length;
  const totalCompanions = allGuests.filter(g => g.rsvpStatus === 'accepted' && g.hasCompanion).length;
  const systemResponseRate = totalSystemGuests > 0 
    ? Math.round((allGuests.filter(g => g.rsvpStatus !== 'pending').length / totalSystemGuests) * 100) 
    : 0;

  return (
    <div className="p-6 sm:p-10 bg-stone-50 min-h-screen text-left font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Title area */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900">Media Agency Admin Command</h2>
            <p className="text-sm text-zinc-500 mt-1">Audit active client portfolios, validate submitted layouts, and verify system load ratios.</p>
          </div>

          <button 
            onClick={onBackToDashboard}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.01]"
          >
            Switch to Client View
          </button>
        </div>

        {/* Visual Growth & Attendee Recharts Summary */}
        <AdminGrowthSummaryChart events={allEvents} guests={allGuests} />

        {/* Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col gap-1 shadow-sm">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Awaiting Approval</span>
            <span className="text-2xl font-extrabold text-amber-600 font-sans">{pendingEvents.length} PROPOSALS</span>
            <span className="text-[10px] text-zinc-400 mt-1">Pending design layout reviews</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col gap-1 shadow-sm">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Managed Accounts</span>
            <span className="text-2xl font-extrabold text-zinc-800 font-sans">{users.filter(u => u.role === 'client').length} clients</span>
            <span className="text-[10px] text-zinc-400 mt-1">Hosting custom invitation pages</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col gap-1 shadow-sm">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Consolidated System RSVPs</span>
            <span className="text-2xl font-extrabold text-blue-600 font-sans">{totalAttendingGuests + totalCompanions} Headcount</span>
            <span className="text-[10px] text-zinc-400 mt-1">{totalAttendingGuests} attending + {totalCompanions} companions</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col gap-1 shadow-sm">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Average System Response Rate</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-sans">{systemResponseRate}%</span>
            <span className="text-[10px] text-zinc-400 mt-1">Of {totalSystemGuests} registered guests</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-zinc-200 -mb-4 z-10">
          <button 
            onClick={() => { setActiveTab('proposals'); setSelectedEventId(null); setSelectedUserIds([]); }}
            className={`py-3 px-6 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'proposals' 
                ? 'border-indigo-600 text-indigo-600 font-bold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Approval Queue ({pendingEvents.length})</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('clients'); setSelectedEventId(null); setSelectedUserIds([]); }}
            className={`py-3 px-6 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'clients' 
                ? 'border-indigo-600 text-indigo-600 font-bold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Accounts & Quotas</span>
          </button>

          <button 
            onClick={() => { setActiveTab('cross-metrics'); setSelectedEventId(null); setSelectedUserIds([]); }}
            className={`py-3 px-6 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'cross-metrics' 
                ? 'border-indigo-600 text-indigo-600 font-bold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Cross-Event Metrics Observer</span>
          </button>

          <button 
            onClick={() => { setActiveTab('sheets-exports'); setSelectedEventId(null); setSelectedUserIds([]); }}
            className={`py-3 px-6 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sheets-exports' 
                ? 'border-emerald-600 text-emerald-600 font-bold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Export Log</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* SUBMITTED PROPOSALS TAB */}
            {activeTab === 'proposals' && (
              <motion.div
                key="proposals-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-base font-serif font-bold text-zinc-800">Submitted Event Websites Queue</h3>
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full font-mono">{pendingEvents.length} Proposals pending</span>
                </div>

                {pendingEvents.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center gap-3">
                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-700">All submissions validated and cleared!</h4>
                      <p className="text-xs text-zinc-400 mt-1">There are no pending weddings or birthday party templates waiting for verification.</p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider">
                        <tr>
                          <th className="p-3 pl-4">Event Microsite Name</th>
                          <th className="p-3">Client details</th>
                          <th className="p-3">Chosen Skin Theme</th>
                          <th className="p-3">Scheduled Date</th>
                          <th className="p-3">Audit Layout</th>
                          <th className="p-3 pr-4 text-right">Approve / Reject action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150">
                        {pendingEvents.map((evt) => {
                          const clientUser = users.find(u => u.id === evt.clientId);
                          return (
                            <tr key={evt.id} className="hover:bg-stone-50/50">
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-3">
                                  <img src={evt.coverImage} className="w-10 h-10 rounded-lg object-cover border" alt="Cover" />
                                  <div>
                                    <span className="font-semibold text-zinc-800 block">{evt.name}</span>
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase">{evt.type}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <button 
                                        onClick={() => {
                                          const identifier = evt.slug || evt.clientNumber || evt.id;
                                          const url = `${window.location.origin}/${identifier}`;
                                          navigator.clipboard.writeText(url);
                                          toast("Event public link copied to clipboard!", "success");
                                        }}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono"
                                        title="Copy Public Link"
                                      >
                                        <Link2 className="w-2.5 h-2.5" />
                                        <span>Link</span>
                                      </button>
                                      <span className="text-zinc-300 font-mono text-[9px]">•</span>
                                      <button 
                                        onClick={() => setQrModalEvent(evt)}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 hover:text-amber-800 font-mono"
                                        title="Get Event QR Code"
                                      >
                                        <QrCode className="w-2.5 h-2.5" />
                                        <span>QR</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-zinc-500 font-medium">
                                <div>{clientUser?.name || 'Unknown Client'}</div>
                                <div className="text-[10px] text-zinc-450 font-mono">{clientUser?.email || ''}</div>
                              </td>
                              <td className="p-3">
                                <span className="font-mono bg-stone-100 text-amber-700 py-0.5 px-2 rounded font-bold text-[10px] uppercase">
                                  {evt.themeId}
                                </span>
                              </td>
                              <td className="p-3 text-zinc-500 font-mono font-medium">{evt.date}</td>
                              <td className="p-3">
                                <button 
                                  onClick={() => onPreviewEvent(evt.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-semibold text-zinc-600 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Audit Site</span>
                                </button>
                              </td>
                              <td className="p-3 pr-4 text-right">
                                <div className="inline-flex gap-2">
                                  <button 
                                    onClick={() => handleReject(evt.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition-all"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                  <button 
                                    onClick={() => handleApprove(evt.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-sm transition-all"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Approve Live</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* CLIENT ACCOUNTS & QUOTAS TAB */}
            {activeTab === 'clients' && (
              <motion.div
                key="clients-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Side: Client List */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-serif font-bold text-zinc-800">Client Accounts & Event Limits</h3>
                    <button 
                      onClick={() => setIsCreatingClient(!isCreatingClient)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isCreatingClient ? "Close Creation Drawer" : "Provision New Credentials"}</span>
                    </button>
                  </div>

                  {/* Bulk Actions Menu/Bar */}
                  <AnimatePresence>
                    {selectedUserIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm overflow-hidden"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider font-mono">Bulk Operations Console</span>
                          </div>
                          <p className="text-xs text-indigo-700">
                            Selected <strong className="font-mono text-sm text-indigo-900">{selectedUserIds.length}</strong> client account{selectedUserIds.length > 1 ? 's' : ''}. Action applies to all.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          {/* Deactivate/Suspend */}
                          <button
                            onClick={() => handleBulkBlock(true)}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-50 text-amber-700 hover:text-amber-850 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Suspend access for selected accounts"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>

                          {/* Activate/Restore */}
                          <button
                            onClick={() => handleBulkBlock(false)}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-50 text-emerald-700 hover:text-emerald-850 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Restore access for selected accounts"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>

                          {/* Quota limit update selector */}
                          <div className="flex items-center bg-white border border-indigo-200 rounded-lg px-2 py-0.5 shadow-sm text-xs w-full md:w-auto">
                            <span className="text-zinc-500 font-medium px-1.5 whitespace-nowrap">Quota:</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value !== "") {
                                  handleBulkQuota(Number(e.target.value));
                                  e.target.value = ""; // Reset after action
                                }
                              }}
                              className="bg-transparent border-none py-1 pl-0.5 pr-6 font-bold text-zinc-800 focus:outline-none cursor-pointer text-xs"
                            >
                              <option value="">Set Limit...</option>
                              <option value="1">1 Event</option>
                              <option value="2">2 Events</option>
                              <option value="3">3 (Standard)</option>
                              <option value="5">5 (Professional)</option>
                              <option value="10">10 (Agency)</option>
                              <option value="999">Unlimited</option>
                            </select>
                          </div>

                          {/* Delete selected */}
                          <button
                            onClick={handleBulkDelete}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            title="Permanently delete selected accounts"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          {/* Cancel selection */}
                          <button
                            onClick={() => setSelectedUserIds([])}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-850 px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            Deselect
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Multi-Select Header control */}
                  {users.filter(u => u.email.toLowerCase() !== 'admin@test.com').length > 0 && (
                    <div className="flex items-center justify-between bg-stone-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs">
                      <label className="flex items-center gap-2.5 font-medium text-zinc-600 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={
                            users.filter(u => u.email.toLowerCase() !== 'admin@test.com').length > 0 &&
                            selectedUserIds.length === users.filter(u => u.email.toLowerCase() !== 'admin@test.com').length
                          }
                          onChange={() => {
                            const selectable = users.filter(u => u.email.toLowerCase() !== 'admin@test.com');
                            if (selectedUserIds.length === selectable.length) {
                              setSelectedUserIds([]);
                            } else {
                              setSelectedUserIds(selectable.map(u => u.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-400/30 border-zinc-300 w-4 h-4 cursor-pointer"
                        />
                        <span>Select All Client Accounts ({users.filter(u => u.email.toLowerCase() !== 'admin@test.com').length})</span>
                      </label>
                      {selectedUserIds.length > 0 && (
                        <span className="font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md text-[10px]">{selectedUserIds.length} SELECTED</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {users.map((user) => {
                      const userEvents = allEvents.filter(e => e.clientId === user.id);
                      const quotaLimit = user.eventLimit ?? 3;
                      const usagePercent = user.role === 'admin' ? 0 : (userEvents.length / quotaLimit) * 100;
                      const isNearOrAtQuota = user.role !== 'admin' && usagePercent >= 90;
                      const isAtQuota = user.role === 'admin' ? false : userEvents.length >= quotaLimit;
                      const isPrimaryAdmin = user.email.toLowerCase() === 'admin@test.com';
                      const isSelected = selectedUserIds.includes(user.id);

                      return (
                        <div 
                          key={user.id} 
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                            user.isBlocked 
                              ? 'bg-red-50/40 border-red-150 opacity-85' 
                              : isSelected
                                ? 'bg-indigo-50/30 border-indigo-200 shadow-sm'
                                : isNearOrAtQuota
                                  ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                                  : 'bg-stone-50/50 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {/* User identity details */}
                          <div className="flex items-start gap-3.5">
                            {!isPrimaryAdmin && (
                              <div className="pt-3.5 flex items-center justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                                    } else {
                                      setSelectedUserIds(prev => [...prev, user.id]);
                                    }
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-400/30 border-zinc-300 w-4 h-4 cursor-pointer"
                                />
                              </div>
                            )}
                            <img src={user.avatar} className="w-11 h-11 rounded-xl object-cover border" alt="Avatar" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-zinc-800">{user.name}</span>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}>
                                  {user.role}
                                </span>
                                {user.isBlocked && (
                                  <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">● Suspended</span>
                                )}
                                {isPrimaryAdmin && (
                                  <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Primary Admin</span>
                                )}
                                {isNearOrAtQuota && (
                                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 ${usagePercent < 100 ? 'animate-pulse' : ''}`}>
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{usagePercent >= 100 ? 'Quota Full (100%)' : `Quota Warning (${Math.round(usagePercent)}%)`}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-400 font-mono">{user.email}</span>
                              
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                                  <span>• Passkey: <code className="bg-stone-100 border text-stone-700 px-1 py-0.5 rounded text-[10px] font-bold">{user.password || '123456789'}</code></span>
                                  {user.role !== 'admin' ? (
                                    <span className={isNearOrAtQuota ? 'text-amber-600 font-semibold' : ''}>
                                      • Quota Usage: <strong className="text-zinc-700">{userEvents.length}</strong> of {quotaLimit}
                                    </span>
                                  ) : (
                                    <span className="text-purple-600 font-semibold">• Administrative Privileges (Unlimited)</span>
                                  )}
                                </div>
                                {user.role !== 'admin' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-40 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          usagePercent >= 100 
                                            ? 'bg-rose-600' 
                                            : usagePercent >= 90 
                                              ? 'bg-amber-500 animate-pulse' 
                                              : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                      />
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold ${
                                      usagePercent >= 100 
                                        ? 'text-rose-600' 
                                        : usagePercent >= 90 
                                          ? 'text-amber-600' 
                                          : 'text-zinc-400'
                                    }`}>
                                      {Math.round(usagePercent)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Admin Actions */}
                          {!isPrimaryAdmin ? (
                            <div className="flex items-center gap-2.5 sm:self-center self-end">
                              {/* Block Toggle */}
                              <button 
                                onClick={() => handleToggleBlock(user)}
                                className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  user.isBlocked 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                }`}
                                title={user.isBlocked ? "Restore Access" : "Block Access"}
                              >
                                {user.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>{user.isBlocked ? "Unblock" : "Block"}</span>
                              </button>

                              {/* Delete User */}
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Delete Client Profile Completely"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 font-mono italic pr-2">Protected System Profile</span>
                          )}
                        </div>
                      );
                    })}

                    {users.length === 0 && (
                      <span className="text-zinc-400 text-center py-10 block text-xs">No client accounts found.</span>
                    )}
                  </div>
                </div>

                {/* Right Side: Provision Form & Quota Guidelines */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Create Client Form */}
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-4 text-left">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase block border-b border-zinc-100 pb-2">PROVISION CREDENTIALS</span>
                    
                    <form onSubmit={handleCreateClient} className="flex flex-col gap-4 text-xs font-sans">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Client Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text"
                            required
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Genevieve Dubois"
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all bg-stone-50/50"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Client Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="email"
                            required
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="genevieve@test.com"
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all bg-stone-50/50"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Secure Login Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text"
                            required
                            value={newClientPassword}
                            onChange={(e) => setNewClientPassword(e.target.value)}
                            placeholder="123456789"
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all bg-stone-50/50"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-0.5 font-mono">Tip: Use '123456789' or any secure phrase</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Portal Role</label>
                        <select
                          value={newClientRole}
                          onChange={(e) => setNewClientRole(e.target.value as 'client' | 'admin')}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white font-medium text-zinc-800"
                        >
                          <option value="client">Client Creator (Event Planner)</option>
                          <option value="admin">Admin Dashboard (Agency Owner)</option>
                        </select>
                      </div>

                      {newClientRole === 'client' ? (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Permitted Event Limit (Quota)</label>
                          <select
                            value={newClientLimit}
                            onChange={(e) => setNewClientLimit(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white"
                          >
                            <option value={1}>1 Event permitted</option>
                            <option value={2}>2 Events permitted</option>
                            <option value={3}>3 Events permitted (Standard)</option>
                            <option value={5}>5 Events permitted (Professional)</option>
                            <option value={10}>10 Events permitted (Agency)</option>
                            <option value={999}>Unlimited Events</option>
                          </select>
                        </div>
                      ) : (
                        <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-[10px] text-purple-900 leading-normal font-sans">
                          💡 **Administrative Accounts** automatically receive unlimited event creation quotas and master audit permissions across all hosted client coordinate systems.
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold rounded-xl text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Provision Client Account</span>
                      </button>
                    </form>
                  </div>

                  {/* Quota Rules Card */}
                  <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-850 shadow-md">
                    <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase block mb-2">QUOTA CONSTRAINTS</span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
                      When clients exceed their permitted event limit, their dashboard will show an alert and the event creation wizard will reject submissions.
                    </p>
                    <div className="text-[10px] text-zinc-400 font-mono space-y-1 border-t border-white/10 pt-2.5">
                      <div>• Defaults: Standard plans gets 3 event slots.</div>
                      <div>• Administration: Admin accounts can create unlimited events themselves.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CROSS-EVENT METRICS OBSERVER TAB */}
            {activeTab === 'cross-metrics' && (
              <motion.div
                key="metrics-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6"
              >
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-zinc-800">System-Wide Registry Observer</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Observe real-time RSVP state breakdowns, attending ratios, and direct guest lists from each client page.</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[260px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      value={metricsSearchQuery}
                      onChange={(e) => setMetricsSearchQuery(e.target.value)}
                      placeholder="Search events, clients, types..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all bg-stone-50/50"
                    />
                  </div>
                </div>

                {/* Event Table with Drilldown */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">Event Name & Client</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Responses Progress</th>
                        <th className="p-3 text-center">Attending</th>
                        <th className="p-3 text-center">Companions</th>
                        <th className="p-3 text-center font-mono">Headcount</th>
                        <th className="p-3 pr-4 text-right">Drilldown View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {filteredEvents.map((evt) => {
                        const clientUser = users.find(u => u.id === evt.clientId);
                        const evtGuests = allGuests.filter(g => g.eventId === evt.id);
                        
                        // RSVPs calculation
                        const totalEvtGuests = evtGuests.length;
                        const respondedGuests = evtGuests.filter(g => g.rsvpStatus !== 'pending').length;
                        const attendingGuests = evtGuests.filter(g => g.rsvpStatus === 'accepted').length;
                        const companionsCount = evtGuests.filter(g => g.rsvpStatus === 'accepted' && g.hasCompanion).length;
                        const totalHeadcount = attendingGuests + companionsCount;
                        const progressPercent = totalEvtGuests > 0 
                          ? Math.round((respondedGuests / totalEvtGuests) * 100) 
                          : 0;

                        const isCurrentlyObserved = selectedEventId === evt.id;

                        return (
                          <React.Fragment key={evt.id}>
                            <tr className={`hover:bg-stone-50/50 ${isCurrentlyObserved ? 'bg-indigo-50/20' : ''}`}>
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-3">
                                  <img src={evt.coverImage} className="w-10 h-10 rounded-lg object-cover border" alt="Cover" />
                                  <div>
                                    <span className="font-bold text-zinc-800 block leading-tight">{evt.name}</span>
                                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block font-semibold uppercase">{evt.type} — Host: {clientUser?.name || 'Unknown'}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <button 
                                        onClick={() => {
                                          const identifier = evt.slug || evt.clientNumber || evt.id;
                                          const url = `${window.location.origin}/${identifier}`;
                                          navigator.clipboard.writeText(url);
                                          toast("Event public link copied to clipboard!", "success");
                                        }}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono"
                                        title="Copy Public Link"
                                      >
                                        <Link2 className="w-2.5 h-2.5" />
                                        <span>Link</span>
                                      </button>
                                      <span className="text-zinc-300 font-mono text-[9px]">•</span>
                                      <button 
                                        onClick={() => setQrModalEvent(evt)}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 hover:text-amber-800 font-mono"
                                        title="Get Event QR Code"
                                      >
                                        <QrCode className="w-2.5 h-2.5" />
                                        <span>QR</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                {evt.status === 'published' && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold font-mono">LIVE</span>}
                                {evt.status === 'draft' && <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">DRAFT</span>}
                                {evt.status === 'pending_approval' && <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">PENDING</span>}
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                  <span className="font-mono text-[10px] font-bold text-zinc-700">{respondedGuests}/{totalEvtGuests} ({progressPercent}%)</span>
                                  <div className="w-24 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 text-center font-mono font-bold text-zinc-700">{attendingGuests}</td>
                              <td className="p-3 text-center font-mono font-bold text-zinc-700">{companionsCount}</td>
                              <td className="p-3 text-center font-mono font-extrabold text-indigo-700">{totalHeadcount}</td>

                              <td className="p-3 pr-4 text-right">
                                <button 
                                  onClick={() => setSelectedEventId(isCurrentlyObserved ? null : evt.id)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                    isCurrentlyObserved 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                      : 'bg-stone-50 text-zinc-600 border-zinc-200 hover:bg-stone-100'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{isCurrentlyObserved ? "Close Ledger" : "Observe Guests"}</span>
                                </button>
                              </td>
                            </tr>

                            {/* COLLAPSIBLE ROW FOR DEEP DRILLDOWN */}
                            {isCurrentlyObserved && (
                              <tr>
                                <td colSpan={7} className="p-5 bg-stone-50 border-t border-b border-zinc-200">
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-4 text-left"
                                  >
                                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        <h4 className="text-sm font-bold text-zinc-800">Direct Guest Ledger for {evt.name}</h4>
                                      </div>
                                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">TOKEN TELEMETRY ACTIVE</span>
                                    </div>

                                    {/* Event Countdown Timer (Admin View) */}
                                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div>
                                        <span className="text-[10px] font-mono font-extrabold text-indigo-600 uppercase tracking-widest block mb-0.5">Time Remaining Until Event Date</span>
                                        <span className="text-xs font-semibold text-zinc-600 font-mono">Date: {evt.date} at {evt.time}</span>
                                      </div>
                                      <div className="bg-stone-50 border border-zinc-150 px-5 py-1.5 rounded-lg self-start sm:self-auto">
                                        <Countdown targetDate={`${evt.date}T${evt.time}:00`} themeFontHeading="font-sans" themeColor="#4f46e5" />
                                      </div>
                                    </div>

                                    {evtGuests.length === 0 ? (
                                      <div className="py-8 text-center text-zinc-400 font-mono text-xs">No guests registered for this event yet.</div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Guest list cards */}
                                        {evtGuests.map((guest) => {
                                          const rsvpStyles = {
                                            accepted: "bg-emerald-50 border-emerald-100 text-emerald-800",
                                            declined: "bg-rose-50 border-rose-100 text-rose-800",
                                            pending: "bg-amber-50 border-amber-100 text-amber-800"
                                          };
                                          return (
                                            <div key={guest.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col gap-2.5 shadow-sm">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <span className="font-bold text-zinc-800 text-sm block leading-none">{guest.name}</span>
                                                  <span className="text-[10px] text-zinc-400 font-mono mt-1 block select-all">Token: {guest.token}</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border tracking-wider font-mono ${rsvpStyles[guest.rsvpStatus]}`}>
                                                  {guest.rsvpStatus}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono border-t border-zinc-100 pt-2">
                                                <span>• Companion: <strong>{guest.hasCompanion ? "YES" : "NO"}</strong></span>
                                                {guest.hasCompanion && guest.companionName && (
                                                  <span className="text-zinc-600">• Name: <strong className="text-zinc-800">{guest.companionName}</strong></span>
                                                )}
                                              </div>

                                              {guest.message && (
                                                <div className="bg-stone-50 border border-zinc-150 p-2.5 rounded-lg flex gap-1.5 items-start mt-1">
                                                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                                                  <p className="text-[11px] text-zinc-500 italic leading-snug">"{guest.message}"</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {filteredEvents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-zinc-400 font-mono text-xs">No active event registries match your search query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* GOOGLE SHEETS EXPORT LOG TAB */}
            {activeTab === 'sheets-exports' && (
              <motion.div
                key="sheets-log-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 rounded-2xl">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-zinc-800">Google Sheets Export Transparency & Audit Log</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Real-time log of post-event data archives, client ratings, and loop feedback comments exported to Google Sheets.</p>
                    </div>
                  </div>

                  <a 
                    href="https://docs.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Open Master Google Sheets</span>
                  </a>
                </div>

                {/* Export Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">Exported Events</span>
                    <span className="text-xl font-extrabold text-emerald-900 font-sans">
                      {allEvents.filter(e => e.archivedToSheets).length} / {allEvents.length} Events
                    </span>
                    <span className="text-[10px] text-emerald-700/80">Archived to Google Sheets</span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">Average Client Rating</span>
                    <span className="text-xl font-extrabold text-amber-900 font-sans flex items-center gap-1">
                      {allEvents.filter(e => e.rating).length > 0 
                        ? (allEvents.filter(e => e.rating).reduce((sum, e) => sum + (e.rating || 5), 0) / allEvents.filter(e => e.rating).length).toFixed(1)
                        : "5.0"}
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <span className="text-[10px] text-amber-700/80">Post-event feedback rating</span>
                  </div>

                  <div className="bg-stone-50 border border-zinc-200 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Loop Feedback Comments</span>
                    <span className="text-xl font-extrabold text-zinc-800 font-sans">
                      {allEvents.filter(e => e.feedbackComments).length} Submissions
                    </span>
                    <span className="text-[10px] text-zinc-400">Captured in master sheet</span>
                  </div>
                </div>

                {/* Table of Events with Google Sheets status */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">Event & Hosts</th>
                        <th className="p-3">Venue & Date</th>
                        <th className="p-3 text-center">Attended Headcount</th>
                        <th className="p-3 text-center">Rating</th>
                        <th className="p-3">Client Retrospective / Comments</th>
                        <th className="p-3 pr-4 text-right">Google Sheets Link / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {allEvents.map((evt) => {
                        const evtGuests = allGuests.filter(g => g.eventId === evt.id);
                        const attendingGuests = evtGuests.filter(g => g.rsvpStatus === 'accepted').length;
                        const companionsCount = evtGuests.filter(g => g.rsvpStatus === 'accepted' && g.hasCompanion).length;
                        const totalAttended = attendingGuests + companionsCount;

                        const hostNames = evt.type === 'wedding'
                          ? `${evt.brideName || 'Bride'} & ${evt.groomName || 'Groom'}`
                          : (evt.birthdayPerson || evt.name);

                        return (
                          <tr key={evt.id} className="hover:bg-stone-50/60">
                            <td className="p-3 pl-4">
                              <div className="flex items-center gap-3">
                                <img src={evt.coverImage} className="w-9 h-9 rounded-lg object-cover border" alt="Cover" />
                                <div>
                                  <span className="font-bold text-zinc-800 block leading-tight">{evt.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">{hostNames}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="font-medium text-zinc-700 block text-[11px]">{evt.venue}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{evt.date}</span>
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-emerald-700">
                              {totalAttended} Guests
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-amber-600">
                              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                                <span>{evt.rating || 5}</span>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </div>
                            </td>

                            <td className="p-3 max-w-xs">
                              <p className="text-[11px] text-zinc-600 truncate italic">
                                {evt.feedbackComments || "No comment logged yet."}
                              </p>
                            </td>

                            <td className="p-3 pr-4 text-right">
                              {evt.sheetsUrl ? (
                                <a
                                  href={evt.sheetsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>View in Sheets</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const guestbookEntries = await mockApi.getGuestbookEntries(evt.id);
                                      const res = await exportEventToGoogleSheets({
                                        event: evt,
                                        guests: evtGuests,
                                        guestbookEntries,
                                        rating: evt.rating || 5,
                                        comments: evt.feedbackComments || ''
                                      });
                                      await mockApi.updateEvent(evt.id, {
                                        archivedToSheets: true,
                                        sheetsUrl: res.spreadsheetUrl || evt.sheetsUrl || ''
                                      });
                                      toast(res.message, "success");
                                      loadData();
                                    } catch (err: any) {
                                      toast(err.message || "Failed to export event to Google Sheets.", "error");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-stone-100 text-zinc-700 border border-zinc-200 hover:bg-stone-200 transition-all"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Export Now</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {allEvents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-zinc-400 font-mono text-xs">No event records found in database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* EVENT SITE SPECIFIC QR CODE PREVIEW MODAL */}
        <AnimatePresence>
          {qrModalEvent && (
            <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full overflow-hidden shadow-2xl p-6 text-center flex flex-col gap-5"
              >
                <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Microsite QR Code</span>
                  <button onClick={() => setQrModalEvent(null)} className="text-zinc-400 hover:text-zinc-600"><XCircle className="w-5 h-5" /></button>
                </div>

                <div>
                  <h4 className="text-base font-bold text-zinc-800">{qrModalEvent.name}</h4>
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
                      const identifier = qrModalEvent.slug || qrModalEvent.clientNumber || qrModalEvent.id;
                      navigator.clipboard.writeText(`${window.location.origin}/${identifier}`);
                      toast(`Copied public link for ${qrModalEvent.name}!`, "success");
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
                      link.download = `pamsevents_${qrModalEvent.name.toLowerCase().replace(/\s+/g, '_')}_qr.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast(`Downloaded QR code for ${qrModalEvent.name}!`, "success");
                      setQrModalEvent(null);
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

      </div>
    </div>
  );
};
