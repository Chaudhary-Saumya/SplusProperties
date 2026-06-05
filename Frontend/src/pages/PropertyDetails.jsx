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
import { useLanguage } from '../context/LanguageContext';
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
    const { language, t } = useLanguage();
    const { id } = useParams();
    const cleanId = id ? id.split(/[\s%]/)[0] : '';
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const { user, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [displayUnit, setDisplayUnit] = useState('sqft');
    const [originalAreaValue, setOriginalAreaValue] = useState(0);
    const [originalUnit, setOriginalUnit] = useState('sqft');
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
        guntha: 1,
        hectare: 98.84,
        aare: 0.98,
        vigha_bada: 23.78,
        vigha_chhota: 16.19,
        acre: 40,
        sqm: 0.0098,
        sqft: 1 / 1089,
        gaj: 9 / 1089,
    };

    const { data: listing, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['listing', cleanId],
        queryFn: async () => {
            const res = await axios.get(`/api/listings/${cleanId}`);
            return res.data.data;
        }
    });

    const getFormattedType = () => {
        if (!listing) return t('property_details.category_label');
        const typeLabel = listing.propertyType === 'Plot' ? t('search_page.plots') : t('search_page.lands');
        const subTypeValue = listing.propertyType === 'Plot' ? listing.plotType : listing.landType;

        if (subTypeValue && subTypeValue !== 'None') {
            const subTypeKey = subTypeValue.toLowerCase().replace('-', '_');
            const subTypeTrans = t(`search_page.${subTypeKey}`);
            return `${subTypeTrans} ${typeLabel}`;
        }
        return typeLabel;
    };

    const getUnitLabel = (u) => {
        const labels = {
            guntha: language === 'gu' ? 'ગુન્ટા' : 'Guntha (Gutha)',
            hectare: language === 'gu' ? 'હેક્ટર' : 'Hectare (Hector)',
            aare: language === 'gu' ? 'આરે' : 'Aare',
            vigha_bada: language === 'gu' ? 'વીઘું (મોટું - ૨૩.૭૮ ગુન્ટા)' : 'Bigha (23.78 Gutha)',
            vigha_chhota: language === 'gu' ? 'વીઘું (નાનું - ૧૬.૧૯ ગુન્ટા)' : 'Bigha (16.19 Gutha)',
            acre: language === 'gu' ? 'એકર' : 'Acre',
            sqm: language === 'gu' ? 'ચોરસ મીટર' : 'Square Meter (Sq.Mt)',
            sqft: language === 'gu' ? 'ચોરસ ફૂટ' : 'Square Feet (Sqft)',
            gaj: language === 'gu' ? 'ગજ / વાર' : 'Gaj / Yard / Vaar',
        };
        return labels[u] || u;
    };

    const getRoleLabel = (role) => {
        if (role === 'Broker') return t('auth.role_broker').split(' ')[0];
        if (role === 'Seller') return t('auth.role_seller').split(' ')[0];
        if (role === 'Buyer') return t('auth.role_buyer').split(' ')[0];
        return role;
    };

    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
        queryKey: ['reviews', cleanId],
        queryFn: async () => {
            const res = await axios.get(`/api/listings/${cleanId}/reviews`);
            return res.data;
        }
    });

    useEffect(() => {
        if (listing) {
            const areaStr = listing.area || '';
            const match = areaStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].trim().toLowerCase();
                setOriginalAreaValue(value);

                let mappedUnit = 'sqft';
                if (unit.includes('ft') || unit.includes('feet')) mappedUnit = 'sqft';
                else if (unit.includes('yard') || unit.includes('gaj') || unit.includes('yd') || unit.includes('vaar')) mappedUnit = 'gaj';
                else if (unit.includes('meter') || unit.includes('mtr') || unit.includes('sqm') || unit.includes('મીટર')) mappedUnit = 'sqm';
                else if (unit.includes('acre') || unit.includes('એકર')) mappedUnit = 'acre';
                else if (unit.includes('hectare') || unit.includes('hector') || unit.includes('હેક્ટર')) mappedUnit = 'hectare';
                else if (unit.includes('guntha') || unit.includes('gutha') || unit.includes('ગુન્ટા')) mappedUnit = 'guntha';
                else if (unit.includes('aare') || unit.includes('આરે')) mappedUnit = 'aare';
                else if (unit.includes('vigha_bada') || unit.includes('bada') || unit.includes('મોટું') || unit.includes('23.78')) mappedUnit = 'vigha_bada';
                else if (unit.includes('vigha_chhota') || unit.includes('chhota') || unit.includes('નાનું') || unit.includes('16.19')) mappedUnit = 'vigha_chhota';
                else mappedUnit = 'sqft';

                setOriginalUnit(mappedUnit);
                setDisplayUnit(mappedUnit);
            }
            if (user && user.favorites) {
                const isSaved = user.favorites.some(fav => {
                    if (typeof fav === 'string') return fav === cleanId;
                    if (typeof fav === 'object' && fav !== null) return (fav._id || fav.id) === cleanId;
                    return false;
                });
                setIsFavorite(isSaved);
            }
        }
    }, [listing, user, cleanId]);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        if (cleanId && !sessionStorage.getItem(`viewed_${cleanId}`)) {
            axios.post(`/api/listings/${cleanId}/view`).catch(e => console.error(e));
            sessionStorage.setItem(`viewed_${cleanId}`, 'true');
        }

        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, [cleanId]);

    const getConvertedArea = () => {
        if (!originalAreaValue) return listing?.area;
        const baseGuntha = originalAreaValue * conversionFactors[originalUnit];
        const convertedValue = baseGuntha / conversionFactors[displayUnit];
        if (convertedValue < 0.01) return convertedValue.toFixed(6);
        if (convertedValue < 1) return convertedValue.toFixed(4);
        return convertedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const handleFavorite = async () => {
        if (!isAuthenticated) return navigate('/login');
        try {
            const res = await axios.post(`/api/auth/favorites/${cleanId}`);
            if (user && res.data && res.data.data) {
                user.favorites = res.data.data;
            }
            const nextState = !isFavorite;
            setIsFavorite(nextState);
            toast.success(nextState ? t('property_details.add_to_fav_success') : t('property_details.remove_from_fav_success'));
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error(t('property_details.failed_favorites'));
        }
    };

    const handleSiteVisitRequest = async () => {
        if (!isAuthenticated) return navigate('/login');
        setRequestingVisit(true);
        try {
            await axios.post('/api/inquiries', {
                listingId: cleanId,
                type: 'SiteVisit',
                message: 'I would like to schedule a site visit for this property. Please suggest available dates and contact me to arrange.'
            });
            toast.success(t('property_details.site_visit_success'));
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error(t('property_details.failed_site_visit'));
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
                listingId: cleanId
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
                        toast.success(t('property_details.reserved_success') + '! Receipt: ' + verifyRes.data.receiptNumber);
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
                        toast.info(t('property_details.payment_cancelled'));
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

    const handleShareOptions = async (e) => {
        if (e) e.stopPropagation();
        const listingUrl = `${window.location.origin}/listings/${cleanId}`;
        const shareData = {
            title: listing?.title || 'Kharsan Properties',
            text: listing ? `${listing.title} - ${listing.propertyType || 'Plot/Land'} in ${listing.location}` : '',
            url: listingUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setShowShareModal(true);
                }
            }
        } else {
            setShowShareModal(true);
        }
    };

    if (isLoading) return <DetailSkeleton />;
    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;
    if (!listing) return <div className="py-20 text-center"><p className="text-gray-500">{t('property_details.property_not_found')}</p></div>;

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error(t('property_details.login_to_add_review'));
            navigate('/login');
            return;
        }
        if (!newReview.comment.trim()) {
            toast.error(t('property_details.write_comment_error'));
            return;
        }

        setSubmittingReview(true);
        try {
            await axios.post(`/api/listings/${cleanId}/reviews`, newReview);
            toast.success(t('property_details.review_success'));
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
            1: t('property_details.poor'),
            2: t('property_details.fair'),
            3: t('property_details.average'),
            4: t('property_details.good'),
            5: t('property_details.excellent')
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
            <div className="hidden sm:block bg-white border-b border-slate-100 sticky z-20 shadow-xs" style={{ top: 'var(--navbar-height)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-700 hover:text-[#c9a84c] font-bold text-sm transition-all py-1 px-2.5 rounded-lg hover:bg-slate-50">
                            <ArrowLeft size={16} /> {t('property_details.back')}
                        </button>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">{getFormattedType()}</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase truncate max-w-full sm:max-w-md">
                        {listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

                {/* ── Hero Info Section: Title, Badges, Price ── */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-8 shadow-xs mb-5 sm:mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {listing.status === 'Available' && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                                        <Check size={10} className="stroke-[3px]" /> {t('property_details.available')}
                                    </span>
                                )}
                                {listing.listingType === 'Verified' && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                                        <CheckCircle2 size={10} className="stroke-[2.5px]" /> {t('property_details.verified')}
                                    </span>
                                )}
                                {listing.isBookingEnabled && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                                        <Zap size={10} className="fill-current stroke-[2px]" /> {t('property_details.token_enabled')}
                                    </span>
                                )}
                                {listing.isFeatured && (
                                    <span className="inline-flex items-center gap-1 bg-[#fffaf0] border border-[#fef3c7] text-[#b45309] text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                                        ★ {t('property_details.featured')}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                                {listing.title}
                            </h1>

                            <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm font-semibold">
                                <MapPin size={14} className="text-[#c9a84c] shrink-0 sm:w-4 sm:h-4" />
                                <span className="hover:text-slate-800 transition-colors">
                                    {listing.plotNumber ? `Plot ${listing.plotNumber}, ` : ''}
                                    {listing.areaName ? `${listing.areaName}, ` : ''}
                                    {listing.location}
                                </span>
                            </div>
                        </div>

                        {/* Large Beautiful Price Display */}
                        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 min-w-[200px] sm:min-w-[240px] flex flex-col justify-center mt-2 lg:mt-0">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">{t('property_details.total_valuation')}</span>
                            <div className="text-2xl sm:text-4xl font-black text-slate-950 flex items-baseline gap-1">
                                <span className="text-xl sm:text-2xl font-bold text-[#c9a84c]">₹</span>
                                {listing.price?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1 bg-white/70 py-1 px-2.5 rounded-lg border border-slate-100 inline-block self-start">
                                @ ₹{Math.round(listing.price / originalAreaValue).toLocaleString('en-IN')} / {getUnitLabel(originalUnit)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Responsive Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Left Column: Media, Details, Features, Map, Reviews ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Gallery Section */}
                        <div className="bg-white sm:rounded-3xl border-y sm:border border-slate-100 p-0 sm:p-5 shadow-none sm:shadow-xs -mx-4 sm:mx-0 overflow-hidden">
                            <div className="relative rounded-none sm:rounded-2xl overflow-hidden bg-slate-950 aspect-video group shadow-none sm:shadow-inner">
                                {listing.images?.length > 0 ? (
                                    <img
                                        src={getImageUrl(listing.images[mainImageIndex])}
                                        alt={listing.title}
                                        fetchpriority="high"
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                                    />
                                ) : (listing.locationMode === 'map' && listing.mapCoordinates && !isNaN(parseFloat(listing.mapCoordinates.lat)) && !isNaN(parseFloat(listing.mapCoordinates.lng))) ? (
                                    <div className="w-full h-full relative z-0">
                                        <MapContainer
                                            center={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}
                                            zoom={15}
                                            zoomControl={true}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                            <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}>
                                                <Popup>{listing.title}</Popup>
                                            </Marker>
                                            <MapRecenter position={{ lat: parseFloat(listing.mapCoordinates.lat), lng: parseFloat(listing.mapCoordinates.lng) }} />
                                        </MapContainer>
                                        <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider z-10 pointer-events-none">
                                            🗺️ Satellite Location Map
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF9F6] to-[#e2d9c5]/40 text-slate-700 p-6 text-center gap-3">
                                        <div className="w-14 h-14 bg-[#1a2340]/5 rounded-full flex items-center justify-center text-[#c9a84c]">
                                            <Image size={28} />
                                        </div>
                                        <div className="max-w-md">
                                            <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1a2340] mb-1">
                                                No Photos Available
                                            </h4>
                                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                The seller has not uploaded photos for this property yet. Please refer to the location coordinates map or contact the builder/seller directly for more details.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Floating Overlays for Mobile Only */}
                                <div className="sm:hidden absolute top-4 left-4 z-30">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-800 active:scale-90 transition-all"
                                    >
                                        <ArrowLeft size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="sm:hidden absolute top-4 right-4 z-30 flex gap-2">
                                    <button
                                        onClick={handleFavorite}
                                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-800 active:scale-90 transition-all"
                                    >
                                        <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-700'} strokeWidth={2} />
                                    </button>
                                    <button
                                        onClick={handleShareOptions}
                                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#c9a84c] active:scale-90 transition-all"
                                    >
                                        <Share2 size={16} strokeWidth={2} />
                                    </button>
                                </div>

                                {/* Floating Overlay for Desktop */}
                                <div className="hidden sm:flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent p-4 items-end justify-between z-10 pointer-events-none">
                                    <div>
                                        {listing.images?.length > 0 && (
                                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                {t('property_details.image')} {mainImageIndex + 1} / {listing.images.length}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleShareOptions}
                                        className="bg-white hover:bg-slate-50 text-slate-900 p-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs font-bold pointer-events-auto"
                                        title="Share Property"
                                    >
                                        <Share2 size={14} className="text-[#c9a84c]" />
                                        <span>{t('property_details.share_listing')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnails Container */}
                            {listing.images?.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto px-4 sm:px-0 mt-3 sm:mt-4 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {listing.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setMainImageIndex(idx)}
                                            className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all relative ${mainImageIndex === idx
                                                ? 'border-[#c9a84c] scale-98 shadow-sm ring-2 ring-[#c9a84c]/20'
                                                : 'border-slate-100 opacity-70 hover:opacity-100 hover:scale-98'
                                                }`}
                                        >
                                            <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Simplified Core Overview Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {/* Spec 1: Plot Area */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 sm:mb-2">{t('property_details.plot_size')}</span>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">{getConvertedArea()}</span>
                                    <select
                                        value={displayUnit}
                                        onChange={e => setDisplayUnit(e.target.value)}
                                        className="text-[9px] sm:text-[10px] font-black bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 sm:py-1 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c9a84c] w-full"
                                    >
                                        {Object.keys(conversionFactors).map(u => (
                                            <option key={u} value={u}>{getUnitLabel(u)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Spec 2: Property Type */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 sm:mb-2">{t('property_details.category')}</span>
                                <div className="mt-auto">
                                    <span className="text-sm sm:text-lg font-extrabold text-slate-900 block truncate">{getFormattedType()}</span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{listing.propertyType === 'Plot' ? t('search_page.plots') : t('search_page.lands')}</span>
                                </div>
                            </div>

                            {/* Spec 3: Listed Date */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 sm:mb-2">{t('property_details.listed_on')}</span>
                                <div className="mt-auto">
                                    <span className="text-sm sm:text-lg font-extrabold text-slate-900 block truncate">
                                        {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                        {new Date(listing.createdAt).getFullYear()}
                                    </span>
                                </div>
                            </div>

                            {/* Spec 4: Land Touch */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 sm:mb-2">{t('property_details.status')}</span>
                                <div className="mt-auto">
                                    <span className={`inline-flex text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${listing.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                        }`}>
                                        {listing.status === 'Available' ? t('property_details.available') : listing.status}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{t('property_details.ready_for_sale')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. About Section */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-[#c9a84c]" /> {t('property_details.about_this_property')}
                            </h3>
                            <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-5" />
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                                {listing.description || t('property_details.no_desc')}
                            </p>
                        </div>

                        {/* 4. Redesigned Detailed Specifications (Jargon-free) */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2" >
                                <SlidersHorizontal size={20} className="text-[#c9a84c]" /> {t('property_details.specifications')}
                            </h3>
                            <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-6" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Prop Category */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <Layers className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.category_label')}</span>
                                        <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                            {listing.propertyType === 'Plot' ? t('search_page.plots') : (listing.propertyType === 'Land' ? t('search_page.lands') : t('property_details.plot_or_land', 'Plot / Land'))}
                                        </span>
                                    </div>
                                </div>

                                {/* Plot Subtype */}
                                {listing.propertyType === 'Plot' && listing.plotType && listing.plotType !== 'None' && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <LandPlot className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.plot_classification')}</span>
                                            <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                                {t(`search_page.${listing.plotType.toLowerCase().replace('-', '_')}`, listing.plotType)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {listing.propertyType === 'Land' && listing.landType && listing.landType !== 'None' && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <LandPlot className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.land_classification')}</span>
                                            <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                                {t(`search_page.${listing.landType.toLowerCase().replace('-', '_')}`, listing.landType)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Location Details */}
                                {(listing.city || listing.locality) && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <MapPin className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.city_locality')}</span>
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
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.listed_by')}</span>
                                        <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                                            {listing.ownerType === 'Broker' ? t('property_details.builder_agency') : t('property_details.direct_owner')}
                                        </span>
                                    </div>
                                </div>

                                {/* Key Highlights (Pill format instead of dry lists) */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl sm:col-span-2">
                                    <ShieldCheck className="text-[#c9a84c] shrink-0 mt-0.5" size={18} />
                                    <div className="w-full">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('property_details.highlights')}</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {listing.cornerPlot && (
                                                <span className="bg-[#c9a84c]/10 text-[#85651b] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#c9a84c]/20 uppercase tracking-wider">{t('property_details.corner_plot')}</span>
                                            )}
                                            {listing.roadTouch && (
                                                <span className="bg-[#c9a84c]/10 text-[#85651b] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#c9a84c]/20 uppercase tracking-wider">{t('property_details.road_touch')}</span>
                                            )}
                                            {listing.isAgricultural && (
                                                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider">{t('property_details.agricultural')}</span>
                                            )}
                                            {!listing.cornerPlot && !listing.roadTouch && !listing.isAgricultural && (
                                                <span className="text-xs font-medium text-slate-400">{t('property_details.std_zone')}</span>
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
                                    <CheckCircle2 size={20} className="text-[#c9a84c]" /> {t('property_details.amenities_title')}
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
                        {(listing.locationMode === 'map' && listing.mapCoordinates && !isNaN(parseFloat(listing.mapCoordinates.lat)) && !isNaN(parseFloat(listing.mapCoordinates.lng))) && (
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2" >
                                            <MapPin size={20} className="text-[#c9a84c]" /> {t('property_details.satellite_map')}
                                        </h3>
                                        <div className="h-0.5 w-16 bg-[#c9a84c]/30 mt-2" />
                                    </div>
                                    {listing.mapConfig && (
                                        <button
                                            onClick={() => navigate(`/shared-map/${listing.mapConfig.shareId}`)}
                                            className="bg-slate-900 text-white hover:bg-[#c9a84c] hover:text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md self-start sm:self-center"
                                        >
                                            <Layers size={14} className="text-[#c9a84c]" /> {t('property_details.interactive_map_btn')}
                                        </button>
                                    )}
                                </div>

                                <div className="h-80 w-full relative z-0">
                                    <MapContainer
                                        center={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                        <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}>
                                            <Popup>
                                                <div className="font-bold text-slate-900">{listing.title}</div>
                                                <div className="text-xs text-slate-500">{listing.location}</div>
                                            </Popup>
                                        </Marker>
                                        <MapRecenter position={{ lat: parseFloat(listing.mapCoordinates.lat), lng: parseFloat(listing.mapCoordinates.lng) }} />
                                    </MapContainer>
                                </div>

                                <div className="p-4 bg-slate-50 flex items-center gap-3 border-t border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] shrink-0">
                                        <Navigation size={16} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 leading-normal">
                                        {t('property_details.google_satellite_hint')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 7. Videos and Documentation */}
                        {(listing.documents?.length > 0 || listing.videos?.length > 0) && (
                            <div className="bg-[#FAF9F5] border border-[#c9a84c]/30 rounded-3xl p-6 sm:p-8 shadow-xs">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" >
                                    <ShieldCheck size={22} className="text-[#c9a84c]" /> {t('property_details.verified_docs')}
                                </h3>
                                <div className="h-0.5 w-16 bg-[#c9a84c]/30 mb-6" />

                                {listing.videos?.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('property_details.drone_footage')}</h4>
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
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('property_details.legal_papers')}</h4>
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
                                                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-[#c9a84c] transition-colors truncate">{t('property_details.legal_document')} {idx + 1}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                                            {t('property_details.click_to_view')} <ExternalLink size={10} />
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
                                <MessageCircle size={20} className="text-[#c9a84c]" /> {t('property_details.buyer_reviews')}
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
                                            {t('property_details.based_on')} {reviewsData?.count || 0} {reviewsData?.count === 1 ? t('property_details.review_count') : t('property_details.reviews_count')}
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
                                                    <span className="font-extrabold text-slate-950 text-xs">{review.user?.name || t('property_details.anonymous')}</span>
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
                                    <h4 className="text-xs font-bold text-slate-900 mb-0.5">{t('property_details.no_reviews')}</h4>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">{t('property_details.reviews_feedback_hint')}</p>
                                </div>
                            )}

                            {/* Add Review Form */}
                            {isAuthenticated && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('property_details.post_feedback')}</h4>
                                    <form onSubmit={handleSubmitReview} className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('property_details.assign_stars')}</label>
                                            {renderStars()}
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('property_details.your_experience')}</label>
                                            <textarea
                                                value={newReview.comment}
                                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                placeholder={t('property_details.review_placeholder')}
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
                                            {submittingReview ? t('property_details.submitting_review') : t('property_details.submit_review')}
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
                                    <Users size={15} className="text-[#c9a84c]" /> {t('property_details.seller_contact')}
                                </h3>

                                <div
                                    onClick={() => navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`)}
                                    className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl cursor-pointer transition-all group"
                                >
                                    <div className="w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-base shrink-0 group-hover:scale-105 transition-all">
                                        {listing.createdBy?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#c9a84c] transition-colors">{listing.createdBy?.name || t('property_details.authorized_seller')}</div>
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
                                        {t('property_details.manage_listings')}
                                    </button>
                                ) : (
                                    <div className="space-y-2.5">
                                        <button
                                            onClick={handleSiteVisitRequest}
                                            disabled={requestingVisit}
                                            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                        >
                                            <Calendar size={14} className="stroke-[2.5px] text-[#c9a84c]" />
                                            {requestingVisit ? t('property_details.requesting_visit') : t('property_details.request_site_visit')}
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
                                            {isFavorite ? t('property_details.saved_listing') : t('property_details.save_to_favorites')}
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
                                            <><CheckCircle2 size={15} /> {t('property_details.land_reserved')}</>
                                        ) : systemSettings?.isInstantBookingEnabled === false ? (
                                            <><ZapOff size={15} /> {t('property_details.booking_suspended')}</>
                                        ) : (
                                            <><Zap size={15} className="fill-current" /> {t('property_details.instant_booking')}</>
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
                                                    {t('property_details.token_desc')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleReserveToken}
                                                disabled={submitting}
                                                className="w-full py-3.5 bg-linear-to-r from-[#c9a84c] to-[#b8933a] hover:from-[#b8933a] hover:to-[#a67c00] disabled:bg-[#d1c9b8] text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all uppercase tracking-widest"
                                            >
                                                {submitting ? t('property_details.initiating_gate') : t('property_details.reserve_securely')}
                                            </button>
                                        </div>
                                    )}

                                    {!listing.isTokened && systemSettings?.isInstantBookingEnabled === false && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                {t('property_details.booking_paused_desc')}
                                            </p>
                                        </div>
                                    )}

                                    {listing.isTokened && (
                                        <div className="text-center bg-white/80 border border-emerald-100 rounded-2xl p-4">
                                            <span className="text-xs text-emerald-800 font-extrabold block">✓ {t('property_details.property_booked')}</span>
                                            <span className="text-[10px] text-slate-500 font-bold block mt-1">
                                                {t('property_details.reserved_on')} {new Date(listing.tokenedAt).toLocaleDateString('en-IN')}
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
                            <Users size={14} className="text-[#c9a84c]" /> {t('property_details.seller_reference')}
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-sm shrink-0">
                                {listing.createdBy?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="font-extrabold text-slate-900 text-xs">{listing.createdBy?.name || t('property_details.agent')}</div>
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
                                {t('navbar.dashboard')}
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleSiteVisitRequest}
                                    className="py-3 bg-slate-950 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 uppercase tracking-widest"
                                >
                                    <Calendar size={13} className="text-[#c9a84c]" /> {t('search_page.contact')}
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
                <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl px-4 py-3 md:hidden flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{t('search_page.total_price')}</span>
                        <div className="text-base font-black text-slate-950 truncate" >
                            ₹{listing.price?.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            onClick={handleWhatsApp}
                            className="w-10 h-10 bg-[#25d366] text-white rounded-full flex items-center justify-center transition-all shadow-md shrink-0 hover:scale-105 active:scale-95"
                            title="Chat on WhatsApp"
                        >
                            <MessageCircle size={18} className="fill-current" />
                        </button>

                        {listing.isBookingEnabled && !listing.isTokened && systemSettings?.isInstantBookingEnabled !== false ? (
                            <>
                                <button
                                    onClick={handleSiteVisitRequest}
                                    disabled={requestingVisit}
                                    className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-800 shadow-sm active:scale-95 transition-all"
                                    title={t('search_page.contact')}
                                >
                                    <Calendar size={16} className="text-slate-600" />
                                </button>
                                <button
                                    onClick={handleReserveToken}
                                    disabled={submitting}
                                    className="h-10 px-4 bg-gradient-to-r from-[#c9a84c] to-[#b8933a] hover:from-[#b8933a] hover:to-[#a67c00] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 uppercase tracking-widest shadow-md transition-all active:scale-95 shrink-0"
                                >
                                    <Zap size={11} className="fill-current" /> {t('property_details.reserve_securely')}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSiteVisitRequest}
                                disabled={requestingVisit}
                                className="h-10 px-5 bg-slate-950 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 uppercase tracking-wider shadow-md active:scale-95 transition-all"
                            >
                                <Calendar size={14} className="text-[#c9a84c]" />
                                <span>{requestingVisit ? '...' : t('search_page.contact')}</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Receipt Modal */}
            <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} />

            {/* Share Options Modal */}
            {showShareModal && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
                    onClick={() => setShowShareModal(false)}
                >
                    <div
                        className="bg-white border border-[#e2d9c5]/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
                            onClick={() => setShowShareModal(false)}
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-black text-[#1a2340] mb-4 pr-8 uppercase tracking-wider" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
                            Share Property
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* WhatsApp */}
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${listing?.title || 'Property'} - ${listing?.location || ''}: ${window.location.origin}/listings/${cleanId}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-all text-emerald-800"
                            >
                                <div className="w-10 h-10 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-sm">
                                    <MessageCircle size={18} className="fill-current" />
                                </div>
                                <span className="text-xs font-bold">WhatsApp</span>
                            </a>

                            {/* Twitter / X */}
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${listing?.title || 'Property'} in ${listing?.location || ''}`)}&url=${encodeURIComponent(`${window.location.origin}/listings/${cleanId}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all text-slate-800"
                            >
                                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-sm">
                                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold">Twitter / X</span>
                            </a>

                            {/* Facebook */}
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/listings/${cleanId}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition-all text-blue-800"
                            >
                                <div className="w-10 h-10 bg-[#1877f2] text-white rounded-full flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold">Facebook</span>
                            </a>

                            {/* Copy Link */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/listings/${cleanId}`);
                                    toast.success(t('property_details.link_copied') || 'Listing link copied to clipboard');
                                    setShowShareModal(false);
                                }}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-all text-amber-800"
                            >
                                <div className="w-10 h-10 bg-[#c9a84c] text-white rounded-full flex items-center justify-center shadow-sm">
                                    <Share2 size={18} />
                                </div>
                                <span className="text-xs font-bold">Copy Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetails;