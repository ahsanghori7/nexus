import React from 'react';
import { render } from '@testing-library/react';
import { StyledOfferingColumns } from './styled';

describe('Offering Styled Components', () => {
  it('should render StyledOfferingColumns without crashing', () => {
    const { container } = render(
      <StyledOfferingColumns>
        <div>Test content</div>
      </StyledOfferingColumns>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should accept children props', () => {
    const { getByText } = render(
      <StyledOfferingColumns>
        <div>Test children content</div>
      </StyledOfferingColumns>
    );
    
    expect(getByText('Test children content')).toBeInTheDocument();
  });

  it('should accept className prop', () => {
    const { container } = render(
      <StyledOfferingColumns className="test-class">
        <div>Test content</div>
      </StyledOfferingColumns>
    );
    
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('should render as a div element', () => {
    const { container } = render(
      <StyledOfferingColumns>
        <div>Test content</div>
      </StyledOfferingColumns>
    );
    
    expect(container.firstChild.tagName).toBe('DIV');
  });
});