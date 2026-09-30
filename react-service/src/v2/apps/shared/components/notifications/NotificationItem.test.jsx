import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NotificationItem from './NotificationItem';
import { markNotificationAsRead } from 'v2/store/reducers/common/notifications';

const mockStore = configureStore([]);

// Mock BASE_URLS global
global.BASE_URLS = {
  APP_CLINK: 'https://app.test.com',
};

// Mock MUI icons
jest.mock('@mui/icons-material/FiberManualRecord', () => {
  return function MockFiberManualRecord(props) {
    return <svg data-testid="FiberManualRecordIcon" {...props} />;
  };
});

jest.mock('@mui/icons-material/CheckCircleOutline', () => {
  return function MockCheckCircleOutline(props) {
    return <svg data-testid="CheckCircleOutlineIcon" {...props} />;
  };
});

jest.mock('@mui/icons-material/FactCheckOutlined', () => {
  return function MockFactCheckOutlined(props) {
    return <svg data-testid="FactCheckOutlinedIcon" {...props} />;
  };
});

jest.mock('@mui/icons-material/EditOutlined', () => {
  return function MockEditOutlined(props) {
    return <svg data-testid="EditOutlinedIcon" {...props} />;
  };
});

jest.mock('@mui/icons-material/AssignmentOutlined', () => {
  return function MockAssignmentOutlined(props) {
    return <svg data-testid="AssignmentOutlinedIcon" {...props} />;
  };
});

jest.mock('v2/store/reducers/common/notifications', () => ({
  markNotificationAsRead: jest.fn(),
}));

jest.mock('v2/helpers/date', () => ({
  getLondonUTCDate: jest.fn((date) => {
    const d = date ? new Date(date) : new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const get = (type) => parts.find((part) => part.type === type)?.value ?? '';

    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'open': 'Open',
        'mark_as_read': 'Mark as read',
      };
      return translations[key] || key;
    },
  }),
}));

describe('NotificationItem', () => {
  let store;

  const mockNotification = {
    id: 1,
    type: 'order_approved',
    title: 'Order Approved',
    message: 'Your order has been approved',
    target_url: 'orders/123',
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    store = mockStore({
      notifications: {
        items: [],
      },
    });
    jest.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const titles = screen.getAllByText('Order Approved');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should return null when notification is not provided', () => {
    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={null} onClose={mockOnClose} />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display notification title', () => {
    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const titles = screen.getAllByText('Order Approved');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should display notification message', () => {
    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('Your order has been approved')).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const unreadDot = container.querySelector('svg[data-testid="FiberManualRecordIcon"]');
    expect(unreadDot).toBeInTheDocument();
  });

  it('should not show unread indicator for read notifications', () => {
    const readNotification = {
      ...mockNotification,
      read_at: '2026-01-01T00:00:00Z',
    };

    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={readNotification} onClose={mockOnClose} />
      </Provider>
    );

    const unreadDot = container.querySelector('svg[data-testid="FiberManualRecordIcon"]');
    expect(unreadDot).not.toBeInTheDocument();
  });

  it('should show "Mark as read" button for unread notifications', () => {
    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('Mark as read')).toBeInTheDocument();
  });

  it('should not show "Mark as read" button for read notifications', () => {
    const readNotification = {
      ...mockNotification,
      read_at: '2026-01-01T00:00:00Z',
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={readNotification} onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.queryByText('Mark as read')).not.toBeInTheDocument();
  });

  it('should display "Open" button', () => {
    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const openButtons = screen.getAllByText('Open');
    expect(openButtons.length).toBeGreaterThan(0);
  });

  it('should dispatch markNotificationAsRead action when "Mark as read" is clicked', () => {
    markNotificationAsRead.mockReturnValue({ type: 'notifications/markAsRead' });

    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const markAsReadButton = screen.getByText('Mark as read');
    fireEvent.click(markAsReadButton);

    expect(markNotificationAsRead).toHaveBeenCalledWith({ notificationId: 1 });
  });

  it('should dispatch markNotificationAsRead and navigate when Open is clicked', () => {
    markNotificationAsRead.mockReturnValue({ type: 'notifications/markAsRead' });

    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(markNotificationAsRead).toHaveBeenCalledWith({ notificationId: 1 });
    expect(window.location.href).toBe('https://app.test.com/orders/123');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should navigate to target_url when notification row is clicked', () => {
    markNotificationAsRead.mockReturnValue({ type: 'notifications/markAsRead' });

    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Your order has been approved'));

    expect(window.location.href).toBe('https://app.test.com/orders/123');
  });

  it('should call onClose when notification is clicked', () => {
    markNotificationAsRead.mockReturnValue({ type: 'notifications/markAsRead' });

    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Your order has been approved'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not navigate when target_url is not provided', () => {
    const notificationWithoutUrl = {
      ...mockNotification,
      target_url: null,
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={notificationWithoutUrl} onClose={mockOnClose} />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(window.location.href).toBe('');
    expect(markNotificationAsRead).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should format timestamp as London time only (HH:MM) for notifications received today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-02T14:30:00Z'));

    const notificationWithTimestamp = {
      ...mockNotification,
      created_at: '2026-09-02T14:30:00Z',
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={notificationWithTimestamp} onClose={mockOnClose} />
      </Provider>
    );

    expect(screen.getByText('15:30')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('should format timestamp as day and month for notifications from same year but not today', () => {
    const notificationWithTimestamp = {
      ...mockNotification,
      created_at: '2026-07-29T14:30:45Z',
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={notificationWithTimestamp} onClose={mockOnClose} />
      </Provider>
    );

    // Should show day and abbreviated month (e.g., "29 Jul")
    expect(screen.getByText('29 Jul')).toBeInTheDocument();
  });

  it('should format timestamp as day, month, and year for notifications from previous years', () => {
    const notificationWithTimestamp = {
      ...mockNotification,
      created_at: '2025-08-21T10:15:00Z',
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={notificationWithTimestamp} onClose={mockOnClose} />
      </Provider>
    );

    // Should show day, abbreviated month, and year (e.g., "21 Aug 2025")
    expect(screen.getByText('21 Aug 2025')).toBeInTheDocument();
  });

  it('should render correct icon for order_approved type', () => {
    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const icon = container.querySelector('svg[data-testid="CheckCircleOutlineIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render correct icon for approval_required type', () => {
    const notification = {
      ...mockNotification,
      type: 'approval_required',
    };

    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={notification} onClose={mockOnClose} />
      </Provider>
    );

    const icon = container.querySelector('svg[data-testid="FactCheckOutlinedIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render correct icon for signature_required type', () => {
    const notification = {
      ...mockNotification,
      type: 'signature_required',
    };

    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={notification} onClose={mockOnClose} />
      </Provider>
    );

    const icon = container.querySelector('svg[data-testid="EditOutlinedIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render default icon for unknown type', () => {
    const notification = {
      ...mockNotification,
      type: 'unknown_type',
    };

    const { container } = render(
      <Provider store={store}>
        <NotificationItem notification={notification} onClose={mockOnClose} />
      </Provider>
    );

    const icon = container.querySelector('svg[data-testid="FactCheckOutlinedIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should stop propagation when "Mark as read" is clicked', () => {
    markNotificationAsRead.mockReturnValue({ type: 'notifications/markAsRead' });

    render(
      <Provider store={store}>
        <NotificationItem notification={mockNotification} onClose={mockOnClose} />
      </Provider>
    );

    const markAsReadButton = screen.getByText('Mark as read');
    const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');
    
    fireEvent.click(markAsReadButton);

    expect(stopPropagationSpy).toHaveBeenCalled();
    stopPropagationSpy.mockRestore();
  });

  describe('structured message rendering (parseContextParts)', () => {
    it('renders labeled context parts when message is a valid JSON array of {label, value} objects', () => {
      const structuredNotification = {
        ...mockNotification,
        message: JSON.stringify([
          { label: 'Project', value: 'Mixed Type' },
          { label: 'Request Type', value: 'Test Package' },
        ]),
      };

      render(
        <Provider store={store}>
          <NotificationItem notification={structuredNotification} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText('Project:')).toBeInTheDocument();
      expect(screen.getByText('Mixed Type')).toBeInTheDocument();
      expect(screen.getByText('Request Type:')).toBeInTheDocument();
      expect(screen.getByText('Test Package')).toBeInTheDocument();
    });

    it('falls back to raw text when message is malformed JSON', () => {
      const malformedNotification = {
        ...mockNotification,
        message: '{not valid json',
      };

      render(
        <Provider store={store}>
          <NotificationItem notification={malformedNotification} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText('{not valid json')).toBeInTheDocument();
    });

    it('falls back to raw text when message is valid JSON but not an array of labeled parts', () => {
      const wrongShapeNotification = {
        ...mockNotification,
        message: JSON.stringify({ foo: 'bar' }),
      };

      render(
        <Provider store={store}>
          <NotificationItem notification={wrongShapeNotification} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument();
    });

    it('falls back to raw text when message is a JSON array of objects missing label/value keys', () => {
      const rawMessage = JSON.stringify([{ foo: 'Project', bar: 'Mixed Type' }]);
      const malformedObjectsNotification = {
        ...mockNotification,
        message: rawMessage,
      };

      render(
        <Provider store={store}>
          <NotificationItem notification={malformedObjectsNotification} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText(rawMessage)).toBeInTheDocument();
    });

    it('renders without crashing when message is null', () => {
      const nullMessageNotification = {
        ...mockNotification,
        message: null,
      };

      render(
        <Provider store={store}>
          <NotificationItem notification={nullMessageNotification} onClose={mockOnClose} />
        </Provider>
      );

      const titles = screen.getAllByText('Order Approved');
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('should handle notifications without created_at timestamp', () => {
    const notificationWithoutTimestamp = {
      ...mockNotification,
      created_at: null,
    };

    render(
      <Provider store={store}>
        <NotificationItem notification={notificationWithoutTimestamp} onClose={mockOnClose} />
      </Provider>
    );

    // Should render without crashing
    const titles = screen.getAllByText('Order Approved');
    expect(titles.length).toBeGreaterThan(0);
  });
});
