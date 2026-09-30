let latestStylesCreator;

jest.mock('clink-components', () => {
  const useWindowDimensions = jest.fn();
  return {
    __esModule: true,
    CONSTANTS: {
      colors: {
        prosper: {
          midGrey: '#888888',
        },
      },
      dimensions: {
        MD_SCREEN: 1024,
        SM_SCREEN: 768,
      },
    },
    HOOKS: {
      useWindowDimensions,
    },
  };
});

jest.mock('dompurify', () => {
  const DOMPurify = () => {};
  DOMPurify.sanitize = jest.fn((value) => `sanitized:${value}`);
  return {
    __esModule: true,
    default: DOMPurify,
  };
});

jest.mock('@mui/styles', () => ({
  makeStyles: jest.fn((stylesCreator) => {
    latestStylesCreator = stylesCreator;
    return () => ({ placeholder: 'placeholder-class' });
  }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import Placeholder from './Placeholder';
import { HOOKS } from 'clink-components';
import { makeStyles } from '@mui/styles';
import DOMPurify from 'dompurify';

describe('Placeholder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestStylesCreator = undefined;
  });

  it('renders children text and applies default styles', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1400 });

    render(<Placeholder>Plain placeholder</Placeholder>);

    const element = screen.getByText('Plain placeholder');
    expect(element).toHaveClass('placeholder-class');
    expect(element).not.toHaveAttribute('data-i18n');
    expect(DOMPurify.sanitize).not.toHaveBeenCalled();
    expect(makeStyles).toHaveBeenCalled();

    const styles = latestStylesCreator();
    expect(styles.placeholder().fontSize).toBe('16px');
    expect(styles.placeholder().textAlign).toBeNull();
  });

  it('sanitizes provided title and updates alignment and font size', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 700 });

    render(<Placeholder title="<strong>Injected</strong>" right />);

    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<strong>Injected</strong>');

    const sanitized = document.querySelector('[data-i18n="[html]content.body"]');
    expect(sanitized).not.toBeNull();
    expect(sanitized?.textContent).toBe('sanitized:Injected');

    const styles = latestStylesCreator();
    expect(styles.placeholder().fontSize).toBe('12px');
    expect(styles.placeholder().textAlign).toBe('right');
  });
});

