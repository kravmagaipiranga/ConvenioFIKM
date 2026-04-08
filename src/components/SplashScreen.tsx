import React from 'react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#00008e] flex flex-col items-center justify-center">
      <div className="relative animate-pulse">
        <img 
          src="https://raw.githubusercontent.com/kravmagaipiranga/ConvenioFIKM/999afde1fea9df6f1c039c9b551bca85b2394a7e/src/BCO_ICONE.png" 
          alt="FIKM Loading" 
          className="w-32 h-32 md:w-48 md:h-48 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="mt-8 text-white font-display text-2xl tracking-widest animate-pulse">
        CARREGANDO...
      </div>
    </div>
  );
}
