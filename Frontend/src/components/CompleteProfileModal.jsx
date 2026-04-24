import React, { useState } from 'react';
import { ShoppingCart, Home, Briefcase, Phone, CheckCircle } from 'lucide-react';

const CompleteProfileModal = ({ isOpen, user, onComplete, error }) => {
    const [formData, setFormData] = useState({
        role: user?.role || 'Buyer',
        phone: user?.phone || ''
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const roles = [
        { id: 'Buyer', label: 'Buy Property', icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { id: 'Seller', label: 'Sell Property', icon: Home, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'Broker', label: 'Broker / Agent', icon: Briefcase, color: 'bg-amber-50 text-amber-600 border-amber-100' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onComplete(formData);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="p-8 md:p-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Almost There!</h2>
                        <p className="text-slate-500">Just a few more details to set up your account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">I want to...</label>
                            <div className="grid grid-cols-1 gap-3">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: role.id })}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                            formData.role === role.id 
                                            ? `${role.color.split(' ')[0]} border-blue-600 ring-4 ring-blue-500/10` 
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl ${role.color} border shadow-sm`}>
                                            <role.icon size={24} />
                                        </div>
                                        <span className={`font-bold text-lg ${formData.role === role.id ? 'text-blue-700' : 'text-slate-600'}`}>
                                            {role.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!user?.phone && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Phone size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your mobile number"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-blue-600 focus:bg-white outline-none transition-all text-lg font-medium"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/25 ${
                                submitting ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1'
                            }`}
                        >
                            {submitting ? 'Setting up...' : 'Complete Setup'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfileModal;
