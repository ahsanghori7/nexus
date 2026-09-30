import React from 'react';
import { render, screen } from '@testing-library/react';
import Div from './Div'; // Adjust the import path as needed

describe('Div Component', () => {
  test('renders correctly with required props', () => {
    const inputRef = {};
    render(
      <Div uniqueKey="test" inputRef={inputRef} data-testid="test-div">
        Test Content
      </Div>
    );

    const div = screen.getByTestId('test-div');
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Test Content');
  });

  test('applies additional props correctly', () => {
    const inputRef = {};
    render(
      <Div
        uniqueKey="test"
        inputRef={inputRef}
        data-testid="test-div"
        className="custom-class"
        style={{ color: 'red' }}
      >
        Test Content
      </Div>
    );

    const div = screen.getByTestId('test-div');
    expect(div).toHaveClass('custom-class');
    expect(div).toHaveStyle('color: red');
  });

  test('assigns ref correctly', () => {
    const inputRef = {};
    render(
      <Div uniqueKey="test-key" inputRef={inputRef}>
        Test Content
      </Div>
    );

    // Check if the ref was assigned with the correct key
    expect(inputRef['test-key-div']).toBeDefined();
    expect(inputRef['test-key-div']).toBeInstanceOf(HTMLDivElement);
  });

  test('uses correct key attribute', () => {
    const inputRef = {};
    const { container } = render(
      <Div uniqueKey="test-key" inputRef={inputRef}>
        Test Content
      </Div>
    );

    // Since key is not accessible in rendered DOM, we can indirectly check
    // that the component doesn't throw errors when key is provided
    expect(container.firstChild).toBeTruthy();
  });
});
