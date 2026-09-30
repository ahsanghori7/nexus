import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import LoadMore from './index';

// Mock the styled component
jest.mock('./LoadMore.styled', () => {
  return function MockStyledLoadMore({ children }) {
    return <div data-testid="styled-load-more">{children}</div>;
  };
});

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'load-more') return 'Load More';
    return key;
  })
}));

describe('LoadMore Component', () => {
  const mockOnLoad = jest.fn();

  const defaultProps = {
    data: [1, 2, 3, 4, 5],
    loaded: 3,
    onLoad: mockOnLoad
  };

  beforeEach(() => {
    mockOnLoad.mockClear();
  });

  it('should render without crashing', () => {
    const { container } = render(<LoadMore {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render the Load More button when there is more data to load', () => {
    const { getByRole } = render(<LoadMore {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should not render the Load More button when all data is loaded', () => {
    const props = {
      ...defaultProps,
      loaded: 5 // All items are loaded
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should not render the Load More button when loaded equals data length', () => {
    const props = {
      data: [1, 2, 3],
      loaded: 3,
      onLoad: mockOnLoad
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should not render the Load More button when loaded exceeds data length', () => {
    const props = {
      data: [1, 2, 3],
      loaded: 5,
      onLoad: mockOnLoad
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should not render the Load More button when data is null', () => {
    const props = {
      data: null,
      loaded: 3,
      onLoad: mockOnLoad
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should not render the Load More button when data is undefined', () => {
    const props = {
      data: undefined,
      loaded: 3,
      onLoad: mockOnLoad
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should call onLoad when Load More button is clicked', () => {
    const { getByRole } = render(<LoadMore {...defaultProps} />);
    
    const button = getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnLoad).toHaveBeenCalledTimes(1);
  });

  it('should render with correct button class name', () => {
    const { getByRole } = render(<LoadMore {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button).toHaveClass('load-more-btn');
  });

  it('should render StyledLoadMore wrapper', () => {
    const { getByTestId } = render(<LoadMore {...defaultProps} />);
    
    expect(getByTestId('styled-load-more')).toBeInTheDocument();
  });

  it('should handle empty data array', () => {
    const props = {
      data: [],
      loaded: 0,
      onLoad: mockOnLoad
    };
    
    const { queryByRole } = render(<LoadMore {...props} />);
    
    const button = queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should match snapshot when button is visible', () => {
    const { container } = render(<LoadMore {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot when button is not visible', () => {
    const props = {
      ...defaultProps,
      loaded: 5 // All items loaded
    };
    
    const { container } = render(<LoadMore {...props} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});