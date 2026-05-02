import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, Marker } from 'react-leaflet';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import { 
  Building2, Layers, Navigation, Phone, Mail, 
  MapPin, IndianRupee, AreaChart, Maximize2, X, ChevronRight, Share2
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// ── Leaflet marker fix ───────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  hybrid: { url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}' },
  road: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
};

const SharedMap = () => {
  const { shareId } = useParams();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tileMode, setTileMode] = useState('satellite');
  const [unit, setUnit] = useState('acres'); // 'acres' or 'sqft'
  const [error, setError] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await axios.get(`/api/maps/${shareId}`);
        if (res.data.success) {
          setMapData(res.data.data);
          setTileMode(res.data.data.tileMode || 'satellite');
        }
      } catch (err) {
        setError('Map not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, [shareId]);

  const [locating, setLocating] = useState(false);

  const cycleTile = () => {
    const order = ['satellite', 'hybrid', 'road'];
    setTileMode(cur => order[(order.indexOf(cur) + 1) % order.length]);
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'acres' ? 'sqft' : 'acres');
  };

  const flyToProperty = () => {
    if (mapRef.current && mapData) {
      mapRef.current.flyTo([mapData.center.lat, mapData.center.lng], mapData.zoom, { duration: 1.5 });
    }
  };

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapRef.current) {
          mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 1.5 });
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Could not access your location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#1a2340] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        <div className="text-white font-black text-xs uppercase tracking-[0.3em] animate-pulse">Loading Map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-[#1a2340] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <X className="text-red-500" size={40} />
        </div>
        <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tight">Access Denied</h1>
        <p className="text-white/40 font-medium max-w-xs">{error}</p>
        <Link to="/" className="mt-8 px-8 py-3 bg-[#c9a84c] text-[#1a2340] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  const unitLabels = { acres: 'Acres', sqft: 'Sq Ft', sqyd: 'Sq Yards' };
  const totalValue = mapData.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.[unit]) || 0), 0);
  const formattedTotal = unit === 'acres' ? totalValue.toFixed(3) : Math.round(totalValue).toLocaleString();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <style>{`
        .custom-tooltip { background: rgba(26, 35, 64, 0.95) !important; border: 1px solid rgba(201, 168, 76, 0.3) !important; border-radius: 8px !important; color: white !important; font-weight: 800 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }
        .custom-tooltip::before { border-top-color: rgba(26, 35, 64, 0.95) !important; }
      `}</style>

      <MapContainer
        center={[mapData.center.lat, mapData.center.lng]}
        zoom={mapData.zoom}
        style={{ height: '100vh', width: '100vw' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} />

        {mapData.polygons.map((poly, idx) => (
          <Polygon
            key={idx}
            positions={poly.points}
            pathOptions={{ 
              color: poly.color, 
              weight: 3, 
              opacity: 1, 
              fillColor: poly.color, 
              fillOpacity: 0.2 
            }}
          >
            <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="custom-tooltip">
               <div className="flex flex-col items-center">
                 <span className="text-[9px] opacity-70 mb-0.5">{poly.label || `Plot ${idx + 1}`}</span>
                 <span style={{ color: poly.color }}>
                   {unit === 'acres' ? `${poly.area?.acres} ac` : unit === 'sqft' ? `${parseFloat(poly.area?.sqft).toLocaleString()} ft²` : `${parseFloat(poly.area?.sqyd).toLocaleString()} yd²`}
                 </span>
               </div>
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>

      {/* Overlay: Branding */}
      <div className="absolute top-0 left-0 z-[1000] p-6 sm:p-10 pointer-events-none w-full flex justify-between items-start">
        <div className="bg-[#1a2340]/90 backdrop-blur-xl px-5 py-4 flex items-center gap-4 rounded-3xl shadow-2xl border border-white/5 pointer-events-auto">
          <div className="w-10 h-10 bg-[#c9a84c] rounded-2xl flex items-center justify-center text-[#1a2340]">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5">Splus Properties</div>
            <div className="text-[#c9a84c] text-xs font-bold flex items-center gap-2">
              Plot Boundary Map <ChevronRight size={10} className="opacity-50" />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex bg-[#1a2340]/90 backdrop-blur-xl px-5 py-4 items-center gap-6 rounded-3xl shadow-2xl border border-white/5 pointer-events-auto">
           <div className="text-center">
             <div className="text-[#c9a84c] text-lg font-black leading-none">{formattedTotal}</div>
             <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">Total {unitLabels[unit]}</div>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-center">
             <div className="text-white text-lg font-black leading-none">{mapData.polygons.length}</div>
             <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">Sections</div>
           </div>
        </div>
      </div>

      {/* Floating: Bottom Controls */}
      <div className="absolute bottom-10 left-0 z-[1000] w-full px-6 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button 
            onClick={flyToProperty}
            title="Fly to Property"
            className="w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <MapPin size={22} />
          </button>
          <button 
            onClick={getLocation}
            title="Center on me"
            className={`w-14 h-14 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 ${locating ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-[#1a2340]/95 text-[#c9a84c]'}`}
          >
            {locating ? <div className="w-5 h-5 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" /> : <Navigation size={22} />}
          </button>
          <div className="relative group">
            <select 
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="appearance-none w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-110 active:scale-95 transition-all font-black text-[10px] text-center cursor-pointer outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              <option value="acres" className="bg-[#1a2340] text-white">AC</option>
              <option value="sqft" className="bg-[#1a2340] text-white">FT²</option>
              <option value="sqyd" className="bg-[#1a2340] text-white">YD²</option>
            </select>
          </div>
          <button 
            onClick={cycleTile}
            title="Change Map Style"
            className="w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <Layers size={22} />
          </button>
        </div>

        <div className="bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl pointer-events-auto flex gap-2">
          <Link 
            to="/"
            className="px-8 py-4 bg-[#c9a84c] text-[#1a2340] rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-[#b8943e] transition-all"
          >
            Inquiry for Plot
          </Link>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Property Boundary Map', url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }
            }}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Plot Info (Bottom Drawer style) */}
      <div className="sm:hidden absolute bottom-28 left-6 right-6 z-[1000] pointer-events-none">
         <div className="bg-[#1a2340]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-white text-xs font-black uppercase tracking-widest">Boundary Summary</h3>
               <div className="text-[#c9a84c] text-xs font-black">{formattedTotal} {unit === 'acres' ? 'Ac' : 'Ft²'}</div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
               {mapData.polygons.map((p, i) => (
                 <div key={i} className="shrink-0 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold text-white/40 uppercase mb-0.5">{p.label || `Plot ${i+1}`}</div>
                    <div className="text-xs font-black text-white" style={{ color: p.color }}>
                      {unit === 'acres' ? `${p.area?.acres} ac` : `${parseFloat(p.area?.sqft).toLocaleString()} ft²`}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default SharedMap;
