import React from 'react';
import { render } from '@testing-library/react';
import StyledFilter from './Filter.styled';

// Mock styled-components theme provider if needed
const MockTheme = ({ children }) => children;

describe('StyledFilter', () => {
  it('renders without crashing', () => {
    render(
      <MockTheme>
        <StyledFilter data-testid="styled-filter">
          <div>Test content</div>
        </StyledFilter>
      </MockTheme>
    );
  });

  it('applies correct base styles', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter data-testid="styled-filter">
          <div>Test content</div>
        </StyledFilter>
      </MockTheme>
    );

    const filter = getByTestId('styled-filter');
    
    // Test that the component exists and can be queried
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveStyle('display: flex');
    expect(filter).toHaveStyle('align-items: center');
    expect(filter).toHaveStyle('justify-content: center');
    expect(filter).toHaveStyle('min-width: 100px');
    expect(filter).toHaveStyle('height: 35px');
    expect(filter).toHaveStyle('padding-left: 20px');
    expect(filter).toHaveStyle('border-radius: 5px');
  });

  it('renders children correctly', () => {
    const testContent = 'Test filter content';
    const { getByText } = render(
      <MockTheme>
        <StyledFilter>
          <div>{testContent}</div>
        </StyledFilter>
      </MockTheme>
    );

    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('applies select-status-table class styles correctly', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter 
          className="select-status-table" 
          data-testid="styled-filter"
        >
          <div>Filter content</div>
        </StyledFilter>
      </MockTheme>
    );

    const filter = getByTestId('styled-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveClass('select-status-table');
    // The styled component should apply width and min-width styles
    expect(filter).toHaveStyle('min-width: 201px');
    expect(filter).toHaveStyle('max-width: 201px');
    expect(filter).toHaveStyle('font-size: 14px');
    expect(filter).toHaveStyle('height: 45px');
    expect(filter).toHaveStyle('font-weight: 500');
    expect(filter).toHaveStyle('justify-content: space-between');
  });

  it('applies filter-field--opened class styles correctly', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter 
          className="select-status-table filter-field--opened" 
          data-testid="styled-filter"
        >
          <div>Filter content</div>
        </StyledFilter>
      </MockTheme>
    );

    const filter = getByTestId('styled-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveClass('select-status-table');
    expect(filter).toHaveClass('filter-field--opened');
  });

  it('can contain dropdown elements', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter className="select-status-table">
          <div className="select-status-table--dropdown">
            <button data-testid="dropdown-button">
              <img src="test.png" alt="dropdown" />
            </button>
          </div>
        </StyledFilter>
      </MockTheme>
    );

    const button = getByTestId('dropdown-button');
    expect(button).toBeInTheDocument();
    
    const img = button.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'test.png');
  });

  it('can contain clink-dropdown-open elements', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter>
          <div className="clink-dropdown-open" data-testid="clink-dropdown">
            Dropdown content
          </div>
        </StyledFilter>
      </MockTheme>
    );

    const dropdown = getByTestId('clink-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass('clink-dropdown-open');
  });

  it('handles complex nested structure', () => {
    const { container } = render(
      <MockTheme>
        <StyledFilter className="select-status-table">
          <div className="select-status-table--dropdown">
            <button>
              Filter Text
              <img src="arrow.png" alt="arrow" />
            </button>
          </div>
          <div className="clink-dropdown-open">
            Additional content
          </div>
        </StyledFilter>
      </MockTheme>
    );

    // Test that the container can hold multiple children with nested elements
    const styledFilter = container.firstChild;
    expect(styledFilter.children).toHaveLength(2);
    
    // Check for button inside dropdown
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('Filter Text');
    
    // Check for img inside button
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'arrow.png');
  });

  it('renders with multiple class combinations', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFilter 
          className="select-status-table filter-field--opened custom-class" 
          data-testid="styled-filter"
        >
          <div>Complex filter</div>
        </StyledFilter>
      </MockTheme>
    );

    const filter = getByTestId('styled-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveClass('select-status-table');
    expect(filter).toHaveClass('filter-field--opened');
    expect(filter).toHaveClass('custom-class');
  });

  it('creates a snapshot for basic usage', () => {
    const { container } = render(
      <MockTheme>
        <StyledFilter>
          <div>Basic filter content</div>
        </StyledFilter>
      </MockTheme>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('creates a snapshot for select-status-table usage', () => {
    const { container } = render(
      <MockTheme>
        <StyledFilter className="select-status-table">
          <div className="select-status-table--dropdown">
            <button>
              Status Filter
              <img src="dropdown.png" alt="dropdown" />
            </button>
          </div>
        </StyledFilter>
      </MockTheme>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});