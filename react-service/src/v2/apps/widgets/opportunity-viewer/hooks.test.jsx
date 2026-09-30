import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import '@testing-library/jest-dom';
import Hooks from './hooks';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie');

describe('Hooks', () => {
  const mockDispatch = jest.fn();
  const mockActions = {
    fetchAttrRegions: jest.fn(() => ({ type: 'FETCH_ATTR_REGIONS' })),
    fetchPublicTrades: jest.fn(() => ({ type: 'FETCH_PUBLIC_TRADES' })),
    fetchSubcontractorInfo: jest.fn(() => ({ type: 'FETCH_SUBCONTRACTOR_INFO' })),
    fetchOpportunity: jest.fn(() => ({ type: 'FETCH_OPPORTUNITY' })),
    updateOfferingsTrades: jest.fn(() => ({ type: 'UPDATE_OFFERINGS_TRADES' })),
    updateOfferingsRegions: jest.fn(() => ({ type: 'UPDATE_OFFERINGS_REGIONS' }))
  };

  const defaultProps = {
    show: true,
    discover: false,
    subcontractor: {
      id: 'test-subcontractor-id',
      accountId: 'test-account-id'
    },
    attributes: {
      regions: [
        { id: 1, name: 'London' },
        { id: 2, name: 'Manchester' }
      ],
      loading1: false,
      loading2: false
    },
    dispatch: mockDispatch
  };

  // Mock useContext
  const mockUseContext = require('hooks/context').useContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContext.mockReturnValue({
      actions: mockActions
    });
    // Reset cookie value to default
    Cookies.get.mockReturnValue(undefined);
  });

  describe('initialization', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      expect(result.current.showOpportunities).toBe(true); // show && !discover
      expect(result.current.trades).toEqual([]);
      expect(result.current.regions).toEqual([]);
      expect(result.current.initialOption).toEqual({
        trades: [],
        regions: [],
        lastCookie: ''
      });
    });

    it('initializes showOpportunities correctly when discover is true', () => {
      const props = { ...defaultProps, discover: true };
      const { result } = renderHook(() => Hooks(props));

      expect(result.current.showOpportunities).toBe(false); // show && !discover = true && !true = false
    });

    it('initializes showOpportunities correctly when show is false', () => {
      const props = { ...defaultProps, show: false };
      const { result } = renderHook(() => Hooks(props));

      expect(result.current.showOpportunities).toBe(false); // show && !discover = false && !false = false
    });
  });

  describe('dispatching actions', () => {
    it('fetches attributes when not loading and no regions available', () => {
      const props = {
        ...defaultProps,
        attributes: {
          regions: [], // empty regions
          loading1: false,
          loading2: false
        }
      };

      renderHook(() => Hooks(props));

      expect(mockDispatch).toHaveBeenCalledWith(mockActions.fetchAttrRegions());
      expect(mockDispatch).toHaveBeenCalledWith(mockActions.fetchPublicTrades());
    });

    it('does not fetch attributes when loading1 is true', () => {
      const props = {
        ...defaultProps,
        attributes: {
          regions: [],
          loading1: true, // loading
          loading2: false
        }
      };

      renderHook(() => Hooks(props));

      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchAttrRegions());
      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchPublicTrades());
    });

    it('does not fetch attributes when loading2 is true', () => {
      const props = {
        ...defaultProps,
        attributes: {
          regions: [],
          loading1: false,
          loading2: true // loading
        }
      };

      renderHook(() => Hooks(props));

      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchAttrRegions());
      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchPublicTrades());
    });

    it('does not fetch attributes when regions are already available', () => {
      const props = {
        ...defaultProps,
        attributes: {
          regions: [{ id: 1, name: 'London' }], // has regions
          loading1: false,
          loading2: false
        }
      };

      renderHook(() => Hooks(props));

      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchAttrRegions());
      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchPublicTrades());
    });

    it('fetches subcontractor info when discover is true', () => {
      const props = { ...defaultProps, discover: true };

      renderHook(() => Hooks(props));

      expect(mockDispatch).toHaveBeenCalledWith(mockActions.fetchSubcontractorInfo());
    });

    it('does not fetch subcontractor info when discover is false', () => {
      renderHook(() => Hooks(defaultProps));

      expect(mockDispatch).not.toHaveBeenCalledWith(mockActions.fetchSubcontractorInfo());
    });
  });

  describe('state setters', () => {
    it('provides setTrades function that updates trades state', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      const newTrades = [{ id: 1, name: 'Electrical' }];

      act(() => {
        result.current.setTrades(newTrades);
      });

      expect(result.current.trades).toEqual(newTrades);
    });

    it('provides setRegions function that updates regions state', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      const newRegions = [{ id: 1, name: 'London' }];

      act(() => {
        result.current.setRegions(newRegions);
      });

      expect(result.current.regions).toEqual(newRegions);
    });

    it('provides setShowOpportunities function that updates showOpportunities state', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      act(() => {
        result.current.setShowOpportunities(false);
      });

      expect(result.current.showOpportunities).toBe(false);
    });
  });

  describe('handleSubmit function', () => {
    it('updates trades and regions when both are available', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      const trades = [{ id: 1, name: 'Electrical' }, { id: 2, name: 'Plumbing' }];
      const regions = [{ id: 1, name: 'London' }];

      act(() => {
        result.current.setTrades(trades);
        result.current.setRegions(regions);
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsTrades({
          aid: defaultProps.subcontractor.accountId,
          trades: [1, 2]
        })
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsRegions({
          aid: defaultProps.subcontractor.accountId,
          regions: [1]
        })
      );
    });

    it('only updates trades when regions are not available', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      const trades = [{ id: 1, name: 'Electrical' }];

      act(() => {
        result.current.setTrades(trades);
        // Don't set regions, leave them as empty array
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsTrades({
          aid: defaultProps.subcontractor.accountId,
          trades: [1]
        })
      );

      // Since regions is an empty array (truthy), it will still dispatch with empty array
      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsRegions({
          aid: defaultProps.subcontractor.accountId,
          regions: []
        })
      );
    });

    it('only updates regions when trades are not available', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      const regions = [{ id: 1, name: 'London' }];

      act(() => {
        result.current.setRegions(regions);
        // Don't set trades, leave them as empty array
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsRegions({
          aid: defaultProps.subcontractor.accountId,
          regions: [1]
        })
      );

      // Since trades is an empty array (truthy), it will still dispatch with empty array
      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateOfferingsTrades({
          aid: defaultProps.subcontractor.accountId,
          trades: []
        })
      );
    });
  });

  describe('cookie handling', () => {
    it('updates initialOption with cookie value when available', () => {
      const cookieValue = 'test-cookie-data';
      Cookies.get.mockReturnValue(cookieValue);

      const { result } = renderHook(() => Hooks(defaultProps));

      const trades = [{ id: 1, name: 'Electrical' }];
      const regions = [{ id: 1, name: 'London' }];

      act(() => {
        result.current.setTrades(trades);
        result.current.setRegions(regions);
      });

      // Wait for useEffect to run
      expect(result.current.initialOption).toEqual({
        trades: trades,
        regions: regions,
        lastCookie: cookieValue
      });
    });

    it('handles empty cookie value', () => {
      Cookies.get.mockReturnValue(undefined);

      const { result } = renderHook(() => Hooks(defaultProps));

      expect(result.current.initialOption.lastCookie).toBe('');
    });
  });

  describe('return object', () => {
    it('returns all expected properties and functions', () => {
      const { result } = renderHook(() => Hooks(defaultProps));

      expect(result.current).toHaveProperty('trades');
      expect(result.current).toHaveProperty('setTrades');
      expect(result.current).toHaveProperty('regions');
      expect(result.current).toHaveProperty('setRegions');
      expect(result.current).toHaveProperty('initialOption');
      expect(result.current).toHaveProperty('setInitialOption');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('showOpportunities');
      expect(result.current).toHaveProperty('setShowOpportunities');

      expect(typeof result.current.setTrades).toBe('function');
      expect(typeof result.current.setRegions).toBe('function');
      expect(typeof result.current.setInitialOption).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.setShowOpportunities).toBe('function');
    });
  });
});