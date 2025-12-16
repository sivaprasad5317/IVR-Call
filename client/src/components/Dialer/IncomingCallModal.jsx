import React from 'react';

export default function IncomingCallModal({ callerNumber, onAccept, onReject }) {
  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* Modal Card */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <h2 className="text-lg font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Incoming Call
        </h2>
        
        {/* 📞 CALLER ID DISPLAY (The Fix) */}
        <div className="text-3xl font-extrabold text-gray-900 mb-10 break-words leading-tight">
          {callerNumber || "Unknown Caller"}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-10">
            
            {/* REJECT BUTTON (Red) */}
            <button 
                onClick={onReject}
                className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
            >
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shadow-sm group-hover:bg-red-200 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                     </svg>
                </div>
                <span className="text-sm font-semibold text-gray-600">Decline</span>
            </button>

            {/* ACCEPT BUTTON (Green with Pulse) */}
            <button 
                onClick={onAccept}
                className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
            >
                 <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shadow-lg shadow-green-200 group-hover:bg-green-200 transition-colors relative">
                     {/* Pulse Animation Ring */}
                     <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                     
                     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                     </svg>
                </div>
                <span className="text-sm font-semibold text-gray-600">Accept</span>
            </button>
        </div>

      </div>
    </div>
  );
}