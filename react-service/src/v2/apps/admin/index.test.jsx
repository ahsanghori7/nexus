import React from 'react';

// Mock ReactDOM to avoid DOM manipulation in tests
jest.mock('react-dom', () => ({
  render: jest.fn()
}));

// Mock the App component
jest.mock('./App', () => ({
  __esModule: true,
  default: () => <div data-testid="app">App</div>
}));

// Mock the theme
jest.mock('v2/apps/shared/components/muiTheme', () => ({
  __esModule: true,
  default: jest.fn(() => ({}))
}));

// Mock the styles
jest.mock('v2/apps/shared', () => ({}));
jest.mock('v2/apps/admin/assets/styles/index.scss', () => ({}));

// Mock document.getElementById
Object.defineProperty(global.document, 'getElementById', {
  value: jest.fn(() => ({ id: 'app' })),
  writable: true
});

describe('Admin Index', () => {
  let ReactDOM;
  let getMuiTheme;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    ReactDOM = require('react-dom');
    getMuiTheme = require('v2/apps/shared/components/muiTheme').default;
  });

  it('calls ReactDOM.render with ThemeProvider and App', () => {
    require('./index');
    
    expect(ReactDOM.render).toHaveBeenCalledTimes(1);
    expect(getMuiTheme).toHaveBeenCalledWith('pegasus');
    expect(document.getElementById).toHaveBeenCalledWith('app');
  });

  it('sets up theme correctly', () => {
    require('./index');
    
    expect(getMuiTheme).toHaveBeenCalledWith('pegasus');
    expect(ReactDOM.render).toHaveBeenCalledTimes(1);
  });
});