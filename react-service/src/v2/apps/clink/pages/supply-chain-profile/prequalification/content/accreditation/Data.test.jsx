import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import AccreditationData from './Data';

// Mock dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      alcumus: 'alcumus-icon.png',
      chas: 'chas-icon.png',
      considerate: 'considerate-icon.png',
      constructiOnline: 'construction-online-icon.png',
      smas: 'smas-icon.png',
      iconCertificateGray: 'certificate-gray-icon.png',
    },
    fonts: {
      proxima: 'Proxima Nova',
    },
    colors: {
      general: {
        lightPeriwinkle: '#c5c5d1',
        white: '#ffffff',
        webOrange: '#ff6600',
        darkCharcoal: '#36454f',
        transparentGray: '#808080',
        bostonRed: '#cc3311',
      },
      prosper: {
        prosperBoxGreen: '#28a745',
      },
    },
  },
  Image: ({ src, ...props }) => (
    <img src={src} alt="test-image" data-testid="image" {...props} />
  ),
}));

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => {
      const translations = {
        'expiry-renewal-date': 'Expiry/Renewal Date',
      };
      return translations[key] || key;
    }),
  },
}));

jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn((date) => false), // Default to not expired
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate', () => {
  return function MockExpirationDate({ date, label, ...props }) {
    return (
      <div data-testid="expiration-date" {...props}>
        {label && <span>Label: {label}</span>}
        <span>Date: {date}</span>
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester', () => {
  return function MockRequester({ children, type, aid, data, ...props }) {
    return (
      <div data-testid="requester" data-type={type} data-aid={aid} {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  withStyles: () => (Component) => (props) => <Component {...props} classes={{}} />,
  alpha: jest.fn((color, opacity) => `rgba(${color}, ${opacity})`),
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AccreditationData Component', () => {
  const mockData = {
    label: 'Safe Contractor',
    date: '2025-12-31',
    section: 'accreditation',
  };

  const mockAid = 'test-aid-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with valid accreditation data', () => {
    renderWithTheme(
      <AccreditationData data={mockData} aid={mockAid} />
    );

    expect(screen.getByTestId('image')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
    expect(screen.getByText('Date: 2025-12-31')).toBeInTheDocument();
  });

  it('renders known accreditation icon for safe contractor', () => {
    renderWithTheme(
      <AccreditationData data={mockData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'alcumus-icon.png');
  });

  it('renders known accreditation icon for chas', () => {
    const chasData = { ...mockData, label: 'CHAS' };
    renderWithTheme(
      <AccreditationData data={chasData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'chas-icon.png');
  });

  it('renders known accreditation icon for considerate constructors', () => {
    const considerateData = { ...mockData, label: 'Considerate Constructors' };
    renderWithTheme(
      <AccreditationData data={considerateData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'considerate-icon.png');
  });

  it('renders known accreditation icon for constructionline', () => {
    const constructionlineData = { ...mockData, label: 'ConstructionLine' };
    renderWithTheme(
      <AccreditationData data={constructionlineData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'construction-online-icon.png');
  });

  it('renders known accreditation icon for smas', () => {
    const smasData = { ...mockData, label: 'SMAS' };
    renderWithTheme(
      <AccreditationData data={smasData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'smas-icon.png');
  });

  it('renders default certificate icon for unknown accreditation', () => {
    const unknownData = { ...mockData, label: 'Unknown Accreditation' };
    renderWithTheme(
      <AccreditationData data={unknownData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'certificate-gray-icon.png');
  });

  it('renders default certificate icon for custom certificate', () => {
    const customData = { 
      ...mockData, 
      label: 'Custom Certificate',
      section: 'custom-certificate'
    };
    renderWithTheme(
      <AccreditationData data={customData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'certificate-gray-icon.png');
  });

  it('renders custom label when data is custom', () => {
    const customData = {
      ...mockData,
      custom: true,
      label: 'Custom Certification',
    };
    renderWithTheme(
      <AccreditationData data={customData} aid={mockAid} />
    );

    expect(screen.getByText('Label: Custom Certification')).toBeInTheDocument();
  });

  it('does not render custom label when data is not custom', () => {
    renderWithTheme(
      <AccreditationData data={mockData} aid={mockAid} />
    );

    expect(screen.queryByText(/Label:/)).not.toBeInTheDocument();
  });

  it('renders Requester when data is expired', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(true); // Mock as expired

    renderWithTheme(
      <AccreditationData data={mockData} aid={mockAid} />
    );

    expect(screen.getByTestId('requester')).toBeInTheDocument();
    expect(screen.getByTestId('requester')).toHaveAttribute('data-type', 'accreditation');
    expect(screen.getByTestId('requester')).toHaveAttribute('data-aid', mockAid);
  });

  it('renders Requester when data has no date', () => {
    const dataWithoutDate = { ...mockData, date: null };
    renderWithTheme(
      <AccreditationData data={dataWithoutDate} aid={mockAid} />
    );

    expect(screen.getByTestId('requester')).toBeInTheDocument();
  });

  it('renders Requester with custom-certificate type for custom data', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(true); // Mock as expired

    const customData = { ...mockData, custom: true };
    renderWithTheme(
      <AccreditationData data={customData} aid={mockAid} />
    );

    expect(screen.getByTestId('requester')).toBeInTheDocument();
    expect(screen.getByTestId('requester')).toHaveAttribute('data-type', 'custom-certificate');
  });

  it('renders without Requester wrapper when data is valid and not expired', () => {
    const { expiredDate } = require('v2/helpers/date');
    expiredDate.mockReturnValue(false); // Mock as not expired

    renderWithTheme(
      <AccreditationData data={mockData} aid={mockAid} />
    );

    expect(screen.queryByTestId('requester')).not.toBeInTheDocument();
    expect(screen.getByTestId('image')).toBeInTheDocument();
  });

  it('handles case-insensitive label matching', () => {
    const mixedCaseData = { ...mockData, label: 'safe contractor' };
    renderWithTheme(
      <AccreditationData data={mixedCaseData} aid={mockAid} />
    );

    const image = screen.getByTestId('image');
    expect(image).toHaveAttribute('src', 'alcumus-icon.png');
  });

  it('handles data with missing properties gracefully', () => {
    const incompleteData = {
      label: 'Incomplete Certificate'
    };

    renderWithTheme(
      <AccreditationData data={incompleteData} aid={mockAid} />
    );

    // Component should render with default certificate icon
    expect(screen.getByTestId('image')).toBeInTheDocument();
    expect(screen.getByTestId('image')).toHaveAttribute('src', 'certificate-gray-icon.png');
  });

  it('renders different certificate label variations', () => {
    const specialCharData = {
      ...mockData,
      label: 'ISO 27001:2013 (IT Security)'
    };

    renderWithTheme(
      <AccreditationData data={specialCharData} aid={mockAid} />
    );

    // Should render with default icon since this label is not in the icons map
    expect(screen.getByTestId('image')).toBeInTheDocument();
    expect(screen.getByTestId('image')).toHaveAttribute('src', 'certificate-gray-icon.png');
  });

  it('handles aid prop variations', () => {
    const dataForTest = { ...mockData };

    const { rerender } = renderWithTheme(
      <AccreditationData data={dataForTest} aid="test-123" />
    );

    // Check component renders
    expect(screen.getByTestId('image')).toBeInTheDocument();

    // Check with different aid
    rerender(<AccreditationData data={dataForTest} aid="different-aid" />);
    expect(screen.getByTestId('image')).toBeInTheDocument();

    // Check with undefined aid
    rerender(<AccreditationData data={dataForTest} aid={undefined} />);
    expect(screen.getByTestId('image')).toBeInTheDocument();
  });

  it('renders correctly with very long certificate names', () => {
    const longNameData = {
      ...mockData,
      label: 'Very Long Certificate Name That Should Still Render Properly Without Breaking The Layout Structure'
    };

    renderWithTheme(
      <AccreditationData data={longNameData} aid={mockAid} />
    );

    // Component should render properly regardless of label length
    expect(screen.getByTestId('image')).toBeInTheDocument();
    expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
  });
});