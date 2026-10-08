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
  ChevronLeft, ChevronRight, Calendar, Info, Table, ArrowLeftRight, EyeOff,
  ArrowUpDown
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

// ── Compact Stat Pill ──
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'emerald', active = false, onClick }) => {
  const styles = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      activeRing: 'ring-1.5 ring-emerald-500 border-emerald-500 bg-emerald-50/30',
      val: 'text-emerald-900',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-600 border-slate-200',
      activeRing: 'ring-1.5 ring-slate-700 border-slate-700 bg-slate-50/50',
      val: 'text-slate-900',
    },
    indigo: {
      icon: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      activeRing: 'ring-1.5 ring-indigo-500 border-indigo-500 bg-indigo-50/30',
      val: 'text-indigo-900',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600 border-amber-200',
      activeRing: 'ring-1.5 ring-amber-500 border-amber-500 bg-amber-50/30',
      val: 'text-amber-900',
    }
  };
  const s = styles[color] || styles.emerald;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border px-3 py-2.5 shadow-2xs transition-all duration-150 flex items-center gap-2.5 cursor-pointer group hover:shadow-sm ${
        active ? s.activeRing : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${s.icon}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-black ${s.val} leading-none`}>{value}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</span>
        </div>
        <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
};

// ── Custom Shimmer Skeletons ──
const WalletExcelSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs animate-pulse space-y-3">
    <div className="h-8 bg-slate-100 rounded-lg w-full mb-2" />
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full flex items-center px-3 justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/6" />
        <div className="h-4 bg-slate-200 rounded w-1/6" />
        <div className="h-4 bg-slate-200 rounded w-1/8" />
      </div>
    ))}
  </div>
);

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

// ── Column Definitions for Excel Sheet View ──
const WALLET_COLUMNS = [
  { id: 'title', label: 'Title & Property', width: 'min-w-[200px] w-64', filterType: 'title' },
  { id: 'location', label: 'City & Location', width: 'w-44', filterType: 'city' },
  { id: 'propertyType', label: 'Type (Land/Plot)', width: 'w-32', filterType: 'type' },
  { id: 'area', label: 'Area / Size', width: 'w-32', filterType: 'area' },
  { id: 'price', label: 'Price / Cost', width: 'w-36', filterType: 'price' },
  { id: 'owner', label: 'Confidential Owner', width: 'w-44', filterType: 'owner' },
  { id: 'share', label: 'Share', width: 'w-28 text-center', filterType: null }
];

// ── Interactive Excel Spreadsheet Table View Component ──
const ExcelSpreadsheetView = ({ properties, onView, onEdit, onDelete, onShare, onPublish }) => {
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  const [filters, setFilters] = useState({
    titleSearch: '',
    city: '',
    type: '',
    ownerSearch: '',
    sortBy: 'default' // 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'title_asc' | 'title_desc' | 'city_asc' | 'city_desc'
  });

  // Unique cities from properties
  const uniqueCities = React.useMemo(() => {
    const map = {};
    (properties || []).forEach(p => {
      const c = p.city || (p.location ? p.location.split(',')[0].trim() : null);
      if (c) map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
  }, [properties]);

  // Unique types from properties
  const uniqueTypes = React.useMemo(() => {
    const set = new Set(['Land', 'Plot']);
    (properties || []).forEach(p => {
      if (p.propertyType) set.add(p.propertyType);
      if (p.plotType && p.plotType !== 'None') set.add(p.plotType);
      if (p.landType && p.landType !== 'Standard') set.add(p.landType);
    });
    return Array.from(set);
  }, [properties]);

  // Client-side instant filtering & sorting
  const filteredProperties = React.useMemo(() => {
    let list = [...(properties || [])];

    if (filters.titleSearch.trim()) {
      const q = filters.titleSearch.toLowerCase();
      list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q));
    }

    if (filters.city) {
      list = list.filter(p => {
        const c = (p.city || '').toLowerCase();
        const loc = (p.location || '').toLowerCase();
        const target = filters.city.toLowerCase();
        return c === target || loc.includes(target);
      });
    }

    if (filters.type) {
      list = list.filter(p => {
        const pt = (p.propertyType || '').toLowerCase();
        const plt = (p.plotType || '').toLowerCase();
        const lt = (p.landType || '').toLowerCase();
        const target = filters.type.toLowerCase();
        return pt === target || plt === target || lt === target;
      });
    }

    if (filters.ownerSearch.trim()) {
      const q = filters.ownerSearch.toLowerCase();
      list = list.filter(p => (p.ownerName || '').toLowerCase().includes(q) || (p.ownerPhone || '').includes(q));
    }

    // Sorting
    if (filters.sortBy === 'price_asc') {
      list.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (filters.sortBy === 'price_desc') {
      list.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (filters.sortBy === 'area_asc') {
      list.sort((a, b) => (parseFloat(a.area) || 0) - (parseFloat(b.area) || 0));
    } else if (filters.sortBy === 'area_desc') {
      list.sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0));
    } else if (filters.sortBy === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.sortBy === 'title_desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (filters.sortBy === 'city_asc') {
      list.sort((a, b) => (a.city || a.location || '').localeCompare(b.city || b.location || ''));
    } else if (filters.sortBy === 'city_desc') {
      list.sort((a, b) => (b.city || b.location || '').localeCompare(a.city || a.location || ''));
    }

    return list;
  }, [properties, filters]);

  const hasActiveFilters = Boolean(
    filters.titleSearch ||
    filters.city ||
    filters.type ||
    filters.ownerSearch ||
    filters.sortBy !== 'default'
  );

  const resetAllFilters = () => {
    setFilters({
      titleSearch: '',
      city: '',
      type: '',
      ownerSearch: '',
      sortBy: 'default'
    });
    setActiveFilterCol(null);
  };

  if (!properties || properties.length === 0) return null;

  // Helper to render cell data based on column ID
  const renderCellContent = (colId, property) => {
    const hasImages = property.images && property.images.length > 0;

    switch (colId) {
      case 'title':
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {hasImages ? (
                <img src={getImageUrl(property.images[0])} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={15} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 group-hover:text-emerald-700 truncate text-[13px] leading-tight">
                {property.title || 'Untitled Property'}
              </div>
              {property.location && (
                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {property.location}
                </div>
              )}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[12px]">
              <MapPin size={12} className="text-emerald-600 shrink-0" />
              <span className="truncate">{property.location || property.city || 'Unspecified'}</span>
            </div>
            {property.locality && (
              <div className="text-[11px] text-slate-500 font-medium truncate pl-4.5 mt-0.5">
                {property.locality}
              </div>
            )}
          </div>
        );

      case 'propertyType':
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
              {property.propertyType || 'Land'}
            </span>
            {property.plotType && property.plotType !== 'None' && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                {property.plotType}
              </span>
            )}
          </div>
        );

      case 'area':
        return (
          <span className="font-mono font-bold text-slate-800 text-[12px]">
            {property.area || '—'}
          </span>
        );

      case 'price':
        return (
          <span className="font-mono font-black text-emerald-800 text-[13px]">
            {property.price ? `₹${property.price.toLocaleString('en-IN')}` : (property.priceLabel || 'On Request')}
          </span>
        );

      case 'owner':
        return (
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate text-[12px]">
              {property.ownerName || 'Confidential'}
            </div>
            {property.ownerPhone ? (
              <a
                href={`tel:${property.ownerPhone.replace(/\s+/g, '')}`}
                onClick={e => e.stopPropagation()}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Phone size={10} /> {property.ownerPhone}
              </a>
            ) : (
              <div className="text-[10px] text-slate-400 font-medium">No phone</div>
            )}
          </div>
        );

      case 'share':
        return (
          <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onShare(property); }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
              title="Share property link"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          </div>
        );

      default:
        return <span className="text-slate-600 font-medium text-[12px]">{property[colId] || '—'}</span>;
    }
  };

  const isColFiltered = (colId) => {
    if (colId === 'title') return Boolean(filters.titleSearch || filters.sortBy.startsWith('title'));
    if (colId === 'location') return Boolean(filters.city || filters.sortBy.startsWith('city'));
    if (colId === 'propertyType') return Boolean(filters.type);
    if (colId === 'price') return filters.sortBy.startsWith('price');
    if (colId === 'area') return filters.sortBy.startsWith('area');
    if (colId === 'owner') return Boolean(filters.ownerSearch);
    return false;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans space-y-0">
      {/* Active Filter Bar (shown only if filters are applied) */}
      {hasActiveFilters && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-950 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold">
            <Filter size={13} className="text-emerald-700" />
            <span>Showing {filteredProperties.length} of {properties.length} records</span>
            {filters.city && <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">City: {filters.city}</span>}
            {filters.type && <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">Type: {filters.type}</span>}
            {filters.titleSearch && <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">Title: "{filters.titleSearch}"</span>}
            {filters.ownerSearch && <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">Owner: "{filters.ownerSearch}"</span>}
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-emerald-800 hover:text-emerald-950 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <X size={13} /> Reset Filters
          </button>
        </div>
      )}

      {/* ── Mobile View: Production-Grade Mobile Cards List (for 90% Mobile Users) ── */}
      <div className="sm:hidden space-y-2.5 p-2 bg-slate-100/60 rounded-2xl">
        {/* Mobile Quick Filter & Sort Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 pt-0.5 px-0.5">
          <button
            type="button"
            onClick={() => setActiveFilterCol('location')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              filters.city ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <MapPin size={11} className={filters.city ? 'text-emerald-200' : 'text-emerald-600'} />
            <span>{filters.city ? `${filters.city}` : 'All Cities'}</span>
            <ChevronDown size={11} className="opacity-70" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterCol('propertyType')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              filters.type ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Tag size={11} className={filters.type ? 'text-emerald-200' : 'text-slate-500'} />
            <span>{filters.type ? `${filters.type}` : 'All Types'}</span>
            <ChevronDown size={11} className="opacity-70" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterCol('price')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              filters.sortBy.startsWith('price') ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <ArrowUpDown size={11} className={filters.sortBy.startsWith('price') ? 'text-emerald-200' : 'text-slate-500'} />
            <span>Price Sort</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterCol('title')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              filters.titleSearch ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Search size={11} className={filters.titleSearch ? 'text-emerald-200' : 'text-slate-500'} />
            <span>Search</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <X size={11} /> Reset
            </button>
          )}
        </div>

        {/* Mobile Property Cards List */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 space-y-2">
            <p className="text-xs font-bold text-slate-800">No properties match your filter</p>
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-emerald-700 underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredProperties.map((property, idx) => {
            const hasImages = property.images && property.images.length > 0;
            return (
              <div
                key={property._id}
                onClick={() => onView(property)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Header: Thumbnail + Title + Location + Type Badge */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {hasImages ? (
                      <img src={getImageUrl(property.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={20} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="font-black text-slate-900 text-sm truncate leading-tight">
                        {property.title || 'Untitled Property'}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {property.propertyType || 'Land'}
                      </span>
                    </div>

                    {property.location && (
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={11} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Box: Price & Area */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Asking Price</span>
                    <span className="text-sm font-black text-emerald-800">
                      {property.price ? `₹${property.price.toLocaleString('en-IN')}` : (property.priceLabel || 'On Request')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Area / Size</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {property.area || '—'}
                    </span>
                  </div>
                </div>

                {/* Confidential Owner Info & 1-Tap Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Owner Contact</span>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {property.ownerName || 'Confidential'}
                    </div>
                  </div>

                  {/* 1-Tap Direct Call */}
                  {property.ownerPhone && (
                    <a
                      href={`tel:${property.ownerPhone.replace(/\s+/g, '')}`}
                      onClick={e => e.stopPropagation()}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                      title="Call Owner"
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </a>
                  )}

                  {/* 1-Tap Direct Share */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(property);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Share2 size={13} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop View: Spreadsheet Table with Column Header Filter Popovers (for Tablet & Desktop) ── */}
      <div className="hidden sm:block overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-full">
          {/* Table Headers */}
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[11px] font-black border-b border-slate-200 select-none uppercase tracking-wider">
              <th className="w-12 py-3 px-3 text-center border-r border-slate-200 bg-slate-100/70 text-slate-500 font-mono">
                #
              </th>

              {WALLET_COLUMNS.map((colDef) => {
                const isFiltered = isColFiltered(colDef.id);
                const hasFilter = Boolean(colDef.filterType);

                return (
                  <th
                    key={colDef.id}
                    className={`py-3 px-3.5 border-r border-slate-200 group transition-colors ${hasFilter ? 'cursor-pointer hover:bg-slate-100' : ''} ${colDef.width} ${isFiltered ? 'bg-emerald-50/70 text-emerald-900' : ''}`}
                    onClick={() => {
                      if (hasFilter) {
                        setActiveFilterCol(activeFilterCol === colDef.id ? null : colDef.id);
                      }
                    }}
                    title={hasFilter ? `Click to filter or sort by ${colDef.label}` : colDef.label}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-black text-[11px] tracking-wider">{colDef.label}</span>
                      {hasFilter && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isFiltered ? (
                            <Filter size={11} className="text-emerald-700 fill-emerald-700" />
                          ) : (
                            <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-700 transition-transform opacity-60 group-hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Spreadsheet Rows */}
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {filteredProperties.length === 0 ? (
              <tr>
                <td colSpan={WALLET_COLUMNS.length + 1} className="py-8 text-center text-slate-500">
                  <p className="font-bold text-sm text-slate-700">No properties match your filter</p>
                  <button
                    onClick={resetAllFilters}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredProperties.map((property, idx) => (
                <tr
                  key={property._id}
                  onClick={() => onView(property)}
                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                >
                  {/* Row Number */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/60 text-slate-500 font-mono text-[11px] font-bold group-hover:bg-emerald-50 group-hover:text-emerald-900">
                    {idx + 1}
                  </td>

                  {/* Columns */}
                  {WALLET_COLUMNS.map((colDef) => (
                    <td key={colDef.id} className="py-3 px-3.5 border-r border-slate-100">
                      {renderCellContent(colDef.id, property)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Excel-Style Column Header Filter Popover Dialog ── */}
      {activeFilterCol && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveFilterCol(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Filter size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {activeFilterCol === 'location' && 'City & Location Filter'}
                  {activeFilterCol === 'propertyType' && 'Property Type Filter'}
                  {activeFilterCol === 'price' && 'Price Sorting & Filter'}
                  {activeFilterCol === 'area' && 'Area / Size Sorting'}
                  {activeFilterCol === 'title' && 'Title Search & Sort'}
                  {activeFilterCol === 'owner' && 'Owner Search'}
                </h3>
              </div>
              <button
                onClick={() => setActiveFilterCol(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Popover Body by Column Type */}
            {activeFilterCol === 'location' && (
              <div className="space-y-3">
                {/* Sort options */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sort Order</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'city_asc' ? 'default' : 'city_asc' })); }}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all text-left ${filters.sortBy === 'city_asc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      City: A → Z
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'city_desc' ? 'default' : 'city_desc' })); }}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all text-left ${filters.sortBy === 'city_desc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      City: Z → A
                    </button>
                  </div>
                </div>

                {/* Cities List */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Select City</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, city: '' }))}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${!filters.city ? 'bg-emerald-50 text-emerald-900 font-black border border-emerald-200' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <span>All Cities</span>
                      <span className="text-[11px] text-slate-400">({properties.length})</span>
                    </button>
                    {uniqueCities.map(({ city, count }) => {
                      const isSelected = filters.city.toLowerCase() === city.toLowerCase();
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setFilters(prev => ({ ...prev, city: isSelected ? '' : city }))}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${isSelected ? 'bg-emerald-50 text-emerald-900 font-black border border-emerald-200' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span className="truncate">{city}</span>
                          <span className="text-[11px] text-slate-400">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeFilterCol === 'propertyType' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Property Type</label>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, type: '' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${!filters.type ? 'bg-emerald-50 text-emerald-900 font-black border border-emerald-200' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>All Types</span>
                    {!filters.type && <Check size={14} className="text-emerald-700" />}
                  </button>
                  {uniqueTypes.map(t => {
                    const isSelected = filters.type.toLowerCase() === t.toLowerCase();
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, type: isSelected ? '' : t }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${isSelected ? 'bg-emerald-50 text-emerald-900 font-black border border-emerald-200' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        <span>{t}</span>
                        {isSelected && <Check size={14} className="text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeFilterCol === 'price' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sort by Price</label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'price_asc' ? 'default' : 'price_asc' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${filters.sortBy === 'price_asc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>Price: Low → High</span>
                    {filters.sortBy === 'price_asc' && <Check size={14} className="text-emerald-700" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'price_desc' ? 'default' : 'price_desc' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${filters.sortBy === 'price_desc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>Price: High → Low</span>
                    {filters.sortBy === 'price_desc' && <Check size={14} className="text-emerald-700" />}
                  </button>
                </div>
              </div>
            )}

            {activeFilterCol === 'area' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sort by Area / Size</label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'area_asc' ? 'default' : 'area_asc' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${filters.sortBy === 'area_asc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>Area: Smallest → Largest</span>
                    {filters.sortBy === 'area_asc' && <Check size={14} className="text-emerald-700" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'area_desc' ? 'default' : 'area_desc' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${filters.sortBy === 'area_desc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>Area: Largest → Smallest</span>
                    {filters.sortBy === 'area_desc' && <Check size={14} className="text-emerald-700" />}
                  </button>
                </div>
              </div>
            )}

            {activeFilterCol === 'title' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Search Title</label>
                  <input
                    type="text"
                    value={filters.titleSearch}
                    onChange={e => setFilters(prev => ({ ...prev, titleSearch: e.target.value }))}
                    placeholder="e.g. 5 vigha, plot, farmhouse..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'title_asc' ? 'default' : 'title_asc' }))}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all text-left ${filters.sortBy === 'title_asc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Title: A → Z
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'title_desc' ? 'default' : 'title_desc' }))}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all text-left ${filters.sortBy === 'title_desc' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Title: Z → A
                  </button>
                </div>
              </div>
            )}

            {activeFilterCol === 'owner' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Search Confidential Owner</label>
                <input
                  type="text"
                  value={filters.ownerSearch}
                  onChange={e => setFilters(prev => ({ ...prev, ownerSearch: e.target.value }))}
                  placeholder="e.g. Ramshbhai, 95096..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Popover Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeFilterCol === 'location') setFilters(prev => ({ ...prev, city: '', sortBy: prev.sortBy.startsWith('city') ? 'default' : prev.sortBy }));
                  if (activeFilterCol === 'propertyType') setFilters(prev => ({ ...prev, type: '' }));
                  if (activeFilterCol === 'price') setFilters(prev => ({ ...prev, sortBy: prev.sortBy.startsWith('price') ? 'default' : prev.sortBy }));
                  if (activeFilterCol === 'area') setFilters(prev => ({ ...prev, sortBy: prev.sortBy.startsWith('area') ? 'default' : prev.sortBy }));
                  if (activeFilterCol === 'title') setFilters(prev => ({ ...prev, titleSearch: '', sortBy: prev.sortBy.startsWith('title') ? 'default' : prev.sortBy }));
                  if (activeFilterCol === 'owner') setFilters(prev => ({ ...prev, ownerSearch: '' }));
                  setActiveFilterCol(null);
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear This Filter
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterCol(null)}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Property Card (Grid View) ──
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

// ── Property Row (List View) ──
const PropertyRow = ({ property, onView, onEdit, onDelete, onShare, onPublish }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const hasImages = property.images && property.images.length > 0;
  const isPublished = property.isPublished;

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
        </div>
      </div>

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
  const [viewMode, setViewMode] = useState('excel'); // Default Excel Spreadsheet View!
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
  const { data: propertiesData, isLoading, refetch } = useQuery({
    queryKey: ['walletProperties', searchQuery, activeFilter, cityFilter, typeFilter, sortBy],
    enabled: !!user && (user.role === 'Broker' || user.role === 'Admin'),
    queryFn: async () => {
      const params = buildQueryParams();
      const res = await axios.get('/api/wallet', { params });
      return res.data;
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['walletStats'],
    enabled: !!user && (user.role === 'Broker' || user.role === 'Admin'),
    queryFn: async () => {
      const res = await axios.get('/api/wallet/stats');
      return res.data.data;
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0
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

      {/* ── Mobile Compact Header ── */}
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

      {/* ── Executive Desktop Hero Banner ── */}
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
                Your confidential broker portfolio — click any property to view full in-depth details & owner contact.
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

        {/* ── Executive 4-Stat Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <StatCard
            icon={Briefcase}
            title="Total Inventory"
            value={stats.total}
            subtitle="Properties in your diary"
            color="emerald"
            active={false}
          />
          <StatCard
            icon={Lock}
            title="Private (Diary)"
            value={stats.unpublished}
            subtitle="100% confidential to you"
            color="slate"
            active={false}
          />
          <StatCard
            icon={Globe}
            title="Marketplace Live"
            value={stats.published}
            subtitle="Published on Kharsan"
            color="indigo"
            active={false}
          />
          <StatCard
            icon={PackageOpen}
            title="Slots Remaining"
            value={stats.remaining}
            subtitle="Out of 200 free limit"
            color="amber"
          />
        </div>

        {/* ── Properties Display (Excel / Grid / List) ── */}
        {isLoading ? (
          viewMode === 'excel' ? <WalletExcelSkeleton /> : viewMode === 'grid' ? <WalletGridSkeleton /> : <WalletListSkeleton />
        ) : properties.length === 0 ? (
          
          /* ── Empty State ── */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-10 shadow-xs text-center">
            {searchQuery || cityFilter ? (
              <div className="max-w-md mx-auto py-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                  <Search size={26} />
                </div>
                <h3 className="text-base font-black text-slate-900">No properties found</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-4">No records matched your search filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setCityFilter(''); setTypeFilter(''); setActiveFilter('all'); }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto py-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Your Property Wallet is Empty</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
                  Save private land details, survey numbers, and confidential owner contact numbers directly to your diary.
                </p>
                <Link
                  to="/property-wallet/add"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  <Plus size={16} />
                  <span>Add First Property</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          viewMode === 'excel' ? (
            <ExcelSpreadsheetView
              properties={properties}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              onPublish={handlePublish}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
              {properties.map(property => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map(property => (
                <PropertyRow
                  key={property._id}
                  property={property}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          )
        )}

      </div>

      {/* ── Modals ── */}
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

      {shareModal && (
        <ShareLinksModal
          isOpen={!!shareModal}
          onClose={() => setShareModal(null)}
          property={shareModal}
          onGenerate={handleGenerateShare}
          onRevoke={handleRevokeShare}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      )}

    </div>
  );
};

export default PropertyWallet;
