import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Add from './index';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key),
  }),
}));

jest.mock('v2/apps/shared/components/select', () => {
  const React = require('react');
  return function MockSelectDialog({
    title,
    options,
    defaultValues,
    updateValues,
    uncheckAction,
    loading,
  }) {
    const [checkedItems, setCheckedItems] = React.useState(defaultValues || []);
    
    React.useEffect(() => {
      setCheckedItems(defaultValues || []);
    }, [defaultValues]);

    const handleChange = (option, isChecked) => {
      let newCheckedItems;
      if (isChecked) {
        newCheckedItems = [...checkedItems, option];
      } else {
        newCheckedItems = checkedItems.filter((val) => val.id !== option.id);
        if (uncheckAction) {
          uncheckAction(option);
        }
      }
      setCheckedItems(newCheckedItems);
      if (updateValues) {
        updateValues(newCheckedItems);
      }
    };

    return (
      <div data-testid="select-dialog">
        <h3 data-testid="select-title">{title}</h3>
        <div data-testid="select-options">
          {options.map((option) => (
            <div key={option.id} data-testid={`option-${option.id}`}>
              <label>
                <input
                  type="checkbox"
                  data-testid={`checkbox-${option.id}`}
                  checked={checkedItems.some((val) => val.id === option.id)}
                  onChange={(e) => handleChange(option, e.target.checked)}
                />
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {loading && <div data-testid="loading">Loading...</div>}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function MockModal({ open, setOpen, children }) {
    if (!open) return null;
    const handleConfirm = () => {
      if (open?.handleAccept) {
        const maybePromise = open.handleAccept();
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch(() => {});
        }
      }
    };
    return (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-content">
          <h3>{open.navTitle}</h3>
          <p>{open.title}</p>
          <button
            data-testid="modal-cancel"
            onClick={() => setOpen(false)}
          >
            {open.cancel}
          </button>
          <button
            data-testid="modal-confirm"
            onClick={handleConfirm}
          >
            {open.confirm}
          </button>
        </div>
        {children}
      </div>
    );
  };
});

jest.mock('v2/services/httpHelper', () => {
  return jest.fn(() => Promise.resolve({ data: { success: true } }));
});

const mockHttpHelper = require('v2/services/httpHelper');

describe('Add Component', () => {
  const defaultProps = {
    data: {
      tender: [
        { id: 1, label: 'Tender 1', state: 1 },
        { id: 2, label: 'Tender 2', state: 2 },
        { id: 3, label: 'Tender 3', state: 0 }, // This should be filtered out
      ],
    },
    myRef: React.createRef(),
    entities: [
      { id: 1, tender_id: 1 },
    ],
    reset: jest.fn(() => Promise.resolve()),
    navigateAfterAdding: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<Add {...defaultProps} />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('renders with empty data', () => {
      render(<Add />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('displays correct title', () => {
      render(<Add {...defaultProps} />);
      expect(screen.getByTestId('select-title')).toHaveTextContent('entities-modal-title');
    });

    test('filters and displays only valid trades (state >= 1)', () => {
      render(<Add {...defaultProps} />);
      expect(screen.getByTestId('option-1')).toBeInTheDocument();
      expect(screen.getByTestId('option-2')).toBeInTheDocument();
      expect(screen.queryByTestId('option-3')).not.toBeInTheDocument();
    });

    test('pre-selects trades based on existing entities', () => {
      render(<Add {...defaultProps} />);
      const checkbox1 = screen.getByTestId('checkbox-1');
      expect(checkbox1).toBeChecked();
    });
  });

  describe('Data Processing', () => {
    test('handles null data gracefully', () => {
      const props = { ...defaultProps, data: null };
      render(<Add {...props} />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('handles empty tenders array', () => {
      const props = { ...defaultProps, data: { tender: [] } };
      render(<Add {...props} />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('filters tenders correctly by state', () => {
      const data = {
        tender: [
          { id: 1, label: 'Draft Tender', state: 1 },
          { id: 2, label: 'Published Tender', state: 2 },
          { id: 3, label: 'Unpublished Tender', state: 0 },
          { id: 4, label: 'Another Draft', state: 1 },
        ],
      };
      const props = { ...defaultProps, data };
      render(<Add {...props} />);
      
      expect(screen.getByTestId('option-1')).toBeInTheDocument();
      expect(screen.getByTestId('option-2')).toBeInTheDocument();
      expect(screen.queryByTestId('option-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('option-4')).toBeInTheDocument();
    });
  });

  describe('Trade Selection', () => {
    test('handles trade selection (checking)', () => {
      const props = {
        ...defaultProps,
        entities: [], // No pre-existing entities
      };
      render(<Add {...props} />);
      
      const checkbox2 = screen.getByTestId('checkbox-2');
      fireEvent.click(checkbox2);
      
      // This would trigger updateValues callback
      expect(checkbox2).toBeChecked();
    });

    test('handles trade deselection (unchecking)', () => {
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      // Should open confirmation modal
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    test('opens modal when unchecking a trade', () => {
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('are-you-sure')).toBeInTheDocument();
      expect(screen.getByText('entities-modal-text')).toBeInTheDocument();
    });

    test('cancels modal action', () => {
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      const cancelButton = screen.getByTestId('modal-cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('confirms modal action and makes API call', async () => {
      mockHttpHelper.mockResolvedValueOnce({ data: { success: true } });
      
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      const confirmButton = screen.getByTestId('modal-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockHttpHelper).toHaveBeenCalledWith({
          url: 'boq/entity/1',
          method: 'POST',
        });
      });
      
      await waitFor(() => {
        expect(defaultProps.reset).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(defaultProps.navigateAfterAdding).toHaveBeenCalledWith(1);
      });
    });

    test('handles API call failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockHttpHelper.mockRejectedValueOnce(new Error('API Error'));
      
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      const confirmButton = screen.getByTestId('modal-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockHttpHelper).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    test('shows loading state during API call', async () => {
      // Mock a delayed promise
      mockHttpHelper.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );
      
      render(<Add {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      
      const confirmButton = screen.getByTestId('modal-confirm');
      fireEvent.click(confirmButton);
      
      // During loading, select dialog should not be rendered
      await waitFor(() => {
        expect(screen.queryByTestId('select-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Entity Management', () => {
    test('sets current trades based on existing entities', () => {
      const entities = [
        { id: 1, tender_id: 1 },
        { id: 2, tender_id: 2 },
      ];
      const props = { ...defaultProps, entities };
      
      render(<Add {...props} />);
      
      expect(screen.getByTestId('checkbox-1')).toBeChecked();
      expect(screen.getByTestId('checkbox-2')).toBeChecked();
    });

    test('handles entities with non-matching tender IDs', () => {
      const entities = [
        { id: 1, tender_id: 999 }, // Non-existent tender ID
      ];
      const props = { ...defaultProps, entities };
      
      render(<Add {...props} />);
      
      // No checkboxes should be pre-checked
      expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
      expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
    });

    test('handles empty entities array', () => {
      const props = { ...defaultProps, entities: [] };
      
      render(<Add {...props} />);
      
      expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
      expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
    });
  });

  describe('Prop Variations', () => {
    test('handles missing optional props', () => {
      const minimalProps = {
        data: {
          tender: [{ id: 1, label: 'Test Tender', state: 1 }],
        },
      };
      
      render(<Add {...minimalProps} />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('calls default functions when props are not provided', () => {
      const props = {
        data: {
          tender: [{ id: 1, label: 'Test Tender', state: 1 }],
        },
        entities: [],
      };
      
      render(<Add {...props} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox1);
      
      const confirmButton = screen.getByTestId('modal-confirm');
      expect(confirmButton).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles malformed tender data', () => {
      const props = {
        ...defaultProps,
        data: {
          tender: [
            { id: 1, label: null, state: 1 },
            { id: 2, state: 1 }, // Missing label
            { id: 3, label: undefined, state: 0 }, // Missing label and inactive
          ],
        },
      };
      
      render(<Add {...props} />);
      expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
    });

    test('handles concurrent operations', async () => {
      mockHttpHelper.mockResolvedValue({ data: { success: true } });
      
      render(<Add {...defaultProps} />);
      
      // Quickly perform multiple operations
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);
      fireEvent.click(screen.getByTestId('modal-confirm'));
      
      fireEvent.click(checkbox1);
      fireEvent.click(screen.getByTestId('modal-confirm'));
      
      await waitFor(() => {
        expect(mockHttpHelper).toHaveBeenCalled();
      });
    });
  });
});
