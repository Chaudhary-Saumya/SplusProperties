import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorBox = ({ message, retry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[32px] text-center max-w-2xl mx-auto my-12">
            <div className="bg-rose-100 p-4 rounded-2xl mb-6 shadow-sm">
                <AlertCircle className="text-rose-600" size={48} />
            </div>
            <h3 className="text-2xl font-black text-rose-900 mb-2 font-['Outfit']">System Alert</h3>
            <p className="text-rose-600 font-bold mb-8 max-w-md">{message || "An unexpected error occurred while communicating with the server."}</p>
            {retry && (
                <button 
                    onClick={retry}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                    <RefreshCw size={18} /> Retry Connection
                </button>
            )}
        </div>
    );
};

export default ErrorBox;
