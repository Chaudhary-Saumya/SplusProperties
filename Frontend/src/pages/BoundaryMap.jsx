import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';
import {
  MapPin, Ruler, Download, RotateCcw, Crosshair, Satellite,
  Target, X, Map, GripHorizontal, ChevronRight, Building2,
  FileText, Maximize2, Minimize2, Trash2, PenLine, StopCircle,
  AreaChart, Navigation, Layers
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

const BoundaryMap = () => {
  const [center,         setCenter]         = useState([28.6139, 77.2090]);
  const [polyPoints,     setPolyPoints]     = useState([]);
  const [area,           setArea]           = useState(null);
  const [isDrawing,      setIsDrawing]      = useState(false);
  const [tileMode,       setTileMode]       = useState('satellite');
  const [showPanel,      setShowPanel]      = useState(true);
  const [loading,        setLoading]        = useState(false);
  const [perimeter,      setPerimeter]      = useState(null);
  const [pointCount,     setPointCount]     = useState(0);
  const [undoStack,      setUndoStack]      = useState([]);
  const [collapsed,      setCollapsed]      = useState(false);
  const [panelPos,       setPanelPos]       = useState({ x: null, y: 24 });

  const mapRef       = useRef();
  const drawingRef   = useRef([]);
  const panelRef     = useRef();
  const dragState    = useRef(null);

  // ── Area + perimeter calculation ─────────────────────────────
  const calculateMetrics = (points) => {
    try {
      if (points.length < 3) { 
        setArea(null); 
        setPerimeter(null); 
        return; 
      }
      const coords = points.map(p => [p.lng, p.lat]);
      coords.push(coords[0]);
      const polygon   = turf.polygon([coords]);
      const line      = turf.lineString(coords);
      const sqMeters  = turf.area(polygon);
      const perimM    = turf.length(line, { units: 'meters' });

      setArea({
        sqm:   Math.round(sqMeters).toLocaleString('en-IN'),
        sqft:  Math.round(sqMeters * 10.76391).toLocaleString('en-IN'),
        sqyd:  Math.round(sqMeters * 1.19599).toLocaleString('en-IN'),
        acres: (sqMeters / 4046.86).toLocaleString('en-IN', { maximumFractionDigits: 3 }),
      });
      setPerimeter({
        m:  Math.round(perimM).toLocaleString('en-IN'),
        ft: Math.round(perimM * 3.28084).toLocaleString('en-IN'),
      });
    } catch (err) {
      console.error('Metrics error:', err);
    }
  };

  // ── Map event handler component (click to add points) ────────
  const MapEvents = () => {
    const map = useMap();
    useMapEvents({
      click(e) {
        if (!isDrawing) return;
        const point   = e.latlng;
        const newPts  = [...drawingRef.current, point];
        drawingRef.current = newPts;
        setPolyPoints([...newPts]);
        setPointCount(newPts.length);
        setUndoStack(prev => [...prev, point]);
        if (newPts.length >= 3) calculateMetrics(newPts);
      },
      locationfound(e) {
        setCenter([e.latlng.lat, e.latlng.lng]);
        map.setView(e.latlng, 17);
        setLoading(false);
      },
    });
    return null;
  };

  // ── Controls ─────────────────────────────────────────────────
  const startDrawing = () => {
    drawingRef.current = [];
    setPolyPoints([]);
    setArea(null);
    setPerimeter(null);
    setPointCount(0);
    setUndoStack([]);
    setIsDrawing(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const resetDrawing = () => {
    drawingRef.current = [];
    setPolyPoints([]);
    setArea(null);
    setPerimeter(null);
    setPointCount(0);
    setUndoStack([]);
    setIsDrawing(false);
  };

  const undoLastPoint = () => {
    if (drawingRef.current.length === 0) return;
    const newPts = drawingRef.current.slice(0, -1);
    drawingRef.current = newPts;
    setPolyPoints([...newPts]);
    setPointCount(newPts.length);
    setUndoStack(prev => prev.slice(0, -1));
    if (newPts.length >= 3) calculateMetrics(newPts);
    else { setArea(null); setPerimeter(null); }
  };

  const getLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setCenter(loc);
        if (mapRef.current) mapRef.current.setView(loc, 18);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const cycleTile = () => {
    const order = ['satellite', 'hybrid', 'road'];
    setTileMode(cur => order[(order.indexOf(cur) + 1) % order.length]);
  };

  // ── KML export ───────────────────────────────────────────────
  const exportKML = () => {
    if (polyPoints.length < 3) return alert('Draw at least 3 points first.');
    const coords = [...polyPoints, polyPoints[0]].map(p => `${p.lng},${p.lat},0`).join(' ');
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document><name>Land Plot — Splus Properties</name><Placemark><name>Measured Plot</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document>
</kml>`;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'land-plot.kml'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF export ───────────────────────────────────────────────
  const exportPDF = () => {
    if (!area) return alert('Measure a plot first.');
    const doc  = new jsPDF();
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFillColor(26, 35, 64);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Splus Properties', 105, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('Land Plot Measurement Report', 105, 30, { align: 'center' });

    doc.setTextColor(26, 35, 64);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Measured Area', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const rows = [
      ['Square Feet',   area.sqft  + ' sq ft'],
      ['Square Yards',  area.sqyd  + ' sq yd'],
      ['Square Metres', area.sqm   + ' sq m'],
      ['Acres',         area.acres + ' acres'],
      ['Perimeter (m)', (perimeter?.m  || '—') + ' m'],
      ['Perimeter (ft)',(perimeter?.ft || '—') + ' ft'],
      ['No. of Points', String(polyPoints.length)],
    ];
    rows.forEach(([label, val], i) => {
      const y = 72 + i * 12;
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 238 : 255);
      doc.rect(15, y - 7, 180, 11, 'F');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 190, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated on ${date} · Splus Properties Boundary Map Tool`, 105, 285, { align: 'center' });

    doc.save('splus-land-plot.pdf');
  };

  // ── Panel drag (mouse + touch) ───────────────────────────────
  const onPanelMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    e.preventDefault();
    const panel    = panelRef.current;
    const rect     = panel.getBoundingClientRect();
    const startX   = e.clientX - rect.left;
    const startY   = e.clientY - rect.top;

    const onMove = (ev) => {
      const nx = ev.clientX - startX;
      const ny = ev.clientY - startY;
      const maxX = window.innerWidth  - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      setPanelPos({ x: Math.max(0, Math.min(nx, maxX)), y: Math.max(0, Math.min(ny, maxY)) });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  };

  // ── Render ───────────────────────────────────────────────────
  const panelStyle = panelPos.x !== null
    ? { position: 'absolute', left: panelPos.x, top: panelPos.y, right: 'auto' }
    : { position: 'absolute', right: 24,        top: panelPos.y };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <style>{`
        .gold-marker {
          pointer-events: auto !important;
          z-index: 1000 !important;
        }
        .gold-marker > div {
          pointer-events: auto !important;
          cursor: grab !important;
        }
        .gold-marker > div:active {
          cursor: grabbing !important;
        }
        .leaflet-marker-draggable {
          cursor: move !important;
        }
        .leaflet-drag-target {
          cursor: grabbing !important;
        }
      `}</style>

      {/* ── Map ── */}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100vh', width: '100vw' }}
        ref={mapRef}
        zoomControl={false}
        dragging={!isDrawing}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} />
        <MapEvents />

        {/* Draggable Point Markers */}
        {polyPoints.map((point, i) => (
          <Marker 
            key={`marker-${i}`}
            position={[point.lat, point.lng]} 
            icon={goldIcon}
            draggable={!isDrawing}
            autoPan={false}
            riseOnHover={true}
            zIndexOffset={1000}
            eventHandlers={{
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                const updatedPoints = [...polyPoints];
                updatedPoints[i] = latlng;
                
                // Update both state and ref
                setPolyPoints(updatedPoints);
                drawingRef.current = updatedPoints;
                
                // Recalculate area + perimeter instantly
                if (updatedPoints.length >= 3) {
                  calculateMetrics(updatedPoints);
                } else {
                  setArea(null);
                  setPerimeter(null);
                }
              }
            }}
          >
            <Popup>
              <div className="text-center text-xs font-bold text-[#1a2340]">
                Point {i + 1}<br />
                <span className="text-[#c9a84c] font-black">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </span>
                <div className="text-[10px] text-[#c9a84c]/70 mt-2">
                  Drag to move
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Polygon */}
        {polyPoints.length >= 3 && (
          <Polygon
            positions={polyPoints}
            pathOptions={{ 
              color: '#c9a84c', 
              weight: 3, 
              opacity: 1, 
              fillColor: '#1a2340', 
              fillOpacity: 0.18 
            }}
          >
            <Popup>
              <div className="text-center text-xs font-bold text-[#1a2340] space-y-1">
                <div className="text-[#c9a84c] font-black text-base">{area?.acres} acres</div>
                <div>{area?.sqft} sq ft</div>
                <div className="text-[#1a2340]/50">Perimeter: {perimeter?.m} m</div>
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>

      {/* ── Top-left branding strip ── */}
      <div className="absolute top-0 left-0 z-[998] pointer-events-none">
        <div className="bg-[#1a2340]/90 backdrop-blur-sm px-5 py-3 flex items-center gap-2 rounded-br-2xl">
          <Building2 size={14} className="text-[#c9a84c]" />
          <span className="text-white text-xs font-black uppercase tracking-[0.2em]">Splus Properties</span>
          <ChevronRight size={10} className="text-white/30" />
          <span className="text-[#c9a84c] text-xs font-bold">Boundary Map</span>
        </div>
      </div>

      {/* ── Quick map controls (bottom-left) ── */}
      <div className="absolute bottom-8 left-6 z-[999] flex flex-col gap-2">
        <button
          onClick={cycleTile}
          title="Toggle Map Layer"
          className="w-11 h-11 bg-[#1a2340]/90 hover:bg-[#1a2340] backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center text-[#c9a84c] transition-all shadow-lg"
        >
          <Layers size={18} />
        </button>
        <button
          onClick={getLocation}
          title="Center on my GPS"
          className={`w-11 h-11 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center transition-all shadow-lg ${loading ? 'bg-[#c9a84c] text-[#1a2340]' : 'bg-[#1a2340]/90 hover:bg-[#1a2340] text-[#c9a84c]'}`}
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-[#1a2340] border-t-transparent rounded-full animate-spin" />
            : <Navigation size={18} />}
        </button>
      </div>

      {/* ── Drawing cursor indicator ── */}
      {isDrawing && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <div className="bg-[#c9a84c] text-[#1a2340] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <PenLine size={12} /> Click map to add points · {pointCount} point{pointCount !== 1 ? 's' : ''} placed
          </div>
        </div>
      )}

      {/* ── Floating panel ── */}
      {showPanel && (
        <div
          ref={panelRef}
          style={{ ...panelStyle, zIndex: 1000, width: 300 }}
          className="bg-[#1a2340]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden select-none"
        >
          {/* Drag handle / header */}
          <div
            onMouseDown={onPanelMouseDown}
            className="flex items-center justify-between px-5 py-3.5 bg-[#1a2340] border-b border-white/10 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal size={14} className="text-white/30" />
              <Ruler size={14} className="text-[#c9a84c]" />
              <span className="text-white text-xs font-black uppercase tracking-widest">Plot Measurement</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCollapsed(c => !c)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-white"
              >
                {collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-red-400"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="p-4 space-y-3">

              {/* ── Metrics display ── */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                {/* Primary metric */}
                <div className="text-center">
                  <div className="text-2xl font-black text-[#c9a84c]">
                    {area ? area.acres : '—'} <span className="text-sm font-bold text-white/50">acres</span>
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-0.5">Measured Area</div>
                </div>

                {/* Secondary metrics grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Sq Ft',  val: area?.sqft  || '—' },
                    { label: 'Sq Yd',  val: area?.sqyd  || '—' },
                    { label: 'Sq M',   val: area?.sqm   || '—' },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-white text-xs font-black truncate">{val}</div>
                      <div className="text-white/30 text-[9px] uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Perimeter */}
                {perimeter && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Perimeter</span>
                    <span className="text-white text-xs font-black">{perimeter.m} m <span className="text-white/30">/ {perimeter.ft} ft</span></span>
                  </div>
                )}

                {/* Point count */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Points</span>
                  <span className={`text-xs font-black ${pointCount > 0 ? 'text-[#c9a84c]' : 'text-white/30'}`}>{pointCount}</span>
                </div>

                {/* NEW: Drag hint */}
                {polyPoints.length > 0 && !isDrawing && (
                  <div className="text-center text-[10px] text-[#c9a84c] bg-white/10 rounded-lg py-2 px-3 flex items-center justify-center gap-1">
                    <span className="text-base">✦</span>
                    Drag any gold marker on the map to adjust boundary precisely
                  </div>
                )}
              </div>

              {/* ── Map layer switcher ── */}
              <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
                {Object.entries(TILES).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setTileMode(key)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      tileMode === key
                        ? 'bg-[#c9a84c] text-[#1a2340]'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Primary draw controls ── */}
              <div className="flex gap-2">
                <button
                  onClick={isDrawing ? stopDrawing : startDrawing}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                    isDrawing
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[#c9a84c] hover:bg-[#b8943e] text-[#1a2340]'
                  }`}
                >
                  {isDrawing ? <><StopCircle size={13} /> Stop</> : <><PenLine size={13} /> Draw</>}
                </button>
                <button
                  onClick={undoLastPoint}
                  disabled={polyPoints.length === 0}
                  title="Undo last point"
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white disabled:opacity-20 transition-all"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={resetDrawing}
                  disabled={polyPoints.length === 0}
                  title="Clear all"
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-red-300 disabled:opacity-20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* ── GPS button ── */}
              <button
                onClick={getLocation}
                className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                  loading
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c]/30 text-[#c9a84c]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {loading
                  ? <><div className="w-3 h-3 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /> Detecting...</>
                  : <><Navigation size={13} /> GPS Centre</>
                }
              </button>

              {/* ── Export buttons ── */}
              {area && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={exportKML}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg"
                  >
                    <Download size={13} /> KML
                  </button>
                  <button
                    onClick={exportPDF}
                    className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-white/10"
                  >
                    <FileText size={13} /> PDF
                  </button>
                </div>
              )}

              {/* ── How to use hint ── */}
              {!isDrawing && polyPoints.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Press <span className="text-[#c9a84c]">Draw</span> then click on the map<br />to mark your plot boundary
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── Reopen button ── */}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute top-16 right-6 z-[1000] bg-[#1a2340]/90 hover:bg-[#1a2340] backdrop-blur-sm border border-white/10 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-2 text-[#c9a84c] font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
          title="Show Measurement Panel"
        >
          <Ruler size={15} /> Measure
        </button>
      )}
    </div>
  );
};

export default BoundaryMap;