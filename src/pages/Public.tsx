import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Convenio } from '../types';
import { Search, MapPin, Gift, X, ExternalLink, MessageCircle, Filter, Phone, Share2 } from 'lucide-react';
import { CategoryFilter } from '../components/CategoryFilter';
import { ConvenioCard } from '../components/ConvenioCard';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 9;

export function Public() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = query(
      collection(db, 'convenios'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Convenio[];
      
      // Sort in memory: highlights first, then by createdAt descending
      data.sort((a, b) => {
        if (a.highlight && !b.highlight) return -1;
        if (!a.highlight && b.highlight) return 1;
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
      
      setConvenios(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching convenios:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories]);

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(convenios.map((c) => c.category));
    return Array.from(cats).sort();
  }, [convenios]);

  // Filtrar convênios
  const filteredConvenios = useMemo(() => {
    return convenios.filter((convenio) => {
      const matchesSearch =
        searchTerm === "" ||
        convenio.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        convenio.advantageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        convenio.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        convenio.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(convenio.category);

      return matchesSearch && matchesCategory;
    });
  }, [convenios, searchTerm, selectedCategories]);

  // Paginação
  const totalPages = Math.ceil(filteredConvenios.length / ITEMS_PER_PAGE);
  const paginatedConvenios = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredConvenios.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredConvenios, currentPage]);

  // Separar destaques dos demais (apenas da página atual)
  const destacados = paginatedConvenios.filter((c) => c.highlight);
  const normais = paginatedConvenios.filter((c) => !c.highlight);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSearchTerm('');
  };

  const handleShareModal = async () => {
    if (!selectedConvenio) return;
    
    const shareData = {
      title: `Convênio FIKM: ${selectedConvenio.companyName}`,
      text: `Confira o convênio da ${selectedConvenio.companyName} para alunos da FIKM: ${selectedConvenio.advantageTitle}`,
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

  const phoneToCallModal = selectedConvenio?.phone || selectedConvenio?.whatsapp;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-display text-gray-900 mb-2">
              Clube de Vantagens FIKM
            </h1>
            <p className="text-gray-600">
              Descubra benefícios exclusivos para alunos da Federação Internacional de Krav Magá
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-3xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, categoria ou benefício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fikm-blue focus:border-transparent shadow-sm text-gray-900"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar - Filtros (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-48 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                onClearAll={handleClearAll}
              />
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-fikm-blue hover:bg-blue-800 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
            
            {showFilters && (
              <div className="mt-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <CategoryFilter
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  onClearAll={handleClearAll}
                />
              </div>
            )}
          </div>

          {/* Convênios Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fikm-blue mx-auto"></div>
                <p className="mt-4 text-gray-500">Carregando convênios...</p>
              </div>
            ) : (
              <>
                {/* Resultados Info */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    {filteredConvenios.length} convênio{filteredConvenios.length !== 1 ? "s" : ""} encontrado{filteredConvenios.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {filteredConvenios.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-500 mb-4">
                      Nenhum convênio encontrado com os filtros selecionados.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategories([]);
                      }}
                      className="text-fikm-blue font-medium hover:underline"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Destaques */}
                    {destacados.length > 0 && (
                      <div>
                        <h2 className="text-xl font-display text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-yellow-500">⭐</span> Destaques
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {destacados.map((convenio) => (
                            <ConvenioCard key={convenio.id} convenio={convenio} onClick={setSelectedConvenio} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Convênios Normais */}
                    {normais.length > 0 && (
                      <div>
                        {destacados.length > 0 && (
                          <h2 className="text-xl font-display text-gray-900 mb-4 border-t border-gray-200 pt-8">
                            Todos os Convênios
                          </h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {normais.map((convenio) => (
                            <ConvenioCard key={convenio.id} convenio={convenio} onClick={setSelectedConvenio} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pt-8 border-t border-gray-200">
                        <Pagination 
                          currentPage={currentPage} 
                          totalPages={totalPages} 
                          onPageChange={setCurrentPage} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedConvenio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedConvenio(null)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <button 
              onClick={() => setSelectedConvenio(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 p-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="overflow-y-auto p-0">
              {selectedConvenio.imageUrl && (
                <div className="w-full h-64 sm:h-80 relative">
                  <img 
                    src={selectedConvenio.imageUrl} 
                    alt={selectedConvenio.companyName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-fikm-blue/10 text-fikm-blue px-2.5 py-0.5 rounded text-xs font-bold">
                    {selectedConvenio.category}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded text-xs font-bold">
                    {selectedConvenio.advantageType}
                  </span>
                </div>
                
                <h2 className="font-display text-4xl text-gray-900 mb-2">{selectedConvenio.companyName}</h2>
                <p className="text-xl font-semibold text-green-600 mb-6">{selectedConvenio.advantageTitle}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Sobre</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConvenio.description}</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-bold text-fikm-blue mb-2 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Como utilizar o benefício
                    </h4>
                    <p className="text-gray-700 whitespace-pre-line">{selectedConvenio.instructions}</p>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="font-bold text-gray-900 mb-4">Contato & Localização</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedConvenio.city && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <span className="text-gray-600">
                            {selectedConvenio.neighborhood && `${selectedConvenio.neighborhood}, `}
                            {selectedConvenio.city}
                            {selectedConvenio.state && ` - ${selectedConvenio.state}`}
                          </span>
                        </div>
                      )}
                      
                      {selectedConvenio.email && (
                        <div className="flex items-start gap-3">
                          <span className="text-gray-400 font-bold mt-0.5">@</span>
                          <a href={`mailto:${selectedConvenio.email}`} className="text-fikm-blue hover:underline">
                            {selectedConvenio.email}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex flex-wrap gap-3">
                      {phoneToCallModal && (
                        <a 
                          href={`tel:${phoneToCallModal.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          Ligar
                        </a>
                      )}

                      {selectedConvenio.whatsapp && (
                        <a 
                          href={`https://wa.me/${selectedConvenio.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Sou aluno da FIKM e gostaria de saber mais sobre o convênio.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-5 rounded transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          WhatsApp
                        </a>
                      )}
                      
                      {selectedConvenio.website && (
                        <a 
                          href={selectedConvenio.website.startsWith('http') ? selectedConvenio.website : `https://${selectedConvenio.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Acessar Site
                        </a>
                      )}

                      <button 
                        onClick={handleShareModal}
                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        Compartilhar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
