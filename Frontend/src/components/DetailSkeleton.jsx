import React from 'react';

const DetailSkeleton = () => {
    return (
        <div className="animate-pulse py-8 md:py-12 max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-10 gap-8">
                <div className="flex-1 space-y-4">
                    <div className="h-12 md:h-16 bg-slate-100 rounded-2xl w-3/4"></div>
                    <div className="h-6 bg-slate-100 rounded-xl w-1/2"></div>
                </div>
                <div className="w-full lg:w-[320px] h-40 bg-slate-100 rounded-[32px]"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-6">
                    <div className="aspect-video bg-slate-100 rounded-[40px]"></div>
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-32 h-32 bg-slate-100 rounded-3xl flex-shrink-0"></div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <div className="h-[500px] bg-slate-100 rounded-[40px]"></div>
                </div>
            </div>
            
            <div className="h-64 bg-slate-100 rounded-[40px] mt-12"></div>
        </div>
    );
};

export default DetailSkeleton;
