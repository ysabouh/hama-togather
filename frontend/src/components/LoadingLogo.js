import React from 'react';

const LoadingLogo = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className="w-24 h-24 animate-pulse"
        />
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    </div>
  );
};

export default LoadingLogo;
