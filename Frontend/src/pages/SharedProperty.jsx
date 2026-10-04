import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin, IndianRupee, Layers, Building2, Phone, User, Tag,
  Clock, AlertCircle, ArrowLeft, Share2, ExternalLink, ChevronLeft, ChevronRight,
  ShieldCheck, MessageCircle
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const SharedProperty = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = React.useState(0);

  const { data: propertyData, isLoading, isError, error } = useQuery({
    queryKey: ['sharedProperty', token],
    enabled: !!token,
    queryFn: async () => {
      const res = await axios.get(`/api/wallet/shared/${token}`);
      return res.data.data;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error?.response?.data?.error || 'This share link is invalid or has expired.';
    const statusCode = error?.response?.status;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 font-['Nunito_Sans',sans-serif]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-rose-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            {statusCode === 410 ? 'Link Expired' : 'Link Not Found'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  const property = propertyData;
  const hasImages = property.images && property.images.length > 0;
  const broker = property.broker;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-24 font-['Nunito_Sans',sans-serif]">

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
              <Share2 size={15} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Shared Property</p>
              <p className="text-[10px] font-semibold text-slate-400">Presented by Broker via S+ Properties</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-[10px] font-black text-slate-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>Explore</span> <ExternalLink size={11} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3.5 sm:px-6 space-y-3.5 sm:space-y-4 pt-3.5 sm:pt-5">

        {/* Image Gallery */}
        {hasImages && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[16/10] sm:aspect-[16/9] border border-slate-200/80 shadow-2xs">
            <img
              src={getImageUrl(property.images[currentImage])}
              alt=""
              className="w-full h-full object-cover"
            />
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer hover:bg-slate-900"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === property.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer hover:bg-slate-900"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2.5 right-2.5 bg-slate-900/70 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {currentImage + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Property Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs"
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              {property.propertyType || 'Land'}
            </span>
            {property.landType && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {property.landType}
              </span>
            )}
          </div>

          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {property.title}
          </h1>

          {property.location && (
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1.5">
              <MapPin size={13} className="text-emerald-600 shrink-0" />
              <span>{property.location}</span>
            </p>
          )}

          {/* Pricing & Area Box */}
          <div className="grid grid-cols-2 gap-3 mt-4 p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asking Price</p>
              <p className="text-base sm:text-xl font-black text-emerald-700 mt-0.5">
                {property.price ? `₹${property.price.toLocaleString('en-IN')}` : property.priceLabel || 'Price on Request'}
              </p>
            </div>
            {property.area && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Area</p>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{property.area}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {property.tags.map((tag, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                  <Tag size={9} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">Property Details</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>
          )}
        </motion.div>

        {/* Broker Contact Card */}
        {broker && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Contact Authorized Broker</p>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center font-black text-base overflow-hidden shrink-0">
                  {broker.profileImage ? (
                    <img src={getImageUrl(broker.profileImage)} alt={broker.name} className="w-full h-full object-cover" />
                  ) : (
                    broker.name?.[0]?.toUpperCase() || 'B'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-slate-900">{broker.name}</h4>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Broker
                    </span>
                  </div>
                  {broker.phone && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">+91 {broker.phone}</p>
                  )}
                </div>
              </div>

              {broker.phone && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`tel:+91${broker.phone.replace(/\s+/g, '')}`}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <a
                    href={`https://wa.me/91${broker.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(`Hi ${broker.name}, I am interested in your property "${property.title}" (Shared via S+ Properties). Please share more details.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharedProperty;
