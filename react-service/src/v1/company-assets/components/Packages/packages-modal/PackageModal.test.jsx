// Import React and test utilities
import React from 'react';
import { render, screen } from '@testing-library/react';
import PackageModal from './index';

// Mock the Content component
jest.mock('./Content', () => {
  return jest.fn().mockImplementation((props) => (
    <div data-testid="content-component">
      Mock Content Component
      <div data-testid="templates-count">
        Templates count: {props.templates.length}
      </div>
    </div>
  ));
});

// Mock the Modal component
jest.mock('v1/global/components/modal/v2', () => {
  return jest.fn().mockImplementation((props) => {
    // Extract the ShowButton component
    const ButtonComponent = props.ShowButton;

    // Simulate the render function (without actually opening modal)
    const renderContent = props.render
      ? props.render({ setShow: jest.fn() })
      : null;

    return (
      <div data-testid="modal-component" className={props.className}>
        <div data-testid="modal-title">{props.title}</div>
        <div data-testid="modal-subtitle">{props.subtitle}</div>
        {ButtonComponent && <ButtonComponent handleClick={jest.fn()} />}
        {renderContent && (
          <div data-testid="modal-content">{renderContent}</div>
        )}
      </div>
    );
  });
});

describe('PackageModal Component', () => {
  const mockProps = {
    renameTemplate: jest.fn(),
    label: 'Create Template',
    addTemplate: jest.fn(),
    templates: [
      { id: 1, name: 'Template 1' },
      { id: 2, name: 'Template 2' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with proper props', () => {
    render(<PackageModal {...mockProps} />);

    // Check if modal renders correctly
    const modalComponent = screen.getByTestId('modal-component');
    expect(modalComponent).toBeInTheDocument();
    expect(modalComponent).toHaveClass('modal-create-package');

    // Verify title and subtitle
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Create new package template'
    );
    expect(screen.getByTestId('modal-subtitle')).toHaveTextContent(
      'Enter name for the new scope of works template.'
    );

    // Verify the content is pre-rendered (our mock always renders it)
    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toBeInTheDocument();

    // Verify Content component receives proper props
    const templatesCount = screen.getByTestId('templates-count');
    expect(templatesCount).toHaveTextContent('Templates count: 2');
  });

  test('renders with empty label', () => {
    const propsWithEmptyLabel = {
      ...mockProps,
      label: '',
    };

    render(<PackageModal {...propsWithEmptyLabel} />);

    // Modal should still render with empty label
    const modalComponent = screen.getByTestId('modal-component');
    expect(modalComponent).toBeInTheDocument();
  });
});
