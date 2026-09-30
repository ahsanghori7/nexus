import React from 'react';
import { render, screen } from '@testing-library/react';
import ManagerSystemData from './Data';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'expiry-renewal-date': 'Expiry/Renewal Date',
    };
    return translations[key] || key;
  },
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iso14001: 'iso14001-icon.svg',
      iso9001: 'iso9001-icon.svg',
      ohas18001: 'ohas18001-icon.svg',
    },
    fonts: {
      proxima: 'Proxima Nova, sans-serif',
    },
    colors: {
      general: {
        webOrange: '#ff6b35',
        darkCharcoal: '#333333',
        transparentGray: 'rgba(128, 128, 128, 0.5)',
      },
      prosper: {
        prosperBoxGreen: '#4caf50',
      },
    },
  },
  Image: ({ src, ...props }) => <img src={src} {...props} />,
}));

// Mock date helper
jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn(),
}));

// Mock ExpirationDate component
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate', () => {
  return function MockExpirationDate({ date, expiresOnLabel, ...props }) {
    return (
      <div data-testid="expiration-date" {...props}>
        {expiresOnLabel} {date}
      </div>
    );
  };
});

// Mock Requester component
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester', () => {
  return function MockRequester({ children, aid, type, data, ...props }) {
    return (
      <div data-testid="requester" data-aid={aid} data-type={type} {...props}>
        {children}
      </div>
    );
  };
});

// Mock Material-UI Grid
jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, ...props }) {
    return <div data-testid="grid" {...props}>{children}</div>;
  };
});

// Mock Material-UI alpha function
jest.mock('@mui/material/styles', () => ({
  alpha: jest.fn((color, value) => `rgba(${color}, ${value})`),
  createTheme: jest.fn(() => ({})),
  ThemeProvider: ({ children }) => children,
}));

describe('ManagerSystemData', () => {
  const { expiredDate } = require('v2/helpers/date');
  const { ThemeProvider, createTheme } = require('@mui/material/styles');

  beforeEach(() => {
    expiredDate.mockClear();
  });

  const renderComponent = (props) => {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        <ManagerSystemData {...props} />
      </ThemeProvider>
    );
  };

  describe('with valid date (not expired)', () => {
    beforeEach(() => {
      expiredDate.mockReturnValue(false);
    });

    it('renders ISO 14001:2015 management system correctly', () => {
      const data = {
        label: 'ISO 14001:2015',
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'test-aid' });

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'iso14001-icon.svg');
      
      const expirationDate = screen.getByTestId('expiration-date');
      expect(expirationDate).toHaveTextContent('Expiry/Renewal Date: 2025-12-31');
      
      // Should not be wrapped in Requester when not expired
      expect(screen.queryByTestId('requester')).not.toBeInTheDocument();
    });

    it('renders ISO 9001:2015 management system correctly', () => {
      const data = {
        label: 'ISO 9001:2015',
        date: '2025-06-15',
      };

      renderComponent({ data, aid: 'test-aid' });

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'iso9001-icon.svg');
      
      const expirationDate = screen.getByTestId('expiration-date');
      expect(expirationDate).toHaveTextContent('Expiry/Renewal Date: 2025-06-15');
    });

    it('renders OHSAS 18001 management system correctly', () => {
      const data = {
        label: 'OHSAS 18001',
        date: '2024-12-25',
      };

      renderComponent({ data, aid: 'test-aid' });

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'ohas18001-icon.svg');
      
      const expirationDate = screen.getByTestId('expiration-date');
      expect(expirationDate).toHaveTextContent('Expiry/Renewal Date: 2024-12-25');
    });

    it('renders unknown management system (no icon match)', () => {
      const data = {
        label: 'Custom Management System',
        date: '2025-03-10',
      };

      renderComponent({ data, aid: 'test-aid' });

      const image = screen.getByRole('img');
      // When icon is undefined in the icons mapping, src becomes undefined
      expect(image.src).toBeFalsy();
      
      const expirationDate = screen.getByTestId('expiration-date');
      expect(expirationDate).toHaveTextContent('Expiry/Renewal Date: 2025-03-10');
    });
  });

  describe('with expired date', () => {
    beforeEach(() => {
      expiredDate.mockReturnValue(true);
    });

    it('wraps component in Requester when management system is expired', () => {
      const data = {
        label: 'ISO 14001:2015',
        date: '2023-01-01',
      };

      renderComponent({ data, aid: 'expired-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();
      expect(requester).toHaveAttribute('data-aid', 'expired-aid');
      expect(requester).toHaveAttribute('data-type', 'management-system');

      // Image should still be rendered within the requester
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'iso14001-icon.svg');
    });

    it('handles expired OHSAS 18001 correctly', () => {
      const data = {
        label: 'OHSAS 18001',
        date: '2022-12-31',
      };

      renderComponent({ data, aid: 'ohsas-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();
      expect(requester).toHaveAttribute('data-type', 'management-system');

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'ohas18001-icon.svg');
    });
  });

  describe('with missing date', () => {
    beforeEach(() => {
      expiredDate.mockReturnValue(false);
    });

    it('wraps component in Requester when date is missing', () => {
      const data = {
        label: 'ISO 9001:2015',
        // no date property
      };

      renderComponent({ data, aid: 'no-date-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();
      expect(requester).toHaveAttribute('data-aid', 'no-date-aid');
      expect(requester).toHaveAttribute('data-type', 'management-system');

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'iso9001-icon.svg');
    });

    it('wraps component in Requester when date is null', () => {
      const data = {
        label: 'ISO 14001:2015',
        date: null,
      };

      renderComponent({ data, aid: 'null-date-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();
      expect(requester).toHaveAttribute('data-type', 'management-system');
    });

    it('wraps component in Requester when date is empty string', () => {
      const data = {
        label: 'OHSAS 18001',
        date: '',
      };

      renderComponent({ data, aid: 'empty-date-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();
      expect(requester).toHaveAttribute('data-type', 'management-system');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      expiredDate.mockReturnValue(false);
    });

    it('handles empty data object', () => {
      const data = {};

      renderComponent({ data, aid: 'empty-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();

      const image = screen.getByRole('img');
      expect(image.src).toBeFalsy(); // undefined icon for undefined label
    });

    it('handles data with only label', () => {
      const data = {
        label: 'ISO 9001:2015',
      };

      renderComponent({ data, aid: 'label-only-aid' });

      const requester = screen.getByTestId('requester');
      expect(requester).toBeInTheDocument();

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'iso9001-icon.svg');
    });

    it('calls expiredDate with correct Date object when date exists', () => {
      const data = {
        label: 'ISO 14001:2015',
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'test-aid' });

      expect(expiredDate).toHaveBeenCalledWith(new Date('2025-12-31'));
    });

    it('does not call expiredDate when date is missing', () => {
      const data = {
        label: 'ISO 14001:2015',
      };

      renderComponent({ data, aid: 'test-aid' });

      expect(expiredDate).not.toHaveBeenCalled();
    });

    it('handles case-sensitive label matching', () => {
      const data = {
        label: 'iso 14001:2015', // lowercase
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'case-test-aid' });

      const image = screen.getByRole('img');
      // Should not match due to case sensitivity
      expect(image.src).toBeFalsy();
    });

    it('handles partial label matching', () => {
      const data = {
        label: 'ISO 14001', // missing :2015
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'partial-test-aid' });

      const image = screen.getByRole('img');
      // Should not match partial labels
      expect(image.src).toBeFalsy();
    });

    it('handles extremely long label strings', () => {
      const data = {
        label: 'This is an extremely long management system label that should not match any icon',
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'long-label-aid' });

      const image = screen.getByRole('img');
      expect(image.src).toBeFalsy();
      
      const expirationDate = screen.getByTestId('expiration-date');
      expect(expirationDate).toHaveTextContent('Expiry/Renewal Date: 2025-12-31');
    });

    it('handles special characters in labels', () => {
      const data = {
        label: 'ISO 14001:2015 (Updated)',
        date: '2025-12-31',
      };

      renderComponent({ data, aid: 'special-char-aid' });

      const image = screen.getByRole('img');
      expect(image.src).toBeFalsy(); // Should not match due to extra text
    });

    it('verifies correct aid prop passing to Requester', () => {
      const data = { label: 'Test System' };
      const testAid = 'specific-test-aid-12345';

      renderComponent({ data, aid: testAid });

      const requester = screen.getByTestId('requester');
      expect(requester).toHaveAttribute('data-aid', testAid);
    });
  });
});