import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Options from './Options.jsx';

const mockIsTokenUser = jest.fn();

jest.mock('moment', () => {
  const mockMoment = (value) => ({
    diff: () => 2,
    format: () => `formatted-${value instanceof Date ? value.toISOString().slice(0, 10) : value}`,
  });
  return mockMoment;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockRenderHtmlInText = jest.fn((text) => text);
jest.mock('v2/helpers/data', () => ({
  renderHtmlInText: (...args) => mockRenderHtmlInText(...args),
}));

jest.mock('v2/helpers/user/subscription', () =>
  jest.fn().mockImplementation(() => ({
    isTokenUser: (...args) => mockIsTokenUser(...args),
  }))
);

const mockTokenModal = jest.fn((props) => (
  <div data-testid="token-modal">
    <div data-testid="token-modal-open-element">{props.openElement}</div>
    {props.externalOpen ? <span data-testid="token-modal-open" /> : null}
  </div>
));

const mockProsperModal = jest.fn(({ render, openButton }) => (
  <div data-testid="prosper-modal">
    <div data-testid="prosper-modal-content">{render()}</div>
    <div data-testid="prosper-modal-open-button">{openButton}</div>
  </div>
));

const StyledModalContent = ({ children }) => (
  <div data-testid="styled-modal-content">{children}</div>
);

jest.mock('v2/apps/prosper/shared/TokenModal', () => {
  const MockTokenModal = (...args) => mockTokenModal(...args);
  return MockTokenModal;
});
jest.mock('v2/apps/prosper/shared/Modal', () => {
  const MockProsperModal = (...args) => mockProsperModal(...args);
  MockProsperModal.StyledModalContent = StyledModalContent;
  return {
    __esModule: true,
    default: MockProsperModal,
    StyledModalContent,
  };
});

jest.mock('v2/apps/prosper/shared/ButtonWrapper', () => {
  const MockButtonWrapper = ({ children, handleClick, className }) => (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
  return MockButtonWrapper;
});

jest.mock('clink-components', () => {
  const React = require('react');
  const Button = React.forwardRef(({ children, ...props }, ref) => (
    <button ref={ref} type="button" {...props}>
      {children}
    </button>
  ));
  Button.displayName = 'Button';
  const Badge = ({ text }) => <span data-testid="badge">{text}</span>;
  const CardLink = ({ children }) => <a href="#link">{children}</a>;
  const Image = ({ alt }) => <img alt={alt} />;
  return {
    __esModule: true,
    Button,
    Badge,
    CardLink,
    Image,
    CONSTANTS: {
      s3: { infoLogoRed: 'info-logo-red' },
      colors: {
        general: {
          white: '#fff',
          darkJungleGreen: '#000',
          japaneseIndigo: '#111',
          lightPeriwinkle: '#eee',
          tealShade: '#0aa',
        },
        prosper: {
          prosperBoxGreen: '#0f0',
          auroMetalSaurus: '#6c757d',
          prosperBoxRed: '#dc3545',
          philippineSilver: '#b3b3b3',
          prosperGrayDisabledText: '#999',
          romanSilver: '#838383',
          lightSlateGray: '#778899',
          iguanaGreen: '#71b370',
          prosperGreenBorder: '#28a745',
          prosperGrayBorder: '#6c757d',
          prosperGrayDisabled: '#e9ecef',
          wildBlueYonder: '#9db4c0',
          quickSilver: '#a1a1a1',
          prosperOuterSpace: '#414a4c',
          dimGray: '#696969',
          veryLightGrey: '#cdcdcd',
          zambezi: '#605856',
          pattensBlue: '#def',
          midnight: '#003366',
          teaGreen: '#c7efcf',
        },
      },
      fonts: { 
        avantGardeGothicPRO: 'font-family' 
      },
      dimensions: { 
        MD_SCREEN: '768px', 
        LG_SCREEN: '1024px' 
      },
      s1Shadows: { 
        elevation1: 'shadow' 
      },
      s2Radius: { 
        sm: '4px' 
      },
    },
  };
});

describe('Package Card Options', () => {
  beforeEach(() => {
    mockIsTokenUser.mockReset();
    mockTokenModal.mockClear();
    mockProsperModal.mockClear();
    mockRenderHtmlInText.mockClear();
  });

  const baseProps = {
    registered: false,
    canRegister: false,
    restrictedMessage: null,
    cardTheme: 'theme',
    handleRegister: jest.fn(),
    subcontractor: {
      membership: { tokens: null },
      canClaimFreeTokens: false,
    },
    tenderReturn: '2099-01-01',
    claimToken: jest.fn(),
    fetchSingleProject: jest.fn(() => Promise.resolve()),
  };

  it('renders submitted button when already registered', () => {
    mockIsTokenUser.mockReturnValue(false);
    render(
      <Options
        {...baseProps}
        registered
      />
    );

    const submittedButton = screen.getByRole('button', { name: 'label-interest-submitted' });
    expect(submittedButton).toBeDisabled();
  });

  it('opens token modal trigger when registration requires tokens', async () => {
    mockIsTokenUser.mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <Options
        {...baseProps}
        restrictedMessage={null}
      />
    );

    expect(mockTokenModal).toHaveBeenCalled();
    expect(mockTokenModal.mock.calls[0][0].externalOpen).toBe(false);

    await user.click(screen.getByRole('button', { name: 'label-register-interest days-remaining' }));

    const latestCall = mockTokenModal.mock.calls[mockTokenModal.mock.calls.length - 1][0];
    expect(latestCall.externalOpen).toBe(true);
  });

  it('renders prosper modal content when registration is restricted without tokens', () => {
    mockIsTokenUser.mockReturnValue(false);

    render(
      <Options
        {...baseProps}
        restrictedMessage={{ message: 'Restriction message', button: { url: '/upgrade', label: 'Upgrade' } }}
      />
    );

    expect(screen.getByText('Restriction message')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    expect(mockProsperModal).toHaveBeenCalled();
  });

  it('invokes handleRegister callback when user can register', async () => {
    mockIsTokenUser.mockReturnValue(false);
    const handleRegister = jest.fn();
    const user = userEvent.setup();

    render(
      <Options
        {...baseProps}
        canRegister
        subcontractor={{ membership: { tokens: 1 } }}
        handleRegister={handleRegister}
      />
    );

    await user.click(screen.getByRole('button', { name: 'label-register-interest days-remaining' }));
    expect(handleRegister).toHaveBeenCalledTimes(1);
  });
});
