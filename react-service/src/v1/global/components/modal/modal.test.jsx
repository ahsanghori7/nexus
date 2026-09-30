import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './index';
import userEvent from '@testing-library/user-event';

describe('Modal Component', () => {
  it('renders without crashing', () => {
    render(<Modal />);
  });

  it('opens the modal when the button is clicked', () => {
    render(<Modal />);
    const button = screen.getByRole('button', { name: /modal/i }); // Adjust regex if your button text is different
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeVisible(); // Check if the modal is visible
  });

  it('displays the correct title and subtitle', () => {
    render(<Modal title="Test Title" subtitle="Test Subtitle" />);
    const button = screen.getByRole('button', { name: /test title/i });
    fireEvent.click(button);
    expect(screen.getByTestId('title', { name: /test title/i })).toBeVisible();
    expect(screen.getByText('Test Subtitle')).toBeVisible();
  });

  it('displays custom button content', () => {
      render(<Modal buttonContent="Open Modal" />);
      expect(screen.getByRole('button', { name: /open modal/i })).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Modal><div>Test Content</div></Modal>);
    const button = screen.getByRole('button', { name: /modal/i });
    fireEvent.click(button);
    expect(screen.getByText('Test Content')).toBeVisible();
  });

    it('calls onHide when the modal is closed', () => {
        const onHide = jest.fn();
        render(<Modal onHide={onHide} />);
        const button = screen.getByRole('button', { name: /modal/i });
        fireEvent.click(button);
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(onHide).toHaveBeenCalledTimes(1);
    });


  it('uses a custom ShowButton component', () => {
    const CustomButton = ({ handleClick, content }) => (
      <button onClick={handleClick} data-testid="custom-button">
        {content}
      </button>
    );
    render(<Modal ShowButton={CustomButton} />);
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });

    it('renders when title prop is a react component', () => {
        const TitleComponent = <h1>Custom Title</h1>;
        render(<Modal title={TitleComponent} />);
        const button = screen.getByRole('button', { name: /custom title/i });
        fireEvent.click(button);
        expect(screen.getByTestId('title', { name: /custom title/i })).toBeVisible();
    });

    it('renders when subtitle prop is a react component', () => {
        const SubtitleComponent = <div>Custom Subtitle</div>;
        render(<Modal subtitle={SubtitleComponent} />);
        const button = screen.getByRole('button', { name: /modal/i });
        fireEvent.click(button);
        expect(screen.getByTestId('subtitle')).toBeVisible();
    });

    it('renders when buttonContent prop is a react component', () => {
        const ButtonContentComponent = <p>Custom Button Content</p>;
        render(<Modal buttonContent={ButtonContentComponent} />);
        expect(screen.getByRole('button', { name: /custom button content/i })).toBeInTheDocument();
    });

    it('renders using the render prop', () => {
        const renderFn = jest.fn((modalProps) => <div>Render Prop Content</div>);
        render(<Modal render={renderFn} />);
        const button = screen.getByRole('button', { name: /modal/i });
        fireEvent.click(button);
        expect(renderFn).toHaveBeenCalled();
        expect(screen.getByText('Render Prop Content')).toBeVisible();
    });

    it('does not render close button when showClose is false', () => {
        render(<Modal showClose={false} />);
        const button = screen.getByRole('button', { name: /modal/i });
        fireEvent.click(button);
        expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
});
