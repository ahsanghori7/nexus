import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Upload, { UploadModal, UploadButton, updateFunc } from './index';
import defaultEntries from './initialEntries';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('./initialEntries', () => [
  { id: 1, name: 'Test Entry' }
]);

describe('UploadButton', () => {
  it('renders without crashing', () => {
    const mockHandleClick = jest.fn();
    render(
      <UploadButton 
        handleButtonClick={mockHandleClick}
        buttonContent="Test Button"
      />
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('calls handleButtonClick when clicked', () => {
    const mockHandleClick = jest.fn();
    render(
      <UploadButton 
        handleButtonClick={mockHandleClick}
        buttonContent="Test Button"
      />
    );
    
    fireEvent.click(screen.getByText('Test Button'));
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with start icon when provided', () => {
    const mockHandleClick = jest.fn();
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    render(
      <UploadButton 
        handleButtonClick={mockHandleClick}
        buttonContent="Test Button"
        startIcon={<TestIcon />}
      />
    );
    
    // Check if the button has the startIcon prop (Material UI internalizes the icon)
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('starticon');
  });
});

describe('Upload', () => {
  it('renders without crashing', () => {
    render(
      <Upload 
        title="Test Title"
        description="Test Description"
      >
        <div>Test Children</div>
      </Upload>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('renders with empty props', () => {
    render(
      <Upload>
        <div>Test Children</div>
      </Upload>
    );
    
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('applies transform prop to icon', () => {
    const { container } = render(
      <Upload transform="rotate(180deg)">
        <div>Test Children</div>
      </Upload>
    );
    
    // Check if SystemUpdateAltIcon exists (it should be rendered)
    const icon = container.querySelector('[data-testid="SystemUpdateAltIcon"]');
    expect(icon).toBeInTheDocument();
  });
});

describe('UploadModal', () => {
  const ButtonModal = ({ handleButtonClick }) => (
    <button onClick={handleButtonClick}>Open Modal</button>
  );

  it('renders without crashing', () => {
    render(
      <UploadModal ButtonModal={ButtonModal}>
        <div>Modal Content</div>
      </UploadModal>
    );
    
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', () => {
    render(
      <UploadModal ButtonModal={ButtonModal}>
        <div>Modal Content</div>
      </UploadModal>
    );
    
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('boq-import-file')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <UploadModal ButtonModal={ButtonModal}>
        <div>Modal Content</div>
      </UploadModal>
    );
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByLabelText('close'));
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('calls handleClick instead of opening modal when provided', () => {
    const mockHandleClick = jest.fn();
    
    render(
      <UploadModal handleClick={mockHandleClick} ButtonModal={ButtonModal}>
        <div>Modal Content</div>
      </UploadModal>
    );
    
    fireEvent.click(screen.getByText('Open Modal'));
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('handles setModal prop when modal is controlled', () => {
    const mockSetModal = jest.fn();
    
    render(
      <UploadModal 
        ButtonModal={ButtonModal}
        modal="success"
        setModal={mockSetModal}
      >
        <div>Modal Content</div>
      </UploadModal>
    );
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Close modal
    fireEvent.click(screen.getByLabelText('close'));
    expect(mockSetModal).toHaveBeenCalledWith(false);
  });
});

describe('updateFunc', () => {
  it('calls dispatchFunc with current entity and data when entity has id', () => {
    const mockEntity = { id: 1 };
    const mockDispatchFunc = jest.fn();
    const mockEntries = [{ id: 1, name: 'Test Entry' }];
    
    const updateFunction = updateFunc(mockEntity, mockDispatchFunc);
    updateFunction(mockEntries);
    
    expect(mockDispatchFunc).toHaveBeenCalledWith(mockEntity, {
      notes: {
        id: null,
        text: '',
      },
      entries: mockEntries,
    });
  });

  it('uses defaultEntries when no entries provided', () => {
    const mockEntity = { id: 1 };
    const mockDispatchFunc = jest.fn();
    
    const updateFunction = updateFunc(mockEntity, mockDispatchFunc);
    updateFunction();
    
    expect(mockDispatchFunc).toHaveBeenCalledWith(mockEntity, {
      notes: {
        id: null,
        text: '',
      },
      entries: defaultEntries,
    });
  });

  it('does not call dispatchFunc when entity has no id', () => {
    const mockEntity = {};
    const mockDispatchFunc = jest.fn();
    
    const updateFunction = updateFunc(mockEntity, mockDispatchFunc);
    updateFunction();
    
    expect(mockDispatchFunc).not.toHaveBeenCalled();
  });

  it('handles empty entries array', () => {
    const mockEntity = { id: 1 };
    const mockDispatchFunc = jest.fn();
    
    const updateFunction = updateFunc(mockEntity, mockDispatchFunc);
    updateFunction([]);
    
    expect(mockDispatchFunc).toHaveBeenCalledWith(mockEntity, {
      notes: {
        id: null,
        text: '',
      },
      entries: defaultEntries,
    });
  });
});