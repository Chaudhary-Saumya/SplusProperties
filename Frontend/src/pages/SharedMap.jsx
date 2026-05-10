import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, Marker } from 'react-leaflet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import {
  Building2, Layers, Navigation, Phone, Mail,
  MapPin, IndianRupee, AreaChart, Maximize2, X, ChevronRight, Share2,
  ChevronUp, ChevronDown, ArrowLeft
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
  hybrid:    { url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}' },
  road:      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
};

const TILE_LABELS = { satellite: 'SAT', hybrid: 'HYB', road: 'MAP' };

const SharedMap = () => {
  const navigate = useNavigate();
  const { shareId } = useParams();
  const [mapData,   setMapData]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tileMode,  setTileMode]  = useState('satellite');
  const [unit,      setUnit]      = useState('acres');
  const [error,     setError]     = useState(null);
  const [locating,  setLocating]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile summary drawer
  const mapRef = useRef();

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await axios.get(`/api/maps/${shareId}`);
        if (res.data.success) {
          setMapData(res.data.data);
          setTileMode(res.data.data.tileMode || 'satellite');
        }
      } catch {
        setError('Map not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, [shareId]);

  const cycleTile = () => {
    const order = ['satellite', 'hybrid', 'road'];
    setTileMode(cur => order[(order.indexOf(cur) + 1) % order.length]);
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
      () => { setLocating(false); alert('Location access denied.'); },
      { enableHighAccuracy: true }
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Property Boundary Map', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="h-screen w-screen bg-[#1a2340] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      <div className="text-white font-black text-xs uppercase tracking-[0.3em] animate-pulse">Loading Map...</div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="h-screen w-screen bg-[#1a2340] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
        <X className="text-red-500" size={40} />
      </div>
      <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tight">Not Found</h1>
      <p className="text-white/40 font-medium max-w-xs">{error}</p>
      <Link to="/" className="mt-8 px-8 py-3 bg-[#c9a84c] text-[#1a2340] rounded-2xl font-black text-xs uppercase tracking-widest">
        Go Home
      </Link>
    </div>
  );

  const unitLabels = { acres: 'Acres', sqft: 'Sq Ft', sqyd: 'Sq Yards' };
  const totalValue = mapData.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.[unit]) || 0), 0);
  const formattedTotal = unit === 'acres' ? totalValue.toFixed(3) : Math.round(totalValue).toLocaleString();

  const formatArea = (poly) => {
    if (unit === 'acres') return `${poly.area?.acres} ac`;
    if (unit === 'sqft')  return `${parseFloat(poly.area?.sqft).toLocaleString()} ft²`;
    return `${parseFloat(poly.area?.sqyd).toLocaleString()} yd²`;
  };

  return (
    <div style={{ height: '100dvh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#1a2340' }}>
      <style>{`
        .custom-tooltip {
          background: rgba(26,35,64,0.95) !important;
          border: 1px solid rgba(201,168,76,0.4) !important;
          border-radius: 8px !important;
          color: white !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
          padding: 6px 10px !important;
        }
        .custom-tooltip::before { border-top-color: rgba(26,35,64,0.95) !important; }
        .leaflet-control-container { display: none !important; }
        /* hide leaflet attribution on mobile */
        @media (max-width: 640px) {
          .leaflet-control-attribution { display: none !important; }
        }
        /* smooth drawer */
        .mob-drawer { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* ── Map ── */}
      <MapContainer
        center={[mapData.center.lat, mapData.center.lng]}
        zoom={mapData.zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} />
        {mapData.polygons.map((poly, idx) => (
          <Polygon
            key={idx}
            positions={poly.points}
            pathOptions={{ color: poly.color, weight: 3, opacity: 1, fillColor: poly.color, fillOpacity: 0.2 }}
          >
            <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="custom-tooltip">
              <div className="flex flex-col items-center gap-0.5">
                <span style={{ opacity: 0.65, fontSize: 9 }}>{poly.label || `Plot ${idx + 1}`}</span>
                <span style={{ color: poly.color }}>{formatArea(poly)}</span>
              </div>
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (≥640px)
      ══════════════════════════════════════════════════════════ */}

      {/* Desktop: Top bar */}
      <div className="hidden sm:flex absolute top-0 left-0 right-0 z-[1000] p-6 justify-between items-start pointer-events-none">
        {/* Brand + Back */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-[#1a2340]/90 backdrop-blur-xl rounded-2xl flex items-center justify-center text-[#c9a84c] border border-white/5 hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all shadow-xl"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-[#1a2340]/90 backdrop-blur-xl px-5 py-4 flex items-center gap-4 rounded-3xl shadow-2xl border border-white/5">
            <div className="w-10 h-10 bg-[#c9a84c] rounded-2xl flex items-center justify-center text-[#1a2340]">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5">Kharsan Properties</div>
              <div className="text-[#c9a84c] text-xs font-bold flex items-center gap-1">
                Plot Boundary Map <ChevronRight size={10} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#1a2340]/90 backdrop-blur-xl px-5 py-4 flex items-center gap-6 rounded-3xl shadow-2xl border border-white/5 pointer-events-auto">
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

      {/* Desktop: Left controls + Bottom right action */}
      <div className="hidden sm:flex absolute bottom-10 left-0 right-0 z-[1000] px-6 justify-between items-end pointer-events-none">
        {/* Control buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button onClick={flyToProperty} title="Fly to Property"
            className="w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <MapPin size={22} />
          </button>
          <button onClick={getLocation} title="My Location"
            className={`w-14 h-14 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 ${locating ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-[#1a2340]/95 text-[#c9a84c]'}`}>
            {locating ? <div className="w-5 h-5 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" /> : <Navigation size={22} />}
          </button>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            className="w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl text-[#c9a84c] shadow-2xl font-black text-[10px] text-center cursor-pointer outline-none appearance-none">
            <option value="acres" className="bg-[#1a2340] text-white">AC</option>
            <option value="sqft"  className="bg-[#1a2340] text-white">FT²</option>
            <option value="sqyd"  className="bg-[#1a2340] text-white">YD²</option>
          </select>
          <button onClick={cycleTile} title="Map Style"
            className="w-14 h-14 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <Layers size={22} />
          </button>
        </div>

        {/* CTA + Share */}
        <div className="bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl pointer-events-auto flex gap-2">
          <Link to="/" className="px-8 py-4 bg-[#c9a84c] text-[#1a2340] rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-[#b8943e] transition-all">
            Inquiry for Plot
          </Link>
          <button onClick={handleShare} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE LAYOUT (<640px) — zero overlapping
      ══════════════════════════════════════════════════════════ */}

      {/* Mobile: Top brand bar — compact single row */}
      <div className="sm:hidden absolute top-0 left-0 right-0 z-[1000] pointer-events-none"
        style={{ padding: '12px 12px 0' }}>
        <div className="bg-[#1a2340]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-3 flex items-center justify-between pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/')}
              className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-[#c9a84c] border border-white/10 active:scale-90 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c9a84c] rounded-xl flex items-center justify-center text-[#1a2340] flex-shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <div className="text-white text-[9px] font-black uppercase tracking-widest leading-none">Kharsan Properties</div>
                <div className="text-[#c9a84c] text-[10px] font-bold mt-0.5">Plot Boundary Map</div>
              </div>
            </div>
          </div>
          {/* Total area pill */}
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right">
            <div className="text-[#c9a84c] text-sm font-black leading-none">{formattedTotal}</div>
            <div className="text-white/40 text-[8px] font-bold uppercase tracking-wider mt-0.5">{unit === 'acres' ? 'Ac' : unit === 'sqft' ? 'Ft²' : 'Yd²'}</div>
          </div>
        </div>
      </div>

      {/* Mobile: Right-side vertical controls — floating, not overlapping bottom */}
      <div className="sm:hidden absolute z-[1000] pointer-events-none"
        style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}>
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button onClick={flyToProperty}
            className="w-11 h-11 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-[#c9a84c] shadow-xl active:scale-90 transition-all">
            <MapPin size={18} />
          </button>
          <button onClick={getLocation}
            className={`w-11 h-11 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${locating ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-[#1a2340]/95 text-[#c9a84c]'}`}>
            {locating ? <div className="w-4 h-4 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
          </button>
          <button onClick={cycleTile}
            className="w-11 h-11 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-[#c9a84c] shadow-xl active:scale-90 transition-all">
            <Layers size={18} />
          </button>
          {/* Unit toggle — cycles on tap */}
          <button onClick={() => setUnit(u => u === 'acres' ? 'sqft' : u === 'sqft' ? 'sqyd' : 'acres')}
            className="w-11 h-11 bg-[#1a2340]/95 backdrop-blur-xl border border-[#c9a84c]/40 rounded-xl flex items-center justify-center text-[#c9a84c] shadow-xl active:scale-90 transition-all">
            <span className="text-[9px] font-black uppercase tracking-tight leading-none">
              {unit === 'acres' ? 'AC' : unit === 'sqft' ? 'FT²' : 'YD²'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile: Bottom — drawer handle + CTA row */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">

        {/* Boundary Summary Drawer — slides up */}
        <div className={`mob-drawer pointer-events-auto bg-[#1a2340]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl`}
          style={{ transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 0px))', position: 'relative' }}>

          {/* Drag handle + toggle */}
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 active:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              {drawerOpen ? <ChevronDown size={14} className="text-[#c9a84c]" /> : <ChevronUp size={14} className="text-[#c9a84c]" />}
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                Boundary Summary
              </span>
            </div>
            <span className="text-[#c9a84c] text-sm font-black">{formattedTotal} {unit === 'acres' ? 'Ac' : unit === 'sqft' ? 'Ft²' : 'Yd²'}</span>
          </button>

          {/* Expandable plot list */}
          {drawerOpen && (
            <div className="px-4 py-3 flex gap-2 overflow-x-auto" style={{ maxHeight: 120 }}>
              {mapData.polygons.map((p, i) => (
                <div key={i} className="shrink-0 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">{p.label || `Plot ${i + 1}`}</div>
                  <div className="text-xs font-black" style={{ color: p.color }}>{formatArea(p)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA + Share — always visible at very bottom */}
        <div className="pointer-events-auto bg-[#0f1628]/95 backdrop-blur-xl border-t border-white/5 px-4 py-3 flex items-center gap-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <Link to="/" className="flex-1 py-3.5 bg-[#c9a84c] text-[#1a2340] rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all active:scale-95 hover:bg-[#b8943e]">
            Inquiry for Plot
          </Link>
          <button onClick={handleShare}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all flex-shrink-0">
            <Share2 size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SharedMap;