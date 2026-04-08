import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db, auth, storage } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Convenio, CATEGORIES, ADVANTAGE_TYPES } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Check, X, Image as ImageIcon, UserPlus } from 'lucide-react';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

export function Admin() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // User creation state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const navigate = useNavigate();

  const initialFormState = {
    companyName: '',
    category: '',
    advantageType: '',
    advantageTitle: '',
    description: '',
    instructions: '',
    neighborhood: '',
    city: '',
    state: '',
    whatsapp: '',
    website: '',
    email: '',
    phone: '',
    active: true,
    highlight: false,
    imageUrl: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    const q = query(collection(db, 'convenios'));
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Convenio[];
      
      data.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
      
      setConvenios(data);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, [navigate]);

  // Paginação
  const totalPages = Math.ceil(convenios.length / ITEMS_PER_PAGE);
  const paginatedConvenios = convenios.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserLoading(true);
    
    let secondaryApp;
    try {
      // Initialize a secondary app with a unique name to avoid duplicate app errors
      const appName = "SecondaryApp_" + Date.now();
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      
      await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      await signOut(secondaryAuth);
      
      setIsUserModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      // Modal closes on success
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setUserError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setUserError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setUserError('Erro ao criar usuário: ' + err.message);
      }
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.error("Error deleting secondary app:", e);
        }
      }
      setUserLoading(false);
    }
  };

  const handleOpenModal = (convenio?: Convenio) => {
    if (convenio) {
      setFormData({
        companyName: convenio.companyName,
        category: convenio.category,
        advantageType: convenio.advantageType,
        advantageTitle: convenio.advantageTitle,
        description: convenio.description,
        instructions: convenio.instructions,
        neighborhood: convenio.neighborhood || '',
        city: convenio.city || '',
        state: convenio.state || '',
        whatsapp: convenio.whatsapp || '',
        website: convenio.website || '',
        email: convenio.email || '',
        phone: convenio.phone || '',
        active: convenio.active,
        highlight: convenio.highlight,
        imageUrl: convenio.imageUrl || ''
      });
      setEditingId(convenio.id!);
      setImagePreview(convenio.imageUrl || null);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `convenios/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const convenioData = {
        ...formData,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'convenios', editingId), convenioData);
      } else {
        await addDoc(collection(db, 'convenios'), {
          ...convenioData,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving convenio:", error);
      alert("Erro ao salvar convênio. Verifique o console.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este convênio?')) {
      try {
        await deleteDoc(doc(db, 'convenios', id));
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Erro ao excluir.");
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'convenios', id), {
        active: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-fikm-blue shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-white font-display text-2xl">Painel Administrativo</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-blue-200 hover:text-white text-sm font-medium"
            >
              Ver Site
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-white bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Convênios</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total de {convenios.length} convênios cadastrados ({convenios.filter(c => c.active).length} ativos).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors"
            >
              <UserPlus className="w-5 h-5" /> Adicionar Usuário
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" /> Novo Convênio
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria / Vantagem</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedConvenios.map((convenio) => (
                  <tr key={convenio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded overflow-hidden">
                          {convenio.imageUrl ? (
                            <img className="h-10 w-10 object-cover" src={convenio.imageUrl} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {convenio.companyName}
                            {convenio.highlight && <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">⭐</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{convenio.category}</div>
                      <div className="text-xs text-gray-500">{convenio.advantageType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {convenio.city ? convenio.city : 'Online'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleActive(convenio.id!, convenio.active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          convenio.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {convenio.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenModal(convenio)}
                        className="text-fikm-blue hover:text-blue-900 mr-4"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(convenio.id!)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {convenios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <p className="mb-4">Nenhum convênio cadastrado ainda.</p>
                      <button 
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const seedData = [
                              {
                                companyName: 'Jardim da Vida',
                                category: 'Serviços Pet',
                                advantageType: 'Desconto',
                                advantageTitle: 'Serviço de Cremação Pet',
                                description: 'Atendimento humanizado, remoção especializada, cremação individual ou coletiva. Memoriais afetivos (patinha, pelagem, certificado). Acompanhamento do início ao fim.',
                                instructions: 'Entrar em contato pelo telefone para acionamento do serviço.',
                                phone: '(11) 4118-6060',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Sustentável Ambiental',
                                category: 'Paisagismo',
                                advantageType: 'Visita Técnica',
                                advantageTitle: 'Consultoria, Projeto e Implantação',
                                description: 'Empresa especializada em soluções em paisagismo. Oferece consultoria, projeto e implantação.',
                                instructions: 'Aluno da FIKM deve entrar em contato para ganhar uma visita técnica para o seu espaço.',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Universe Sistemas Integrados',
                                category: 'Tecnologia',
                                advantageType: 'Desconto/Parceria',
                                advantageTitle: 'Sistemas para empresas',
                                description: 'Empresa com mais de 30 anos desenvolvendo sistemas que atendem a demanda e a modernização do mercado brasileiro. Modificamos e aperfeiçoamos todos os módulos de acordo com a necessidade da empresa.',
                                instructions: 'Entrar em contato pelos canais informados para verificar condições especiais para a FIKM.',
                                whatsapp: '5511999448108',
                                email: 'univeinfosistemas@gmail.com',
                                phone: '(11) 2341-0227',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Char Reginatti',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Ginecologia e Sexualidade',
                                description: 'Atendimento especializado em ginecologia, saúde mental e sexualidade.',
                                instructions: 'Desconto exclusivo para alunas da FIKM. Agendar via WhatsApp.',
                                neighborhood: 'Ipiranga',
                                city: 'São Paulo',
                                state: 'SP',
                                whatsapp: '5511961887454',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: "Favatito's",
                                category: 'Alimentação',
                                advantageType: 'Parceria',
                                advantageTitle: 'Paletas Caseiras',
                                description: 'Produção de paletas caseiras. Presente em feiras noturnas de Atibaia e gastronomia do balneário.',
                                instructions: 'Entrar em contato via WhatsApp ou Instagram @favatitoss para pedidos.',
                                city: 'Atibaia',
                                state: 'SP',
                                whatsapp: '5511951965078',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Dr. Alexandre Koga',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Invisalign Top Doctor',
                                description: 'Especialista em alinhadores invisíveis. Maior número de casos em Atibaia e região.',
                                instructions: '15% de desconto para alunos da FIKM. Agendamento via WhatsApp.',
                                city: 'Atibaia',
                                state: 'SP',
                                whatsapp: '5511968637085',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Dr. Paulo Agostinho',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Cardiologista',
                                description: 'Atendimento cardiológico especializado.',
                                instructions: '10% de desconto para alunos da FIKM. Contato via WhatsApp.',
                                whatsapp: '5511984488250',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Dra. Maria Christina Rondas',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Clínica Geral e Geriatria',
                                description: 'Atendimento médico em clínica geral e geriatria.',
                                instructions: '10% de desconto para alunos da FIKM. Contato via WhatsApp.',
                                whatsapp: '5511982082170',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Curso de Inglês',
                                category: 'Educação',
                                advantageType: 'Desconto',
                                advantageTitle: 'Aulas de Inglês',
                                description: 'Aulas de inglês para todas as idades, voltadas para conversação. Aulas online.',
                                instructions: 'Desconto especial de 10% para alunos da FIKM. Grupos de até 5 pessoas.',
                                whatsapp: '5511964829941',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Montana Grill',
                                category: 'Alimentação',
                                advantageType: 'Desconto',
                                advantageTitle: 'Grelhados',
                                description: 'Grelhados de alta qualidade. Unidade Shopping Pátio Paulista.',
                                instructions: '10% de desconto no cardápio da loja ou uso do cardápio lojista. Apresentar vínculo com a FIKM.',
                                city: 'São Paulo',
                                state: 'SP',
                                phone: '11996639865',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Perim Brasil',
                                category: 'Imóveis',
                                advantageType: 'Desconto',
                                advantageTitle: 'Perícias e Avaliações Imobiliárias',
                                description: 'Avaliação de imóveis, perícias judiciais, laudos técnicos, assistência técnica e avaliações judiciais.',
                                instructions: '10% de desconto para alunos da Federação Internacional de Krav Magá.',
                                whatsapp: '5511985150717',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Eduardo T. Cunha',
                                category: 'Automotivo',
                                advantageType: 'Desconto',
                                advantageTitle: 'Análise e Avaliação Veicular',
                                description: 'Especialista em análise e avaliação veicular.',
                                instructions: '20% de desconto para alunos da Federação Internacional de Krav Magá.',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Saimatec',
                                category: 'Automotivo',
                                advantageType: 'Parceria',
                                advantageTitle: 'Cabines e Equipamentos de Pintura e Secagem',
                                description: 'Cabines de reparação de veículos e industriais com tecnologia italiana. Há 30 anos no Brasil.',
                                instructions: 'Entrar em contato para verificar condições de parceria.',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Luesel',
                                category: 'Decoração',
                                advantageType: 'Desconto',
                                advantageTitle: 'Cerâmica e Restauração',
                                description: 'Especializada em cerâmica e restauração.',
                                instructions: '10% de desconto para alunos da FIKM.',
                                whatsapp: '5511985659999',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Clinica Beauty',
                                category: 'Serviços Pet',
                                advantageType: 'Desconto',
                                advantageTitle: 'Produtos Pet',
                                description: 'Venda de produtos para pets via Mercado Livre.',
                                instructions: '10% de desconto com cupom KRAVMAGA2023.',
                                whatsapp: '5511940211050',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Festival de Phalaenopsis',
                                category: 'Eventos/Flores',
                                advantageType: 'Desconto',
                                advantageTitle: 'Orquídeas',
                                description: 'Venda de orquídeas com valores especiais para alunos da FIKM.',
                                instructions: 'Apenas R$ 39,90 por unidade. Contato via WhatsApp.',
                                whatsapp: '5511954761941',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Deli da Iki',
                                category: 'Alimentação',
                                advantageType: 'Parceria',
                                advantageTitle: 'Sobremesas para o Natal',
                                description: 'Sobremesas artesanais para festas de fim de ano.',
                                instructions: 'Pedidos até 21/12 via WhatsApp. Pagamento via PIX ou cartão.',
                                whatsapp: '5511982920050',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Núcleo Terapêutico Seiki',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Técnicas Orientais',
                                description: 'Acupuntura, Laser Acupuntura, Ventosaterapia, Liberação Miofascial.',
                                instructions: '20% em sessão única ou 30% em pacotes de 5 sessões para alunos FIKM.',
                                city: 'São Paulo',
                                state: 'SP',
                                whatsapp: '5511996588543',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Haukka',
                                category: 'Vestuário',
                                advantageType: 'Desconto',
                                advantageTitle: 'Krav Magá Apparel',
                                description: 'Roupas e acessórios para prática de Krav Magá.',
                                instructions: 'Use o código FIKM2023 para compras acima de R$ 100 no site ou loja.',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Restaurante Peixe',
                                category: 'Alimentação',
                                advantageType: 'Desconto',
                                advantageTitle: 'Cardápio de Peixes',
                                description: 'Filé de tilápia à milanesa, salmão, parmegianas.',
                                instructions: 'Desconto especial para alunos FIKM na unidade Shopping Pátio Paulista.',
                                city: 'São Paulo',
                                state: 'SP',
                                phone: '11996639865',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Larissa Montagner',
                                category: 'Saúde',
                                advantageType: 'Desconto',
                                advantageTitle: 'Personal Trainer',
                                description: 'Consultoria online especializada em emagrecimento e definição muscular.',
                                instructions: 'Exclusivo para alunos FIKM. Contato via WhatsApp.',
                                whatsapp: '5519995608282',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Fabio - Aulas de Italiano',
                                category: 'Educação',
                                advantageType: 'Desconto',
                                advantageTitle: 'Aulas Particulares de Italiano',
                                description: 'Aulas com professor nativo da Toscana, residente no Brasil há mais de 30 anos.',
                                instructions: 'Atendimento individual, em grupos ou famílias. Presencial ou online (Meet, Teams, Skype, Zoom). 10% de desconto.',
                                phone: '(11) 99312-2636',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Equalize Estúdio Pilates',
                                category: 'Saúde/Bem-estar',
                                advantageType: 'Desconto',
                                advantageTitle: 'Pilates',
                                description: 'Melhora a postura, a flexibilidade, o desempenho físico, ajuda no fortalecimento muscular e na respiração. Previne lesões e reduz o estresse.',
                                instructions: 'Descontos especiais para alunos da FIKM. Entrar em contato com Paula.',
                                whatsapp: '5511963442844',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Ká em Kasa',
                                category: 'Decoração/Presentes',
                                advantageType: 'Parceria',
                                advantageTitle: 'Presentes Personalizados',
                                description: 'Presentes especiais personalizados para todas as idades.',
                                instructions: 'Entrar em contato via WhatsApp para pedidos.',
                                whatsapp: '5511987300111',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'Memorial Jardim da Vida',
                                category: 'Serviços',
                                advantageType: 'Desconto',
                                advantageTitle: 'Cremação e Assistência',
                                description: 'Suporte e serviço humanizado no momento mais difícil da vida. Prevenção e planos.',
                                instructions: 'Desconto para alunos da FIKM a partir de R$ 8.500,00 em até 12x.',
                                website: 'www.mjdv.com.br',
                                phone: '(11) 4118-6060',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              },
                              {
                                companyName: 'IP - Instituto de Psicologia',
                                category: 'Educação/Saúde',
                                advantageType: 'Parceria',
                                advantageTitle: 'Pós-graduação e Formação',
                                description: 'Cursos de graduação em psicologia clínica e neuropsicologia. Formação em Well-being Psychology.',
                                instructions: 'Entrar em contato para verificar benefícios da parceria com a FIKM.',
                                active: true,
                                highlight: false,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              }
                            ];
                            for (const item of seedData) {
                              await addDoc(collection(db, 'convenios'), item);
                            }
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-fikm-blue text-white px-4 py-2 rounded shadow hover:bg-blue-800"
                      >
                        Gerar Dados de Exemplo
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => !saving && setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingId ? 'Editar Convênio' : 'Novo Convênio'}
                  </h3>
                  <button onClick={() => !saving && setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Nome da Empresa *</label>
                      <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm">
                        <option value="">Selecione...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Vantagem *</label>
                      <select required value={formData.advantageType} onChange={e => setFormData({...formData, advantageType: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm">
                        <option value="">Selecione...</option>
                        {ADVANTAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Título da Vantagem *</label>
                      <input type="text" required placeholder="Ex: 15% de desconto em todos os produtos" value={formData.advantageTitle} onChange={e => setFormData({...formData, advantageTitle: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Descrição Completa *</label>
                      <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Instruções de Uso *</label>
                      <textarea required rows={2} placeholder="Como o aluno deve proceder para usar o benefício" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    {/* Location */}
                    <div className="sm:col-span-2"><h4 className="font-medium text-gray-900 border-b pb-2">Localização</h4></div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cidade</label>
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bairro</label>
                      <input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado (UF)</label>
                      <input type="text" maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    {/* Contact */}
                    <div className="sm:col-span-2"><h4 className="font-medium text-gray-900 border-b pb-2">Contato</h4></div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">WhatsApp (apenas números)</label>
                      <input type="text" placeholder="5511999999999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site (URL)</label>
                      <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">E-mail</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone Fixo</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" />
                    </div>

                    {/* Image & Settings */}
                    <div className="sm:col-span-2"><h4 className="font-medium text-gray-900 border-b pb-2">Imagem e Configurações</h4></div>

                    <div className="sm:col-span-2 flex items-center gap-6">
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded border border-gray-200" />
                        ) : (
                          <div className="h-24 w-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700">Imagem do Convênio (1:1 recomendado)</label>
                        <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-fikm-blue hover:file:bg-blue-100" />
                        <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WebP até 5MB.</p>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex gap-6">
                      <div className="flex items-center">
                        <input id="active" type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="h-4 w-4 text-fikm-blue focus:ring-fikm-blue border-gray-300 rounded" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                          Ativo (visível no site)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input id="highlight" type="checkbox" checked={formData.highlight} onChange={e => setFormData({...formData, highlight: e.target.checked})} className="h-4 w-4 text-fikm-blue focus:ring-fikm-blue border-gray-300 rounded" />
                        <label htmlFor="highlight" className="ml-2 block text-sm text-gray-900">
                          Destaque (aparece primeiro)
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fikm-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue disabled:opacity-50">
                      {saving ? 'Salvando...' : 'Salvar Convênio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsUserModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-fikm-blue" />
                  Adicionar Novo Usuário
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                {userError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-sm text-red-700">{userError}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input 
                    type="email" 
                    required 
                    value={newUserEmail} 
                    onChange={e => setNewUserEmail(e.target.value)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha (mínimo 6 caracteres)</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    value={newUserPassword} 
                    onChange={e => setNewUserPassword(e.target.value)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fikm-blue focus:border-fikm-blue sm:text-sm" 
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsUserModalOpen(false)} 
                    disabled={userLoading} 
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={userLoading} 
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fikm-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fikm-blue disabled:opacity-50"
                  >
                    {userLoading ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
