import React from 'react';
import { Convenio } from '../types';
import { MapPin, Tag, Gift, MessageCircle, Phone, Share2 } from 'lucide-react';

interface ConvenioCardProps {
  convenio: Convenio;
  onClick: (convenio: Convenio) => void;
}

export function ConvenioCard({ convenio, onClick }: ConvenioCardProps) {
  const whatsappMessage = encodeURIComponent('Olá! Sou aluno da FIKM e gostaria de saber mais sobre o convênio.');

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `Convênio FIKM: ${convenio.companyName}`,
      text: `Confira o convênio da ${convenio.companyName} para alunos da FIKM: ${convenio.advantageTitle}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const phoneToCall = convenio.phone || convenio.whatsapp;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100 hover:shadow-md transition-shadow h-full">
      <div className="aspect-[4/3] w-full relative bg-gray-100">
        {convenio.imageUrl ? (
          <img 
            src={convenio.imageUrl} 
            alt={convenio.companyName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-fikm-blue/5">
            <Gift className="w-16 h-16 text-fikm-blue/20" />
          </div>
        )}
        {convenio.highlight && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
            <span>⭐</span> DESTAQUE
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-fikm-blue text-xs font-bold px-2 py-1 rounded shadow-sm">
          {convenio.category}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-display text-2xl text-gray-900 mb-1 leading-tight">{convenio.companyName}</h3>
        
        <div className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 mb-3">
          <Tag className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{convenio.advantageTitle}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {convenio.description}
        </p>
        
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {convenio.city ? `${convenio.neighborhood ? convenio.neighborhood + ', ' : ''}${convenio.city}` : 'Online / Nacional'}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onClick(convenio)}
            className="flex-1 bg-fikm-blue hover:bg-blue-800 text-white font-bold py-2.5 px-2 rounded transition-colors text-sm"
          >
            Como aproveitar
          </button>
          
          {phoneToCall && (
            <a
              href={`tel:${phoneToCall.replace(/\D/g, '')}`}
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded transition-colors"
              title="Ligar"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-5 h-5" />
            </a>
          )}

          {convenio.whatsapp && (
            <a
              href={`https://wa.me/${convenio.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 rounded transition-colors"
              title="Chamar no WhatsApp"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          )}

          <button
            onClick={handleShare}
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
