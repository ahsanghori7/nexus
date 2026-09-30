import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableTooltip from './TableTooltip';

// Mock MUI Tooltip
jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({ title, placement, children }) {
    return (
      <div data-testid="tooltip" data-placement={placement}>
        <div data-testid="tooltip-title">{title}</div>
        {children}
      </div>
    );
  };
});

describe('TableTooltip Component', () => {
  test('renders without crashing with title and content', () => {
    render(<TableTooltip title="Test Title" content="Test Content" />);
    
    const tooltip = screen.getByTestId('tooltip');
    const span = screen.getByText('Test Content');
    
    expect(tooltip).toBeInTheDocument();
    expect(span).toBeInTheDocument();
  });

  test('displays provided title', () => {
    const title = 'Custom Title';
    render(<TableTooltip title={title} content="Test Content" />);

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(title);
  });

  test('displays provided content', () => {
    const content = 'Custom Content';
    render(<TableTooltip title="Test Title" content={content} />);
    
    const span = screen.getByText(content);
    expect(span).toBeInTheDocument();
  });

  test('uses default title when title is not provided', () => {
    render(<TableTooltip content="Test Content" />);

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent('-');
  });

  test('uses default title when title is null', () => {
    render(<TableTooltip title={null} content="Test Content" />);

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent('-');
  });

  test('uses default title when title is empty string', () => {
    render(<TableTooltip title="" content="Test Content" />);

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent('-');
  });

  test('uses default content when content is not provided', () => {
    render(<TableTooltip title="Test Title" />);
    
    const span = screen.getByText('-');
    expect(span).toBeInTheDocument();
  });

  test('uses default content when content is null', () => {
    render(<TableTooltip title="Test Title" content={null} />);
    
    const span = screen.getByText('-');
    expect(span).toBeInTheDocument();
  });

  test('uses default content when content is empty string', () => {
    render(<TableTooltip title="Test Title" content="" />);
    
    const span = screen.getByText('-');
    expect(span).toBeInTheDocument();
  });

  test('applies correct placement to tooltip', () => {
    render(<TableTooltip title="Test Title" content="Test Content" />);
    
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'bottom-start');
  });

  test('applies correct cursor style to span', () => {
    render(<TableTooltip title="Test Title" content="Test Content" />);
    
    const span = screen.getByText('Test Content');
    expect(span).toHaveStyle({ cursor: 'help' });
  });

  test('renders with React elements as content', () => {
    const content = <strong>Bold Content</strong>;
    render(<TableTooltip title="Test Title" content={content} />);
    
    const strongElement = screen.getByText('Bold Content');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement.tagName).toBe('STRONG');
  });

  test('renders with React elements as title', () => {
    const title = <em>Italic Title</em>;
    render(<TableTooltip title={title} content="Test Content" />);
    
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  test('handles both title and content as undefined', () => {
    render(<TableTooltip />);

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent('-');
    expect(screen.getByTestId('tooltip').textContent).toContain('-');
  });

  test('renders complex content correctly', () => {
    const complexContent = (
      <div>
        <span>Part 1</span>
        <br />
        <span>Part 2</span>
      </div>
    );
    
    render(<TableTooltip title="Complex Title" content={complexContent} />);
    
    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });
});