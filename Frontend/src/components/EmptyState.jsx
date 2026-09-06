import React from 'react';
import { SearchX, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmptyState = ({ type = 'search', title, message, actionText, actionLink, onAction }) => {
    const navigate = useNavigate();
    
    const icons = {
        search: <SearchX size={64} className="text-slate-300" />,
        inquiry: <Inbox size={64} className="text-slate-300" />
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center font-['Nunito_Sans',sans-serif] px-4">
            <div className="bg-slate-100/80 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center mb-5 border border-slate-200 shadow-xs">
                {icons[type] || icons.search}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 tracking-tight">{title || "Nothing found"}</h3>
            <p className="text-slate-500 font-bold text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
                {message || "We couldn't find any results matching your current filters or criteria."}
            </p>
            {actionText && (
                <button 
                    onClick={() => onAction ? onAction() : navigate(actionLink || '/')}
                    className="bg-slate-900 hover:bg-blue-600 text-white px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
