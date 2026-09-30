import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import TenderRecommendationHeader from './TenderRecommendationHeader';

// Mock i18n t
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: (k) => k },
}));

// Mock MUI Grid2 which may not be available in test environment
jest.mock('@mui/material/Grid2', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="grid2-mock">{children}</div>,
}));

// Mock @mui/icons-material icons used inside the component
jest.mock('@mui/icons-material', () => ({
  __esModule: true,
  ArrowBackOutlined: (props) => <span {...props} />,
  VisibilityOutlined: (props) => <span {...props} />,
  DescriptionOutlined: (props) => <span {...props} />,
  SaveOutlined: (props) => <span {...props} />,
  ShareOutlined: (props) => <span {...props} />,
}));

// Mock react-router navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Bypass connect HOC to pass props directly
jest.mock('react-redux', () => ({
  connect: () => (C) => C,
}));

// Lightweight ApproverModal mock
jest.mock('v2/apps/shared/components/approver-modal/approverModal', () => ({
  __esModule: true,
  default: ({ open, onClose, shortlistedSubcontractorIds, onSubmit }) =>
    open ? (
      <div data-testid="approver-modal">
        <button
          onClick={() => {
            onSubmit({ selectedApprovers: [123], shortlistedSubcontractorIds });
          }}
        >
          confirm
        </button>
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}));

const baseProps = () => ({
  loading: false,
  setOpenLogModal: jest.fn(),
  setOpenPdf: jest.fn(),
  saveDraft: jest.fn(),
  isSaving: false,
  project: { slug: 'p-slug' },
  handleRequestApproval: jest.fn(() => Promise.resolve()),
  tenderData: { status: 'Draft', submitted_by: { id: 7 }, tender_recommendation_id: 42 },
  clinkAccount: { user: { id: 7 } },
});

describe('TenderRecommendationHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates back when back button clicked and shows title', () => {
    render(<TenderRecommendationHeader {...baseProps()} />);
    expect(screen.getByText('tender-recommendation')).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: '' }); // the icon button has no label
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('preview button triggers setOpenPdf and respects loading state', () => {
    const props = baseProps();
    render(<TenderRecommendationHeader {...props} />);
    const preview = screen.getByText('preview');
    fireEvent.click(preview);
    expect(props.setOpenPdf).toHaveBeenCalledWith(true);

    const loadingProps = { ...baseProps(), loading: true };
    render(<TenderRecommendationHeader {...loadingProps} />);
    expect(screen.getAllByText('loading')[0]).toBeInTheDocument();
  });

  it('view logs button opens logs', () => {
    const props = baseProps();
    render(<TenderRecommendationHeader {...props} />);
    fireEvent.click(screen.getByText('view-logs'));
    expect(props.setOpenLogModal).toHaveBeenCalledWith(true);
  });

  it('shows Save Draft and Request Approval buttons only when permitted', () => {
    const props = baseProps();
    const { rerender } = render(<TenderRecommendationHeader {...props} />);
    // Both buttons visible
    expect(screen.getByText('Save-Draft')).toBeInTheDocument();
    expect(screen.getByText('request-for-approval')).toBeInTheDocument();

    // When status not Draft -> buttons disabled and still rendered (due to showApproveRequestOrDraftBtn false)
    const p2 = {
      ...props,
      tenderData: { status: 'Pending', submitted_by: { id: 7 } },
    };
    rerender(<TenderRecommendationHeader {...p2} />);
    // Now hidden since showApproveRequestOrDraftBtn = false
    expect(screen.queryByText('Save-Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('request-for-approval')).not.toBeInTheDocument();

    // Different user id -> hidden
    const p3 = { ...props, clinkAccount: { user: { id: 9 } } };
    rerender(<TenderRecommendationHeader {...p3} />);
    expect(screen.queryByText('Save-Draft')).not.toBeInTheDocument();
  });

  it('can close approver modal', () => {
    const props = baseProps();
    render(<TenderRecommendationHeader {...props} />);
    fireEvent.click(screen.getByText('request-for-approval'));
    expect(screen.getByTestId('approver-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('approver-modal')).not.toBeInTheDocument();
  });
});
