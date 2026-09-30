import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ItemData from './ItemData';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, state, ...props }) => {
      const href =
        typeof to === 'string'
          ? to
          : `${to?.pathname || ''}${to?.search || ''}`;
      return (
        <a
          href={href}
          data-testid="mock-link"
          data-to={JSON.stringify(to)}
          data-state={JSON.stringify(state)}
          {...props}
        >
          {children}
        </a>
      );
    },
  };
});

// Mock MUI components
jest.mock('@mui/material/ListItem', () => {
  return function MockListItem({ children, sx }) {
    return (
      <li data-testid="list-item" style={sx}>
        {children}
      </li>
    );
  };
});

jest.mock('@mui/material/ListItemIcon', () => {
  return function MockListItemIcon({ children, sx }) {
    return (
      <div data-testid="list-item-icon" style={sx}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/ListItemText', () => {
  return function MockListItemText({ primary, secondary, sx, primaryTypographyProps, secondaryTypographyProps }) {
    return (
      <div data-testid="list-item-text" style={sx}>
        {secondary !== undefined && (
          <span
            data-testid="secondary-text"
            style={secondaryTypographyProps}
          >
            {secondary}
          </span>
        )}
        {primary !== undefined && (
          <span
            data-testid="primary-text"
            style={primaryTypographyProps}
          >
            {primary}
          </span>
        )}
      </div>
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        japaneseIndigo: '#293e4a',
      },
    },
  },
}));

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ItemData Component', () => {
  const defaultProps = {
    icon: <span data-testid="test-icon">📄</span>,
    label: 'Test Label',
    value: 'Test Value',
    link: null,
    extraLink: null,
  };

  test('renders without crashing with all props', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    const listItem = screen.getByTestId('list-item');
    const icon = screen.getByTestId('test-icon');
    const label = screen.getByText('Test Label');
    const value = screen.getByText('Test Value');
    
    expect(listItem).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();
  });

  test('renders without icon when icon is not provided', () => {
    renderWithRouter(<ItemData {...defaultProps} icon={null} />);
    
    const icon = screen.queryByTestId('list-item-icon');
    const label = screen.getByText('Test Label');
    const value = screen.getByText('Test Value');
    
    expect(icon).not.toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();
  });

  test('renders with default props when optional props are not provided', () => {
    renderWithRouter(<ItemData />);
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeInTheDocument();
    
    // Component should render but with empty values
    const listItemTexts = screen.getAllByTestId('list-item-text');
    expect(listItemTexts).toHaveLength(2);
  });

  test('renders without link wrapper when no link is provided', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    // Should not have any link elements
    const link = screen.queryByRole('link');
    expect(link).not.toBeInTheDocument();
    
    const value = screen.getByText('Test Value');
    expect(value).toBeInTheDocument();
  });

  test('renders with link wrapper when link is provided', () => {
    const linkPath = '/test-path';
    renderWithRouter(<ItemData {...defaultProps} link={linkPath} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', linkPath);
    
    const value = screen.getByText('Test Value');
    expect(value).toBeInTheDocument();
  });

  test('renders with extraLink when both link and extraLink are provided', () => {
    const linkPath = '/test-path';
    const extraLink = { state: { data: 'test' } };
    
    renderWithRouter(
      <ItemData
        {...defaultProps}
        link={linkPath}
        extraLink={extraLink}
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', linkPath);
  });

  test('splits query from pathname for object links', () => {
    const linkObject = {
      pathname: '/company_profile/1/2?pid=3',
      state: { from: 'link' },
    };
    const extraLink = { state: { from: 'extra' } };

    renderWithRouter(
      <ItemData
        {...defaultProps}
        link={linkObject}
        extraLink={extraLink}
      />
    );

    const link = screen.getByTestId('mock-link');
    const toValue = JSON.parse(link.getAttribute('data-to'));
    const stateValue = JSON.parse(link.getAttribute('data-state'));

    expect(link).toHaveAttribute('href', '/company_profile/1/2?pid=3');
    expect(toValue).toEqual({
      pathname: '/company_profile/1/2',
      search: '?pid=3',
    });
    expect(stateValue).toEqual({ from: 'extra' });
  });

  test('applies correct styles to ListItem', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toHaveStyle({ padding: '0' });
  });

  test('applies correct styles to ListItemIcon when icon is present', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    const iconContainer = screen.getByTestId('list-item-icon');
    expect(iconContainer).toHaveStyle({ minWidth: '40px' });
  });

  test('applies correct styles to secondary text (label)', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    const secondaryText = screen.getByText('Test Label');
    expect(secondaryText).toHaveStyle({
      fontSize: '14px',
      color: '#293e4a',
    });
  });

  test('applies correct styles to primary text (value)', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    const primaryText = screen.getByText('Test Value');
    expect(primaryText).toHaveStyle({
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#293e4a',
    });
  });

  test('renders with custom label and value', () => {
    const customLabel = 'Custom Label';
    const customValue = 'Custom Value';
    
    renderWithRouter(
      <ItemData
        {...defaultProps}
        label={customLabel}
        value={customValue}
      />
    );
    
    const label = screen.getByText(customLabel);
    const value = screen.getByText(customValue);
    
    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();
  });

  test('renders with empty strings for label and value', () => {
    renderWithRouter(
      <ItemData
        {...defaultProps}
        label=""
        value=""
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeInTheDocument();
    
    // Should have the label and value elements but with empty content
    const listItemTexts = screen.getAllByTestId('list-item-text');
    expect(listItemTexts).toHaveLength(2);
  });

  test('value container has correct text alignment style', () => {
    renderWithRouter(<ItemData {...defaultProps} />);
    
    // Find the ListItemText that contains the value (second one, with textAlign style)
    const listItemTexts = screen.getAllByTestId('list-item-text');
    const valueContainer = listItemTexts.find(element => 
      element.style.textAlign === 'end'
    );
    
    expect(valueContainer).toBeInTheDocument();
    expect(valueContainer).toHaveStyle({ textAlign: 'end' });
  });

  test('renders different icon types', () => {
    const icons = [
      <span key="1" data-testid="icon-1">🏠</span>,
      <div key="2" data-testid="icon-2">📧</div>,
      <button key="3" data-testid="icon-3">🔗</button>,
    ];
    
    icons.forEach((icon, index) => {
      const { unmount } = renderWithRouter(
        <ItemData {...defaultProps} icon={icon} />
      );
      
      const renderedIcon = screen.getByTestId(`icon-${index + 1}`);
      expect(renderedIcon).toBeInTheDocument();
      
      unmount();
    });
  });
});
