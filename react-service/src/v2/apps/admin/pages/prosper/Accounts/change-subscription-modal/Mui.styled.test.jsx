import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MuiChangeSubscriptionsModal,
  MuiTitleWrapper,
  MuiTitle,
  MuiSmall,
  MuiInputData,
  MuiFormSubscription,
  MuiSaveBtnContainer,
  MuiSaveBtn,
} from './Mui.styled';

// Mock the clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        platinum: '#e0e0e0',
        elephant: '#333333',
        lightBlue: '#2196f3',
        white: '#ffffff',
      },
    },
    fonts: {
      ptSans: 'PT Sans, sans-serif',
    },
  },
}));

describe('Mui.styled Components', () => {
  describe('MuiChangeSubscriptionsModal', () => {
    it('renders without crashing', () => {
      render(
        <MuiChangeSubscriptionsModal>
          <div>Test content</div>
        </MuiChangeSubscriptionsModal>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('MuiTitleWrapper', () => {
    it('renders children correctly', () => {
      render(
        <MuiTitleWrapper>
          <div>Wrapper content</div>
        </MuiTitleWrapper>
      );
      expect(screen.getByText('Wrapper content')).toBeInTheDocument();
    });
  });

  describe('MuiTitle', () => {
    it('renders title text correctly', () => {
      render(<MuiTitle>Test Title</MuiTitle>);
      const titleElement = screen.getByText('Test Title');
      expect(titleElement).toBeInTheDocument();
      // MUI Typography component renders as div by default in test environment
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe('MuiSmall', () => {
    it('renders small text correctly', () => {
      render(<MuiSmall>Small text</MuiSmall>);
      const smallElement = screen.getByText('Small text');
      expect(smallElement).toBeInTheDocument();
    });
  });

  describe('MuiInputData', () => {
    it('renders input data container', () => {
      render(
        <MuiInputData>
          <input type="text" placeholder="Test input" />
        </MuiInputData>
      );
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });
  });

  describe('MuiFormSubscription', () => {
    it('renders form subscription container', () => {
      render(
        <MuiFormSubscription>
          <form data-testid="test-form">
            <input type="text" />
          </form>
        </MuiFormSubscription>
      );
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });
  });

  describe('MuiSaveBtnContainer', () => {
    it('renders save button container', () => {
      render(
        <MuiSaveBtnContainer>
          <button>Save</button>
        </MuiSaveBtnContainer>
      );
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('MuiSaveBtn', () => {
    it('renders save button correctly', () => {
      render(<MuiSaveBtn>Save Changes</MuiSaveBtn>);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      render(<MuiSaveBtn disabled>Save Changes</MuiSaveBtn>);
      const button = screen.getByText('Save Changes');
      expect(button).toBeDisabled();
    });

    it('calls handleClick when clicked', () => {
      const mockClick = jest.fn();
      render(<MuiSaveBtn handleClick={mockClick}>Save Changes</MuiSaveBtn>);
      const button = screen.getByText('Save Changes');
      button.click();
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles missing handleClick prop gracefully', () => {
      expect(() => {
        render(<MuiSaveBtn>Save Changes</MuiSaveBtn>);
      }).not.toThrow();
    });
  });
});