import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Plus, Search, Filter, MapPin, Tag, Eye, Share2, ExternalLink,
  Trash2, Edit, MoreVertical, X, ArrowLeft, Building2, IndianRupee,
  Layers, CheckCircle2, Clock, Copy, Link2, Globe, Lock, ChevronDown,
  LayoutGrid, List, SlidersHorizontal, Sparkles, ArrowUpRight, TrendingUp,
  FileText, FolderOpen, PackageOpen, RefreshCw, Check, Phone, User as UserIcon,
  MessageCircle, ShieldCheck, Database, Zap, ArrowRight, Share, CheckCircle,
  ChevronLeft, ChevronRight, Calendar, Info
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { getImageUrl } from '../utils/imageUrl';

const inputCls = "w-full px-3.5 py-2.5 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all font-semibold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400";

const TO_GUNTHA = {
  guntha: 1,
  hectare: 98.84,
  aare: 0.9884,
  vigha_bada: 23.78,
  vigha_chhota: 16.19,
  acre: 40,
  sqm: 0.009884,
  sqft: 1 / 1089,
  gaj: 9 / 1089,
};

const getAreaEquivalents = (val, unit) => {
  const num = parseFloat(val);
  if (!num || isNaN(num) || num <= 0) return null;
  const factor = TO_GUNTHA[unit] || 1;
  const totalGuntha = num * factor;
  const totalSqft = totalGuntha * 1089;
  const totalAcre = totalGuntha / 40;

  const parts = [];
  if (unit !== 'sqft') {
    parts.push(`≈ ${Math.round(totalSqft).toLocaleString('en-IN')} Sq.Ft`);
  }
  if (unit !== 'guntha' && totalGuntha >= 0.1) {
    parts.push(`≈ ${totalGuntha.toFixed(2).replace(/\.00$/, '')} Guntha`);
  }
  if (unit !== 'acre' && totalAcre >= 0.05) {
    parts.push(`≈ ${totalAcre.toFixed(2).replace(/\.00$/, '')} Acre`);
  }
  return parts.length > 0 ? parts.join(' • ') : null;
};

// ── Tag Pill ──
const TagPill = ({ text }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
    <Tag size={9} />
    {text}
  </span>
);

// ── Stat Card (Executive Desktop Design) ──
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'emerald', active = false, onClick }) => {
  const styles = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40',
      val: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      activeRing: 'ring-2 ring-slate-800 border-slate-800 bg-slate-50',
      val: 'text-slate-900',
      badge: 'bg-slate-200/80 text-slate-700'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      activeRing: 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40',
      val: 'text-indigo-950',
      badge: 'bg-indigo-100 text-indigo-800'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      activeRing: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
      val: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800'
    }
  };
  const current = styles[color] || styles.emerald;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:shadow-md hover:-translate-y-0.5 ${
        active ? current.activeRing : 'border-slate-200/90 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${current.bg} group-hover:scale-105 transition-transform shrink-0`}>
          <Icon size={19} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${current.badge}`}>
          {title}
        </span>
      </div>
      <div>
        <div className={`text-2xl sm:text-3xl font-black ${current.val} tracking-tight font-sans`}>
          {value}
        </div>
        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1 line-clamp-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

// ── Custom Shimmer Skeletons ──
const WalletGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
        <div className="h-40 sm:h-52 bg-slate-200/80 relative">
          <div className="absolute top-3 left-3 w-16 h-5 bg-slate-300 rounded-md" />
        </div>
        <div className="p-3.5 sm:p-4 space-y-2.5">
          <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-3.5 bg-slate-200 rounded w-1/2" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 bg-emerald-100/70 rounded-md w-24" />
            <div className="h-5 bg-slate-100 rounded-md w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const WalletListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs animate-pulse flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
        <div className="w-full sm:w-36 h-24 bg-slate-200/80 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-3.5 bg-slate-200 rounded w-1/3" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-emerald-100 rounded w-20" />
            <div className="h-5 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Property Detail Full Inspector Modal ──
const PropertyDetailModal = ({ property, onClose, onEdit, onDelete, onShare, onPublish }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!property) return null;

  const hasImages = property.images && property.images.length > 0;
  const isPublished = property.isPublished;
  const activeShares = (property.shareTokens || []).filter(t => new Date(t.expiresAt) > new Date()).length;
  const areaEquiv = property.areaValue ? getAreaEquivalents(property.areaValue, property.areaUnit) : null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 font-['Nunito_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Briefcase size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isPublished ? (
                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Globe size={9} /> Marketplace Live
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock size={9} className="text-emerald-600" /> 100% Confidential Diary
                  </span>
                )}
                {activeShares > 0 && (
                  <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Share2 size={9} /> {activeShares} Shared Links
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          
          {/* Image Gallery */}
          {hasImages ? (
            <div className="space-y-2">
              <div className="relative h-48 sm:h-72 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 group">
                <img
                  src={getImageUrl(property.images[activeImageIndex])}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex - 1 + property.images.length) % property.images.length)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex + 1) % property.images.length)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                      {activeImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </div>

              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === i ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 border border-slate-200/60">
              <Building2 size={28} />
              <span className="text-xs font-bold">No Photos Uploaded</span>
            </div>
          )}

          {/* Pricing & Area Highlights */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Expected Price</span>
              <div className="text-base sm:text-2xl font-black text-emerald-950 mt-0.5">
                {property.price ? `₹${property.price.toLocaleString('en-IN')}` : property.priceLabel || 'Price on Request'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block">Total Area</span>
              <div className="text-base sm:text-2xl font-black text-slate-900 mt-0.5">
                {property.area || 'Not specified'}
              </div>
              {areaEquiv && (
                <p className="text-[10px] font-bold text-emerald-800 mt-1 line-clamp-1">{areaEquiv}</p>
              )}
            </div>
          </div>

          {/* Location & Property Meta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Location / Address</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-emerald-600 shrink-0" />
                  {property.location || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">City & Locality</span>
                <span className="font-bold text-slate-800">
                  {property.city || 'Unspecified'} {property.locality ? `(${property.locality})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Property & Land Type</span>
                <span className="font-bold text-slate-800">
                  {property.propertyType || 'Land'} {property.landType ? `• ${property.landType}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Created Date</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} className="text-slate-400" />
                  {new Date(property.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {property.tags && property.tags.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {property.tags.map((t, i) => (
                  <TagPill key={i} text={t} />
                ))}
              </div>
            )}

            {property.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] mb-1">Description</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 sm:p-3 rounded-xl">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Confidential Real Owner Section */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-2xl border border-amber-200/80 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Confidential Owner Record</h4>
                  <p className="text-[10px] font-semibold text-amber-800">Only visible to you. Never shared publicly.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Owner Name</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">{property.ownerName || 'No name recorded'}</span>
              </div>

              <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Owner Phone</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">{property.ownerPhone || 'No phone'}</span>
                </div>
                {property.ownerPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${property.ownerPhone.replace(/\s+/g, '')}`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                      title="Call Owner"
                    >
                      <Phone size={11} />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${property.ownerPhone.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1 transition-colors"
                      title="WhatsApp Owner"
                    >
                      <MessageCircle size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {property.notes && (
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Confidential Diary Notes (Survey No, Terms, Soil, etc.)</span>
                <p className="text-xs text-slate-800 font-semibold whitespace-pre-line leading-relaxed">
                  {property.notes}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => { onClose(); onDelete(property); }}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200/80"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isPublished && (
              <button
                onClick={() => { onClose(); onPublish(property); }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Globe size={13} />
                <span>Make Listing</span>
              </button>
            )}

            <button
              onClick={() => { onClose(); onShare(property); }}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>

            <button
              onClick={() => { onClose(); onEdit(property); }}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Edit size={13} />
              <span>Edit</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

// ── Share Links Modal ──
const ShareLinksModal = ({ isOpen, onClose, property, onGenerate, onRevoke }) => {
  const [label, setLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen || !property) return null;

  const activeTokens = (property.shareTokens || []).filter(t => new Date(t.expiresAt) > new Date());
  const baseUrl = window.location.origin;

  const handleCopy = (token, id) => {
    navigator.clipboard.writeText(`${baseUrl}/p/share/${token}`);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (token) => {
    const link = `${baseUrl}/p/share/${token}`;
    const text = `Namaste! Here are the details for *${property.title}*:\n\n📍 Location: ${property.location || property.city || ''}\n💰 Price: ${property.price ? '₹' + property.price.toLocaleString('en-IN') : property.priceLabel || 'On Request'}\n📐 Area: ${property.area || ''}\n\n🔗 View Verified Details: ${link}\n\n(This link is valid for 7 days)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate(property._id, label);
      setLabel('');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-['Nunito_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Share2 size={20} />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Share Property Link</h3>
            <p className="text-xs font-semibold text-slate-500 truncate">{property.title}</p>
          </div>
        </div>

        {/* Generate New Link */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Create Expiring Client Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Client / Buyer Name (e.g. Ramesh Patel)"
              className={inputCls}
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
            >
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Link2 size={14} />}
              <span>Generate</span>
            </button>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
            <Lock size={11} className="text-emerald-600 shrink-0" /> Real owner contacts are strictly hidden. Link expires in 7 days.
          </p>
        </div>

        {/* Active Links */}
        {activeTokens.length > 0 ? (
          <div className="space-y-2.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Client Links ({activeTokens.length})</p>
            {activeTokens.map(t => (
              <div key={t._id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:border-emerald-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {baseUrl}/p/share/{t.token.substring(0, 12)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                    {t.label && <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{t.label}</span>}
                    <span className="text-slate-400 font-semibold flex items-center gap-0.5">
                      <Eye size={10} /> {t.viewCount || 0} views
                    </span>
                    <span className="text-slate-400 font-semibold flex items-center gap-0.5">
                      <Clock size={10} /> Exp: {new Date(t.expiresAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleWhatsApp(t.token)}
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="Share on WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>
                <button
                  onClick={() => handleCopy(t.token, t._id)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="Copy Link"
                >
                  {copiedId === t._id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => onRevoke(property._id, t._id)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="Revoke Link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs font-bold text-slate-400">
            <Lock size={22} className="mx-auto mb-1.5 text-slate-300" />
            No active share links yet.
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ── Property Card (Grid View - Desktop & Mobile Polish) ──
const PropertyCard = ({ property, onView, onEdit, onDelete, onShare, onPublish }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const hasImages = property.images && property.images.length > 0;
  const isPublished = property.isPublished;
  const activeShares = (property.shareTokens || []).filter(t => new Date(t.expiresAt) > new Date()).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={() => onView(property)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative cursor-pointer"
    >
      {/* Image Container */}
      <div className="h-40 sm:h-52 bg-slate-100 relative rounded-t-2xl overflow-hidden">
        {hasImages ? (
          <img src={getImageUrl(property.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5 bg-gradient-to-br from-slate-50 to-slate-100">
            <Building2 size={32} className="text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400">Private Record</span>
          </div>
        )}

        {/* Badges Top Left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {isPublished ? (
            <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
              <Globe size={9} /> Listed
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase bg-slate-900/90 text-slate-100 px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs flex items-center gap-1 border border-white/10">
              <Lock size={9} className="text-emerald-400" /> Private
            </span>
          )}
        </div>

        {/* Active Shares Badge */}
        {activeShares > 0 && (
          <div className="absolute bottom-2 right-2 text-[9px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md z-10 backdrop-blur-xs">
            <Share2 size={9} /> {activeShares} Shared
          </div>
        )}
      </div>

      {/* Floating 3-Dots Action Button */}
      <div className="absolute top-2.5 right-2.5 z-30" ref={menuRef} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-md text-slate-700 hover:text-emerald-700 flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-all border border-slate-200/80 active:scale-95"
          title="Property Options"
        >
          <MoreVertical size={13} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-9 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 min-w-[170px] z-50 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onView(property); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
              >
                <Eye size={13} className="text-emerald-600" /> View All Details
              </button>

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onEdit(property); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
              >
                <Edit size={13} className="text-slate-500" /> Edit Details
              </button>

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onShare(property); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors text-left"
              >
                <Share2 size={13} className="text-emerald-600" /> Share Client Link
              </button>

              {!isPublished && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onPublish(property); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors text-left"
                >
                  <Globe size={13} className="text-emerald-600" /> Make Listing
                </button>
              )}

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(property); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors text-left"
              >
                <Trash2 size={13} className="text-rose-500" /> Delete Property
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-base font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {property.title}
          </h3>

          {property.location && (
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
              <MapPin size={11} className="text-emerald-600 shrink-0" /> {property.location}
            </p>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
            {property.price ? (
              <span className="text-xs sm:text-base font-black text-emerald-800 flex items-center tracking-tight">
                ₹{property.price.toLocaleString('en-IN')}
              </span>
            ) : property.priceLabel ? (
              <span className="text-[11px] sm:text-xs font-bold text-slate-700">{property.priceLabel}</span>
            ) : null}

            {property.area && (
              <span className="text-[9px] sm:text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                {property.area}
              </span>
            )}

            {property.city && (
              <span className="text-[9px] sm:text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                {property.city}
              </span>
            )}
          </div>
        </div>

        {/* Private Owner Box */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/80 -mx-3 -mb-3 sm:-mx-4.5 sm:-mb-4.5 p-2.5 sm:p-3 rounded-b-2xl">
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0 flex-1">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                <Lock size={8} className="text-slate-400" /> Owner
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate block mt-0.5">
                {property.ownerName || 'No owner recorded'}
              </span>
            </div>
            {property.ownerPhone ? (
              <a
                href={`tel:${property.ownerPhone.replace(/\s+/g, '')}`}
                onClick={e => e.stopPropagation()}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 border border-emerald-200/60 transition-colors"
                title="Call Owner"
              >
                <Phone size={9} className="text-emerald-600" />
                <span>Call</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Property Row (List View - Desktop & Mobile) ──
const PropertyRow = ({ property, onView, onEdit, onDelete, onShare, onPublish }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const hasImages = property.images && property.images.length > 0;
  const isPublished = property.isPublished;
  const activeShares = (property.shareTokens || []).filter(t => new Date(t.expiresAt) > new Date()).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={() => onView(property)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-lg transition-all p-3 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 group cursor-pointer"
    >
      {/* Left Thumbnail & Info */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
        <div className="w-16 h-16 sm:w-28 sm:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative border border-slate-200/80">
          {hasImages ? (
            <img src={getImageUrl(property.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              <Building2 size={22} />
            </div>
          )}
          <div className="absolute top-1 left-1">
            {isPublished ? (
              <span className="text-[7px] sm:text-[8px] font-black uppercase bg-emerald-600 text-white px-1 py-0.5 rounded flex items-center gap-0.5">
                <Globe size={6} /> Listed
              </span>
            ) : (
              <span className="text-[7px] sm:text-[8px] font-black uppercase bg-slate-900/90 text-slate-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                <Lock size={6} /> Private
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-base font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
              {property.title}
            </h3>
            {property.city && (
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {property.city}
              </span>
            )}
          </div>

          {property.location && (
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={10} className="text-emerald-600 shrink-0" /> {property.location}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {property.price ? (
              <span className="text-xs sm:text-sm font-black text-emerald-800 flex items-center">
                ₹{property.price.toLocaleString('en-IN')}
              </span>
            ) : property.priceLabel ? (
              <span className="text-[11px] font-bold text-slate-700">{property.priceLabel}</span>
            ) : null}

            {property.area && (
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {property.area}
              </span>
            )}
          </div>

          {property.ownerName && (
            <div className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 flex items-center gap-1 flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[8px]">Owner:</span>
              <span className="text-slate-800 font-bold">{property.ownerName}</span>
              {property.ownerPhone && (
                <a
                  href={`tel:${property.ownerPhone.replace(/\s+/g, '')}`}
                  onClick={e => e.stopPropagation()}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 ml-1"
                >
                  <Phone size={8} /> {property.ownerPhone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShare(property); }}
          className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[11px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-200/60 active:scale-95"
          title="Share Link"
        >
          <Share2 size={12} />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(property); }}
          className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-200/60 active:scale-95"
          title="Edit Details"
        >
          <Edit size={12} />
          <span>Edit</span>
        </button>

        <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all border border-slate-200/60 active:scale-95"
            title="More Options"
          >
            <MoreVertical size={13} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 min-w-[170px] z-50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onView(property); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
                >
                  <Eye size={13} className="text-emerald-600" /> View All Info
                </button>

                {!isPublished && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onPublish(property); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors text-left"
                  >
                    <Globe size={13} className="text-emerald-600" /> Make Listing
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onShare(property); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors text-left"
                >
                  <Share2 size={13} className="text-emerald-600" /> Share Link
                </button>

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit(property); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
                >
                  <Edit size={13} className="text-slate-500" /> Edit Details
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(property); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors text-left"
                >
                  <Trash2 size={13} className="text-rose-500" /> Delete Property
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


// ── Main Page Component ──
const PropertyWallet = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
  const [viewMode, setViewMode] = useState('grid');
  const [confirmModal, setConfirmModal] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Role Gate
  useEffect(() => {
    if (!authLoading && user && user.role !== 'Broker' && user.role !== 'Admin') {
      toast.error('Property Wallet is available for Brokers only');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Query Params
  const buildQueryParams = useCallback(() => {
    const params = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (activeFilter === 'published') params.published = 'true';
    if (activeFilter === 'private') params.published = 'false';
    if (cityFilter) params.city = cityFilter;
    if (typeFilter) params.propertyType = typeFilter;
    if (sortBy === 'price_asc') params.sort = 'price_asc';
    if (sortBy === 'price_desc') params.sort = 'price_desc';
    if (sortBy === 'oldest') params.sort = 'oldest';
    if (sortBy === 'title') params.sort = 'title';
    return params;
  }, [searchQuery, activeFilter, cityFilter, typeFilter, sortBy]);

  // Fetch Properties
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['walletProperties', searchQuery, activeFilter, cityFilter, typeFilter, sortBy],
    enabled: !!user && (user.role === 'Broker' || user.role === 'Admin'),
    queryFn: async () => {
      const params = buildQueryParams();
      const res = await axios.get('/api/wallet', { params });
      return res.data;
    },
    refetchOnWindowFocus: true,
    keepPreviousData: true
  });

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['walletStats'],
    enabled: !!user && (user.role === 'Broker' || user.role === 'Admin'),
    queryFn: async () => {
      const res = await axios.get('/api/wallet/stats');
      return res.data.data;
    }
  });

  const properties = propertiesData?.data || [];
  const totalCount = statsData?.total !== undefined ? statsData.total : (propertiesData?.total ?? properties.length);
  const publishedCount = statsData?.published !== undefined ? statsData.published : properties.filter(p => p.isPublished).length;
  const unpublishedCount = statsData?.unpublished !== undefined ? statsData.unpublished : properties.filter(p => !p.isPublished).length;
  const remainingSlots = statsData?.remaining !== undefined ? statsData.remaining : Math.max(0, 200 - totalCount);
  const topCities = statsData?.topCities || [];

  const stats = {
    total: totalCount,
    published: publishedCount,
    unpublished: unpublishedCount,
    remaining: remainingSlots,
    topCities
  };

  const handleEdit = (property) => {
    navigate(`/property-wallet/edit/${property._id}`);
  };

  const handleDelete = (property) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Property',
      message: `Are you sure you want to permanently delete "${property.title}" from your wallet? This will remove all owner info and revoke all shared links.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await axios.delete(`/api/wallet/${property._id}`);
          toast.success('Property removed from wallet');
          if (detailModal?._id === property._id) setDetailModal(null);
          queryClient.invalidateQueries({ queryKey: ['walletProperties'] });
          queryClient.invalidateQueries({ queryKey: ['walletStats'] });
        } catch {
          toast.error('Failed to delete property');
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleShare = (property) => {
    setShareModal(property);
  };

  const handleView = (property) => {
    setDetailModal(property);
  };

  const handleGenerateShare = async (propertyId, label) => {
    try {
      await axios.post(`/api/wallet/${propertyId}/share`, { label });
      toast.success('Share link generated!');
      queryClient.invalidateQueries({ queryKey: ['walletProperties'] });
      const res = await axios.get(`/api/wallet/${propertyId}`);
      setShareModal(res.data.data);
      if (detailModal?._id === propertyId) {
        setDetailModal(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate link');
    }
  };

  const handleRevokeShare = async (propertyId, tokenId) => {
    try {
      await axios.delete(`/api/wallet/${propertyId}/share/${tokenId}`);
      toast.success('Share link revoked');
      queryClient.invalidateQueries({ queryKey: ['walletProperties'] });
      const res = await axios.get(`/api/wallet/${propertyId}`);
      setShareModal(res.data.data);
      if (detailModal?._id === propertyId) {
        setDetailModal(res.data.data);
      }
    } catch {
      toast.error('Failed to revoke link');
    }
  };

  const handlePublish = (property) => {
    let areaVal = property.areaValue !== undefined && property.areaValue !== null ? String(property.areaValue) : '';
    let areaU = property.areaUnit || 'vigha_bada';
    if (!areaVal && property.area) {
      const match = String(property.area).match(/^([\d.]+)/);
      if (match) areaVal = match[1];
      const lowerArea = String(property.area).toLowerCase();
      if (lowerArea.includes('bigha') || lowerArea.includes('vigha')) areaU = 'vigha_bada';
      else if (lowerArea.includes('acre')) areaU = 'acre';
      else if (lowerArea.includes('guntha') || lowerArea.includes('gutha')) areaU = 'guntha';
      else if (lowerArea.includes('sqft') || lowerArea.includes('sq.ft') || lowerArea.includes('feet')) areaU = 'sqft';
      else if (lowerArea.includes('yard') || lowerArea.includes('gaj') || lowerArea.includes('vaar')) areaU = 'gaj';
      else if (lowerArea.includes('sqm') || lowerArea.includes('meter')) areaU = 'sqm';
      else if (lowerArea.includes('hectare')) areaU = 'hectare';
      else if (lowerArea.includes('aare')) areaU = 'aare';
    }

    const prefillData = {
      walletPropertyId: property._id,
      title: property.title || '',
      description: property.description || '',
      price: property.price || '',
      area: property.area || '',
      areaValue: areaVal,
      areaUnit: areaU,
      location: property.location || '',
      propertyType: property.propertyType || 'Land',
      landType: property.landType || '',
      city: property.city || '',
      locality: property.locality || '',
      images: property.images || []
    };
    sessionStorage.setItem('walletPrefill', JSON.stringify(prefillData));
    navigate('/create-listing?from=wallet');
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'Broker' && user.role !== 'Admin')) return null;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-32 sm:pb-24 font-['Nunito_Sans',sans-serif]">

      {/* ── Mobile Compact Header (99acres / MagicBricks App Style - Under 50px) ── */}
      <div className="sm:hidden bg-slate-950 text-white border-b border-slate-800 px-3 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white truncate">Property Wallet</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{stats.total} properties • {stats.remaining} slots left</p>
          </div>
        </div>

        <Link
          to="/property-wallet/add"
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white text-xs font-black rounded-lg uppercase tracking-wider shrink-0 shadow-sm active:scale-95"
        >
          <Plus size={14} />
          <span>Add</span>
        </Link>
      </div>

      {/* ── Executive Desktop Hero Banner (Hidden on Mobile) ── */}
      <div className="hidden sm:block bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-900/30 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Property Wallet
                </h1>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <Lock size={9} className="text-emerald-400" /> Private Digital Diary
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Your confidential broker portfolio — click any property to view full details & owner contact.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="hidden lg:flex flex-col items-end pr-3 border-r border-white/10">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diary Capacity</span>
              <span className="text-xs font-black text-emerald-400">{stats.total} / 200 Used</span>
            </div>
            <Link
              to="/property-wallet/add"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-black rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Add Property</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-3 sm:space-y-6">

        {/* ── Mobile Compact Stats Pill Bar (Single-Row, Fast Filter) ── */}
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1 ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold'}`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('private')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1 ${
              activeFilter === 'private'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <Lock size={11} className={activeFilter === 'private' ? 'text-emerald-300' : 'text-slate-400'} />
            <span>Private</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeFilter === 'private' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 font-bold'}`}>
              {stats.unpublished}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1 ${
              activeFilter === 'published'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <Globe size={11} className={activeFilter === 'published' ? 'text-indigo-200' : 'text-slate-400'} />
            <span>Live</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeFilter === 'published' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-800 font-bold'}`}>
              {stats.published}
            </span>
          </button>

          <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-black shrink-0 ml-auto">
            {stats.remaining} Left
          </div>
        </div>

        {/* ── Executive 4-Stat Metric Cards (Desktop Only) ── */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <StatCard
            icon={Briefcase}
            title="Total Inventory"
            value={stats.total}
            subtitle="Properties in your diary"
            color="emerald"
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <StatCard
            icon={Lock}
            title="Private (Diary)"
            value={stats.unpublished}
            subtitle="100% confidential to you"
            color="slate"
            active={activeFilter === 'private'}
            onClick={() => setActiveFilter('private')}
          />
          <StatCard
            icon={Globe}
            title="Marketplace Live"
            value={stats.published}
            subtitle="Published on Kharsan"
            color="indigo"
            active={activeFilter === 'published'}
            onClick={() => setActiveFilter('published')}
          />
          <StatCard
            icon={PackageOpen}
            title="Slots Remaining"
            value={stats.remaining}
            subtitle="Out of 200 free limit"
            color="amber"
          />
        </div>

        {/* ── Unified Search & Action Toolbar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-5 shadow-xs space-y-2.5 sm:space-y-4">
          
          {/* Top Row: Search Input + Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search city, title, owner, tags..."
                className="w-full pl-9 pr-8 py-2 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm font-bold outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Desktop Quick Dropdowns */}
            <div className="hidden md:flex items-center gap-2.5">
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All Cities</option>
                {stats.topCities?.filter(c => c.city).map(c => (
                  <option key={c.city} value={c.city}>{c.city} ({c.count})</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="Land">Land</option>
                <option value="Plot">Plot</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="title">Title A → Z</option>
              </select>
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden p-2 rounded-xl border font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                showFilters || cityFilter || typeFilter || sortBy !== 'newest'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Filters"
            >
              <SlidersHorizontal size={15} />
              {cityFilter || typeFilter ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> : null}
            </button>

            {/* View Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-0.5 sm:p-1 border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`w-7 h-7 sm:w-auto sm:px-3 sm:py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs font-black transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-400 sm:text-slate-500'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`w-7 h-7 sm:w-auto sm:px-3 sm:py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs font-black transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-400 sm:text-slate-500'
                }`}
                title="List View"
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Desktop Tab Filter Bar (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center justify-between gap-3 pt-3 flex-wrap border-t border-slate-100">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setActiveFilter('private')}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeFilter === 'private'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Lock size={11} className={activeFilter === 'private' ? 'text-emerald-400' : 'text-slate-500'} />
                Private Diary ({stats.unpublished})
              </button>
              <button
                onClick={() => setActiveFilter('published')}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeFilter === 'published'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Globe size={11} />
                Marketplace Live ({stats.published})
              </button>
            </div>

            {/* Popular Cities tags on Desktop */}
            {stats.topCities && stats.topCities.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Top Cities:</span>
                {stats.topCities.filter(c => c.city).slice(0, 4).map(c => (
                  <button
                    key={c.city}
                    onClick={() => setCityFilter(cityFilter === c.city ? '' : c.city)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                      cityFilter === c.city
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.city} ({c.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Filter Drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-2 border-t border-slate-100 md:hidden"
              >
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">City Filter</label>
                    <input
                      type="text"
                      value={cityFilter}
                      onChange={e => setCityFilter(e.target.value)}
                      placeholder="e.g. Palanpur, Deesa..."
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</label>
                      <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">All Types</option>
                        <option value="Land">Land</option>
                        <option value="Plot">Plot</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sort</label>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className={inputCls}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="title">Title A → Z</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Active Filter Chips & Result Counter ── */}
        <div className="flex items-center justify-between px-1 flex-wrap gap-2 text-xs">
          <p className="font-bold text-slate-600">
            {isLoading ? (
              <span>Loading properties...</span>
            ) : (
              <span>
                Showing <strong className="font-black text-slate-900">{properties.length}</strong> {properties.length === 1 ? 'property' : 'properties'}
                {searchQuery && <span className="text-emerald-700 font-bold"> for "{searchQuery}"</span>}
                {cityFilter && <span className="text-slate-500"> in {cityFilter}</span>}
              </span>
            )}
          </p>

          {(searchQuery || cityFilter || typeFilter || activeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCityFilter('');
                setTypeFilter('');
                setActiveFilter('all');
              }}
              className="text-[11px] font-black text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 hover:underline"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {/* ── Properties Grid / List Display ── */}
        {isLoading ? (
          viewMode === 'grid' ? <WalletGridSkeleton /> : <WalletListSkeleton />
        ) : properties.length === 0 ? (
          
          /* ── Empty State ── */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-10 shadow-xs text-center">
            {searchQuery || cityFilter ? (
              <div className="max-w-md mx-auto py-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                  <Search size={24} />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">No Matching Properties</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-4">
                  No properties matched your current filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setCityFilter(''); setTypeFilter(''); }}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto">
                  <Briefcase size={28} />
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Your Property Wallet is Empty
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                  Add properties from your offline diary. Real owner details stay 100% confidential until you share or publish them.
                </p>
                <div className="pt-2">
                  <Link
                    to="/property-wallet/add"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Add First Property</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6"
              >
                {properties.map(p => (
                  <PropertyCard
                    key={p._id}
                    property={p}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onPublish={handlePublish}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {properties.map(p => (
                  <PropertyRow
                    key={p._id}
                    property={p}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onPublish={handlePublish}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmModal && <ConfirmModal {...confirmModal} />}

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {shareModal && (
          <ShareLinksModal
            isOpen={!!shareModal}
            property={shareModal}
            onClose={() => setShareModal(null)}
            onGenerate={handleGenerateShare}
            onRevoke={handleRevokeShare}
          />
        )}
      </AnimatePresence>

      {/* ── Property Detail Inspector Modal ── */}
      <AnimatePresence>
        {detailModal && (
          <PropertyDetailModal
            property={detailModal}
            onClose={() => setDetailModal(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyWallet;
