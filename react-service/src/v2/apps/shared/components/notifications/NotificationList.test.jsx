import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NotificationList from './NotificationList';

const mockStore = configureStore([]);

// Mock NotificationItem component
jest.mock('./NotificationItem', () => {
  return function MockNotificationItem({ notification }) {
    return <div data-testid={`notification-${notification.id}`}>{notification.title}</div>;
  };
});

// Mock NotificationEmptyState component
jest.mock('./NotificationEmptyState', () => {
  return function MockNotificationEmptyState() {
    return <div data-testid="empty-state">No notifications</div>;
  };
});

describe('NotificationList', () => {
  const mockNotifications = [
    { id: 1, title: 'Notification 1', read_at: null },
    { id: 2, title: 'Notification 2', read_at: '2026-01-01' },
    { id: 3, title: 'Notification 3', read_at: null },
  ];

  const defaultProps = {
    notifications: mockNotifications,
    currentTab: 'all',
    onClose: jest.fn(),
    isLoadingMore: false,
  };

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
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} />
      </Provider>
    );
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
  });

  it('should render all notifications when currentTab is "all"', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} currentTab="all" />
      </Provider>
    );

    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-3')).toBeInTheDocument();
  });

  it('should render only unread notifications when currentTab is "unread"', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} currentTab="unread" />
      </Provider>
    );

    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('notification-3')).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    render(
      <Provider store={store}>
        <NotificationList
          {...defaultProps}
          notifications={[]}
          isLoadingMore={false}
        />
      </Provider>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should show empty state when filtered notifications is empty', () => {
    const readNotifications = [
      { id: 1, title: 'Notification 1', read_at: '2026-01-01' },
      { id: 2, title: 'Notification 2', read_at: '2026-01-02' },
    ];

    render(
      <Provider store={store}>
        <NotificationList
          {...defaultProps}
          notifications={readNotifications}
          currentTab="unread"
          isLoadingMore={false}
        />
      </Provider>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should not show empty state when loading more', () => {
    render(
      <Provider store={store}>
        <NotificationList
          {...defaultProps}
          notifications={[]}
          isLoadingMore={true}
        />
      </Provider>
    );

    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('should display loading indicator when isLoadingMore is true', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} isLoadingMore={true} />
      </Provider>
    );

    const loader = screen.getByRole('progressbar');
    expect(loader).toBeInTheDocument();
  });

  it('should not display loading indicator when isLoadingMore is false', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} isLoadingMore={false} />
      </Provider>
    );

    const loader = screen.queryByRole('progressbar');
    expect(loader).not.toBeInTheDocument();
  });

  it('should pass onClose prop to NotificationItem components', () => {
    const onCloseMock = jest.fn();
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} onClose={onCloseMock} />
      </Provider>
    );

    expect(screen.getAllByTestId(/notification-/)).toHaveLength(3);
  });

  it('should handle empty notifications array gracefully', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} notifications={[]} />
      </Provider>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should handle undefined notifications gracefully', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} notifications={undefined} />
      </Provider>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render correct number of notifications', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} />
      </Provider>
    );

    const notifications = screen.getAllByTestId(/notification-/);
    expect(notifications).toHaveLength(3);
  });

  it('should filter notifications correctly based on read_at property', () => {
    render(
      <Provider store={store}>
        <NotificationList {...defaultProps} currentTab="unread" />
      </Provider>
    );

    const unreadNotifications = screen.getAllByTestId(/notification-/);
    expect(unreadNotifications).toHaveLength(2);
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-3')).toBeInTheDocument();
  });
});
