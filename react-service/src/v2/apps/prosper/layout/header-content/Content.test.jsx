import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Content from './Content';

// Mock the URL helper
jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getUrl: jest.fn(() => '/mocked-logout-url')
}));

describe('Content', () => {
  const renderWithRouter = (component) => render(
    <BrowserRouter>{component}</BrowserRouter>
  );

  test('renders without crashing', () => {
    renderWithRouter(<Content />);
    
    // Should render a list
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  test('renders all profile actions', () => {
    renderWithRouter(<Content />);
    
    expect(screen.getByText('My profile')).toBeInTheDocument();
    expect(screen.getByText('Change password')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  test('profile and change password are links', () => {
    renderWithRouter(<Content />);
    
    const profileLink = screen.getByText('My profile').closest('a');
    const passwordLink = screen.getByText('Change password').closest('a');
    
    expect(profileLink).toHaveAttribute('href', '/my-company/profile');
    expect(passwordLink).toHaveAttribute('href', '/change-password');
  });

  test('logout has click handler', () => {
    const { goTo, getUrl } = require('v2/helpers/url');
    
    renderWithRouter(<Content />);
    
    const logoutItem = screen.getByText('Log out');
    fireEvent.click(logoutItem);
    
    expect(getUrl).toHaveBeenCalledWith('prosper', '/logout');
    expect(goTo).toHaveBeenCalledWith('/mocked-logout-url');
  });

  test('renders correct number of items', () => {
    renderWithRouter(<Content />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  test('snapshot test', () => {
    const { container } = renderWithRouter(<Content />);
    expect(container.firstChild).toMatchSnapshot();
  });
});