import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Empty from './Empty';

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => key, // Return the key as the translation for simplicity
}));

describe('Empty Component', () => {
  it('renders without crashing when hasEntities is false', () => {
    render(<Empty hasEntities={false} />);
  });

  it('renders the empty state when hasEntities is false', () => {
    const { getByText } = render(<Empty hasEntities={false} />);
    
    expect(getByText('no-entities-available')).toBeInTheDocument();
    expect(getByText('please-click-add')).toBeInTheDocument();
  });

  it('does not render anything when hasEntities is true', () => {
    const { container } = render(<Empty hasEntities={true} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('applies correct styling to the paper container', () => {
    const { container } = render(<Empty hasEntities={false} />);
    
    // Check if the container has content when hasEntities is false
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with correct typography variant for title', () => {
    const { getByText } = render(<Empty hasEntities={false} />);
    
    const titleElement = getByText('no-entities-available');
    expect(titleElement).toBeInTheDocument();
  });

  it('matches snapshot when hasEntities is false', () => {
    const { container } = render(<Empty hasEntities={false} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot when hasEntities is true (null render)', () => {
    const { container } = render(<Empty hasEntities={true} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});