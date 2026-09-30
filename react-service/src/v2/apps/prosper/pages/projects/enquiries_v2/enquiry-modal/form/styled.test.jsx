import React from 'react';
import { render, screen } from '@testing-library/react';
import { StyledActionButtonText } from './styled';

describe('StyledActionButtonText', () => {
  it('should render without crashing', () => {
    render(<StyledActionButtonText>Test Text</StyledActionButtonText>);
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('should render with default width when no width prop is provided', () => {
    render(<StyledActionButtonText>Test Text</StyledActionButtonText>);
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
  });

  it('should render with custom width when width prop is provided', () => {
    render(<StyledActionButtonText width={100}>Test Text</StyledActionButtonText>);
    const element = screen.getByText('Test Text');
    expect(element).toBeInTheDocument();
  });

  it('should apply proper styling classes', () => {
    const { container } = render(<StyledActionButtonText>Test Text</StyledActionButtonText>);
    const styledElement = container.firstChild;
    expect(styledElement).toHaveStyle('font-weight: bold');
    expect(styledElement).toHaveStyle('text-transform: uppercase');
  });

  it('should handle empty children', () => {
    const { container } = render(<StyledActionButtonText />);
    const element = container.firstChild;
    expect(element).toBeInTheDocument();
  });
});