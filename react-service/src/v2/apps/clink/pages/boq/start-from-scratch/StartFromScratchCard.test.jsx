import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StartFromScratchCard from './StartFromScratchCard';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        black: '#000000',
        clinkLightPurple: '#E8E4F3',
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

describe('StartFromScratchCard', () => {
  it('renders title, description and action button', () => {
    render(<StartFromScratchCard />);

    expect(screen.getByText('boq-start-from-scratch')).toBeInTheDocument();
    expect(screen.getByText('boq-create-list-items')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'boq-add-items-manually' })
    ).toBeInTheDocument();
  });

  it('calls onStart when action button is clicked', () => {
    const onStart = jest.fn();
    render(<StartFromScratchCard onStart={onStart} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'boq-add-items-manually' })
    );
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('disables action button when disabled=true', () => {
    const onStart = jest.fn();
    render(<StartFromScratchCard onStart={onStart} disabled />);

    const button = screen.getByRole('button', { name: 'boq-add-items-manually' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onStart).not.toHaveBeenCalled();
  });
});
