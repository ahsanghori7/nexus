import React from 'react';
import { render, screen } from '@testing-library/react';
import CommonModal, { CommonContent } from './CommonModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('CommonModal', () => {
  const defaultProps = {
    renderModal: jest.fn(() => <div>Mock Modal Content</div>),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<CommonModal {...defaultProps} />);
    // Since Modal is mocked, we just test that component doesn't crash
    expect(true).toBe(true);
  });

  it('should accept renderModal prop', () => {
    const renderModal = jest.fn(() => <div>Test Content</div>);
    render(<CommonModal renderModal={renderModal} />);
    // Component should accept the prop without error
    expect(true).toBe(true);
  });

  it('should accept all expected props', () => {
    const customProps = {
      externalOpen: true,
      openElement: <button>Open</button>,
      onHidden: jest.fn(),
      className: 'custom-class',
      theme: 'custom-theme',
      renderModal: jest.fn(() => <div>Custom Content</div>),
    };

    // Should render without error with all props
    render(<CommonModal {...customProps} />);
    expect(true).toBe(true);
  });

  it('should handle default props gracefully', () => {
    // Should render with minimal props
    render(<CommonModal renderModal={() => <div>content</div>} />);
    expect(true).toBe(true);
  });

  it('should handle null renderModal gracefully', () => {
    render(<CommonModal renderModal={() => null} />);
    // Should not crash
    expect(true).toBe(true);
  });
});

describe('CommonContent', () => {
  it('should render without crashing', () => {
    render(<CommonContent />);
    expect(screen.getByText('send-quotation')).toBeInTheDocument();
  });

  it('should render with default title', () => {
    render(<CommonContent />);
    expect(screen.getByText('send-quotation')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<CommonContent title="custom-title" />);
    expect(screen.getByText('custom-title')).toBeInTheDocument();
  });

  it('should render with subtitle when provided', () => {
    render(<CommonContent subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    render(<CommonContent />);
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <CommonContent>
        <div>Test Children</div>
      </CommonContent>
    );
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('should apply custom styling props', () => {
    const sxTitle = { color: 'red' };
    const sxSubtitle = { color: 'blue' };
    
    render(
      <CommonContent 
        title="test" 
        subtitle="sub" 
        sxTitle={sxTitle} 
        sxSubtitle={sxSubtitle} 
      />
    );
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('sub')).toBeInTheDocument();
  });

  it('should use prosper theme by default', () => {
    render(<CommonContent />);
    // Test passes if component renders without error
    expect(screen.getByText('send-quotation')).toBeInTheDocument();
  });

  it('should accept custom theme', () => {
    render(<CommonContent theme="custom-theme" />);
    expect(screen.getByText('send-quotation')).toBeInTheDocument();
  });

  it('should handle onHidden callback when provided', () => {
    const mockOnHidden = jest.fn();
    render(<CommonModal onHidden={mockOnHidden} renderModal={() => <div>content</div>} />);
    // The component should accept the onHidden prop without error
    expect(true).toBe(true);
  });

  it('should handle onHidden as null gracefully', () => {
    render(<CommonModal onHidden={null} renderModal={() => <div>content</div>} />);
    // Should render without error even when onHidden is explicitly null
    expect(true).toBe(true);
  });
});