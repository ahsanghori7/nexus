import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StyledModalContainer, StyledNoWrap } from './styled';

describe('Styled Components', () => {
  describe('StyledModalContainer', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(
        <StyledModalContainer data-testid="styled-modal-container">
          Test content
        </StyledModalContainer>
      );
      
      expect(getByTestId('styled-modal-container')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const testContent = 'Test modal container content';
      const { getByText } = render(
        <StyledModalContainer>
          {testContent}
        </StyledModalContainer>
      );
      
      expect(getByText(testContent)).toBeInTheDocument();
    });

    it('should accept additional props', () => {
      const { getByTestId } = render(
        <StyledModalContainer 
          data-testid="styled-modal-container" 
          className="test-class"
          lg={9}
          xs={12}
        >
          Test content
        </StyledModalContainer>
      );
      
      const element = getByTestId('styled-modal-container');
      expect(element).toBeInTheDocument();
    });
  });

  describe('StyledNoWrap', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(
        <StyledNoWrap data-testid="styled-no-wrap">
          Test content
        </StyledNoWrap>
      );
      
      expect(getByTestId('styled-no-wrap')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const testContent = 'Test no wrap content';
      const { getByText } = render(
        <StyledNoWrap>
          {testContent}
        </StyledNoWrap>
      );
      
      expect(getByText(testContent)).toBeInTheDocument();
    });

    it('should render span elements correctly', () => {
      const { getByText } = render(
        <StyledNoWrap>
          <span>Wrapped span content</span>
        </StyledNoWrap>
      );
      
      expect(getByText('Wrapped span content')).toBeInTheDocument();
    });

    it('should accept additional props', () => {
      const { getByTestId } = render(
        <StyledNoWrap 
          data-testid="styled-no-wrap" 
          className="test-class"
        >
          Test content
        </StyledNoWrap>
      );
      
      const element = getByTestId('styled-no-wrap');
      expect(element).toBeInTheDocument();
    });
  });
});