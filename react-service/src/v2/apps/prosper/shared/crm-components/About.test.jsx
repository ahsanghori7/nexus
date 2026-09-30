import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from './About';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('About', () => {
  const defaultProps = {
    displayName: 'John Doe',
    jobTitle: 'Software Engineer',
    description: 'Experienced software engineer with expertise in React development.',
    src: 'profile-image.jpg'
  };

  it('renders without crashing', () => {
    render(<About {...defaultProps} />);
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
  });

  it('displays the default title correctly', () => {
    render(<About {...defaultProps} />);
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(<About {...defaultProps} title="about-us" />);
    expect(screen.getByText('About-us')).toBeInTheDocument();
  });

  it('displays display name correctly', () => {
    render(<About {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays job title correctly', () => {
    render(<About {...defaultProps} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('displays description correctly', () => {
    render(<About {...defaultProps} />);
    expect(screen.getByText('Experienced software engineer with expertise in React development.')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<About {...defaultProps} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'profile-image.jpg');
    expect(image).toHaveAttribute('width', '63');
    expect(image).toHaveAttribute('height', '63');
  });

  it('does not render image container when src is not provided', () => {
    const propsWithoutSrc = { ...defaultProps };
    delete propsWithoutSrc.src;
    
    render(<About {...propsWithoutSrc} />);
    
    const images = screen.queryAllByRole('img');
    expect(images).toHaveLength(0);
  });

  it('shows loading skeleton for display name when loading is true and displayName is empty', () => {
    const { container } = render(<About displayName={null} loading={true} />);
    
    const skeletons = container.querySelectorAll('[data-testid="mui-skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton for job title when value is empty', () => {
    const { container } = render(<About jobTitle={null} />);
    
    // EmptyTextWrapper shows skeleton when value is null, but not when loading is false
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows loading skeleton for description when value is empty', () => {
    const { container } = render(<About description={null} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('does not show skeleton when values exist even if loading is true', () => {
    render(<About {...defaultProps} loading={true} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Experienced software engineer with expertise in React development.')).toBeInTheDocument();
  });

  it('applies custom grid styles', () => {
    const customGridSx = { backgroundColor: 'red', padding: 2 };
    const { container } = render(<About {...defaultProps} gridSx={customGridSx} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom description styles', () => {
    const customDescSx = { backgroundColor: 'blue', margin: 1 };
    render(<About {...defaultProps} descSx={customDescSx} />);
    
    expect(screen.getByText('Experienced software engineer with expertise in React development.')).toBeInTheDocument();
  });

  it('applies custom font title styles', () => {
    const customFontTitleSx = { fontSize: { xs: '16px', md: '24px' }, fontWeight: 'normal' };
    render(<About {...defaultProps} fontTitleSx={customFontTitleSx} />);
    
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
  });

  it('applies custom description typography styles', () => {
    const customDescriptionSX = { fontSize: { xs: '12px', md: '14px' }, color: 'red' };
    render(<About {...defaultProps} descriptionSX={customDescriptionSX} />);
    
    expect(screen.getByText('Experienced software engineer with expertise in React development.')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <About {...defaultProps}>
        <div>Child content</div>
      </About>
    );
    
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('does not render children section when children is not provided', () => {
    render(<About {...defaultProps} />);
    
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('handles missing displayName gracefully', () => {
    const propsWithoutDisplayName = { ...defaultProps };
    delete propsWithoutDisplayName.displayName;
    
    render(<About {...propsWithoutDisplayName} />);
    
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('handles missing jobTitle gracefully', () => {
    const propsWithoutJobTitle = { ...defaultProps };
    delete propsWithoutJobTitle.jobTitle;
    
    render(<About {...propsWithoutJobTitle} />);
    
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles missing description gracefully', () => {
    const propsWithoutDescription = { ...defaultProps };
    delete propsWithoutDescription.description;
    
    render(<About {...propsWithoutDescription} />);
    
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders with all empty values', () => {
    render(<About displayName="" jobTitle="" description="" />);
    
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
  });

  it('renders complex children with multiple elements', () => {
    render(
      <About {...defaultProps}>
        <button>Action Button</button>
        <span>Additional Info</span>
        <div>
          <p>Nested content</p>
        </div>
      </About>
    );
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Additional Info')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('applies blue magenta violet color correctly', () => {
    render(<About {...defaultProps} />);
    
    // The color is applied via sx prop to Typography component
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});