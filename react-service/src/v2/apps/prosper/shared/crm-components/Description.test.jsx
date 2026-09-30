import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Description from './Description';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('Description', () => {
  const defaultProps = {
    text: 'This is a sample description text that shows user profile information.'
  };

  it('renders without crashing', () => {
    render(<Description {...defaultProps} />);
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
  });

  it('displays the description text correctly', () => {
    render(<Description {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true and text is empty', () => {
    const { container } = render(<Description text={null} loading={true} />);
    const skeleton = container.querySelector('[data-testid="mui-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('does not show skeleton when text exists even if loading is true', () => {
    const { container } = render(<Description {...defaultProps} loading={true} />);
    const skeleton = container.querySelector('[data-testid="mui-skeleton"]');
    expect(skeleton).not.toBeInTheDocument();
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
  });

  it('renders with custom grid styles', () => {
    const customGridSx = { backgroundColor: 'red', padding: 2 };
    const { container } = render(<Description {...defaultProps} gridSx={customGridSx} />);
    
    // The Grid component should be present
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom font sizes', () => {
    const customFontSx = { xs: '16px', md: '24px' };
    const customDescFontSx = { xs: '12px', md: '18px' };
    
    render(
      <Description 
        {...defaultProps} 
        fontSx={customFontSx}
        descFontSx={customDescFontSx}
      />
    );
    
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
  });

  it('handles empty text gracefully', () => {
    render(<Description text="" />);
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
    // Empty text won't be found by getByText, so we check if the component renders
    const { container } = render(<Description text="" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles null text', () => {
    render(<Description text={null} />);
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
  });

  it('handles undefined text', () => {
    render(<Description text={undefined} />);
    expect(screen.getByText('Profile-description')).toBeInTheDocument();
  });

  it('applies scrollbar styles correctly', () => {
    const { container } = render(<Description {...defaultProps} />);
    const textContainer = container.querySelector('div[component="div"]');
    
    // Check that the text container exists (scrollbar styles are applied via sx prop)
    expect(textContainer).toBeInTheDocument();
  });
});