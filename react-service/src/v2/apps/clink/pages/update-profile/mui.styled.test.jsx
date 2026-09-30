import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Material-UI
jest.mock('@mui/material/Box', () => ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div>);
jest.mock('@mui/material/Typography', () => ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div>);
jest.mock('@mui/material/Modal', () => ({ children, open, onClose, ...props }) => open ? <div data-testid="modal" onClick={onClose} {...props}>{children}</div> : null);
jest.mock('@mui/material/Card', () => ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>);
jest.mock('@mui/material/CardContent', () => ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>);
jest.mock('@mui/material/Grid', () => ({ children, ...props }) => <div data-testid="grid" {...props}>{children}</div>);
jest.mock('@mui/material/Avatar', () => ({ src, ...props }) => <div data-testid="avatar" data-src={src} {...props} />);
jest.mock('@mui/material/IconButton', () => ({ children, ...props }) => <button data-testid="icon-button" {...props}>{children}</button>);
jest.mock('@mui/icons-material/Image', () => () => <span>📷</span>);
jest.mock('@mui/icons-material/PhotoCamera', () => () => <span>📸</span>);

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({ __esModule: true, default: { t: (key) => key } }));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: { colors: { general: { clinkGreen: '#00ff00', clinkPurple: '#800080', clinkRed: '#ff0000', white: '#ffffff' } } }
}));

import { SaveWrapper, MuiTitle, ModalBox, PasswordValidationBox, RepeatPasswordValidationBox, AvatarUpload } from './mui.styled';

describe('mui.styled components', () => {
  it('renders SaveWrapper', () => {
    render(<SaveWrapper><button>Save</button></SaveWrapper>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders MuiTitle', () => {
    render(<MuiTitle>Title</MuiTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders ModalBox when open', () => {
    render(<ModalBox open={true} title="Test" description="Desc" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('hides ModalBox when closed', () => {
    render(<ModalBox open={false} title="Test" />);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders PasswordValidationBox', () => {
    const rules = [{ valid: true, message: 'Valid' }];
    render(<PasswordValidationBox rules={rules} />);
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('renders RepeatPasswordValidationBox', () => {
    render(<RepeatPasswordValidationBox match={true} />);
    expect(screen.getByTestId('box')).toBeInTheDocument();
  });

  it('renders AvatarUpload', () => {
    render(<AvatarUpload avatar="test.jpg" handleLogoUpload={() => {}} />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('handles AvatarUpload file change with valid size', () => {
    const mockHandleUpload = jest.fn();
    render(<AvatarUpload avatar="test.jpg" handleLogoUpload={mockHandleUpload} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsDataURL: jest.fn(function() {
        this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      })
    };
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Mock Image with valid size
    const mockImage = {
      onload: null,
      width: 100,
      height: 100
    };
    global.Image = jest.fn(() => mockImage);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    // Trigger image onload
    mockImage.onload();
    
    expect(mockHandleUpload).toHaveBeenCalled();
  });

  it('handles AvatarUpload file change with oversized image', () => {
    const mockHandleUpload = jest.fn();
    render(<AvatarUpload avatar="test.jpg" handleLogoUpload={mockHandleUpload} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsDataURL: jest.fn(function() {
        this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      })
    };
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Mock Image with oversized dimensions
    const mockImage = {
      onload: null,
      width: 200,
      height: 200
    };
    global.Image = jest.fn(() => mockImage);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    // Trigger image onload
    mockImage.onload();
    
    // Should not call handleLogoUpload due to size restriction
    expect(mockHandleUpload).not.toHaveBeenCalled();
  });

  it('handles PasswordValidationBox with multiple rules', () => {
    const rules = [
      { valid: true, message: 'Valid rule 1' },
      { valid: false, message: 'Invalid rule 2' },
      { valid: true, message: 'Valid rule 3' }
    ];
    render(<PasswordValidationBox rules={rules} />);
    
    expect(screen.getByText('Valid rule 1')).toBeInTheDocument();
    expect(screen.getByText('Invalid rule 2')).toBeInTheDocument();
    expect(screen.getByText('Valid rule 3')).toBeInTheDocument();
  });

  it('handles RepeatPasswordValidationBox with false match', () => {
    render(<RepeatPasswordValidationBox match={false} />);
    expect(screen.getByTestId('box')).toBeInTheDocument();
  });

  it('handles ModalBox with onClose callback', () => {
    const mockOnClose = jest.fn();
    render(<ModalBox open={true} onClose={mockOnClose} title="Test Modal" description="Test Description" />);
    
    const modal = screen.getByTestId('modal');
    fireEvent.click(modal);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
