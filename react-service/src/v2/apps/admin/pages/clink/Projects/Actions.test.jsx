import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Actions from './Actions';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

// Mock the shared components
jest.mock('v2/apps/shared/components/confirm-modal', () => {
  const mockReact = require('react');
  return mockReact.forwardRef((props, ref) => {
    const { buttonLabel, handleConfirm, data, selected } = props;
    return mockReact.createElement('div', {
      ...props,
      ref,
      'data-testid': `confirm-modal-${data?.id || 'unknown'}`,
      className: selected ? 'selected' : ''
    }, [
      mockReact.createElement('button', {
        key: 'confirm-button',
        'data-testid': `confirm-button-${data?.id || 'unknown'}`,
        onClick: () => handleConfirm && handleConfirm(data)
      }, buttonLabel)
    ]);
  });
});

describe('Actions Component', () => {
  const mockProject = {
    id: 1,
    name: 'Test Project',
    status: 'active'
  };

  const mockProjectsActions = [
    {
      id: 1,
      text: 'Change Status',
      align: 'left'
    }
  ];

  const mockStatusList = [
    {
      id: 1,
      label: 'Active'
    },
    {
      id: 2,
      label: 'Inactive'
    },
    {
      id: 3,
      label: 'Pending'
    }
  ];

  const mockHandleConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing with valid props', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    expect(screen.getByTestId('justify')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('displays correct number of status options in dropdown', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    // Click to open dropdown
    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);

    // Check that all status options are rendered
    mockStatusList.forEach(status => {
      expect(screen.getByTestId(`confirm-modal-${status.id}`)).toBeInTheDocument();
    });
  });

  it('marks selected status correctly', () => {
    const projectWithActiveStatus = {
      ...mockProject,
      status: 'Active'
    };

    render(
      <Actions
        project={projectWithActiveStatus}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    // Click to open dropdown
    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);

    // Check that the Active status is marked as selected
    const activeModal = screen.getByTestId('confirm-modal-1');
    expect(activeModal).toHaveClass('selected');
  });

  it('calls handleConfirm when status is clicked', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    // Click to open dropdown
    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);

    // Click on a status button
    const statusButton = screen.getByTestId('confirm-button-1');
    fireEvent.click(statusButton);

    // Check that handleConfirm was called with the correct data
    expect(mockHandleConfirm).toHaveBeenCalledWith(mockStatusList[0]);
  });

  it('handles case-insensitive status comparison', () => {
    const projectWithLowerCaseStatus = {
      ...mockProject,
      status: 'active' // lowercase
    };

    const statusListWithUpperCase = [
      { id: 1, label: 'Active' }, // uppercase
      { id: 2, label: 'Inactive' }
    ];

    render(
      <Actions
        project={projectWithLowerCaseStatus}
        projectsActions={mockProjectsActions}
        statusList={statusListWithUpperCase}
        handleConfirm={mockHandleConfirm}
      />
    );

    // Click to open dropdown
    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);

    // Check that the Active status is marked as selected despite case difference
    const activeModal = screen.getByTestId('confirm-modal-1');
    expect(activeModal).toHaveClass('selected');
  });

  it('toggles dropdown open/close state', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    const openDropdownButton = screen.getByTestId('open-dropdown');
    
    // Initially closed - dropdown content should not be visible
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(openDropdownButton);
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();

    // Click to close
    fireEvent.click(openDropdownButton);
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
  });

  it('renders with empty status list but valid actions', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={[]}
        handleConfirm={mockHandleConfirm}
      />
    );

    expect(screen.getByTestId('justify')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    
    // Click to open dropdown - should not show any status options
    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);
    
    // No confirm modals should be present since statusList is empty
    expect(screen.queryByTestId(/confirm-modal-/)).not.toBeInTheDocument();
  });

  it('renders dropdown content when opened with multiple status options', () => {
    render(
      <Actions
        project={mockProject}
        projectsActions={mockProjectsActions}
        statusList={mockStatusList}
        handleConfirm={mockHandleConfirm}
      />
    );

    const openDropdownButton = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdownButton);

    // Check dropdown content is visible
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    
    // Check that all status options are present
    expect(screen.getByTestId('confirm-modal-1')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-modal-2')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-modal-3')).toBeInTheDocument();
  });
});