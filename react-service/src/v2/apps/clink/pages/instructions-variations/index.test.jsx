import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InstructionsVariations from './index';

// Mock the InstructionsList component
jest.mock('v2/apps/clink/pages/shared/instruction-list', () => {
  return function MockInstructionsList({ contextType }) {
    return (
      <div data-testid="mock-instructions-list">
        Mock InstructionsList with contextType: {contextType}
      </div>
    );
  };
});

describe('InstructionsVariations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    // Arrange & Act
    render(<InstructionsVariations />);
    
    // Assert
    expect(screen.getByTestId('mock-instructions-list')).toBeInTheDocument();
  });

  it('passes default contextType prop to InstructionsList', () => {
    // Arrange & Act
    render(<InstructionsVariations />);
    
    // Assert
    expect(screen.getByText('Mock InstructionsList with contextType: clink')).toBeInTheDocument();
  });

  it('passes custom contextType prop to InstructionsList', () => {
    // Arrange
    const customContextType = 'custom-context';
    
    // Act
    render(<InstructionsVariations contextType={customContextType} />);
    
    // Assert
    expect(screen.getByText(`Mock InstructionsList with contextType: ${customContextType}`)).toBeInTheDocument();
  });

  it('matches snapshot with default props', () => {
    // Arrange & Act
    const { container } = render(<InstructionsVariations />);
    
    // Assert
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom contextType', () => {
    // Arrange & Act
    const { container } = render(<InstructionsVariations contextType="test-context" />);
    
    // Assert
    expect(container.firstChild).toMatchSnapshot();
  });
});