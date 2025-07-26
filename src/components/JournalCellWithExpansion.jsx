import React, { useMemo, memo } from 'react';
import { truncateJournalName } from '../../utils/textUtils';

// Memoized component for journal cell with manual expansion
const JournalCellWithExpansion = memo(({ 
  journal, 
  index, 
  searchTerm,
  isExpanded,
  onToggleExpansion
}) => {
  // Memoized display data calculation
  const displayData = useMemo(() => {
    try {
      // Get journal name safely with fallback
      const journalName = journal?.journal || journal?.name || journal?.title || 'Nome não disponível';
      
      // Validate and sanitize the name
      if (!journalName || typeof journalName !== 'string') {
        return {
          journalName: 'Nome não disponível',
          shouldTruncate: false,
          isValid: true
        };
      }
      
      const sanitizedName = journalName.trim();
      
      // Debug log for development
      if (import.meta.env.DEV && index < 5) {
        console.log(`Journal ${index}: "${sanitizedName}" (${sanitizedName.length} chars)`);
      }
      
      // Check if truncation is needed (30 characters for better UX)
      const shouldTruncate = sanitizedName.length > 30;
      
      return {
        journalName: sanitizedName,
        shouldTruncate,
        isValid: true
      };
    } catch (error) {
      console.error(`[JournalCellWithExpansion] Error processing display data for journal ${index}:`, error);
      
      return {
        journalName: 'Erro no nome',
        shouldTruncate: false,
        isValid: false,
        error: error.message
      };
    }
  }, [journal, index]);

  // Memoized display name based on expansion state
  const displayName = useMemo(() => {
    if (!displayData.shouldTruncate || isExpanded) {
      return displayData.journalName;
    }
    return truncateJournalName(displayData.journalName, 30);
  }, [displayData.journalName, displayData.shouldTruncate, isExpanded]);

  // Memoized highlighted text
  const highlightedText = useMemo(() => {
    if (!searchTerm || !displayName) return displayName;

    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = displayName.split(regex);

      return parts.map((part, partIndex) =>
        regex.test(part) ? (
          <mark key={partIndex} className="search-highlight bg-yellow-200">
            {part}
          </mark>
        ) : part
      );
    } catch (error) {
      console.error('Error highlighting search term:', error);
      return displayName;
    }
  }, [displayName, searchTerm]);

  // Error fallback
  if (!displayData.isValid) {
    return (
      <div className="journal-cell-container">
        <div className="journal-cell-fallback" data-testid={`journal-cell-fallback-${index}`}>
          <span className="text-gray-900">{displayData.journalName}</span>
          <span 
            className="text-xs text-red-500 ml-2" 
            title={`Fallback mode active: ${displayData.error || 'Unknown error'}`}
          >
            ⚠
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-cell-container">
      <div 
        className={`journal-cell ${isExpanded ? 'expanded' : 'truncated'}`}
        style={{ 
          maxWidth: isExpanded ? '600px' : '400px',
          minWidth: '300px',
          cursor: displayData.shouldTruncate ? 'pointer' : 'default'
        }}
        title={displayData.shouldTruncate ? displayData.journalName : undefined}
        role="gridcell"
        aria-label={`Journal: ${displayData.journalName}${displayData.shouldTruncate ? ' (clique para expandir)' : ''}`}
      >
        <div className="flex items-center gap-2">
          <span 
            className={isExpanded ? 'whitespace-normal break-words' : 'whitespace-nowrap'}
            onClick={displayData.shouldTruncate ? () => onToggleExpansion(index) : undefined}
          >
            {highlightedText}
          </span>
          
          {displayData.shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Expand button clicked for index:', index);
                if (onToggleExpansion) {
                  onToggleExpansion(index);
                } else {
                  console.error('onToggleExpansion function not provided');
                }
              }}
              className="journal-expand-button"
              title={isExpanded ? 'Recolher nome' : 'Expandir nome completo'}
              aria-label={isExpanded ? 'Recolher nome do journal' : 'Expandir nome completo do journal'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default JournalCellWithExpansion;