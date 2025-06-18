import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Database, BookOpen, Building, DollarSign, X } from 'lucide-react';

const StatsPanel = ({ 
  stats, 
  dataSource, 
  isVisible = false, 
  onClose,
  onExportStats 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isVisible) return null;

  // Função para calcular porcentagem
  const getPercentage = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  };

  // Componente de card de estatística
  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'gray' }) => (
    <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-${color}-600 text-sm font-medium`}>{title}</p>
          <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
          {subtitle && (
            <p className={`text-${color}-600 text-xs mt-1`}>{subtitle}</p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  );

  // Componente de barra de progresso
  const ProgressBar = ({ label, value, total, color = 'blue' }) => {
    const percentage = getPercentage(value, total);
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{label}</span>
          <span className="text-gray-600">{value} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Aba Overview
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          title="Total de Journals"
          value={stats.total?.toLocaleString() || '0'}
          subtitle="Base completa"
          color="gray"
        />
        
        <StatCard
          icon={BookOpen}
          title="Com ABDC"
          value={stats.withABDC?.toLocaleString() || '0'}
          subtitle={`${getPercentage(stats.withABDC, stats.total)}% do total`}
          color="blue"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Com ABS"
          value={stats.withABS?.toLocaleString() || '0'}
          subtitle={`${getPercentage(stats.withABS, stats.total)}% do total`}
          color="green"
        />
        
        <StatCard
          icon={Building}
          title="Wiley"
          value={stats.withWiley?.toLocaleString() || '0'}
          subtitle={`${getPercentage(stats.withWiley, stats.total)}% do total`}
          color="purple"
        />
      </div>

      {/* Informações das fontes */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Status das Fontes de Dados
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="font-medium">ABDC 2022</div>
              <div className="text-sm text-gray-600">
                {dataSource.abdc?.loaded ? 'Carregado' : 'Não carregado'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{dataSource.abdc?.count || 0}</div>
              <div className="text-xs text-gray-500">journals</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="font-medium">ABS 2024</div>
              <div className="text-sm text-gray-600">
                {dataSource.abs?.loaded ? 'Carregado' : 'Não carregado'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{dataSource.abs?.count || 0}</div>
              <div className="text-xs text-gray-500">journals</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="font-medium">Wiley</div>
              <div className="text-sm text-gray-600">
                {dataSource.wiley?.loaded ? 'Carregado' : 'Não carregado'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{dataSource.wiley?.count || 0}</div>
              <div className="text-xs text-gray-500">journals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Aba Classificações
  const ClassificationsTab = () => (
    <div className="space-y-6">
      {/* Distribuição ABDC */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Distribuição ABDC
        </h4>
        <div className="space-y-3">
          {Object.entries(stats.abdcDistribution || {})
            .sort(([a], [b]) => {
              const order = { 'A*': 4, 'A': 3, 'B': 2, 'C': 1 };
              return (order[b] || 0) - (order[a] || 0);
            })
            .map(([rating, count]) => (
              <ProgressBar
                key={rating}
                label={`Classificação ${rating}`}
                value={count}
                total={stats.withABDC}
                color={rating === 'A*' ? 'green' : rating === 'A' ? 'blue' : rating === 'B' ? 'yellow' : 'gray'}
              />
            ))}
        </div>
      </div>

      {/* Distribuição ABS */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Distribuição ABS
        </h4>
        <div className="space-y-3">
          {Object.entries(stats.absDistribution || {})
            .sort(([a], [b]) => {
              const order = { '4*': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
              return (order[b] || 0) - (order[a] || 0);
            })
            .map(([rating, count]) => (
              <ProgressBar
                key={rating}
                label={`Classificação ${rating}`}
                value={count}
                total={stats.withABS}
                color={rating === '4*' ? 'green' : rating === '4' ? 'blue' : rating === '3' ? 'yellow' : rating === '2' ? 'orange' : 'gray'}
              />
            ))}
        </div>
      </div>

      {/* Comparação de classificações */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold mb-4">Comparação de Classificações</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Journals com ambas classificações</div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.total ? (
                ((stats.withABDC + stats.withABS - stats.total) > 0 ? 
                  (stats.withABDC + stats.withABS - stats.total) : 0)
              ) : 0}
            </div>
            <div className="text-xs text-gray-500">
              ABDC + ABS
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-2">Apenas uma classificação</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.total ? (
                stats.total - Math.max(stats.withABDC, stats.withABS)
              ) : 0}
            </div>
            <div className="text-xs text-gray-500">
              Somente ABDC ou ABS
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Aba Wiley (se houver dados)
  const WileyTab = () => (
    <div className="space-y-6">
      {/* Estatísticas gerais Wiley */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Building}
          title="Total Wiley"
          value={stats.withWiley?.toLocaleString() || '0'}
          subtitle="Journals na Wiley"
          color="purple"
        />
        
        <StatCard
          icon={DollarSign}
          title="Com APC"
          value={Object.values(stats.wileySubjects || {}).length}
          subtitle="Áreas temáticas"
          color="green"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Cobertura"
          value={`${getPercentage(stats.withWiley, stats.total)}%`}
          subtitle="Do total de journals"
          color="blue"
        />
      </div>

      {/* Top áreas temáticas */}
      {stats.wileySubjects && Object.keys(stats.wileySubjects).length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Top Áreas Temáticas (Wiley)
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(stats.wileySubjects)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([subject, count]) => (
                <div key={subject} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm truncate pr-4" title={subject}>
                    {subject}
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Estatísticas do Banco de Dados
          </h3>
          
          <div className="flex items-center gap-3">
            {onExportStats && (
              <button
                onClick={onExportStats}
                className="btn btn-outline text-sm"
                title="Exportar estatísticas"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Visão Geral', icon: Database },
              { id: 'classifications', name: 'Classificações', icon: BarChart3 },
              { id: 'wiley', name: 'Wiley', icon: Building }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'classifications' && <ClassificationsTab />}
          {activeTab === 'wiley' && <WileyTab />}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
            <div>
              JournalScope v1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
