import React from 'react';
import { render, screen } from '@testing-library/react';
import Settings from './Settings';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock helpers/url
jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn(() => '/mocked-url'),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxGreen: '#00ff00',
        prosperBoxRed: '#ff0000',
      },
    },
  },
}));

describe('Settings Component', () => {
  const defaultProps = {
    text: 'Test settings text',
  };

  it('renders without crashing', () => {
    render(<Settings {...defaultProps} />);
    expect(screen.getByText('Test settings text')).toBeInTheDocument();
  });

  it('displays the provided text', () => {
    const customText = 'Custom settings message';
    render(<Settings text={customText} />);
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  it('renders profile settings link with correct text', () => {
    render(<Settings {...defaultProps} />);
    const profileLink = screen.getByRole('link');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/mocked-url');
    expect(screen.getByText('profile-settings')).toBeInTheDocument();
  });

  it('applies correct styling to typography component', () => {
    render(<Settings {...defaultProps} />);
    const component = screen.getByTestId('mui-typography');
    expect(component).toBeInTheDocument();
    expect(component).toHaveAttribute('component', 'h2');
  });

  it('matches snapshot', () => {
    const { container } = render(<Settings {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});