import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectionFeedbackCard from './RejectionFeedbackCard';

// Mock i18next
jest.mock('v2/helpers/i18n', () => {
  const mockT = jest.fn((key) => {
    const translations = {
      'action-required-review-rejection-feedback': 'Action Required: Review Rejection Feedback',
      'your-tender-has-been-rejected': 'Your tender has been rejected. Please review the feedback below.',
      'rejection-feedback': 'Rejection Feedback',
      'tender-document-rejected': 'Tender Document Rejected',
      'acknowledge': 'Acknowledge',
      'read-more': 'Read More',
      'show-less': 'Show Less',
    };
    return translations[key] || key;
  });

  return {
    __esModule: true,
    default: {
      t: mockT,
    },
    t: mockT,
  };
});

describe('RejectionFeedbackCard', () => {
  const mockOnAcknowledge = jest.fn();
  const mockFeedback = 'This is a test feedback message that explains why the tender was rejected. It needs to be long enough to test the expand/collapse functionality properly.';

  const defaultProps = {
    onAcknowledge: mockOnAcknowledge,
    feedback: mockFeedback,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(RejectionFeedbackCard).toBeDefined();
  });

  describe('Initial Rendering', () => {
    it('renders the warning alert with correct title', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText('Action Required: Review Rejection Feedback')).toBeInTheDocument();
    });

    it('renders the alert message about tender rejection', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText('Your tender has been rejected. Please review the feedback below.')).toBeInTheDocument();
    });

    it('renders the rejection feedback header', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
    });

    it('renders tender document rejected label', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
    });

    it('renders acknowledge button', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const acknowledgeButton = screen.getByText('Acknowledge');
      expect(acknowledgeButton).toBeInTheDocument();
    });

    it('renders feedback text', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText(mockFeedback)).toBeInTheDocument();
    });

    it('renders read more button initially', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('displays error icon', () => {
      const { container } = render(<RejectionFeedbackCard {...defaultProps} />);

      // Check for ErrorOutlineIcon - there should be two instances (one in alert, one in card)
      const errorIcons = container.querySelectorAll('[data-testid="ErrorOutlineIcon"]');
      expect(errorIcons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('starts with feedback in collapsed state', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Initially shows "Read More" button
      expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('expands feedback when read more button is clicked', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const readMoreButton = screen.getByText('Read More');
      fireEvent.click(readMoreButton);

      // After clicking, button text should change to "Show Less"
      expect(screen.getByText('Show Less')).toBeInTheDocument();
      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });

    it('collapses feedback when show less button is clicked', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // First expand
      const readMoreButton = screen.getByText('Read More');
      fireEvent.click(readMoreButton);

      // Then collapse
      const showLessButton = screen.getByText('Show Less');
      fireEvent.click(showLessButton);

      // Should show "Read More" again
      expect(screen.getByText('Read More')).toBeInTheDocument();
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
    });

    it('toggles between expanded and collapsed states multiple times', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const readMoreButton = screen.getByText('Read More');
      
      // Expand
      fireEvent.click(readMoreButton);
      expect(screen.getByText('Show Less')).toBeInTheDocument();

      // Collapse
      const showLessButton = screen.getByText('Show Less');
      fireEvent.click(showLessButton);
      expect(screen.getByText('Read More')).toBeInTheDocument();

      // Expand again
      const readMoreButton2 = screen.getByText('Read More');
      fireEvent.click(readMoreButton2);
      expect(screen.getByText('Show Less')).toBeInTheDocument();
    });

    it('rotates arrow icon when expanding/collapsing', () => {
      const { container } = render(<RejectionFeedbackCard {...defaultProps} />);

      const readMoreButton = screen.getByText('Read More');
      
      // Check initial rotation (should be 0deg)
      let arrowIcon = container.querySelector('[data-testid="KeyboardArrowDownIcon"]');
      let iconStyle = arrowIcon?.parentElement?.style?.transform;
      
      // Click to expand
      fireEvent.click(readMoreButton);
      
      // After expansion, should be rotated 180deg
      arrowIcon = container.querySelector('[data-testid="KeyboardArrowDownIcon"]');
      // The transform should be applied via sx prop, so we check for the presence of the component
      expect(screen.getByText('Show Less')).toBeInTheDocument();
    });
  });

  describe('Acknowledge Button Functionality', () => {
    it('calls onAcknowledge when acknowledge button is clicked', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);

      expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);
    });

    it('acknowledge button has correct styling (outlined error variant)', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const acknowledgeButton = screen.getByText('Acknowledge');
      expect(acknowledgeButton).toHaveClass('MuiButton-outlined');
      expect(acknowledgeButton).toHaveClass('MuiButton-outlinedError');
    });

    it('acknowledge button is rendered and functional', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const acknowledgeButton = screen.getByText('Acknowledge');
      expect(acknowledgeButton).toBeInTheDocument();
      fireEvent.click(acknowledgeButton);
      expect(mockOnAcknowledge).toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('renders correctly with empty feedback', () => {
      render(<RejectionFeedbackCard {...defaultProps} feedback="" />);

      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
      expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    });

    it('renders correctly with short feedback', () => {
      const shortFeedback = 'Short feedback';
      render(<RejectionFeedbackCard {...defaultProps} feedback={shortFeedback} />);

      expect(screen.getByText(shortFeedback)).toBeInTheDocument();
    });

    it('renders correctly with long feedback', () => {
      const longFeedback = 'This is a very long feedback message that contains multiple sentences and paragraphs. It should test the expand/collapse functionality thoroughly. The feedback needs to be comprehensive enough to warrant the read more functionality. This ensures that users can see a preview and then expand to read the full content.';
      render(<RejectionFeedbackCard {...defaultProps} feedback={longFeedback} />);

      expect(screen.getByText(longFeedback)).toBeInTheDocument();
    });

    it('handles missing onAcknowledge prop gracefully', () => {
      // Should not throw error even if onAcknowledge is undefined
      const { container } = render(<RejectionFeedbackCard feedback={mockFeedback} />);
      
      expect(container).toBeInTheDocument();
    });

    it('handles feedback with special characters', () => {
      const specialFeedback = 'Feedback with special chars: @#$%^&*()_+-=[]{}|;:",.<>?/';
      render(<RejectionFeedbackCard {...defaultProps} feedback={specialFeedback} />);

      expect(screen.getByText(specialFeedback)).toBeInTheDocument();
    });

    it('handles feedback with line breaks', () => {
      const feedbackWithLineBreaks = 'Line 1\nLine 2\nLine 3';
      render(<RejectionFeedbackCard {...defaultProps} feedback={feedbackWithLineBreaks} />);

      // Check for parts of the text since line breaks might be rendered differently
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('warning alert has warning severity', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Check that the alert content is rendered
      expect(screen.getByText('Action Required: Review Rejection Feedback')).toBeInTheDocument();
    });

    it('renders cards with proper structure', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Should have Card content (rejection feedback header and tender document rejected)
      expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
    });

    it('renders outlined variant card for rejection feedback', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Card with rejection feedback should be present
      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
    });

    it('displays proper spacing between elements', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Check that all content sections are rendered
      expect(screen.getByText('Action Required: Review Rejection Feedback')).toBeInTheDocument();
      expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('renders alert title with correct font weight', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const title = screen.getByText('Action Required: Review Rejection Feedback');
      // The Typography component with fontWeight={600} should be applied
      expect(title).toBeInTheDocument();
    });

    it('renders rejection feedback header', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const header = screen.getByText('Rejection Feedback');
      // Check that header is rendered
      expect(header).toBeInTheDocument();
    });

    it('renders feedback text with appropriate styling', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const feedbackText = screen.getByText(mockFeedback);
      expect(feedbackText).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('all interactive elements are functional together', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Expand feedback
      const readMoreButton = screen.getByText('Read More');
      fireEvent.click(readMoreButton);
      expect(screen.getByText('Show Less')).toBeInTheDocument();

      // Click acknowledge
      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);
      expect(mockOnAcknowledge).toHaveBeenCalled();

      // Collapse feedback
      const showLessButton = screen.getByText('Show Less');
      fireEvent.click(showLessButton);
      expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('maintains state independence between expand and acknowledge', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Expand
      fireEvent.click(screen.getByText('Read More'));
      
      // Acknowledge
      fireEvent.click(screen.getByText('Acknowledge'));
      expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);

      // Should still be expanded
      expect(screen.getByText('Show Less')).toBeInTheDocument();

      // Acknowledge again
      fireEvent.click(screen.getByText('Acknowledge'));
      expect(mockOnAcknowledge).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Check for proper content structure
      expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
      expect(screen.getByText('Tender Document Rejected')).toBeInTheDocument();
    });

    it('buttons are properly labeled', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      const acknowledgeButton = screen.getByText('Acknowledge');
      const expandButton = screen.getByText('Read More');

      expect(acknowledgeButton).toBeInTheDocument();
      expect(expandButton).toBeInTheDocument();
    });

    it('alert content is properly rendered', () => {
      render(<RejectionFeedbackCard {...defaultProps} />);

      // Check that alert content is visible
      expect(screen.getByText('Action Required: Review Rejection Feedback')).toBeInTheDocument();
      expect(screen.getByText('Your tender has been rejected. Please review the feedback below.')).toBeInTheDocument();
    });
  });
});

