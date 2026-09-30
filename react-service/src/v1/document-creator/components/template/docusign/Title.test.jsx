import React from 'react';
import { render, screen } from '@testing-library/react';
import Title from './Title';

describe('Title', () => {
  it('renders the given text and forwards testId to data-testid', () => {
    render(<Title text="Edit Tender Template" testId="edit-tender-template-title" />);

    const title = screen.getByTestId('edit-tender-template-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Edit Tender Template');
  });

  it('renders without a data-testid when testId is not provided', () => {
    render(<Title text="Edit Order" />);

    const title = screen.getByText('Edit Order');
    expect(title).toBeInTheDocument();
    expect(title).not.toHaveAttribute('data-testid');
  });
});
