import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MuiSubtitle,
  MuiSubmitWrapper,
  MuiCompanyAvatar,
  MuiInvalidInput,
  MuiGreetingSection,
  MuiRequired,
  MuiCompanyTitle,
  ProgressBar,
} from './Mui.styled';

jest.mock('@mui/material', () => {
  const React = require('react');

  const createSimple = (tag, testId) =>
    React.forwardRef(({ children, ...rest }, ref) =>
      React.createElement(tag, { 'data-testid': testId, ...rest, ref }, children)
    );

  const Button = React.forwardRef(({ children, onClick, type = 'button', ...rest }, ref) => (
    <button
      data-testid="mui-button"
      type={type}
      onClick={onClick}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  ));

  const Avatar = React.forwardRef(({ src, alt, children, ...rest }, ref) => (
    <img data-testid="mui-avatar" src={src} alt={alt} ref={ref} {...rest}>
      {children}
    </img>
  ));

  const CardMedia = React.forwardRef(({ image, title, ...rest }, ref) => (
    <img data-testid="mui-card-media" src={image} alt={title} ref={ref} {...rest} />
  ));

  return {
    Box: createSimple('div', 'mui-box'),
    CircularProgress: createSimple('div', 'circularprogress'),
    Typography: createSimple('div', 'mui-typography'),
    Avatar,
    Button,
    Card: createSimple('div', 'mui-card'),
    CardContent: createSimple('div', 'mui-card-content'),
    CardMedia,
    LinearProgress: createSimple('div', 'mui-linear-progress'),
  };
});

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((input) => input),
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

describe('Mui.styled Components', () => {
  describe('MuiSubtitle', () => {
    test('renders without crashing', () => {
      render(<MuiSubtitle>Test subtitle</MuiSubtitle>);
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    test('renders with red prop true by default', () => {
      render(<MuiSubtitle>Red subtitle</MuiSubtitle>);
      const subtitle = screen.getByText('Red subtitle');
      expect(subtitle).toBeInTheDocument();
    });

    test('renders with red prop false', () => {
      render(<MuiSubtitle red={false}>Non-red subtitle</MuiSubtitle>);
      const subtitle = screen.getByText('Non-red subtitle');
      expect(subtitle).toBeInTheDocument();
    });

    test('applies custom sx prop', () => {
      render(<MuiSubtitle sx={{ fontSize: '20px' }}>Custom subtitle</MuiSubtitle>);
      expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
    });
  });

  describe('MuiSubmitWrapper', () => {
    test('renders children without crashing', () => {
      render(
        <MuiSubmitWrapper>
          <button>Submit</button>
        </MuiSubmitWrapper>
      );
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    test('shows loading spinner when loading prop is true', () => {
      render(
        <MuiSubmitWrapper loading>
          <button>Submit</button>
        </MuiSubmitWrapper>
      );
      expect(screen.getByTestId('circularprogress')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    test('does not show loading spinner when loading prop is false', () => {
      render(
        <MuiSubmitWrapper loading={false}>
          <button>Submit</button>
        </MuiSubmitWrapper>
      );
      expect(screen.queryByTestId('circularprogress')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('MuiCompanyAvatar', () => {
    test('renders without crashing', () => {
      const mockOnDelete = jest.fn();
      render(<MuiCompanyAvatar picSrc="test-image.jpg" onDelete={mockOnDelete} />);
      expect(screen.getAllByTestId('mui-avatar')).toHaveLength(2); // Avatar + Delete button icon
    });

    test('calls onDelete when delete button is clicked', () => {
      const mockOnDelete = jest.fn();
      render(<MuiCompanyAvatar picSrc="test-image.jpg" onDelete={mockOnDelete} />);
      const deleteButton = screen.getByRole('button');
      deleteButton.click();
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('MuiInvalidInput', () => {
    test('renders error message', () => {
      render(<MuiInvalidInput>Error message</MuiInvalidInput>);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('MuiGreetingSection', () => {
    test('renders with default title', () => {
      render(<MuiGreetingSection />);
      expect(screen.getByText('greetings-preq-v2-title')).toBeInTheDocument();
    });

    test('renders with custom title', () => {
      render(<MuiGreetingSection title="custom-title" />);
      expect(screen.getByText('custom-title')).toBeInTheDocument();
    });

    test('renders intro text when provided', () => {
      render(<MuiGreetingSection intro="intro-text" />);
      expect(screen.getByText('intro-text')).toBeInTheDocument();
    });

    test('renders outtro text when provided', () => {
      render(<MuiGreetingSection outtro="outtro-text" />);
      expect(screen.getByText('outtro-text')).toBeInTheDocument();
    });
  });

  describe('MuiRequired', () => {
    test('renders children with asterisk', () => {
      render(<MuiRequired>Required field</MuiRequired>);
      expect(screen.getByText('Required field')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('MuiCompanyTitle', () => {
    test('renders title and anthem', () => {
      render(<MuiCompanyTitle title="Company Name" anthem="COMP" />);
      expect(screen.getByText('Company Name')).toBeInTheDocument();
      expect(screen.getByText('(COMP)')).toBeInTheDocument();
    });
  });

  describe('ProgressBar', () => {
    test('renders with default percentage', () => {
      render(<ProgressBar />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('profile-complete')).toBeInTheDocument();
    });

    test('renders with custom percentage', () => {
      render(<ProgressBar percentComplete={75} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('shows progress bar element', () => {
      render(<ProgressBar percentComplete={50} />);
      expect(screen.getByTestId('mui-linear-progress')).toBeInTheDocument();
    });
  });
});
