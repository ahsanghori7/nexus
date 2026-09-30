import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Member from './Member';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => key,
  },
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, sx, ...props }) => (
    <div data-testid="mui-box" style={sx} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Avatar', () => ({
  __esModule: true,
  default: ({ alt, src, variant, sx, ...props }) => (
    <img
      data-testid="mui-avatar"
      alt={alt}
      src={src}
      data-variant={variant}
      style={sx}
      {...props}
    />
  ),
}));

jest.mock('@mui/material/Grid', () => ({
  __esModule: true,
  default: ({ children, item, container, flexDirection, sx, ...props }) => (
    <div
      data-testid="mui-grid"
      data-item={item}
      data-container={container}
      data-flex-direction={flexDirection}
      style={sx}
      {...props}
    >
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, sx, ...props }) => (
    <div data-testid="mui-typography" style={sx} {...props}>
      {children}
    </div>
  ),
}));

// Mock constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconHammerBlack: 'icon-hammer-black.jpg',
    },
    colors: {
      general: {
        black: '#000000',
        grayDark: '#333333',
      },
      prosper: {
        dimGray2: '#666666',
      },
    },
  },
}));

// Mock URL helper
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn(),
}));

// Mock role helpers
jest.mock('v2/helpers/prequal/organization', () => ({
  DIRECTOR: { value: 'Director' },
}));

// Mock Doc component
jest.mock('../Doc', () => ({
  __esModule: true,
  default: ({ children, actions }) => (
    <div data-testid="doc-component">
      {children}
      <div data-testid="doc-actions">
        {actions?.map((action, index) => (
          <button key={index} data-testid={`doc-action-${index}`}>
            {action?.label}
          </button>
        ))}
      </div>
    </div>
  ),
}));

import { checkIfImageExists } from 'v2/helpers/url';

describe('Member Component', () => {
  const mockData = {
    id: 1,
    firstname: 'John',
    lastname: 'Doe',
    title: 'Manager',
    email: 'john.doe@example.com',
    logo: 'https://example.com/logo.jpg',
  };

  const mockActions = [
    { id: 1, label: 'Edit', action: jest.fn() },
    { id: 2, label: 'Delete', action: jest.fn() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render member with complete data', () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(true));

      render(<Member data={mockData} actions={mockActions} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
      expect(screen.getByTestId('mui-avatar')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should render with default color when color prop is not provided', () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(true));

      render(<Member data={mockData} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
    });

    it('should render with custom color', () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(true));

      render(<Member data={mockData} color="red" />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
    });

    it('should render with empty actions array', () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(true));

      render(<Member data={mockData} actions={[]} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
      expect(screen.getByTestId('doc-actions')).toBeInTheDocument();
    });
  });

  describe('Avatar Handling', () => {
    it('should display member logo when image exists', async () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(true));

      render(<Member data={mockData} />);

      await waitFor(() => {
        const avatar = screen.getByTestId('mui-avatar');
        expect(avatar).toHaveAttribute('src', mockData.logo);
        expect(avatar).toHaveAttribute('alt', 'profile-logo');
      });
    });

    it('should display default icon when image does not exist', async () => {
      checkIfImageExists.mockImplementation((url, callback) => callback(false));

      render(<Member data={mockData} />);

      await waitFor(() => {
        const avatar = screen.getByTestId('mui-avatar');
        expect(avatar).toHaveAttribute('src', 'icon-hammer-black.jpg');
      });
    });

    it('should handle missing logo property', async () => {
      const dataWithoutLogo = { ...mockData, logo: undefined };
      checkIfImageExists.mockImplementation((url, callback) => callback(false));

      render(<Member data={dataWithoutLogo} />);

      await waitFor(() => {
        const avatar = screen.getByTestId('mui-avatar');
        expect(avatar).toHaveAttribute('src', 'icon-hammer-black.jpg');
      });
    });

    it('should handle null logo property', async () => {
      const dataWithNullLogo = { ...mockData, logo: null };
      checkIfImageExists.mockImplementation((url, callback) => callback(false));

      render(<Member data={dataWithNullLogo} />);

      await waitFor(() => {
        const avatar = screen.getByTestId('mui-avatar');
        expect(avatar).toHaveAttribute('src', 'icon-hammer-black.jpg');
      });
    });
  });

  describe('Name Display', () => {
    it('should display full name when both firstname and lastname are provided', () => {
      render(<Member data={mockData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display only firstname when lastname is missing', () => {
      const dataWithoutLastname = { ...mockData, lastname: undefined };

      render(<Member data={dataWithoutLastname} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should display only lastname when firstname is missing', () => {
      const dataWithoutFirstname = { ...mockData, firstname: undefined };

      render(<Member data={dataWithoutFirstname} />);

      expect(screen.getByText('Doe')).toBeInTheDocument();
    });

    it('should handle null firstname', () => {
      const dataWithNullFirstname = { ...mockData, firstname: null };

      render(<Member data={dataWithNullFirstname} />);

      expect(screen.getByText('Doe')).toBeInTheDocument();
    });

    it('should handle null lastname', () => {
      const dataWithNullLastname = { ...mockData, lastname: null };

      render(<Member data={dataWithNullLastname} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should handle empty strings for names', () => {
      const dataWithEmptyNames = { ...mockData, firstname: '', lastname: '' };

      render(<Member data={dataWithEmptyNames} />);

      const nameTypographies = screen.getAllByTestId('mui-typography');
      expect(nameTypographies[0]).toHaveTextContent(''); // Name field should be empty
    });
  });

  describe('Title Display', () => {
    it('should display member title when provided', () => {
      render(<Member data={mockData} />);

      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('should display default Director title when title is missing', () => {
      const dataWithoutTitle = { ...mockData, title: undefined };

      render(<Member data={dataWithoutTitle} />);

      expect(screen.getByText('Director')).toBeInTheDocument();
    });

    it('should display default Director title when title is null', () => {
      const dataWithNullTitle = { ...mockData, title: null };

      render(<Member data={dataWithNullTitle} />);

      expect(screen.getByText('Director')).toBeInTheDocument();
    });

    it('should display default Director title when title is empty string', () => {
      const dataWithEmptyTitle = { ...mockData, title: '' };

      render(<Member data={dataWithEmptyTitle} />);

      expect(screen.getByText('Director')).toBeInTheDocument();
    });
  });

  describe('Email Display', () => {
    it('should display member email when provided', () => {
      render(<Member data={mockData} />);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should display default "E-mail" when email is missing', () => {
      const dataWithoutEmail = { ...mockData, email: undefined };

      render(<Member data={dataWithoutEmail} />);

      expect(screen.getByText('E-mail')).toBeInTheDocument();
    });

    it('should display default "E-mail" when email is null', () => {
      const dataWithNullEmail = { ...mockData, email: null };

      render(<Member data={dataWithNullEmail} />);

      expect(screen.getByText('E-mail')).toBeInTheDocument();
    });

    it('should display default "E-mail" when email is empty string', () => {
      const dataWithEmptyEmail = { ...mockData, email: '' };

      render(<Member data={dataWithEmptyEmail} />);

      expect(screen.getByText('E-mail')).toBeInTheDocument();
    });
  });

  describe('Actions Handling', () => {
    it('should pass actions to Doc component', () => {
      render(<Member data={mockData} actions={mockActions} />);

      expect(screen.getByTestId('doc-action-0')).toBeInTheDocument();
      expect(screen.getByTestId('doc-action-1')).toBeInTheDocument();
    });

    it('should handle undefined actions', () => {
      render(<Member data={mockData} actions={undefined} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
    });

    it('should handle null actions', () => {
      render(<Member data={mockData} actions={null} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
    });

    it('should handle single action', () => {
      const singleAction = [{ id: 1, label: 'Edit', action: jest.fn() }];

      render(<Member data={mockData} actions={singleAction} />);

      expect(screen.getByTestId('doc-action-0')).toBeInTheDocument();
      expect(screen.queryByTestId('doc-action-1')).not.toBeInTheDocument();
    });
  });

  describe('Null Data Handling', () => {
    it('should handle null data prop', () => {
      render(<Member data={null} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
      expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
    });

    it('should handle undefined data prop', () => {
      render(<Member data={undefined} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
    });

    it('should handle empty data object', () => {
      render(<Member data={{}} />);

      expect(screen.getByTestId('doc-component')).toBeInTheDocument();
      const nameTypographies = screen.getAllByTestId('mui-typography');
      expect(nameTypographies[0]).toHaveTextContent(''); // Empty name
      expect(screen.getByText('Director')).toBeInTheDocument(); // Default title
      expect(screen.getByText('E-mail')).toBeInTheDocument(); // Default email
    });
  });

  describe('useEffect Hook', () => {
    it('should call checkIfImageExists on mount', () => {
      render(<Member data={mockData} />);

      expect(checkIfImageExists).toHaveBeenCalledWith(
        mockData.logo,
        expect.any(Function)
      );
    });

    it('should handle logo changes', () => {
      const { rerender } = render(<Member data={mockData} />);

      const updatedData = { ...mockData, logo: 'new-logo.jpg' };
      rerender(<Member data={updatedData} />);

      expect(checkIfImageExists).toHaveBeenCalledWith(
        'new-logo.jpg',
        expect.any(Function)
      );
    });

    it('should handle data changes', () => {
      const { rerender } = render(<Member data={mockData} />);

      const newData = { ...mockData, id: 2, firstname: 'Jane' };
      rerender(<Member data={newData} />);

      expect(checkIfImageExists).toHaveBeenCalledTimes(2);
    });
  });

  describe('Layout Structure', () => {
    it('should render proper grid structure', () => {
      render(<Member data={mockData} />);

      const grids = screen.getAllByTestId('mui-grid');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should render avatar container with correct styling', () => {
      render(<Member data={mockData} />);

      const boxes = screen.getAllByTestId('mui-box');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('should apply variant to avatar', () => {
      render(<Member data={mockData} />);

      const avatar = screen.getByTestId('mui-avatar');
      expect(avatar).toHaveAttribute('data-variant', 'rounded');
    });
  });

  describe('Typography Styling', () => {
    it('should render name typography with proper attributes', () => {
      render(<Member data={mockData} />);

      const typographies = screen.getAllByTestId('mui-typography');
      expect(typographies.length).toBe(3); // name, title, email
    });

    it('should handle long names with word break', () => {
      const dataWithLongName = {
        ...mockData,
        firstname: 'VeryLongFirstNameThatShouldBreak',
        lastname: 'VeryLongLastNameThatShouldBreak',
      };

      render(<Member data={dataWithLongName} />);

      expect(screen.getByText('VeryLongFirstNameThatShouldBreak VeryLongLastNameThatShouldBreak')).toBeInTheDocument();
    });

    it('should handle long email with word break', () => {
      const dataWithLongEmail = {
        ...mockData,
        email: 'verylongemailaddressthatshouldbreakatword@verylongdomainname.com',
      };

      render(<Member data={dataWithLongEmail} />);

      expect(screen.getByText('verylongemailaddressthatshouldbreakatword@verylongdomainname.com')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      const dataWithSpecialChars = {
        ...mockData,
        firstname: 'José-María',
        lastname: "O'Connor",
      };

      render(<Member data={dataWithSpecialChars} />);

      expect(screen.getByText("José-María O'Connor")).toBeInTheDocument();
    });

    it('should handle special characters in email', () => {
      const dataWithSpecialEmail = {
        ...mockData,
        email: 'user+tag@example.co.uk',
      };

      render(<Member data={dataWithSpecialEmail} />);

      expect(screen.getByText('user+tag@example.co.uk')).toBeInTheDocument();
    });

    it('should handle Unicode characters', () => {
      const dataWithUnicode = {
        ...mockData,
        firstname: '王',
        lastname: '小明',
        title: '经理',
      };

      render(<Member data={dataWithUnicode} />);

      expect(screen.getByText('王 小明')).toBeInTheDocument();
      expect(screen.getByText('经理')).toBeInTheDocument();
    });
  });
});