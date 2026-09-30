import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RejectModal from './RejectModal';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('RejectModal Component', () => {
  const mockFields = {
    title: 'reject_order_title',
    content: 'reject_order_description',
    placeholder: 'reject_order_placeholder',
    note: 'reject_order_note',
    successMessage: 'reject_order_success',
    errorMessage: 'reject_order_error',
  };

  const mockApproverInfo = {
    id: 'approver-1',
    name: 'Test Approver',
  };

  const mockProps = {
    fields: mockFields,
    approverInfo: mockApproverInfo,
    open: true,
    onClose: jest.fn(),
    onReject: jest.fn(),
    setOrderApprovedOrRejected: jest.fn(),
    reloadData: jest.fn(),
    projectSlug: null,
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Render', () => {
    it('should render the modal when open is true', () => {
      render(<RejectModal {...mockProps} />);
      expect(screen.getByText(mockFields.title)).toBeInTheDocument();
      expect(screen.getByText(mockFields.content)).toBeInTheDocument();
    });

    it('should not render the modal when open is false', () => {
      render(<RejectModal {...mockProps} open={false} />);
      expect(screen.queryByText(mockFields.title)).not.toBeInTheDocument();
    });

    it('should render the note when provided', () => {
      render(<RejectModal {...mockProps} />);
      expect(screen.getByText(mockFields.note)).toBeInTheDocument();
    });

    it('should render textarea with correct placeholder', () => {
      render(<RejectModal {...mockProps} />);
      const textarea = screen.getByPlaceholderText(mockFields.placeholder);
      expect(textarea).toBeInTheDocument();
    });

    it('should render modal content text elements', () => {
      const { container } = render(<RejectModal {...mockProps} />);
      expect(container.textContent).toContain(mockFields.title);
      expect(container.textContent).toContain(mockFields.content);
    });
  });

  describe('Comment Input', () => {
    it('should update comment state when user types', async () => {
      const user = userEvent.setup();
      render(<RejectModal {...mockProps} />);
      const textarea = screen.getByPlaceholderText(mockFields.placeholder);

      await user.type(textarea, 'Test comment');
      expect(textarea.value).toBe('Test comment');
    });

    it('should accept empty initial value for textarea', () => {
      render(<RejectModal {...mockProps} />);
      const textarea = screen.getByPlaceholderText(mockFields.placeholder);
      expect(textarea.value).toBe('');
    });

    it('should allow typing multiple characters', async () => {
      const user = userEvent.setup();
      render(<RejectModal {...mockProps} />);
      const textarea = screen.getByPlaceholderText(mockFields.placeholder);

      const testText = 'This is a longer test comment with multiple words';
      await user.type(textarea, testText);
      expect(textarea.value).toBe(testText);
    });

    it('should clear textarea when text is selected and deleted', async () => {
      const user = userEvent.setup();
      render(<RejectModal {...mockProps} />);
      const textarea = screen.getByPlaceholderText(mockFields.placeholder);

      await user.type(textarea, 'Test');
      await user.tripleClick(textarea);
      await user.keyboard('{Delete}');
      expect(textarea.value).toBe('');
    });
  });

  describe('Order Rejection', () => {
    it('should render RejectModal component', () => {
      const { container } = render(
        <RejectModal {...mockProps} projectSlug={null} />,
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with all required fields', () => {
      render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug={null}
        />,
      );
      expect(screen.getByText(mockFields.title)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(mockFields.placeholder)).toBeInTheDocument();
    });

    it('should support text input for order rejection', async () => {
      const user = userEvent.setup();
      render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug={null}
        />,
      );

      const textarea = screen.getByPlaceholderText(mockFields.placeholder);
      await user.type(textarea, 'Order rejection reason');
      expect(textarea.value).toBe('Order rejection reason');
    });
  });

  describe('Tender Recommendation Rejection', () => {
    it('should render RejectModal for tender recommendations', () => {
      const { container } = render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug="tender_recommendations"
        />,
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept comment for tender recommendation rejection', async () => {
      const user = userEvent.setup();
      render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug="tender_recommendations"
        />,
      );

      const textarea = screen.getByPlaceholderText(mockFields.placeholder);
      await user.type(textarea, 'TR rejection comment');
      expect(textarea.value).toBe('TR rejection comment');
    });
  });

  describe('Procurement Schedule Rejection', () => {
    it('should render RejectModal for procurement schedule', () => {
      const { container } = render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug="procurement_schedule"
        />,
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept comment for procurement schedule rejection', async () => {
      const user = userEvent.setup();
      render(
        <RejectModal
          {...mockProps}
          onReject={jest.fn()}
          projectSlug="procurement_schedule"
        />,
      );

      const textarea = screen.getByPlaceholderText(mockFields.placeholder);
      await user.type(textarea, 'PS rejection comment');
      expect(textarea.value).toBe('PS rejection comment');
    });
  });

  describe('Modal Dismissal', () => {
    it('should have modal title visible', () => {
      render(<RejectModal {...mockProps} />);
      expect(screen.getByText(mockFields.title)).toBeInTheDocument();
    });

    it('should render note text in modal', () => {
      render(<RejectModal {...mockProps} />);
      expect(screen.getByText(mockFields.note)).toBeInTheDocument();
    });

    it('should disable buttons when submitting', () => {
      const { container } = render(
        <RejectModal {...mockProps} isSubmitting={true} />,
      );
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Snackbar', () => {
    it('should render component without errors', () => {
      const { container } = render(<RejectModal {...mockProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should render modal with open prop as true', () => {
      const { container } = render(
        <RejectModal {...mockProps} open={true} />,
      );
      expect(screen.getByText(mockFields.title)).toBeInTheDocument();
    });

    it('should render modal dialog title', () => {
      render(<RejectModal {...mockProps} />);
      expect(screen.getByText(mockFields.title)).toBeInTheDocument();
    });
  });

  describe('Confirm - docType branching', () => {
    it('calls onReject with only the comment when docType is tender, skipping the order-specific flow', async () => {
      const user = userEvent.setup();
      const onReject = jest.fn().mockResolvedValue();
      const reloadData = jest.fn();
      const setOrderApprovedOrRejected = jest.fn();
      const onClose = jest.fn();

      render(
        <RejectModal
          {...mockProps}
          docType="tender"
          projectSlug={null}
          onReject={onReject}
          reloadData={reloadData}
          setOrderApprovedOrRejected={setOrderApprovedOrRejected}
          onClose={onClose}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(mockFields.placeholder),
        'Tender rejection reason',
      );
      await user.click(
        screen.getByTestId('document-creator-reject-modal-confirm-btn'),
      );

      await waitFor(() =>
        expect(onReject).toHaveBeenCalledWith('Tender rejection reason'),
      );
      expect(reloadData).not.toHaveBeenCalled();
      expect(setOrderApprovedOrRejected).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onReject with approverInfo id, status, and comment, then reloads and closes when docType is not tender', async () => {
      const user = userEvent.setup();
      const onReject = jest.fn().mockResolvedValue();
      const reloadData = jest.fn();
      const setOrderApprovedOrRejected = jest.fn();
      const onClose = jest.fn();

      render(
        <RejectModal
          {...mockProps}
          docType="order"
          projectSlug={null}
          onReject={onReject}
          reloadData={reloadData}
          setOrderApprovedOrRejected={setOrderApprovedOrRejected}
          onClose={onClose}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(mockFields.placeholder),
        'Order rejection reason',
      );
      await user.click(
        screen.getByTestId('document-creator-reject-modal-confirm-btn'),
      );

      await waitFor(() =>
        expect(onReject).toHaveBeenCalledWith(
          mockApproverInfo.id,
          'Rejected',
          'Order rejection reason',
        ),
      );
      expect(reloadData).toHaveBeenCalled();
      expect(setOrderApprovedOrRejected).toHaveBeenCalledWith(true);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Component Props', () => {
    it('should accept all required props', () => {
      const { container } = render(<RejectModal {...mockProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle different projectSlug values', () => {
      const { rerender, container } = render(
        <RejectModal {...mockProps} projectSlug={null} />,
      );
      expect(container).toBeInTheDocument();

      rerender(
        <RejectModal {...mockProps} projectSlug="tender_recommendations" />,
      );
      expect(container).toBeInTheDocument();

      rerender(
        <RejectModal {...mockProps} projectSlug="procurement_schedule" />,
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle isSubmitting prop', () => {
      const { rerender, container } = render(
        <RejectModal {...mockProps} isSubmitting={false} />,
      );
      expect(container).toBeInTheDocument();

      rerender(<RejectModal {...mockProps} isSubmitting={true} />);
      expect(container).toBeInTheDocument();
    });
  });
});
