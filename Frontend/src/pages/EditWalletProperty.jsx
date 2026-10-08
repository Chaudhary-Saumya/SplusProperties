import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Briefcase, MapPin, IndianRupee, Layers, Tag, FileText,
  User, Phone, Image as ImageIcon, Plus, X, Upload, Save, Sparkles,
  Building2, Info, RefreshCw
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { compressImage } from '../utils/imageCompressor';

const inputCls = "w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all font-semibold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400";
const labelCls = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";

const unitLabels = {
  vigha_bada: 'Bigha (Big / 23.78 Guntha)',
  vigha_chhota: 'Bigha (Small / 16.19 Guntha)',
  acre: 'Acre',
  guntha: 'Guntha (Gutha)',
  sqft: 'Sq.Ft (Square Feet)',
  gaj: 'Gaj / Yard / Vaar',
  sqm: 'Sq.Mt (Square Meter)',
  hectare: 'Hectare',
  aare: 'Aare',
};

const shortUnitLabels = {
  vigha_bada: 'Bigha (Big)',
  vigha_chhota: 'Bigha (Small)',
  acre: 'Acre',
  guntha: 'Guntha',
  sqft: 'Sq.Ft',
  gaj: 'Gaj',
  sqm: 'Sq.Mt',
  hectare: 'Hectare',
  aare: 'Aare',
};

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

const SectionCard = ({ icon: Icon, title, subtitle, children, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80'
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${colors[color]} shrink-0`}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

const EditWalletProperty = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formReady, setFormReady] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', price: '', priceLabel: '', area: '',
    areaValue: '', areaUnit: 'vigha_bada',
    location: '', city: '', locality: '', propertyType: 'Land', landType: '',
    ownerName: '', ownerPhone: '', images: [], notes: '', tags: []
  });

  const { data: propertyData, isLoading, isError } = useQuery({
    queryKey: ['walletProperty', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const res = await axios.get(`/api/wallet/${id}`);
      return res.data.data;
    }
  });

  // Populate form when data loads
  useEffect(() => {
    if (propertyData && !formReady) {
      let areaVal = propertyData.areaValue !== undefined && propertyData.areaValue !== null ? String(propertyData.areaValue) : '';
      let areaU = propertyData.areaUnit || 'vigha_bada';
      if (!areaVal && propertyData.area) {
        const match = String(propertyData.area).match(/^([\d.]+)/);
        if (match) areaVal = match[1];
        const lowerArea = String(propertyData.area).toLowerCase();
        if (lowerArea.includes('bigha') || lowerArea.includes('vigha')) areaU = 'vigha_bada';
        else if (lowerArea.includes('acre')) areaU = 'acre';
        else if (lowerArea.includes('guntha') || lowerArea.includes('gutha')) areaU = 'guntha';
        else if (lowerArea.includes('sqft') || lowerArea.includes('sq.ft') || lowerArea.includes('feet')) areaU = 'sqft';
        else if (lowerArea.includes('yard') || lowerArea.includes('gaj') || lowerArea.includes('vaar')) areaU = 'gaj';
        else if (lowerArea.includes('sqm') || lowerArea.includes('meter')) areaU = 'sqm';
        else if (lowerArea.includes('hectare')) areaU = 'hectare';
        else if (lowerArea.includes('aare')) areaU = 'aare';
      }

      setForm({
        title: propertyData.title || '',
        description: propertyData.description || '',
        price: propertyData.price || '',
        priceLabel: propertyData.priceLabel || '',
        area: propertyData.area || (areaVal ? `${areaVal} ${shortUnitLabels[areaU] || areaU}` : ''),
        areaValue: areaVal,
        areaUnit: areaU,
        location: propertyData.location || '',
        city: propertyData.city || '',
        locality: propertyData.locality || '',
        propertyType: propertyData.propertyType || 'Land',
        landType: propertyData.landType || '',
        ownerName: propertyData.ownerName || '',
        ownerPhone: propertyData.ownerPhone || '',
        images: propertyData.images || [],
        notes: propertyData.notes || '',
        tags: propertyData.tags || []
      });
      setFormReady(true);
    }
  }, [propertyData, formReady]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (form.tags.includes(tag)) { toast.error('Tag already exists'); return; }
    if (form.tags.length >= 15) { toast.error('Maximum 15 tags'); return; }
    setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleImageUpload = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const remaining = 10 - form.images.length;
    if (rawFiles.length > remaining) {
      toast.error(`Can only add ${remaining} more image(s)`);
      return;
    }

    setUploading(true);
    try {
      // Step 1: Compress images client-side in parallel (drops 5MB -> ~150KB in milliseconds)
      const compressedFiles = await Promise.all(
        rawFiles.map(file => compressImage(file))
      );

      // Step 2: Upload all compressed files concurrently
      const uploadPromises = compressedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post('/api/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data?.data;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);

      if (uploadedUrls.length > 0) {
        setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully! ⚡`);
      }
    } catch {
      toast.error('Failed to upload some image(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.price) payload.price = Number(payload.price);
      else delete payload.price;

      if (payload.areaValue) payload.areaValue = Number(payload.areaValue);
      else delete payload.areaValue;

      await axios.put(`/api/wallet/${id}`, payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['walletProperty', id] }),
        queryClient.invalidateQueries({ queryKey: ['walletProperties'] }),
        queryClient.invalidateQueries({ queryKey: ['walletStats'] })
      ]);
      toast.success('Property updated successfully! 🎉');
      navigate('/property-wallet');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !propertyData) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-sm font-bold text-slate-500 mb-4">Property not found in your wallet</p>
        <button onClick={() => navigate('/property-wallet')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs cursor-pointer">
          Back to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-32 sm:pb-20 font-['Nunito_Sans',sans-serif]">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-900/30 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/property-wallet')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white tracking-tight truncate">Edit Property</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Private
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">{form.title || 'Update details'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-4 sm:space-y-5">
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">

          {/* Basic Details */}
          <SectionCard icon={Building2} title="Basic Details" subtitle="Title & general description" color="emerald">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Title *</label>
                <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Property title" className={inputCls} required maxLength={150} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Property description" className={`${inputCls} min-h-[70px] resize-y`} maxLength={2000} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelCls}>Property Type</label>
                  <select value={form.propertyType} onChange={e => handleChange('propertyType', e.target.value)} className={inputCls}>
                    <option value="Land">Land</option>
                    <option value="Plot">Plot</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Land Type</label>
                  <select value={form.landType} onChange={e => handleChange('landType', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Non-Agricultural">Non-Agricultural</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Price & Area */}
          <SectionCard icon={IndianRupee} title="Pricing & Area" subtitle="Update price & measurements" color="amber">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelCls}>Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} placeholder="e.g. 8500000" className={inputCls} min={0} />
                </div>
                <div>
                  <label className={labelCls}>Or Price Label</label>
                  <input type="text" value={form.priceLabel} onChange={e => handleChange('priceLabel', e.target.value)} placeholder="e.g. ₹85 Lakhs" className={inputCls} maxLength={100} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Total Area</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      value={form.areaValue}
                      onChange={e => {
                        const val = e.target.value;
                        const u = form.areaUnit || 'vigha_bada';
                        const label = val ? `${val} ${shortUnitLabels[u] || u}` : '';
                        setForm(prev => ({
                          ...prev,
                          areaValue: val,
                          area: label
                        }));
                      }}
                      placeholder="e.g. 5"
                      className={inputCls}
                      min={0}
                    />
                  </div>
                  <select
                    value={form.areaUnit}
                    onChange={e => {
                      const u = e.target.value;
                      const val = form.areaValue;
                      const label = val ? `${val} ${shortUnitLabels[u] || u}` : '';
                      setForm(prev => ({
                        ...prev,
                        areaUnit: u,
                        area: label
                      }));
                    }}
                    className="w-40 sm:w-56 px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all font-bold text-slate-800 text-xs sm:text-sm cursor-pointer shrink-0"
                  >
                    <option value="vigha_bada">Bigha (Big / 23.78 Guntha)</option>
                    <option value="vigha_chhota">Bigha (Small / 16.19 Guntha)</option>
                    <option value="acre">Acre</option>
                    <option value="guntha">Guntha (Gutha)</option>
                    <option value="sqft">Sq.Ft (Square Feet)</option>
                    <option value="gaj">Gaj / Yard / Vaar</option>
                    <option value="sqm">Sq.Mt (Square Meter)</option>
                    <option value="hectare">Hectare</option>
                    <option value="aare">Aare</option>
                  </select>
                </div>

                {form.areaValue && getAreaEquivalents(form.areaValue, form.areaUnit) && (
                  <div className="mt-2 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-emerald-600 shrink-0" />
                    <span>{getAreaEquivalents(form.areaValue, form.areaUnit)}</span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard icon={MapPin} title="Location" subtitle="Address & City" color="emerald">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Location / Address</label>
                <input type="text" value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="Address or landmark" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="e.g. Palanpur" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Locality / Area</label>
                  <input type="text" value={form.locality} onChange={e => handleChange('locality', e.target.value)} placeholder="e.g. Ambaji Road" className={inputCls} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Owner Info */}
          <SectionCard icon={User} title="Real Owner Contact (Private)" subtitle="Never exposed in public or shared views" color="slate">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelCls}>Owner Name</label>
                  <input type="text" value={form.ownerName} onChange={e => handleChange('ownerName', e.target.value)} placeholder="e.g. Jayantibhai" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Owner Phone</label>
                  <input type="text" value={form.ownerPhone} onChange={e => handleChange('ownerPhone', e.target.value)} placeholder="e.g. 98250 11223" className={inputCls} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Photos */}
          <SectionCard icon={ImageIcon} title="Photos" subtitle="Upload property photos" color="slate">
            <div>
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || form.images.length >= 10}
                className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} /> <span>Upload Photos ({form.images.length}/10)</span>
                  </>
                )}
              </button>
            </div>
          </SectionCard>

          {/* Tags */}
          <SectionCard icon={Tag} title="Tags" subtitle="Keywords for instant search" color="slate">
            <div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Tag size={9} /> {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-rose-600 cursor-pointer">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } }}
                  placeholder="e.g. clear title, canal water"
                  className={inputCls}
                />
                <button type="button" onClick={handleAddTag} className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard icon={FileText} title="Private Notes" subtitle="Internal notes" color="slate">
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Private notes about the seller, price flexibility, documents, etc."
              className={`${inputCls} min-h-[70px] resize-y`}
              maxLength={1000}
            />
          </SectionCard>

          {/* Submit Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/property-wallet')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>{saving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditWalletProperty;
