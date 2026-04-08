import React from 'react';
import { Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {/* Placeholder for Logo */}
            <div className="w-10 h-10 bg-fikm-blue rounded flex items-center justify-center text-white font-display text-xl">
              F
            </div>
            <div className="font-display text-2xl pt-1">
              <span className="text-gray-800">CONVÊNIOS</span> <span className="text-fikm-blue">FIKM</span>
            </div>
          </Link>
          <nav>
            <Link to="/admin" className="text-sm font-semibold text-gray-600 hover:text-fikm-blue transition-colors">
              Área Restrita
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm flex flex-col items-center">
          <img 
            src="https://yata-apix-c1ca31d6-cb5d-4e4c-94a2-7c6a7dc7c677.s3-object.locaweb.com.br/253cbb8bd896425188211a28a44bedec.png" 
            alt="Logo FIKM" 
            className="mb-4 w-1/2 md:w-1/3 lg:w-1/4 object-contain"
            referrerPolicy="no-referrer"
          />
          <p>Federação Internacional de Krav Magá &copy; {new Date().getFullYear()}</p>
          <p className="mt-2">Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
