import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import FooterContent from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'prosper': 'Prosper',
        'admin': 'Admin',
        'revision': 'Revision'
      };
      return translations[key] || key;
    }
  })
}));

// Create a basic theme for styled components
const mockTheme = {};

describe('FooterContent', () => {
  const renderWithTheme = (component) =>
    render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);

  test('renders without crashing', () => {
    renderWithTheme(<FooterContent />);
    
    expect(screen.getByText('Prosper Admin')).toBeInTheDocument();
    expect(screen.getByText('Revision 1.6')).toBeInTheDocument();
  });

  test('renders with default revision 1.6', () => {
    renderWithTheme(<FooterContent />);
    
    const revisionElement = screen.getByText('Revision 1.6');
    expect(revisionElement).toBeInTheDocument();
  });

  test('renders with custom revision', () => {
    renderWithTheme(<FooterContent revision="2.0" />);
    
    const revisionElement = screen.getByText('Revision 2.0');
    expect(revisionElement).toBeInTheDocument();
  });

  test('renders main label correctly', () => {
    renderWithTheme(<FooterContent />);
    
    const mainElement = screen.getByText('Prosper Admin');
    expect(mainElement).toBeInTheDocument();
  });

  test('renders revision label correctly', () => {
    const customRevision = '3.1';
    renderWithTheme(<FooterContent revision={customRevision} />);
    
    const revisionElement = screen.getByText(`Revision ${customRevision}`);
    expect(revisionElement).toBeInTheDocument();
  });

  test('uses i18n translations correctly', () => {
    renderWithTheme(<FooterContent />);
    
    // Test that the translations are being used
    expect(screen.getByText('Prosper Admin')).toBeInTheDocument();
    expect(screen.getByText('Revision 1.6')).toBeInTheDocument();
  });

  test('renders both container items', () => {
    const { container } = renderWithTheme(<FooterContent />);
    
    // Should have a container with two direct child items
    const containerElement = container.querySelector('div');
    const containerItems = containerElement.children;
    expect(containerItems).toHaveLength(2);
  });

  test('snapshot test', () => {
    const { container } = renderWithTheme(<FooterContent />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('snapshot test with custom revision', () => {
    const { container } = renderWithTheme(<FooterContent revision="4.5" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});