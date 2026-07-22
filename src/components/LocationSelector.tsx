import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, HelpCircle, Loader2 } from 'lucide-react';

const rawApiKey = (
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  ''
).trim();

// Strip any surrounding double or single quotes
const API_KEY = rawApiKey.replace(/^["']|["']$/g, '');

// All valid Google Maps Platform API keys start with 'AIzaSy' and are at least 30 characters long
const hasValidKey = Boolean(API_KEY) && API_KEY.startsWith('AIzaSy') && API_KEY.length >= 30;
const hasInvalidFormat = Boolean(API_KEY) && (!API_KEY.startsWith('AIzaSy') || API_KEY.length < 30);

interface MapContentProps {
  value: string;
  onChange: (venue: string, mapLink: string) => void;
  mapLink: string;
}

const MapContent: React.FC<MapContentProps> = ({ value, onChange, mapLink }) => {
  const map = useMap();
  const places = useMapsLibrary('places');
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Initialize Autocomplete
  useEffect(() => {
    if (!places || !inputRef.current) return;
    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    };
    const ac = new places.Autocomplete(inputRef.current, options);
    setAutocomplete(ac);
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const pos = { lat, lng };
        setMarkerPosition(pos);
        if (map) {
          map.setCenter(pos);
          map.setZoom(16);
        }
        const address = place.formatted_address || place.name || '';
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&query_place_id=${place.place_id || ''}`;
        onChange(address, link);
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [autocomplete, map, onChange]);

  // Handle map click to put a pin and reverse-geocode
  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    const pos = { lat, lng };
    setMarkerPosition(pos);
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      setIsSearching(false);
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&query_place_id=${results[0].place_id || ''}`;
        onChange(address, link);
        if (inputRef.current) {
          inputRef.current.value = address;
        }
      } else {
        // Fallback to coordinates
        const coordsStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const link = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        onChange(coordsStr, link);
        if (inputRef.current) {
          inputRef.current.value = coordsStr;
        }
      }
    });
  };

  // Attempt to geocode existing address on load
  useEffect(() => {
    if (!map || !value || markerPosition) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: value }, (results, status) => {
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const pos = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        setMarkerPosition(pos);
        map.setCenter(pos);
        map.setZoom(15);
      }
    });
  }, [map, value]);

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing venue name or address..."
          defaultValue={value}
          onChange={(e) => {
            // Let them type manually if they prefer
            const val = e.target.value;
            const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`;
            onChange(val, link);
          }}
          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-white"
        />
        <div className="absolute left-3.5 top-3.5 text-zinc-400">
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Search className="w-4 h-4" />}
        </div>
        {value && (
          <div className="absolute right-3 top-2 text-emerald-600 flex items-center gap-1 text-[10px] font-semibold font-mono bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-zinc-200 h-[220px]">
        <Map
          defaultCenter={{ lat: 37.42, lng: -122.08 }}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          onClick={handleMapClick}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {markerPosition && (
            <AdvancedMarker position={markerPosition}>
              <Pin background="#EAB308" glyphColor="#fff" />
            </AdvancedMarker>
          )}
        </Map>
        
        <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[10px] font-semibold text-zinc-500 shadow-sm pointer-events-none">
          Click map to drop pin manually
        </div>
      </div>
    </div>
  );
};

export const LocationSelector: React.FC<{
  value: string;
  onChange: (venue: string, mapLink: string) => void;
  mapLink: string;
}> = ({ value, onChange, mapLink }) => {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col gap-3 text-left">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`;
              onChange(val, link);
            }}
            placeholder="The Grand Pavilion Ballroom, Seattle, WA"
            className="w-full pl-10 py-2.5 rounded-xl border border-zinc-250 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all bg-stone-50/50"
          />
          <div className="absolute left-3.5 top-3.5 text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl flex flex-col gap-3 text-zinc-700">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h5 className="text-xs font-bold text-amber-800">
                {hasInvalidFormat ? 'Invalid Google Maps API Key format detected' : 'Enhance with Google Maps Autocomplete'}
              </h5>
              <p className="text-[11px] text-amber-700/90 leading-normal">
                {hasInvalidFormat 
                  ? "The configured key is not a valid Google Maps Platform key (it should start with 'AIzaSy' and be at least 30 characters long). We've disabled the API integration to prevent browser errors."
                  : 'Unlock address suggestions and a click-to-pin interactive map selector by adding a Google Maps API Key.'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-amber-200/40 pt-2.5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-amber-800">To configure a valid API key:</p>
            <ol className="text-[10px] text-amber-700/90 list-decimal list-inside space-y-1">
              <li>
                Get an API key:{' '}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-950 font-semibold"
                >
                  Get an API Key
                </a>
              </li>
              <li>
                Open <strong className="text-amber-800">Settings</strong> (⚙️ gear icon, top-right corner) →{' '}
                <strong className="text-amber-800">Secrets</strong>.
              </li>
              <li>
                Add/Update <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[9px]">GOOGLE_MAPS_PLATFORM_KEY</code> with a valid key starting with <strong className="text-amber-800">AIzaSy</strong>.
              </li>
            </ol>
            <p className="text-[9px] text-amber-500 italic mt-0.5">The app rebuilds automatically - no page reload needed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <MapContent value={value} onChange={onChange} mapLink={mapLink} />
    </APIProvider>
  );
};
