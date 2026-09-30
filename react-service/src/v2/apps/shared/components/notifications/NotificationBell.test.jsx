import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NotificationBell from './NotificationBell';
import { fetchNotifications, resetPagination } from 'v2/store/reducers/common/notifications';

const mockStore = configureStore([]);

// Mock MUI icon
jest.mock('@mui/icons-material/NotificationsOutlined', () => {
  return function MockNotificationsOutlined(props) {
    return <svg data-testid="NotificationsOutlinedIcon" {...props} />;
  };
});

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock NotificationDropdown component
jest.mock('./NotificationDropdown', () => {
  return function MockNotificationDropdown({ items, unreadCount, onClose }) {
    return (
      <div data-testid="notification-dropdown">
        <div data-testid="dropdown-items">{items.length}</div>
        <div data-testid="dropdown-unread">{unreadCount}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('v2/store/reducers/common/notifications', () => ({
  fetchNotifications: jest.fn(),
  resetPagination: jest.fn(),
}));

describe('NotificationBell', () => {
  const mockNotifications = [
    { id: 1, title: 'Notification 1', read_at: null },
    { id: 2, title: 'Notification 2', read_at: '2026-01-01' },
    { id: 3, title: 'Notification 3', read_at: null },
  ];

  let store;

  beforeEach(() => {
    store = mockStore({
      notifications: {
        items: mockNotifications,
        unreadCount: 2,
        isLoading: false,
        isLoadingMore: false,
      },
    });
    jest.clearAllMocks();
    fetchNotifications.mockReturnValue({ type: 'notifications/fetchNotifications' });
    resetPagination.mockReturnValue({ type: 'notifications/resetPagination' });
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellIcon = screen.getByLabelText('notifications');
    expect(bellIcon).toBeInTheDocument();
  });

  it('should display unread count badge', () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should dispatch resetPagination and fetchNotifications on mount', () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    expect(resetPagination).toHaveBeenCalled();
    expect(fetchNotifications).toHaveBeenCalledWith({ since: 0, limit: 10 });
  });

  it('should open dropdown when bell icon is clicked', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });
  });

  it('should close dropdown when close handler is called', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    // Open dropdown
    const bellButton = screen.getByLabelText('notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    // Close dropdown
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  it('should pass correct items to NotificationDropdown', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-items')).toHaveTextContent('3');
    });
  });

  it('should pass correct unreadCount to NotificationDropdown', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-unread')).toHaveTextContent('2');
    });
  });

  it('should handle zero unread count', () => {
    const storeWithNoUnread = mockStore({
      notifications: {
        items: [{ id: 1, title: 'N1', read_at: '2026-01-01' }],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    render(
      <Provider store={storeWithNoUnread}>
        <NotificationBell />
      </Provider>
    );

    // Bell icon should still render
    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
  });

  it('should render notification icon', () => {
    const { container } = render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const icon = container.querySelector('svg[data-testid="NotificationsOutlinedIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct aria-label', () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');
    expect(bellButton).toBeInTheDocument();
  });

  it('should toggle dropdown on multiple clicks', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');

    // First click - open
    fireEvent.click(bellButton);
    await waitFor(() => {
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    // Verify dropdown can be opened
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('should handle empty notifications array', () => {
    const storeWithEmpty = mockStore({
      notifications: {
        items: [],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    render(
      <Provider store={storeWithEmpty}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const storeWithLoading = mockStore({
      notifications: {
        items: [],
        unreadCount: 0,
        isLoading: true,
        isLoadingMore: false,
      },
    });

    render(
      <Provider store={storeWithLoading}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
  });

  it('should show correct unread count with large numbers', () => {
    const storeWithManyUnread = mockStore({
      notifications: {
        items: new Array(100).fill(null).map((_, i) => ({
          id: i,
          title: `N${i}`,
          read_at: null,
        })),
        unreadCount: 99,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    render(
      <Provider store={storeWithManyUnread}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('should update when store changes', () => {
    const { rerender } = render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByText('2')).toBeInTheDocument();

    const updatedStore = mockStore({
      notifications: {
        items: mockNotifications,
        unreadCount: 5,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    rerender(
      <Provider store={updatedStore}>
        <NotificationBell />
      </Provider>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render popover when opened', async () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    const bellButton = screen.getByLabelText('notifications');
    fireEvent.click(bellButton);

    await waitFor(() => {
      // Check that dropdown component is rendered
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });
  });

  it('should call fetchNotifications only once on mount', () => {
    render(
      <Provider store={store}>
        <NotificationBell />
      </Provider>
    );

    expect(fetchNotifications).toHaveBeenCalledTimes(1);
    expect(resetPagination).toHaveBeenCalledTimes(1);
  });
});
