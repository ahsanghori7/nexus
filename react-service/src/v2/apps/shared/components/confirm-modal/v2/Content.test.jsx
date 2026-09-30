import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Content from './Content.jsx';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params?.packageName) {
        return `${key}:${params.packageName}`;
      }
      return key;
    },
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#fff',
        darkJungleGreen: '#001',
        japaneseIndigo: '#112',
        lightPeriwinkle: '#ccd',
        tealShade: '#0aa',
      },
      prosper: {
        prosperBoxGreen: '#0f0',
      },
    },
  },
}));

const getHeaderToolbar = () => screen.queryByTestId('mock-mui-toolbar');

describe('ConfirmModal Content', () => {
  it('renders nav title and triggers handlers through user interactions', async () => {
    const handleCancel = jest.fn();
    const handleAccept = jest.fn();
    const user = userEvent.setup();

    const { container } = render(
      <Content
        navTitle="nav-title"
        title="modal-title"
        description="modal-description"
        cancel="cancel-label"
        confirm="confirm-label"
        handleCancel={handleCancel}
        handleAccept={handleAccept}
      >
        <div>child-content</div>
      </Content>
    );

    const header = getHeaderToolbar();
    expect(header).toBeTruthy();
    expect(within(header).getByText('nav-title')).toBeInTheDocument();
    expect(within(header).getByLabelText('close')).toBeInTheDocument();

    expect(screen.getByText('modal-title')).toBeInTheDocument();
    expect(screen.getByText('modal-description')).toBeInTheDocument();
    expect(screen.getByText('child-content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'cancel-label' }));
    expect(handleCancel).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: 'confirm-label' }));
    expect(handleAccept).toHaveBeenCalledTimes(1);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders close-only header when navTitle is omitted (prosper / team-role pattern)', () => {
    const handleCancel = jest.fn();
    const { container } = render(
      <Content
        title="confirm-deleting-team-member"
        cancel="cancel"
        confirm="confirm"
        handleCancel={handleCancel}
        handleAccept={jest.fn()}
      />
    );

    const header = getHeaderToolbar();
    expect(header).toBeTruthy();
    expect(within(header).getByLabelText('close')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /nav/i })).not.toBeInTheDocument();
  });

  it('renders nav title without close when handleCancel is omitted', () => {
    const { container } = render(
      <Content
        navTitle="ai-analysis-in-progress"
        title="progress-title"
        description="progress-description"
        confirm="confirm"
        handleAccept={jest.fn()}
      />
    );

    const header = getHeaderToolbar();
    expect(header).toBeTruthy();
    expect(within(header).getByText('ai-analysis-in-progress')).toBeInTheDocument();
    expect(within(header).queryByLabelText('close')).not.toBeInTheDocument();
  });

  it('omits header bar when neither navTitle nor handleCancel is set', () => {
    const { container } = render(
      <Content
        title="project-unlocked"
        confirm="close"
        description="project-unlocked-text"
        handleAccept={jest.fn()}
        fullWidth
      />
    );

    expect(getHeaderToolbar()).toBeNull();
    expect(screen.queryByTestId('mock-mui-appbar')).toBeNull();
  });

  it('shows header close but hides footer cancel when cancel prop is null', () => {
    const handleCancel = jest.fn();
    const { container } = render(
      <Content
        navTitle="No BOQ error"
        title="error-body"
        cancel={null}
        confirm={null}
        handleCancel={handleCancel}
      />
    );

    const header = getHeaderToolbar();
    expect(within(header).getByText('No BOQ error')).toBeInTheDocument();
    expect(within(header).getByLabelText('close')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'cancel' })).not.toBeInTheDocument();
  });

  it('disables accept button when disabled prop is true', async () => {
    const handleAccept = jest.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <Content
        title="disabled-title"
        description="disabled-description"
        confirm="confirm-label"
        handleAccept={handleAccept}
        disabled
      />
    );

    const acceptButton = screen.getByRole('button', { name: 'confirm-label' });
    expect(acceptButton).toBeDisabled();

    await user.click(acceptButton);
    expect(handleAccept).not.toHaveBeenCalled();
  });

  it('uses the default no-op accept handler when handleAccept is omitted', async () => {
    const user = userEvent.setup();

    render(
      <Content title="default-accept-title" description="default-accept-description" />,
    );

    const acceptButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(acceptButton);

    expect(acceptButton).toBeInTheDocument();
  });

  it('renders nav title with tooltip when interpolation is not used', () => {
    render(
      <Content
        navTitle="nav-title"
        title={null}
        description="modal-description"
        handleCancel={jest.fn()}
      />,
    );

    const header = getHeaderToolbar();
    const navTitle = within(header).getByText('nav-title');

    expect(navTitle).toHaveAttribute('title', 'nav-title');
  });

  it('renders interpolated nav title with tooltip and omits body title when title is null', () => {
    render(
      <Content
        navTitle="analysis-tool-quote-summary-modal-title"
        navTitleInterpolation={{ packageName: 'Carpentry - Second Fix' }}
        title={null}
        description="ai-quote-analysis-complete-description"
        handleCancel={jest.fn()}
      />,
    );

    const header = getHeaderToolbar();
    const navTitle = within(header).getByText(
      'analysis-tool-quote-summary-modal-title:Carpentry - Second Fix',
    );

    expect(navTitle).toBeInTheDocument();
    expect(navTitle).toHaveAttribute(
      'title',
      'analysis-tool-quote-summary-modal-title:Carpentry - Second Fix',
    );
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});
