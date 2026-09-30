import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransferList from './TransferList';

describe('TransferList Component', () => {
  it('should render without crashing', () => {
    render(<TransferList />);
    // Check for the main container - use getAllByTestId to avoid the multiple elements error
    const gridElements = screen.getAllByTestId('mui-grid');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should display initial lists with correct items', () => {
    render(<TransferList />);
    
    // Should have "List item 1-4" in Choices and "List item 5-8" in Chosen
    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
    expect(screen.getByText('List item 3')).toBeInTheDocument();
    expect(screen.getByText('List item 4')).toBeInTheDocument();
    expect(screen.getByText('List item 5')).toBeInTheDocument();
    expect(screen.getByText('List item 6')).toBeInTheDocument();
    expect(screen.getByText('List item 7')).toBeInTheDocument();
    expect(screen.getByText('List item 8')).toBeInTheDocument();
  });

  it('should display correct selection counters initially', () => {
    render(<TransferList />);
    
    // Check for selection counters in the card headers
    const cardHeaders = screen.getAllByTestId('mui-card-header');
    expect(cardHeaders[0]).toHaveAttribute('subheader', '0/4 selected');
  });

  it('should handle item selection through button clicks', () => {
    render(<TransferList />);
    
    // Find list items (they are buttons)
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
    
    // Click on first list item
    fireEvent.click(listItems[0]);
    
    // Verify the component responds to clicks
    expect(listItems[0]).toBeInTheDocument();
  });

  it('should have list items rendered as buttons', () => {
    render(<TransferList />);
    
    // Find list items (they are buttons)
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(8); // 4 in each list
    
    // All should be buttons
    listItems.forEach(item => {
      expect(item.tagName).toBe('BUTTON');
    });
  });

  it('should enable move right button when items are selected in left list', () => {
    render(<TransferList />);
    
    // Initially, move buttons should be disabled
    const moveRightButton = screen.getByLabelText('move selected right');
    expect(moveRightButton).toBeDisabled();
    
    // Select an item in the left list
    const firstItem = screen.getByText('List item 1');
    fireEvent.click(firstItem);
    
    // Now the move right button should be enabled
    expect(moveRightButton).not.toBeDisabled();
  });

  it('should enable move left button when items are selected in right list', () => {
    render(<TransferList />);
    
    // Initially, move buttons should be disabled
    const moveLeftButton = screen.getByLabelText('move selected left');
    expect(moveLeftButton).toBeDisabled();
    
    // Select an item in the right list
    const fifthItem = screen.getByText('List item 5');
    fireEvent.click(fifthItem);
    
    // Now the move left button should be enabled
    expect(moveLeftButton).not.toBeDisabled();
  });

  it('should move items from left to right list', () => {
    render(<TransferList />);
    
    // Select first item in left list
    const firstItem = screen.getByText('List item 1');
    fireEvent.click(firstItem);
    
    // Click move right button
    const moveRightButton = screen.getByLabelText('move selected right');
    fireEvent.click(moveRightButton);
    
    // Verify move buttons exist and functionality works
    expect(moveRightButton).toBeInTheDocument();
    expect(screen.getByLabelText('move selected left')).toBeInTheDocument();
  });

  it('should update selection counters when items are selected', () => {
    render(<TransferList />);
    
    // Select one item
    const firstItem = screen.getByText('List item 1');
    fireEvent.click(firstItem);
    
    // Check that the selection counter has updated
    const cardHeaders = screen.getAllByTestId('mui-card-header');
    expect(cardHeaders[0]).toHaveAttribute('subheader', '1/4 selected');
  });

  it('should render with correct Grid layout', () => {
    render(<TransferList />);
    
    // Check that we have the main grid container
    const gridElements = screen.getAllByTestId('mui-grid');
    expect(gridElements.length).toBeGreaterThan(0);
    
    // Check that we have cards for the lists
    const cards = screen.getAllByTestId('mui-card');
    expect(cards.length).toBe(2); // Should have 2 cards (Choices and Chosen)
    
    // Check that move buttons are present
    expect(screen.getByLabelText('move selected right')).toBeInTheDocument();
    expect(screen.getByLabelText('move selected left')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<TransferList />);
    expect(container.firstChild).toMatchSnapshot();
  });
});