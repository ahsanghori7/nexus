import React from 'react';
import { render } from '@testing-library/react';
import { 
  StyledLogoWrapper,
  StyledLogoColumnPrimary,
  StyledLogoColumnSecondary 
} from './styled';

describe('User Description Styled Components', () => {
  describe('StyledLogoWrapper', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledLogoWrapper>
          <div>Test content</div>
        </StyledLogoWrapper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledLogoWrapper>
          <div>Test children content</div>
        </StyledLogoWrapper>
      );
      
      expect(getByText('Test children content')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <StyledLogoWrapper className="test-class">
          <div>Test content</div>
        </StyledLogoWrapper>
      );
      
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('StyledLogoColumnPrimary', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledLogoColumnPrimary>
          <div>Test content</div>
        </StyledLogoColumnPrimary>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledLogoColumnPrimary>
          <div>Primary column content</div>
        </StyledLogoColumnPrimary>
      );
      
      expect(getByText('Primary column content')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <StyledLogoColumnPrimary className="primary-class">
          <div>Test content</div>
        </StyledLogoColumnPrimary>
      );
      
      expect(container.firstChild).toHaveClass('primary-class');
    });
  });

  describe('StyledLogoColumnSecondary', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledLogoColumnSecondary>
          <div>Test content</div>
        </StyledLogoColumnSecondary>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledLogoColumnSecondary>
          <div>Secondary column content</div>
        </StyledLogoColumnSecondary>
      );
      
      expect(getByText('Secondary column content')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <StyledLogoColumnSecondary className="secondary-class">
          <div>Test content</div>
        </StyledLogoColumnSecondary>
      );
      
      expect(container.firstChild).toHaveClass('secondary-class');
    });

    it('should render as a div element', () => {
      const { container } = render(
        <StyledLogoColumnSecondary>
          <div>Test content</div>
        </StyledLogoColumnSecondary>
      );
      
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });
});