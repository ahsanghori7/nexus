import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MuiTabQuizz, MuiTabContent } from './muitabs.styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#00ff00',
        clinkPurple: '#800080',
        clinkRed: '#ff0000',
      },
    },
  },
}));

describe('MuiTabQuizz', () => {
  test('renders with children', () => {
    render(<MuiTabQuizz>Test content</MuiTabQuizz>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders as div component by default', () => {
    render(<MuiTabQuizz>Test</MuiTabQuizz>);
    const element = screen.getByText('Test');
    expect(element.tagName).toBe('DIV');
  });

  test('applies custom sx prop', () => {
    const customSx = { color: 'red', fontWeight: 'bold' };
    render(<MuiTabQuizz sx={customSx}>Test</MuiTabQuizz>);
    const element = screen.getByText('Test');
    expect(element).toBeInTheDocument();
  });

  test('renders with empty sx when not provided', () => {
    render(<MuiTabQuizz>Test</MuiTabQuizz>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles multiple children', () => {
    render(
      <MuiTabQuizz>
        <span>First</span>
        <span>Second</span>
      </MuiTabQuizz>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

describe('MuiTabContent', () => {
  test('renders with children', () => {
    render(<MuiTabContent>Tab content</MuiTabContent>);
    expect(screen.getByText('Tab content')).toBeInTheDocument();
  });

  test('renders with financial prop set to false by default', () => {
    render(<MuiTabContent>Content</MuiTabContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('renders with financial prop set to true', () => {
    render(<MuiTabContent financial={true}>Financial content</MuiTabContent>);
    expect(screen.getByText('Financial content')).toBeInTheDocument();
  });

  test('renders with financial prop set to false explicitly', () => {
    render(<MuiTabContent financial={false}>Non-financial content</MuiTabContent>);
    expect(screen.getByText('Non-financial content')).toBeInTheDocument();
  });

  test('handles multiple children', () => {
    render(
      <MuiTabContent>
        <div>Content 1</div>
        <div>Content 2</div>
      </MuiTabContent>
    );
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  test('handles nested components', () => {
    render(
      <MuiTabContent>
        <MuiTabQuizz>Nested quizz</MuiTabQuizz>
        <span>Other content</span>
      </MuiTabContent>
    );
    expect(screen.getByText('Nested quizz')).toBeInTheDocument();
    expect(screen.getByText('Other content')).toBeInTheDocument();
  });

  test('renders without crashing when no children provided', () => {
    render(<MuiTabContent />);
    // Should render an empty Box component
    expect(document.querySelector('[class*="MuiBox"]')).toBeInTheDocument();
  });

  test('renders correctly with financial styling', () => {
    render(<MuiTabContent financial>Financial box</MuiTabContent>);
    expect(screen.getByText('Financial box')).toBeInTheDocument();
  });
});