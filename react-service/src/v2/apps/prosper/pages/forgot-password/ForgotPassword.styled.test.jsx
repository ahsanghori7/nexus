import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  StyledForgotPassword,
  StyledForgotPasswordLogo,
  StyledForgotPasswordMessage,
  StyledForgotPasswordTitle,
} from './ForgotPassword.styled';

describe('ForgotPassword Styled Components', () => {
  describe('StyledForgotPassword', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledForgotPassword />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <StyledForgotPassword>
          <div>Test content</div>
        </StyledForgotPassword>
      );
      expect(getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('StyledForgotPasswordLogo', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledForgotPasswordLogo />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders logo content', () => {
      const { container } = render(
        <StyledForgotPasswordLogo>
          <img alt="logo" src="test-logo.png" />
        </StyledForgotPasswordLogo>
      );
      expect(container.querySelector('img')).toBeInTheDocument();
    });
  });

  describe('StyledForgotPasswordMessage', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledForgotPasswordMessage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders message content', () => {
      const { getByText } = render(
        <StyledForgotPasswordMessage>
          Test message
        </StyledForgotPasswordMessage>
      );
      expect(getByText('Test message')).toBeInTheDocument();
    });

    it('applies color prop correctly', () => {
      const { container } = render(
        <StyledForgotPasswordMessage color="#FF0000">
          Colored message
        </StyledForgotPasswordMessage>
      );
      expect(container.firstChild).toHaveStyle('color: #FF0000');
    });
  });

  describe('StyledForgotPasswordTitle', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledForgotPasswordTitle />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders title content', () => {
      const { getByText } = render(
        <StyledForgotPasswordTitle>
          Page Title
        </StyledForgotPasswordTitle>
      );
      expect(getByText('Page Title')).toBeInTheDocument();
    });
  });

  describe('Snapshot tests', () => {
    it('matches snapshot for StyledForgotPassword', () => {
      const { container } = render(
        <StyledForgotPassword>
          <div>Sample content</div>
        </StyledForgotPassword>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for StyledForgotPasswordMessage with color', () => {
      const { container } = render(
        <StyledForgotPasswordMessage color="#4CAF50">
          Success message
        </StyledForgotPasswordMessage>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});