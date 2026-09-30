import React from 'react';
import { render } from '@testing-library/react';
import StyledFiltersContainer from './Filters.styled';

// Mock styled-components theme provider if needed
const MockTheme = ({ children }) => children;

describe('StyledFiltersContainer', () => {
  it('renders without crashing', () => {
    render(
      <MockTheme>
        <StyledFiltersContainer data-testid="styled-filters-container">
          <div>Test content</div>
        </StyledFiltersContainer>
      </MockTheme>
    );
  });

  it('applies correct base styles', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFiltersContainer data-testid="styled-filters-container">
          <div>Test content</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    const container = getByTestId('styled-filters-container');
    
    // Test that the component exists and can be queried
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle('display: inline-flex');
    expect(container).toHaveStyle('align-items: center');
    expect(container).toHaveStyle('border-radius: 5px');
    expect(container).toHaveStyle('background-color: white');
    expect(container).toHaveStyle('padding: 6px 6px 6px 22px');
    expect(container).toHaveStyle('font-size: 13px');
    expect(container).toHaveStyle('gap: 5px');
  });

  it('renders children correctly', () => {
    const testContent = 'Test filters content';
    const { getByText } = render(
      <MockTheme>
        <StyledFiltersContainer>
          <div>{testContent}</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('can contain filter labels', () => {
    const { getByText } = render(
      <MockTheme>
        <StyledFiltersContainer>
          <div className="label-filters">Filters:</div>
          <div>Filter content</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    const label = getByText('Filters:');
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('label-filters');
  });

  it('has the correct structure for responsive design', () => {
    const { container } = render(
      <MockTheme>
        <StyledFiltersContainer>
          <div className="label-filters">Filters:</div>
          <div>Some filter</div>
          <div>Another filter</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    // Test that the container can hold multiple children
    const styledContainer = container.firstChild;
    expect(styledContainer.children).toHaveLength(3);
  });

  it('applies prosper box shadow border', () => {
    const { getByTestId } = render(
      <MockTheme>
        <StyledFiltersContainer data-testid="styled-filters-container">
          <div>Test content</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    const container = getByTestId('styled-filters-container');
    // Note: The actual border color comes from CONSTANTS.colors.prosper.prosperBoxShadow
    // which is mocked in our jest setup
    expect(container).toHaveStyle('border: 1px solid');
  });

  it('creates a snapshot', () => {
    const { container } = render(
      <MockTheme>
        <StyledFiltersContainer>
          <div className="label-filters">Filters:</div>
          <div>Filter 1</div>
          <div>Filter 2</div>
        </StyledFiltersContainer>
      </MockTheme>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});