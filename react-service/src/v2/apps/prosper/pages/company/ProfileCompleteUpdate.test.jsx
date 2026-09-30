import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileCompleteUpdate from './ProfileCompleteUpdate';

// Mock the getUrl function
jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((app, path) => `https://test.example.com${path}`)
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'profile-complete-update-1': 'Your profile has been updated. You can now ',
      'profile-complete-update-2': 'complete your prequalification',
      'profile-complete-update-3': ' to access more opportunities or ',
      'profile-complete-update-4': 'browse current projects'
    };
    return translations[key] || key;
  })
}));

describe('ProfileCompleteUpdate', () => {
  it('renders without crashing', () => {
    render(<ProfileCompleteUpdate />);
    // Check for parts of the text that aren't broken by links
    expect(screen.getByText('complete your prequalification')).toBeInTheDocument();
  });

  it('displays all text content correctly', () => {
    render(<ProfileCompleteUpdate />);
    
    // Use partial text matches since the text is broken up by links
    expect(screen.getByText(/Your profile has been updated/)).toBeInTheDocument();
    expect(screen.getByText('complete your prequalification')).toBeInTheDocument();
    expect(screen.getByText(/to access more opportunities/)).toBeInTheDocument();
    expect(screen.getByText('browse current projects')).toBeInTheDocument();
  });

  it('contains correct links with proper hrefs', () => {
    render(<ProfileCompleteUpdate />);
    
    const prequalificationLink = screen.getByText('complete your prequalification');
    const projectsLink = screen.getByText('browse current projects');
    
    expect(prequalificationLink).toHaveAttribute('href', 'https://test.example.com/my-company/prequalification');
    expect(prequalificationLink).toHaveAttribute('target', '_blank');
    
    expect(projectsLink).toHaveAttribute('href', 'https://test.example.com/projects/enquiries');
    expect(projectsLink).toHaveAttribute('target', '_blank');
  });

  it('links have proper cursor styling', () => {
    render(<ProfileCompleteUpdate />);
    
    const prequalificationLink = screen.getByText('complete your prequalification');
    const projectsLink = screen.getByText('browse current projects');
    
    expect(prequalificationLink).toHaveStyle('cursor: pointer');
    expect(projectsLink).toHaveStyle('cursor: pointer');
  });

  it('matches snapshot for UI consistency', () => {
    const { container } = render(<ProfileCompleteUpdate />);
    expect(container.firstChild).toMatchSnapshot();
  });
});