import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Map as MapIcon, Plus, Trash2, ExternalLink, Calendar, 
  Layers, ChevronRight, Ruler, LayoutGrid, List, Search,
  ArrowRight, Building2, MapPin, Loader2, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const SavedMaps = () => {
  const { user, loading: authLoading, isAuthenticated } = React.useContext(AuthContext);
  const [maps, setMaps] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
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
    } catch (err) {
      toast.error('Failed to fetch saved maps');
    } finally {
      setDataLoading(false);
    }
  };

  const deleteMap = async (shareId) => {
    if (!window.confirm('Are you sure you want to delete this map?')) return;
    try {
      const res = await axios.delete(`/api/maps/${shareId}`);
      if (res.data.success) {
        toast.success('Map deleted');
        setMaps(maps.filter(m => m.shareId !== shareId));
      }
    } catch (err) {
      toast.error('Failed to delete map');
    }
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

      const res = await axios.post('/api/maps', {
        ...map,
        polygons: updatedPolygons,
        shareId: map.shareId
      });
      
      setMaps(maps.map(m => m._id === mapId ? { ...m, polygons: updatedPolygons } : m));
      toast.success('Property renamed successfully');
      setRenameModal({ ...renameModal, open: false });
    } catch (err) {
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-[#c9a84c] animate-spin" />
        <p className="text-[#1a2340]/40 font-bold uppercase tracking-widest text-xs">
          {authLoading ? 'Verifying Session...' : 'Loading your saved maps...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5ee] pb-20">
      {/* ── Hero Section ── */}
      <div className="bg-[#1a2340] pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c9a84c]/10 rounded-full border border-[#c9a84c]/20">
                <MapIcon size={12} className="text-[#c9a84c]" />
                <span className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest">Property Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                My Saved <span className="text-[#c9a84c]">Boundaries</span>
              </h1>
              <p className="text-white/40 max-w-lg font-medium leading-relaxed">
                Manage and share your custom land mappings. All boundaries are stored permanently in your account.
              </p>
            </div>
            
            <Link 
              to="/boundary-map"
              className="group flex items-center gap-4 px-8 py-4 bg-[#c9a84c] hover:bg-[#b8943e] text-[#1a2340] rounded-3xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <Plus size={20} />
              Create New Map
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10">
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-[#1a2340]/5 p-2 sm:p-4 flex flex-col md:flex-row items-center gap-2 sm:gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1a2340]/20" size={18} />
            <input 
              type="text"
              placeholder="Search property name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#f8f5ee]/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#c9a84c]/30 text-[#1a2340] font-bold placeholder:text-[#1a2340]/20 text-sm"
            />
          </div>
          
          <div className="hidden sm:flex items-center gap-2 p-1 bg-[#f8f5ee] rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#1a2340] shadow-md' : 'text-[#1a2340]/30 hover:text-[#1a2340]'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#1a2340] shadow-md' : 'text-[#1a2340]/30 hover:text-[#1a2340]'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-16">
        {filteredMaps.length === 0 ? (
          <div className="bg-white rounded-3xl sm:rounded-[3rem] p-12 text-center border border-[#1a2340]/5 shadow-sm space-y-6">
            <div className="w-20 h-20 bg-[#f8f5ee] rounded-3xl flex items-center justify-center mx-auto text-[#1a2340]/10">
              <MapIcon size={40} />
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <h3 className="text-xl font-black text-[#1a2340]">No maps found</h3>
              <p className="text-[#1a2340]/40 font-medium text-sm">Start by creating your first property boundary mapping.</p>
            </div>
            <Link 
              to="/boundary-map"
              className="inline-flex items-center gap-2 text-[#c9a84c] font-black uppercase text-[10px] tracking-widest hover:gap-4 transition-all"
            >
              Open Mapping Tool <ArrowRight size={14} />
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {filteredMaps.map((map) => {
              const totalAcres = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
              return (
                <div key={map._id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-[#1a2340]/5 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-[16/10] bg-[#1a2340] relative flex items-center justify-center overflow-hidden">
                    {/* REAL Captured Thumbnail or Simulated Preview */}
                    {map.thumbnail ? (
                      <img 
                        src={map.thumbnail} 
                        alt="Property Preview" 
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      />
                    ) : (
                      <div className="absolute inset-0 pointer-events-none p-6">
                        <div className="w-full h-full rounded-2xl border border-white/5 bg-[#1a2340]/50 relative overflow-hidden">
                           <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
                              {[...Array(64)].map((_, i) => <div key={i} className="border-[0.5px] border-white/10" />)}
                           </div>
                           {map.polygons.map((p, i) => (
                             <div key={i} className="absolute transition-all duration-700 group-hover:scale-110" style={{ 
                               border: `2px dashed ${p.color}aa`,
                               background: `${p.color}11`,
                               width: `${Math.max(30, Math.random() * 60)}%`,
                               height: `${Math.max(30, Math.random() * 60)}%`,
                               top: `${Math.random() * 40}%`,
                               left: `${Math.random() * 40}%`,
                               borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'
                             }} />
                           ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-6 right-6 flex gap-2">
                      <button 
                        onClick={() => deleteMap(map.shareId)}
                        className="w-10 h-10 bg-white/10 hover:bg-red-500 text-white backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-90"
                        title="Delete Permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="absolute bottom-8 left-8">
                       <div className="px-4 py-1.5 bg-[#c9a84c] text-[#1a2340] rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                         {map.polygons.length} Plots
                       </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest">ID: {map.shareId}</span>
                          <button 
                            onClick={() => setRenameModal({ open: true, mapId: map._id, currentLabel: map.polygons[0]?.label, newLabel: map.polygons[0]?.label })}
                            className="p-1 hover:bg-[#f8f5ee] rounded text-[#1a2340]/20 hover:text-[#c9a84c] transition-all"
                            title="Rename Property"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <h4 className="text-xl font-black text-[#1a2340] truncate">
                          {map.polygons[0]?.label || 'Unnamed Property'}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#f8f5ee] rounded-3xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#c9a84c] shadow-sm">
                          <Ruler size={16} />
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-[#1a2340]/30 uppercase tracking-widest leading-none mb-1">Area</div>
                          <div className="text-sm font-black text-[#1a2340]">{totalAcres} <span className="text-[10px] opacity-40">ac</span></div>
                        </div>
                      </div>
                      <div className="p-4 bg-[#f8f5ee] rounded-3xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#c9a84c] shadow-sm">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-[#1a2340]/30 uppercase tracking-widest leading-none mb-1">Created</div>
                          <div className="text-sm font-black text-[#1a2340] truncate">{formatDate(map.createdAt)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                       <Link 
                         to={`/m/${map.shareId}`}
                         target="_blank"
                         className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#1a2340] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all"
                       >
                         <ExternalLink size={14} /> Open Link
                       </Link>
                       <Link 
                         to={`/boundary-map?edit=${map.shareId}`}
                         className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#f8f5ee] text-[#1a2340] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a2340]/10 transition-all border border-[#1a2340]/5"
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
          <div className="bg-white rounded-[3rem] overflow-hidden border border-[#1a2340]/5 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[#f8f5ee] border-b border-[#1a2340]/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-[#1a2340]/30 uppercase tracking-[0.2em]">Map Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#1a2340]/30 uppercase tracking-[0.2em]">Measurements</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#1a2340]/30 uppercase tracking-[0.2em]">Created Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#1a2340]/30 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2340]/5">
                {filteredMaps.map((map) => {
                  const totalAcres = map.polygons.reduce((acc, p) => acc + (parseFloat(p.area?.acres?.replace(/,/g, '')) || 0), 0).toFixed(3);
                  return (
                    <tr key={map._id} className="hover:bg-[#f8f5ee]/50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#1a2340] flex items-center justify-center text-[#c9a84c]">
                            <MapIcon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-[#1a2340]">{map.polygons[0]?.label || 'Unnamed Map'}</div>
                            <div className="text-[10px] font-bold text-[#1a2340]/40 uppercase tracking-widest">ID: {map.shareId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#1a2340]">{totalAcres} Acres</span>
                          <span className="text-[10px] font-bold text-[#1a2340]/40">{map.polygons.length} Sections</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-[#1a2340]">
                        {formatDate(map.createdAt)}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/m/${map.shareId}`} target="_blank" className="p-2.5 bg-[#f8f5ee] hover:bg-[#c9a84c]/20 text-[#1a2340]/40 hover:text-[#c9a84c] rounded-xl transition-all" title="View Map">
                            <ExternalLink size={18} />
                          </Link>
                          <Link to={`/boundary-map?edit=${map.shareId}`} className="p-2.5 bg-[#f8f5ee] hover:bg-[#1a2340]/10 text-[#1a2340]/40 hover:text-[#1a2340] rounded-xl transition-all" title="Edit Map">
                            <Layers size={18} />
                          </Link>
                          <button onClick={() => deleteMap(map.shareId)} className="p-2.5 bg-[#f8f5ee] hover:bg-red-500/10 text-[#1a2340]/40 hover:text-red-500 rounded-xl transition-all" title="Delete Map">
                            <Trash2 size={18} />
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

      {/* ── Rename Modal ────────────────────────────────────────────── */}
      {renameModal.open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#1a2340]/60 backdrop-blur-sm" onClick={() => setRenameModal({ ...renameModal, open: false })} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl border border-[#1a2340]/5 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest">Action Required</div>
                  <h3 className="text-2xl font-black text-[#1a2340]">Rename Property</h3>
                </div>
                <button onClick={() => setRenameModal({ ...renameModal, open: false })} className="w-10 h-10 rounded-full bg-[#f8f5ee] flex items-center justify-center text-[#1a2340]/20 hover:text-[#1a2340] transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1a2340]/30 uppercase tracking-widest px-2">Property Name</label>
                  <input 
                    type="text"
                    value={renameModal.newLabel}
                    onChange={(e) => setRenameModal({ ...renameModal, newLabel: e.target.value })}
                    placeholder="e.g. Ahmedabad Farmhouse"
                    className="w-full px-6 py-4 bg-[#f8f5ee] rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#c9a84c]/30 text-[#1a2340] font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setRenameModal({ ...renameModal, open: false })}
                  className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#1a2340]/40 hover:bg-[#f8f5ee] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRename}
                  className="flex-[2] py-4 bg-[#1a2340] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all shadow-xl shadow-[#1a2340]/20"
                >
                  Save New Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedMaps;
