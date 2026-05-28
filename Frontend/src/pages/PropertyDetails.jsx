import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Heart, Share2, MapPin, Calendar, CheckCircle2, Phone, ChevronRight,
    ArrowLeft, Maximize2, Eye, LandPlot, UserCheck, FileText, Users,
    ShieldCheck, Download, MessageSquare, ExternalLink, Image, Clock,
    Check, X, Zap, ZapOff, Award, Star, StarHalf, StarOff, UserRound, MessageCircle, Navigation, Layers,
    SlidersHorizontal
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import { useQuery } from '@tanstack/react-query';
import ErrorBox from '../components/ErrorBox';
import DetailSkeleton from '../components/DetailSkeleton';
import { getImageUrl } from '../utils/imageUrl';
import SEO from '../components/SEO';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

function MapRecenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position?.lat) {
            map.setView([position.lat, position.lng], 15);
        }
    }, [position, map]);
    return null;
}

const PropertyDetails = () => {
    const { id } = useParams();
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const { user, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [displayUnit, setDisplayUnit] = useState('Sq. Ft');
    const [originalAreaValue, setOriginalAreaValue] = useState(0);
    const [originalUnit, setOriginalUnit] = useState('Sq. Ft');
    // const [ownerInquiries, setOwnerInquiries] = useState(0);
    const [requestingVisit, setRequestingVisit] = useState(false);
    // const [requestingContact, setRequestingContact] = useState(false); /* for commented Send Message button */

    // Review states
    // reviewsData from useQuery data
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    // reviewsLoading from useQuery

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const conversionFactors = {
        'Sq. Ft': 1.0,
        'Sq. Mtr': 0.0929,
        'Sq. Yard': 0.1111,
        'Hectare': 0.00000929,
        'Acre': 0.0000229568
    };

    const { data: listing, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['listing', id],
        queryFn: async () => {
            const res = await axios.get(`/api/listings/${id}`);
            return res.data.data;
        }
    });

    const getFormattedType = () => {
        if (!listing) return 'Plot / Land';
        if (listing.propertyType === 'Plot') {
            return listing.plotType && listing.plotType !== 'None'
                ? `${listing.plotType} Plot`
                : 'Plot';
        } else if (listing.propertyType === 'Land') {
            return listing.landType && listing.landType !== 'None'
                ? `${listing.landType} Land`
                : 'Land';
        }
        return 'Plot / Land';
    };

    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
        queryKey: ['reviews', id],
        queryFn: async () => {
            const res = await axios.get(`/api/listings/${id}/reviews`);
            return res.data;
        }
    });

    useEffect(() => {
        if (listing) {
            const areaStr = listing.area || '';
            const match = areaStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].trim();
                setOriginalAreaValue(value);
                const foundUnit = Object.keys(conversionFactors).find(u =>
                    unit.toLowerCase().includes(u.toLowerCase()) ||
                    (u === 'Sq. Yard' && (unit.toLowerCase().includes('yard') || unit.toLowerCase().includes('gaj')))
                );
                if (foundUnit) {
                    setOriginalUnit(foundUnit);
                    setDisplayUnit(foundUnit);
                }
            }
            if (user && user.favorites) {
                const isSaved = user.favorites.some(fav => {
                    if (typeof fav === 'string') return fav === id;
                    if (typeof fav === 'object' && fav !== null) return (fav._id || fav.id) === id;
                    return false;
                });
                setIsFavorite(isSaved);
            }
        }
    }, [conversionFactors, listing, user]);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        if (id && !sessionStorage.getItem(`viewed_${id}`)) {
            axios.post(`/api/listings/${id}/view`).catch(e => console.error(e));
            sessionStorage.setItem(`viewed_${id}`, 'true');
        }

        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, [id]);

    const getConvertedArea = () => {
        if (!originalAreaValue) return listing?.area;
        const baseSqFt = originalAreaValue / conversionFactors[originalUnit];
        const convertedValue = baseSqFt * conversionFactors[displayUnit];
        if (convertedValue < 0.01) return convertedValue.toFixed(6);
        if (convertedValue < 1) return convertedValue.toFixed(4);
        return convertedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const handleFavorite = async () => {
        if (!isAuthenticated) return navigate('/login');
        try {
            const res = await axios.post(`/api/auth/favorites/${id}`);
            if (user && res.data && res.data.data) {
                user.favorites = res.data.data;
            }
            const nextState = !isFavorite;
            setIsFavorite(nextState);
            toast.success(nextState ? 'Added to favorites!' : 'Removed from favorites');
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error('Failed to update favorites');
        }
    };

    const handleSiteVisitRequest = async () => {
        if (!isAuthenticated) return navigate('/login');
        setRequestingVisit(true);
        try {
            await axios.post('/api/inquiries', {
                listingId: id,
                type: 'SiteVisit',
                message: 'I would like to schedule a site visit for this property. Please suggest available dates and contact me to arrange.'
            });
            toast.success('Site visit request sent to seller! They will contact you soon.');
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error('Failed to send site visit request. Please try again.');
        } finally {
            setRequestingVisit(false);
        }
    };

    const handleReserveToken = async () => {
        if (!isAuthenticated) return navigate('/login');
        setSubmitting(true);
        try {
            // 1. Create Razorpay order
            const { data } = await axios.post('/api/payments/create-order', {
                listingId: id
            });

            // 2. Open Razorpay checkout (demo/test mode)
            const options = {
                key: data.key, // Razorpay public key
                amount: data.amount, // in paise
                currency: 'INR',
                name: 'LandSelling Token',
                description: `Reserve ${listing.title}`,
                order_id: data.orderId,
                handler: async function (response) {
                    // 3. Verify payment on backend
                    const verifyRes = await axios.post('/api/payments/verify', response);
                    if (verifyRes.data.success) {
                        toast.success('Property reserved successfully! Receipt: ' + verifyRes.data.receiptNumber);
                        setReceiptData(verifyRes.data.transaction || verifyRes.data);
                        setShowReceipt(true);
                        refetch(); // Refresh listing
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: {
                    color: '#1a2340'
                },
                modal: {
                    ondismiss: function () {
                        toast.info('Payment cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Payment error:', err);
            toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWhatsApp = () => {
        const phone = listing.createdBy?.phone || '';
        const message = encodeURIComponent(`Hi, I am interested in your property: ${listing.title} (${window.location.href}). Can we discuss further?`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.info('Link copied to clipboard!');
    };

    if (isLoading) return <DetailSkeleton />;
    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;
    if (!listing) return <div className="py-20 text-center"><p className="text-gray-500">Property not found</p></div>;

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to add a review');
            navigate('/login');
            return;
        }
        if (!newReview.comment.trim()) {
            toast.error('Please add a comment');
            return;
        }

        setSubmittingReview(true);
        try {
            await axios.post(`/api/listings/${id}/reviews`, newReview);
            toast.success('Review added successfully!');
            setNewReview({ rating: 5, comment: '' });
            refetchReviews();
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderStars = () => {
        const ratingLabels = {
            1: 'Poor',
            2: 'Fair',
            3: 'Average',
            4: 'Good',
            5: 'Excellent'
        };
        const currentRating = hoverRating || newReview.rating;

        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <button
                            key={i}
                            type="button"
                            onMouseEnter={() => setHoverRating(i)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setNewReview({ ...newReview, rating: i })}
                            className="transition-all duration-150 transform hover:scale-115 focus:outline-none py-1"
                        >
                            <Star
                                size={28}
                                className={`transition-colors duration-150 ${i <= currentRating
                                        ? 'text-[#c9a84c] fill-[#c9a84c] filter drop-shadow-[0_2px_4px_rgba(201,168,76,0.15)]'
                                        : 'text-slate-300 hover:text-[#c9a84c] fill-transparent'
                                    }`}
                                strokeWidth={i <= currentRating ? 1.5 : 2}
                            />
                        </button>
                    ))}
                </div>
                {currentRating > 0 && (
                    <span className="text-xs font-black uppercase tracking-wider text-[#c9a84c] bg-[#c9a84c]/10 px-2.5 py-1 rounded-lg transition-all duration-200">
                        {ratingLabels[currentRating]}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ fontFamily: "'Nunito Sans', sans-serif" }} className="bg-[#FAF9F6] min-h-screen pb-24 lg:pb-12 text-slate-800">
            <SEO
                title={`${listing.title} in ${listing.plotNumber ? `Plot: ${listing.plotNumber}, ` : ''}${listing.areaName ? `Area: ${listing.areaName}, ` : ''}${listing.location}`}
                description={`${listing.description?.substring(0, 160)}...`}
                image={listing.images?.[0] ? getImageUrl(listing.images[0]) : null}
                type="article"
            />

            {/* Structured Data (JSON-LD) for SEO */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org/",
                    "@type": "RealEstateListing",
                    "name": listing.title,
                    "description": listing.description,
                    "price": listing.price,
                    "priceCurrency": "INR",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": `${listing.plotNumber ? `Plot: ${listing.plotNumber}, ` : ''}${listing.areaName ? `Area: ${listing.areaName}, ` : ''}${listing.location}`,
                        "addressCountry": "IN"
                    },
                    "image": listing.images?.map(img => getImageUrl(img)) || []
                })}
            </script>

            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Nunito+Sans:wght@300;400;500;600;700;800;900&display=swap');`}</style>

            {/* Elegant Luxury Top Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] shadow-xs" />

            {/* ── Breadcrumb & Navigation ── */}
            <div className="bg-white border-b border-slate-100 sticky top-[80px] z-20 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-700 hover:text-[#c9a84c] font-bold text-sm transition-all py-1 px-2.5 rounded-lg hover:bg-slate-50">
                            <ArrowLeft size={16} /> Back
                        </button>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">{getFormattedType()}</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase truncate max-w-full sm:max-w-md">
                        {listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* ── Hero Info Section: Title, Badges, Price ── */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                                {listing.status === 'Available' && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        <Check size={12} className="stroke-[3px]" /> Available
                                    </span>
                                )}
                                {listing.listingType === 'Verified' && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        <CheckCircle2 size={12} className="stroke-[2.5px]" /> Verified
                                    </span>
                                )}
                                {listing.isBookingEnabled && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        <Zap size={12} className="fill-current stroke-[2px]" /> Token Enabled
                                    </span>
                                )}
                                {listing.isFeatured && (
                                    <span className="inline-flex items-center gap-1 bg-[#fffaf0] border border-[#fef3c7] text-[#b45309] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        ★ Featured Listing
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                                {listing.title}
                            </h1>

                            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
                                <MapPin size={16} className="text-[#c9a84c] shrink-0" />
                                <span className="hover:text-slate-800 transition-colors">
                                    {listing.plotNumber ? `Plot ${listing.plotNumber}, ` : ''}
                                    {listing.areaName ? `${listing.areaName}, ` : ''}
                                    {listing.location}
                                </span>
                            </div>
                        </div>

                        {/* Large Beautiful Price Display */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 min-w-[240px] flex flex-col justify-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Valuation</span>
                            <div className="text-3xl sm:text-4xl font-black text-slate-950 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-[#c9a84c]">₹</span>
                                {listing.price?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-slate-500 font-bold mt-1 bg-white/70 py-1 px-2.5 rounded-lg border border-slate-100 inline-block self-start">
                                @ ₹{Math.round(listing.price / originalAreaValue).toLocaleString('en-IN')} / sq. {originalUnit}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Responsive Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Left Column: Media, Details, Features, Map, Reviews ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Gallery Section */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-xs">
                            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video group shadow-inner">
                                {listing.images?.length > 0 ? (
                                    <>
                                        <img
                                            src={getImageUrl(listing.images[mainImageIndex])}
                                            alt={listing.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent p-4 flex items-end justify-between">
                                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                Image {mainImageIndex + 1} of {listing.images.length}
                                            </span>

                                            <button
                                                onClick={handleCopyLink}
                                                className="bg-white hover:bg-slate-50 text-slate-900 p-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs font-bold"
                                                title="Copy Share Link"
                                            >
                                                <Share2 size={14} className="text-[#c9a84c]" />
                                                <span className="hidden sm:inline">Share Listing</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <Image size={56} strokeWidth={1} className="text-slate-300" />
                                        <span className="text-xs font-bold uppercase tracking-wider">No photos uploaded for this plot</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails Container */}
                            {listing.images?.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto pb-1 mt-4 scrollbar-thin scrollbar-thumb-slate-200">
                                    {listing.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setMainImageIndex(idx)}
                                            className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${mainImageIndex === idx
                                                    ? 'border-[#c9a84c] scale-98 shadow-sm ring-2 ring-[#c9a84c]/20'
                                                    : 'border-slate-100 opacity-70 hover:opacity-100 hover:scale-98'
                                                }`}
                                        >
                                            <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Simplified Core Overview Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Spec 1: Plot Area */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plot Size</span>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xl font-extrabold text-slate-900 tracking-tight">{getConvertedArea()}</span>
                                    <select
                                        value={displayUnit}
                                        onChange={e => setDisplayUnit(e.target.value)}
                                        className="text-[10px] font-black bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c9a84c] w-full"
                                    >
                                        {Object.keys(conversionFactors).map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Spec 2: Property Type */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</span>
                                <div className="mt-auto">
                                    <span className="text-lg font-extrabold text-slate-900 block truncate">{getFormattedType()}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{listing.propertyType}</span>
                                </div>
                            </div>

                            {/* Spec 3: Listed Date */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Listed On</span>
                                <div className="mt-auto">
                                    <span className="text-lg font-extrabold text-slate-900 block truncate">
                                        {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                        {new Date(listing.createdAt).getFullYear()}
                                    </span>
                                </div>
                            </div>

                            {/* Spec 4: Land Touch */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</span>
                                <div className="mt-auto">
                                    <span className={`inline-flex text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${listing.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                        }`}>
                                        {listing.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Ready for sale</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. About Section */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-[#c9a84c]" /> About This Property
                            </h3>
                            <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-5" />
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                                {listing.description || 'No description has been provided by the seller for this premium land listing.'}
                            </p>
                        </div>

                        {/* 4. Redesigned Detailed Specifications (Jargon-free) */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2" >
                                <SlidersHorizontal size={20} className="text-[#c9a84c]" /> Property Specifications
                            </h3>
                            <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-6" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Prop Category */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <Layers className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Property Category</span>
                                        <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">{listing.propertyType || 'Plot / Land'}</span>
                                    </div>
                                </div>

                                {/* Plot Subtype */}
                                {listing.propertyType === 'Plot' && listing.plotType && listing.plotType !== 'None' && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <LandPlot className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Plot Classification</span>
                                            <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">{listing.plotType}</span>
                                        </div>
                                    </div>
                                )}
                                {listing.propertyType === 'Land' && listing.landType && listing.landType !== 'None' && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <LandPlot className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Land Classification</span>
                                            <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">{listing.landType}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Location Details */}
                                {(listing.city || listing.locality) && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <MapPin className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">City & Locality</span>
                                            <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                                {listing.locality ? `${listing.locality}, ` : ''}{listing.city || ''}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Owner Profile */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <UserRound className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Listed By</span>
                                        <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                            {listing.ownerType === 'Broker' ? 'Builder / Broker Agency' : 'Direct Land Owner'}
                                        </span>
                                    </div>
                                </div>

                                {/* Key Highlights (Pill format instead of dry lists) */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl sm:col-span-2">
                                    <ShieldCheck className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                    <div className="w-full">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Land Highlights</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {listing.cornerPlot && (
                                                <span className="bg-[#c9a84c]/10 text-[#85651b] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#c9a84c]/20 uppercase tracking-wider">Corner Plot</span>
                                            )}
                                            {listing.roadTouch && (
                                                <span className="bg-[#c9a84c]/10 text-[#85651b] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#c9a84c]/20 uppercase tracking-wider">Road Touch</span>
                                            )}
                                            {listing.isAgricultural && (
                                                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider">Agricultural</span>
                                            )}
                                            {!listing.cornerPlot && !listing.roadTouch && !listing.isAgricultural && (
                                                <span className="text-xs font-medium text-slate-400">Standard premium residential/commercial zone</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Amenities Section */}
                        {listing.amenities?.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" >
                                    <CheckCircle2 size={20} className="text-[#c9a84c]" /> Premium Features & Utilities
                                </h3>
                                <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-5" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {listing.amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                            <Check size={16} className="text-[#c9a84c] shrink-0 stroke-[2.5px]" />
                                            <span className="text-xs font-bold text-slate-800">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 6. Satellite Map Location */}
                        {((listing.locationMode === 'map') || (!listing.locationMode && listing.mapCoordinates?.lat)) && (
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2" >
                                            <MapPin size={20} className="text-[#c9a84c]" /> Satellite Mapping & View
                                        </h3>
                                        <div className="h-0.5 w-16 bg-[#c9a84c]/30 mt-2" />
                                    </div>
                                    {listing.mapConfig && (
                                        <button
                                            onClick={() => navigate(`/shared-map/${listing.mapConfig.shareId}`)}
                                            className="bg-slate-900 text-white hover:bg-[#c9a84c] hover:text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md self-start sm:self-center"
                                        >
                                            <Layers size={14} className="text-[#c9a84c]" /> Interactive Boundary Map
                                        </button>
                                    )}
                                </div>

                                <div className="h-80 w-full relative z-0">
                                    <MapContainer
                                        center={[listing.mapCoordinates.lat, listing.mapCoordinates.lng]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                        <Marker position={[listing.mapCoordinates.lat, listing.mapCoordinates.lng]}>
                                            <Popup>
                                                <div className="font-bold text-slate-900">{listing.title}</div>
                                                <div className="text-xs text-slate-500">{listing.location}</div>
                                            </Popup>
                                        </Marker>
                                        <MapRecenter position={listing.mapCoordinates} />
                                    </MapContainer>
                                </div>

                                <div className="p-4 bg-slate-50 flex items-center gap-3 border-t border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] shrink-0">
                                        <Navigation size={16} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 leading-normal">
                                        Direct satellite scan of the plot. Tap on the map to interact or zoom.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 7. Videos and Documentation */}
                        {(listing.documents?.length > 0 || listing.videos?.length > 0) && (
                            <div className="bg-[#FAF9F5] border border-[#c9a84c]/30 rounded-3xl p-6 sm:p-8 shadow-xs">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" >
                                    <ShieldCheck size={22} className="text-[#c9a84c]" /> Verified Property Documents
                                </h3>
                                <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-6" />

                                {listing.videos?.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Site Drone Footages</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {listing.videos.map((vid, idx) => (
                                                <div key={idx} className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-video">
                                                    <video src={getImageUrl(vid)} controls className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {listing.documents?.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Legal Certifications & Papers</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {listing.documents.map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={getImageUrl(doc)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 hover:border-[#c9a84c] rounded-xl transition-all shadow-xs group"
                                                >
                                                    <div className="bg-slate-950 p-2.5 rounded-xl text-white group-hover:bg-[#c9a84c] group-hover:text-slate-950 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-[#c9a84c] transition-colors truncate">Legal Document {idx + 1}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                                            Click to View <ExternalLink size={10} />
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 8. Reviews and Ratings */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-xs">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" >
                                <MessageCircle size={20} className="text-[#c9a84c]" /> Buyer Reviews & Feedback
                            </h3>
                            <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-4" />

                            {/* Average Rating Block */}
                            {reviewsData?.averageRating > 0 && (
                                <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                    <div className="text-3xl font-black text-slate-950">{reviewsData.averageRating}</div>
                                    <div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={`stroke-[1.5px] ${i < Math.round(reviewsData.averageRating) ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                                            Based on {reviewsData?.count || 0} customer {reviewsData?.count === 1 ? 'review' : 'reviews'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviewsLoading ? (
                                <div className="space-y-3">
                                    <div className="animate-pulse bg-slate-50 rounded-2xl h-24 w-full"></div>
                                </div>
                            ) : reviewsData.reviews?.length > 0 ? (
                                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    {reviewsData?.reviews?.map((review) => (
                                        <div key={review._id} className="flex gap-3.5 p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                            <div className="w-8.5 h-8.5 rounded-full bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-xs shrink-0">
                                                {review.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                                    <span className="font-extrabold text-slate-950 text-xs">{review.user?.name || 'Anonymous User'}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">
                                                        {new Date(review.createdAt).toLocaleDateString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="flex gap-0.5 mb-1.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={12}
                                                            className={`stroke-[1.5px] ${i < review.rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-slate-600 text-xs font-medium leading-relaxed">{review.comment}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-4">
                                    <MessageCircle size={32} className="mx-auto text-slate-300 mb-2.5" />
                                    <h4 className="text-xs font-bold text-slate-900 mb-0.5">No reviews listed yet</h4>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Have queries or visited this plot? Share your feedback below.</p>
                                </div>
                            )}

                            {/* Add Review Form */}
                            {isAuthenticated && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Post Your Feedback</h4>
                                    <form onSubmit={handleSubmitReview} className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assign Stars</label>
                                            {renderStars()}
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Experience</label>
                                            <textarea
                                                value={newReview.comment}
                                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                placeholder="Detail your experience, location insights, or direct negotiation feedback..."
                                                rows="3"
                                                className="w-full p-3 border border-slate-200 rounded-xl focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all font-medium text-xs placeholder:text-slate-400 focus:outline-none bg-slate-50/50"
                                                disabled={submittingReview}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview || !newReview.comment.trim()}
                                            className="w-full py-3 bg-slate-950 hover:bg-[#c9a84c] hover:text-slate-950 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                        >
                                            {submittingReview ? 'Submitting review...' : 'Submit Rating'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right Column: Premium Sticky Sidebar (Desktop only) ── */}
                    <div className="space-y-6">
                        <div className="sticky top-[152px] space-y-6 hidden lg:block">

                            {/* Seller & Action Card */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-5">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users size={15} className="text-[#c9a84c]" /> Seller Contact
                                </h3>

                                <div
                                    onClick={() => navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`)}
                                    className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl cursor-pointer transition-all group"
                                >
                                    <div className="w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-base shrink-0 group-hover:scale-105 transition-all">
                                        {listing.createdBy?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#c9a84c] transition-colors">{listing.createdBy?.name || 'Seller Agent'}</div>
                                        <span className="inline-flex items-center gap-0.5 bg-[#fffaf0] border border-[#fef3c7] text-[#b45309] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                                            <UserCheck size={9} />
                                            {listing.createdBy?.role || 'Broker'}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400 shrink-0 transition-transform group-hover:translate-x-1" />
                                </div>

                                {isAuthenticated && (user?.id === listing.createdBy?._id || user?._id === listing.createdBy?._id) ? (
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-3.5 bg-slate-950 hover:bg-[#c9a84c] text-white hover:text-slate-950 font-extrabold text-xs rounded-2xl transition-all uppercase tracking-widest shadow-sm"
                                    >
                                        Manage Listings
                                    </button>
                                ) : (
                                    <div className="space-y-2.5">
                                        <button
                                            onClick={handleSiteVisitRequest}
                                            disabled={requestingVisit}
                                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                        >
                                            <Calendar size={14} className="stroke-[2.5px] text-[#c9a84c]" />
                                            {requestingVisit ? 'Requesting...' : 'Contact Seller'}
                                        </button>

                                        <button
                                            onClick={handleWhatsApp}
                                            className="w-full py-3.5 bg-[#25d366] hover:bg-[#1fd35e] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                        >
                                            <MessageCircle size={14} className="fill-current" />
                                            WhatsApp Chat
                                        </button>

                                        <button
                                            onClick={handleFavorite}
                                            className={`w-full py-3.5 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-200 ${isFavorite
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-white text-slate-800 hover:border-[#c9a84c] hover:bg-slate-50'
                                                }`}
                                        >
                                            <Heart size={14} className={isFavorite ? 'fill-current' : ''} />
                                            {isFavorite ? 'Saved Listing' : 'Save To Favorites'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Token Reservation Card */}
                            {listing.isBookingEnabled && listing.tokenAmount > 0 && (
                                <div className={`rounded-3xl p-6 border shadow-md transition-all ${listing.isTokened
                                        ? 'bg-emerald-50/50 border-emerald-100'
                                        : systemSettings?.isInstantBookingEnabled === false
                                            ? 'bg-slate-50 border-slate-100 opacity-80'
                                            : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-slate-900 text-white'
                                    }`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 ${listing.isTokened
                                            ? 'text-emerald-700'
                                            : systemSettings?.isInstantBookingEnabled === false
                                                ? 'text-slate-400'
                                                : 'text-[#c9a84c]'
                                        }`}>
                                        {listing.isTokened ? (
                                            <><CheckCircle2 size={15} /> Land Reserved</>
                                        ) : systemSettings?.isInstantBookingEnabled === false ? (
                                            <><ZapOff size={15} /> Booking Suspended</>
                                        ) : (
                                            <><Zap size={15} className="fill-current" /> Instant Booking</>
                                        )}
                                    </h3>

                                    {!listing.isTokened && systemSettings?.isInstantBookingEnabled !== false && (
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reservation Token</span>
                                                <div className="text-3xl font-black text-white flex items-baseline gap-1" >
                                                    <span className="text-lg font-bold text-[#c9a84c]">₹</span>
                                                    {listing.tokenAmount?.toLocaleString('en-IN')}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-normal">
                                                    Fully refundable transaction to secure buying priority and stop other offers.
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleReserveToken}
                                                disabled={submitting}
                                                className="w-full py-3.5 bg-linear-to-r from-[#c9a84c] to-[#b8933a] hover:from-[#b8933a] hover:to-[#a67c00] disabled:bg-[#d1c9b8] text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all uppercase tracking-widest"
                                            >
                                                {submitting ? 'Initiating Gate...' : 'Reserve Securely'}
                                            </button>
                                        </div>
                                    )}

                                    {!listing.isTokened && systemSettings?.isInstantBookingEnabled === false && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                Token booking is currently paused by admin setting. Direct negotiation with the seller remains fully open.
                                            </p>
                                        </div>
                                    )}

                                    {listing.isTokened && (
                                        <div className="text-center bg-white/80 border border-emerald-100 rounded-2xl p-4">
                                            <span className="text-xs text-emerald-800 font-extrabold block">✓ Property Booked</span>
                                            <span className="text-[10px] text-slate-500 font-bold block mt-1">
                                                Reserved on {new Date(listing.tokenedAt).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tablet View Sidebar Inline Drawer (Show CTA panel between content and footer on tablet view) ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:hidden mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Users size={14} className="text-[#c9a84c]" /> Seller Reference
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-sm shrink-0">
                                {listing.createdBy?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="font-extrabold text-slate-900 text-xs">{listing.createdBy?.name || 'Agent'}</div>
                                <span className="inline-flex items-center gap-0.5 bg-[#fffaf0] border border-[#fef3c7] text-[#b45309] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                                    {listing.createdBy?.role || 'Broker'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                        {isAuthenticated && (user?.id === listing.createdBy?._id || user?._id === listing.createdBy?._id) ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3.5 bg-slate-950 text-white font-extrabold text-xs rounded-2xl uppercase tracking-widest"
                            >
                                Dashboard
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleSiteVisitRequest}
                                    className="py-3 bg-slate-950 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 uppercase tracking-widest"
                                >
                                    <Calendar size={13} className="text-[#c9a84c]" /> Contact
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="py-3 bg-[#25d366] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 uppercase tracking-widest"
                                >
                                    <MessageCircle size={13} className="fill-current" /> WhatsApp
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 📱 Mobile Sticky Bottom Bar (Stunning floating layout for mobile viewports) ── */}
            {!isAuthenticated || (user?.id !== listing.createdBy?._id && user?._id !== listing.createdBy?._id) ? (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-2xl px-4 py-3 md:hidden flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Price</span>
                        <div className="text-lg font-black text-slate-950 truncate" >
                            ₹{listing.price?.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleWhatsApp}
                            className="w-10 h-10 bg-[#25d366] text-white rounded-xl flex items-center justify-center transition-all shadow-xs shrink-0"
                            title="Chat on WhatsApp"
                        >
                            <MessageCircle size={18} className="fill-current" />
                        </button>

                        <button
                            onClick={handleSiteVisitRequest}
                            disabled={requestingVisit}
                            className="bg-slate-950 text-white font-extrabold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 uppercase tracking-widest shadow-md"
                        >
                            <Calendar size={13} className="text-[#c9a84c] stroke-[2.5px]" />
                            {requestingVisit ? '...' : 'Contact'}
                        </button>

                        {listing.isBookingEnabled && !listing.isTokened && systemSettings?.isInstantBookingEnabled !== false && (
                            <button
                                onClick={handleReserveToken}
                                disabled={submitting}
                                className="bg-gradient-to-r from-[#c9a84c] to-[#b8933a] text-slate-950 font-black text-[10px] px-3.5 py-3 rounded-xl flex items-center gap-1 uppercase tracking-widest shadow-md shrink-0"
                            >
                                <Zap size={10} className="fill-current" /> Reserve
                            </button>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Receipt Modal */}
            <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} />
        </div>
    );
};

export default PropertyDetails;