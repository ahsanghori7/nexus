import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Title from './Title';

describe('Title Component', () => {
  it('renders without crashing', () => {
    render(<Title title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<Title title="Default Test" />);
    const titleElement = screen.getByText('Default Test');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders with custom variant', () => {
    render(<Title title="Custom Variant" variant="h1" />);
    expect(screen.getByText('Custom Variant')).toBeInTheDocument();
  });

  it('renders with custom font weight', () => {
    render(<Title title="Bold Title" fontWeight="normal" />);
    expect(screen.getByText('Bold Title')).toBeInTheDocument();
  });

  it('renders with custom styles', () => {
    const customStyles = { color: 'red' };
    render(<Title title="Styled Title" styles={customStyles} />);
    expect(screen.getByText('Styled Title')).toBeInTheDocument();
  });

  it('renders with margin bottom', () => {
    render(<Title title="Margin Title" marginBottom={2} />);
    expect(screen.getByText('Margin Title')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(
      <Title 
        title="Snapshot Title" 
        variant="h2" 
        fontWeight="bold" 
        marginBottom={3}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});