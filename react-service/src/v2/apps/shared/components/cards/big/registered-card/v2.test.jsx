import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import RegisteredCardV2 from './v2';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock moment
jest.mock('moment', () => {
  const originalMoment = jest.requireActual('moment');
  return (date) => {
    if (date) {
      return originalMoment(date);
    }
    return originalMoment();
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme, ...props }) => (
    <div data-testid="card" data-theme={theme} {...props}>
      {children}
    </div>
  ),
  CardBody: ({ children, theme, ...props }) => (
    <div data-testid="card-body" data-theme={theme} {...props}>
      {children}
    </div>
  ),
  CardImage: ({ theme, src, alt, ...props }) => (
    <img data-testid="card-image" data-theme={theme} src={src} alt={alt} {...props} />
  ),
  CardTitle: ({ children, theme, ...props }) => (
    <h1 data-testid="card-title" data-theme={theme} {...props}>
      {children}
    </h1>
  ),
  CardInfoLine: ({ children, theme, ...props }) => (
    <div data-testid="card-info-line" data-theme={theme} {...props}>
      {children}
    </div>
  ),
  CardLink: ({ children, theme, disabled, href, ...props }) => (
    <a
      data-testid="card-link"
      data-theme={theme}
      data-disabled={disabled}
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe('RegisteredCardV2', () => {
  const mockT = jest.fn((key) => key);

  beforeEach(() => {
    useTranslation.mockReturnValue({ t: mockT });
    jest.clearAllMocks();
  });

  it('renders card with basic item data', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Test Project');
    expect(screen.getByTestId('card-body')).toBeInTheDocument();
  });

  it('renders with custom card theme', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} cardTheme="custom-theme" />);

    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-title')).toHaveAttribute('data-theme', 'custom-theme');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'custom-theme');
  });

  it('renders card image when provided', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };
    const imageUrl = 'https://example.com/image.jpg';

    render(<RegisteredCardV2 item={mockItem} image={imageUrl} />);

    const cardImage = screen.getByTestId('card-image');
    expect(cardImage).toBeInTheDocument();
    expect(cardImage).toHaveAttribute('src', imageUrl);
    expect(cardImage).toHaveAttribute('alt', 'Test Project');
  });

  it('does not render card image when not provided', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(screen.queryByTestId('card-image')).not.toBeInTheDocument();
  });

  it('renders unlocked date when registeredDate exists', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(mockT).toHaveBeenCalledWith('unlocked');
    expect(screen.getByText('15th January 2023')).toBeInTheDocument();
  });

  it('renders tender tags when they exist', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
      tenderTags: [
        {
          label: 'Construction',
          created_at: '2023-02-01',
        },
        {
          label: 'Electrical',
          created_at: '2023-02-15',
        },
      ],
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(screen.getByText('Construction:')).toBeInTheDocument();
    expect(screen.getByText('1st February 2023')).toBeInTheDocument();
    expect(screen.getByText('Electrical:')).toBeInTheDocument();
    expect(screen.getByText('15th February 2023')).toBeInTheDocument();
  });

  it('renders N/A for tender tags without created_at date', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
      tenderTags: [
        {
          label: 'Construction',
          created_at: null,
        },
      ],
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(screen.getByText('Construction:')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('does not render tender tags when array is empty', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
      tenderTags: [],
    };

    render(<RegisteredCardV2 item={mockItem} />);

    // Should only have one CardInfoLine for unlocked date and one for view details
    const infoLines = screen.getAllByTestId('card-info-line');
    expect(infoLines).toHaveLength(2);
  });

  it('renders view details link with correct href', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    const viewLink = screen.getByTestId('card-link');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink).toHaveAttribute('href', '/projects/1?unlocked_projects');
    expect(viewLink).toHaveAttribute('data-disabled', 'false');
    expect(mockT).toHaveBeenCalledWith('View details');
  });

  it('renders disabled view details link when item is restricted', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: true,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    const viewLink = screen.getByTestId('card-link');
    expect(viewLink).toHaveAttribute('data-disabled', 'true');
  });

  it('renders with default card theme when not provided', () => {
    const mockItem = {
      id: 1,
      name: 'Test Project',
      registeredDate: '2023-01-15',
      viewProject: '/projects/1',
      restricted: false,
    };

    render(<RegisteredCardV2 item={mockItem} />);

    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-big-card');
  });
});