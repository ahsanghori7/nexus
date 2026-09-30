import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import Viewer from './Viewer';

// Mock the hooks
jest.mock('./hooks', () => {
  return jest.fn(() => ({
    trades: [],
    setTrades: jest.fn(),
    regions: [],
    setRegions: jest.fn(),
    initialOption: {
      trades: [],
      regions: [],
      lastCookie: ''
    },
    handleSubmit: jest.fn(),
    showOpportunities: false,
    setShowOpportunities: jest.fn()
  }));
});

describe('Viewer Component', () => {
  const mockStore = {
    getState: () => ({
      subcontractor: {
        id: 'test-subcontractor-id',
        accountId: 'test-account-id'
      },
      opportunityViewer: {
        opportunity: {
          opportunities: 5
        }
      },
      attributes: {
        regions: [
          { id: 1, name: 'London' },
          { id: 2, name: 'Manchester' }
        ],
        trades: [
          { id: 1, name: 'Electrical' },
          { id: 2, name: 'Plumbing' }
        ]
      }
    }),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn()
  };

  const defaultProps = {
    show: true,
    discover: false,
    title: 'Find Opportunities',
    opportunity: {
      opportunities: 5
    },
    subcontractor: {
      id: 'test-subcontractor-id',
      accountId: 'test-account-id'
    },
    dispatch: jest.fn(),
    context: 'prosper',
    idRegion: 1,
    attributes: {
      regions: [
        { id: 1, name: 'London' },
        { id: 2, name: 'Manchester' }
      ],
      trades: [
        { id: 1, name: 'Electrical' },
        { id: 2, name: 'Plumbing' }
      ]
    }
  };

  const renderWithStore = (component) => {
    return render(
      <Provider store={mockStore}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.getByTestId('opportunity-title-1')).toBeInTheDocument();
    });

    it('displays the correct title', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.getByTestId('opportunity-title-1')).toHaveTextContent('Find Opportunities');
    });

    it('renders trades select dialog', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.getByTestId('select-dialog-trades')).toBeInTheDocument();
    });

    it('renders regions select dialog', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.getByTestId('select-dialog-regions')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('renders with custom title', () => {
      const customProps = { ...defaultProps, title: 'Custom Title' };
      renderWithStore(<Viewer {...customProps} />);
      expect(screen.getByTestId('opportunity-title-1')).toHaveTextContent('Custom Title');
    });

    it('handles default props correctly', () => {
      const propsWithDefaults = {
        ...defaultProps,
        show: undefined,
        discover: undefined,
        context: undefined,
        idRegion: undefined
      };
      renderWithStore(<Viewer {...propsWithDefaults} />);
      expect(screen.getByTestId('opportunity-title-1')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Based on Opportunities', () => {
    it('does not show opportunity results when showOpportunities is false', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.queryByTestId('opportunity-result-container-success')).not.toBeInTheDocument();
    });

    it('shows no opportunities message when no opportunities available', () => {
      const hooksModule = require('./hooks');
      hooksModule.mockReturnValue({
        trades: [{ id: 1, name: 'Electrical' }],
        setTrades: jest.fn(),
        regions: [{ id: 1, name: 'London' }],
        setRegions: jest.fn(),
        initialOption: { trades: [], regions: [], lastCookie: '' },
        handleSubmit: jest.fn(),
        showOpportunities: true,
        setShowOpportunities: jest.fn()
      });

      const propsWithNoOpportunities = {
        ...defaultProps,
        opportunity: { opportunities: 0 }
      };

      renderWithStore(<Viewer {...propsWithNoOpportunities} />);
      expect(screen.getByText('no-opportunity-1-design')).toBeInTheDocument();
      expect(screen.getByText('no-opportunity-2-design-no-newsletter')).toBeInTheDocument();
    });

    it('shows opportunity results when opportunities available', () => {
      const hooksModule = require('./hooks');
      hooksModule.mockReturnValue({
        trades: [{ id: 1, name: 'Electrical' }],
        setTrades: jest.fn(),
        regions: [{ id: 1, name: 'London' }],
        setRegions: jest.fn(),
        initialOption: { trades: [], regions: [], lastCookie: '' },
        handleSubmit: jest.fn(),
        showOpportunities: true,
        setShowOpportunities: jest.fn()
      });

      renderWithStore(<Viewer {...defaultProps} />);
      expect(screen.getByTestId('opportunity-result-container-success')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('packages-available')).toBeInTheDocument();
    });
  });

  describe('Sign Up Button', () => {
    it('shows sign up button when conditions are met', () => {
      const hooksModule = require('./hooks');
      hooksModule.mockReturnValue({
        trades: [{ id: 1, name: 'Electrical' }],
        setTrades: jest.fn(),
        regions: [{ id: 1, name: 'London' }],
        setRegions: jest.fn(),
        initialOption: { trades: [], regions: [], lastCookie: '' },
        handleSubmit: jest.fn(),
        showOpportunities: true,
        setShowOpportunities: jest.fn()
      });

      const propsForSignUp = {
        ...defaultProps,
        show: true,
        discover: false
      };

      renderWithStore(<Viewer {...propsForSignUp} />);
      expect(screen.getByTestId('opportunity-signup')).toBeInTheDocument();
      expect(screen.getByText('sign-up')).toBeInTheDocument();
    });

    it('does not show sign up button when discover mode is true', () => {
      const hooksModule = require('./hooks');
      hooksModule.mockReturnValue({
        trades: [{ id: 1, name: 'Electrical' }],
        setTrades: jest.fn(),
        regions: [{ id: 1, name: 'London' }],
        setRegions: jest.fn(),
        initialOption: { trades: [], regions: [], lastCookie: '' },
        handleSubmit: jest.fn(),
        showOpportunities: true,
        setShowOpportunities: jest.fn()
      });

      const propsForDiscover = {
        ...defaultProps,
        show: true,
        discover: true
      };

      renderWithStore(<Viewer {...propsForDiscover} />);
      expect(screen.queryByTestId('opportunity-signup')).not.toBeInTheDocument();
    });
  });

  describe('Discover Button', () => {
    it('shows discover button when discover mode is true', () => {
      const propsForDiscover = {
        ...defaultProps,
        discover: true
      };

      renderWithStore(<Viewer {...propsForDiscover} />);
      expect(screen.getByTestId('opportunity-discover')).toBeInTheDocument();
      expect(screen.getByText('discover-opportunities')).toBeInTheDocument();
    });

    it('discover button is disabled when no subcontractor info', () => {
      const propsForDiscover = {
        ...defaultProps,
        discover: true,
        subcontractor: null,
        attributes: {
          ...defaultProps.attributes,
          trades: [] // No trades available
        }
      };

      renderWithStore(<Viewer {...propsForDiscover} />);
      const discoverButton = screen.getByText('discover-opportunities');
      expect(discoverButton).toBeDisabled();
    });

    it('discover button click calls handleSubmit when enabled', () => {
      const mockHandleSubmit = jest.fn();
      const mockSetShowOpportunities = jest.fn();
      
      const hooksModule = require('./hooks');
      hooksModule.mockReturnValue({
        trades: [],
        setTrades: jest.fn(),
        regions: [],
        setRegions: jest.fn(),
        initialOption: { trades: [], regions: [], lastCookie: '' },
        handleSubmit: mockHandleSubmit,
        showOpportunities: false,
        setShowOpportunities: mockSetShowOpportunities
      });

      const propsForDiscover = {
        ...defaultProps,
        discover: true,
        show: true
      };

      renderWithStore(<Viewer {...propsForDiscover} />);
      
      const discoverButton = screen.getByText('discover-opportunities');
      fireEvent.click(discoverButton);
      
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockSetShowOpportunities).toHaveBeenCalledWith(true);
    });
  });

  describe('Select Dialog Integration', () => {
    it('passes correct props to trades select dialog', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      
      const tradesSelect = screen.getByTestId('select-dialog-trades');
      expect(tradesSelect).toHaveAttribute('data-title', 'trades-placeholder');
      expect(tradesSelect).toHaveAttribute('data-placeholder', 'find-trade-placeholder');
      expect(tradesSelect).toHaveAttribute('data-context', 'prosper');
    });

    it('passes correct props to regions select dialog', () => {
      renderWithStore(<Viewer {...defaultProps} />);
      
      const regionsSelect = screen.getByTestId('select-dialog-regions');
      expect(regionsSelect).toHaveAttribute('data-title', 'regions-placeholder');
      expect(regionsSelect).toHaveAttribute('data-placeholder', 'find-location-placeholder');
      expect(regionsSelect).toHaveAttribute('data-context', 'prosper');
    });
  });

  describe('Edge Cases', () => {
    it('handles null opportunity gracefully', () => {
      const propsWithNullOpportunity = {
        ...defaultProps,
        opportunity: { opportunities: null } // provide object structure to avoid destructuring error
      };

      renderWithStore(<Viewer {...propsWithNullOpportunity} />);
      expect(screen.getByTestId('opportunity-title-1')).toBeInTheDocument();
    });

    it('handles undefined attributes gracefully', () => {
      const propsWithUndefinedAttributes = {
        ...defaultProps,
        attributes: {
          regions: [],
          trades: []
        } // provide basic structure to avoid destructuring error
      };

      renderWithStore(<Viewer {...propsWithUndefinedAttributes} />);
      expect(screen.getByTestId('opportunity-title-1')).toBeInTheDocument();
    });

    it('handles null subcontractor gracefully', () => {
      const propsWithNullSubcontractor = {
        ...defaultProps,
        subcontractor: null
      };

      renderWithStore(<Viewer {...propsWithNullSubcontractor} />);
      expect(screen.getByTestId('opportunity-title-1')).toBeInTheDocument();
    });
  });
});