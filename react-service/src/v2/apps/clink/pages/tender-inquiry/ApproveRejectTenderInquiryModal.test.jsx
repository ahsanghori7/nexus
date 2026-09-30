import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ApproveRejectTenderInquiryModal from './ApproveRejectTenderInquiryModal';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'approve-or-reject-tender': 'Approve or Reject Tender',
      'tender-document': 'Tender Document',
      'tender-document-description': 'Please select your decision for:',
      'reject-button': 'Reject',
      'approve-button': 'Approve',
      'feedback': 'Feedback',
      'feedback-required': 'Feedback is required for rejection',
      'cancel': 'Cancel',
      'confirm-decision': 'Confirm Decision',
    };
    return translations[key] || key;
  }),
}));

describe('ApproveRejectTenderInquiryModal', () => {
  const mockOnClose = jest.fn();
  const mockHandleConfirm = jest.fn();
  const mockTenderInfo = {
    pkgName: '3d Laser Scanning Survey',
    tenderType: 'Invitation to Tender',
  };

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    handleConfirm: mockHandleConfirm,
    tenderInfo: mockTenderInfo,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the modal when open is true', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      expect(screen.getByText('Approve or Reject Tender')).toBeInTheDocument();
      expect(screen.getByText('Tender Document')).toBeInTheDocument();
    });

    it('displays tender information correctly', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      expect(
        screen.getByText(/3d Laser Scanning Survey - Invitation to Tender/i),
      ).toBeInTheDocument();
    });

    it('renders Approve and Reject buttons', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('renders Cancel and Confirm Decision buttons', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm Decision')).toBeInTheDocument();
    });

    it('has Confirm Decision button disabled by default', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).toBeDisabled();
    });

    it('does not display feedback field initially', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      expect(screen.queryByPlaceholderText(/please provide a reason for rejection/i)).not.toBeInTheDocument();
    });
  });

  describe('Approve Functionality', () => {
    it('selects Approve button when clicked and changes to contained variant', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const approveButton = screen.getByText('Approve');
      
      // Initially should have outlined class
      expect(approveButton).toHaveClass('MuiButton-outlined');
      
      fireEvent.click(approveButton);

      // After click should have contained class
      expect(approveButton).toHaveClass('MuiButton-contained');
    });

    it('enables Confirm Decision button when Approve is selected', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).not.toBeDisabled();
    });

    it('calls handleConfirm with "approve" decision when Confirm Decision is clicked', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      const confirmButton = screen.getByText('Confirm Decision');
      fireEvent.click(confirmButton);

      expect(mockHandleConfirm).toHaveBeenCalledWith('approve', '');
    });
  });

  describe('Reject Functionality', () => {
    it('selects Reject button when clicked and changes to contained variant', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      
      // Initially should have outlined class
      expect(rejectButton).toHaveClass('MuiButton-outlined');
      
      fireEvent.click(rejectButton);

      // After click should have contained class
      expect(rejectButton).toHaveClass('MuiButton-contained');
    });

    it('displays feedback field when Reject is selected', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      expect(screen.getByPlaceholderText(/please provide a reason for rejection/i)).toBeInTheDocument();
      expect(screen.getByText('Feedback')).toBeInTheDocument();
      expect(screen.getByText('Feedback is required for rejection')).toBeInTheDocument();
    });

    it('keeps Confirm Decision button disabled when Reject is selected without feedback', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).toBeDisabled();
    });

    it('enables Confirm Decision button when Reject is selected and feedback is provided', async () => {
      const user = userEvent.setup();
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      await user.type(feedbackField, 'Not meeting requirements');

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).not.toBeDisabled();
    });

    it('keeps Confirm Decision button disabled when feedback is only whitespace', async () => {
      const user = userEvent.setup();
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      await user.type(feedbackField, '   ');

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).toBeDisabled();
    });

    it('calls handleConfirm with "reject" decision and feedback when Confirm Decision is clicked', async () => {
      const user = userEvent.setup();
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      const feedbackText = 'Not meeting requirements';
      await user.type(feedbackField, feedbackText);

      const confirmButton = screen.getByText('Confirm Decision');
      fireEvent.click(confirmButton);

      expect(mockHandleConfirm).toHaveBeenCalledWith('reject', feedbackText);
    });
  });

  describe('Switching Between Approve and Reject', () => {
    it('switches from Approve to Reject and clears feedback', async () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      // Select Approve first
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      expect(screen.queryByPlaceholderText(/please provide a reason for rejection/i)).not.toBeInTheDocument();

      // Switch to Reject
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      expect(screen.getByPlaceholderText(/please provide a reason for rejection/i)).toBeInTheDocument();
    });

    it('switches from Reject to Approve and hides feedback field', async () => {
      const user = userEvent.setup();
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      // Select Reject and enter feedback
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      await user.type(feedbackField, 'Some feedback');

      // Switch to Approve
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      expect(screen.queryByPlaceholderText(/please provide a reason for rejection/i)).not.toBeInTheDocument();
    });

    it('maintains Confirm Decision button enabled state correctly when switching', async () => {
      const user = userEvent.setup();
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Decision');
      const approveButton = screen.getByText('Approve');
      const rejectButton = screen.getByText('Reject');

      // Initially disabled
      expect(confirmButton).toBeDisabled();

      // Select Approve - should enable
      fireEvent.click(approveButton);
      expect(confirmButton).not.toBeDisabled();

      // Switch to Reject - should disable (no feedback)
      fireEvent.click(rejectButton);
      expect(confirmButton).toBeDisabled();

      // Add feedback - should enable
      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      await user.type(feedbackField, 'Feedback text');
      expect(confirmButton).not.toBeDisabled();

      // Switch to Approve - should enable
      fireEvent.click(approveButton);
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Modal Close Functionality', () => {
    it('calls onClose when Cancel button is clicked', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close icon button is clicked', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('resets decision state when modal is closed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      // Select Reject and add feedback
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      await user.type(feedbackField, 'Test feedback');

      // Close the modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();

      // Re-open the modal (simulate re-render with open=true)
      rerender(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      // Feedback field should not be visible (state was reset)
      expect(screen.queryByPlaceholderText(/please provide a reason for rejection/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly when tenderInfo is undefined', () => {
      render(
        <ApproveRejectTenderInquiryModal
          {...defaultProps}
          tenderInfo={undefined}
        />,
      );

      expect(screen.getByText('Tender Document')).toBeInTheDocument();
      // Should handle undefined gracefully with optional chaining
      expect(screen.getByText(/please select your decision for:/i)).toBeInTheDocument();
    });

    it('renders correctly when tenderInfo is null', () => {
      render(
        <ApproveRejectTenderInquiryModal
          {...defaultProps}
          tenderInfo={null}
        />,
      );

      expect(screen.getByText('Tender Document')).toBeInTheDocument();
    });

    it('renders correctly when tenderInfo properties are missing', () => {
      render(
        <ApproveRejectTenderInquiryModal
          {...defaultProps}
          tenderInfo={{}}
        />,
      );

      expect(screen.getByText('Tender Document')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      const { container } = render(
        <ApproveRejectTenderInquiryModal {...defaultProps} open={false} />,
      );

      // MUI Dialog with open=false should not show content
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('switches Reject button from outlined to contained when selected', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      
      // Initially outlined variant with error color
      expect(rejectButton).toHaveClass('MuiButton-outlined');
      expect(rejectButton).toHaveClass('MuiButton-outlinedError');

      // After click - contained variant
      fireEvent.click(rejectButton);
      expect(rejectButton).toHaveClass('MuiButton-contained');
      expect(rejectButton).toHaveClass('MuiButton-containedError');
    });

    it('switches Approve button from outlined to contained when selected', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const approveButton = screen.getByText('Approve');
      
      // Initially outlined variant with success color
      expect(approveButton).toHaveClass('MuiButton-outlined');
      expect(approveButton).toHaveClass('MuiButton-outlinedSuccess');

      // After click - contained variant
      fireEvent.click(approveButton);
      expect(approveButton).toHaveClass('MuiButton-contained');
      expect(approveButton).toHaveClass('MuiButton-containedSuccess');
    });

    it('Confirm Decision button is contained variant', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      const confirmButton = screen.getByText('Confirm Decision');
      expect(confirmButton).toHaveClass('MuiButton-contained');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible close button', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });

    it('feedback field is accessible and properly labeled', () => {
      render(<ApproveRejectTenderInquiryModal {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      const feedbackField = screen.getByPlaceholderText(/please provide a reason for rejection/i);
      expect(feedbackField).toBeInTheDocument();
      expect(feedbackField).toHaveAttribute('placeholder', 'Please provide a reason for rejection...');
    });
  });
});

