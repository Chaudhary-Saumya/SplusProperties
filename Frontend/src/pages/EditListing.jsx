import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { UploadCloud, MapPin, Save, ArrowLeft, Building2, ChevronRight, X, CreditCard, ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

// ── Shared style tokens ──────────────────────────────────────────
const inputCls = "w-full px-5 py-3.5 rounded-xl border border-[#1a2340]/15 bg-[#f8f5ee]/60 focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] outline-none transition-all font-semibold text-[#1a2340] text-base placeholder:text-[#1a2340]/30";
const labelCls = "block text-[10px] font-black text-[#1a2340]/50 mb-2 uppercase tracking-[0.15em]";

// ── Section card wrapper (matches CreateListing) ─────────────────
const SectionCard = ({ icon, title, subtitle, children, accent }) => (
    <div className="relative bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm overflow-hidden">
        <div className="flex items-start gap-4 px-7 pt-6 pb-5 border-b border-[#f8f5ee]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#c9a84c]' : 'bg-[#1a2340]'}`}>
                {React.cloneElement(icon, { size: 18, className: accent ? 'text-[#1a2340]' : 'text-[#c9a84c]' })}
            </div>
            <div>
                <h3 className="font-extrabold text-[#1a2340] text-base uppercase tracking-widest">{title}</h3>
                {subtitle && <p className="text-[#1a2340]/50 text-xs font-medium mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="px-7 py-6">{children}</div>
    </div>
);

const EditListing = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        listingType: 'Verified',
        isBookingEnabled: false,
        tokenAmount: '',
        payoutAccountId: ''
    });

    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('Sq Ft');
    const [existingImages, setExistingImages] = useState([]);
    const [images, setImages] = useState(null);
    const [payoutAccounts, setPayoutAccounts] = useState([]);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`/api/listings/${id}`);
                const data = res.data.data;
                if (data.createdBy._id !== user?.id && data.createdBy._id !== user?._id && user?.role !== 'Admin') {
                    navigate('/dashboard');
                    return;
                }
                setFormData({
                    title: data.title,
                    description: data.description,
                    price: data.price.toString(),
                    location: data.location,
                    listingType: data.listingType,
                    isBookingEnabled: data.isBookingEnabled || false,
                    tokenAmount: data.tokenAmount || '',
                    payoutAccountId: data.payoutAccountId?._id || data.payoutAccountId || ''
                });
                const areaParts = data.area ? data.area.split(' ') : [];
                if (areaParts.length >= 2) {
                    setAreaValue(areaParts[0]);
                    setAreaUnit(areaParts.slice(1).join(' '));
                } else {
                    setAreaValue(data.area || '');
                }
                setExistingImages(data.images || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load property data');
            } finally {
                setFetchLoading(false);
            }
        };
        if (user) fetchListing();
    }, [id, user, navigate]);

    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => {
                const accounts = res.data.data.paymentAccounts || [];
                setPayoutAccounts(accounts);
            })
            .catch(err => console.error('Failed to fetch payout accounts:', err));
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let uploadedImagePaths = [...existingImages];
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const imgData = new FormData();
                    imgData.append('file', images[i]);
                    const uploadRes = await axios.post('/api/uploads', imgData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.success) {
                        uploadedImagePaths.push(uploadRes.data.data);
                    }
                }
            }
            const listingPayload = {
                ...formData,
                area: `${areaValue} ${areaUnit}`,
                price: Number(formData.price),
                images: uploadedImagePaths
            };
            await axios.put(`/api/listings/${id}`, listingPayload);
            toast.success('Listing successfully updated!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update listing.');
        } finally {
            setLoading(false);
        }
    };

    const removeExistingImage = (idx) => {
        setExistingImages(existingImages.filter((_, i) => i !== idx));
    };

    // ── Loading state ────────────────────────────────────────────
    if (fetchLoading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <div className="bg-[#1a2340] px-6 py-10 md:px-16">
                <div className="max-w-4xl mx-auto animate-pulse">
                    <div className="h-3 w-36 bg-white/10 rounded-full mb-4"></div>
                    <div className="h-9 w-56 bg-white/10 rounded-xl mb-2"></div>
                    <div className="h-3 w-44 bg-white/10 rounded-full"></div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-10 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    // ── Access denied ────────────────────────────────────────────
    if (!user || (user.role !== 'Seller' && user.role !== 'Broker' && user.role !== 'Admin')) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-red-100 shadow p-10 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1a2340] mb-2">Access Denied</h2>
                    <p className="text-[#1a2340]/60 font-medium">You don't have permission to edit this listing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5ee]">

            {/* ── Hero bar ── */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Building2 size={14} />
                        <span>SplusPropertys</span>
                        <ChevronRight size={12} />
                        <span>Edit Listing</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                Edit <span className="text-[#c9a84c]">Property Listing</span>
                            </h1>
                            <p className="text-white/50 font-medium mt-1 text-sm">Update your property details — changes go live instantly.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Form body ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-3">
                        <X size={18} className="shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECTION 1: Property Info ── */}
                    <SectionCard icon={<Building2 />} title="Property Details" subtitle="Update the core information about this listing">
                        <div className="space-y-6">
                            <div>
                                <label className={labelCls}>Property Title</label>
                                <input
                                    type="text" name="title" required
                                    value={formData.title} onChange={handleChange}
                                    className={inputCls}
                                    placeholder="e.g. 500 Sq Yd Corner Plot in Sector 14"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-lg">₹</span>
                                        <input
                                            type="number" name="price" required min="1000"
                                            value={formData.price} onChange={handleChange}
                                            className={inputCls + ' pl-10'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Total Area</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number" required min="1"
                                            value={areaValue} onChange={(e) => setAreaValue(e.target.value)}
                                            className={inputCls + ' w-2/3'}
                                        />
                                        <select
                                            value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}
                                            className={inputCls + ' w-1/3 cursor-pointer'}
                                        >
                                            <option value="Sq Ft">Sq Ft</option>
                                            <option value="Sq Yd">Sq Yd</option>
                                            <option value="Sq Meter">Sq Meter</option>
                                            <option value="Acres">Acres</option>
                                            <option value="Hectares">Hectares</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls + ' flex items-center gap-1.5'}>
                                    <MapPin size={11} className="text-[#c9a84c]" /> Location / Address
                                </label>
                                <input
                                    type="text" name="location" required
                                    value={formData.location} onChange={handleChange}
                                    className={inputCls}
                                    placeholder="City, Village or full address..."
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Detailed Description</label>
                                <textarea
                                    name="description" required rows="5"
                                    value={formData.description} onChange={handleChange}
                                    className={inputCls + ' resize-none'}
                                    placeholder="Describe the property, amenities, proximity to landmarks..."
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── SECTION 2: Images ── */}
                    <SectionCard icon={<ImageIcon />} title="Property Photos" subtitle="Manage existing images or add new ones" accent>
                        {existingImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-5 p-4 bg-[#f8f5ee] rounded-xl border border-[#1a2340]/10">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#1a2340]/10 shadow-sm group">
                                        <img
                                            src={getImageUrl(img)}
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(idx)}
                                            className="absolute top-1.5 right-1.5 bg-[#1a2340] text-[#c9a84c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-2 border-dashed border-[#c9a84c]/40 rounded-2xl p-8 text-center bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-colors cursor-pointer relative overflow-hidden group">
                            <input
                                type="file" multiple accept="image/*"
                                onChange={(e) => setImages(e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <UploadCloud className="mx-auto text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform" size={36} />
                            <p className="text-[#1a2340] font-black text-sm">
                                {images && images.length > 0
                                    ? `${images.length} new photo${images.length > 1 ? 's' : ''} queued`
                                    : 'Click or drag to add more photos'}
                            </p>
                            <p className="text-[#1a2340]/40 text-xs font-medium mt-1">High quality .jpg or .png</p>
                        </div>
                    </SectionCard>

                    {/* ── SECTION 3: Token Booking ── */}
                    <SectionCard icon={<CreditCard />} title="Token Booking System" subtitle="Enable or update online reservations for this property">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[#1a2340]">Accept Token Bookings</p>
                                <p className="text-xs text-[#1a2340]/40 font-medium mt-0.5">Allow buyers to reserve this listing with a token amount</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.isBookingEnabled ? 'bg-[#c9a84c]' : 'bg-[#1a2340]/20'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formData.isBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {formData.isBookingEnabled && (
                            <div className="mt-6 pt-6 border-t border-[#f8f5ee] space-y-5">
                                <div>
                                    <label className={labelCls}>
                                        Token Amount — Capped at 2%
                                        {formData.price && (
                                            <span className="ml-1 normal-case font-semibold text-[#c9a84c]">
                                                (max ₹{((formData.price || 0) * 0.02).toLocaleString('en-IN')})
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={formData.tokenAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const max = (formData.price || 0) * 0.02;
                                                setFormData({ ...formData, tokenAmount: val <= max ? val : max });
                                            }}
                                            className={inputCls + ' pl-10'}
                                            placeholder="Enter token amount..."
                                        />
                                        {formData.tokenAmount > 0 && formData.price > 0 && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#1a2340] bg-[#c9a84c]/20 px-3 py-1 rounded-lg">
                                                {((formData.tokenAmount / formData.price) * 100).toFixed(1)}% of price
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Select Payout Account</label>
                                    {payoutAccounts.length > 0 ? (
                                        <select
                                            name="payoutAccountId"
                                            value={formData.payoutAccountId}
                                            onChange={handleChange}
                                            className={inputCls + ' cursor-pointer'}
                                            required
                                        >
                                            {payoutAccounts.map(acc => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.accountType.toUpperCase()} — {acc.holderName} ({acc.details})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm font-medium">
                                            No payout accounts found. Please add one in your{' '}
                                            <button type="button" onClick={() => navigate('/dashboard')} className="underline font-black">Dashboard</button> first.
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-[#1a2340]/5 rounded-xl border border-[#1a2340]/10 flex gap-3 items-start">
                                    <span className="text-base mt-0.5">💡</span>
                                    <p className="text-xs text-[#1a2340]/60 leading-relaxed font-medium">
                                        <span className="font-black text-[#1a2340]">Facilitated Transfers:</span>{' '}
                                        Token money from buyers will be sent directly to your chosen account. We don't hold any funds.
                                    </p>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Submit bar ── */}
                    <div className="bg-[#1a2340] rounded-2xl px-7 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-white font-black text-sm">Ready to save changes?</p>
                            <p className="text-white/40 text-xs font-medium mt-0.5">Your updates will go live immediately across all city tiers.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 font-bold text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/15 rounded-xl text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#c9a84c] hover:bg-[#b8943e] text-[#1a2340] px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#c9a84c]/20 hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2 uppercase tracking-wider"
                            >
                                {loading
                                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#1a2340]/30 border-t-[#1a2340] rounded-full animate-spin"></span> Saving...</span>
                                    : <><Save size={16} /> Save Changes</>
                                }
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditListing;