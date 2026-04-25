import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowLeft, ChevronRight, Building2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ListingSkeleton from '../components/ListingSkeleton';
import { getImageUrl } from '../utils/imageUrl';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await axios.get('/api/auth/me');
                setFavorites(res.data.data.favorites || []);
            } catch (err) {
                console.error('Error fetching favorites', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            {/* Loading hero bar */}
            <div className="bg-[#1a2340] px-6 py-10 md:px-16">
                <div className="max-w-7xl mx-auto animate-pulse">
                    <div className="h-3 w-36 bg-white/10 rounded-full mb-4"></div>
                    <div className="h-9 w-56 bg-white/10 rounded-xl mb-2"></div>
                    <div className="h-3 w-44 bg-white/10 rounded-full"></div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ListingSkeleton key={i} />)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5ee]">

            {/* ── Top hero bar (mirrors CreateListing) ── */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Building2 size={14} />
                        <span>Splus Properties</span>
                        <ChevronRight size={12} />
                        <span>My Favourites</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all shrink-0"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                    My <span className="text-[#c9a84c]">Favourites</span>
                                </h1>
                                <p className="text-white/50 font-medium mt-1 text-sm">Quickly access properties you've saved</p>
                            </div>
                        </div>

                        {favorites.length > 0 && (
                            <div className="flex items-center gap-2 bg-[#c9a84c]/15 border border-[#c9a84c]/30 px-4 py-2 rounded-xl w-fit">
                                <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse"></div>
                                <span className="text-sm font-black text-[#c9a84c] uppercase tracking-widest">
                                    {favorites.length} Saved {favorites.length === 1 ? 'Property' : 'Properties'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {favorites.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm text-center">
                        <div className="w-24 h-24 rounded-2xl bg-[#1a2340] flex items-center justify-center mb-6 shadow-lg">
                            <Heart size={40} className="text-[#c9a84c]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1a2340] mb-2">No Saved Properties</h2>
                        <p className="text-[#1a2340]/50 max-w-sm mx-auto mb-8 text-sm font-medium leading-relaxed">
                            Your favourites list is empty. Start exploring listings to find your dream property and save the ones you love.
                        </p>
                        <button
                            onClick={() => navigate('/search')}
                            className="bg-[#1a2340] hover:bg-[#243060] text-[#c9a84c] px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:-translate-y-0.5"
                        >
                            Explore Listings
                        </button>
                    </div>
                ) : (
                    /* Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map(f => (
                            <div
                                key={f._id}
                                onClick={() => navigate(`/listings/${f._id}`)}
                                className="bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full overflow-hidden"
                            >
                                {/* Image */}
                                <div className="h-52 bg-[#f8f5ee] overflow-hidden relative">
                                    {f.images && f.images.length > 0 ? (
                                        <img
                                            src={getImageUrl(f.images[0])}
                                            alt={f.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#1a2340]/30 font-bold italic text-sm bg-[#f8f5ee]">
                                            No Image Available
                                        </div>
                                    )}

                                    {/* Heart badge */}
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow border border-[#1a2340]/5">
                                        <Heart size={16} className="text-red-500 fill-current" />
                                    </div>

                                    {/* Gold bottom fade */}
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-black/30 to-transparent"></div>
                                </div>

                                {/* Card body */}
                                <div className="p-5 flex flex-col grow">
                                    <h4 className="font-black text-[#1a2340] text-base mb-3 truncate group-hover:text-[#c9a84c] transition-colors leading-tight">
                                        {f.title}
                                    </h4>

                                    <div className="mt-auto space-y-2">
                                        <p className="text-xl font-black text-[#1a2340]">
                                            ₹{f.price?.toLocaleString('en-IN')}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[#1a2340]/50">
                                            <MapPin size={12} className="text-[#c9a84c] shrink-0" />
                                            <p className="text-xs font-bold uppercase tracking-wider truncate">{f.location}</p>
                                        </div>
                                    </div>

                                    {/* View CTA */}
                                    <div className="mt-4 pt-4 border-t border-[#f8f5ee]">
                                        <span className="text-xs font-black text-[#c9a84c] uppercase tracking-widest group-hover:gap-2 flex items-center gap-1 transition-all">
                                            View Property <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;