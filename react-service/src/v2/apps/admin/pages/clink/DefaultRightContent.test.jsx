import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DefaultRightContent from './DefaultRightContent';

// Mock the dependencies
jest.mock('clink-components', () => ({
  GhostMode: ({ title, options, onClickOptions, children, ...props }) => (
    <div data-testid="ghost-mode">
      <div data-testid="ghost-mode-title">{title}</div>
      {options && options.map((option) => (
        <button
          key={option.id}
          data-testid={`ghost-mode-option-${option.id}`}
          onClick={() => onClickOptions(option)}
        >
          {option.content}
        </button>
      ))}
    </div>
  ),
  Image: ({ src, ...props }) => (
    <img src={src} data-testid="image" alt="" {...props} />
  ),
  CONSTANTS: {
    s3: {
      blackCarretDown: 'mock-down-icon',
      blackCarretUp: 'mock-up-icon',
      hatLogo: 'mock-hat-logo'
    }
  }
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn()
}));

// Mock global BASE_URLS
global.BASE_URLS = {
  APP_CLINK: 'https://mock-app-clink.com'
};

describe('DefaultRightContent Component', () => {
  const defaultProps = {
    options: [
      { id: 1, content: 'Option 1' },
      { id: 2, content: 'Option 2' }
    ],
    children: <div data-testid="child-content">Child Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DefaultRightContent {...defaultProps} />);
    expect(screen.getByTestId('ghost-mode')).toBeInTheDocument();
  });

  it('renders ghost mode with correct title including hat logo', () => {
    render(<DefaultRightContent {...defaultProps} />);
    
    const ghostModeTitle = screen.getByTestId('ghost-mode-title');
    expect(ghostModeTitle).toBeInTheDocument();
    expect(screen.getByTestId('image')).toHaveAttribute('src', 'mock-hat-logo');
  });

  it('renders options when provided', () => {
    render(<DefaultRightContent {...defaultProps} />);
    
    expect(screen.getByTestId('ghost-mode-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('ghost-mode-option-2')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<DefaultRightContent {...defaultProps} />);
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('handles click on ghost mode options', () => {
    const goToMock = require('v2/helpers/url').goTo;
    render(<DefaultRightContent {...defaultProps} />);
    
    const option1Button = screen.getByTestId('ghost-mode-option-1');
    fireEvent.click(option1Button);
    
    expect(goToMock).toHaveBeenCalledWith(
      'https://mock-app-clink.com/relay?action=account&method=switchGhostMode&redirect_user_id=1'
    );
  });

  it('renders without options', () => {
    const propsWithoutOptions = {
      ...defaultProps,
      options: undefined
    };
    
    render(<DefaultRightContent {...propsWithoutOptions} />);
    
    expect(screen.getByTestId('ghost-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('ghost-mode-option-1')).not.toBeInTheDocument();
  });

  it('renders without children', () => {
    const propsWithoutChildren = {
      ...defaultProps,
      children: undefined
    };
    
    render(<DefaultRightContent {...propsWithoutChildren} />);
    
    expect(screen.getByTestId('ghost-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });
});