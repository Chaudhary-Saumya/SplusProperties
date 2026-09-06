import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map as MapIcon, Plus, Trash2, ExternalLink, Calendar,
  Layers, Ruler, LayoutGrid, List, Search,
  ArrowRight, ArrowLeft, Loader2, X, MapPin, Sparkles, PenLine, LandPlot
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import ConfirmModal from '../components/ConfirmModal';

const SavedMaps = () => {
  const { user, loading: authLoading, isAuthenticated } = React.useContext(AuthContext);
  const [maps, setMaps] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [renameModal, setRenameModal] = useState({ open: false, mapId: null, currentLabel: '', newLabel: '' });

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchMaps();
      } else {
        navigate('/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  const fetchMaps = async () => {
    try {
      setDataLoading(true);
      const res = await axios.get('/api/maps/my-maps');
      if (res.data.success) {
        setMaps(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch saved maps');
    } finally {
      setDataLoading(false);
    }
  };

  const deleteMap = (shareId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Saved Map',
      message: 'Are you sure you want to permanently delete this saved land boundary map?',
      confirmText: 'Delete Map',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await axios.delete(`/api/maps/${shareId}`);
          if (res.data.success) {
            toast.success('Map deleted');
            setMaps(maps.filter(m => m.shareId !== shareId));
          }
        } catch {
          toast.error('Failed to delete map');
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleRename = async () => {
    const { mapId, newLabel, currentLabel } = renameModal;
    if (!newLabel || newLabel === currentLabel) {
      setRenameModal({ ...renameModal, open: false });
      return;
    }

    try {
      const map = maps.find(m => m._id === mapId);
      const updatedPolygons = [...map.polygons];
      updatedPolygons[0] = { ...updatedPolygons[0], label: newLabel };

      await axios.post('/api/maps', {
        ...map,
        polygons: updatedPolygons,
        shareId: map.shareId
      });

      setMaps(maps.map(m => m._id === mapId ? { ...m, polygons: updatedPolygons } : m));
      toast.success('Property renamed successfully');
      setRenameModal({ ...renameModal, open: false });
    } catch {
      toast.error('Failed to update name');
    }
  };

  const filteredMaps = maps.filter(m =>
    m.polygons.some(p => p.label?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.shareId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-slate-100/70 font-['Nunito_Sans',sans-serif]">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">
          {authLoading ? 'Verifying Session...' : 'Loading your saved maps...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 font-['Nunito_Sans',sans-serif] pb-24 antialiased">
      <SEO title="My Saved Boundary Maps" description="View and manage your saved land boundary maps." />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Top Header Row ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                <MapPin size={12} className="text-blue-600" />
                <span>GPS Boundary Intelligence</span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-1">
                My Saved Boundary Maps
              </h1>
            </div>
          </div>

          <Link
            to="/boundary-map"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>New Map</span>
          </Link>
        </div>

        {/* ── Search & Filter Pill Bar ── */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-2 sm:p-2.5 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by property label or Map ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-extrabold placeholder:text-slate-400 text-xs sm:text-sm"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div>
        {filteredMaps.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <MapIcon size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">No Saved Maps Found</h3>
              <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                You haven't saved any land boundary maps yet. Click below to start drawing land boundaries.
              </p>
            </div>
            <Link
              to="/boundary-map"
              className="inline-flex items-center gap-2 text-blue-600 font-black uppercase text-xs tracking-widest hover:gap-3 transition-all pt-2"
            >
              <span>Open Boundary Map Tool</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaps.map((map) => {
              const totalAcres = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
              const totalSqft = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.sqft?.replace(/,/g, '')) || 0), 0);

              return (
                <div key={map._id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                  <div className="aspect-[16/10] bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {map.thumbnail ? (
                      <img
                        src={map.thumbnail}
                        alt="Property Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <LandPlot size={40} className="text-blue-500 opacity-60" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Boundary Map Preview</span>
                      </div>
                    )}

                    <button
                      onClick={() => deleteMap(map.shareId)}
                      className="absolute top-4 right-4 w-9 h-9 bg-slate-900/80 hover:bg-rose-600 text-white backdrop-blur-md rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Delete Map"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="absolute bottom-4 left-4">
                      <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                        {map.polygons.length} {map.polygons.length > 1 ? 'Plots' : 'Plot'}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">ID: {map.shareId}</span>
                        <button
                          onClick={() => setRenameModal({ open: true, mapId: map._id, currentLabel: map.polygons[0]?.label, newLabel: map.polygons[0]?.label })}
                          className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                          title="Rename Property"
                        >
                          <PenLine size={14} />
                        </button>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {map.polygons[0]?.label || 'Unnamed Land Property'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Ruler size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Area</div>
                          <div className="text-xs font-black text-slate-900 font-mono truncate">{totalSqft.toLocaleString()} <span className="text-[9px] text-slate-500 font-normal">sq.ft</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Saved</div>
                          <div className="text-xs font-black text-slate-900 truncate">{formatDate(map.createdAt)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={`/m/${map.shareId}`}
                        target="_blank"
                        className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-[#1a2340] hover:bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-sm"
                      >
                        <ExternalLink size={14} /> View Map
                      </Link>
                      <Link
                        to={`/boundary-map?edit=${map.shareId}`}
                        className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all border border-slate-200"
                      >
                        <Layers size={14} /> Edit Map
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Property Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Area Measurements</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Saved Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaps.map((map) => {
                  const totalAcres = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
                  const totalSqft = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.sqft?.replace(/,/g, '')) || 0), 0);

                  return (
                    <tr key={map._id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
                            <MapIcon size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">{map.polygons[0]?.label || 'Unnamed Property'}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {map.shareId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 font-mono">{totalSqft.toLocaleString()} sq.ft</span>
                          <span className="text-[10px] font-bold text-slate-500">{totalAcres} Acres</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        {formatDate(map.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/m/${map.shareId}`} target="_blank" className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all" title="View Map">
                            <ExternalLink size={16} />
                          </Link>
                          <Link to={`/boundary-map?edit=${map.shareId}`} className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all" title="Edit Map">
                            <Layers size={16} />
                          </Link>
                          <button onClick={() => deleteMap(map.shareId)} className="p-2 bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer" title="Delete Map">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Rename Modal */}
      {renameModal.open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setRenameModal({ ...renameModal, open: false })} />
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900">Rename Property</h3>
                <button onClick={() => setRenameModal({ ...renameModal, open: false })} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Property Label</label>
                <input
                  type="text"
                  value={renameModal.newLabel}
                  onChange={(e) => setRenameModal({ ...renameModal, newLabel: e.target.value })}
                  placeholder="e.g. Farmhouse Plot A"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-extrabold text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setRenameModal({ ...renameModal, open: false })}
                  className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="flex-1 py-3 bg-[#1a2340] hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  );
};

export default SavedMaps;
