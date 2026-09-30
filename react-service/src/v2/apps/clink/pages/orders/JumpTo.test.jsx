import React from 'react';
import { render } from '@testing-library/react';
import JumpTo from './JumpTo';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the LinkList component
jest.mock('v2/apps/clink/pages/shared/LinkList', () => {
  return function MockLinkList({ entries }) {
    return (
      <div data-testid="link-list">
        {entries?.map((entry, index) => (
          <div key={index}>{entry?.tender?.label || 'entry'}</div>
        ))}
      </div>
    );
  };
});

describe('JumpTo Component', () => {
  it('should render without crashing', () => {
    const mockEntries = [];
    const { container } = render(<JumpTo entries={mockEntries} />);
    expect(container).toBeTruthy();
  });

  it('should render translated text', () => {
    const mockEntries = [];
    const { getByText } = render(<JumpTo entries={mockEntries} />);
    
    expect(getByText('order-page-selected-packages:')).toBeInTheDocument();
    expect(getByText('order-page-jump-to:')).toBeInTheDocument();
  });

  it('should render LinkList component', () => {
    const mockEntries = [
      {
        tender: { label: 'Test Package 1' }
      },
      {
        tender: { label: 'Test Package 2' }
      }
    ];
    
    const { getByTestId } = render(<JumpTo entries={mockEntries} />);
    expect(getByTestId('link-list')).toBeInTheDocument();
  });

  it('should pass entries to LinkList', () => {
    const mockEntries = [
      {
        tender: { label: 'Package A' }
      }
    ];
    
    const { getByText } = render(<JumpTo entries={mockEntries} />);
    expect(getByText('Package A')).toBeInTheDocument();
  });

  it('should handle empty entries', () => {
    const { getByTestId } = render(<JumpTo entries={[]} />);
    expect(getByTestId('link-list')).toBeInTheDocument();
  });

  it('should handle undefined entries', () => {
    const { container } = render(<JumpTo entries={undefined} />);
    expect(container).toBeTruthy();
  });
});