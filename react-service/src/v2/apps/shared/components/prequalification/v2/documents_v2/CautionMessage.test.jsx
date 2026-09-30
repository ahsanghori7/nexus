import React from 'react';
import { render, screen } from '@testing-library/react';
import CautionMessage from './CautionMessage';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'caution': 'caution',
      'caution-message': 'This is a caution message'
    };
    return translations[key] || key;
  })
}));

// Mock clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        laceVeil: '#f5f5f5',
        prosperBoxRed: '#d32f2f'
      }
    }
  }
}));

describe('CautionMessage', () => {
  it('renders without crashing', () => {
    render(<CautionMessage />);
  });

  it('renders caution title in uppercase', () => {
    render(<CautionMessage />);
    expect(screen.getByText('CAUTION!')).toBeInTheDocument();
  });

  it('renders caution message', () => {
    render(<CautionMessage />);
    expect(screen.getByText('This is a caution message')).toBeInTheDocument();
  });

  it('renders Box container', () => {
    render(<CautionMessage />);
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('renders two Typography components', () => {
    render(<CautionMessage />);
    const typographyElements = screen.getAllByTestId('mui-typography');
    expect(typographyElements).toHaveLength(2);
  });

  it('applies correct styles to the container', () => {
    render(<CautionMessage />);
    const container = screen.getByTestId('mui-box');
    expect(container).toBeInTheDocument();
  });
});