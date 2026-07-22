import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Palette, Check, Eye, Heart, BookOpen, Layers } from 'lucide-react';
import { THEMES } from '../data/themes';
import { ThemeId } from '../types';

interface ThemeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedThemeId: ThemeId;
  onSelect: (themeId: ThemeId) => void;
  onPreview: (themeId: ThemeId) => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

// Map each ThemeId to a gorgeous custom visual thumbnail representing that specific design archetype
const THEME_THUMBNAILS: Record<ThemeId, { image: string; tag: string; features: string[] }> = {
  luxury: {
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
    tag: 'Classic & Royal',
    features: ['Gold Foliage & Borders', 'Serif Display Fonts', 'Double Thin Grid Outlines']
  },
  elegant: {
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
    tag: 'Clean Minimalist',
    features: ['High Negative Space', 'Ultra Thin Lines', 'Crisp Editorial Vibe']
  },
  modern: {
    image: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600',
    tag: 'Geometric & Bold',
    features: ['Cobalt & Marine Tones', 'Rounded Card Corners', 'Clean Sans-Serif Layout']
  },
  rustic: {
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600',
    tag: 'Woodland & Earthy',
    features: ['Forest Green Accents', 'Natural Sage Surfaces', 'Beige/Brown Board Tiles']
  },
  floral: {
    image: 'https://images.unsplash.com/photo-1533618561172-e190343a45c3?auto=format&fit=crop&q=80&w=600',
    tag: 'Botanical Watercolor',
    features: ['Blossoming Pink Borders', 'Chic Script Typography', 'Pastel Gradient Overlays']
  },
  traditional: {
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600',
    tag: 'Rich & Center-aligned',
    features: ['Mahogany & Cream Colors', 'Centered Copy Compositions', 'Classic Framed Grids']
  },
  minimal: {
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
    tag: 'Pure Type Accent',
    features: ['Zero Clutter Layouts', 'Mono-spaced Elements', 'Raw Ink Aesthetic']
  }
};

export const ThemeLibraryModal: React.FC<ThemeLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedThemeId,
  onSelect,
  onPreview,
  toast
}) => {
  const [hoveredThemeId, setHoveredThemeId] = useState<ThemeId | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden z-10 text-left"
        >
          {/* Header */}
          <div className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Palette className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Interactive Theme Library</span>
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Archetypes</span>
                </h3>
                <p className="text-xs text-slate-500">Pick or preview bespoke layouts customized for every design sentiment.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid of styles */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                const meta = THEME_THUMBNAILS[theme.id] || {
                  image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
                  tag: 'Bespoke Vibe',
                  features: ['Custom Accents', 'Optimized Spacing']
                };

                return (
                  <div
                    key={theme.id}
                    onMouseEnter={() => setHoveredThemeId(theme.id)}
                    onMouseLeave={() => setHoveredThemeId(null)}
                    className={`bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 flex flex-col ${
                      isSelected 
                        ? 'border-amber-500 shadow-md ring-4 ring-amber-500/10' 
                        : 'border-slate-100 hover:border-slate-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Visual Thumbnail Frame */}
                    <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={meta.image} 
                        alt={theme.name} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out"
                        style={{
                          transform: hoveredThemeId === theme.id ? 'scale(1.08)' : 'scale(1)'
                        }}
                      />
                      
                      {/* Dark gradient shadow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Top labels */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          {meta.tag}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span 
                          className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shadow-md"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </div>

                      {/* Theme Name Overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h4 className="text-white text-base font-bold font-serif drop-shadow-sm flex items-center gap-1.5">
                          {theme.name}
                          {isSelected && <span className="bg-amber-500 text-white p-0.5 rounded-full"><Check className="w-2.5 h-2.5" /></span>}
                        </h4>
                        <p className="text-slate-200 text-[10px] line-clamp-1 opacity-90">{theme.description}</p>
                      </div>
                    </div>

                    {/* Specifications List */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-mono tracking-widest text-slate-400 font-bold uppercase">Aesthetic Highlights</span>
                        <ul className="space-y-1.5">
                          {meta.features.map((feat, fidx) => (
                            <li key={fidx} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-1 h-1 rounded-full bg-amber-500" />
                              <span className="truncate">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dynamic Theme Spec details */}
                      <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-[10px]">
                        <div className="flex flex-col">
                          <span className="text-slate-400 font-bold uppercase font-mono">Font Pair</span>
                          <span className="font-semibold text-slate-700 mt-0.5 truncate max-w-[120px]">{theme.fontHeading.includes('serif') ? 'Serif + Sans' : 'Sans + Sans'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400 font-bold uppercase font-mono">Accent</span>
                          <span className="font-semibold text-slate-700 mt-0.5 font-mono uppercase">{theme.primaryColor}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => onPreview(theme.id)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Live</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(theme.id);
                            toast(`Applied the elegant "${theme.name}" theme skin!`, "success");
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 pointer-events-none' 
                              : 'bg-slate-900 hover:bg-black text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Apply Style</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer block */}
          <div className="h-16 border-t border-slate-100 px-8 flex items-center justify-between shrink-0 bg-slate-50/50">
            <span className="text-[10px] text-slate-400 font-medium">Click "Preview Live" to interact with each theme archetype across multiple devices.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close Library
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
