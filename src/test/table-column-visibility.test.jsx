import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../contexts/I18nContext';
import ResultsTable from '../components/ResultsTable';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test data
const mockJournalData = [
  {
    journal: 'Test Journal A',
    abdc: 'A*',
    abs: '4*',
    sjr: { quartile: 'Q1', hIndex: 120, score: 2.1 },
    jcr: { quartile: 'Q1', impactFactor: 5.2, category: 'Business' },
    qualis: 'MB',
    predatory: { isPredatory: false }
  },
  {
    journal: 'Test Journal B',
    abdc: 'B',
    abs: '2',
    sjr: { quartile: 'Q2', hIndex: 85, score: 1.3 },
    jcr: { quartile: 'Q2', impactFactor: 3.1, category: 'Management' },
    qualis: 'B',
    predatory: { isPredatory: true }
  }
];

describe('Table Column Visibility Based on Language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Portuguese Language Mode', () => {
    it('should show Qualis column in Portuguese mode', async () => {
      localStorageMock.getItem.mockReturnValue('pt');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Qualis')).toBeInTheDocument();
      });
    });

    it('should hide SJR H-Index column in Portuguese mode', async () => {
      localStorageMock.getItem.mockReturnValue('pt');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });
    });

    it('should display Qualis values correctly in Portuguese mode', async () => {
      localStorageMock.getItem.mockReturnValue('pt');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('MB')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
      });
    });

    it('should show Portuguese table headers', async () => {
      localStorageMock.getItem.mockReturnValue('pt');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('AÇÕES')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });
    });
  });

  describe('English Language Mode', () => {
    it('should show SJR H-Index column in English mode', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
      });
    });

    it('should hide Qualis column in English mode', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Qualis')).not.toBeInTheDocument();
      });
    });

    it('should display SJR H-Index values correctly in English mode', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('should show English table headers', async () => {
      localStorageMock.getItem.mockReturnValue('en');
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.queryByText('AÇÕES')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Column Switching', () => {
    it('should switch columns when language changes from PT to EN', async () => {
      const user = userEvent.setup();
      
      // Start with Portuguese
      localStorageMock.getItem.mockReturnValue('pt');
      
      const TestWrapper = () => {
        const [currentLang, setCurrentLang] = React.useState('pt');
        
        React.useEffect(() => {
          localStorageMock.getItem.mockReturnValue(currentLang);
        }, [currentLang]);
        
        return (
          <I18nProvider>
            <div>
              <button 
                onClick={() => setCurrentLang('en')}
                data-testid="switch-to-en"
              >
                Switch to EN
              </button>
              <ResultsTable data={mockJournalData} />
            </div>
          </I18nProvider>
        );
      };

      render(<TestWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Qualis')).toBeInTheDocument();
        expect(screen.queryByText('SJR H-Index')).not.toBeInTheDocument();
      });

      // Switch to English
      await user.click(screen.getByTestId('switch-to-en'));

      await waitFor(() => {
        expect(screen.getByText('SJR H-Index')).toBeInTheDocument();
        expect(screen.queryByText('Qualis')).not.toBeInTheDocument();
      });
    });

    it('should maintain other columns when switching languages', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // These columns should always be present
        expect(screen.getByText('Journal')).toBeInTheDocument();
        expect(screen.getByText('ABDC')).toBeInTheDocument();
        expect(screen.getByText('ABS')).toBeInTheDocument();
        expect(screen.getByText('SJR Quartile')).toBeInTheDocument();
        expect(screen.getByText('JCR Quartile')).toBeInTheDocument();
      });
    });
  });

  describe('Column Configuration Persistence', () => {
    it('should save optional column preferences to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Journal')).toBeInTheDocument();
      });

      // Open column settings
      const settingsButton = screen.getByTitle(/configure/i);
      await user.click(settingsButton);

      await waitFor(() => {
        // Should show column configuration options
        const predatoryCheckbox = screen.getByLabelText(/predatory/i);
        expect(predatoryCheckbox).toBeInTheDocument();
      });

      // Toggle a column
      const predatoryCheckbox = screen.getByLabelText(/predatory/i);
      await user.click(predatoryCheckbox);

      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journalTable_optionalColumns',
        expect.stringContaining('predatory')
      );
    });

    it('should load optional column preferences from localStorage', async () => {
      // Mock saved preferences
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journalTable_optionalColumns') {
          return JSON.stringify({ predatory: true });
        }
        return null;
      });
      
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should show the predatory column based on saved preferences
        expect(screen.getByText(/predatory/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsive Column Behavior', () => {
    it('should adapt columns for mobile view', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should still show essential columns on mobile
        expect(screen.getByText('Journal')).toBeInTheDocument();
      });
    });

    it('should handle window resize events', async () => {
      render(
        <I18nProvider>
          <ResultsTable data={mockJournalData} />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Journal')).toBeInTheDocument();
      });

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        // Should still render properly after resize
        expect(screen.getByText('Journal')).toBeInTheDocument();
      });
    });
  });
});