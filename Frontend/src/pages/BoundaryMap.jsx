import React, { useState, useRef, useEffect } from 'react';
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
  AreaChart, Navigation, Layers, Plus, Palette, Share2, Copy, Check, ExternalLink, Search, ArrowRight
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// ── Leaflet marker fix ───────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Custom gold marker ───────────────────────────────────────────
const goldIcon = new L.DivIcon({
  className: 'gold-marker',
  html: `<div style="width:16px;height:16px;background:#c9a84c;border:3px solid #1a2340;border-radius:50%;box-shadow:0 2px 8px rgba(26,35,64,0.4);cursor:grab;transition:transform 0.15s ease;z-index:1000;position:relative;" onmouseover="this.style.transform='scale(1.4)';this.style.cursor='grab'" onmouseout="this.style.transform='scale(1)';this.style.cursor='grab'" onmousedown="this.style.cursor='grabbing'" onmouseup="this.style.cursor='grab'"></div>`,
  iconSize:   [16, 16],
  iconAnchor: [8, 8],
});

// ── Tile layer configs ───────────────────────────────────────────
const TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    label: 'Satellite',
  },
  hybrid: {
    url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
    label: 'Hybrid',
  },
  road: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'Road',
  },
};

const COLORS = [
  { name: 'Splus Gold', value: '#c9a84c' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Crimson', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'White', value: '#ffffff' },
];

const BoundaryMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [center,         setCenter]         = useState([28.6139, 77.2090]);
  const [polygons,       setPolygons]       = useState([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
  const [activeIndex,    setActiveIndex]    = useState(0);
  const [unit,           setUnit]           = useState('acres'); // 'acres' or 'sqft'
  const [isDrawing,      setIsDrawing]      = useState(false);
  const [tileMode,       setTileMode]       = useState('satellite');
  const [showPanel,      setShowPanel]      = useState(true);
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [shareUrl,       setShareUrl]       = useState(null);
  const [collapsed,      setCollapsed]      = useState(false);
  const [panelPos,       setPanelPos]       = useState({ x: null, y: 24 });
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchLoading,  setSearchLoading]  = useState(false);

  useEffect(() => {
    if (editId) {
      fetchMapData(editId);
    }
  }, [editId]);

  const fetchMapData = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/maps/${id}`);
      if (res.data.success) {
        const data = res.data.data;
        setPolygons(data.polygons);
        if (data.polygons.length > 0 && data.polygons[0].points.length > 0) {
          const firstPoint = data.polygons[0].points[0];
          setCenter([firstPoint.lat, firstPoint.lng]);
          if (mapRef.current) {
            mapRef.current.flyTo([firstPoint.lat, firstPoint.lng], 18);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = () => setUnit(u => u === 'acres' ? 'sqft' : 'acres');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lon], 16, { duration: 1.5 });
        }
      } else {
        toast.error('Location not found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const mapRef       = useRef();
  const panelRef     = useRef();

  // ── Area calculation ─────────────────────────────
  const calculateArea = (points) => {
    try {
      if (points.length < 3) return null;
      const coords = points.map(p => [p.lng, p.lat]);
      coords.push(coords[0]);
      const polygon   = turf.polygon([coords]);
      const sqMeters  = turf.area(polygon);

      return {
        sqm:   Math.round(sqMeters).toLocaleString('en-IN'),
        sqft:  Math.round(sqMeters * 10.76391).toLocaleString('en-IN'),
        sqyd:  Math.round(sqMeters * 1.19599).toLocaleString('en-IN'),
        acres: (sqMeters / 4046.86).toLocaleString('en-IN', { maximumFractionDigits: 3 }),
      };
    } catch (err) {
      console.error('Area calculation error:', err);
      return null;
    }
  };

  // ── Map event handler component (click to add points) ────────
  const MapEvents = () => {
    const map = useMap();
    useMapEvents({
      click(e) {
        if (!isDrawing) return;
        const point = e.latlng;
        setPolygons(prev => {
          const updated = [...prev];
          const current = { ...updated[activeIndex] };
          current.points = [...current.points, point];
          current.area = calculateArea(current.points);
          updated[activeIndex] = current;
          return updated;
        });
      },
      locationfound(e) {
        setCenter([e.latlng.lat, e.latlng.lng]);
        map.flyTo(e.latlng, map.getZoom());
      },
    });
    return null;
  };

  const updatePoint = (polyIdx, ptIdx, newLatLng) => {
    setPolygons(prev => {
      const updated = [...prev];
      const current = { ...updated[polyIdx] };
      current.points = [...current.points];
      current.points[ptIdx] = newLatLng;
      current.area = calculateArea(current.points);
      updated[polyIdx] = current;
      return updated;
    });
  };

  // ── Controls ─────────────────────────────────────────────────
  const startDrawing = () => setIsDrawing(true);
  const stopDrawing = () => setIsDrawing(false);

  const addNewPlot = () => {
    const nextNum = polygons.length + 1;
    const newPolygons = [...polygons, { points: [], color: COLORS[nextNum % COLORS.length].value, label: `Plot ${nextNum}`, area: null }];
    setPolygons(newPolygons);
    setActiveIndex(newPolygons.length - 1);
    setIsDrawing(true);
  };

  const deletePlot = (idx) => {
    if (polygons.length === 1) {
      setPolygons([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
      return;
    }
    const filtered = polygons.filter((_, i) => i !== idx);
    setPolygons(filtered);
    setActiveIndex(Math.max(0, idx - 1));
  };

  const resetAll = () => {
    if (window.confirm('Are you sure you want to clear all plots?')) {
      setPolygons([{ points: [], color: '#c9a84c', label: 'Plot 1', area: null }]);
      setActiveIndex(0);
      setIsDrawing(false);
    }
  };

  const undoLastPoint = () => {
    setPolygons(prev => {
      const updated = [...prev];
      const current = { ...updated[activeIndex] };
      if (current.points.length === 0) return prev;
      current.points = current.points.slice(0, -1);
      current.area = calculateArea(current.points);
      updated[activeIndex] = current;
      return updated;
    });
  };

  const updatePlotField = (idx, field, value) => {
    setPolygons(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const getLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        if (mapRef.current) {
          mapRef.current.flyTo(loc, 18, { duration: 1.5 });
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Location access denied.');
      },
      { enableHighAccuracy: true }
    );
  };

  const cycleTile = () => {
    const order = ['satellite', 'hybrid', 'road'];
    setTileMode(cur => order[(order.indexOf(cur) + 1) % order.length]);
  };

  // ── Share & Save ──────────────────────────────────────────────
  const handleSaveAndShare = async () => {
    if (polygons.some(p => p.points.length < 3)) {
      return toast.warn('All plots must have at least 3 points.');
    }
    
    setSaving(true);
    try {
      // Capture Thumbnail
      let thumbnail = null;
      try {
        const canvas = await html2canvas(document.querySelector('.leaflet-container'), {
          useCORS: true,
          scale: 0.5, // Small thumbnail
          logging: false
        });
        thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      } catch (err) {
        console.error('Failed to capture thumbnail:', err);
      }

      const mapState = {
        title: 'Land Plot Boundary Map',
        shareId: editId || undefined, // Keep same ID if editing
        thumbnail,
        polygons: polygons.map(p => ({
          points: p.points.map(pt => ({ lat: pt.lat, lng: pt.lng })),
          color: p.color,
          label: p.label,
          area: p.area
        })),
        center: { lat: mapRef.current.getCenter().lat, lng: mapRef.current.getCenter().lng },
        zoom: mapRef.current.getZoom(),
        tileMode
      };

      const res = await axios.post('/api/maps', mapState);
      if (res.data.success) {
        const url = `${window.location.origin}/m/${res.data.data.shareId}`;
        setShareUrl(url);
        
        if (!res.data.data.createdBy) {
          toast.info('Guest link generated! Note: This link will expire in 24 hours. Login to save permanently.', {
            autoClose: 10000
          });
        } else {
          toast.success('Map saved permanently to your account!');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save map. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── KML export ───────────────────────────────────────────────
  const exportKML = () => {
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document><name>Land Plots — Splus Properties</name>`;
    
    polygons.forEach(p => {
      if (p.points.length < 3) return;
      const coords = [...p.points, p.points[0]].map(pt => `${pt.lng},${pt.lat},0`).join(' ');
      kmlContent += `\n<Placemark><name>${p.label}</name><Style><PolyStyle><color>7f${p.color.replace('#', '').split('').reverse().join('')}</color></PolyStyle></Style><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`;
    });

    kmlContent += `\n</Document>\n</kml>`;
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'land-plots.kml'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF export ───────────────────────────────────────────────
  const exportPDF = async () => {
    const mapElement = document.querySelector('.leaflet-container');
    if (!mapElement) return toast.error('Map not found');

    const loadingToast = toast.loading('Generating professional report...');
    
    try {
      // Capture map screenshot with high resolution
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        scale: 2,
        logging: false,
        allowTaint: false, // Set to false to try and respect CORS better if possible
        backgroundColor: '#1a2340',
        ignoreElements: (el) => el.classList.contains('leaflet-control-container') || el.classList.contains('drawing-handle')
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const doc  = new jsPDF();
      const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      // Header Banner
      doc.setFillColor(26, 35, 64);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Branding
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('Splus Properties', 105, 22, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.setFont('helvetica', 'normal');
      doc.text('PREMIUM LAND MAPPING SOLUTIONS', 105, 30, { align: 'center', charSpace: 2 });

      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('Multi-Plot Boundary Report', 105, 38, { align: 'center' });

      // Map Image Section with Gold Border
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(1.5);
      doc.rect(14, 54, 182, 102, 'D'); // Outer border
      doc.addImage(imgData, 'JPEG', 15, 55, 180, 100);

      // Property Breakdown Header
      doc.setTextColor(26, 35, 64);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Breakdown', 20, 175);
      doc.setDrawColor(26, 35, 64);
      doc.setLineWidth(0.5);
      doc.line(20, 178, 80, 178);

      // Table Headers
      let yPos = 188;
      doc.setFillColor(248, 245, 238);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(26, 35, 64, 0.6);
      doc.text('PLOT NAME', 25, yPos);
      doc.text('ACRES', 80, yPos);
      doc.text('SQ FT', 120, yPos);
      doc.text('SQ YARDS', 160, yPos);
      
      yPos += 10;

      // Table Rows
      polygons.forEach((p, i) => {
        if (!p.area) return;
        if (yPos > 270) { doc.addPage(); yPos = 20; }

        doc.setTextColor(26, 35, 64);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(p.label, 25, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`${p.area.acres} ac`, 80, yPos);
        doc.text(`${p.area.sqft}`, 120, yPos);
        doc.text(`${p.area.sqyd}`, 160, yPos);
        
        // Bullet point with plot color
        doc.setFillColor(p.color);
        doc.circle(22, yPos - 1, 1, 'F');

        yPos += 8;
      });

      // Total Calculation
      const totalAcres = polygons.reduce((acc, p) => acc + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
      yPos += 5;
      doc.setDrawColor(230);
      doc.line(20, yPos - 5, 190, yPos - 5);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL MEASUREMENT: ${totalAcres} ACRES`, 105, yPos + 5, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`© ${new Date().getFullYear()} Splus Properties · This report is for boundary visualization purposes only.`, 105, 288, { align: 'center' });
      doc.text(`Report Generated on ${date}`, 105, 292, { align: 'center' });

      doc.save(`Splus-Boundary-Report-${Date.now()}.pdf`);
      toast.update(loadingToast, { render: 'Report downloaded successfully!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.update(loadingToast, { render: 'Failed to generate report', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  // ── Panel drag ───────────────────────────────
  const onPanelMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const onMove = (ev) => {
      const nx = ev.clientX - startX;
      const ny = ev.clientY - startY;
      setPanelPos({ x: nx, y: ny });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const panelStyle = panelPos.x !== null
    ? { position: 'absolute', left: panelPos.x, top: panelPos.y, right: 'auto' }
    : { position: 'absolute', right: 24,        top: panelPos.y };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <style>{`
        .gold-marker { pointer-events: auto !important; z-index: 1000 !important; }
        .gold-marker > div { cursor: grab !important; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .gold-marker > div:active { cursor: grabbing !important; transform: scale(0.9) !important; }
        .custom-tooltip { background: rgba(26, 35, 64, 0.95) !important; border: 1px solid rgba(201, 168, 76, 0.3) !important; border-radius: 8px !important; color: white !important; font-weight: 800 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }
        .custom-tooltip::before { border-top-color: rgba(26, 35, 64, 0.95) !important; }
      `}</style>

      {/* ── Map ── */}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100vh', width: '100vw' }}
        ref={mapRef}
        zoomControl={false}
        dragging={!isDrawing}
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
                  weight: activeIndex === pIdx ? 4 : 2, 
                  opacity: 1, 
                  fillColor: poly.color, 
                  fillOpacity: activeIndex === pIdx ? 0.3 : 0.15,
                  dashArray: activeIndex === pIdx && isDrawing ? '5, 10' : ''
                }}
                eventHandlers={{
                  click: () => setActiveIndex(pIdx)
                }}
              >
                {!isDrawing && poly.area && (
                  <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="custom-tooltip">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] opacity-70 mb-0.5">{poly.label}</span>
                      <span style={{ color: poly.color }}>
                        {unit === 'acres' ? `${poly.area?.acres} ac` : `${poly.area?.sqft} ft²`}
                      </span>
                    </div>
                  </Tooltip>
                )}
                <Popup>
                  <div className="text-center font-bold text-[#1a2340]">
                    <div className="text-lg">{poly.label}</div>
                    <div className="text-[#c9a84c]">{unit === 'acres' ? `${poly.area?.acres} Acres` : `${poly.area?.sqft} Sq Ft`}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {unit === 'acres' ? `${poly.area?.sqft} Sq Ft` : `${poly.area?.acres} Acres`}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            )}
            {/* Draggable handles for active polygon */}
            {activeIndex === pIdx && poly.points.map((pt, ptIdx) => (
              <Marker
                key={`${pIdx}-${ptIdx}`}
                position={pt}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    updatePoint(pIdx, ptIdx, position);
                  }
                }}
                icon={L.divIcon({
                  className: 'drawing-handle',
                  html: `<div style="background: ${poly.color}; width: 12px; height: 12px; border-radius: 50%;"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              />
            ))}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* ── Top Bar: Branding & Search ── */}
      <div className="absolute top-0 left-0 z-[1000] pointer-events-none w-full p-2 sm:p-6 flex flex-col gap-3 items-stretch sm:items-start sm:flex-row">
        {/* Branding Link */}
        <Link 
          to="/" 
          className="bg-[#1a2340]/95 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/5 pointer-events-auto transition-all hover:border-[#c9a84c]/40 active:scale-95 group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] group-hover:bg-[#c9a84c] group-hover:text-[#1a2340] transition-all">
            <ArrowRight size={18} className="rotate-180" />
          </div>
          <div className="hidden sm:block">
            <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5">Splus Properties</div>
            <div className="text-[#c9a84c] text-[10px] font-bold flex items-center gap-1.5">
              Back to Website <ChevronRight size={10} className="opacity-50" />
            </div>
          </div>
          <div className="sm:hidden text-white text-[10px] font-black uppercase tracking-widest">Home</div>
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch}
          className="bg-[#1a2340]/90 backdrop-blur-xl p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/5 pointer-events-auto flex items-center flex-1 max-w-full sm:max-w-md transition-all hover:border-white/10"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white/40">
            <Search size={16} />
          </div>
          <input 
            type="text"
            placeholder="Search village, city, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-transparent border-none text-xs font-bold text-white placeholder:text-white/20 outline-none focus:ring-0 px-1"
          />
          <button 
            type="submit"
            disabled={searchLoading}
            className="px-6 py-2.5 bg-[#c9a84c] hover:bg-[#b8943e] text-[#1a2340] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {searchLoading ? 'Searching...' : 'Find'}
          </button>
        </form>
      </div>

      {/* ── Status Bar & Open Mapper ── */}
      <div className="absolute top-[140px] sm:top-6 right-2 sm:right-6 z-[1000] pointer-events-none flex flex-col items-end gap-3">
        {!showPanel && (
          <button 
            onClick={() => setShowPanel(true)}
            className="bg-[#1a2340]/95 backdrop-blur-xl px-5 py-4 flex items-center gap-4 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto transition-all hover:bg-[#c9a84c] group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] group-hover:bg-[#1a2340] group-hover:text-white transition-all">
              <Map size={20} />
            </div>
            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-[#1a2340] hidden sm:block">Open Mapper</span>
          </button>
        )}

        <div className="bg-[#1a2340]/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-2.5 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse shadow-[0_0_10px_#c9a84c]" />
          <span className="text-white/60 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
            {isDrawing ? `Drawing Plot ${activeIndex + 1}` : 'System Active'}
          </span>
        </div>
      </div>

      {/* ── Quick map controls ── */}
      <div className="absolute bottom-24 sm:bottom-32 left-4 sm:left-8 z-[999] flex flex-col gap-3">
        <button onClick={getLocation} title="GPS My Location" className={`w-12 h-12 sm:w-14 sm:h-14 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 ${loading ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-[#1a2340]/95 text-[#c9a84c]'}`}>
          {loading ? <div className="w-5 h-5 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" /> : <Navigation size={20} />}
        </button>
        <div className="relative">
          <select 
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="appearance-none w-12 h-12 sm:w-14 sm:h-14 bg-[#1a2340]/95 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shadow-2xl hover:scale-105 active:scale-95 transition-all font-black text-[10px] text-center cursor-pointer outline-none"
          >
            <option value="acres" className="bg-[#1a2340] text-white">AC</option>
            <option value="sqft" className="bg-[#1a2340] text-white">FT²</option>
            <option value="sqyd" className="bg-[#1a2340] text-white">YD²</option>
          </select>
        </div>
        <button onClick={cycleTile} title="Switch Layers" className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1a2340]/95 hover:bg-[#1a2340] backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-[#c9a84c] transition-all shadow-2xl hover:scale-105 active:scale-95">
          <Layers size={20} />
        </button>
      </div>

      {/* ── Panel ── */}
      {showPanel && (
        <div
          ref={panelRef}
          style={{ ...panelStyle, zIndex: 1000, width: 320 }}
          className="bg-[#1a2340]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div onMouseDown={onPanelMouseDown} className="flex items-center justify-between px-6 py-5 bg-[#1a2340] border-b border-white/5 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c]">
                <Ruler size={16} />
              </div>
              <span className="text-white text-xs font-black uppercase tracking-widest">Plot Mapping</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
                {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
              
              {/* ── Plots List ── */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Managed Plots</label>
                {polygons.map((poly, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveIndex(idx)}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeIndex === idx 
                        ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30 shadow-lg' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ background: poly.color }} />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          value={poly.label} 
                          onChange={(e) => updatePlotField(idx, 'label', e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-white outline-none focus:ring-0"
                          placeholder="Plot Name..."
                        />
                        <div className="text-[10px] font-medium text-white/40 mt-0.5">
                          {poly.area 
                            ? (unit === 'acres' ? `${poly.area.acres} acres` : `${poly.area.sqft} sq ft`)
                            : 'Draw boundary on map'
                          }
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePlot(idx); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-white/20 hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {activeIndex === idx && (
                      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                         {COLORS.map(c => (
                           <button 
                             key={c.value} 
                             onClick={() => updatePlotField(idx, 'color', c.value)}
                             className={`w-5 h-5 rounded-full border-2 shrink-0 transition-transform hover:scale-125 ${poly.color === c.value ? 'border-white' : 'border-transparent'}`}
                             style={{ background: c.value }}
                           />
                         ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <button 
                  onClick={addNewPlot}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 text-white/30 hover:text-[#c9a84c] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add New Plot
                </button>
              </div>

              {/* ── Main Controls ── */}
              <div className="pt-2 grid grid-cols-6 gap-2">
                <button
                  onClick={isDrawing ? stopDrawing : startDrawing}
                  className={`col-span-3 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isDrawing ? 'bg-red-500 text-white animate-pulse' : 'bg-[#c9a84c] text-[#1a2340] hover:scale-[1.02]'
                  }`}
                >
                  {isDrawing ? <><StopCircle size={14} /> Stop</> : <><PenLine size={14} /> Draw</>}
                </button>
                <button 
                  onClick={getLocation} 
                  title="My Location" 
                  className={`col-span-1 rounded-2xl flex items-center justify-center transition-all border border-white/5 ${loading ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}
                >
                  {loading ? <div className="w-3 h-3 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" /> : <Navigation size={16} />}
                </button>
                <button onClick={undoLastPoint} title="Undo Point" className="col-span-1 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/60 transition-all border border-white/5">
                  <RotateCcw size={16} />
                </button>
                <button onClick={resetAll} title="Clear All" className="col-span-1 bg-white/5 hover:bg-red-500/20 rounded-2xl flex items-center justify-center text-white/40 hover:text-red-400 transition-all border border-white/5">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* ── Save & Export ── */}
              <div className="space-y-2.5 pt-2">
                <button 
                  onClick={handleSaveAndShare}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#c9a84c]/50 text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 size={16} className="text-[#c9a84c] group-hover:scale-110 transition-transform" />}
                  Save & Generate Link
                </button>
                
                <div className="grid grid-cols-1 gap-2">
                   <button onClick={exportPDF} className="py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                     <FileText size={14} className="text-[#c9a84c] group-hover:scale-110 transition-transform" /> PDF Property Report
                   </button>
                </div>
              </div>

              {/* ── Share Modal (Inline) ── */}
              {shareUrl && (
                <div className="bg-[#c9a84c] rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                   <div className="text-[#1a2340] text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                     Shareable Link Ready
                     <button onClick={() => setShareUrl(null)}><X size={12} /></button>
                   </div>
                   <div className="flex gap-2">
                     <input readOnly value={shareUrl} className="flex-1 bg-white/20 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-[#1a2340] outline-none" />
                     <button 
                       onClick={() => { navigator.clipboard.writeText(shareUrl); toast.info('Link copied!'); }}
                       className="p-2 bg-[#1a2340] text-[#c9a84c] rounded-xl hover:scale-105 transition-all"
                     >
                       <Copy size={12} />
                     </button>
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}


      {/* ── Draw Indicator ── */}
      {isDrawing && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <div className="bg-[#c9a84c] text-[#1a2340] text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-pulse border border-[#1a2340]/10">
            <PenLine size={14} /> Mark points for {polygons[activeIndex].label}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundaryMap;