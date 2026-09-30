import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import Menu from './Menu.jsx';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const mockHttpRequest = jest.fn();
jest.mock('services/httpHelper', () => ({
  __esModule: true,
  default: (...args) => mockHttpRequest(...args),
}));

const mockGoToNewTab = jest.fn();
jest.mock('v2/helpers/url', () => ({
  goToNewTab: (...args) => mockGoToNewTab(...args),
}));

const createStore = () => ({
  getState: () => ({}),
  subscribe: () => () => {},
  dispatch: () => {},
});

describe('QuoteHistoryMenu', () => {
  const renderWithStore = (ui) =>
    render(<Provider store={createStore()}>{ui}</Provider>);

  beforeEach(() => {
    mockHttpRequest.mockReset();
    mockGoToNewTab.mockReset();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  it('opens the menu when the action button is clicked', async () => {
    mockHttpRequest.mockResolvedValue({ data: { success: true, file: 'file' } });
    renderWithStore(
      <Menu
        row={{
          id: 'row-1',
          entity: { id: 11 },
          subcontractor: { id: 22 },
          version: 'v3',
        }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /more/i }));

    expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
    expect(screen.getByTestId('mui-menu-item')).toBeInTheDocument();
  });

  it('requests quote download and opens new tab on success', async () => {
    mockHttpRequest.mockResolvedValue({
      data: { success: true, file: 'quote.pdf' },
    });

    renderWithStore(
      <Menu
        row={{
          id: 'row-2',
          entity: { id: 5 },
          subcontractor: { id: 6 },
          version: 7,
        }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /more/i }));
    await user.click(screen.getByTestId('mui-menu-item'));

    await waitFor(() => {
      expect(mockHttpRequest).toHaveBeenCalledWith({
        url: 'boq/5/quote/6/download/7',
      });
      expect(mockGoToNewTab).toHaveBeenCalledWith('quote.pdf');
    });
  });

  it('alerts the user when the download fails', async () => {
    mockHttpRequest.mockResolvedValue({
      data: { success: false, error: 'Download failed' },
    });

    renderWithStore(
      <Menu
        row={{
          id: 'row-3',
          subcontractor: null,
          version: 9,
        }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /more/i }));
    await user.click(screen.getByTestId('mui-menu-item'));

    await waitFor(() => {
      expect(mockHttpRequest).toHaveBeenCalledWith({
        url: 'boq/0/quote/0/download/9',
      });
      expect(window.alert).toHaveBeenCalledWith('Download failed');
      expect(mockGoToNewTab).not.toHaveBeenCalled();
    });
  });
});
