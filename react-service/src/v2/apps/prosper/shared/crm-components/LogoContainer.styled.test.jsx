import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogoContainer } from './LogoContainer.styled';

describe('LogoContainer.styled', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <LogoContainer>
        <img src="test-image.jpg" alt="test" />
      </LogoContainer>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const { getByAltText } = render(
      <LogoContainer>
        <img src="test-image.jpg" alt="test image" />
      </LogoContainer>
    );
    
    expect(getByAltText('test image')).toBeInTheDocument();
  });

  it('applies correct CSS display property', () => {
    const { container } = render(
      <LogoContainer>
        <div>Test content</div>
      </LogoContainer>
    );
    
    const logoContainer = container.firstChild;
    expect(logoContainer).toHaveStyle('display: flex');
  });

  it('renders multiple children', () => {
    const { getByText, getByAltText } = render(
      <LogoContainer>
        <img src="test-image.jpg" alt="test image" />
        <div>Additional content</div>
      </LogoContainer>
    );
    
    expect(getByAltText('test image')).toBeInTheDocument();
    expect(getByText('Additional content')).toBeInTheDocument();
  });

  it('renders with empty children', () => {
    const { container } = render(
      <LogoContainer />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});