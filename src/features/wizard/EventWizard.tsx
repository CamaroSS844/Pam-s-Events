/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ArrowLeft, ArrowRight, Sparkles, Calendar, MapPin, 
  ChevronRight, Laptop, Tablet, Smartphone, UploadCloud, X, Plus, 
  Trash2, Search, HelpCircle, FileSpreadsheet, FileText, CheckCircle2, Eye, Palette,
  GripVertical, Clock, Music, Volume2, Play, Pause, Disc, Radio, AlertTriangle
} from 'lucide-react';
import { THEMES } from '../../data/themes';
import { EventModel, Guest, EventType, ThemeId } from '../../types';
import { mockApi } from '../../services/mockApi';
import { EventWebsite } from '../invitation/EventWebsite';
import { ThemePreviewModal } from '../../components/ThemePreviewModal';
import { LocationSelector } from '../../components/LocationSelector';
import { ThemeLibraryModal } from '../../components/ThemeLibraryModal';
import { MUSIC_PRESETS } from '../../components/BackgroundMusicPlayer';

const DEFAULT_WEDDING_AGENDA = [
  { id: 'agenda-1', time: "3:30 PM", title: "Ceremonial Reception & Guest Entrance", desc: "Arrive at the glass conservatory garden paths, soundscape piano acoustics begin." },
  { id: 'agenda-2', time: "4:00 PM", title: "Vows Exchange & Sand Distribution", desc: "The couples deliver customized letters beneath the timber flower arch." },
  { id: 'agenda-3', time: "5:00 PM", title: "Cocktails & Photo Session", desc: "Enjoy champagne, botanic mocktails, and fresh visual portrait captures." },
  { id: 'agenda-4', time: "6:30 PM", title: "Dinner Banquets & Heartfelt Speeches", desc: "A curated three-course dinner, followed by sibling and parent toasts." },
  { id: 'agenda-5', time: "8:30 PM", title: "DJ Grooves & Dancefloor Expansion", desc: "Live music mixers, high energy visual lights, and late-night visual cake service." }
];

const DEFAULT_BIRTHDAY_AGENDA = [
  { id: 'agenda-1', time: "7:30 PM", title: "Speakeasy Secret Ingress", desc: "Unlock the gate coordinates, dress code credential validations." },
  { id: 'agenda-2', time: "8:00 PM", title: "Jazz Quintet & Mixology Pairings", desc: "Craft cocktails served beside comfortable leather lounge chairs." },
  { id: 'agenda-3', time: "9:30 PM", title: "Gala Toasting & Roast Speeches", desc: "Friends deliver retrospective stories of Benjamin’s decades." },
  { id: 'agenda-4', time: "10:30 PM", title: "Midnight Beats & Dynamic DJ Tunnels", desc: "Dance and celebrate into the late hours under custom neon arches." }
];

interface EventWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const EventWizard: React.FC<EventWizardProps> = ({ onComplete, onCancel, toast }) => {
  const [step, setStep] = useState(1);
  
  // State for Wizard form
  const [eventType, setEventType] = useState<EventType>('wedding');
  
  // Agenda / Timeline States
  const [agendaItems, setAgendaItems] = useState<{ id: string; time: string; title: string; desc: string }[]>(DEFAULT_WEDDING_AGENDA);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    if (draggedIndex !== targetIndex) {
      const reorderedItems = [...agendaItems];
      const [removed] = reorderedItems.splice(draggedIndex, 1);
      reorderedItems.splice(targetIndex, 0, removed);
      setAgendaItems(reorderedItems);
      toast("Agenda order updated successfully!", "success");
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddAgendaItem = () => {
    const newItem = {
      id: `agenda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: "12:00 PM",
      title: "New Itinerary Event",
      desc: "Specify the beautiful activities and schedules for this block of time."
    };
    setAgendaItems([...agendaItems, newItem]);
    toast("Added new itinerary milestone!", "success");
  };

  const handleUpdateAgendaItem = (index: number, field: 'time' | 'title' | 'desc', value: string) => {
    const updated = [...agendaItems];
    updated[index] = { ...updated[index], [field]: value };
    setAgendaItems(updated);
  };

  const handleDeleteAgendaItem = (index: number) => {
    const itemToDelete = agendaItems[index];
    const updated = agendaItems.filter((_, i) => i !== index);
    setAgendaItems(updated);
    toast(`Removed "${itemToDelete.title || 'untitled'}" from agenda.`, "info");
  };

  const handleSelectEventType = (type: EventType) => {
    setEventType(type);
    setAgendaItems(type === 'wedding' ? DEFAULT_WEDDING_AGENDA : DEFAULT_BIRTHDAY_AGENDA);
  };
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateBasicInfoField = (field: string, value: any) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }
  const [basicInfo, setBasicInfo] = useState({name: '',
    brideName: '',
    groomName: '',
    birthdayPerson: '',
    date: '2026-09-12',
    time: '16:00',
    venue: '',
    description: '',
    themeColor: '#D4AF37',
    dressCode: '',
    mapLink: '',
    rsvpDeadline: '',
    maxGuestsPerInvitation: 4,
    slug: ''
  });

  // Photos State
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800');
  const [heroBackground, setHeroBackground] = useState('https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200');
  const [galleryImages, setGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600"
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Theme selection
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('luxury');
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);
  const [isThemeLibraryOpen, setIsThemeLibraryOpen] = useState(false);

  // Guest list state
  const [guests, setGuests] = useState<Omit<Guest, 'id' | 'eventId' | 'invitationOpened' | 'token'>[]>([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestVip, setNewGuestVip] = useState(false);
  const [newGuestFamily, setNewGuestFamily] = useState(false);
  const [newGuestTable, setNewGuestTable] = useState('');

  // Background Music state
  const [selectedMusicPreset, setSelectedMusicPreset] = useState<string>('piano-romance');
  const [customMusicUrl, setCustomMusicUrl] = useState<string>('');
  const [musicTitle, setMusicTitle] = useState<string>('Acoustic Piano Romance');
  const [musicAutoPlay, setMusicAutoPlay] = useState<boolean>(true);
  const [previewingAudioUrl, setPreviewingAudioUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreviewAudio = (url: string) => {
    if (previewingAudioUrl === url) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingAudioUrl(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio preview error:", err));
      previewAudioRef.current = audio;
      setPreviewingAudioUrl(url);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
        toast(`File "${file.name}" is not a recognized audio file format.`, "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setCustomMusicUrl(event.target.result);
          setSelectedMusicPreset('custom');
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setMusicTitle(cleanName);
          toast(`Uploaded custom track: "${cleanName}"`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Device preview state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Pre-loaded photo options for immediate click selection
  const imagePresets = {
    wedding: {
      covers: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800"
      ],
      heroes: [
        "https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1519225495810-7517c296517a?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    birthday: {
      covers: [
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800"
      ],
      heroes: [
        "https://images.unsplash.com/photo-1481162854517-d9e353af153d?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200"
      ]
    }
  };

  const processFiles = (files: FileList) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    
    setUploadProgress(10);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast(`File "${file.name}" is not an image.`, "error");
        loadedCount++;
        if (loadedCount === fileList.length && newImages.length === 0) {
          setUploadProgress(null);
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          newImages.push(event.target.result);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          let progress = 10;
          const interval = setInterval(() => {
            progress += 30;
            if (progress >= 100) {
              clearInterval(interval);
              setUploadProgress(null);
              setGalleryImages((prev) => [...prev, ...newImages]);
              toast(`Successfully uploaded ${newImages.length} image(s) from your computer.`, "success");
            } else {
              setUploadProgress(progress);
            }
          }, 100);
        }
      };
      reader.onerror = () => {
        toast(`Error reading file "${file.name}".`, "error");
        loadedCount++;
        if (loadedCount === fileList.length) {
          setUploadProgress(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadClick = () => {
    const fileInput = document.getElementById('wizard-media-upload') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleImportSpreadsheet = (type: 'csv' | 'excel') => {
    // simulated CSV upload: appends 5 mock guests
    const templates = [
      { name: "Lord Grantham", email: "grantham@downton.co.uk", phone: "+44 123 4567", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'pending' as const, companionsCount: 1 },
      { name: "Lady Mary Crawley", email: "mary.crawley@downton.co.uk", phone: "+44 123 4568", isVip: true, isFamily: true, tableNumber: "Table 1", rsvpStatus: 'pending' as const, companionsCount: 0 },
      { name: "John Bates", email: "bates@downton.co.uk", phone: "+44 123 4569", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'pending' as const, companionsCount: 1 },
      { name: "Charles Carson", email: "carson@downton.co.uk", phone: "+44 123 4570", isVip: false, isFamily: false, tableNumber: "Table 3", rsvpStatus: 'pending' as const, companionsCount: 0 },
      { name: "Dowager Countess Violet", email: "dowager@downton.co.uk", phone: "+44 123 0001", isVip: true, isFamily: true, tableNumber: "Table 2", rsvpStatus: 'pending' as const, companionsCount: 0 },
    ];
    setGuests([...guests, ...templates]);
    toast(`Successfully imported ${templates.length} guests from dynamic spreadsheet.`, "success");
  };

  const handleAddManualGuest = () => {
    if (!newGuestName) {
      toast("Guest name is required.", "error");
      return;
    }
    const g = {
      name: newGuestName,
      email: newGuestEmail || 'none@provided.com',
      phone: newGuestPhone || 'N/A',
      isVip: newGuestVip,
      isFamily: newGuestFamily,
      tableNumber: newGuestTable || 'TBD',
      rsvpStatus: 'pending' as const,
      companionsCount: 0
    };
    setGuests([...guests, g]);
    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
    setNewGuestVip(false);
    setNewGuestFamily(false);
    setNewGuestTable('');
    toast(`${g.name} added to temporary list.`, "success");
  };

  const handleDeleteTempGuest = (index: number) => {
    const updated = guests.filter((_, i) => i !== index);
    setGuests(updated);
  };

  const handleFinishWizard = async () => {
    const finalEvent = {
      type: eventType,
      status: 'pending_approval' as const,
      name: basicInfo.name || `${eventType === 'wedding' ? basicInfo.brideName + ' & ' + basicInfo.groomName : basicInfo.birthdayPerson}'s Celebration Website`,
      brideName: eventType === 'wedding' ? basicInfo.brideName : undefined,
      groomName: eventType === 'wedding' ? basicInfo.groomName : undefined,
      birthdayPerson: eventType === 'birthday' ? basicInfo.birthdayPerson : undefined,
      date: basicInfo.date,
      time: basicInfo.time,
      venue: basicInfo.venue || "TBD Venue Coordinates",
      description: basicInfo.description || "You are cordially invited to celebrate this historic day with us. Event schedule, mapping, and meal selection forms are available inside.",
      themeId: selectedThemeId,
      themeColor: basicInfo.themeColor,
      dressCode: basicInfo.dressCode || "Cocktail Attire",
      mapLink: basicInfo.mapLink || "https://maps.google.com",
      coverImage: coverImage,
      galleryImages: galleryImages,
      heroBackground: heroBackground,
      timelineSteps: agendaItems,
      rsvpDeadline: basicInfo.rsvpDeadline || undefined,
      maxGuestsPerInvitation: basicInfo.maxGuestsPerInvitation || 4,
      slug: basicInfo.slug || undefined,
      musicUrl: customMusicUrl || (MUSIC_PRESETS.find(p => p.id === selectedMusicPreset)?.url || MUSIC_PRESETS[0].url),
      musicTitle: musicTitle || "Celebration Background Music",
      musicAutoPlay: musicAutoPlay
    };

    try {
      const created = await mockApi.createEvent(finalEvent);
      // If we have temporary guests, insert them bulk
      if (guests.length > 0) {
        await mockApi.addBulkGuests(created.id, guests);
      }
      toast("Event submitted! Waiting for Media Admin approval.", "success");
      onComplete();
    } catch (e) {
      toast("Failed to submit event.", "error");
    }
  };

  const nextStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      if (eventType === 'wedding') {
        if (!basicInfo.brideName || !basicInfo.brideName.trim()) {
          newErrors.brideName = "This is required";
        }
        if (!basicInfo.groomName || !basicInfo.groomName.trim()) {
          newErrors.groomName = "This is required";
        }
      } else if (eventType === 'birthday') {
        if (!basicInfo.birthdayPerson || !basicInfo.birthdayPerson.trim()) {
          newErrors.birthdayPerson = "This is required";
        }
      }

      if (!basicInfo.date) {
        newErrors.date = "This is required";
      }
      if (!basicInfo.time) {
        newErrors.time = "This is required";
      }
      if (!basicInfo.venue || !basicInfo.venue.trim()) {
        newErrors.venue = "This is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast("Please fill in all required fields highlighted in red.", "error");
      return;
    }

    setErrors({});
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const activePresets = eventType === 'wedding' ? imagePresets.wedding : imagePresets.birthday;

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 font-sans text-left">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col md:flex-row items-stretch">
        
        {/* Left Indicator Rail */}
        <div className="md:w-1/4 bg-stone-900 text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-8 font-serif font-bold">
              <Sparkles className="w-5 h-5" />
              <span>Event Builder</span>
            </div>

            <div className="flex flex-col gap-6">
              {[
                "Event Type",
                "Basic Info",
                "Media Asset Studio",
                "Choose Theme Design",
                "Load Guest List",
                "Live Device Preview",
                "Publish Proposal"
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isCompleted = step > stepNum;
                const isActive = step === stepNum;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (stepNum < step) {
                        setStep(stepNum);
                      }
                    }}
                    className={`flex items-center gap-3 ${stepNum < step ? 'cursor-pointer hover:opacity-80' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full text-xs font-semibold font-mono flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-emerald-500 text-white' : 
                      isActive ? 'bg-amber-400 text-stone-950 font-bold scale-110' : 'bg-stone-800 text-stone-500'
                    }`}>
                      {isCompleted ? <Check className="w-4.5 h-4.5" /> : stepNum}
                    </div>
                    <span className={`text-xs font-semibold transition-all ${
                      isActive ? 'text-white' : isCompleted ? 'text-stone-300' : 'text-stone-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="text-xs font-semibold text-stone-400 hover:text-white transition-colors mt-8 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel and leave</span>
          </button>
        </div>

        {/* Right Active Step Form Area */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between min-h-[580px]">
          <div>
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 pb-4 mb-8">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">STEP {step} OF 7</span>
                <h3 className="text-xl font-serif font-bold text-zinc-800">
                  {step === 1 && "Choose Celebration Type"}
                  {step === 2 && "Configure Basic Info"}
                  {step === 3 && "Asset Studio & Media Coverage"}
                  {step === 4 && "Select Creative Invitation Theme"}
                  {step === 5 && "Manage Invitation Recipients"}
                  {step === 6 && "Cross-Device Visual Preview"}
                  {step === 7 && "Submit Proposal Confirmation"}
                </h3>
              </div>
              <span className="text-xs font-semibold bg-stone-100 text-zinc-600 border border-zinc-200 px-3 py-1 rounded-full font-mono">
                {Math.round((step / 7) * 100)}% Complete
              </span>
            </div>

            {/* STEP 1: EVENT TYPE */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <p className="text-sm text-zinc-500 leading-normal">Our responsive website layout engine supports custom wedding designs and dynamic birthday timelines. Pick a structural starting point:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div 
                    onClick={() => handleSelectEventType('wedding')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-4 text-left relative ${
                      eventType === 'wedding' 
                        ? 'border-amber-400 bg-amber-50/10 shadow-lg' 
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-stone-50'
                    }`}
                  >
                    {eventType === 'wedding' && <span className="absolute top-4 right-4 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-stone-900"><Check className="w-3.5 h-3.5 stroke-[3]" /></span>}
                    <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">💍</div>
                    <div>
                      <h4 className="font-serif font-bold text-zinc-800">Wedding Union Website</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">Includes dual bridal party countdowns, dedicated "Our Story" narrative spaces, gift registries, and customized RSVPs.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleSelectEventType('birthday')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-4 text-left relative ${
                      eventType === 'birthday' 
                        ? 'border-amber-400 bg-amber-50/10 shadow-lg' 
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-stone-50'
                    }`}
                  >
                    {eventType === 'birthday' && <span className="absolute top-4 right-4 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-stone-900"><Check className="w-3.5 h-3.5 stroke-[3]" /></span>}
                    <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">🎂</div>
                    <div>
                      <h4 className="font-serif font-bold text-zinc-800">Gala & Birthday Celebration</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">Highlights individual honorees, high-energy party timeline lists, mapping markers, custom meal tallies, and live message guestbooks.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BASIC INFO */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {Object.keys(errors).length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2.5 sm:col-span-2 shadow-sm">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-rose-900">Missing Required Information</span>
                      <span className="text-[11px] font-normal text-rose-700">Please complete all fields highlighted in red below before continuing. Your progress is saved.</span>
                    </div>
                  </div>
                )}

                {eventType === 'wedding' ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-semibold uppercase tracking-wide ${errors.brideName ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                          Bride's Full Name <span className="text-rose-500">*</span>
                        </label>
                        {errors.brideName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errors.brideName}
                          </span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={basicInfo.brideName} 
                        onChange={(e) => updateBasicInfoField('brideName', e.target.value)} 
                        placeholder="Evelyn Vance" 
                        className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                          errors.brideName 
                            ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-600' 
                            : 'border border-zinc-250 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 bg-stone-50/50'
                        }`} 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-semibold uppercase tracking-wide ${errors.groomName ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                          Groom's Full Name <span className="text-rose-500">*</span>
                        </label>
                        {errors.groomName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errors.groomName}
                          </span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={basicInfo.groomName} 
                        onChange={(e) => updateBasicInfoField('groomName', e.target.value)} 
                        placeholder="Arthur Pendelton" 
                        className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                          errors.groomName 
                            ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-600' 
                            : 'border border-zinc-250 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 bg-stone-50/50'
                        }`} 
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-semibold uppercase tracking-wide ${errors.birthdayPerson ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                        Honored Person <span className="text-rose-500">*</span>
                      </label>
                      {errors.birthdayPerson && (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.birthdayPerson}
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={basicInfo.birthdayPerson} 
                      onChange={(e) => updateBasicInfoField('birthdayPerson', e.target.value)} 
                      placeholder="Benjamin Carter" 
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                        errors.birthdayPerson 
                          ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-600' 
                          : 'border border-zinc-250 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 bg-stone-50/50'
                      }`} 
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Custom Website Title</label>
                  <input 
                    type="text" 
                    value={basicInfo.name} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })} 
                    placeholder={eventType === 'wedding' ? "Evelyn & Arthur's Wedding" : "Benjamin's Roaring 20s Gatsby 30th"} 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50" 
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Custom URL Slug</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md lowercase">Scalable Route</span>
                  </label>
                  <div className="flex rounded-xl border border-zinc-250 dark:border-stone-800 overflow-hidden text-sm bg-stone-50/50 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-500 transition-all">
                    <span className="bg-zinc-100 dark:bg-stone-900 border-r border-zinc-200 dark:border-stone-850 px-3 py-2.5 text-xs font-mono font-bold text-zinc-400 dark:text-stone-500 select-none flex items-center">
                      {window.location.host}/
                    </span>
                    <input 
                      type="text" 
                      value={basicInfo.slug} 
                      onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })} 
                      placeholder="factory-b" 
                      className="flex-1 px-4 py-2.5 text-sm font-mono focus:outline-none bg-transparent" 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    Configure a custom direct route URL for this site. Must be alphanumeric with hyphens/underscores only.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold uppercase tracking-wide ${errors.date ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                      Event Date <span className="text-rose-500">*</span>
                    </label>
                    {errors.date && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.date}
                      </span>
                    )}
                  </div>
                  <input 
                    type="date" 
                    value={basicInfo.date} 
                    onChange={(e) => updateBasicInfoField('date', e.target.value)} 
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      errors.date 
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-600' 
                        : 'border border-zinc-250 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 bg-stone-50/50'
                    }`} 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold uppercase tracking-wide ${errors.time ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                      Event Start Time <span className="text-rose-500">*</span>
                    </label>
                    {errors.time && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.time}
                      </span>
                    )}
                  </div>
                  <input 
                    type="time" 
                    value={basicInfo.time} 
                    onChange={(e) => updateBasicInfoField('time', e.target.value)} 
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      errors.time 
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-600' 
                        : 'border border-zinc-250 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 bg-stone-50/50'
                    }`} 
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">RSVP Deadline Date (Optional)</label>
                  <input 
                    type="date" 
                    value={basicInfo.rsvpDeadline} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, rsvpDeadline: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50" 
                  />
                  <p className="text-[10px] text-zinc-400 leading-normal">If set, the RSVP response form on the public invitation microsite will automatically lock and disable itself once this date has passed.</p>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Maximum Guests Allowed Per Invitation</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    value={basicInfo.maxGuestsPerInvitation} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, maxGuestsPerInvitation: Math.max(1, parseInt(e.target.value, 10) || 1) })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50 font-mono" 
                  />
                  <p className="text-[10px] text-zinc-400 leading-normal">Defines the maximum selectable guests (including companions) a single invite can RSVP for (e.g. from 1 up to this limit).</p>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold uppercase tracking-wide ${errors.venue ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                      Venue Location Name & Address <span className="text-rose-500">*</span>
                    </label>
                    {errors.venue && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.venue}
                      </span>
                    )}
                  </div>
                  <div className={errors.venue ? 'p-1 rounded-2xl border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : ''}>
                    <LocationSelector
                      value={basicInfo.venue}
                      mapLink={basicInfo.mapLink}
                      onChange={(venue, mapLink) => {
                        updateBasicInfoField('venue', venue);
                        setBasicInfo(prev => ({ ...prev, venue, mapLink }));
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Google Maps Pin URL (Share Link)</label>
                  <input 
                    type="text" 
                    value={basicInfo.mapLink} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, mapLink: e.target.value })} 
                    placeholder="https://maps.google.com/?q=The+Grand+Pavilion+Ballroom" 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dress Code</label>
                  <input 
                    type="text" 
                    value={basicInfo.dressCode} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, dressCode: e.target.value })} 
                    placeholder="Formal Black-Tie / Cocktail Attire" 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Theme Brand Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={basicInfo.themeColor} 
                      onChange={(e) => setBasicInfo({ ...basicInfo, themeColor: e.target.value })} 
                      className="w-12 h-10 border border-zinc-250 rounded-xl cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      value={basicInfo.themeColor} 
                      onChange={(e) => setBasicInfo({ ...basicInfo, themeColor: e.target.value })} 
                      className="flex-1 px-4 py-2 text-sm rounded-xl border border-zinc-250 uppercase font-mono bg-stone-50" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Welcome Narrative / Invitation Description</label>
                  <textarea 
                    rows={3} 
                    value={basicInfo.description} 
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })} 
                    placeholder="Describe the mood of the party or the story of your union to guests..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50 resize-none" 
                  />
                </div>

                {/* DRAG-AND-DROP ITINERARY AGENDA SECTION */}
                <div className="flex flex-col gap-4 sm:col-span-2 border-t border-zinc-150 pt-6 mt-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Interactive Event Schedule & Agenda Timeline</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                      Organize the chronology of your celebration. Drag items by the handle (<GripVertical className="inline w-3 h-3 text-zinc-400" />) up or down to instantly reorder milestones, edit information, or insert custom timelines:
                    </p>
                  </div>

                  {/* Agenda list container */}
                  <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar bg-zinc-50/50 p-4 rounded-2xl border border-zinc-150">
                    {agendaItems.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-400 bg-white border border-dashed border-zinc-200 rounded-xl">
                        Your itinerary is currently empty. Click "Add Itinerary Milestone" below to create one!
                      </div>
                    ) : (
                      agendaItems.map((item, idx) => {
                        const isDragged = draggedIndex === idx;
                        const isOver = dragOverIndex === idx && draggedIndex !== idx;

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, idx)}
                            className={`flex items-start gap-3 p-3 bg-white border rounded-xl transition-all duration-200 ${
                              isDragged 
                                ? 'opacity-40 border-indigo-350 bg-indigo-50/10 scale-[0.99] shadow-inner' 
                                : isOver
                                  ? 'border-amber-400 shadow-md scale-[1.01] bg-amber-50/5 ring-2 ring-amber-400/10'
                                  : 'border-zinc-200 hover:border-zinc-250 shadow-sm'
                            }`}
                          >
                            {/* Drag handle */}
                            <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-stone-100 rounded text-zinc-400 hover:text-zinc-600 transition-colors shrink-0 mt-3">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Time field */}
                            <div className="w-28 shrink-0 flex flex-col gap-1 mt-1">
                              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">TIME / MARK</span>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.time}
                                  onChange={(e) => handleUpdateAgendaItem(idx, 'time', e.target.value)}
                                  placeholder="3:30 PM"
                                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-500 bg-stone-50/30 font-semibold text-zinc-700"
                                />
                                <Clock className="w-3 h-3 text-zinc-400 absolute left-2 top-2.5" />
                              </div>
                            </div>

                            {/* Title & Desc Fields */}
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">MILESTONE TITLE</span>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleUpdateAgendaItem(idx, 'title', e.target.value)}
                                  placeholder="Event Activity"
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-500 bg-stone-50/30 text-zinc-800"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">DESCRIPTION DETAIL</span>
                                <textarea
                                  rows={2}
                                  value={item.desc}
                                  onChange={(e) => handleUpdateAgendaItem(idx, 'desc', e.target.value)}
                                  placeholder="Activity outline..."
                                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-500 bg-stone-50/30 text-zinc-600 resize-none leading-relaxed"
                                />
                              </div>
                            </div>

                            {/* Delete Action button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAgendaItem(idx)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 transition-colors shrink-0 mt-4.5"
                              title="Remove milestone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAgendaItem}
                    className="w-full py-2.5 border border-dashed border-zinc-300 hover:border-amber-500 rounded-xl text-xs font-bold text-zinc-500 hover:text-amber-600 hover:bg-amber-50/5 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Itinerary Milestone</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTO UPLOADS & ASSET STUDIO */}
            {step === 3 && (
              <div className="flex flex-col gap-6 text-left">
                <p className="text-xs text-zinc-500 leading-normal">
                  Customize the media pool for your celebration website. Upload high-resolution photos from your computer, delete unwanted assets, and designate which photos represent the active Cover and countdown Backdrop:
                </p>
                
                {/* Real File input & Drag-and-drop Container */}
                <input
                  type="file"
                  id="wizard-media-upload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleLocalFileChange}
                />
                
                <div 
                  onClick={handleUploadClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-amber-500 bg-amber-50/40 scale-[1.01] shadow-inner' 
                      : 'border-zinc-200 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50/90'
                  }`}
                >
                  {uploadProgress !== null ? (
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-xs font-semibold text-zinc-600 animate-pulse">Reading and optimization in progress...</span>
                      <div className="w-64 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-amber-500 animate-bounce' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold text-zinc-700">
                        {isDragging ? 'Drop your images here!' : 'Drag & Drop files here, or '}
                        {!isDragging && <span className="text-amber-600 underline hover:text-amber-700">browse computer</span>}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Supports JPG, PNG, WEBP files up to 10MB</span>
                    </div>
                  )}
                </div>

                {/* Preset Picker */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Browse Curated Presets</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...activePresets.covers, ...activePresets.heroes].map((url, idx) => {
                      const isInPool = galleryImages.includes(url);
                      return (
                        <div 
                          key={idx}
                          className="group rounded-xl overflow-hidden relative border border-zinc-200 h-24 bg-zinc-50"
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isInPool) {
                                  setGalleryImages((prev) => [...prev, url]);
                                }
                                setCoverImage(url);
                                toast("Preset selected as active Splash Cover!", "success");
                              }}
                              className="w-full text-center py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] uppercase font-bold tracking-wider rounded transition-colors"
                            >
                              Use as Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isInPool) {
                                  setGalleryImages((prev) => [...prev, url]);
                                }
                                setHeroBackground(url);
                                toast("Preset selected as Countdown Backdrop!", "success");
                              }}
                              className="w-full text-center py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] uppercase font-bold tracking-wider rounded transition-colors"
                            >
                              Use as Backdrop
                            </button>
                          </div>
                          
                          <span className="absolute bottom-1 left-1 bg-zinc-900/80 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            {idx < activePresets.covers.length ? `Cover ${idx + 1}` : `Hero ${idx - activePresets.covers.length + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Image Pool Manager */}
                <div className="flex flex-col gap-3 border-t border-zinc-150 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Active Media Pool ({galleryImages.length})</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Designate active files below</span>
                  </div>

                  {galleryImages.length === 0 ? (
                    <div className="border border-dashed border-zinc-250 rounded-xl p-8 text-center text-xs text-zinc-400 bg-stone-50/20">
                      Your media pool is empty. Please upload photos from your computer or choose presets above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {galleryImages.map((url, idx) => {
                        const isCover = coverImage === url;
                        const isBackdrop = heroBackground === url;
                        return (
                          <div 
                            key={idx}
                            className={`group h-28 rounded-xl overflow-hidden relative border-2 transition-all ${
                              isCover && isBackdrop 
                                ? 'border-amber-500 ring-2 ring-amber-500/20'
                                : isCover 
                                  ? 'border-amber-400 ring-2 ring-amber-400/20' 
                                  : isBackdrop 
                                    ? 'border-indigo-400 ring-2 ring-indigo-400/20' 
                                    : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <img src={url} alt={`Gallery Asset ${idx + 1}`} className="w-full h-full object-cover" />
                            
                            {/* Active badging indicators */}
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                              {isCover && (
                                <span className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shadow-sm flex items-center gap-0.5">
                                  <Check className="w-2 h-2" /> Cover
                                </span>
                              )}
                              {isBackdrop && (
                                <span className="bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shadow-sm flex items-center gap-0.5">
                                  <Check className="w-2 h-2" /> Backdrop
                                </span>
                              )}
                            </div>

                            {/* Hover Options Menu */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10">
                              {/* Delete option */}
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = galleryImages.filter((_, i) => i !== idx);
                                    setGalleryImages(next);
                                    
                                    // Guard role variables
                                    if (isCover) {
                                      setCoverImage(next[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800');
                                    }
                                    if (isBackdrop) {
                                      setHeroBackground(next[0] || 'https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1200');
                                    }
                                    toast("Image removed from media pool", "info");
                                  }}
                                  className="p-1 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-md"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Role Assignment action buttons */}
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCoverImage(url);
                                    toast("Designated as active Splash Cover!", "success");
                                  }}
                                  className="w-full text-center py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] uppercase font-bold tracking-wider rounded transition-colors"
                                >
                                  Set as Cover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHeroBackground(url);
                                    toast("Designated as Countdown Backdrop!", "success");
                                  }}
                                  className="w-full text-center py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] uppercase font-bold tracking-wider rounded transition-colors"
                                >
                                  Set as Backdrop
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active showcase summary */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-150 pt-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <div className="flex gap-3 items-center">
                    <img src={coverImage} alt="Cover Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-amber-600 font-bold uppercase block">Splash Cover</span>
                      <span className="text-xs font-semibold text-zinc-700 truncate block">Active Title Cover</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center border-l border-zinc-200 pl-4">
                    <img src={heroBackground} alt="Hero Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase block">Countdown Backdrop</span>
                      <span className="text-xs font-semibold text-zinc-700 truncate block">Active Hero Background</span>
                    </div>
                  </div>
                </div>

                {/* BACKGROUND MUSIC SELECTION SECTION */}
                <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 mt-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-amber-500" />
                      <span>Invite Site Background Music</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                      Select the soundtrack that will automatically play when guests open your invitation site. Guests can pause or mute it at any time.
                    </p>
                  </div>

                  {/* Music Preset Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MUSIC_PRESETS.map((preset) => {
                      const isSelected = selectedMusicPreset === preset.id && !customMusicUrl;
                      const isPreviewing = previewingAudioUrl === preset.url;

                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setSelectedMusicPreset(preset.id);
                            setCustomMusicUrl('');
                            setMusicTitle(preset.title);
                            toast(`Selected background track: ${preset.title}`, "success");
                          }}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/20 shadow-sm'
                              : 'border-zinc-200 hover:border-zinc-300 bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-800 font-serif">{preset.title}</span>
                                {isSelected && (
                                  <span className="bg-amber-500 text-stone-950 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase">Active</span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 font-semibold block mt-0.5">{preset.genre}</span>
                            </div>

                            {/* Test Play / Pause Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePreviewAudio(preset.url);
                              }}
                              className={`p-2 rounded-full transition-all shrink-0 ${
                                isPreviewing 
                                  ? 'bg-amber-500 text-stone-950 shadow-md animate-pulse' 
                                  : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                              }`}
                              title={isPreviewing ? "Stop audio preview" : "Preview audio track"}
                            >
                              {isPreviewing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                          </div>

                          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                            {preset.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Audio MP3 Upload or URL Input option */}
                  <div className="bg-stone-50 border border-zinc-200 p-3.5 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Or Add Your Own Custom Audio Track</span>
                      </label>
                      <span className="text-[10px] font-mono text-zinc-400">MP3, WAV, M4A, OGG</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id="wizard-audio-upload"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg"
                        className="hidden"
                        onChange={handleAudioFileUpload}
                      />
                      
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('wizard-audio-upload') as HTMLInputElement | null;
                          if (input) input.click();
                        }}
                        className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-zinc-800 dark:text-stone-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                      >
                        <UploadCloud className="w-4 h-4 text-amber-600" />
                        <span>Upload Audio File</span>
                      </button>

                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={customMusicUrl}
                          onChange={(e) => {
                            setCustomMusicUrl(e.target.value);
                            if (e.target.value) {
                              setSelectedMusicPreset('custom');
                            }
                          }}
                          placeholder="Or paste direct .mp3 URL link..."
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-250 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500"
                        />
                        {customMusicUrl && (
                          <button
                            type="button"
                            onClick={() => togglePreviewAudio(customMusicUrl)}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            {previewingAudioUrl === customMusicUrl ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>Test Audio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Display Name & Autoplay Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wide">Custom Track Display Title</label>
                      <input
                        type="text"
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                        placeholder="Our Special Prelude Song"
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-250 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={musicAutoPlay}
                          onChange={(e) => setMusicAutoPlay(e.target.checked)}
                          className="w-4 h-4 text-amber-500 rounded border-zinc-300 focus:ring-amber-400 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-zinc-800 block">Auto-Play When Opened</span>
                          <span className="text-[10px] text-zinc-500 block">Music starts playing as soon as guest visits</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: THEMES */}
            {step === 4 && (
              <div className="flex flex-col gap-6 text-left">
                {/* Theme Library Prominent Launcher Banner */}
                <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-amber-500/20">
                      <Palette className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Explore Interactive Theme Library</h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        Browse gorgeous visual cards, compare design specs (Luxury, Modern, Rustic, Floral, and more), and preview them in high resolution.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThemeLibraryOpen(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Open Theme Library</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-500 leading-normal">Our system isolates layouts from styles. Click a card to instantly re-theme your event website borders, typography pairings, buttons, and visual overlays:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
                  {THEMES.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <div 
                        key={theme.id}
                        onClick={() => {
                          setSelectedThemeId(theme.id);
                          setBasicInfo({ ...basicInfo, themeColor: theme.primaryColor });
                        }}
                        className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between group/card ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/10 shadow-md' 
                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-800 font-serif">{theme.name}</h4>
                            <span 
                              className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-normal">{theme.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewThemeId(theme.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline tracking-normal flex items-center gap-1 uppercase text-[10px] font-sans"
                            title={`Preview ${theme.name} layout`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview skin</span>
                          </button>
                          <span className={isSelected ? 'text-indigo-600 font-bold' : 'group-hover/card:text-zinc-600 transition-colors'}>
                            {isSelected ? 'SELECTED' : 'SELECT SKIN'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: GUEST LIST */}
            {step === 5 && (
              <div className="flex flex-col gap-6 text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-xs text-zinc-500 leading-normal">Load guests to distribute unique login tokens. Import from spreadsheet or input manually:</p>
                  
                  {/* Bulk importers */}
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleImportSpreadsheet('excel')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-250 rounded-xl text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simulate Excel Load</span>
                    </button>
                    <button 
                      onClick={() => handleImportSpreadsheet('csv')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-250 rounded-xl text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Simulate CSV load</span>
                    </button>
                  </div>
                </div>

                {/* Manual input strip */}
                <div className="p-4 border border-zinc-200 rounded-xl bg-stone-50/50 flex flex-col gap-3">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">Manual Guest Entry</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="Guest / Family Name (e.g. John Smith)" 
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                    />
                    <input 
                      type="email" 
                      placeholder="Email Coordinates" 
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Table / Section Assignment" 
                      value={newGuestTable}
                      onChange={(e) => setNewGuestTable(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer select-none">
                        <input type="checkbox" checked={newGuestVip} onChange={(e) => setNewGuestVip(e.target.checked)} className="rounded text-amber-500" />
                        <span>VIP Status</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer select-none">
                        <input type="checkbox" checked={newGuestFamily} onChange={(e) => setNewGuestFamily(e.target.checked)} className="rounded text-amber-500" />
                        <span>Family Category</span>
                      </label>
                    </div>

                    <button 
                      onClick={handleAddManualGuest}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Guest</span>
                    </button>
                  </div>
                </div>

                {/* temporary guests table list */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto no-scrollbar">
                  {guests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-400">No guests loaded yet. Use manual entry or click the spreadsheets simulators above.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 border-b border-zinc-200 text-zinc-400 uppercase font-mono text-[9px] tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2.5 pl-4">Guest Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Section</th>
                          <th className="p-2.5">Flags</th>
                          <th className="p-2.5 pr-4 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150">
                        {guests.map((g, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/50">
                            <td className="p-2.5 pl-4 font-semibold text-zinc-700">{g.name}</td>
                            <td className="p-2.5 text-zinc-400">{g.email}</td>
                            <td className="p-2.5 font-mono text-zinc-500">{g.tableNumber}</td>
                            <td className="p-2.5 flex gap-1.5 mt-0.5">
                              {g.isVip && <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 py-0.5 rounded">VIP</span>}
                              {g.isFamily && <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1 py-0.5 rounded">FAM</span>}
                              {!g.isVip && !g.isFamily && <span className="text-zinc-300">-</span>}
                            </td>
                            <td className="p-2.5 pr-4 text-right">
                              <button onClick={() => handleDeleteTempGuest(idx)} className="text-rose-500 hover:text-rose-700 p-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: CROSS-DEVICE PREVIEWS */}
            {step === 6 && (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <p className="text-xs text-zinc-500">Render your customized website inside standard mobile, tablet, or desktop container frames to verify letterboxes:</p>
                  
                  {/* Device toggles */}
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-xl border border-zinc-200">
                    {[
                      { id: 'desktop', icon: <Laptop className="w-4.5 h-4.5" />, label: 'Macbook' },
                      { id: 'tablet', icon: <Tablet className="w-4.5 h-4.5" />, label: 'iPad' },
                      { id: 'mobile', icon: <Smartphone className="w-4.5 h-4.5" />, label: 'iPhone' }
                    ].map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => setPreviewDevice(dev.id as any)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          previewDevice === dev.id 
                            ? 'bg-white shadow-sm text-stone-900 font-bold' 
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        {dev.icon}
                        <span>{dev.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Frame Shell Container */}
                <div className="flex justify-center bg-stone-100 p-6 rounded-2xl border border-zinc-200 overflow-hidden relative">
                  
                  {previewDevice === 'mobile' && (
                    <div className="w-[360px] h-[480px] rounded-[36px] border-[12px] border-stone-950 shadow-2xl bg-white overflow-y-auto no-scrollbar relative shrink-0">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-stone-950 rounded-full z-20 flex items-center justify-center"><span className="w-2.5 h-2.5 rounded-full bg-stone-900" /></div>
                      <div className="scale-100 origin-top text-xs">
                        <EventWebsite 
                          eventId="preview"
                          isGuestPreview={true}
                          guestToken="guest"
                          customEventData={{
                            type: eventType,
                            name: basicInfo.name || "Evelyn & Arthur's Wedding",
                            brideName: basicInfo.brideName,
                            groomName: basicInfo.groomName,
                            birthdayPerson: basicInfo.birthdayPerson,
                            date: basicInfo.date,
                            time: basicInfo.time,
                            venue: basicInfo.venue || "The Glasshouse, Seattle",
                            description: basicInfo.description,
                            themeId: selectedThemeId,
                            themeColor: basicInfo.themeColor,
                            dressCode: basicInfo.dressCode,
                            mapLink: basicInfo.mapLink,
                            coverImage: coverImage,
                            galleryImages: galleryImages,
                            heroBackground: heroBackground,
                            timelineSteps: agendaItems,
                            rsvpDeadline: basicInfo.rsvpDeadline || undefined,
                            musicUrl: customMusicUrl || (MUSIC_PRESETS.find(p => p.id === selectedMusicPreset)?.url || MUSIC_PRESETS[0].url),
                            musicTitle: musicTitle || "Celebration Background Music",
                            musicAutoPlay: musicAutoPlay
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {previewDevice === 'tablet' && (
                    <div className="w-[600px] h-[480px] rounded-[24px] border-[10px] border-stone-950 shadow-2xl bg-white overflow-y-auto no-scrollbar relative shrink-0">
                      <div className="scale-[0.95] origin-top text-xs">
                        <EventWebsite 
                          eventId="preview"
                          isGuestPreview={true}
                          guestToken="guest"
                          customEventData={{
                            type: eventType,
                            name: basicInfo.name || "Evelyn & Arthur's Wedding",
                            brideName: basicInfo.brideName,
                            groomName: basicInfo.groomName,
                            birthdayPerson: basicInfo.birthdayPerson,
                            date: basicInfo.date,
                            time: basicInfo.time,
                            venue: basicInfo.venue || "The Glasshouse, Seattle",
                            description: basicInfo.description,
                            themeId: selectedThemeId,
                            themeColor: basicInfo.themeColor,
                            dressCode: basicInfo.dressCode,
                            mapLink: basicInfo.mapLink,
                            coverImage: coverImage,
                            galleryImages: galleryImages,
                            heroBackground: heroBackground,
                            timelineSteps: agendaItems,
                            rsvpDeadline: basicInfo.rsvpDeadline || undefined,
                            musicUrl: customMusicUrl || (MUSIC_PRESETS.find(p => p.id === selectedMusicPreset)?.url || MUSIC_PRESETS[0].url),
                            musicTitle: musicTitle || "Celebration Background Music",
                            musicAutoPlay: musicAutoPlay
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {previewDevice === 'desktop' && (
                    <div className="w-full h-[480px] rounded-xl border border-zinc-250 shadow-2xl bg-white overflow-y-auto relative text-xs no-scrollbar">
                      <div className="bg-stone-50 border-b border-zinc-150 h-8 flex items-center gap-2 px-4 sticky top-0 z-20">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="bg-white border border-zinc-200 text-[10px] text-zinc-400 font-mono py-0.5 px-6 rounded-md w-96 mx-auto truncate text-center select-none">
                          {window.location.host}/preview-celebration
                        </div>
                      </div>
                      <EventWebsite 
                        eventId="preview"
                        isGuestPreview={true}
                        guestToken="guest"
                        customEventData={{
                          type: eventType,
                          name: basicInfo.name || "Evelyn & Arthur's Wedding",
                          brideName: basicInfo.brideName,
                          groomName: basicInfo.groomName,
                          birthdayPerson: basicInfo.birthdayPerson,
                          date: basicInfo.date,
                          time: basicInfo.time,
                          venue: basicInfo.venue || "The Glasshouse, Seattle",
                          description: basicInfo.description,
                          themeId: selectedThemeId,
                          themeColor: basicInfo.themeColor,
                          dressCode: basicInfo.dressCode,
                          mapLink: basicInfo.mapLink,
                          coverImage: coverImage,
                          galleryImages: galleryImages,
                          heroBackground: heroBackground,
                          timelineSteps: agendaItems,
                          rsvpDeadline: basicInfo.rsvpDeadline || undefined,
                          musicUrl: customMusicUrl || (MUSIC_PRESETS.find(p => p.id === selectedMusicPreset)?.url || MUSIC_PRESETS[0].url),
                          musicTitle: musicTitle || "Celebration Background Music",
                          musicAutoPlay: musicAutoPlay
                        }}
                      />
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* STEP 7: SUBMIT */}
            {step === 7 && (
              <div className="flex flex-col items-center gap-6 py-8 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-500 animate-pulse">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-serif font-bold text-zinc-800 mb-2">Proposal Draft Complete!</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">Your digital microsite is pre-configured and the client coordinates are locked in. Clicking "Submit Proposal" below will push this to the Pam's Events Admin Stream for design approval.</p>
                </div>

                <div className="w-full bg-stone-50 p-5 rounded-2xl border border-zinc-200 text-left flex flex-col gap-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px] font-mono">Microsite Name</span>
                    <span className="font-semibold text-zinc-800">{basicInfo.name || "Untitled Microsite"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px] font-mono">Chosen Theme Design</span>
                    <span className="font-mono font-bold text-amber-600">{selectedThemeId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px] font-mono">Background Music</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {musicTitle || "Configured Soundtrack"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px] font-mono">Event Type / Honorees</span>
                    <span className="font-semibold text-zinc-800">{eventType === 'wedding' ? `${basicInfo.brideName} & ${basicInfo.groomName}` : basicInfo.birthdayPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px] font-mono">Invited Guest Count</span>
                    <span className="font-semibold font-mono text-emerald-600">{guests.length} Loaded</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions footer */}
          <div className="flex items-center justify-between border-t border-zinc-150 pt-6 mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-zinc-250 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-stone-50 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 7 ? (
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishWizard}
                className="inline-flex items-center gap-1.5 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <span>Submit Proposal</span>
                <CheckCircle2 className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {isThemeLibraryOpen && (
          <ThemeLibraryModal
            isOpen={isThemeLibraryOpen}
            onClose={() => setIsThemeLibraryOpen(false)}
            selectedThemeId={selectedThemeId}
            onSelect={(id) => {
              setSelectedThemeId(id);
              const theme = THEMES.find(t => t.id === id);
              if (theme) {
                setBasicInfo(prev => ({ ...prev, themeColor: theme.primaryColor }));
              }
            }}
            onPreview={(id) => setPreviewThemeId(id)}
            toast={toast}
          />
        )}

        {previewThemeId && (
          <ThemePreviewModal
            isOpen={!!previewThemeId}
            onClose={() => setPreviewThemeId(null)}
            themeId={previewThemeId}
            onSelect={(id) => {
              setSelectedThemeId(id);
              const theme = THEMES.find(t => t.id === id);
              if (theme) {
                setBasicInfo(prev => ({ ...prev, themeColor: theme.primaryColor }));
              }
            }}
            eventData={{
              type: eventType,
              name: basicInfo.name,
              brideName: basicInfo.brideName,
              groomName: basicInfo.groomName,
              birthdayPerson: basicInfo.birthdayPerson,
              date: basicInfo.date,
              time: basicInfo.time,
              venue: basicInfo.venue,
              description: basicInfo.description,
              dressCode: basicInfo.dressCode,
              mapLink: basicInfo.mapLink,
              coverImage: coverImage,
              galleryImages: galleryImages,
              heroBackground: heroBackground,
              timelineSteps: agendaItems,
              rsvpDeadline: basicInfo.rsvpDeadline || undefined
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
