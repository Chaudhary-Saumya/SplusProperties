import React from 'react';

const ListingSkeleton = ({ variant = 'card', isDark = false }) => {
  if (variant === 'list') {
    return (
      <div className={`border border-slate-100 rounded-[2rem] p-6 shadow-sm animate-pulse ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-6">
              <div className={`w-full md:w-[320px] h-[240px] rounded-2xl flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
              <div className="flex-1 space-y-4 py-2">
                  <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                          <div className={`h-8 rounded-lg w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                          <div className={`h-4 rounded-lg w-1/2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                      </div>
                      <div className={`h-10 rounded-lg w-24 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                  </div>
                  <div className={`h-20 rounded-2xl w-full ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}></div>
                  <div className={`flex justify-between items-center pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                          <div className="space-y-2">
                              <div className={`h-4 rounded-lg w-24 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                              <div className={`h-2 rounded-lg w-32 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}></div>
                          </div>
                      </div>
                      <div className={`h-12 rounded-2xl w-32 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`min-w-[340px] max-w-[340px] border shadow-sm rounded-3xl overflow-hidden animate-pulse ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`h-56 relative ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
        <div className="p-6 space-y-4">
            <div className={`h-6 rounded-lg w-3/4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            <div className={`h-4 rounded-lg w-1/2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            <div className={`pt-4 border-t flex justify-between ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                <div className={`h-8 rounded-lg w-24 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                <div className={`h-8 rounded-lg w-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            </div>
            <div className={`h-12 rounded-xl w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
        </div>
    </div>
  );
};

export default ListingSkeleton;
