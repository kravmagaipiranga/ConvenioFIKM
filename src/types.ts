export interface Convenio {
  id?: string;
  companyName: string;
  category: string;
  advantageType: string;
  advantageTitle: string;
  description: string;
  instructions: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  whatsapp?: string;
  website?: string;
  email?: string;
  phone?: string;
  primaryContact?: 'whatsapp' | 'phone' | 'website';
  imageUrl?: string;
  imageFit?: 'cover' | 'contain';
  active: boolean;
  highlight: boolean;
  createdAt: any;
  updatedAt: any;
}

export const CATEGORIES = [
  'Saúde',
  'Alimentação',
  'Educação',
  'Esportes & Fitness',
  'Tecnologia',
  'Moda & Vestuário',
  'Serviços Profissionais',
  'Beleza & Estética',
  'Turismo & Lazer',
  'Serviços Pet',
  'Paisagismo',
  'Imóveis',
  'Automotivo',
  'Decoração',
  'Eventos/Flores',
  'Saúde/Bem-estar',
  'Decoração/Presentes',
  'Serviços',
  'Educação/Saúde',
  'Vestuário',
  'Saúde/Odontologia',
  'Outros'
];

export const ADVANTAGE_TYPES = [
  'Desconto percentual',
  'Desconto fixo',
  'Brinde',
  'Condição especial',
  'Frete grátis',
  'Desconto',
  'Visita Técnica',
  'Desconto/Parceria',
  'Parceria'
];
