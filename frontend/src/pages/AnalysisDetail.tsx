import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Send,
} from 'lucide-react';
import { mockAIAnalysis, mockApplications } from '../mockData';
import { formatCurrency } from '../utils';

export default function AnalysisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'financials' | 'chat'>(
    'summary'
  );
  const [chatMessage, setChatMessage] = useState('');

  const application = mockApplications.find((app) => app.id === id);

  if (!application) {
    return <div>Dossier non trouvé</div>;
  }

  const analysis = mockAIAnalysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/portfolio')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {application.clientName}
          </h1>
          <p className="text-gray-600">SIREN: {application.siren}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Document Source
              </h2>
            </div>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  Aperçu du document PDF
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Bilan_financier_2023.pdf
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Résultats IA</h2>
              <div
                className={`px-4 py-2 rounded-lg font-bold text-lg ${
                  analysis.score >= 70
                    ? 'bg-emerald-100 text-emerald-700'
                    : analysis.score >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                Score: {analysis.score}/100
              </div>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {analysis.rating}
                </div>
                <p className="text-sm text-gray-600">Évaluation globale</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'summary'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Synthèse
                </button>
                <button
                  onClick={() => setActiveTab('financials')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'financials'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Finances
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chat
                </button>
              </div>

              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-gray-900">Points Forts</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                      <h3 className="font-semibold text-gray-900">
                        Points de Vigilance
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.concerns.map((concern, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="space-y-3">
                  {analysis.financials.map((metric, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {metric.label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            metric.status === 'good'
                              ? 'bg-emerald-100 text-emerald-700'
                              : metric.status === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {metric.status === 'good'
                            ? 'Bon'
                            : metric.status === 'warning'
                            ? 'Attention'
                            : 'Risque'}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900">
                        Bonjour ! Je suis votre assistant IA. Posez-moi des
                        questions sur ce dossier.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Posez une question sur le document..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Détails du Prêt</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant demandé</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(application.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée</span>
                <span className="font-semibold text-gray-900">84 mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux proposé</span>
                <span className="font-semibold text-gray-900">3.2%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Valider le dossier
            </button>
            <button className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
