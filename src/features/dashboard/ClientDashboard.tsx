/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Calendar, Plus, Users, ClipboardCheck, ArrowRight, 
  HelpCircle, FileCheck2, Clock, CheckCircle2, ShieldAlert, BookOpen,
  Search, X, EyeOff, Globe, Trash2, Power, AlertTriangle
} from 'lucide-react';
import { mockApi } from '../../services/mockApi';
import { EventModel, RecentActivity, User } from '../../types';
import { DashboardCalendar } from '../../components/DashboardCalendar';

interface ClientDashboardProps {
  onSelectEvent: (eventId: string) => void;
  onLaunchWizard: () => void;
  onGoToAdmin?: () => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onSelectEvent,
  onLaunchWizard,
  onGoToAdmin,
  toast
}) => {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  // Take down & delete state
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<{ id: string; name: string } | null>(null);

  const loadData = async () => {
    try {
      const user = await mockApi.getCurrentUser();
      setCurrentUser(user);
      
      const evts = await mockApi.getEvents();
      const acts = await mockApi.getRecentActivities();
      
      if (user) {
        // Filter to only events owned by this specific client
        const filteredEvts = evts.filter(e => e.clientId === user.id);
        setEvents(filteredEvts);
        
        // Filter activities only related to this client's events
        const userEvtIds = filteredEvts.map(e => e.id);
        setActivities(acts.filter(a => userEvtIds.includes(a.eventId)));
      } else {
        setEvents(evts);
        setActivities(acts);
      }
    } catch (e) {
      toast("Failed to load dashboard statistics.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTakeDown = async (eventId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'taken_down' ? 'published' : 'taken_down';
      await mockApi.updateEvent(eventId, { status: newStatus });
      await loadData();
      if (newStatus === 'taken_down') {
        toast("Site taken down! Visitors to this URL will now see an offline notice.", "info");
      } else {
        toast("Site republished live! Public visitors can now view the invitation page.", "success");
      }
    } catch (e) {
      toast("Failed to update site status.", "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await mockApi.deleteEvent(eventId);
      setConfirmDeleteEvent(null);
      await loadData();
      toast("Event microsite deleted permanently.", "info");
    } catch (e) {
      toast("Failed to delete event.", "error");
    }
  };

  const handleLaunchWizard = () => {
    const limit = currentUser?.eventLimit ?? 3;
    if (events.length >= limit) {
      toast(`Event creation quota exceeded! Your account limit is ${limit} events. Please contact your administrator to upgrade.`, "error");
    } else {
      onLaunchWizard();
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center bg-stone-50 min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <span className="text-sm font-semibold text-zinc-500 font-mono">Assembling client workspace cards...</span>
      </div>
    );
  }

  // Calculate totals
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const draftEvents = events.filter(e => e.status === 'draft').length;
  const pendingEvents = events.filter(e => e.status === 'pending_approval').length;
  const totalGuests = events.reduce((sum, e) => sum + (e.guestCount || 0), 0);
  const totalRsvps = events.reduce((sum, e) => sum + (e.rsvpCount || 0), 0);

  const filteredEvents = events.filter((evt) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' ||
      evt.name.toLowerCase().includes(query) ||
      evt.description.toLowerCase().includes(query) ||
      evt.venue.toLowerCase().includes(query) ||
      evt.date.toLowerCase().includes(query);

    const matchesDate = dateFilter === '' || evt.date === dateFilter;
    const matchesType = typeFilter === 'all' || evt.type === typeFilter;

    return matchesSearch && matchesDate && matchesType;
  });

  const statusBadges = {
    published: <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">● Published Live</span>,
    draft: <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">○ Temporary Draft</span>,
    pending_approval: <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">⏰ Pending Approval</span>,
    archived: <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Archived</span>,
    taken_down: <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">🚫 Taken Down</span>
  };

  return (
    <div className="p-6 sm:p-10 bg-stone-50 min-h-screen text-left">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight text-zinc-900">Your Invitation Dashboard</h2>
              {currentUser?.role === 'admin' && (
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">Admin Viewport</span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">Manage active wedding templates, guests responses, and digital media coordinates.</p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && onGoToAdmin && (
              <button 
                onClick={onGoToAdmin}
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Go to Agency Admin</span>
              </button>
            )}

            <button 
              onClick={handleLaunchWizard}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event Microsite</span>
            </button>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Account Quota Status</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-zinc-800">{totalEvents}</span>
              <span className="text-xs text-zinc-400 font-semibold">of {currentUser?.eventLimit ?? 3} created</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 mt-2">
              {totalEvents >= (currentUser?.eventLimit ?? 3) ? (
                <span className="text-amber-600 font-bold">⚠️ Quota limit reached</span>
              ) : (
                <span className="text-emerald-600 font-bold">✓ {(currentUser?.eventLimit ?? 3) - totalEvents} slots remaining</span>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Published Live</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-emerald-600">{publishedEvents}</span>
              <span className="text-xs text-zinc-400 font-semibold">Active</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block mt-2">Websites serving active guest tokens</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Pending Approval</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-amber-500">{pendingEvents}</span>
              <span className="text-xs text-zinc-400 font-semibold">Proposed</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block mt-2">Awaiting design validation from studio</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Consolidated Guests</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-blue-600">{totalGuests}</span>
              <span className="text-xs text-zinc-400 font-semibold">Guests</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block mt-2">{totalRsvps} total RSVP responses logged</span>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Events Stream */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-sans font-bold tracking-tight text-zinc-800 dark:text-stone-100">Your Configured Events</h3>
                <span className="text-[10px] text-zinc-400 dark:text-stone-500 font-mono uppercase">
                  {filteredEvents.length === events.length 
                    ? `${events.length} registries found` 
                    : `${filteredEvents.length} of ${events.length} matching`
                  }
                </span>
              </div>

              {/* Grid vs Calendar Toggle */}
              {events.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-xl shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-sm'
                        : 'text-zinc-500 dark:text-stone-400 hover:text-zinc-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>Grid View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-sm'
                        : 'text-zinc-500 dark:text-stone-400 hover:text-zinc-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendar View</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search and Filters Bar */}
            {events.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-stone-800 shadow-sm transition-colors duration-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search events by name, venue, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-zinc-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-stone-50/50 dark:bg-stone-950/50 text-slate-800 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-stone-500 dark:hover:text-stone-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:w-auto w-full">
                  {/* Date Input Filter */}
                  <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-xs rounded-xl border border-zinc-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-stone-50/50 dark:bg-stone-950/50 text-zinc-700 dark:text-stone-300 font-mono"
                      title="Filter by event date"
                    />
                    {dateFilter && (
                      <button
                        onClick={() => setDateFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-stone-500 dark:hover:text-stone-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Event Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white dark:bg-stone-900 text-zinc-700 dark:text-stone-300 font-medium cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="wedding">Weddings</option>
                    <option value="birthday">Birthdays</option>
                  </select>

                  {(searchQuery || dateFilter || typeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setDateFilter('');
                        setTypeFilter('all');
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2.5 py-2 whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl flex flex-col items-center gap-4">
                <Calendar className="w-10 h-10 text-zinc-300 animate-bounce" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-700">No events found in this client profile</h4>
                  <p className="text-xs text-zinc-400 mt-1">Get started by launching our responsive step-by-step Event Website Builder wizard.</p>
                </div>
                <button 
                  onClick={onLaunchWizard}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm"
                >
                  Launch Event Builder
                </button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-2xl flex flex-col items-center gap-4 transition-colors duration-200">
                <Search className="w-10 h-10 text-zinc-300 dark:text-stone-700 animate-pulse" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-stone-300">No events match your search filters</h4>
                  <p className="text-xs text-zinc-400 dark:text-stone-500 mt-1">Try adjusting your query, selecting a different date, or clearing the filter.</p>
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setTypeFilter('all');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm"
                >
                  Clear Active Filters
                </button>
              </div>
            ) : viewMode === 'calendar' ? (
              <DashboardCalendar 
                events={filteredEvents} 
                onSelectEvent={onSelectEvent} 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img src={evt.coverImage} alt={evt.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">{statusBadges[evt.status]}</div>
                      <span className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-sm text-[9px] font-bold text-white px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                        {evt.type}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-base font-sans font-bold text-zinc-800 leading-snug line-clamp-1">{evt.name}</h4>
                        <p className="text-xs text-zinc-400 leading-normal line-clamp-2 mt-1.5">{evt.description}</p>
                        
                        <div className="flex flex-col gap-1.5 mt-4">
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium font-mono">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-zinc-400" /> {evt.guestCount} invited</span>
                            <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5 text-zinc-400" /> {evt.rsvpCount} RSVPs</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(evt.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-6">
                        <button 
                          onClick={() => onSelectEvent(evt.id)}
                          className="flex-1 border border-zinc-250 hover:bg-stone-50 font-bold text-xs py-2 rounded-xl text-center text-stone-900 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Manage Page</span>
                          <ArrowRight className="w-4 h-4 text-zinc-400" />
                        </button>
                        
                        {/* Take Down / Republish Live Toggle Button */}
                        <button
                          onClick={() => handleToggleTakeDown(evt.id, evt.status)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center ${
                            evt.status === 'taken_down'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-stone-100 border-zinc-200 text-zinc-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                          }`}
                          title={evt.status === 'taken_down' ? "Publish site live to visitors" : "Take down site (set offline)"}
                        >
                          {evt.status === 'taken_down' ? (
                            <Globe className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete Site Permanently Button */}
                        <button
                          onClick={() => setConfirmDeleteEvent({ id: evt.id, name: evt.name })}
                          className="p-2 rounded-xl border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          title="Delete site permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity Feed & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Actions */}
            <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-850 shadow-md">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase block mb-3">Workspace Quick Actions</span>
              <div className="flex flex-col gap-2 text-xs">
                <button 
                  onClick={onLaunchWizard}
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-4 rounded-xl text-left flex items-center justify-between"
                >
                  <span>Build New Wedding Website</span>
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toast("Navigate to theme explorer inside a single event page.", "info")}
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-4 rounded-xl text-left flex items-center justify-between"
                >
                  <span>Browse Template Themes</span>
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent activity log */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase border-b border-zinc-100 pb-2">Recent Guest Activities</span>
              
              <div className="flex flex-col gap-4 max-h-[340px] overflow-y-auto pr-1 no-scrollbar text-xs">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-stone-600 mt-0.5">
                      {act.action === 'rsvp_accepted' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />}
                      {act.action === 'rsvp_declined' && <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />}
                      {act.action === 'opened_invitation' && <Clock className="w-4.5 h-4.5 text-blue-500" />}
                      {act.action === 'guestbook_entry' && <BookOpen className="w-4.5 h-4.5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-zinc-600 leading-normal">
                        <strong className="text-zinc-800 font-semibold">{act.guestName}</strong> {act.detail}
                      </p>
                      <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {act.eventName.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <span className="text-zinc-400 text-center py-6 block">No recent guest telemetry found.</span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Delete Event Confirmation Modal */}
      {confirmDeleteEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-stone-100">Permanently Delete Event Site?</h3>
                <p className="text-xs text-zinc-500 dark:text-stone-400">This action cannot be reversed.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-950 p-3.5 rounded-xl border border-zinc-200 dark:border-stone-800">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-stone-100 font-bold">{confirmDeleteEvent.name}</strong>? All associated guest invitations, RSVP responses, and media will be wiped.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteEvent(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(confirmDeleteEvent.id)}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Site Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
