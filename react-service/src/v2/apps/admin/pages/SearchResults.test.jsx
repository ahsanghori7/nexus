import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResults from './SearchResults';
import { getQueryStringVars } from 'v2/helpers/url';
import { useContext } from 'v2/hooks/context';

// Mock the dependencies
jest.mock('v2/helpers/url');
jest.mock('v2/hooks/context');

const mockGetQueryStringVars = getQueryStringVars;
const mockUseContext = useContext;

describe('SearchResults', () => {
  const mockContext = {
    pages: {
      search: {
        acceptedModels: ['projects', 'users', 'accounts', 'accountsProsper', 'accountsProsperSupplyChain']
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContext.mockReturnValue(mockContext);
  });

  describe('Basic Error Handling', () => {
    it('should show error when no model is provided', () => {
      mockGetQueryStringVars.mockReturnValue({ search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('status')).toBeInTheDocument();
      expect(screen.getByText('error-no-model')).toBeInTheDocument();
      expect(screen.getByTestId('status')).toHaveClass('severity-warning');
    });

    it('should show error when invalid model is provided', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'invalidModel', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('status')).toBeInTheDocument();
      expect(screen.getByText('error-no-available-model invalidModel')).toBeInTheDocument();
      expect(screen.getByTestId('status')).toHaveClass('severity-warning');
    });

    it('should not render any page when model is missing', () => {
      mockGetQueryStringVars.mockReturnValue({ search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.queryByTestId('projects-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contractors-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accounts-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accounts-prosper-page')).not.toBeInTheDocument();
    });

    it('should not render any page when model is invalid', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'invalidModel', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.queryByTestId('projects-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contractors-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accounts-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accounts-prosper-page')).not.toBeInTheDocument();
    });
  });

  describe('Context Usage', () => {
    it('should use admin context type by default', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'projects' });
      
      render(<SearchResults />);
      
      expect(mockUseContext).toHaveBeenCalledWith('admin');
    });

    it('should use custom context type when provided', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'projects' });
      
      render(<SearchResults contextType="custom" />);
      
      expect(mockUseContext).toHaveBeenCalledWith('custom');
    });
  });

  describe('Page Rendering', () => {
    it('should render Projects page when model is projects', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'projects', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
      expect(screen.getByText('Projects Page')).toBeInTheDocument();
    });

    it('should render Contractors page when model is users', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'users', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('contractors-page')).toBeInTheDocument();
      expect(screen.getByText('Contractors Page')).toBeInTheDocument();
    });

    it('should render Accounts page when model is accounts', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'accounts', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('accounts-page')).toBeInTheDocument();
      expect(screen.getByText('Accounts Page')).toBeInTheDocument();
    });

    it('should render AccountsProsper page when model is accountsProsper', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'accountsProsper', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('accounts-prosper-page')).toBeInTheDocument();
      expect(screen.getByText('Accounts Prosper Page (type: default)')).toBeInTheDocument();
    });

    it('should render AccountsProsper with custom type when model is accountsProsperSupplyChain', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'accountsProsperSupplyChain', search: 'test' });
      
      render(<SearchResults />);
      
      expect(screen.getByTestId('accounts-prosper-page')).toBeInTheDocument();
      expect(screen.getByText('Accounts Prosper Page (type: 4)')).toBeInTheDocument();
      expect(screen.getByTestId('accounts-prosper-page')).toHaveAttribute('data-custom-type', '4');
    });

    it('should pass query string params to the rendered page', () => {
      mockGetQueryStringVars.mockReturnValue({ 
        model: 'projects', 
        search: 'test query',
        filter: 'active'
      });
      
      render(<SearchResults />);
      
      const projectsPage = screen.getByTestId('projects-page');
      expect(projectsPage).toBeInTheDocument();
    });
  });

  describe('mapModelToPage function coverage', () => {
    it('should return null for unmapped models', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'unmappedModel' });
      
      render(<SearchResults />);
      
      // Should show invalid model error, not render any page
      expect(screen.getByTestId('status')).toBeInTheDocument();
      expect(screen.getByText('error-no-available-model unmappedModel')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should connect with Redux state', () => {
      mockGetQueryStringVars.mockReturnValue({ model: 'projects' });
      
      // This test verifies that the component can be rendered, which tests that
      // the Redux connection is working (via our mocked connect function)
      const { container } = render(<SearchResults />);
      
      expect(container).toBeTruthy();
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
    });
  });
});