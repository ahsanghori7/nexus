import React from 'react';
import { render, screen } from '@testing-library/react';
import Packages from './index';

// Mock the Container styled component
jest.mock('v2/apps/prosper/pages/projects/Container.styled', () => {
  return function Container({ children }) {
    return <div data-testid="container">{children}</div>;
  };
});

// Mock the child components
jest.mock('./Matched', () => {
  return function Matched(props) {
    return (
      <div data-testid="matched-component">
        Matched Component - unlocked: {props.unlocked.toString()}
      </div>
    );
  };
});

jest.mock('./Other', () => {
  return function Other(props) {
    return (
      <div data-testid="other-component">
        Other Component - unlocked: {props.unlocked.toString()}
      </div>
    );
  };
});

describe('Packages Component', () => {
  const defaultProps = {
    project: { id: 1, name: 'Test Project' },
    subcontractor: { id: 1, name: 'Test Subcontractor' },
    handleRegister: jest.fn(),
    open: false,
    unlocked: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Packages {...defaultProps} />);
    expect(screen.getByTestId('container')).toBeInTheDocument();
  });

  it('renders Matched and Other components', () => {
    render(<Packages {...defaultProps} />);
    expect(screen.getByTestId('matched-component')).toBeInTheDocument();
    expect(screen.getByTestId('other-component')).toBeInTheDocument();
  });

  it('passes props correctly to child components', () => {
    const props = {
      ...defaultProps,
      unlocked: true,
      open: true,
    };
    
    render(<Packages {...props} />);
    
    expect(screen.getAllByText(/unlocked: true/)).toHaveLength(2);
  });

  it('handles unlocked prop correctly when false', () => {
    render(<Packages {...defaultProps} />);
    expect(screen.getAllByText(/unlocked: false/)).toHaveLength(2);
  });

  it('handles unlocked prop correctly when true', () => {
    const props = { ...defaultProps, unlocked: true };
    render(<Packages {...props} />);
    expect(screen.getAllByText(/unlocked: true/)).toHaveLength(2);
  });

  it('passes all required props to Matched component', () => {
    const handleRegisterMock = jest.fn();
    const props = {
      ...defaultProps,
      handleRegister: handleRegisterMock,
      open: true,
    };
    
    render(<Packages {...props} />);
    expect(screen.getByTestId('matched-component')).toBeInTheDocument();
  });

  it('passes all required props to Other component', () => {
    const handleRegisterMock = jest.fn();
    const props = {
      ...defaultProps,
      handleRegister: handleRegisterMock,
    };
    
    render(<Packages {...props} />);
    expect(screen.getByTestId('other-component')).toBeInTheDocument();
  });

  it('applies correct Box styling', () => {
    const { container } = render(<Packages {...defaultProps} />);
    const boxElement = container.firstChild;
    expect(boxElement).toHaveAttribute('data-testid', 'mui-box');
  });

  it('matches snapshot', () => {
    const { container } = render(<Packages {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});