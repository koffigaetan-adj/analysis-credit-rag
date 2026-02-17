import { Application, TeamMember, AIAnalysis } from './types';

export const mockApplications: Application[] = [
  {
    id: '1',
    clientName: 'SARL Martin BTP',
    siren: '412 365 879',
    amount: 250000,
    date: '2024-01-28',
    status: 'approved',
    riskLevel: 'low',
    score: 85,
  },
  {
    id: '2',
    clientName: 'Boulangerie du Centre',
    siren: '523 741 963',
    amount: 75000,
    date: '2024-01-29',
    status: 'analyzing',
    riskLevel: 'medium',
  },
  {
    id: '3',
    clientName: 'Garage Automobiles Leclerc',
    siren: '398 456 123',
    amount: 180000,
    date: '2024-01-27',
    status: 'approved',
    riskLevel: 'low',
    score: 78,
  },
  {
    id: '4',
    clientName: 'Restaurant Le Gourmet',
    siren: '445 789 321',
    amount: 120000,
    date: '2024-01-26',
    status: 'rejected',
    riskLevel: 'high',
    score: 42,
  },
  {
    id: '5',
    clientName: 'Pharmacie Dubois',
    siren: '567 234 891',
    amount: 95000,
    date: '2024-01-25',
    status: 'draft',
  },
  {
    id: '6',
    clientName: 'Transports Rousseau SA',
    siren: '321 654 987',
    amount: 450000,
    date: '2024-01-24',
    status: 'approved',
    riskLevel: 'low',
    score: 92,
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sophie Dubois',
    email: 'sophie.dubois@creditai.fr',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Pierre Martin',
    email: 'pierre.martin@creditai.fr',
    role: 'analyst',
    status: 'active',
  },
  {
    id: '3',
    name: 'Marie Leclerc',
    email: 'marie.leclerc@creditai.fr',
    role: 'analyst',
    status: 'active',
  },
  {
    id: '4',
    name: 'Jean Rousseau',
    email: 'jean.rousseau@creditai.fr',
    role: 'analyst',
    status: 'inactive',
  },
];

export const mockAIAnalysis: AIAnalysis = {
  score: 85,
  rating: 'Solide',
  strengths: [
    'Rentabilité en forte croissance (+18% sur 3 ans)',
    'Trésorerie nette positive de 145 000 €',
    'Diversification du portefeuille clients',
    'Historique de paiement irréprochable',
    'Secteur d\'activité en expansion',
  ],
  concerns: [
    'Ratio d\'endettement légèrement élevé (62%)',
    'Dépendance à 2 clients majeurs (35% du CA)',
    'Stocks en augmentation constante',
  ],
  financials: [
    {
      label: 'DSCR (Debt Service Coverage Ratio)',
      value: '1.85',
      status: 'good',
    },
    {
      label: 'Taux d\'endettement',
      value: '62%',
      status: 'warning',
    },
    {
      label: 'Gearing (Ratio de levier)',
      value: '1.2',
      status: 'good',
    },
    {
      label: 'Ratio de liquidité',
      value: '1.45',
      status: 'good',
    },
    {
      label: 'Marge opérationnelle',
      value: '12.3%',
      status: 'good',
    },
    {
      label: 'ROE (Return on Equity)',
      value: '15.8%',
      status: 'good',
    },
  ],
};

export const mockChartData = [
  { month: 'Août', volume: 12 },
  { month: 'Sept', volume: 18 },
  { month: 'Oct', volume: 15 },
  { month: 'Nov', volume: 22 },
  { month: 'Déc', volume: 19 },
  { month: 'Jan', volume: 25 },
];

export const mockRiskData = [
  { name: 'Faible', value: 58, color: '#10b981' },
  { name: 'Moyen', value: 28, color: '#f59e0b' },
  { name: 'Élevé', value: 14, color: '#ef4444' },
];
