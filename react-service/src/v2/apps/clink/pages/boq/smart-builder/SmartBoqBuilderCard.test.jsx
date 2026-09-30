import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SmartBoqBuilderCard from './SmartBoqBuilderCard';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        black: '#000000',
        clinkGreen: '#14A38B',
        brightGray: '#F3F4F6',
        white: '#FFFFFF',
      },
    },
  },
}));

jest.mock('v2/apps/clink/pages/boq/container/containerStyles', () => ({
  creationCardActionButtonSx: {
    mt: 2,
    width: '100%',
    textTransform: 'none',
    fontSize: '13px',
    py: 1.25,
    borderRadius: '8px',
  },
}));

describe('SmartBoqBuilderCard', () => {
  it('renders title, description and generate button', () => {
    render(<SmartBoqBuilderCard />);

    expect(screen.getByText('boq-smart-builder-title')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-desc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'boq-smart-builder-generate' })).toBeInTheDocument();
  });

  it('calls onOpen when generate button is clicked', () => {
    const onOpen = jest.fn();
    render(<SmartBoqBuilderCard onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'boq-smart-builder-generate' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('disables generate button when disabled=true', () => {
    const onOpen = jest.fn();
    render(<SmartBoqBuilderCard onOpen={onOpen} disabled />);

    const button = screen.getByRole('button', { name: 'boq-smart-builder-generate' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
