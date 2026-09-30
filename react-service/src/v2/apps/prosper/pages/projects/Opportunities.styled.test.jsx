import React from 'react';
import { render } from '@testing-library/react';
import StyledOpportunities, { StyledOpportunitiesHeader } from './Opportunities.styled';

describe('Opportunities.styled.jsx', () => {
  describe('StyledOpportunities', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledOpportunities />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with default styles', () => {
      const { container } = render(<StyledOpportunities />);
      const styledDiv = container.firstChild;
      
      expect(styledDiv).toHaveStyle({
        display: 'flex',
        flexWrap: 'wrap',
        paddingTop: '22px',
        justifyContent: 'start'
      });
    });

    it('applies justify center style when justify prop is true', () => {
      const { container } = render(<StyledOpportunities justify />);
      const styledDiv = container.firstChild;
      
      expect(styledDiv).toHaveStyle({
        justifyContent: 'center'
      });
    });

    it('does not apply justify center style when justify prop is false', () => {
      const { container } = render(<StyledOpportunities justify={false} />);
      const styledDiv = container.firstChild;
      
      expect(styledDiv).toHaveStyle({
        justifyContent: 'start'
      });
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <StyledOpportunities>
          <div>Test Child</div>
        </StyledOpportunities>
      );
      
      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { container } = render(<StyledOpportunities />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with justify prop', () => {
      const { container } = render(<StyledOpportunities justify />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('StyledOpportunitiesHeader', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledOpportunitiesHeader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with default styles', () => {
      const { container } = render(<StyledOpportunitiesHeader />);
      const styledDiv = container.firstChild;
      
      expect(styledDiv).toHaveStyle({
        fontSize: '18px'
      });
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <StyledOpportunitiesHeader>
          <span className="two-dots">Test Header</span>
        </StyledOpportunitiesHeader>
      );
      
      expect(getByText('Test Header')).toBeInTheDocument();
    });

    it('renders with project name and matches classes', () => {
      const { container } = render(
        <StyledOpportunitiesHeader>
          <div className="project-name">Project Name</div>
          <div className="project-matches">
            <span>Matches: 5</span>
          </div>
        </StyledOpportunitiesHeader>
      );
      
      expect(container.querySelector('.project-name')).toBeInTheDocument();
      expect(container.querySelector('.project-matches')).toBeInTheDocument();
    });

    it('renders with h1 element', () => {
      const { getByRole } = render(
        <StyledOpportunitiesHeader>
          <h1>Header Title</h1>
        </StyledOpportunitiesHeader>
      );
      
      expect(getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { container } = render(<StyledOpportunitiesHeader />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with content', () => {
      const { container } = render(
        <StyledOpportunitiesHeader>
          <span className="two-dots">::</span>
          <div className="project-name">Test Project</div>
          <div className="project-matches">
            <span>3 matches</span>
          </div>
          <h1>Main Title</h1>
        </StyledOpportunitiesHeader>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});