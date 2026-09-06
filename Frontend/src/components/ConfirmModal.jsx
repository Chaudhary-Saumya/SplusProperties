import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle, X, HelpCircle, RefreshCw } from 'lucide-react';

/**
 * Production Confirmation & Input Prompt Modal
 * Replaces ugly browser window.confirm() and window.prompt() dialogs.
 */
export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // 'danger' | 'warning' | 'info' | 'success' | 'prompt'
    inputPlaceholder = '',
    defaultValue = '',
    inputLabel = '',
    onConfirm,
    onCancel,
    isLoading = false
}) {
    const [inputValue, setInputValue] = useState(defaultValue);

    if (!isOpen || typeof document === 'undefined') return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
                        <Trash2 size={26} />
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                        <AlertTriangle size={26} />
                    </div>
                );
            case 'prompt':
                return (
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
                        <ShieldAlert size={26} />
                    </div>
                );
            case 'success':
                return (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle size={26} />
                    </div>
                );
            default:
                return (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                        <HelpCircle size={26} />
                    </div>
                );
        }
    };

    const getConfirmBtnClass = () => {
        switch (type) {
            case 'danger':
                return 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-200';
            case 'warning':
                return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200';
            case 'success':
                return 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-200';
            default:
                return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200';
        }
    };

    const handleFormSubmit = (e) => {
        e?.preventDefault();
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 font-['Nunito_Sans',sans-serif]">
                {/* Backdrop Blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!isLoading ? onCancel : undefined}
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 15 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 text-center overflow-hidden"
                >
                    {/* Close Button */}
                    {!isLoading && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}

                    {/* Icon */}
                    <div className="mb-4">
                        {getIcon()}
                    </div>

                    {/* Title & Message */}
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                        {message}
                    </p>

                    {/* Form for Prompt Type */}
                    <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-left">
                        {type === 'prompt' && (
                            <div>
                                {inputLabel && (
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                        {inputLabel}
                                    </label>
                                )}
                                <input
                                    type="text"
                                    autoFocus
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-2xs"
                                    required
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2.5 pt-2">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={onCancel}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                                {cancelText}
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || (type === 'prompt' && !inputValue.trim())}
                                className={`flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${getConfirmBtnClass()}`}
                            >
                                {isLoading ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : null}
                                <span>{isLoading ? 'Processing...' : confirmText}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
