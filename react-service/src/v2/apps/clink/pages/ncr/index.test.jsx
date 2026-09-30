import React from 'react';
import { render } from '@testing-library/react';
import NCR from './index';

// Mock the InstructionsList component
jest.mock('v2/apps/clink/pages/shared/instruction-list', () => {
  return function MockInstructionsList({ contextType, type }) {
    return (
      <div data-testid="mock-instructions-list">
        <span data-testid="context-type">{contextType}</span>
        <span data-testid="type">{type}</span>
      </div>
    );
  };
});

describe('NCR Component', () => {
  it('renders without crashing', () => {
    render(<NCR />);
  });

  it('renders InstructionsList with default contextType "clink" and type "ncr"', () => {
    const { getByTestId } = render(<NCR />);
    
    expect(getByTestId('mock-instructions-list')).toBeInTheDocument();
    expect(getByTestId('context-type')).toHaveTextContent('clink');
    expect(getByTestId('type')).toHaveTextContent('ncr');
  });

  it('renders InstructionsList with custom contextType when provided', () => {
    const customContextType = 'custom-context';
    const { getByTestId } = render(<NCR contextType={customContextType} />);
    
    expect(getByTestId('mock-instructions-list')).toBeInTheDocument();
    expect(getByTestId('context-type')).toHaveTextContent(customContextType);
    expect(getByTestId('type')).toHaveTextContent('ncr');
  });

  it('always passes "ncr" as the type prop to InstructionsList', () => {
    const { getByTestId } = render(<NCR contextType="any-context" />);
    
    expect(getByTestId('type')).toHaveTextContent('ncr');
  });

  it('matches snapshot', () => {
    const { container } = render(<NCR />);
    expect(container.firstChild).toMatchSnapshot();
  });
});