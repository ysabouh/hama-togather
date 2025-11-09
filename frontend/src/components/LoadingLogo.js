import React from 'react';

const LoadingLogo = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className="w-56 h-56 animate-pulse"
        />
        <div className="text-2xl text-gray-600 font-semibold">جاري التحميل...</div>
      </div>
    </div>
  );
};

export default LoadingLogo;
