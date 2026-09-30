import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LinkList from './LinkList';

// Mock MUI components
jest.mock('@mui/material/List', () => {
  return function MockList({ children }) {
    return <ul data-testid="mui-list">{children}</ul>;
  };
});

jest.mock('@mui/material/ListItem', () => {
  return function MockListItem({ children, sx, ...props }) {
    return <li data-testid="mui-list-item" {...props}>{children}</li>;
  };
});

jest.mock('@mui/material/Link', () => {
  return function MockLink({ children, onClick, sx, ...props }) {
    return (
      <a data-testid="mui-link" onClick={onClick} {...props}>
        {children}
      </a>
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#6b21d4',
      },
    },
  },
}));

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: mockScrollIntoView,
  writable: true,
});

// Mock console.error
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('LinkList', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('renders without crashing', () => {
    render(<LinkList />);
    expect(screen.getByTestId('mui-list')).toBeInTheDocument();
  });

  it('renders empty list when no entries provided', () => {
    render(<LinkList />);
    
    expect(screen.getByTestId('mui-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mui-list-item')).not.toBeInTheDocument();
  });

  it('renders empty list when entries is empty array', () => {
    render(<LinkList entries={[]} />);
    
    expect(screen.getByTestId('mui-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mui-list-item')).not.toBeInTheDocument();
  });

  it('renders list items for valid entries', () => {
    const entries = [
      { tender: { id: '1', label: 'First Tender' } },
      { tender: { id: '2', label: 'Second Tender' } },
    ];
    
    render(<LinkList entries={entries} />);
    
    expect(screen.getAllByTestId('mui-list-item')).toHaveLength(2);
    expect(screen.getByText('First Tender')).toBeInTheDocument();
    expect(screen.getByText('Second Tender')).toBeInTheDocument();
  });

  it('handles click on link and scrolls to element', () => {
    // Mock document.getElementById
    const mockElement = { scrollIntoView: mockScrollIntoView };
    const getElementByIdSpy = jest.spyOn(document, 'getElementById')
      .mockReturnValue(mockElement);

    const entries = [
      { tender: { id: '1', label: 'Test Tender' } },
    ];
    
    render(<LinkList entries={entries} />);
    
    const link = screen.getByText('Test Tender');
    fireEvent.click(link);
    
    expect(getElementByIdSpy).toHaveBeenCalledWith('test-tender');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    
    getElementByIdSpy.mockRestore();
  });

  it('handles link labels with spaces correctly', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    const getElementByIdSpy = jest.spyOn(document, 'getElementById')
      .mockReturnValue(mockElement);

    const entries = [
      { tender: { id: '1', label: 'Test Tender With Spaces' } },
    ];
    
    render(<LinkList entries={entries} />);
    
    const link = screen.getByText('Test Tender With Spaces');
    fireEvent.click(link);
    
    expect(getElementByIdSpy).toHaveBeenCalledWith('test-tender-with-spaces');
    
    getElementByIdSpy.mockRestore();
  });

  it('handles entries with missing tender label', () => {
    const entries = [
      { tender: { id: '1', label: '' } },
      { tender: { id: '2' } }, // no label
    ];
    
    render(<LinkList entries={entries} />);
    
    const listItems = screen.getAllByTestId('mui-list-item');
    expect(listItems).toHaveLength(2);
  });

  it('matches snapshot', () => {
    const entries = [
      { tender: { id: '1', label: 'First Tender' } },
      { tender: { id: '2', label: 'Second Tender' } },
    ];
    
    const { container } = render(<LinkList entries={entries} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});