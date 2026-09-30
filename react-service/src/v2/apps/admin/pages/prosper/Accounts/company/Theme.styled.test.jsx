import React from 'react';
import { render } from '@testing-library/react';
import {
  StyledPegasusContainer,
  StyledProsperContainer,
  StyledFull,
  StyledFullProsper,
  StyledPegasusColumn,
  StyledProsperColumn,
  StyledWithMarginAndLoader,
  StyledWrapper,
  StyledInnerWrapper
} from './Theme.styled';

describe('Theme Styled Components', () => {
  describe('StyledPegasusContainer', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledPegasusContainer>
          <div>Test content</div>
        </StyledPegasusContainer>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledPegasusContainer className="pegasus-class">
          <div>Pegasus content</div>
        </StyledPegasusContainer>
      );
      
      expect(getByText('Pegasus content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('pegasus-class');
    });
  });

  describe('StyledProsperContainer', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledProsperContainer>
          <div>Test content</div>
        </StyledProsperContainer>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledProsperContainer className="prosper-class">
          <div>Prosper content</div>
        </StyledProsperContainer>
      );
      
      expect(getByText('Prosper content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('prosper-class');
    });
  });

  describe('StyledFull', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledFull>
          <div>Test content</div>
        </StyledFull>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledFull>
          <div>Full content</div>
        </StyledFull>
      );
      
      expect(getByText('Full content')).toBeInTheDocument();
    });
  });

  describe('StyledFullProsper', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledFullProsper>
          <div>Test content</div>
        </StyledFullProsper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledFullProsper className="full-prosper-class">
          <div>Full Prosper content</div>
        </StyledFullProsper>
      );
      
      expect(getByText('Full Prosper content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('full-prosper-class');
    });
  });

  describe('StyledPegasusColumn', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledPegasusColumn>
          <div>Test content</div>
        </StyledPegasusColumn>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledPegasusColumn className="pegasus-column-class">
          <div>Pegasus Column content</div>
        </StyledPegasusColumn>
      );
      
      expect(getByText('Pegasus Column content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('pegasus-column-class');
    });
  });

  describe('StyledProsperColumn', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledProsperColumn>
          <div>Test content</div>
        </StyledProsperColumn>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledProsperColumn className="prosper-column-class">
          <div>Prosper Column content</div>
        </StyledProsperColumn>
      );
      
      expect(getByText('Prosper Column content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('prosper-column-class');
    });
  });

  describe('StyledWithMarginAndLoader', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledWithMarginAndLoader>
          <div>Test content</div>
        </StyledWithMarginAndLoader>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledWithMarginAndLoader>
          <div>Margin and Loader content</div>
        </StyledWithMarginAndLoader>
      );
      
      expect(getByText('Margin and Loader content')).toBeInTheDocument();
    });
  });

  describe('StyledWrapper', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledWrapper>
          <div>Test content</div>
        </StyledWrapper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children props', () => {
      const { getByText } = render(
        <StyledWrapper>
          <div>Wrapper content</div>
        </StyledWrapper>
      );
      
      expect(getByText('Wrapper content')).toBeInTheDocument();
    });
  });

  describe('StyledInnerWrapper', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <StyledInnerWrapper>
          <div>Test content</div>
        </StyledInnerWrapper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept children and className props', () => {
      const { getByText, container } = render(
        <StyledInnerWrapper className="inner-wrapper-class">
          <div>Inner Wrapper content</div>
        </StyledInnerWrapper>
      );
      
      expect(getByText('Inner Wrapper content')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('inner-wrapper-class');
    });
  });
});