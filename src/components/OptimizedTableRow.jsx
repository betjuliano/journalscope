import React, { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import JournalCellWithExpansion from './JournalCellWithExpansion';

// Memoized classification badge component
const ClassificationBadge = memo(({ type, value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  const className = type === 'abdc' 
    ? `classification-badge abdc-${value.toLowerCase().replace('*', '-star')}`
    : `classification-badge abs-${value.replace('*', '-star')}`;

  return <span className={className}>{value}</span>;
});

// Memoized quartile badge component
const QuartileBadge = memo(({ value }) => {
  if (!value) return <span className="text-gray-400">-</span>;

  const colorClass = {
    'Q1': 'bg-green-100 text-green-800',
    'Q2': 'bg-blue-100 text-blue-800',
    'Q3': 'bg-yellow-100 text-yellow-800',
    'Q4': 'bg-red-100 text-red-800'
  }[value] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {value}
    </span>
  );
});

// Memoized table row component with custom comparison
const OptimizedTableRow = memo(({
  journal,
  index,
  searchTerm,
  visibleColumns,
  isSelected,
  isExpanded,
  onToggleSelection,
  onToggleExpansion,
  getNestedValue
}) => {
  const renderCellContent = (columnKey, column) => {
    const value = getNestedValue(journal, column.field);

    switch (columnKey) {
      case 'journal':
        return (
          <JournalCellWithExpansion
            journal={journal}
            index={index}
            searchTerm={searchTerm}
            isExpanded={isExpanded}
            onToggleExpansion={onToggleExpansion}
          />
        );

      case 'abdc':
        return <ClassificationBadge type="abdc" value={value} />;

      case 'abs':
        return <ClassificationBadge type="abs" value={value} />;

      case 'sjrQuartile':
      case 'jcrQuartile':
        return <QuartileBadge value={value} />;

      case 'qualis':
        if (!value || value === '-') return <span className="text-gray-400">-</span>;
        const qualisColorClass = {
          'MB': 'bg-purple-100 text-purple-800',
          'B': 'bg-blue-100 text-blue-800',
          'R': 'bg-yellow-100 text-yellow-800',
          'F': 'bg-red-100 text-red-800'
        }[value] || 'bg-gray-100 text-gray-800';
        
        return (
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${qualisColorClass}`}>
            {value}
          </span>
        );

      case 'predatory':
        if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );

      default:
        return <span className="text-gray-600">{value || '-'}</span>;
    }
  };

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
      aria-selected={isSelected}
      role="row"
    >
      <td className="px-6 py-4 whitespace-nowrap" role="cell">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(index)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          aria-label={`Select journal ${journal.journal}`}
        />
      </td>
      
      {Object.entries(visibleColumns).map(([columnKey, column]) => (
        <td key={columnKey} className="px-6 py-4 whitespace-nowrap" role="cell">
          {renderCellContent(columnKey, column)}
        </td>
      ))}
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" role="cell">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('Action button clicked for journal:', journal.journal);
              alert(`Detalhes do journal: ${journal.journal}`);
            }}
            className="inline-flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-200"
            title={`Ver detalhes de ${journal.journal || 'journal'}`}
            aria-label={`Ver detalhes de ${journal.journal || 'journal'}`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.journal === nextProps.journal &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isExpanded === nextProps.isExpanded &&
    JSON.stringify(prevProps.visibleColumns) === JSON.stringify(nextProps.visibleColumns)
  );
});

export default OptimizedTableRow;