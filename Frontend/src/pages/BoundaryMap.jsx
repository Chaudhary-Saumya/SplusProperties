import React, { useState, useRef, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MapPin, Ruler, Download, RotateCcw, Satellite,
  Target, X, Map, FileText, Maximize2, Trash2, PenLine,
  AreaChart, Navigation, Layers, Plus, Share2, Copy, Check,
  ExternalLink, Search, ArrowRight, ArrowLeft,
  CheckCircle2, Info, LandPlot, SlidersHorizontal, Globe, Sparkles
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { getWebsiteBaseUrl } from '../utils/url';
import { savePdfCrossPlatform } from '../utils/pdfDownloader';
import ConfirmModal from '../components/ConfirmModal';

// Leaflet marker default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' },
  hybrid: { url: 'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', label: 'Hybrid' },
  road: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Road Map' },
};

const COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Slate', value: '#334155' },
];

const MapZoomTracker = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });
  return null;
};

const BoundaryMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { t, language, toggleLanguage } = useLanguage();
  const { user, updateUserCoins } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      axios.post('/api/rewards/claim-task', { taskId: 'LAND_MAP_USED' })
        .then(res => {
          if (res.data?.success) {
            toast.success('+20 Coins (₹1.00) added to your Rewards Wallet for using Land Measure Map!');
            if (updateUserCoins && res.data.newBalance !== undefined) {
              updateUserCoins(res.data.newBalance);
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const [center, setCenter] = useState([28.6139, 77.2090]);
  const [polygons, setPolygons] = useState([{ points: [], color: '#2563eb', label: 'Plot 1', area: null }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unit, setUnit] = useState('sqft');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tileMode, setTileMode] = useState('hybrid');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(18);
  const [shareUrl, setShareUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const [sheetState, setSheetState] = useState('peek');
  const [activeTab, setActiveTab] = useState('plots');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSlide, setTutorialSlide] = useState(0);

  const mapRef = useRef();
  const sheetRef = useRef();
  const dragHandleRef = useRef(null);
  const dragStart = useRef(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenMapTour');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  // ── Auto Restore Map Draft from localStorage ────────────────────────
  useEffect(() => {
    if (editId) return;
    try {
      const savedDraft = localStorage.getItem('boundary_map_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed?.polygons?.length > 0 && parsed.polygons.some(p => p.points?.length > 0)) {
          setPolygons(parsed.polygons);
          if (parsed.unit) setUnit(parsed.unit);
          if (parsed.tileMode) setTileMode(parsed.tileMode);
          if (parsed.center) setCenter(parsed.center);
          toast.info('Restored your mapped properties draft', { autoClose: 3000 });
        }
      }
    } catch (e) {
      console.error('Failed to restore map draft:', e);
    }
  }, [editId]);

  // ── Auto Save Map Draft to localStorage ────────────────────────────
  useEffect(() => {
    if (editId || loading) return;
    const hasPoints = polygons.some(p => p.points?.length > 0);
    if (hasPoints) {
      const draft = { polygons, unit, tileMode, center };
      localStorage.setItem('boundary_map_draft', JSON.stringify(draft));
    }
  }, [polygons, unit, tileMode, center, editId, loading]);

  // ── Prevent Browser Pull-To-Refresh on Sheet Drag Handle ──────────
  useEffect(() => {
    const handleEl = dragHandleRef.current;
    if (!handleEl) return;

    const preventPullToRefresh = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    handleEl.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    return () => {
      handleEl.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  useEffect(() => {
    if (editId) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setCenter(loc);
        if (mapRef.current) mapRef.current.flyTo(loc, 18, { duration: 1.5 });
      },
      () => { },
      { enableHighAccuracy: true }
    );
  }, [editId]);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenMapTour', 'true');
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setSheetState('full');
    }
  }, [isDesktop]);

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
    } catch {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const calculateArea = (points) => {
    try {
      if (points.length < 3) return null;
      const coords = points.map(p => [p.lng, p.lat]);
      coords.push(coords[0]);
      const poly = turf.polygon([coords]);
      const sqm = turf.area(poly);
      return {
        sqm: Math.round(sqm).toLocaleString('en-IN'),
        sqft: Math.round(sqm * 10.76391).toLocaleString('en-IN'),
        sqyd: Math.round(sqm * 1.19599).toLocaleString('en-IN'),
        acres: (sqm / 4046.86).toLocaleString('en-IN', { maximumFractionDigits: 3 }),
      };
    } catch {
      return null;
    }
  };

  const formatPolyArea = (polyArea, unitVal) => {
    if (!polyArea) return '';
    if (unitVal === 'acres') return `${polyArea.acres || '0'} ac`;
    if (unitVal === 'sqyd') {
      if (polyArea.sqyd) return `${polyArea.sqyd} sq.yd`;
      const sqftVal = parseFloat(polyArea.sqft?.replace(/,/g, '') || 0);
      if (sqftVal > 0) return `${Math.round(sqftVal / 9).toLocaleString('en-IN')} sq.yd`;
      const sqmVal = parseFloat(polyArea.sqm?.replace(/,/g, '') || 0);
      if (sqmVal > 0) return `${Math.round(sqmVal * 1.19599).toLocaleString('en-IN')} sq.yd`;
      return '0 sq.yd';
    }
    return `${polyArea.sqft || '0'} sq.ft`;
  };

  const addPointAtCenter = () => {
    if (!mapRef.current) return;
    const centerLatLng = mapRef.current.getCenter();
    setPolygons(prev => {
      const upd = [...prev];
      const cur = { ...upd[activeIndex] };
      cur.points = [...cur.points, centerLatLng];
      cur.area = calculateArea(cur.points);
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
            html: `<div style="background:rgba(15,23,42,0.88);backdrop-filter:blur(8px);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:900;letter-spacing:0.02em;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.3);transform:translate(-50%, -50%);font-family:monospace;">${labelText}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          })}
        />
      );
    });
  };

  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        if (!isDrawing) return;
        setPolygons(prev => {
          const upd = [...prev];
          const cur = { ...upd[activeIndex] };
          cur.points = [...cur.points, e.latlng];
          cur.area = calculateArea(cur.points);
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
      cur.area = calculateArea(cur.points);
      upd[pIdx] = cur;
      return upd;
    });
  };

  const startDrawing = () => { setIsDrawing(true); setSheetState('peek'); };
  const stopDrawing = () => {
    setIsDrawing(false);
    if (!isDesktop) setSheetState('half');
  };

  const addNewPlot = () => {
    const n = polygons.length + 1;
    const arr = [...polygons, { points: [], color: COLORS[n % COLORS.length].value, label: `Plot ${n}`, area: null }];
    setPolygons(arr);
    setActiveIndex(arr.length - 1);
    setIsDrawing(true);
    setSheetState('peek');
  };

  const deletePlot = (idx) => {
    if (polygons.length === 1) {
      setPolygons([{ points: [], color: '#2563eb', label: 'Plot 1', area: null }]);
      return;
    }
    const f = polygons.filter((_, i) => i !== idx);
    setPolygons(f);
    setActiveIndex(Math.max(0, idx - 1));
  };

  const resetAll = () => {
    setConfirmModal({
      isOpen: true,
      title: t('boundary_map.clear_map') || 'Clear Map Measurements',
      message: t('boundary_map.clear_confirm') || 'Are you sure you want to clear all marked boundary points and polygons?',
      confirmText: 'Clear Map',
      type: 'warning',
      onConfirm: () => {
        setConfirmModal(null);
        setPolygons([{ points: [], color: '#2563eb', label: 'Plot 1', area: null }]);
        setActiveIndex(0);
        setIsDrawing(false);
        localStorage.removeItem('boundary_map_draft');
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const undoLastPoint = () => {
    setPolygons(prev => {
      const upd = [...prev];
      const cur = { ...upd[activeIndex] };
      if (!cur.points.length) return prev;
      cur.points = cur.points.slice(0, -1);
      cur.area = calculateArea(cur.points);
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
      } catch { }

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
        const url = `${getWebsiteBaseUrl()}/m/${res.data.data.shareId}`;
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

  const exportPDF = async () => {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl || !mapRef.current) return toast.error('Map not found');
    const toastId = toast.loading('Generating Executive Survey Report...');

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el, pseudoEl) {
      const style = originalGetComputedStyle(el, pseudoEl);
      return new Proxy(style, {
        get(target, prop) {
          const val = target[prop];
          if (typeof val === 'string' && (val.includes('oklab') || val.includes('oklch'))) {
            return val
              .replace(/oklab\([^)]+\)/g, 'rgb(26, 35, 64)')
              .replace(/oklch\([^)]+\)/g, 'rgb(26, 35, 64)');
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };

    try {
      // 1. Auto Fit Map to Boundary Polygons with generous padding
      const allPoints = [];
      polygons.forEach(p => {
        if (p.points && p.points.length > 0) {
          p.points.forEach(pt => allPoints.push([pt.lat, pt.lng || pt.lon]));
        }
      });

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        mapRef.current.fitBounds(bounds, {
          paddingTopLeft: [50, 50],
          paddingBottomRight: [50, isDesktop ? 50 : 260],
          animate: false,
          maxZoom: 18
        });
      }

      // Allow satellite tiles and markers to render at the fitted zoom
      await new Promise(r => setTimeout(r, 900));

      // 2. Capture Complete Live Leaflet Map (Including Polygon, Markers, and Labels)
      const canvas = await html2canvas(mapEl, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        logging: false,
        backgroundColor: '#0f172a',
        imageTimeout: 20000,
        ignoreElements: (element) => {
          return (
            element.classList.contains('leaflet-control-container') ||
            element.classList.contains('leaflet-popup')
          );
        }
      });

      // 3. Precision Bounding Box Crop around all Demarcated Corners
      const scale = canvas.width / mapEl.clientWidth;
      let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
      let hasValidCoords = false;

      polygons.forEach(poly => {
        if (poly.points && poly.points.length > 0) {
          poly.points.forEach(pt => {
            const cp = mapRef.current.latLngToContainerPoint(L.latLng(pt.lat, pt.lng || pt.lon));
            const px = cp.x * scale;
            const py = cp.y * scale;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
            hasValidCoords = true;
          });
        }
      });

      let croppedCanvas;
      if (hasValidCoords && maxX > minX && maxY > minY) {
        const pad = 50 * scale;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(canvas.width, maxX + pad);
        maxY = Math.min(canvas.height, maxY + pad);

        let plotW = maxX - minX;
        let plotH = maxY - minY;
        const targetRatio = 1.85;
        let cropW, cropH;

        if (plotW / plotH > targetRatio) {
          cropW = plotW;
          cropH = plotW / targetRatio;
        } else {
          cropH = plotH;
          cropW = plotH * targetRatio;
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        let sx = Math.max(0, Math.min(canvas.width - cropW, centerX - cropW / 2));
        let sy = Math.max(0, Math.min(canvas.height - cropH, centerY - cropH / 2));
        cropW = Math.min(cropW, canvas.width - sx);
        cropH = Math.min(cropH, canvas.height - sy);

        croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const cctx = croppedCanvas.getContext('2d');
        cctx.drawImage(canvas, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
      } else {
        croppedCanvas = canvas;
      }

      const imgData = croppedCanvas.toDataURL('image/jpeg', 0.92);

      // 4. Build Comprehensive Survey PDF (A4 Page: 210mm x 297mm)
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const surveyRef = `KP-SRV-${Date.now().toString(36).toUpperCase()}`;

      // ── A. Header Banner ──────────────────────────────────────────
      doc.setFillColor(15, 23, 42); // Deep Obsidian Navy
      doc.rect(0, 0, pageWidth, 36, 'F');

      // Top Gold Line
      doc.setFillColor(201, 168, 76);
      doc.rect(0, 0, pageWidth, 2.5, 'F');

      // Title & Branding
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(19);
      doc.setFont('helvetica', 'bold');
      doc.text('KHARSAN PROPERTIES', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL LAND BOUNDARY & SURVEY DEMARCATION CERTIFICATE', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`REF: ${surveyRef}  |  GPS SURVEY ENGINE  |  SURVEY DATE: ${date}`, pageWidth / 2, 27, { align: 'center' });

      // ── B. Framed Satellite Map Photo ─────────────────────────────
      let yPos = 41;
      const imgWidth = 178;
      const imgHeight = 88;
      const imgX = (pageWidth - imgWidth) / 2;

      // Outer Gold Frame
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.8);
      doc.rect(imgX - 1, yPos - 1, imgWidth + 2, imgHeight + 2);

      doc.addImage(imgData, 'JPEG', imgX, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 3.5;

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text('Figure 1: High-Resolution Satellite Demarcation with Calibrated Corner Identifiers', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;

      // ── C. Section 1: Area Measurement Dashboard ──────────────────
      const primaryPoly = polygons[0] || {};
      const acresNum = parseFloat(primaryPoly.area?.acres?.replace(/,/g, '') || 0);
      const totalAcres = polygons.reduce((a, p) => a + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
      const totalSqft = polygons.reduce((a, p) => a + (parseFloat(p.area?.sqft?.replace(/,/g, '')) || 0), 0);
      const totalSqyd = Math.round(totalSqft / 9);
      const totalGuntha = (parseFloat(totalAcres) * 40).toFixed(2);
      const totalBigha = (parseFloat(totalAcres) * 40 / 23.78).toFixed(2);
      const totalSqm = Math.round(totalSqft * 0.092903);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Area Measurement & Multi-Unit Land Valuation Matrix', 16, yPos);
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.4);
      doc.line(16, yPos + 1.5, 98, yPos + 1.5);
      yPos += 4.5;

      // 6-Box Metric Dashboard (3 columns x 2 rows)
      const cardW = 56.6;
      const cardH = 11;
      const metrics = [
        { label: 'ACRES', val: `${totalAcres} ac`, color: [37, 99, 235] },
        { label: 'GUNTHA (GUTHA)', val: `${totalGuntha} Guntha`, color: [15, 23, 42] },
        { label: 'BIGHA (23.78 GUTHA)', val: `${totalBigha} Bigha`, color: [15, 23, 42] },
        { label: 'SQUARE YARDS (GAJ)', val: `${totalSqyd.toLocaleString('en-IN')} sq.yd`, color: [15, 23, 42] },
        { label: 'SQUARE FEET', val: `${totalSqft.toLocaleString('en-IN')} sq.ft`, color: [15, 23, 42] },
        { label: 'SQUARE METERS', val: `${totalSqm.toLocaleString('en-IN')} sq.m`, color: [15, 23, 42] },
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = 16 + col * (cardW + 4);
        const cy = yPos + row * (cardH + 3);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(cx, cy, cardW, cardH, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, cx + 3.5, cy + 3.8);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.val, cx + 3.5, cy + 8.5);
      });

      yPos += (cardH * 2) + 8;

      // ── D. Section 2: Boundary Perimeter & Dimensions Table ───────
      const activeP = polygons[activeIndex] || polygons[0];
      if (activeP && activeP.points && activeP.points.length >= 2) {
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Boundary Perimeter & Edge Dimensions Ledger', 16, yPos);
        doc.setDrawColor(201, 168, 76);
        doc.setLineWidth(0.4);
        doc.line(16, yPos + 1.5, 90, yPos + 1.5);
        yPos += 4.5;

        const segs = getSegmentLengths(activeP.points);
        const totalPerimeterM = segs.reduce((a, s) => a + s.meters, 0);
        const totalPerimeterFt = segs.reduce((a, s) => a + s.feet, 0);

        // Table Header
        const tWidth = pageWidth - 32;
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(16, yPos, tWidth, 6, 'F');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('SEGMENT', 20, yPos + 4.2);
        doc.text('FROM / TO CORNER', 58, yPos + 4.2);
        doc.text('LENGTH (METERS)', 115, yPos + 4.2);
        doc.text('LENGTH (FEET)', 155, yPos + 4.2);
        yPos += 6;

        // Table Rows
        const sideLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        segs.forEach((seg, sIdx) => {
          const isEven = sIdx % 2 === 0;
          doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.rect(16, yPos, tWidth, 5.2, 'FD');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`Side ${sideLetters[sIdx % sideLetters.length] || sIdx + 1}`, 20, yPos + 3.8);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Corner ${seg.from} to Corner ${seg.to}`, 58, yPos + 3.8);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(37, 99, 235);
          doc.text(`${seg.meters}.0 m`, 115, yPos + 3.8);
          doc.text(`${seg.feet.toLocaleString('en-IN')} ft`, 155, yPos + 3.8);

          yPos += 5.2;
        });

        // Total Summary Row
        doc.setFillColor(238, 242, 255);
        doc.setDrawColor(199, 210, 254);
        doc.setLineWidth(0.3);
        doc.rect(16, yPos, tWidth, 5.8, 'FD');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('TOTAL PERIMETER', 20, yPos + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${segs.length} Corners Demarcated`, 58, yPos + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(`${totalPerimeterM}.0 m`, 115, yPos + 4);
        doc.text(`${totalPerimeterFt.toLocaleString('en-IN')} ft`, 155, yPos + 4);

        yPos += 10;
      }

      // ── E. Footer & Play Store Stamp ──────────────────────────────
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(16, pageHeight - 14, pageWidth - 16, pageHeight - 14);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('Kharsan Properties App is available on Google Play Store', pageWidth / 2, pageHeight - 9, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`© ${new Date().getFullYear()} Kharsan Properties  |  Certified GPS Boundary Survey Engine  |  Generated: ${date}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      const filename = `Kharsan_Survey_${surveyRef}.pdf`;

      await savePdfCrossPlatform(doc, filename, {
        shareTitle: 'Share Property Survey Report',
        shareText: `Certified Land Survey Report: ${totalAcres} Acres - Kharsan Properties`,
      });

      toast.update(toastId, { render: 'Survey Report downloaded successfully!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.update(toastId, { render: 'PDF export failed', type: 'error', isLoading: false, autoClose: 3000 });
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('boundary_map.link_copied'));
  };

  const activePoly = polygons[activeIndex];
  const sheetHeights = { peek: 'calc(env(safe-area-inset-bottom, 0px) + 85px)', half: '52dvh', full: '90dvh' };

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
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-slate-900 font-['Nunito_Sans',sans-serif] antialiased select-none overscroll-none touch-pan-x touch-pan-y">
      <SEO title={t('boundary_map.title')} description={t('boundary_map.description')} />
      <style>{`
        .custom-tooltip { background: rgba(255,255,255,0.96) !important; border: 1.5px solid #2563eb !important; border-radius: 10px !important; color: #0f172a !important; font-weight: 800 !important; font-size: 11px !important; padding: 4px 10px !important; box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important; white-space: nowrap !important; }
        .custom-tooltip::before { border-top-color: rgba(255,255,255,0.96) !important; }
        .leaflet-container { cursor: ${isDrawing ? 'crosshair' : 'grab'} !important; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }

        @media (min-width: 768px) {
          .map-control-panel {
            top: 76px !important;
            bottom: 24px !important;
            right: 24px !important;
            left: auto !important;
            width: 380px !important;
            height: calc(100vh - 100px) !important;
            border-radius: 28px !important;
            border: 1px solid rgba(226,232,240,0.9) !important;
            transform: none !important;
            box-shadow: 0 20px 50px rgba(15,23,42,0.25) !important;
          }
        }
      `}</style>

      {/* Full Screen GIS Map */}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100%', width: '100vw', position: 'absolute', inset: 0 }}
        ref={mapRef}
        zoomControl={false}
        dragging={true}
        renderer={L.canvas()}
      >
        <TileLayer url={TILES[tileMode].url} attribution="" maxZoom={21} crossOrigin={true} />
        <MapEvents />
        <MapZoomTracker onZoomChange={setCurrentZoom} />

        {polygons.map((poly, pIdx) => {
          const showTooltip = currentZoom >= 15;
          const showEdgeLabels = currentZoom >= 16;
          return (
            <React.Fragment key={pIdx}>
              {poly.points.length > 0 && (
                <Polygon
                  positions={poly.points}
                  pathOptions={{
                    color: poly.color || '#2563eb',
                    weight: activeIndex === pIdx ? 3.5 : 2.5,
                    opacity: 1,
                    fillColor: poly.color || '#2563eb',
                    fillOpacity: activeIndex === pIdx ? 0.3 : 0.2,
                    dashArray: activeIndex === pIdx && isDrawing ? '6,10' : ''
                  }}
                  eventHandlers={{ click: () => setActiveIndex(pIdx) }}
                >
                  {!isDrawing && poly.area && showTooltip && (
                    <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="custom-tooltip">
                      <div className="text-center">
                        <div style={{ color: poly.color || '#2563eb' }} className="font-black text-xs">{poly.label}</div>
                        <div className="text-slate-600 text-[10px] font-mono mt-0.5">
                          {formatPolyArea(poly.area, unit)}
                        </div>
                      </div>
                    </Tooltip>
                  )}
                  <Popup>
                    <div className="text-center font-bold text-slate-900 min-w-[130px] p-1">
                      <div className="text-base mb-1 font-black">{poly.label}</div>
                      <div style={{ color: poly.color || '#2563eb' }} className="font-black text-sm">{formatPolyArea(poly.area, unit)}</div>
                      <div className="text-xs opacity-60 font-mono mt-0.5">{poly.area?.sqft} {t('tools_page.sqft')}</div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {showEdgeLabels && renderEdgeLabels(poly)}

              {activeIndex === pIdx && poly.points.map((pt, ptIdx) => {
                const isLast = ptIdx === poly.points.length - 1;
                return (
                  <Marker
                    key={`${pIdx}-${ptIdx}`}
                    position={pt}
                    draggable
                    eventHandlers={{ dragend: (e) => updatePoint(pIdx, ptIdx, e.target.getLatLng()) }}
                    icon={L.divIcon({
                      className: 'drawing-handle',
                      html: `<div style="background:${isLast ? '#10b981' : (poly.color || '#2563eb')};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px ${isLast ? 'rgba(16,185,129,0.6)' : 'rgba(37,99,235,0.4)'}, 0 4px 12px rgba(0,0,0,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:900;font-family:monospace;">${ptIdx + 1}</div>`,
                      iconSize: [20, 20], iconAnchor: [10, 10]
                    })}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Top Mobile Bar */}
      <div className="absolute top-3 left-3 right-3 md:top-4 md:left-6 md:right-6 z-[1001] flex items-center justify-between gap-2">
        {isDrawing ? (
          <div className="w-full flex items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl text-white">
            <button
              onClick={stopDrawing}
              className="h-9 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
              title="Done Drawing"
            >
              <ArrowLeft size={14} />
              <span>Done</span>
            </button>

            <div className="flex-1 text-center min-w-0 px-2">
              <div className="flex items-center justify-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-black tracking-tight text-white truncate">
                  {activePoly?.points?.length ? `${activePoly.points.length} Corners Placed` : 'Tap Map with Thumb'}
                </span>
                {activePoly?.area && (
                  <span className="text-xs font-black text-amber-400 font-mono shrink-0">
                    · {formatPolyArea(activePoly.area, unit)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setUnit(u => u === 'acres' ? 'sqft' : u === 'sqft' ? 'sqyd' : 'acres')}
              className="h-9 px-2.5 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 text-amber-300 rounded-xl flex items-center justify-center font-black text-[10px] uppercase transition-all active:scale-95 cursor-pointer shrink-0"
              title="Change Measurement Unit"
            >
              {unit === 'acres' ? 'AC' : unit === 'sqft' ? 'FT²' : 'YD²'}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="h-10 px-3.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center gap-1.5 text-slate-800 hover:text-blue-600 shadow-md active:scale-95 transition-all cursor-pointer shrink-0 font-black text-xs uppercase"
            >
              <ArrowLeft size={15} className="text-blue-600" />
              <span>{t('boundary_map.back')}</span>
            </button>

            <div className="h-10 px-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl items-center gap-2 text-slate-900 shadow-md shrink-0 hidden sm:flex">
              <LandPlot size={16} className="text-blue-600" />
              <span className="text-xs font-black tracking-tight">Smart Boundary Mapping Tool</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/saved-maps')}
                className="h-10 px-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center gap-1.5 text-slate-800 hover:text-blue-600 shadow-md active:scale-95 transition-all font-black text-xs uppercase cursor-pointer shrink-0"
                title="My Saved Maps"
              >
                <MapPin size={14} className="text-blue-600" />
                <span className="hidden sm:inline">Saved Maps</span>
              </button>

              <button
                onClick={toggleLanguage}
                className="h-10 px-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center gap-1.5 text-slate-800 hover:text-blue-600 shadow-md active:scale-95 transition-all font-black text-xs uppercase cursor-pointer shrink-0"
              >
                <Globe size={14} className="text-blue-600" />
                {language === 'en' ? 'ગુજરાતી' : 'English'}
              </button>

              <button
                onClick={() => { setShowTutorial(true); setTutorialSlide(0); }}
                className="h-10 w-10 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex items-center justify-center text-slate-700 hover:text-blue-600 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                title="Map Guide & Tutorial"
              >
                <Info size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute inset-0 z-[1100] bg-slate-950/70 backdrop-blur-md flex flex-col items-center pt-16 px-4">
          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center px-5 py-4 gap-3 border-b border-slate-100">
                <Search size={20} className="text-blue-600 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t('boundary_map.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 text-sm font-extrabold placeholder:text-slate-400 outline-none"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  {searchLoading ? 'Searching location...' : <><Search size={15} /> {t('boundary_map.search_btn')}</>}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Action Buttons Left Dock */}
      <div
        className="absolute left-3 md:left-6 z-[1001] flex flex-col gap-2.5 transition-all duration-300"
        style={{ bottom: isDrawing ? '95px' : (isDesktop ? '28px' : `calc(${sheetHeights[sheetState]} + 16px)`) }}
      >
        <button
          onClick={getLocation}
          title={t('boundary_map.navigate_my_location')}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border transition-all active:scale-90 cursor-pointer ${loading ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-xl hover:text-blue-600 hover:bg-white'
            }`}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
        </button>

        <button
          onClick={() => setSearchOpen(true)}
          title="Search Location"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <Search size={18} />
        </button>

        <button
          onClick={cycleTile}
          title={t('boundary_map.map_type')}
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <Layers size={18} />
        </button>

        <button
          onClick={() => setUnit(u => u === 'acres' ? 'sqft' : u === 'sqft' ? 'sqyd' : 'acres')}
          title="Change Measurement Unit"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-800 hover:text-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <span className="text-[10px] font-black uppercase">
            {unit === 'acres' ? 'AC' : unit === 'sqft' ? 'FT²' : 'YD²'}
          </span>
        </button>
      </div>

      {/* Mobile Floating Drawing Control Bar */}
      {isDrawing && (
        <div className="absolute bottom-5 left-3 right-3 z-[1001] flex justify-center pointer-events-auto">
          <div className="w-full max-w-md bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 justify-between text-white">
            <button
              onClick={undoLastPoint}
              disabled={!activePoly?.points?.length}
              title={t('boundary_map.undo_point')}
              className="h-11 px-3.5 bg-white/10 border border-white/10 rounded-xl flex items-center gap-1.5 text-slate-300 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all shrink-0 cursor-pointer font-bold text-xs"
            >
              <RotateCcw size={15} />
              <span>Undo</span>
            </button>

            <div className="flex-1 text-center py-1 px-2 min-w-0">
              <div className="text-[11px] sm:text-xs font-black text-white truncate">
                {activePoly?.points?.length ? (
                  <span className="text-emerald-400 font-mono">
                    {activePoly.area ? formatPolyArea(activePoly.area, unit) : `${activePoly.points.length} points placed`}
                  </span>
                ) : (
                  <span className="text-slate-300">Tap satellite map</span>
                )}
              </div>
              <div className="text-[10px] font-bold text-slate-400 truncate">
                {activePoly?.points?.length ? `${activePoly.points.length} corners mapped` : 'Direct thumb tap'}
              </div>
            </div>

            <button
              onClick={stopDrawing}
              title={t('boundary_map.stop_drawing')}
              className="h-11 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 rounded-xl flex items-center gap-1.5 active:scale-90 transition-all shrink-0 cursor-pointer font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
            >
              <Check size={16} className="stroke-[3]" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet / Desktop Control Panel */}
      <div
        ref={sheetRef}
        className="map-control-panel absolute bottom-0 left-0 right-0 z-[1002] bg-white/95 text-slate-900 backdrop-blur-2xl overscroll-contain"
        style={{
          height: isDrawing && !isDesktop ? '0px' : (isDesktop ? 'calc(100vh - 100px)' : sheetHeights[sheetState]),
          transition: 'all 0.35s cubic-bezier(0.32,0.72,0,1)',
          borderRadius: isDesktop ? '28px' : '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTop: isDrawing && !isDesktop ? 'none' : '1px solid rgba(226,232,240,0.9)',
          boxShadow: isDrawing && !isDesktop ? 'none' : '0 -15px 40px rgba(15,23,42,0.12)',
          overscrollBehaviorY: 'contain'
        }}
      >
        {/* Desktop Sidebar Header */}
        {isDesktop && (
          <div className="px-6 py-5 border-b border-slate-100 shrink-0 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-slate-900 font-black text-base tracking-tight">{t('boundary_map.title')}</h3>
              <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-0.5">
                {polygons.length} {polygons.length > 1 ? 'Plots' : 'Plot'} · {totalArea > 0 ? `${totalArea.toFixed(3)} ${t('tools_page.acre').toLowerCase()}` : t('boundary_map.no_boundary')}
              </p>
            </div>
            <Map size={24} className="text-blue-600" />
          </div>
        )}

        {/* Mobile Swipe Handle */}
        {!isDesktop && (
          <div
            ref={dragHandleRef}
            onTouchStart={isDesktop ? undefined : onSheetTouchStart}
            onTouchEnd={isDesktop ? undefined : onSheetTouchEnd}
            onClick={() => { if (sheetState === 'peek') setSheetState('half'); }}
            className="flex flex-col items-center pt-2.5 pb-1.5 shrink-0 cursor-pointer select-none touch-none"
            style={{ touchAction: 'none' }}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mb-2 shrink-0" />

            {sheetState === 'peek' && (
              <div className="w-full flex items-center justify-between px-5 py-1">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                    {polygons.length} {polygons.length > 1 ? 'Plots' : 'Plot'}
                  </span>
                  <span className="text-slate-900 font-black text-sm font-mono">
                    {totalArea > 0
                      ? `${totalArea.toFixed(3)} ${t('tools_page.acre').toLowerCase()}`
                      : t('boundary_map.no_boundary')}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); startDrawing(); }}
                  className="h-9 px-4 bg-[#1a2340] text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <PenLine size={13} />
                  <span>{t('boundary_map.start_drawing')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation Bar */}
        {(sheetState !== 'peek' || isDesktop) && (
          <div className="flex gap-2 px-4 py-2.5 border-b border-slate-100 shrink-0">
            {[
              { id: 'plots', icon: <MapPin size={13} />, label: t('boundary_map.plots_tab'), count: polygons.length },
              { id: 'tools', icon: <SlidersHorizontal size={13} />, label: t('boundary_map.tools_tab') },
              { id: 'export', icon: <Download size={13} />, label: t('boundary_map.export_tab') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${activeTab === tab.id
                    ? 'bg-[#1a2340] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content Container */}
        {(sheetState !== 'peek' || isDesktop) && (
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
          >

            {/* TAB 1: PLOTS */}
            {activeTab === 'plots' && (
              <div className="space-y-3">
                {totalArea > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-blue-700 font-black uppercase tracking-widest">{t('boundary_map.total_area')}</div>
                      <div className="text-slate-900 text-xl font-black font-mono mt-0.5">
                        {totalArea.toFixed(3)} <span className="text-xs font-extrabold text-slate-600">{t('tools_page.acre').toLowerCase()}</span>
                      </div>
                    </div>
                    <AreaChart size={28} className="text-blue-600 opacity-80" />
                  </div>
                )}

                {polygons.map((poly, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${activeIndex === idx
                        ? 'bg-slate-50 border-blue-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: poly.color }} />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={poly.label}
                          onChange={e => updatePlotField(idx, 'label', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-900 outline-none placeholder:text-slate-400 mb-0.5"
                          placeholder={t('boundary_map.plot_name_placeholder')}
                        />
                        <div className="text-xs text-slate-500 font-semibold font-mono">
                          {poly.area
                            ? `${poly.area.acres} ${t('tools_page.acre').toLowerCase()} · ${poly.area.sqft} ${t('tools_page.sqft').toLowerCase()}`
                            : poly.points.length > 0
                              ? t('boundary_map.points_placed').replace('{count}', poly.points.length)
                              : t('boundary_map.no_boundary')
                          }
                        </div>
                      </div>

                      {activeIndex === idx && (
                        <div className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0">
                          {t('boundary_map.active_badge')}
                        </div>
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); deletePlot(idx); }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {activeIndex === idx && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-1">
                          {t('boundary_map.color_label')}:
                        </span>
                        {COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={e => { e.stopPropagation(); updatePlotField(idx, 'color', c.value); }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform active:scale-90 cursor-pointer ${poly.color === c.value ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-110'
                              }`}
                            style={{ background: c.value }}
                          />
                        ))}
                      </div>
                    )}

                    {activeIndex === idx && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex gap-2" onClick={e => e.stopPropagation()}>
                        {!isDrawing ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startDrawing(); }}
                            className="flex-1 py-2 bg-[#1a2340] hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <PenLine size={13} />
                            <span>{t('boundary_map.start_drawing')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); stopDrawing(); }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <Check size={13} />
                            <span>Done Drawing</span>
                          </button>
                        )}
                      </div>
                    )}

                    {activeIndex === idx && poly.points.length >= 2 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-1.5" onClick={e => e.stopPropagation()}>
                        <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Ruler size={11} />
                          {t('boundary_map.segment_lengths')}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                          {getSegmentLengths(poly.points).map((seg, sIdx) => (
                            <div key={sIdx} className="bg-slate-100 border border-slate-200 rounded-lg p-1.5 flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 font-bold">Side {seg.from}→{seg.to}</span>
                              <span className="text-blue-700 font-black font-mono">
                                {unit === 'acres' || unit === 'sqyd' ? `${seg.meters}m` : `${seg.feet}ft`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {totalArea > 0 && !isDrawing && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-emerald-950 font-black text-xs uppercase tracking-widest">
                        {language === 'en' ? 'Boundary Mapping Complete' : 'સીમા પૂર્ણ થઈ'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">
                      Your boundary is mapped. You can save, share or export a PDF report.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActiveTab('export'); handleSaveAndShare(); }}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-[#1a2340] hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Share2 size={14} />
                        Save & Share
                      </button>
                      <button
                        onClick={exportPDF}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileText size={14} className="text-blue-600" />
                        PDF Report
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={addNewPlot}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 text-slate-600 hover:text-blue-600 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Plus size={15} /> {t('boundary_map.add_new_plot')}
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={undoLastPoint}
                    className="flex-1 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-200 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={13} /> Undo
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex-1 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TOOLS & LAYERS */}
            {activeTab === 'tools' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('boundary_map.map_type')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TILES).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setTileMode(key)}
                        className={`py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 cursor-pointer ${tileMode === key
                            ? 'bg-[#1a2340] text-white font-black shadow-md'
                            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {key === 'satellite' ? <Satellite size={18} /> : key === 'hybrid' ? <Layers size={18} /> : <Map size={18} />}
                        <span>{val.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('boundary_map.measurement_unit')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'acres', label: 'Acres (એકર)', icon: <LandPlot size={16} /> },
                      { value: 'sqft', label: 'Sq. Feet (ચો.ફૂટ)', icon: <Maximize2 size={16} /> },
                      { value: 'sqyd', label: 'Sq. Yards (ગજ)', icon: <Ruler size={16} /> },
                    ].map(u => (
                      <button
                        key={u.value}
                        onClick={() => setUnit(u.value)}
                        className={`py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 cursor-pointer ${unit === u.value
                            ? 'bg-[#1a2340] text-white font-black shadow-md'
                            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {u.icon}
                        <span>{u.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { getLocation(); setSheetState('peek'); }}
                  className="w-full py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Navigation size={16} className="text-blue-600" />
                  {t('boundary_map.navigate_my_location')}
                </button>
              </div>
            )}

            {/* TAB 3: EXPORT & REPORT */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('boundary_map.summary')}</div>
                  {polygons.map((p, i) => (
                    p.area && (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-slate-900 font-bold">{p.label}</span>
                        </div>
                        <span className="text-blue-700 font-mono font-black">{p.area.acres} {t('tools_page.acre').toLowerCase()}</span>
                      </div>
                    )
                  ))}
                  {totalArea > 0 && (
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                      <span className="text-slate-500 font-black uppercase">{t('boundary_map.total')}</span>
                      <span className="text-slate-900 font-black font-mono text-sm">{totalArea.toFixed(3)} {t('tools_page.acre').toLowerCase()}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveAndShare}
                  disabled={saving}
                  className="w-full py-3.5 bg-[#1a2340] hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving Map...' : <><Share2 size={16} /> {t('boundary_map.save_generate_link')}</>}
                </button>

                <button
                  onClick={exportPDF}
                  className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <FileText size={16} className="text-blue-600" /> {t('boundary_map.pdf_report')}
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShare && shareUrl && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-slate-900 font-black text-sm">{t('boundary_map.map_saved')}</div>
                <div className="text-slate-500 text-[11px] font-medium">{t('boundary_map.shareable_ready')}</div>
              </div>
              <button onClick={() => setShowShare(false)} className="ml-auto text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-0.5">{t('boundary_map.share_link')}</div>
                  <div className="text-slate-900 font-mono text-xs font-bold truncate">{shareUrl}</div>
                </div>
                <button
                  onClick={copyLink}
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${copied ? 'bg-emerald-600 text-white' : 'bg-[#1a2340] text-white'
                    }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink size={15} className="text-blue-600" /> {t('boundary_map.open_map')}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[2100] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
                  <Map size={18} className="text-blue-600" /> {t('boundary_map.tutorial_title')}
                </h3>
                <button onClick={closeTutorial} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 py-1">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2 min-h-[180px] justify-center">
                  {tutorialSlide === 0 && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Search size={24} /></div>
                      <div className="text-slate-900 font-black text-xs">{t('boundary_map.tutorial_step1_title')}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{t('boundary_map.tutorial_step1_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 1 && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Target size={24} /></div>
                      <div className="text-slate-900 font-black text-xs">{t('boundary_map.tutorial_step2_title')}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{t('boundary_map.tutorial_step2_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 2 && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Ruler size={24} /></div>
                      <div className="text-slate-900 font-black text-xs">{t('boundary_map.tutorial_step3_title')}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{t('boundary_map.tutorial_step3_desc')}</p>
                    </>
                  )}
                  {tutorialSlide === 3 && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Download size={24} /></div>
                      <div className="text-slate-900 font-black text-xs">{t('boundary_map.tutorial_step4_title')}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{t('boundary_map.tutorial_step4_desc')}</p>
                    </>
                  )}
                </div>

                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map(idx => (
                    <button
                      key={idx}
                      onClick={() => setTutorialSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${tutorialSlide === idx ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {tutorialSlide > 0 && (
                  <button
                    onClick={() => setTutorialSlide(s => s - 1)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={13} /> {t('boundary_map.back')}
                  </button>
                )}

                {tutorialSlide < 3 ? (
                  <button
                    onClick={() => setTutorialSlide(s => s + 1)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={closeTutorial}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={13} /> {t('boundary_map.close_tutorial')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE CONFIRMATION MODAL */}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  );
};

export default BoundaryMap;