import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Popup, useMapEvents } from 'react-leaflet';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import {
  Layers, Navigation, MapPin, Share2,
  ArrowLeft, Globe, LandPlot, X, Check
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';

// Leaflet marker default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  hybrid: { url: 'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}' },
  road: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
};

const MapZoomTracker = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });
  return null;
};

const SharedMap = () => {
  const navigate = useNavigate();
  const { shareId } = useParams();
  const { language, toggleLanguage, t } = useLanguage();

  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tileMode, setTileMode] = useState('hybrid');
  const [unit, setUnit] = useState('sqft');
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(18);
  const mapRef = useRef();

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await axios.get(`/api/maps/${shareId}`);
        if (res.data.success) {
          setMapData(res.data.data);
          setTileMode(res.data.data.tileMode || 'hybrid');
          if (res.data.data.zoom) {
            setCurrentZoom(res.data.data.zoom);
          }
        }
      } catch {
        setError(t('shared_map.map_not_found_desc'));
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
      () => { setLocating(false); toast.error('Location access denied. Please enable GPS permissions.'); },
      { enableHighAccuracy: true }
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: t('shared_map.title'), url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-4 font-['Nunito_Sans',sans-serif]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-white font-black text-xs uppercase tracking-widest animate-pulse">{t('shared_map.loading')}</div>
    </div>
  );

  if (error) return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-['Nunito_Sans',sans-serif]">
      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
        <X className="text-rose-500" size={36} />
      </div>
      <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tight">{t('shared_map.map_not_found')}</h1>
      <p className="text-slate-400 font-semibold max-w-xs text-sm">{error}</p>
      <button onClick={() => navigate('/')} className="mt-8 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer">
        {t('shared_map.go_home')}
      </button>
    </div>
  );

  const totalSqft = mapData.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.sqft?.replace(/,/g, '')) || 0), 0);
  const totalAcres = (totalSqft / 43560).toFixed(3);
  const totalSqyd = Math.round(totalSqft / 9);

  const formatArea = (poly) => {
    if (unit === 'acres') {
      if (poly.area?.acres) return `${poly.area.acres} ac`;
      const sqftVal = parseFloat(poly.area?.sqft?.replace(/,/g, '') || 0);
      return `${(sqftVal / 43560).toFixed(3)} ac`;
    }
    if (unit === 'sqyd') {
      if (poly.area?.sqyd) return `${poly.area.sqyd} sq.yd`;
      const sqftVal = parseFloat(poly.area?.sqft?.replace(/,/g, '') || 0);
      if (sqftVal > 0) return `${Math.round(sqftVal / 9).toLocaleString('en-IN')} sq.yd`;
      const sqmVal = parseFloat(poly.area?.sqm?.replace(/,/g, '') || 0);
      if (sqmVal > 0) return `${Math.round(sqmVal * 1.19599).toLocaleString('en-IN')} sq.yd`;
      return '0 sq.yd';
    }
    return poly.area?.sqft ? `${poly.area.sqft} sq.ft` : '0 sq.ft';
  };

  const showTooltip = currentZoom >= 15;

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-slate-900 font-['Nunito_Sans',sans-serif] antialiased select-none">
      <SEO title={t('shared_map.title')} description="View interactive property boundary map" />
      <style>{`
        .custom-tooltip {
          background: rgba(255,255,255,0.96) !important;
          border: 1.5px solid #2563eb !important;
          border-radius: 10px !important;
          color: #0f172a !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          padding: 4px 10px !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
          white-space: nowrap !important;
        }
        .custom-tooltip::before { border-top-color: rgba(255,255,255,0.96) !important; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      {/* Map Canvas */}
      <MapContainer
        center={[mapData.center.lat, mapData.center.lng]}
        zoom={mapData.zoom}
        style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} />
        <MapZoomTracker onZoomChange={setCurrentZoom} />
        {mapData.polygons.map((poly, idx) => (
          <Polygon
            key={idx}
            positions={poly.points}
            pathOptions={{ color: poly.color || '#2563eb', weight: 3.5, opacity: 1, fillColor: poly.color || '#2563eb', fillOpacity: 0.25 }}
          >
            {showTooltip && (
              <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="custom-tooltip">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-500">{poly.label || `${t('shared_map.plot')} ${idx + 1}`}</span>
                  <span style={{ color: poly.color || '#2563eb' }} className="font-black text-xs">{formatArea(poly)}</span>
                </div>
              </Tooltip>
            )}
            <Popup>
              <div className="text-center font-bold text-slate-900 min-w-[130px] p-1">
                <div className="text-sm font-black text-slate-900 mb-0.5">{poly.label || `${t('shared_map.plot')} ${idx + 1}`}</div>
                <div style={{ color: poly.color || '#2563eb' }} className="font-black text-xs">{formatArea(poly)}</div>
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>

      {/* Top Header Bar */}
      <div className="absolute top-3 left-3 right-3 md:top-4 md:left-6 md:right-6 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => navigate('/')}
            className="h-10 px-3.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center gap-1.5 text-slate-800 hover:text-blue-600 shadow-md active:scale-95 transition-all cursor-pointer font-black text-xs uppercase"
          >
            <ArrowLeft size={15} className="text-blue-600" />
            <span>{t('shared_map.home')}</span>
          </button>
          <div className="h-10 px-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl items-center gap-2 text-slate-900 shadow-md hidden sm:flex">
            <LandPlot size={16} className="text-blue-600" />
            <span className="text-xs font-black tracking-tight">{mapData.title || t('shared_map.title')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleLanguage}
            className="h-10 px-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center gap-1.5 text-slate-800 hover:text-blue-600 shadow-md active:scale-95 transition-all font-black text-xs uppercase cursor-pointer"
          >
            <Globe size={14} className="text-blue-600" />
            {language === 'en' ? 'ગુજરાતી' : 'English'}
          </button>
        </div>
      </div>

      {/* Floating Action Controls Left Dock */}
      <div className="absolute left-3 md:left-6 bottom-20 sm:bottom-6 z-[1000] flex flex-col gap-2.5">
        <button
          onClick={flyToProperty}
          title="Center Property"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <MapPin size={18} />
        </button>

        <button
          onClick={getLocation}
          title="My Location"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border transition-all active:scale-90 cursor-pointer ${
            locating ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-xl hover:text-blue-600'
          }`}
        >
          {locating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
        </button>

        <button
          onClick={cycleTile}
          title="Map Layer"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <Layers size={18} />
        </button>

        <button
          onClick={() => setUnit(u => u === 'sqft' ? 'acres' : u === 'acres' ? 'sqyd' : 'sqft')}
          title="Toggle Unit"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <span className="text-[10px] font-black uppercase">
            {unit === 'sqft' ? 'FT²' : unit === 'acres' ? 'AC' : 'YD²'}
          </span>
        </button>
      </div>

      {/* Floating Bottom Property Summary Pill (Centered) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-4 text-slate-900 pointer-events-auto">
        <div className="flex items-center gap-2">
          <LandPlot size={16} className="text-blue-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-0.5">{t('shared_map.total_property_area')}</span>
            <span className="text-slate-900 font-black text-xs sm:text-sm font-mono leading-none">
              {unit === 'sqft' ? `${totalSqft.toLocaleString('en-IN')} sq.ft` : unit === 'acres' ? `${totalAcres} acres` : `${totalSqyd.toLocaleString('en-IN')} sq.yd`}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <button
          onClick={handleShare}
          className="h-9 px-4 bg-[#1a2340] hover:bg-slate-900 text-white rounded-full flex items-center gap-1.5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          <span>{copied ? t('shared_map.copied') : t('shared_map.share')}</span>
        </button>
      </div>
    </div>
  );
};

export default SharedMap;