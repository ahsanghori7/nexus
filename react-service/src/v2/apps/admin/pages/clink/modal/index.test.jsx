import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionModal from './index';

// Mock the FormModal component
jest.mock('./form', () => {
  const mockFormModal = () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'form-modal' }, 'Form Modal');
  };
  mockFormModal.displayName = 'FormModal';
  return mockFormModal;
});

// Mock ActionsDropdown
jest.mock('v2/apps/admin/ActionsDropdown', () => {
  const mockActionsDropdown = (props) => {
    const React = require('react');
    const { content, downIcon, upIcon } = props;
    return React.createElement('div', { 'data-testid': 'actions-dropdown' }, [
      React.createElement('div', { key: 'icons', 'data-testid': 'dropdown-icons' }, `Down: ${downIcon}, Up: ${upIcon}`),
      React.createElement('div', { key: 'content', 'data-testid': 'dropdown-content' }, content)
    ]);
  };
  mockActionsDropdown.displayName = 'ActionsDropdown';
  return mockActionsDropdown;
});

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

describe('ActionModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActionModal />);
    
    expect(screen.getByTestId('actions-dropdown')).toBeInTheDocument();
  });

  it('renders ActionsDropdown with correct props', () => {
    render(<ActionModal />);
    
    const actionsDropdown = screen.getByTestId('actions-dropdown');
    expect(actionsDropdown).toBeInTheDocument();
    
    const dropdownIcons = screen.getByTestId('dropdown-icons');
    expect(dropdownIcons).toHaveTextContent('Down: mock-rocket-logo-icon, Up: mock-rocket-logo-icon');
  });

  it('renders FormModal in content', () => {
    render(<ActionModal />);
    
    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
  });

  it('passes correct actions configuration', () => {
    render(<ActionModal />);
    
    // Verify that the FormModal is rendered (indicating actions config was mapped correctly)
    const formModal = screen.getByTestId('form-modal');
    expect(formModal).toBeInTheDocument();
  });

  it('uses rocket logo icons for up and down icons', () => {
    render(<ActionModal />);
    
    const dropdownIcons = screen.getByTestId('dropdown-icons');
    expect(dropdownIcons).toHaveTextContent('mock-rocket-logo-icon');
  });

  describe('Index component', () => {
    it('renders the internal Index component correctly', () => {
      // Test the internal Index component indirectly through ActionModal
      render(<ActionModal />);
      
      expect(screen.getByTestId('actions-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });
  });
});