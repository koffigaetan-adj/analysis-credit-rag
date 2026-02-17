export type ApplicationStatus = 'draft' | 'analyzing' | 'approved' | 'rejected';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Application {
  id: string;
  clientName: string;
  siren: string;
  amount: number;
  date: string;
  status: ApplicationStatus;
  riskLevel?: RiskLevel;
  score?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst';
  status: 'active' | 'inactive';
}

export interface FinancialMetric {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
}

export interface AIAnalysis {
  score: number;
  rating: string;
  strengths: string[];
  concerns: string[];
  financials: FinancialMetric[];
}
