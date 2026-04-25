import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Heart, Share2, MapPin, Calendar, CheckCircle2, Phone, ChevronRight,
    ArrowLeft, Maximize2, Eye, LandPlot, UserCheck, FileText, Users,
    ShieldCheck, Download, MessageSquare, ExternalLink, Image, Clock,
    Check, X, Zap, ZapOff, Award, Star, StarHalf, StarOff, UserRound, MessageCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import { useQuery } from '@tanstack/react-query';
import ErrorBox from '../components/ErrorBox';
import DetailSkeleton from '../components/DetailSkeleton';
import { getImageUrl } from '../utils/imageUrl';

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
            if (user && listing.favorites && listing.favorites.includes(user._id)) {
                setIsFavorite(true);
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
            await axios.post(`/api/auth/favorites/${id}`);
            setIsFavorite(!isFavorite);
            toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites!');
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
                    ondismiss: function() {
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

    /*
    const handleContactSeller = async () => {
        if (!isAuthenticated) return navigate('/login');
        setRequestingContact(true);
        try {
            await axios.post('/api/inquiries', {
                listingId: id,
                type: 'Inquiry',
                message: 'Hi, I am interested in this property. Can you please provide more details and answer my questions?'
            });
            toast.success('Message sent to seller successfully!');
        } catch (err) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setRequestingContact(false);
        }
    };
    */

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
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => setNewReview({...newReview, rating: i })}
                    className={`text-lg transition-colors ${newReview.rating >= i ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-300'}`}
                >
                    <Star />
                </button>
            );
        }
        return stars;
    };

    return (
        <div style={{ fontFamily: "'Nunito Sans', sans-serif" }} className="bg-[#f8f5ee]">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* Gold bar */}
            <div className="h-1 w-full bg-linear-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

            {/* ── Breadcrumb & Back ── */}
            <div className="bg-white border-b border-[#e2d9c5] sticky top-17 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#1a2340] font-bold text-sm hover:text-[#c9a84c] transition-colors">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <span className="text-[#d1d5db]">•</span>
                    <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">{listing.propertyType || 'Plot'} in {listing.location}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* ── Hero Section: Title + Price ── */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2340] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {listing.title}
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                {listing.status === 'Available' && (
                                    <span className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        <Check size={14} /> Available
                                    </span>
                                )}
                                {listing.listingType === 'Verified' && (
                                    <span className="flex items-center gap-1.5 bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        <CheckCircle2 size={14} /> Verified
                                    </span>
                                )}
                                {listing.isBookingEnabled && (
                                    <span className="flex items-center gap-1.5 bg-[#fef3f2] border border-[#fecaca] text-[#dc2626] text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        <Zap size={14} /> Token Enabled
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-white border-2 border-[#c9a84c] rounded-2xl p-4 shadow-lg min-w-55">
                            <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Total Price</div>
                            <h2 className="text-3xl font-black text-[#1a2340] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                                ₹{listing.price?.toLocaleString('en-IN')}
                            </h2>
                            <div className="text-xs text-[#6b7280] font-600">
                                @ ₹{Math.round(listing.price / originalAreaValue).toLocaleString('en-IN')} per sq. {originalUnit}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-[#6b7280] text-sm font-bold">
                        <MapPin size={16} className="text-[#c9a84c]" />
                        {listing.location}
                    </div>
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* ── Images Section ── */}
                    <div className="lg:col-span-2">
                        {/* Main Image */}
                        <div className="mb-4 rounded-2xl overflow-hidden bg-[#e5e7eb] border border-[#e2d9c5] shadow-lg">
                            {listing.images?.length > 0 ? (
                                <div className="relative bg-black aspect-video">
                                    <img
                                        src={getImageUrl(listing.images[mainImageIndex])}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Badge */}
                                    <span className="absolute top-3 left-3 bg-[#1a2340] text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        Photo {mainImageIndex + 1} of {listing.images.length}
                                    </span>
                                </div>
                            ) : (
                                <div className="aspect-video flex items-center justify-center text-[#d1d5db]">
                                    <Image size={48} strokeWidth={1} />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {listing.images?.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImageIndex(idx)}
                                        className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                            mainImageIndex === idx ? 'border-[#c9a84c] ring-2 ring-[#c9a84c]/30' : 'border-[#e2d9c5] opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={getImageUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-4">

                        {/* Key Details Card */}
                        <div className="bg-white border border-[#e2d9c5] rounded-2xl p-4 shadow-sm">
                            <h3 className="text-xs font-bold text-[#1a2340] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Award size={16} className="text-[#c9a84c]" /> Key Details
                            </h3>

                            <div className="space-y-3">
                                {/* Area */}
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0]">
                                    <span className="text-sm text-[#6b7280] font-600">Plot Area</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#1a2340]">{getConvertedArea()}</span>
                                        <select
                                            value={displayUnit}
                                            onChange={e => setDisplayUnit(e.target.value)}
                                            className="text-xs font-bold bg-[#1a2340] text-white px-2 py-1 rounded cursor-pointer border-none focus:outline-none"
                                        >
                                            {Object.keys(conversionFactors).map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Posted */}
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0]">
                                    <span className="text-sm text-[#6b7280] font-600">Posted</span>
                                    <span className="font-black text-[#1a2340]">{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>

                                {/* Property Type */}
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe0]">
                                    <span className="text-sm text-[#6b7280] font-600">Type</span>
                                    <span className="font-black text-[#1a2340]">{listing.propertyType || 'Plot / Land'}</span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[#6b7280] font-600">Status</span>
                                    <span className={`font-bold text-xs uppercase tracking-wider px-2 py-1 rounded ${
                                        listing.status === 'Available' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fff0f0] text-[#dc2626]'
                                    }`}>
                                        {listing.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div className="bg-white border border-[#e2d9c5] rounded-2xl p-4 shadow-sm">
                            <h3 className="text-xs font-bold text-[#1a2340] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users size={16} className="text-[#c9a84c]" /> Posted By
                            </h3>

                            <div
                                onClick={() => navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`)}
                                className="flex items-start gap-3 p-3 bg-[#fdfaf5] rounded-xl cursor-pointer hover:bg-[#fffbf0] transition-colors mb-3"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-lg shrink-0">
                                    {listing.createdBy?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[#1a2340] text-sm">{listing.createdBy?.name}</div>
                                    <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider mt-0.5">
                                        {listing.createdBy?.name || 'Seller User'}
                                    </div>
                                    <span className="inline-flex items-center gap-1 bg-[#fef3c7]/80 border border-[#f59e0b]/50 text-[#b45309] text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mt-1">
                                        <UserCheck size={9} />
                                        {listing.createdBy?.role || 'Seller'}
                                    </span>
                                    {listing.createdBy?.createdAt && (
                                        <div className="text-[10px] text-[#9ca3af] font-600 mt-1">
                                            Member since {new Date(listing.createdBy.createdAt).getFullYear()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAuthenticated && (user?.id === listing.createdBy?._id || user?._id === listing.createdBy?._id) ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] text-white hover:text-[#1a1200] font-bold text-sm rounded-lg transition-all uppercase tracking-widest"
                                >
                                    Manage Listings
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    {/* Send Message button - commented out as per request */}
                                    {/* <button
                                        onClick={handleContactSeller}
                                        disabled={requestingContact}
                                        className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                                    >
                                        <MessageSquare size={15} />
                                        {requestingContact ? 'Sending...' : 'Send Message'}
                                    </button> */}
                                    <button
                                        onClick={handleSiteVisitRequest}
                                        disabled={requestingVisit}
                                        className="w-full py-3 bg-linear-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                                    >
                                        <Calendar size={16} className="stroke-[2.5px]" />
                                        {requestingVisit ? 'Requesting...' : 'Contact Seller'}
                                    </button>
                                    <button
                                        onClick={handleFavorite}
                                        className={`w-full py-3 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest border-2 ${
                                            isFavorite
                                                ? 'bg-[#fff0f0] text-[#dc2626] border-[#fecaca]'
                                                : 'bg-white text-[#1a2340] border-[#e2d9c5] hover:border-[#c9a84c]'
                                        }`}
                                    >
                                        <Heart size={15} className={isFavorite ? 'fill-current' : ''} />
                                        {isFavorite ? 'Saved' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Token Card */}
                        {listing.isBookingEnabled && listing.tokenAmount > 0 && (
                            <div className={`rounded-2xl p-4 border-2 ${
                                listing.isTokened
                                    ? 'bg-[#f0fdf4] border-[#bbf7d0]'
                                    : systemSettings?.isInstantBookingEnabled === false
                                        ? 'bg-slate-50 border-slate-200 opacity-80'
                                        : 'bg-white border-[#c9a84c]'
                            }`}>
                                <h3 className="text-xs font-bold text-[#1a2340] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    {listing.isTokened ? (
                                        <><CheckCircle2 size={14} className="text-[#15803d]" /> Reserved</>
                                    ) : systemSettings?.isInstantBookingEnabled === false ? (
                                        <><ZapOff size={14} className="text-slate-400" /> Booking Disabled</>
                                    ) : (
                                        <><Zap size={14} className="text-[#c9a84c]" /> Instant Booking</>
                                    )}
                                </h3>

                                {!listing.isTokened && systemSettings?.isInstantBookingEnabled !== false && (
                                    <>
                                        <div className="mb-4">
                                            <div className="text-xs text-[#9ca3af] font-bold uppercase tracking-widest mb-1">Token Amount</div>
                                            <div className="text-2xl font-black text-[#1a2340]">₹{listing.tokenAmount?.toLocaleString('en-IN')}</div>
                                        </div>
                                        <button
                                            onClick={handleReserveToken}
                                            disabled={submitting}
                                            className="w-full py-3 bg-linear-to-r from-[#c9a84c] to-[#b8933a] hover:from-[#b8933a] hover:to-[#a67c00] disabled:bg-[#d1c9b8] text-[#1a1200] font-bold text-sm rounded-2xl shadow-lg transition-all uppercase tracking-widest"
                                        >
                                            {submitting ? 'Processing...' : 'Reserve Now'}
                                        </button>
                                    </>
                                )}

                                {!listing.isTokened && systemSettings?.isInstantBookingEnabled === false && (
                                    <div className="py-2">
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                            Instant Token Booking is currently disabled by the administrator. Please contact the seller directly for inquiries.
                                        </p>
                                    </div>
                                )}

                                {listing.isTokened && (
                                    <div className="text-center text-sm text-[#15803d] font-bold">
                                        ✓ Reserved on {new Date(listing.tokenedAt).toLocaleDateString('en-IN')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Property Description ── */}
                <div className="bg-white border border-[#e2d9c5] rounded-2xl p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1a2340] mb-4 uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <FileText size={20} className="text-[#c9a84c]" /> About This Property
                    </h3>
                    <p className="text-[#6b7280] text-sm leading-relaxed font-500 whitespace-pre-wrap">
                        {listing.description || 'No description provided.'}
                    </p>
                </div>

                {/* ── Amenities / Features ── */}
                {listing.amenities?.length > 0 && (
                    <div className="bg-white border border-[#e2d9c5] rounded-2xl p-6 mb-8 shadow-sm">
                        <h3 className="text-lg font-bold text-[#1a2340] mb-4 uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Property Features
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {listing.amenities.map((amenity, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-[#fdfaf5] rounded-lg border border-[#e2d9c5]">
                                    <Check size={16} className="text-[#c9a84c]" />
                                    <span className="text-sm font-600 text-[#1a2340]">{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Documents ── */}
                {(listing.documents?.length > 0 || listing.videos?.length > 0) && (
                    <div className="bg-[#fffbf0] border-2 border-[#c9a84c]/40 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-[#1a2340] mb-6 uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                            <ShieldCheck size={20} className="text-[#c9a84c]" /> Verified Documentation
                        </h3>

                        {listing.videos?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-[#1a2340] uppercase tracking-wider mb-3">Videos</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {listing.videos.map((vid, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden bg-black border-2 border-[#c9a84c]">
                                            <video src={getImageUrl(vid)} controls className="w-full h-48 object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {listing.documents?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-[#1a2340] uppercase tracking-wider mb-3">Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {listing.documents.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={getImageUrl(doc)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 p-4 bg-white border-2 border-[#e2d9c5] hover:border-[#c9a84c] rounded-lg transition-all group"
                                        >
                                            <div className="bg-[#1a2340] p-2.5 rounded-lg text-white group-hover:bg-[#c9a84c] group-hover:text-[#1a1200] transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1a2340]">Document {idx + 1}</div>
                                                <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider mt-0.5">Click to View</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Reviews Section ── */}
                <div className="bg-white border border-[#e2d9c5] rounded-2xl p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1a2340] mb-6 uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <MessageCircle size={20} className="text-[#c9a84c]" /> Reviews & Ratings
                    </h3>

                    {/* Average Rating */}
                    {reviewsData?.averageRating > 0 && (

                        <div className="mb-6 p-4 bg-[#fdfaf5] rounded-xl border border-[#e2d9c5]">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-[#1a2340]">{reviewsData.averageRating}</div>

                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={24} 
                                            className={`stroke-[1.5px] ${i < reviewsData.averageRating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-300'}`} 
                                        />
                                    ))}
                                </div>
                                <div className="text-sm text-[#6b7280] font-bold">
                                    {reviewsData?.count === 1 ? 'review' : 'reviews'}

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews List */}
                    {reviewsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="animate-pulse bg-gray-100 rounded-xl h-32"></div>
                            <div className="animate-pulse bg-gray-100 rounded-xl h-32 md:hidden"></div>
                        </div>
                    ) : reviewsData.reviews?.length > 0 ? (
                        <div className="space-y-4 mb-8">
                            {reviewsData?.reviews?.map((review) => (

                                <div key={review._id} className="flex gap-4 p-4 bg-[#fdfaf5] rounded-xl border border-[#e2d9c5]">
                                    <div className="w-12 h-12 rounded-full bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-lg shrink-0">
                                        {review.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-[#1a2340] text-sm">{review.user?.name || 'Anonymous'}</span>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={16} 
                                                        className={`stroke-[1.5px] ${i < review.rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-[#9ca3af] font-medium">
                                                {new Date(review.createdAt).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                        <p className="text-[#6b7280] leading-relaxed">{review.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                            <h4 className="text-lg font-bold text-[#1a2340] mb-2">No reviews yet</h4>
                            <p className="text-[#6b7280] mb-6">Be the first to share your experience</p>
                        </div>
                    )}

                    {/* Add Review Form */}
                    {isAuthenticated && (
                        <div className="border-t border-[#e2d9c5] pt-6">
                            <h4 className="text-sm font-bold text-[#1a2340] uppercase tracking-wider mb-4">Share your review</h4>
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Your rating</label>
                                    <div className="flex gap-1 mb-2">
                                        {renderStars()}
                                    </div>
                                    <span className="text-xs text-gray-500">Select your rating above</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Your review</label>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                                        placeholder="Share your experience with this property..."
                                        rows="4"
                                        className="w-full p-3 border border-[#e2d9c5] rounded-lg focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 transition-all"
                                        disabled={submittingReview}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingReview || !newReview.comment.trim()}
                                    className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] text-white hover:text-[#1a1200] font-bold rounded-lg transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} />
        </div>
    );
};

export default PropertyDetails;