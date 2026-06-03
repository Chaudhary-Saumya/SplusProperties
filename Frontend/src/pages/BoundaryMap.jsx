import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MapPin, Ruler, Download, RotateCcw, Crosshair, Satellite,
  Target, X, Map, GripHorizontal, ChevronRight, Building2,
  FileText, Maximize2, Minimize2, Trash2, PenLine, StopCircle,
  AreaChart, Navigation, Layers, Plus, Palette, Share2, Copy, Check,
  ExternalLink, Search, ArrowRight, ArrowLeft, ChevronUp, ChevronDown,
  CheckCircle2, Info, Pencil, Eye, EyeOff
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

// ── Leaflet marker fix ───────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' },
  hybrid:    { url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', label: 'Hybrid' },
  road:      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Road' },
};

const COLORS = [
  { name: 'Gold',    value: '#c9a84c' },
  { name: 'Green',   value: '#10b981' },
  { name: 'Blue',    value: '#0ea5e9' },
  { name: 'Red',     value: '#ef4444' },
  { name: 'Orange',  value: '#f59e0b' },
  { name: 'Purple',  value: '#a855f7' },
  { name: 'White',   value: '#ffffff' },
];

// ─── Guided step hints (using translation keys) ───────────────────
const STEPS = {
  idle:    { icon: '👆', title: 'boundary_map.step_idle_title', subtitle: 'boundary_map.step_idle_sub' },
  drawing: { icon: '📍', title: 'boundary_map.step_drawing_title', subtitle: 'boundary_map.step_drawing_sub' },
  done:    { icon: '✅', title: 'boundary_map.step_done_title', subtitle: 'boundary_map.step_done_sub' },
};

const BoundaryMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { t, language, toggleLanguage } = useLanguage();

  const [center,        setCenter]        = useState([28.6139, 77.2090]);
  const [polygons,      setPolygons]      = useState([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [unit,          setUnit]          = useState('acres');
  const [isDrawing,     setIsDrawing]     = useState(false);
  const [tileMode,      setTileMode]      = useState('satellite');
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [shareUrl,      setShareUrl]      = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);

  // Bottom sheet state: 'peek' | 'half' | 'full'
  const [sheetState,    setSheetState]    = useState('peek');
  // Active tab in sheet: 'plots' | 'tools' | 'export'
  const [activeTab,     setActiveTab]     = useState('plots');
  // Share modal
  const [showShare,     setShowShare]     = useState(false);
  const [copied,        setCopied]        = useState(false);

  // Tutorial overlay
  const [showTutorial,  setShowTutorial]  = useState(false);
  const [tutorialSlide, setTutorialSlide] = useState(0);

  const mapRef    = useRef();
  const sheetRef  = useRef();
  const dragStart = useRef(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenMapTour');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenMapTour', 'true');
  };

  useEffect(() => {
    if (editId) fetchMapData(editId);
  }, [editId]);

  const fetchMapData = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/maps/${id}`);
      if (res.data.success) {
        const data = res.data.data;
        setPolygons(data.polygons);
        if (data.polygons.length > 0 && data.polygons[0].points.length > 0) {
          const fp = data.polygons[0].points[0];
          setCenter([fp.lat, fp.lng]);
          if (mapRef.current) mapRef.current.flyTo([fp.lat, fp.lng], 18);
        }
      }
    } catch { toast.error('Failed to load map data'); }
    finally { setLoading(false); }
  };

  const calculateArea = (points) => {
    try {
      if (points.length < 3) return null;
      const coords = points.map(p => [p.lng, p.lat]);
      coords.push(coords[0]);
      const poly     = turf.polygon([coords]);
      const sqm      = turf.area(poly);
      return {
        sqm:   Math.round(sqm).toLocaleString('en-IN'),
        sqft:  Math.round(sqm * 10.76391).toLocaleString('en-IN'),
        sqyd:  Math.round(sqm * 1.19599).toLocaleString('en-IN'),
        acres: (sqm / 4046.86).toLocaleString('en-IN', { maximumFractionDigits: 3 }),
      };
    } catch { return null; }
  };

  const addPointAtCenter = () => {
    if (!mapRef.current) return;
    const centerLatLng = mapRef.current.getCenter();
    setPolygons(prev => {
      const upd = [...prev];
      const cur = { ...upd[activeIndex] };
      cur.points = [...cur.points, centerLatLng];
      cur.area   = calculateArea(cur.points);
      upd[activeIndex] = cur;
      return upd;
    });
  };

  const getSegmentLengths = (points) => {
    if (points.length < 2) return [];
    const segments = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      if (points.length < 3 && i === points.length - 1) break;
      const latlng1 = L.latLng(p1.lat, p1.lng || p1.lon);
      const latlng2 = L.latLng(p2.lat, p2.lng || p2.lon);
      const meters = latlng1.distanceTo(latlng2);
      const feet = meters * 3.28084;
      segments.push({
        from: i + 1,
        to: ((i + 1) % points.length) + 1,
        meters: Math.round(meters),
        feet: Math.round(feet),
      });
    }
    return segments;
  };

  const renderEdgeLabels = (poly) => {
    if (poly.points.length < 2) return null;
    const segments = getSegmentLengths(poly.points);
    return segments.map((seg, sIdx) => {
      const p1 = poly.points[seg.from - 1];
      const p2 = poly.points[seg.to - 1];
      const midLat = (p1.lat + p2.lat) / 2;
      const midLng = (p1.lng + p2.lng) / 2;
      const labelText = unit === 'sqft' ? `${seg.feet} ft` : `${seg.meters} m`;
      return (
        <Marker
          key={`edge-label-${sIdx}`}
          position={[midLat, midLng]}
          interactive={false}
          icon={L.divIcon({
            className: 'edge-label-icon',
            html: `<div style="background:rgba(16,24,40,0.85);color:${poly.color};border:1px solid ${poly.color}40;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:900;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:translate(-50%, -50%);">${labelText}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          })}
        />
      );
    });
  };

  const MapEvents = () => {
    const map = useMap();
    useMapEvents({
      click(e) {
        if (!isDrawing) return;
        setPolygons(prev => {
          const upd = [...prev];
          const cur = { ...upd[activeIndex] };
          cur.points = [...cur.points, e.latlng];
          cur.area   = calculateArea(cur.points);
          upd[activeIndex] = cur;
          return upd;
        });
      },
      locationfound(e) {
        setCenter([e.latlng.lat, e.latlng.lng]);
        map.flyTo(e.latlng, map.getZoom());
      },
    });
    return null;
  };

  const updatePoint = (pIdx, ptIdx, ll) => {
    setPolygons(prev => {
      const upd = [...prev];
      const cur = { ...upd[pIdx] };
      cur.points = [...cur.points];
      cur.points[ptIdx] = ll;
      cur.area   = calculateArea(cur.points);
      upd[pIdx]  = cur;
      return upd;
    });
  };

  const startDrawing = () => { setIsDrawing(true); setSheetState('peek'); };
  const stopDrawing  = () => setIsDrawing(false);

  const addNewPlot = () => {
    const n   = polygons.length + 1;
    const arr = [...polygons, { points: [], color: COLORS[n % COLORS.length].value, label: `Plot ${n}`, area: null }];
    setPolygons(arr);
    setActiveIndex(arr.length - 1);
    setIsDrawing(true);
    setSheetState('peek');
  };

  const deletePlot = (idx) => {
    if (polygons.length === 1) {
      setPolygons([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
      return;
    }
    const f = polygons.filter((_, i) => i !== idx);
    setPolygons(f);
    setActiveIndex(Math.max(0, idx - 1));
  };

  const resetAll = () => {
    if (window.confirm(t('boundary_map.clear_confirm'))) {
      setPolygons([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
      setActiveIndex(0);
      setIsDrawing(false);
    }
  };

  const undoLastPoint = () => {
    setPolygons(prev => {
      const upd = [...prev];
      const cur = { ...upd[activeIndex] };
      if (!cur.points.length) return prev;
      cur.points = cur.points.slice(0, -1);
      cur.area   = calculateArea(cur.points);
      upd[activeIndex] = cur;
      return upd;
    });
  };

  const updatePlotField = (idx, field, value) => {
    setPolygons(prev => {
      const upd = [...prev];
      upd[idx] = { ...upd[idx], [field]: value };
      return upd;
    });
  };

  const getLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        if (mapRef.current) mapRef.current.flyTo(loc, 18, { duration: 1.5 });
        setLoading(false);
      },
      () => { setLoading(false); toast.error(t('boundary_map.location_denied')); },
      { enableHighAccuracy: true }
    );
  };

  const cycleTile = () => {
    const order = ['satellite', 'hybrid', 'road'];
    setTileMode(cur => order[(order.indexOf(cur) + 1) % order.length]);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data?.length > 0) {
        const { lat, lon } = res.data[0];
        if (mapRef.current) mapRef.current.flyTo([lat, lon], 16, { duration: 1.5 });
        setSearchOpen(false);
        setSearchQuery('');
      } else { toast.error(t('boundary_map.location_not_found')); }
    } catch { toast.error(t('boundary_map.search_failed')); }
    finally { setSearchLoading(false); }
  };

  const handleSaveAndShare = async () => {
    if (polygons.some(p => p.points.length < 3)) return toast.warn('All plots must have at least 3 points.');
    setSaving(true);
    try {
      let thumbnail = null;
      try {
        const canvas = await html2canvas(document.querySelector('.leaflet-container'), { useCORS: true, scale: 0.5, logging: false });
        thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      } catch {}

      const mapState = {
        title: 'Land Plot Boundary Map',
        shareId: editId || undefined,
        thumbnail,
        polygons: polygons.map(p => ({
          points: p.points.map(pt => ({ lat: pt.lat, lng: pt.lng })),
          color: p.color, label: p.label, area: p.area
        })),
        center: { lat: mapRef.current.getCenter().lat, lng: mapRef.current.getCenter().lng },
        zoom: mapRef.current.getZoom(),
        tileMode
      };

      const res = await axios.post('/api/maps', mapState);
      if (res.data.success) {
        const url = `${window.location.origin}/m/${res.data.data.shareId}`;
        setShareUrl(url);
        setShowShare(true);
        if (!res.data.data.createdBy) {
          toast.info(t('boundary_map.guest_save_info'), { autoClose: 8000 });
        } else {
          toast.success(t('boundary_map.save_success'));
        }
      }
    } catch { toast.error(t('boundary_map.save_failed')); }
    finally { setSaving(false); }
  };

  const exportKML = () => {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document><name>Land Plots — Kharsan Properties</name>`;
    polygons.forEach(p => {
      if (p.points.length < 3) return;
      const coords = [...p.points, p.points[0]].map(pt => `${pt.lng},${pt.lat},0`).join(' ');
      kml += `\n<Placemark><name>${p.label}</name><Style><PolyStyle><color>7f${p.color.replace('#','').split('').reverse().join('')}</color></PolyStyle></Style><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`;
    });
    kml += `\n</Document>\n</kml>`;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'land-plots.kml'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) return toast.error('Map not found');
    const toastId = toast.loading(t('boundary_map.generating_report'));
    try {
      const canvas  = await html2canvas(mapEl, { useCORS: true, scale: 2, logging: false, backgroundColor: '#1a2340' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const doc     = new jsPDF();
      const date    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFillColor(26, 35, 64); doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(201, 168, 76); doc.setFontSize(26); doc.setFont('helvetica', 'bold');
      doc.text('Kharsan Properties', 105, 22, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
      doc.text('PREMIUM LAND MAPPING SOLUTIONS', 105, 30, { align: 'center', charSpace: 2 });
      doc.setFontSize(14); doc.text('Multi-Plot Boundary Report', 105, 38, { align: 'center' });
      doc.setDrawColor(201, 168, 76); doc.setLineWidth(1.5);
      doc.rect(14, 54, 182, 102, 'D');
      doc.addImage(imgData, 'JPEG', 15, 55, 180, 100);
      doc.setTextColor(26, 35, 64); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Property Breakdown', 20, 175);
      doc.setDrawColor(26, 35, 64); doc.setLineWidth(0.5); doc.line(20, 178, 80, 178);
      let y = 188;
      doc.setFillColor(248, 245, 238); doc.rect(20, y - 5, 170, 8, 'F');
      doc.setFontSize(9); doc.setTextColor(26, 35, 64);
      doc.text('PLOT NAME', 25, y); doc.text('ACRES', 80, y); doc.text('SQ FT', 120, y); doc.text('SQ YARDS', 160, y);
      y += 10;
      polygons.forEach(p => {
        if (!p.area) return;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(26, 35, 64); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(p.label, 25, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`${p.area.acres} ac`, 80, y); doc.text(`${p.area.sqft}`, 120, y); doc.text(`${p.area.sqyd}`, 160, y);
        doc.setFillColor(p.color); doc.circle(22, y - 1, 1, 'F');
        y += 8;
      });
      const total = polygons.reduce((a, p) => a + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
      y += 5; doc.setDrawColor(230); doc.line(20, y - 5, 190, y - 5);
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${total} ACRES`, 105, y + 5, { align: 'center' });
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`© ${new Date().getFullYear()} Kharsan Properties · Boundary visualization only.`, 105, 288, { align: 'center' });
      doc.text(`Generated: ${date}`, 105, 292, { align: 'center' });
      doc.save(`Kharsan-Boundary-${Date.now()}.pdf`);
      toast.update(toastId, { render: t('boundary_map.report_downloaded'), type: 'success', isLoading: false, autoClose: 3000 });
    } catch {
      toast.update(toastId, { render: t('boundary_map.report_failed'), type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('boundary_map.link_copied'));
  };

  // Current step state for hint bar
  const activePoly = polygons[activeIndex];
  const hintState  = isDrawing
    ? (activePoly?.points?.length >= 3 ? 'done' : 'drawing')
    : 'idle';

  // Sheet heights: peek = just handle + controls, half = 45vh, full = 90vh
  const sheetHeights = { peek: 'calc(env(safe-area-inset-bottom) + 85px)', half: '50vh', full: '90vh' };

  const onSheetTouchStart = (e) => {
    dragStart.current = e.touches[0].clientY;
  };
  const onSheetTouchEnd = (e) => {
    if (!dragStart.current) return;
    const delta = dragStart.current - e.changedTouches[0].clientY;
    if (delta > 50) setSheetState(s => s === 'peek' ? 'half' : 'full');
    if (delta < -50) setSheetState(s => s === 'full' ? 'half' : 'peek');
    dragStart.current = null;
  };

  const totalArea = polygons.reduce((a, p) => a + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#0a0f1e]">
      <SEO title={t('boundary_map.title')} description={t('boundary_map.description')} />
      <style>{`
        .gold-marker { pointer-events: auto !important; z-index: 1000 !important; }
        .gold-marker > div { cursor: crosshair !important; transition: transform 0.15s ease; }
        .custom-tooltip { background: rgba(26,35,64,0.97) !important; border: 1px solid rgba(201,168,76,0.4) !important; border-radius: 10px !important; color: white !important; font-weight: 800 !important; font-size: 11px !important; padding: 6px 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important; white-space: nowrap !important; }
        .custom-tooltip::before { border-top-color: rgba(26,35,64,0.97) !important; }
        .no-scroll { overflow: hidden; }
        .leaflet-container { cursor: ${isDrawing ? 'crosshair' : 'grab'} !important; }
        .sheet-enter { animation: sheetUp 0.35s cubic-bezier(0.32,0.72,0,1); }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .tab-active { background: #c9a84c; color: #1a2340; }
        .tab-inactive { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      {/* ═══════════════ FULL SCREEN MAP ═══════════════ */}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100vh', width: '100vw', position: 'absolute', inset: 0 }}
        ref={mapRef}
        zoomControl={false}
        dragging={true}
        renderer={L.canvas()}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} />
        <MapEvents />

        {polygons.map((poly, pIdx) => (
          <React.Fragment key={pIdx}>
            {poly.points.length > 0 && (
              <Polygon
                positions={poly.points}
                pathOptions={{
                  color: poly.color,
                  weight: activeIndex === pIdx ? 3 : 2,
                  opacity: 1,
                  fillColor: poly.color,
                  fillOpacity: activeIndex === pIdx ? 0.25 : 0.12,
                  dashArray: activeIndex === pIdx && isDrawing ? '6,10' : ''
                }}
                eventHandlers={{ click: () => setActiveIndex(pIdx) }}
              >
                {!isDrawing && poly.area && (
                  <Tooltip direction="center" offset={[0,0]} opacity={1} permanent className="custom-tooltip">
                    <div className="text-center">
                      <div style={{ color: poly.color }} className="font-black">{poly.label}</div>
                      <div className="text-white/70 text-[10px]">
                        {unit === 'acres' ? `${poly.area.acres} ${t('tools_page.acre').toLowerCase()}` : `${poly.area.sqft} ${t('tools_page.sqft').toLowerCase()}`}
                      </div>
                    </div>
                  </Tooltip>
                )}
                <Popup>
                  <div className="text-center font-bold text-[#1a2340] min-w-[120px]">
                    <div className="text-base mb-1">{poly.label}</div>
                    <div style={{ color: poly.color }} className="font-black">{poly.area?.acres} {t('tools_page.acre')}</div>
                    <div className="text-xs opacity-50">{poly.area?.sqft} {t('tools_page.sqft')}</div>
                  </div>
                </Popup>
              </Polygon>
            )}
            
            {/* Real-time edge dimensions displayed on map */}
            {renderEdgeLabels(poly)}

            {activeIndex === pIdx && poly.points.map((pt, ptIdx) => (
              <Marker
                key={`${pIdx}-${ptIdx}`}
                position={pt}
                draggable
                eventHandlers={{ dragend: (e) => updatePoint(pIdx, ptIdx, e.target.getLatLng()) }}
                icon={L.divIcon({
                  className: 'drawing-handle',
                  html: `<div style="background:${poly.color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
                  iconSize: [14, 14], iconAnchor: [7, 7]
                })}
              />
            ))}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* ═══════════════ TARGET CROSSHAIR ═══════════════ */}
      {isDrawing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#c9a84c] rounded-full animate-pulse flex items-center justify-center">
            <div className="w-2 h-2 bg-[#c9a84c] rounded-full" />
          </div>
          <div className="absolute w-12 h-0.5 bg-[#c9a84c]/40" />
          <div className="absolute h-12 w-0.5 bg-[#c9a84c]/40" />
        </div>
      )}

      {/* ═══════════════ TOP LEFT: BACK, LANG & HELP BUTTONS ═══════════════ */}
      <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2 max-w-[calc(100vw-80px)] overflow-x-auto">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="h-11 px-4 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2.5 text-white shadow-2xl active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft size={16} className="text-[#c9a84c]" />
          <span className="text-[11px] font-black uppercase tracking-widest">{t('boundary_map.back')}</span>
        </button>
        <button
          onClick={toggleLanguage}
          className="h-11 px-4 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 text-white shadow-2xl active:scale-95 transition-all font-black text-xs uppercase shrink-0"
        >
          <span className="text-[#c9a84c]">🌐</span>
          {language === 'en' ? 'ગુજરાતી' : 'English'}
        </button>
        <button
          onClick={() => { setShowTutorial(true); setTutorialSlide(0); }}
          className="h-11 w-11 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl active:scale-95 transition-all shrink-0"
        >
          <Info size={18} />
        </button>
      </div>

      {/* ═══════════════ TOP RIGHT: STATUS PILL ═══════════════ */}
      {/* <div className="absolute top-3 right-3 z-[1001]">
        <div className={`h-9 px-4 rounded-full flex items-center gap-2 border shadow-xl backdrop-blur-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          isDrawing ? 'bg-[#c9a84c] border-[#c9a84c]/50 text-[#1a2340]' : 'bg-[#1a2340]/90 border-white/10 text-white/60'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDrawing ? 'bg-[#1a2340] animate-ping' : 'bg-[#c9a84c] animate-pulse'}`} />
          {isDrawing ? t('boundary_map.drawing_pts').replace('{count}', activePoly?.points?.length || 0) : t('boundary_map.ready')}
        </div>
      </div> */}

      {/* ═══════════════ SEARCH OVERLAY ═══════════════ */}
      {searchOpen && (
        <div className="absolute inset-0 z-[1100] bg-[#0a0f1e]/80 backdrop-blur-sm flex flex-col items-center pt-16 px-4">
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <div className="bg-[#1a2340] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center px-5 py-4 gap-3 border-b border-white/5">
                <Search size={18} className="text-[#c9a84c] shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t('boundary_map.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-bold placeholder:text-white/25 outline-none"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-white/30 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="w-full py-4 bg-[#c9a84c] text-[#1a2340] font-black text-sm uppercase tracking-widest disabled:opacity-50 transition-all active:scale-98"
              >
                {searchLoading ? t('search_page.searching') || 'Searching...' : `🔍  ${t('boundary_map.search_btn')}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════ FLOATING ACTION BUTTONS (Left Side) ═══════════════ */}
      <div 
        className="absolute left-3 z-[1001] flex flex-col gap-2.5 transition-all duration-300" 
        style={{ bottom: isDrawing ? '90px' : `calc(${sheetHeights[sheetState]} + 16px)` }}
      >
        {/* GPS */}
        <button
          onClick={getLocation}
          title={t('boundary_map.navigate_my_location')}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border transition-all active:scale-90 ${
            loading ? 'bg-[#c9a84c] border-[#c9a84c]/50' : 'bg-[#1a2340]/95 border-white/10 backdrop-blur-xl'
          }`}
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" />
            : <Navigation size={18} className="text-[#c9a84c]" />
          }
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-12 h-12 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <Search size={18} className="text-[#c9a84c]" />
        </button>

        {/* Map Layer */}
        <button
          onClick={cycleTile}
          title={t('boundary_map.map_type')}
          className="w-12 h-12 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <Layers size={18} className="text-[#c9a84c]" />
        </button>

        {/* Unit Toggle */}
        <button
          onClick={() => setUnit(u => u === 'acres' ? 'sqft' : u === 'sqft' ? 'sqyd' : 'acres')}
          className="w-12 h-12 bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <span className="text-[#c9a84c] text-[10px] font-black uppercase">
            {unit === 'acres' ? 'AC' : unit === 'sqft' ? 'FT²' : 'YD²'}
          </span>
        </button>
      </div>

      {/* ═══════════════ FLOATING DRAWING ACTION PANEL ═══════════════ */}
      {isDrawing && (
        <div className="absolute bottom-[24px] left-0 right-0 z-[1001] flex justify-center px-4 pointer-events-auto">
          <div className="flex items-center gap-3.5 px-4 py-2.5 bg-[#101828]/95 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            
            {/* Undo Button */}
            <button
              onClick={undoLastPoint}
              disabled={!activePoly?.points?.length}
              title={t('boundary_map.undo_point')}
              className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all shrink-0"
            >
              <RotateCcw size={15} />
            </button>

            {/* Add Corner FAB */}
            <button
              onClick={addPointAtCenter}
              title={t('boundary_map.add_corner_hint')}
              className="h-12 px-6 bg-[#c9a84c] border border-[#c9a84c]/30 text-[#1a2340] rounded-full shadow-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shrink-0"
            >
              <Target size={16} className="animate-pulse" />
              <span>{t('boundary_map.add_corner')}</span>
            </button>

            {/* Done / Stop Button */}
            <button
              onClick={stopDrawing}
              title={t('boundary_map.stop_drawing')}
              className="w-11 h-11 bg-red-500 border border-red-400/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ HINT BAR (shows when drawing) ═══════════════ */}
      {(isDrawing || hintState !== 'idle') && (
        <div className="absolute top-[68px] left-0 right-0 z-[1000] flex justify-center px-4 pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-xl text-[11px] font-bold transition-all ${
            hintState === 'done'
              ? 'bg-[#101828]/95 border-emerald-500/30 text-emerald-400'
              : 'bg-[#101828]/95 border-[#c9a84c]/30 text-[#c9a84c]'
          }`}>
            <span className="text-xs">{STEPS[hintState].icon}</span>
            <span className="font-black uppercase tracking-wider">{t(STEPS[hintState].title)}</span>
            {activePoly?.points?.length > 0 && (
              <span className="text-white/40 px-1.5 py-0.5 bg-white/5 rounded-full text-[9px] font-bold">
                {activePoly.points.length} pts
              </span>
            )}
            {activePoly?.area && (
              <span className="text-white/60 font-black">
                · {activePoly.area.acres} ac
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ BOTTOM SHEET ═══════════════ */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-[1002] bg-[#101828] sheet-enter"
        style={{
          height: isDrawing ? '0px' : sheetHeights[sheetState],
          transition: 'all 0.35s cubic-bezier(0.32,0.72,0,1)',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTop: isDrawing ? 'none' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isDrawing ? 'none' : '0 -20px 60px rgba(0,0,0,0.6)'
        }}
        onTouchStart={onSheetTouchStart}
        onTouchEnd={onSheetTouchEnd}
      >
        {/* Drag Handle & Summary Header */}
        <div 
          onClick={() => { if (sheetState === 'peek') setSheetState('half'); }}
          className="flex flex-col items-center pt-3 pb-2 shrink-0 cursor-pointer select-none"
        >
          <div className="w-12 h-1.5 bg-white/10 rounded-full mb-3 shrink-0" />
          
          {sheetState === 'peek' && (
            <div className="w-full flex items-center justify-between px-5 py-1">
              <div className="flex flex-col">
                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest text-left">
                  {polygons.length} {polygons.length > 1 ? 'Plots' : 'Plot'}
                </span>
                <span className="text-white font-black text-sm">
                  {totalArea > 0 
                    ? `${totalArea.toFixed(3)} ${t('tools_page.acre').toLowerCase()}` 
                    : t('boundary_map.no_boundary')}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); startDrawing(); }}
                className="h-10 px-5 bg-[#c9a84c] text-[#1a2340] rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-lg"
              >
                <PenLine size={13} />
                <span>{t('boundary_map.start_drawing')}</span>
              </button>
            </div>
          )}

          {sheetState !== 'peek' && (
            <div className="text-white/30 text-[9px] font-black uppercase tracking-widest pb-1">
              {t('boundary_map.title')}
            </div>
          )}
        </div>

        {/* Tab Bar - only shows when expanded */}
        {sheetState !== 'peek' && (
          <div className="flex gap-2 px-4 pb-2 shrink-0">
            {[
              { id: 'plots', label: `📍 ${t('boundary_map.plots_tab')}`, count: polygons.length },
              { id: 'tools', label: `🛠 ${t('boundary_map.tools_tab')}` },
              { id: 'export', label: `📤 ${t('boundary_map.export_tab')}` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  activeTab === tab.id ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-white/5 text-white/40'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-[#1a2340]/20' : 'bg-white/10'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Sheet Content (scrollable) - only shows when expanded */}
        {sheetState !== 'peek' && (
          <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* ── PLOTS TAB ── */}
            {activeTab === 'plots' && (
              <div className="space-y-3 pt-1">
                {/* Total area summary */}
                {totalArea > 0 && (
                  <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">{t('boundary_map.total_area')}</div>
                      <div className="text-[#c9a84c] text-xl font-black">{totalArea.toFixed(3)} <span className="text-sm font-bold opacity-60">{t('tools_page.acre').toLowerCase()}</span></div>
                    </div>
                    <div className="text-3xl">🏞️</div>
                  </div>
                )}

                {/* Plots list */}
                {polygons.map((poly, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      activeIndex === idx
                        ? 'bg-white/[0.06] border-white/20 shadow-lg'
                        : 'bg-white/[0.03] border-white/5 active:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div className="w-1 h-12 rounded-full shrink-0" style={{ background: poly.color }} />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={poly.label}
                          onChange={e => updatePlotField(idx, 'label', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full bg-transparent border-none p-0 text-sm font-black text-white outline-none placeholder:text-white/25 mb-0.5"
                          placeholder={t('boundary_map.plot_name_placeholder')}
                        />
                        <div className="text-[11px] text-white/40 font-medium">
                          {poly.area
                            ? `${poly.area.acres} ${t('tools_page.acre').toLowerCase()} · ${poly.area.sqft} ${t('tools_page.sqft').toLowerCase()}`
                            : poly.points.length > 0
                              ? t('boundary_map.points_placed').replace('{count}', poly.points.length)
                              : t('boundary_map.no_boundary')
                          }
                        </div>
                      </div>
                      {/* Badge */}
                      {activeIndex === idx && (
                        <div className="bg-[#c9a84c]/20 text-[#c9a84c] text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shrink-0">{t('boundary_map.active_badge')}</div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deletePlot(idx); }}
                        className="p-2 hover:bg-red-500/20 text-white/20 hover:text-red-400 rounded-xl transition-all active:scale-90 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Color picker - show only for active */}
                    {activeIndex === idx && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-wider mr-1">{t('boundary_map.color_label')}</span>
                        {COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={e => { e.stopPropagation(); updatePlotField(idx, 'color', c.value); }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${poly.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                            style={{ background: c.value }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Segment Lengths - show only for active */}
                    {activeIndex === idx && poly.points.length >= 2 && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5" onClick={e => e.stopPropagation()}>
                        <div className="text-[10px] text-white/30 font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Ruler size={10} className="text-[#c9a84c]" />
                          {t('boundary_map.segment_lengths')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {getSegmentLengths(poly.points).map((seg, sIdx) => (
                            <div key={sIdx} className="bg-white/[0.02] border border-white/5 rounded-xl p-2 flex items-center justify-between text-[11px]">
                              <span className="text-white/40 font-bold">
                                {t('boundary_map.side_label').replace('{index}', `${seg.from}→${seg.to}`)}
                              </span>
                              <span className="text-[#c9a84c] font-black">
                                {unit === 'acres' || unit === 'sqyd' 
                                  ? `${seg.meters} m (${seg.feet} ft)` 
                                  : `${seg.feet} ft`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new plot */}
                <button
                  onClick={addNewPlot}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#c9a84c]/40 text-white/30 hover:text-[#c9a84c] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus size={16} /> {t('boundary_map.add_new_plot')}
                </button>

                {/* Quick undo/reset */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={undoLastPoint}
                    className="flex-1 py-3 bg-white/[0.04] border border-white/10 rounded-2xl text-white/50 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw size={14} /> {t('boundary_map.undo_point')}
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex-1 py-3 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400/70 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Trash2 size={14} /> {t('boundary_map.clear_all')}
                  </button>
                </div>
              </div>
            )}

            {/* ── TOOLS TAB ── */}
            {activeTab === 'tools' && (
              <div className="space-y-3 pt-1">
                {/* Map Layer */}
                <div>
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2 px-1">{t('boundary_map.map_type')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TILES).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setTileMode(key)}
                        className={`py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex flex-col items-center gap-1.5 ${
                          tileMode === key ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-white/[0.04] border border-white/10 text-white/50'
                        }`}
                      >
                        <span className="text-lg">{key === 'satellite' ? '🛰' : key === 'hybrid' ? '🌍' : '🗺'}</span>
                        <span>
                          {key === 'satellite' 
                            ? (language === 'gu' ? 'સેટેલાઇટ' : 'Satellite') 
                            : key === 'hybrid' 
                              ? (language === 'gu' ? 'હાઇબ્રિડ' : 'Hybrid') 
                              : (language === 'gu' ? 'રોડ નકશો' : 'Road Map')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Measurement Unit */}
                <div>
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2 px-1">{t('boundary_map.measurement_unit')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'acres', emoji: '🌾' },
                      { value: 'sqft',  emoji: '📐' },
                      { value: 'sqyd',  emoji: '📏' },
                    ].map(u => (
                      <button
                        key={u.value}
                        onClick={() => setUnit(u.value)}
                        className={`py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex flex-col items-center gap-1.5 ${
                          unit === u.value ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-white/[0.04] border border-white/10 text-white/50'
                        }`}
                      >
                        <span className="text-lg">{u.emoji}</span>
                        <span>
                          {u.value === 'acres' 
                            ? t('tools_page.acre') 
                            : u.value === 'sqft' 
                              ? t('tools_page.sqft') 
                              : t('tools_page.sqyrd')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPS */}
                <button
                  onClick={() => { getLocation(); setSheetState('peek'); }}
                  className="w-full py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Navigation size={18} className="text-[#c9a84c]" />
                  {t('boundary_map.navigate_my_location')}
                </button>

                {/* Undo + Reset */}
                <div className="flex gap-2">
                  <button onClick={undoLastPoint} className="flex-1 py-3.5 bg-white/[0.04] border border-white/10 rounded-2xl text-white/50 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95">
                    <RotateCcw size={14} /> {t('boundary_map.undo_point')}
                  </button>
                  <button onClick={resetAll} className="flex-1 py-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-2xl text-red-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95">
                    <Trash2 size={14} /> {t('boundary_map.clear_all')}
                  </button>
                </div>
              </div>
            )}

            {/* ── EXPORT TAB ── */}
            {activeTab === 'export' && (
              <div className="space-y-3 pt-1">
                {/* Summary card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">{t('boundary_map.summary')}</div>
                  {polygons.map((p, i) => (
                    p.area && (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-white/70 text-xs font-bold">{p.label}</span>
                        </div>
                        <span className="text-[#c9a84c] text-xs font-black">{p.area.acres} {t('tools_page.acre').toLowerCase()}</span>
                      </div>
                    )
                  ))}
                  {totalArea > 0 && (
                    <div className="pt-2 border-t border-white/10 flex justify-between">
                      <span className="text-white/40 text-xs font-black uppercase">{t('boundary_map.total')}</span>
                      <span className="text-white font-black text-sm">{totalArea.toFixed(3)} {t('tools_page.acre').toLowerCase()}</span>
                    </div>
                  )}
                </div>

                {/* Save & Share */}
                <button
                  onClick={handleSaveAndShare}
                  disabled={saving}
                  className="w-full py-5 bg-[#c9a84c] text-[#1a2340] rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60 shadow-lg"
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-[#1a2340]/40 border-t-[#1a2340] rounded-full animate-spin" /> {t('boundary_map.saving')}</>
                    : <><Share2 size={18} /> {t('boundary_map.save_generate_link')}</>
                  }
                </button>

                {/* PDF Report */}
                <button
                  onClick={exportPDF}
                  className="w-full py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <FileText size={18} className="text-[#c9a84c]" /> {t('boundary_map.pdf_report')}
                </button>

                {/* KML Export */}
                {/* <button
                  onClick={exportKML}
                  className="w-full py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Download size={18} className="text-[#c9a84c]" /> {t('boundary_map.kml_file')}
                </button> */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ SHARE MODAL ═══════════════ */}
      {showShare && shareUrl && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#101828] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-black text-base">{t('boundary_map.map_saved')}</div>
                <div className="text-white/50 text-xs font-medium">{t('boundary_map.shareable_ready')}</div>
              </div>
              <button onClick={() => setShowShare(false)} className="ml-auto text-white/30 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-wider mb-1">{t('boundary_map.share_link')}</div>
                  <div className="text-white/70 text-xs font-bold truncate">{shareUrl}</div>
                </div>
                <button
                  onClick={copyLink}
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-[#c9a84c] text-[#1a2340]'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <ExternalLink size={16} className="text-[#c9a84c]" /> {t('boundary_map.open_map')}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TUTORIAL OVERLAY ═══════════════ */}
      {showTutorial && (
        <div className="fixed inset-0 z-[2100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101828] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-white font-black text-lg flex items-center gap-2">
                  <span>🗺️</span> {t('boundary_map.tutorial_title')}
                </h3>
                <button onClick={closeTutorial} className="text-white/30 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Slider content */}
              <div className="space-y-4 py-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 min-h-[220px] justify-center">
                  {tutorialSlide === 0 && (
                    <>
                      <div className="text-4xl animate-bounce">🔍</div>
                      <div className="text-[#c9a84c] font-black text-sm">{t('boundary_map.tutorial_step1_title')}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{t('boundary_map.tutorial_step1_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 1 && (
                    <>
                      <div className="text-4xl animate-pulse">🎯</div>
                      <div className="text-[#c9a84c] font-black text-sm">{t('boundary_map.tutorial_step2_title')}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{t('boundary_map.tutorial_step2_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 2 && (
                    <>
                      <div className="text-4xl">📏</div>
                      <div className="text-[#c9a84c] font-black text-sm">{t('boundary_map.tutorial_step3_title')}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{t('boundary_map.tutorial_step3_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 3 && (
                    <>
                      <div className="text-4xl">💾</div>
                      <div className="text-[#c9a84c] font-black text-sm">{t('boundary_map.tutorial_step4_title')}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{t('boundary_map.tutorial_step4_desc')}</p>
                    </>
                  )}
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map(idx => (
                    <button
                      key={idx}
                      onClick={() => setTutorialSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${tutorialSlide === idx ? 'w-6 bg-[#c9a84c]' : 'w-1.5 bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {tutorialSlide > 0 ? (
                  <button
                    onClick={() => setTutorialSlide(s => s - 1)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ArrowLeft size={14} /> {t('boundary_map.back')}
                  </button>
                ) : null}

                {tutorialSlide < 3 ? (
                  <button
                    onClick={() => setTutorialSlide(s => s + 1)}
                    className="flex-1 py-3 bg-[#c9a84c] text-[#1a2340] rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={closeTutorial}
                    className="flex-1 py-3 bg-[#c9a84c] text-[#1a2340] rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Check size={14} /> {t('boundary_map.close_tutorial')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundaryMap;