import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockInfoTooltip = jest.fn(() => <div data-testid="info-tooltip" />);

jest.mock('v2/apps/shared/components/cards/big/InfoTooltip', () => ({
  __esModule: true,
  default: (props) => mockInfoTooltip(props),
}));

const mockOptions = jest.fn(() => <div data-testid="options-component" />);

jest.mock('./Options', () => ({
  __esModule: true,
  default: (props) => mockOptions(props),
}));

jest.mock('clink-components', () => {
  const React = require('react');

  const Card = ({ children, ...props }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  );

  const CardBody = ({ children }) => (
    <div data-testid="card-body">{children}</div>
  );

  const CardInfoLine = ({ children }) => (
    <div data-testid="card-info-line">{children}</div>
  );

  const CardLink = ({ children, href, disabled }) => (
    <a data-testid="card-link" href={href} data-disabled={disabled ? 'true' : 'false'}>
      {children}
    </a>
  );

  const CardTitle = ({ children }) => (
    <h2 data-testid="card-title">{children}</h2>
  );

  const CardImage = ({ alt, src }) => (
    <img data-testid="card-image" alt={alt} src={src} />
  );

  const Image = ({ alt, src }) => (
    <img data-testid="image" alt={alt} src={src} />
  );

  const Badge = ({ text }) => (
    <span data-testid="badge">{text}</span>
  );

  return {
    __esModule: true,
    CONSTANTS: {
      s3: {
        closedIcon: 'closed-icon.svg',
      },
    },
    Card,
    CardBody,
    CardInfoLine,
    CardLink,
    CardTitle,
    CardImage,
    Image,
    Badge,
  };
});

const createStyledMock = (testId) => ({ children, ...props }) => (
  <div data-testid={testId} {...props}>
    {children}
  </div>
);

jest.mock('./styled', () => ({
  __esModule: true,
  StyledCardItemHead: createStyledMock('styled-card-item-head'),
  StyledCardItemHeadTitle: createStyledMock('styled-card-item-head-title'),
  StyledCardItemHeadDescription: createStyledMock('styled-card-item-head-description'),
  StyledCardItemInfoSubtitle: createStyledMock('styled-card-item-info-subtitle'),
  StyledCardItemHeadTags: createStyledMock('styled-card-item-head-tags'),
  StyledCardItemHeadInfo: createStyledMock('styled-card-item-head-info'),
  StyledCardItemInfoTradesSubtitle: createStyledMock('styled-card-item-info-trades-subtitle'),
  StyledCardInfoDescription: createStyledMock('styled-card-info-description'),
  StyledCardInfoTradesDescription: createStyledMock('styled-card-info-trades-description'),
  StyledCardItemClosed: createStyledMock('styled-card-item-closed'),
  StyledCardItemClosedImage: createStyledMock('styled-card-item-closed-image'),
  StyledCardItemClosedText: createStyledMock('styled-card-item-closed-text'),
  StyledCardItemTrades: createStyledMock('styled-card-item-trades'),
  StyledInfoLineWrapper: createStyledMock('styled-info-line-wrapper'),
}));

import PackageCard from './index.jsx';

describe('PackageCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders closed badge, interest count, and trade tags when package is closed', () => {
    // Arrange
    const pack = {
      id: 'pkg-1',
      label: 'Electrical works',
      service: 'Electrical',
      tender_return: '2024-03-10T00:00:00Z',
      start_on_site: '2024-04-01T00:00:00Z',
      size: '£500k',
      packages: ['Tag A', 'Tag B'],
      interest_count: 9,
      matched: true,
      awarded: true,
      can_register: false,
      registered: true,
      cardTheme: 'prosper-package-card',
    };

    // Act
    render(
      <PackageCard
        pack={pack}
        subcontractor={{}}
        handleRegister={jest.fn()}
        claimToken={jest.fn()}
        fetchSingleProject={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId('styled-card-item-closed')).toBeInTheDocument();
    expect(screen.getByText('opportunity-closed')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('5+')).toBeInTheDocument();
    expect(mockOptions).not.toHaveBeenCalled();
  });

  test('passes expected props to Options when package is matched and open', () => {
    // Arrange
    const handleRegister = jest.fn();
    const pack = {
      id: 'pkg-2',
      label: 'Roofing',
      service: 'Roofing Service',
      tender_return: '2024-05-15T00:00:00Z',
      start_on_site: '2024-06-20T00:00:00Z',
      size: '£1m',
      packages: ['Roof'],
      interest_count: 3,
      matched: true,
      awarded: false,
      can_register: true,
      registered: false,
      can_register_message: 'Register now',
      cardTheme: 'prosper-package-card',
    };

    // Act
    render(
      <PackageCard
        pack={pack}
        subcontractor={{ id: 'sub-1' }}
        handleRegister={handleRegister}
        claimToken={jest.fn()}
        fetchSingleProject={jest.fn()}
      />
    );

    // Assert
    expect(mockOptions).toHaveBeenCalledTimes(1);
    const optionsProps = mockOptions.mock.calls[0][0];
    expect(optionsProps.registered).toBe(false);
    expect(optionsProps.canRegister).toBe(true);
    expect(optionsProps.restrictedMessage).toBe('Register now');

    // Act
    optionsProps.handleRegister();

    // Assert
    expect(handleRegister).toHaveBeenCalledWith('pkg-2');
    expect(screen.getByText('Roofing')).toBeInTheDocument();
    expect(screen.getAllByText('Roof').length).toBeGreaterThan(0);
    expect(mockInfoTooltip).toHaveBeenCalledTimes(1);
  });
});

