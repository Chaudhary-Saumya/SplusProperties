import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Heart, Share2, MapPin, Calendar, CheckCircle2, Phone, ChevronRight,
    ArrowLeft, Maximize2, Eye, LandPlot, UserCheck, FileText, Users,
    ShieldCheck, Download, MessageSquare, ExternalLink, Image, Clock,
    Check, X, Zap, ZapOff, Award, Star, UserRound, MessageCircle, Navigation, Layers,
    SlidersHorizontal, Sparkles, ChevronLeft, Building2, Info, PhoneCall, Send,
    CheckCircle, Tag, Shield, Compass, Sparkle, ArrowUpRight, Copy
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import PhotoLightbox from '../components/PhotoLightbox';
import { useQuery } from '@tanstack/react-query';
import ErrorBox from '../components/ErrorBox';
import DetailSkeleton from '../components/DetailSkeleton';
import { getImageUrl } from '../utils/imageUrl';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { getWebsiteBaseUrl } from '../utils/url';
import { openWhatsAppInquiry } from '../utils/whatsapp';
import { triggerHaptic } from '../utils/haptics';
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
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showPhoneNumber, setShowPhoneNumber] = useState(false);
    const [expandDescription, setExpandDescription] = useState(false);
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const { user, isAuthenticated, updateFavorites } = useContext(AuthContext);
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [displayUnit, setDisplayUnit] = useState('sqft');
    const [originalAreaValue, setOriginalAreaValue] = useState(0);
    const [originalUnit, setOriginalUnit] = useState('sqft');
    const [requestingVisit, setRequestingVisit] = useState(false);

    // Form states for dealer inquiry
    const [userRoleType, setUserRoleType] = useState('Individual');
    const [inquiryName, setInquiryName] = useState(user?.name || '');
    const [inquiryPhone, setInquiryPhone] = useState(user?.phone || '');
    const [inquiryMsg, setInquiryMsg] = useState('I am interested in this Property. Please contact me with more details.');

    // Review states
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);

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

    const { settings: systemSettings } = useSettings();
    const isTokenBookingEnabled = systemSettings?.enableTokenBooking === true;

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
            const subTypeTrans = t(`search_page.${subTypeKey}`, subTypeValue);
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
            sqft: language === 'gu' ? 'ચોરસ ફૂટ' : 'Sq.Ft.',
            gaj: language === 'gu' ? 'ગજ / વાર' : 'Gaj / Sq.Yd',
        };
        return labels[u] || u;
    };


    const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
        queryKey: ['reviews', cleanId],
        queryFn: async () => {
            const res = await axios.get(`/api/listings/${cleanId}/reviews`);
            return res.data;
        }
    });

    const { data: similarData } = useQuery({
        queryKey: ['similarListings', cleanId],
        enabled: !!cleanId,
        queryFn: async () => {
            try {
                const res = await axios.get(`/api/recommendations/similar/${cleanId}`);
                return res.data.data;
            } catch {
                return [];
            }
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
        if (user) {
            setInquiryName(user.name || '');
            setInquiryPhone(user.phone || '');
        }
    }, [user]);

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

    const formatIndianPrice = (price) => {
        if (!price || isNaN(price)) return 'Price on Request';
        if (price >= 10000000) {
            return `₹ ${(price / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
        }
        if (price >= 100000) {
            return `₹ ${(price / 100000).toFixed(2).replace(/\.00$/, '')} Lac`;
        }
        return `₹ ${price.toLocaleString('en-IN')}`;
    };

    const getConvertedArea = () => {
        if (!originalAreaValue) return listing?.area;
        const baseGuntha = originalAreaValue * conversionFactors[originalUnit];
        const convertedValue = baseGuntha / conversionFactors[displayUnit];
        if (convertedValue < 0.01) return convertedValue.toFixed(6);
        if (convertedValue < 1) return convertedValue.toFixed(4);
        return convertedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    const getListingHighlights = () => {
        if (!listing) return [];
        const items = [];

        if (listing.roadTouch) {
            items.push({ id: 'road', text: 'Direct Road Touch Access' });
        }
        if (listing.cornerPlot) {
            items.push({ id: 'corner', text: 'Corner Plot (Multi-side Open)' });
        }
        if (listing.listingType === 'Verified' || listing.verifiedAt) {
            items.push({ id: 'verified', text: 'Admin Verified Property' });
        }
        if (listing.isAgricultural) {
            items.push({ id: 'agri', text: 'Agricultural Soil & Farming Land' });
        } else if (listing.landType === 'Non-Agricultural' || listing.plotType === 'Commercial') {
            items.push({ id: 'na', text: 'Non-Agricultural (NA) Land Zone' });
        }
        if (listing.plotType && listing.plotType !== 'None') {
            items.push({ id: 'plotType', text: `${listing.plotType} Approved Zone` });
        } else if (listing.landType && listing.landType !== 'None') {
            items.push({ id: 'landType', text: `${listing.landType} Approved Land` });
        }
        if (listing.ownerType === 'Owner') {
            items.push({ id: 'owner', text: 'Direct Owner Sale (Zero Broker Fee)' });
        } else if (listing.ownerType === 'Broker') {
            items.push({ id: 'broker', text: 'Listed by Authorized Real Estate Agent' });
        }
        if (listing.isBookingEnabled && listing.tokenAmount > 0) {
            items.push({ id: 'token', text: `Online Token Reservation Available (₹${listing.tokenAmount?.toLocaleString('en-IN')})` });
        }
        if (listing.documents?.length > 0) {
            items.push({ id: 'docs', text: `${listing.documents.length} Legal Document(s) Uploaded` });
        }
        if (listing.videos?.length > 0) {
            items.push({ id: 'videos', text: 'Drone Video Walkthrough Available' });
        }
        if (listing.locationMode === 'map' && listing.mapCoordinates?.lat) {
            items.push({ id: 'gps', text: 'Exact GPS Satellite Location Mapped' });
        }
        if (listing.amenities?.length > 0) {
            listing.amenities.slice(0, 3).forEach((a, i) => {
                items.push({ id: `amenity_${i}`, text: `Facility: ${a}` });
            });
        }

        if (items.length === 0) {
            items.push({ id: 'location', text: `Located in ${listing.location || 'Gujarat'}` });
            items.push({ id: 'type', text: `${getFormattedType()}` });
        }

        return items;
    };

    const getCleanFullAddress = () => {
        if (!listing) return '';
        const loc = (listing.location || '').trim();
        const plot = (listing.plotNumber || '').trim();
        const area = (listing.areaName || '').trim();

        if (loc) {
            // Check if loc already contains plot number or areaName
            let hasPlot = plot && loc.toLowerCase().includes(plot.toLowerCase());
            let hasArea = area && loc.toLowerCase().includes(area.toLowerCase());

            const extraParts = [];
            if (plot && !hasPlot) extraParts.push(`Plot ${plot}`);
            if (area && !hasArea) extraParts.push(area);

            return extraParts.length > 0 ? `${extraParts.join(', ')}, ${loc}` : loc;
        }

        return [
            plot ? `Plot ${plot}` : '',
            area,
            listing.locality,
            listing.city,
            listing.state || 'Gujarat, India'
        ].filter(Boolean).join(', ');
    };

    const handleCopyAddress = (e) => {
        if (e) e.stopPropagation();
        const fullAddr = getCleanFullAddress();
        if (!fullAddr) return;
        navigator.clipboard.writeText(fullAddr);
        setCopiedAddress(true);
        toast.success('📋 Address copied to clipboard!');
        setTimeout(() => setCopiedAddress(false), 2500);
    };

    const getGoogleMapsUrl = () => {
        if (listing?.mapCoordinates?.lat && listing?.mapCoordinates?.lng) {
            return `https://www.google.com/maps/search/?api=1&query=${listing.mapCoordinates.lat},${listing.mapCoordinates.lng}`;
        }
        const fullAddr = getCleanFullAddress();
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
    };

    const handleFavorite = async () => {
        if (!isAuthenticated) return navigate('/login');
        try {
            const res = await axios.post(`/api/auth/favorites/${cleanId}`);
            if (res.data && res.data.data && updateFavorites) {
                updateFavorites(res.data.data);
            }
            const nextState = !isFavorite;
            setIsFavorite(nextState);
            toast.success(nextState ? t('property_details.add_to_fav_success') : t('property_details.remove_from_fav_success'));
        } catch (err) {
            toast.error(t('property_details.failed_favorites'));
        }
    };

    const handleSiteVisitRequest = async (e) => {
        if (e) e.preventDefault();
        if (!isAuthenticated) return navigate('/login');
        setRequestingVisit(true);
        try {
            await axios.post('/api/inquiries', {
                listingId: cleanId,
                type: 'SiteVisit',
                message: `${inquiryMsg} (User Type: ${userRoleType}, Contact: ${inquiryPhone || user?.phone || 'N/A'})`
            });
            toast.success(t('property_details.site_visit_success') || 'Enquiry submitted! The seller will reach out soon.');
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
            const { data } = await axios.post('/api/payments/create-order', {
                listingId: cleanId
            });

            const options = {
                key: data.key,
                amount: data.amount,
                currency: 'INR',
                name: 'LandSelling Token',
                description: `Reserve ${listing.title}`,
                order_id: data.orderId,
                handler: async function (response) {
                    const verifyRes = await axios.post('/api/payments/verify', response);
                    if (verifyRes.data.success) {
                        toast.success(t('property_details.reserved_success') + '! Receipt: ' + verifyRes.data.receiptNumber);
                        setReceiptData(verifyRes.data.transaction || verifyRes.data);
                        setShowReceipt(true);
                        refetch();
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: {
                    color: '#0284c7'
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
        triggerHaptic('medium');
        axios.post('/api/inquiries/track-lead', { listingId: cleanId, leadType: 'WhatsApp' }).catch(() => {});
        openWhatsAppInquiry({
            phone: listing?.createdBy?.phone,
            title: listing?.title,
            listingId: cleanId,
            price: listing?.price,
            area: listing?.area,
            location: listing?.location,
            propertyType: listing?.propertyType
        });
    };

    const handleCall = () => {
        axios.post('/api/inquiries/track-lead', { listingId: cleanId, leadType: 'Call' }).catch(() => {});
        const phone = listing?.createdBy?.phone || '';
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    const handleShareOptions = async (e) => {
        if (e) e.stopPropagation();
        const listingUrl = `${getWebsiteBaseUrl()}/listings/${cleanId}`;
        const shareData = {
            title: listing?.title || 'LandSelling Property',
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

    const scrollToSection = (sectionId) => {
        setActiveTab(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 130;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

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
                            className="transition-all duration-150 transform hover:scale-110 focus:outline-none p-0.5"
                        >
                            <Star
                                size={26}
                                className={`transition-colors duration-150 ${i <= currentRating
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-200 hover:text-amber-400 fill-transparent'
                                    }`}
                                strokeWidth={i <= currentRating ? 1.5 : 2}
                            />
                        </button>
                    ))}
                </div>
                {currentRating > 0 && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        {ratingLabels[currentRating]}
                    </span>
                )}
            </div>
        );
    };

    if (isLoading) return <DetailSkeleton />;
    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;
    if (!listing) return <div className="py-20 text-center"><p className="text-slate-500 font-bold">{t('property_details.property_not_found')}</p></div>;

    const ratePerSqft = listing.price && originalAreaValue ? Math.round(listing.price / originalAreaValue) : null;

    return (
        <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen pb-24 lg:pb-16 text-slate-800 antialiased">
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

            {/* ── Top Navigation Bar (Mobile & Desktop) ── */}
            <div className="bg-white border-b border-slate-200 text-xs py-2 px-3 sm:px-6 lg:px-8 sticky top-[var(--navbar-height)] z-20 shadow-2xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5 text-slate-500 font-medium overflow-hidden text-xs">
                        <button
                            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/search')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                            title="Go Back"
                        >
                            <ArrowLeft size={14} />
                            <span>Back</span>
                        </button>
                        <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors hidden sm:inline">Home</button>
                        <ChevronRight size={12} className="text-slate-400 shrink-0 hidden sm:inline" />
                        <button onClick={() => navigate('/search')} className="hover:text-blue-600 transition-colors truncate hidden sm:inline">
                            Properties in {listing.location?.split(',')[0] || 'Gujarat'}
                        </button>
                        <ChevronRight size={12} className="text-slate-400 shrink-0 hidden sm:inline" />
                        <span className="text-slate-800 font-semibold truncate max-w-[160px] sm:max-w-xs">{listing.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">ID: #{cleanId.substring(0, 8)}</span>
                    </div>
                </div>
            </div>

            {/* ── Main Property Info Header ── */}
            <div className="bg-white border-b border-slate-200 py-4 sm:py-6 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">

                        {/* Price & Title Left Column */}
                        <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                                    listing.status === 'Sold'
                                        ? 'bg-amber-500 text-slate-950 font-black'
                                        : listing.status === 'Available' || listing.status === 'Active'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-700 text-white'
                                }`}>
                                    {listing.status === 'Sold' ? (
                                        <>
                                            <CheckCircle2 size={12} className="text-slate-950" />
                                            <span>SOLD</span>
                                        </>
                                    ) : listing.status === 'Available' || listing.status === 'Active' ? 'AVAILABLE' : listing.status}
                                </span>

                                {listing.listingType === 'Verified' && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                                        <ShieldCheck size={12} className="text-blue-600" /> VERIFIED PROPERTY
                                    </span>
                                )}

                                {isTokenBookingEnabled && listing.isBookingEnabled && listing.status !== 'Sold' && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                                        <Zap size={11} className="fill-amber-500 text-amber-500" /> TOKEN BOOKING READY
                                    </span>
                                )}
                            </div>

                            {listing.status === 'Sold' && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-amber-900">
                                    <CheckCircle2 size={16} className="text-amber-700 shrink-0" />
                                    <span>This property has been marked as <strong>SOLD</strong>. Inquiries and bookings are closed.</span>
                                </div>
                            )}

                            {/* Main Title */}
                            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                                {listing.title}
                            </h1>

                            {/* Address & Locality */}
                            <div className="flex items-start gap-1.5 text-slate-600 text-xs sm:text-sm font-medium">
                                <MapPin size={15} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0 leading-snug">
                                    <span className="text-slate-700">
                                        {isAddressExpanded || getCleanFullAddress().length <= 48 ? (
                                            getCleanFullAddress()
                                        ) : (
                                            <>
                                                <span>{getCleanFullAddress().slice(0, 45)}...</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddressExpanded(true)}
                                                    className="text-blue-600 font-bold hover:text-blue-700 hover:underline cursor-pointer ml-1 inline"
                                                >
                                                    more
                                                </button>
                                            </>
                                        )}
                                        {isAddressExpanded && getCleanFullAddress().length > 48 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddressExpanded(false)}
                                                className="text-blue-600 font-bold hover:text-blue-700 hover:underline cursor-pointer ml-1.5 inline"
                                            >
                                                less
                                            </button>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="inline-flex items-center text-slate-400 hover:text-slate-700 ml-2 align-middle transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-100"
                                        title="Copy address"
                                    >
                                        {copiedAddress ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="flex items-center justify-between sm:justify-start gap-4 lg:gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6">
                            {/* Price Block */}
                            <div className="flex flex-col">
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Asking Price</span>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                                    {formatIndianPrice(listing.price)}
                                </div>
                                {ratePerSqft && (
                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                                        @ ₹{ratePerSqft.toLocaleString('en-IN')} per {getUnitLabel(originalUnit)}
                                    </span>
                                )}
                            </div>

                            {/* Header Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => scrollToSection('dealer-section')}
                                    className="hidden sm:flex bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm items-center gap-2 uppercase tracking-wide cursor-pointer"
                                >
                                    <PhoneCall size={14} />
                                    <span>Contact Dealer</span>
                                </button>

                                <button
                                    onClick={handleFavorite}
                                    className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs ${isFavorite
                                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    title="Shortlist Property"
                                >
                                    <Heart size={16} className={isFavorite ? 'fill-rose-600' : ''} />
                                    <span className="hidden sm:inline">{isFavorite ? 'Shortlisted' : 'Shortlist'}</span>
                                </button>

                                <button
                                    onClick={handleShareOptions}
                                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    title="Share Property"
                                >
                                    <Share2 size={16} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Sticky Navigation Tab Bar (Clean Scrolling Pills) ── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden py-1.5 text-xs font-bold text-slate-600">
                        <button
                            onClick={() => scrollToSection('overview')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'overview'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => scrollToSection('highlights')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'highlights'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Highlights
                        </button>
                        <button
                            onClick={() => scrollToSection('specs')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'specs'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Specifications
                        </button>
                        <button
                            onClick={() => scrollToSection('about')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'about'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            About
                        </button>
                        {listing.amenities?.length > 0 && (
                            <button
                                onClick={() => scrollToSection('amenities')}
                                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'amenities'
                                    ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                            >
                                Amenities
                            </button>
                        )}
                        <button
                            onClick={() => scrollToSection('map-section')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'map-section'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Map Location
                        </button>
                        <button
                            onClick={() => scrollToSection('dealer-section')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'dealer-section'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Dealer & Inquiry
                        </button>
                        <button
                            onClick={() => scrollToSection('reviews-section')}
                            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${activeTab === 'reviews-section'
                                ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            Reviews ({reviewsData?.count || 0})
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Body Container ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">

                {/* ── Section 1: Overview & Split Hero Grid ── */}
                <section id="overview" className="scroll-mt-36">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Image Showcase - 7 Cols */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
                            <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-950 group">
                                {listing.images?.length > 0 ? (
                                    <img
                                        src={getImageUrl(listing.images[mainImageIndex])}
                                        alt={listing.title}
                                        className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-102"
                                        onClick={() => setIsLightboxOpen(true)}
                                    />
                                ) : (listing.locationMode === 'map' && listing.mapCoordinates?.lat && listing.mapCoordinates?.lng) ? (
                                    <div className="w-full h-full relative z-0">
                                        <MapContainer
                                            center={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}
                                            zoom={15}
                                            zoomControl={true}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                            <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}>
                                                <Popup>{listing.title}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center">
                                        <Image size={40} className="text-slate-400 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">No Property Images Uploaded</span>
                                        <span className="text-[11px] text-slate-400 mt-1">Check location map or enquiry with dealer</span>
                                    </div>
                                )}

                                {/* Overlay Badge on Image */}
                                {listing.images?.length > 0 && (
                                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-md flex items-center gap-1.5 pointer-events-none">
                                        <Image size={13} />
                                        <span>Property ({mainImageIndex + 1}/{listing.images.length})</span>
                                    </div>
                                )}

                                {listing.images?.length > 0 && (
                                    <button
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-md transition-all shadow-sm"
                                        title="View Fullscreen"
                                    >
                                        <Maximize2 size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Thumbnail Row */}
                            {listing.images?.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
                                    {listing.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setMainImageIndex(idx)}
                                            className={`shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${mainImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-100 scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={getImageUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 99acres Key Spec Summary Grid Box - 5 Cols */}
                        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
                                <span>Property Details</span>
                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">Verified</span>
                            </h2>

                            <div className="grid grid-cols-2 gap-4">

                                {/* Spec: Area */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Area</span>
                                        <LandPlot size={14} className="text-blue-600" />
                                    </div>
                                    <div className="text-base font-extrabold text-slate-900">{getConvertedArea()}</div>
                                    <select
                                        value={displayUnit}
                                        onChange={e => setDisplayUnit(e.target.value)}
                                        className="text-[10px] font-bold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded mt-1.5 w-full focus:outline-none focus:border-blue-600"
                                    >
                                        {Object.keys(conversionFactors).map(u => (
                                            <option key={u} value={u}>{getUnitLabel(u)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Spec: Configuration / Subtype */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Type</span>
                                        <Building2 size={14} className="text-blue-600" />
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900 truncate">{getFormattedType()}</div>
                                    <div className="text-[10px] font-semibold text-slate-500 mt-1">
                                        {listing.propertyType === 'Plot' ? listing.plotType : listing.landType || 'Standard'}
                                    </div>
                                </div>

                                {/* Spec: Price Details */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Total Price
                                    </div>
                                    <div className="text-base font-extrabold text-slate-900">{formatIndianPrice(listing.price)}</div>
                                    {ratePerSqft && (
                                        <div className="text-[10px] font-semibold text-slate-500 mt-1">
                                            @ ₹{ratePerSqft}/sqft
                                        </div>
                                    )}
                                </div>

                                {/* Spec: Address */}
                                <div 
                                    onClick={() => setShowAddressModal(true)}
                                    className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group relative flex flex-col justify-between"
                                    title="Click to view full address details"
                                >
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                            <span>Address</span>
                                            <MapPin size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                            {listing.location || 'Location details'}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-500 mt-1.5 flex items-center justify-between pt-1 border-t border-slate-200/50">
                                        <span className="truncate">{listing.areaName ? `${listing.areaName}, ` : ''}{listing.city || 'Gujarat'}</span>
                                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-100/80 px-1.5 py-0.5 rounded shrink-0 ml-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            More
                                        </span>
                                    </div>
                                </div>

                                {/* Spec: Facing & Features */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Road & Touch</span>
                                        <Compass size={14} className="text-blue-600" />
                                    </div>
                                    <div className="text-xs font-extrabold text-slate-900">
                                        {listing.roadTouch ? 'Road Touch' : 'Internal Access'}
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-500 mt-1">
                                        {listing.cornerPlot ? 'Corner Plot (2-side)' : 'Standard Frontage'}
                                    </div>
                                </div>

                                {/* Spec: Ownership */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Ownership & Listed By
                                    </div>
                                    <div className="text-xs font-extrabold text-slate-900">
                                        {listing.ownerType === 'Broker' ? 'Authorized Agent' : 'Direct Owner'}
                                    </div>
                                    <div className="text-[10px] font-semibold text-emerald-600 mt-1">
                                        {listing.status === 'Available' ? 'Ready for Possession' : listing.status}
                                    </div>
                                </div>
                            </div>

                            {/* Token Reservation Callout Card */}
                            {isTokenBookingEnabled && listing.isBookingEnabled && listing.tokenAmount > 0 && !listing.isTokened && (
                                <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                            <Zap size={12} className="fill-amber-400" /> Instant Token Reservation
                                        </span>
                                        <span className="text-xs font-extrabold text-white">₹{listing.tokenAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                                        Reserve this property instantly online to lock the price and block other buyers.
                                    </p>
                                    <button
                                        onClick={handleReserveToken}
                                        disabled={submitting}
                                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg transition-all uppercase tracking-wider shadow-md"
                                    >
                                        {submitting ? 'Initiating Gate...' : 'Reserve Property Now'}
                                    </button>
                                </div>
                            )}

                        </div>

                    </div>
                </section>

                {/* ── Section 2: Why You Should Consider This Property (99acres Highlights Box) ── */}
                <section id="highlights" className="scroll-mt-36">
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-2xs">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Why you should consider this property?</h3>
                                <p className="text-xs text-slate-500 font-medium">Key advantages & highlights of this verified listing</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getListingHighlights().map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-blue-100/60 shadow-2xs">
                                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                    <span className="text-xs font-bold text-slate-800">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Section 3: Specifications ── */}
                <section id="specs" className="scroll-mt-36">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                        <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-blue-600" />
                            <span>Detailed Property Specifications</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs py-2">
                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Property Classification</span>
                                <span className="font-extrabold text-slate-900 text-sm">{getFormattedType()}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Plot Area</span>
                                <span className="font-extrabold text-slate-900 text-sm">{getConvertedArea()} ({getUnitLabel(displayUnit)})</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Price / Valuation</span>
                                <span className="font-extrabold text-slate-900 text-sm">{formatIndianPrice(listing.price)}</span>
                            </div>

                            {listing.plotNumber && (
                                <div className="space-y-1">
                                    <span className="text-slate-400 font-medium block">Plot / Survey Number</span>
                                    <span className="font-extrabold text-slate-900 text-sm">{listing.plotNumber}</span>
                                </div>
                            )}

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Location / Locality</span>
                                <span className="font-extrabold text-slate-900 text-sm">{listing.location}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Ownership Status</span>
                                <span className="font-extrabold text-slate-900 text-sm">Freehold / Verified</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Listed By</span>
                                <span className="font-extrabold text-slate-900 text-sm">{listing.ownerType === 'Broker' ? 'Authorized Agent / Dealer' : 'Direct Land Owner'}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Road Frontage</span>
                                <span className="font-extrabold text-slate-900 text-sm">{listing.roadTouch ? 'Direct Road Facing' : 'Internal Layout Road'}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 font-medium block">Token Booking</span>
                                <span className="font-extrabold text-slate-900 text-sm">{listing.isBookingEnabled ? 'Available Online' : 'Standard Inquiry'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Section 4: About Property ── */}
                <section id="about" className="scroll-mt-36">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                        <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            <span>About Property</span>
                        </h3>

                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 font-normal">
                            <p className={expandDescription ? '' : 'line-clamp-4'}>
                                {listing.description || 'This prime property offers excellent accessibility and clear legal titles. Contact the authorized seller for more details or to schedule a site visit.'}
                            </p>

                            {listing.description && listing.description.length > 250 && (
                                <button
                                    onClick={() => setExpandDescription(!expandDescription)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 underline focus:outline-none"
                                >
                                    {expandDescription ? 'Show Less ▲' : 'Read More >>'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Section 5: Amenities ── */}
                {listing.amenities?.length > 0 && (
                    <section id="amenities" className="scroll-mt-36">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                            <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-blue-600" />
                                <span>Amenities & Features</span>
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {listing.amenities.map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <Check size={16} className="text-blue-600 shrink-0 stroke-[2.5]" />
                                        <span className="text-xs font-bold text-slate-800">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Section 6: Locality & Map ── */}
                <section id="map-section" className="scroll-mt-36">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <MapPin size={18} className="text-blue-600" />
                                    <span>Explore Locality & Satellite Map</span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{listing.location}</p>
                            </div>

                            {listing.mapConfig && (
                                <button
                                    onClick={() => navigate(`/shared-map/${listing.mapConfig.shareId}`)}
                                    className="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center"
                                >
                                    <Layers size={14} /> Interactive GIS Map
                                </button>
                            )}
                        </div>

                        {(listing.locationMode === 'map' && listing.mapCoordinates?.lat && listing.mapCoordinates?.lng) ? (
                            <div className="h-80 w-full relative z-0">
                                <MapContainer
                                    center={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                    <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]}>
                                        <Popup>
                                            <div className="font-bold text-slate-900">{listing.title}</div>
                                            <div className="text-xs text-slate-500">{listing.location}</div>
                                        </Popup>
                                    </Marker>
                                    <MapRecenter position={{ lat: parseFloat(listing.mapCoordinates.lat), lng: parseFloat(listing.mapCoordinates.lng) }} />
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 text-slate-500 text-xs font-medium">
                                <Navigation size={28} className="mx-auto text-slate-400 mb-2" />
                                Exact GPS coordinates not pinned. Location: <strong>{listing.location}</strong>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Section 7: Dealer Details & Send Enquiry (99acres Form) ── */}
                <section id="dealer-section" className="scroll-mt-36">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Dealer Profile - Left 4 Cols */}
                            <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
                                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Dealer Details</h3>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                                        {listing.createdBy?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold text-slate-900">{listing.createdBy?.name || 'Authorized Seller'}</h4>
                                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider mt-1">
                                            {listing.createdBy?.role || 'Seller'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    {showPhoneNumber ? (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-extrabold text-sm flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-500" /> {listing.createdBy?.phone || '+91 9409553232'}</span>
                                            <a href={`tel:${listing.createdBy?.phone}`} className="text-xs text-blue-600 hover:underline">Call Now</a>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowPhoneNumber(true)}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
                                        >
                                            <Phone size={15} /> View Phone Number
                                        </button>
                                    )}

                                    <button
                                        onClick={handleWhatsApp}
                                        className="w-full py-3 bg-[#25d366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        <MessageCircle size={15} className="fill-current" /> WhatsApp Chat
                                    </button>
                                </div>
                            </div>

                            {/* Send Enquiry Form - Right 7 Cols */}
                            {listing.status === 'Sold' ? (
                                <div className="lg:col-span-7 bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center">
                                    <span className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-xs">
                                        <CheckCircle2 size={24} className="text-slate-950" />
                                    </span>
                                    <h4 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">Inquiries are Closed</h4>
                                    <p className="text-xs text-slate-600 font-medium max-w-md">
                                        This land parcel has already been sold. New inquiries, phone calls, and site visit requests are no longer being accepted.
                                    </p>
                                </div>
                            ) : (
                                <div className="lg:col-span-7 space-y-4">
                                    <h3 className="text-base font-extrabold text-slate-900">Send enquiry to Dealer</h3>

                                    <form onSubmit={handleSiteVisitRequest} className="space-y-4">
                                        {/* User Role Radio Selector */}
                                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                                            <span>You are:</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="roleType"
                                                    checked={userRoleType === 'Individual'}
                                                    onChange={() => setUserRoleType('Individual')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                Individual
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="roleType"
                                                    checked={userRoleType === 'Dealer'}
                                                    onChange={() => setUserRoleType('Dealer')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                Dealer / Agent
                                            </label>
                                        </div>

                                        {/* Name & Phone Inputs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Your Full Name *"
                                                    value={inquiryName}
                                                    onChange={e => setInquiryName(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/50"
                                                />
                                            </div>

                                            <div>
                                                <input
                                                    type="tel"
                                                    required
                                                    placeholder="Your Phone Number *"
                                                    value={inquiryPhone}
                                                    onChange={e => setInquiryPhone(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Message box */}
                                        <div>
                                            <textarea
                                                rows="3"
                                                value={inquiryMsg}
                                                onChange={e => setInquiryMsg(e.target.value)}
                                                placeholder="Write message to dealer..."
                                                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/50"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={requestingVisit}
                                            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-lg transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Send size={14} />
                                            <span>{requestingVisit ? 'Sending Enquiry...' : 'Send Enquiry'}</span>
                                        </button>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </section>

                {/* ── Similar Projects & Land Parcels Section (99acres Production-Level UI) ── */}
                {similarData && similarData.length > 0 && (
                    <section id="similar-properties" className="scroll-mt-36">
                        <div className="font-['Nunito_Sans',sans-serif]">
                            
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                        {language === 'gu' ? 'સમાન પ્રોજેક્ટ્સ અને પ્લોટ્સ' : 'Similar Projects & Land Parcels'}
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                        {language === 'gu' ? 'આ વિસ્તારમાં પસંદ કરેલા શ્રેષ્ઠ પ્લોટ્સ' : 'Handpicked properties matching this location & land category'}
                                    </p>
                                </div>

                                {/* Slider Navigation Arrows */}
                                <div className="hidden sm:flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('similar-carousel-container');
                                            if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                                        }}
                                        className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-xs cursor-pointer transition-all"
                                        title="Scroll Left"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('similar-carousel-container');
                                            if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                                        }}
                                        className="w-10 h-10 rounded-full bg-[#2563eb] text-white hover:bg-blue-700 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                                        title="Scroll Right"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Horizontal Carousel List */}
                            <div
                                id="similar-carousel-container"
                                className="flex items-stretch gap-5 overflow-x-auto scrollbar-none pb-4 snap-x snap-mandatory"
                            >
                                {similarData.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => navigate(`/listings/${item._id}`)}
                                        className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                                    >
                                        {/* Image Container with Dark Gradient Overlay */}
                                        <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                                            {item.images?.[0] ? (
                                                <img
                                                    src={getImageUrl(item.images[0])}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                                    <Building2 size={28} className="text-slate-600 mb-1" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">VERIFIED LAND PARCEL</span>
                                                </div>
                                            )}

                                            {/* Bottom Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                                            {/* Top Left Badge: Property Type */}
                                            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-slate-900 shadow-md">
                                                <span>{(item.landType || item.propertyType || 'PLOT').toUpperCase()}</span>
                                            </div>

                                            {/* Top Right Heart Icon */}
                                            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/30 backdrop-blur-md text-white flex items-center justify-center shadow-md">
                                                <Heart size={15} />
                                            </div>

                                            {/* Bottom Image Floating Text */}
                                            <div className="absolute bottom-2.5 left-3 text-white text-[11px] font-bold tracking-wide flex items-center gap-1">
                                                {item.roadTouch ? <><Check size={12} /> Road Touch</> : (item.status === 'Active' ? 'Available' : item.status)}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                                                    {item.title}
                                                </h4>
                                                <p className="text-xs font-semibold text-slate-500 line-clamp-1 mt-0.5">
                                                    {item.landType || item.plotType || 'Land Parcel'} in {item.location || 'Gujarat'}
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm sm:text-base font-black text-slate-900">
                                                        {formatIndianPrice(item.price)}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-blue-600 group-hover:underline inline-flex items-center gap-1">
                                                    <span>View Details</span>
                                                    <ArrowUpRight size={13} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </section>
                )}


                {/* ── Section 8: Reviews & Feedback ── */}
                <section id="reviews-section" className="scroll-mt-36">

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <MessageCircle size={18} className="text-blue-600" />
                                <span>Ratings & Reviews</span>
                            </h3>

                            {reviewsData?.averageRating > 0 && (
                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                    <Star size={16} className="text-amber-500 fill-amber-400" />
                                    <span className="font-extrabold text-slate-900 text-sm">{reviewsData.averageRating}</span>
                                    <span className="text-[10px] text-slate-500 font-semibold">({reviewsData.count} reviews)</span>
                                </div>
                            )}
                        </div>

                        {/* Reviews list */}
                        {reviewsLoading ? (
                            <div className="animate-pulse bg-slate-100 h-20 rounded-xl"></div>
                        ) : reviewsData?.reviews?.length > 0 ? (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                {reviewsData.reviews.map((rev) => (
                                    <div key={rev._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-slate-900 text-xs">{rev.user?.name || 'Verified User'}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} className={i < rev.rating ? 'text-amber-500 fill-amber-400' : 'text-slate-300'} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium">{rev.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No reviews yet for this listing. Be the first to add feedback!</p>
                        )}

                        {/* Add Review */}
                        {isAuthenticated && (
                            <form onSubmit={handleSubmitReview} className="pt-3 border-t border-slate-100 space-y-3">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Feedback</h4>
                                {renderStars()}
                                <textarea
                                    value={newReview.comment}
                                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                    rows="2"
                                    placeholder="Write your review about this property or seller..."
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-5 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wider"
                                >
                                    {submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        )}
                    </div>
                </section>

            </div>

            {/* ── Mobile Sticky Bottom Action Bar (Clears Bottom Nav Bar) ── */}
            <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] lg:hidden flex items-center justify-between gap-3">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Price</span>
                    <span className="text-base font-black text-slate-900 leading-tight">{formatIndianPrice(listing.price)}</span>
                    {ratePerSqft && (
                        <span className="text-[10px] font-bold text-slate-500">
                            @ ₹{ratePerSqft.toLocaleString('en-IN')}/{getUnitLabel(originalUnit)}
                        </span>
                    )}
                </div>

                {listing.status === 'Sold' ? (
                    <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> SOLD
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleWhatsApp}
                            className="h-10 px-3 bg-[#25d366] hover:bg-emerald-600 text-white rounded-xl transition-all shadow-xs flex items-center gap-1 text-xs font-black uppercase tracking-wider active:scale-95 cursor-pointer"
                            title="Chat on WhatsApp"
                        >
                            <MessageCircle size={16} className="fill-current" />
                            <span>WhatsApp</span>
                        </button>

                        <button
                            onClick={() => scrollToSection('dealer-section')}
                            className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                            <PhoneCall size={14} />
                            <span>Call</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Full-Screen Immersive Photo Gallery Lightbox */}
            <PhotoLightbox
                images={listing.images || []}
                initialIndex={mainImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                title={listing.title}
            />

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-slate-900 text-base">Share Property</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${getWebsiteBaseUrl()}/listings/${cleanId}`);
                                    toast.success('Link copied to clipboard!');
                                    setShowShareModal(false);
                                }}
                                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                            >
                                Copy Link
                            </button>
                            <button
                                onClick={handleWhatsApp}
                                className="p-3 bg-[#25d366] text-white rounded-xl text-xs font-bold"
                            >
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} receiptData={receiptData} />

            {/* Address Details Modal */}
            {showAddressModal && (
                <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setShowAddressModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Property Address</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Verified Location Details</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAddressModal(false)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Full formatted address text */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Complete Address</span>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed select-all">
                                {getCleanFullAddress()}
                            </p>
                        </div>

                        {/* Grid Breakdown of Address Fields */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {listing.plotNumber && (
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 block">Plot / Survey No.</span>
                                    <span className="font-extrabold text-slate-800">{listing.plotNumber}</span>
                                </div>
                            )}
                            {listing.areaName && (
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 block">Locality / Area</span>
                                    <span className="font-extrabold text-slate-800">{listing.areaName}</span>
                                </div>
                            )}
                            {listing.locality && (
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 block">Taluka / Sub-region</span>
                                    <span className="font-extrabold text-slate-800">{listing.locality}</span>
                                </div>
                            )}
                            {listing.city && (
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 block">City / District</span>
                                    <span className="font-extrabold text-slate-800">{listing.city}</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                {copiedAddress ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiedAddress ? 'Copied to Clipboard!' : 'Copy Address'}</span>
                            </button>
                            <a
                                href={getGoogleMapsUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-center cursor-pointer"
                            >
                                <Navigation size={14} />
                                <span>Google Maps</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetails;