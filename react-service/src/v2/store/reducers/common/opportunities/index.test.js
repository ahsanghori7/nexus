import reducer, { saveLatestOnLocal } from './index';

describe('common opportunities reducer', () => {
  const initialState = {
    project: null,
    projects: [],
    latest: [],
    list: [],
    status: '',
    statusProject: '',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: 'unknown' });
    expect(newState).toEqual(initialState);
  });

  describe('saveLatestOnLocal', () => {
    it('should save card item to latest and localStorage when latest is empty', () => {
      const cardItem = { id: 1, name: 'Test Project' };
      const state = { ...initialState, latest: [] };
      
      const newState = reducer(state, saveLatestOnLocal(cardItem));
      
      expect(newState.latest).toEqual([]);
      expect(localStorage.getItem('latest')).toBe(JSON.stringify([1]));
    });

    it('should filter out existing card item from latest array', () => {
      const cardItem = { id: 2, name: 'Test Project 2' };
      const state = {
        ...initialState,
        latest: [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' },
          { id: 3, name: 'Project 3' },
        ],
      };
      
      const newState = reducer(state, saveLatestOnLocal(cardItem));
      
      expect(newState.latest).toEqual([
        { id: 1, name: 'Project 1' },
        { id: 3, name: 'Project 3' },
      ]);
    });

    it('should append card item id to existing localStorage latest', () => {
      localStorage.setItem('latest', JSON.stringify([5, 6, 7]));
      const cardItem = { id: 8, name: 'New Project' };
      const state = { ...initialState, latest: [] };
      
      reducer(state, saveLatestOnLocal(cardItem));
      
      expect(localStorage.getItem('latest')).toBe(JSON.stringify([5, 6, 7, 8]));
    });

    it('should handle empty localStorage and create new array', () => {
      const cardItem = { id: 10, name: 'First Project' };
      const state = { ...initialState, latest: [] };
      
      reducer(state, saveLatestOnLocal(cardItem));
      
      expect(localStorage.getItem('latest')).toBe(JSON.stringify([10]));
    });

    it('should handle latest array with null values', () => {
      const cardItem = { id: 4, name: 'Test Project' };
      const state = { ...initialState, latest: null };
      
      const newState = reducer(state, saveLatestOnLocal(cardItem));
      
      expect(newState.latest).toEqual([]);
      expect(localStorage.getItem('latest')).toBe(JSON.stringify([4]));
    });
  });
});
