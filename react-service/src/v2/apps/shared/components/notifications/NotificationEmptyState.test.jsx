import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationEmptyState from './NotificationEmptyState';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'notifications-empty-state-title': "You're all caught up.",
        'notifications-empty-state-description': 'New notifications will appear here.',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock MUI icon
jest.mock('@mui/icons-material/NotificationsNoneOutlined', () => {
  return function MockNotificationsNoneOutlined(props) {
    return <svg data-testid="NotificationsNoneOutlinedIcon" {...props} />;
  };
});

describe('NotificationEmptyState', () => {
  it('should render without crashing', () => {
    render(<NotificationEmptyState />);
    expect(screen.getByText(/You're all caught up/i)).toBeInTheDocument();
  });

  it('should display the correct heading', () => {
    render(<NotificationEmptyState />);
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
  });

  it('should display the correct description', () => {
    render(<NotificationEmptyState />);
    expect(screen.getByText('New notifications will appear here.')).toBeInTheDocument();
  });

  it('should render the notification icon', () => {
    const { container } = render(<NotificationEmptyState />);
    const icon = container.querySelector('svg[data-testid="NotificationsNoneOutlinedIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    const { container } = render(<NotificationEmptyState />);
    const boxes = container.querySelectorAll('.MuiBox-root');
    expect(boxes.length).toBeGreaterThan(0);
  });
});
