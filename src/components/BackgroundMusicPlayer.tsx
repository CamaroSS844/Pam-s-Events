/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Disc } from 'lucide-react';

interface BackgroundMusicPlayerProps {
  musicUrl?: string;
  musicTitle?: string;
  autoPlay?: boolean;
  primaryColor?: string;
}

// Built-in high quality music preset URLs & backup stream generators
export const MUSIC_PRESETS = [
  {
    id: 'piano-romance',
    title: 'Acoustic Piano Romance',
    genre: 'Wedding & Romantic',
    desc: 'Gentle, heartwarming piano melodies perfect for love stories and unions.',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'jazz-lounge',
    title: 'Gatsby Speakeasy Jazz',
    genre: 'Gala & Birthday',
    desc: 'Upbeat 1920s jazz brass, piano chords, and smooth cocktail lounge grooves.',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73229.mp3?filename=jazzy-abstract-beat-11254.mp3'
  },
  {
    id: 'classical-harp',
    title: 'Enchanted Strings & Harp',
    genre: 'Classical Luxury',
    desc: 'Timeless chamber orchestra strings, acoustic harp, and elegant harmonies.',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=soft-piano-108722.mp3'
  },
  {
    id: 'acoustic-guitar',
    title: 'Cozy Acoustic Guitar',
    genre: 'Rustic & Organic',
    desc: 'Earthy, fingerpicked acoustic guitar notes with warm ambient depth.',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f7e8a9.mp3?filename=acoustic-guitars-ambient-124483.mp3'
  },
  {
    id: 'party-vibes',
    title: 'Celebratory Dance Beats',
    genre: 'Upbeat Party',
    desc: 'Vibrant celebratory rhythms to get guests excited for the party.',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c7647a83d7.mp3?filename=upbeat-pop-126297.mp3'
  }
];

export const BackgroundMusicPlayer: React.FC<BackgroundMusicPlayerProps> = ({
  musicUrl,
  musicTitle = 'Celebration Prelude',
  autoPlay = true,
  primaryColor = '#D4AF37'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio Synth Fallback when audio URL isn't playing or fails
  const synthCtxRef = useRef<AudioContext | null>(null);
  const isSynthPlayingRef = useRef(false);

  // Default track URL if none provided
  const activeUrl = musicUrl || MUSIC_PRESETS[0].url;

  // Initialize Audio
  useEffect(() => {
    if (!activeUrl) return;

    const audio = new Audio(activeUrl);
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    const attemptPlay = () => {
      if (autoPlay) {
        audio.play().then(() => {
          setIsPlaying(true);
          setShowToast(true);
          // Hide toast after 5s
          setTimeout(() => setShowToast(false), 5000);
        }).catch((err) => {
          console.log("Autoplay paused waiting for user interaction:", err);
          setIsPlaying(false);

          // Add click listener to window to start playback on first touch/click
          const handleFirstClick = () => {
            if (audioRef.current) {
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
              }).catch(() => {});
            }
            window.removeEventListener('click', handleFirstClick);
            window.removeEventListener('touchstart', handleFirstClick);
          };

          window.addEventListener('click', handleFirstClick, { once: true });
          window.addEventListener('touchstart', handleFirstClick, { once: true });
        });
      }
    };

    attemptPlay();

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [activeUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }).catch((e) => {
        console.error("Audio play failed:", e);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Floating Toast Notification when music starts playing */}
      {showToast && isPlaying && (
        <div className="fixed top-20 left-6 z-50 bg-stone-900/90 text-white backdrop-blur-md border border-stone-700/60 py-2.5 px-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Disc className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="pr-2">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎵 Playing Background Music</span>
            </p>
            <p className="text-[11px] text-stone-300 font-medium truncate max-w-[200px]">
              {musicTitle}
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-stone-400 hover:text-white text-xs font-mono ml-2 uppercase"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent Floating Music Controller Widget */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <div className="bg-stone-900/90 text-white border border-stone-700/60 backdrop-blur-md p-2 pl-3.5 pr-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:bg-black">
          
          {/* Animated Equalizer Waveform / Vinyl Icon */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Disc 
                className={`w-5 h-5 text-amber-400 transition-all ${
                  isPlaying ? 'animate-spin' : 'opacity-60'
                }`}
                style={{ animationDuration: '4s' }}
              />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            {/* Equalizer Bars */}
            <div className="flex items-end gap-0.5 h-3 w-4">
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all duration-300 ${isPlaying ? 'h-2 animate-bounce' : 'h-1'}`} style={{ animationDelay: '150ms' }} />
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all duration-300 ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1'}`} style={{ animationDelay: '300ms' }} />
            </div>

            {/* Track Title Info */}
            <div className="hidden sm:flex flex-col min-w-[100px] max-w-[160px]">
              <span className="text-[9px] font-mono font-bold text-amber-400/90 uppercase tracking-wider">
                {isPlaying ? 'PLAYING MUSIC' : 'PAUSED'}
              </span>
              <span className="text-[11px] font-semibold text-stone-200 truncate leading-none">
                {musicTitle}
              </span>
            </div>
          </div>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 text-stone-900 font-bold"
            style={{ backgroundColor: primaryColor || '#D4AF37' }}
            title={isPlaying ? "Pause background music" : "Play background music"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-stone-950 text-stone-950" />
            ) : (
              <Play className="w-4 h-4 fill-stone-950 text-stone-950 ml-0.5" />
            )}
          </button>

          {/* Mute Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-stone-300" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
