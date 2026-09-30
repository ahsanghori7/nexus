import React from 'react';
import { render } from '@testing-library/react';
import StyledContainer, { StyledEnquiryModal } from './Container.styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      SM_SCREEN: 768,
      MD_SCREEN: 1024,
      LG_SCREEN: 1200,
    },
  },
}));

describe('Container.styled Components', () => {
  describe('StyledContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with align prop', () => {
      const { container } = render(<StyledContainer align="text-align: center" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with children', () => {
      const { getByText } = render(
        <StyledContainer>
          <div>Test content</div>
        </StyledContainer>
      );
      expect(getByText('Test content')).toBeInTheDocument();
    });

    it('renders with find-opportunities-filters class', () => {
      const { container } = render(
        <StyledContainer className="find-opportunities-filters">
          Test content
        </StyledContainer>
      );
      expect(container.firstChild).toHaveClass('find-opportunities-filters');
    });

    it('renders with registered-filters class', () => {
      const { container } = render(
        <StyledContainer className="registered-filters">
          Test content
        </StyledContainer>
      );
      expect(container.firstChild).toHaveClass('registered-filters');
    });

    it('renders with enquiries-filters class', () => {
      const { container } = render(
        <StyledContainer className="enquiries-filters">
          Test content
        </StyledContainer>
      );
      expect(container.firstChild).toHaveClass('enquiries-filters');
    });

    it('applies max-width styling', () => {
      const { container } = render(<StyledContainer />);
      const styledDiv = container.firstChild;
      
      expect(styledDiv).toHaveStyle({
        'max-width': '1330px',
        'margin-left': 'auto',
        'margin-right': 'auto',
      });
    });

    it('creates snapshot for StyledContainer', () => {
      const { container } = render(
        <StyledContainer className="find-opportunities-filters">
          <div className="clink-status">Status content</div>
          <div className="table-container">Table content</div>
        </StyledContainer>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('StyledEnquiryModal', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledEnquiryModal />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with children', () => {
      const { getByText } = render(
        <StyledEnquiryModal>
          <button className="auto-open-btn">Auto Open</button>
          <div>Modal content</div>
        </StyledEnquiryModal>
      );
      expect(getByText('Modal content')).toBeInTheDocument();
      expect(getByText('Auto Open')).toBeInTheDocument();
    });

    it('hides auto-open-btn button', () => {
      const { container } = render(
        <StyledEnquiryModal>
          <button className="auto-open-btn">Auto Open</button>
        </StyledEnquiryModal>
      );
      const button = container.querySelector('.auto-open-btn');
      expect(button).toHaveStyle('display: none');
    });

    it('creates snapshot for StyledEnquiryModal', () => {
      const { container } = render(
        <StyledEnquiryModal>
          <button className="auto-open-btn">Auto Open</button>
          <div>Modal content</div>
        </StyledEnquiryModal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});