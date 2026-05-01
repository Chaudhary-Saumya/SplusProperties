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
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-slate-50 w-32 h-32 rounded-[40px] flex items-center justify-center mb-8 border border-white shadow-inner">
                {icons[type] || icons.search}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 font-['Outfit']">{title || "Nothing found"}</h3>
            <p className="text-slate-500 font-bold max-w-sm mb-10 leading-relaxed">
                {message || "We couldn't find any results matching your current filters or criteria."}
            </p>
            {actionText && (
                <button 
                    onClick={() => onAction ? onAction() : navigate(actionLink || '/')}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
