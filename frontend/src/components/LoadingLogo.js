import React from 'react';

const LoadingLogo = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className="w-40 h-40 animate-pulse"
        />
        <div className="text-2xl text-gray-600 font-semibold">جاري التحميل...</div>
      </div>
    </div>
  );
};

export default LoadingLogo;
