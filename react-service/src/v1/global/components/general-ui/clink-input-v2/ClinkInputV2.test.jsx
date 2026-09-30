import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinkInputV2 from './index';

describe('ClinkInputV2 Component', () => {
  // Test basic rendering
  test('renders with default props', () => {
    render(<ClinkInputV2 />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveValue('');
    expect(inputElement).not.toBeDisabled();
  });

  // Test with initial string value
  test('renders with initial string value', () => {
    render(<ClinkInputV2 value="test value" />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveValue('test value');
  });

  // Test with initial number value
  test('renders with initial number value', () => {
    render(<ClinkInputV2 value={12345} />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveValue('12345');
  });

  // Test disabled state
  test('renders in disabled state', () => {
    render(<ClinkInputV2 disabled />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeDisabled();
  });

  // Test focus callback
  test('calls focus callback when focused', () => {
    const focusCallback = jest.fn();
    render(<ClinkInputV2 focus={focusCallback} />);
    const inputElement = screen.getByRole('textbox');

    fireEvent.focus(inputElement);
    expect(focusCallback).toHaveBeenCalledTimes(1);
  });

  // Test blur callback
  test('calls blur callback when blurred', () => {
    const blurCallback = jest.fn();
    render(<ClinkInputV2 blur={blurCallback} />);
    const inputElement = screen.getByRole('textbox');

    fireEvent.focus(inputElement);
    fireEvent.blur(inputElement);
    expect(blurCallback).toHaveBeenCalledTimes(1);
  });

  // Test change callback
  test('calls change callback with new and old values', () => {
    const changeCallback = jest.fn();
    render(<ClinkInputV2 value="initial" change={changeCallback} />);
    const inputElement = screen.getByRole('textbox');

    fireEvent.change(inputElement, { target: { value: 'new value' } });
    expect(changeCallback).toHaveBeenCalledWith('new value', 'initial');
  });

  // Test validation
  test('prevents change when validation fails', () => {
    const validator = jest.fn((value) => value.length <= 5);
    const changeCallback = jest.fn();

    render(
      <ClinkInputV2 value="init" validate={validator} change={changeCallback} />
    );

    const inputElement = screen.getByRole('textbox');

    // This should pass validation
    fireEvent.change(inputElement, { target: { value: 'valid' } });
    expect(validator).toHaveBeenCalledWith('valid');
    expect(changeCallback).toHaveBeenCalledTimes(1);

    // This should fail validation
    fireEvent.change(inputElement, { target: { value: 'too long value' } });
    expect(validator).toHaveBeenCalledWith('too long value');
    expect(changeCallback).toHaveBeenCalledTimes(1); // Still just 1 call
  });

  // Test parser
  test('applies parser to input value', () => {
    const parser = jest.fn((value) => value.toUpperCase());
    const changeCallback = jest.fn();

    render(<ClinkInputV2 parser={parser} change={changeCallback} />);

    const inputElement = screen.getByRole('textbox');

    fireEvent.change(inputElement, { target: { value: 'lower case' } });
    expect(parser).toHaveBeenCalledWith('lower case');
    expect(changeCallback).toHaveBeenCalledWith('LOWER CASE', '');
  });

  // Test keydown callback
  test('calls keydown callback on key press', () => {
    const keydownCallback = jest.fn();
    render(<ClinkInputV2 keydown={keydownCallback} />);
    const inputElement = screen.getByRole('textbox');

    fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter' });
    expect(keydownCallback).toHaveBeenCalledTimes(1);
    expect(keydownCallback.mock.calls[0][0].key).toBe('Enter');
  });

  // Test defaultValue behavior
  test('shows defaultValue when empty and not focused', () => {
    render(<ClinkInputV2 defaultValue="placeholder text" />);
    const inputElement = screen.getByRole('textbox');

    // Initially shows default value when not focused
    expect(inputElement).toHaveValue('placeholder text');

    // On focus, default value should disappear
    fireEvent.focus(inputElement);
    expect(inputElement).toHaveValue('');

    // On blur, default value should reappear
    fireEvent.blur(inputElement);
    expect(inputElement).toHaveValue('placeholder text');

    // If user enters text, default value should not show on blur
    fireEvent.focus(inputElement);
    fireEvent.change(inputElement, { target: { value: 'user input' } });
    fireEvent.blur(inputElement);
    expect(inputElement).toHaveValue('user input');
  });

  // Test renderer function with the new state parameter and setFocused function
  test('uses renderer function to display value with state information and setFocused', () => {
    // Create a mock renderer that uses the focused state
    const renderer = jest.fn((value, { state, setFocused }) => {
      // Verify setFocused is a function
      expect(typeof setFocused).toBe('function');
      return state.focused ? `Focused: ${value}` : `Blurred: ${value}`;
    });

    render(<ClinkInputV2 value="hello" renderer={renderer} />);
    const inputElement = screen.getByRole('textbox');

    // Initial render (not focused)
    expect(renderer).toHaveBeenCalled();
    expect(renderer.mock.calls[0][0]).toBe('hello');
    expect(renderer.mock.calls[0][1].state.focused).toBe(false);
    expect(typeof renderer.mock.calls[0][1].setFocused).toBe('function');
    expect(inputElement).toHaveValue('Blurred: hello');

    // When focused
    fireEvent.focus(inputElement);
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(true);
    expect(inputElement).toHaveValue('Focused: hello');

    // When blurred again
    fireEvent.blur(inputElement);
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(false);
    expect(inputElement).toHaveValue('Blurred: hello');
  });

  // Test renderer function's behavior with value changes
  test('renderer function updates correctly when value changes', () => {
    const renderer = jest.fn((value, { state, setFocused }) => {
      return `${value}-${state.focused ? 'focused' : 'blurred'}`;
    });

    render(<ClinkInputV2 value="initial" renderer={renderer} />);
    const inputElement = screen.getByRole('textbox');

    // Initial state
    expect(inputElement).toHaveValue('initial-blurred');

    // Change value while focused
    fireEvent.focus(inputElement);
    expect(inputElement).toHaveValue('initial-focused');

    fireEvent.change(inputElement, { target: { value: 'new value' } });
    expect(renderer.mock.calls[renderer.mock.calls.length - 1][0]).toBe(
      'new value'
    );
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(true);
    expect(
      typeof renderer.mock.calls[renderer.mock.calls.length - 1][1].setFocused
    ).toBe('function');
    expect(inputElement).toHaveValue('new value-focused');

    // Check after blur
    fireEvent.blur(inputElement);
    expect(renderer.mock.calls[renderer.mock.calls.length - 1][0]).toBe(
      'new value'
    );
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(false);
    expect(
      typeof renderer.mock.calls[renderer.mock.calls.length - 1][1].setFocused
    ).toBe('function');
    expect(inputElement).toHaveValue('new value-blurred');
  });

  // Test that renderer can programmatically control focus
  test('renderer can set focus state programmatically', () => {
    // This test verifies that the setFocused function passed to renderer works correctly
    let capturedSetFocused = null;

    const renderer = jest.fn((value, { state, setFocused }) => {
      capturedSetFocused = setFocused;
      return value;
    });

    render(<ClinkInputV2 value="test" renderer={renderer} />);
    const inputElement = screen.getByRole('textbox');

    // Verify renderer received setFocused function
    expect(typeof capturedSetFocused).toBe('function');

    // Initial state is not focused
    expect(renderer.mock.calls[0][1].state.focused).toBe(false);

    // Programmatically set focus to true
    act(() => {
      capturedSetFocused(true);
    });

    // Verify that the focused state was updated
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(true);

    // Programmatically set focus to false
    act(() => {
      capturedSetFocused(false);
    });

    // Verify that the focused state was updated
    expect(
      renderer.mock.calls[renderer.mock.calls.length - 1][1].state.focused
    ).toBe(false);
  });

  // Test complex case with multiple props including the updated renderer
  test('handles complex interactions correctly with updated renderer', () => {
    const focusCallback = jest.fn();
    const blurCallback = jest.fn();
    const changeCallback = jest.fn();
    const validatorCallback = jest.fn((value) => !value.includes('x'));
    const parserCallback = jest.fn((value) => value.trim());
    const rendererCallback = jest.fn((value, { state, setFocused }) => {
      // Verify setFocused is a function
      expect(typeof setFocused).toBe('function');
      return state.focused ? value : value.toUpperCase();
    });

    render(
      <ClinkInputV2
        value="initial"
        defaultValue="default"
        focus={focusCallback}
        blur={blurCallback}
        change={changeCallback}
        validate={validatorCallback}
        parser={parserCallback}
        renderer={rendererCallback}
      />
    );

    const inputElement = screen.getByRole('textbox');

    // Initial state (not focused)
    expect(rendererCallback.mock.calls[0][0]).toBe('initial');
    expect(rendererCallback.mock.calls[0][1].state.focused).toBe(false);
    expect(typeof rendererCallback.mock.calls[0][1].setFocused).toBe(
      'function'
    );
    expect(inputElement).toHaveValue('INITIAL');

    // Focus behavior
    fireEvent.focus(inputElement);
    expect(focusCallback).toHaveBeenCalledTimes(1);
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][0]
    ).toBe('initial');
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][1]
        .state.focused
    ).toBe(true);
    expect(inputElement).toHaveValue('initial');

    // Valid change
    fireEvent.change(inputElement, { target: { value: ' new value ' } });
    expect(validatorCallback).toHaveBeenCalledWith(' new value ');
    expect(parserCallback).toHaveBeenCalledWith(' new value ');
    expect(changeCallback).toHaveBeenCalledWith('new value', 'initial');
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][0]
    ).toBe('new value');
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][1]
        .state.focused
    ).toBe(true);
    expect(inputElement).toHaveValue('new value');

    // Invalid change
    fireEvent.change(inputElement, { target: { value: 'invalid x value' } });
    expect(validatorCallback).toHaveBeenCalledWith('invalid x value');
    expect(changeCallback).toHaveBeenCalledTimes(1); // Still just one call

    // Blur behavior
    fireEvent.blur(inputElement);
    expect(blurCallback).toHaveBeenCalledTimes(1);
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][0]
    ).toBe('new value');
    expect(
      rendererCallback.mock.calls[rendererCallback.mock.calls.length - 1][1]
        .state.focused
    ).toBe(false);
    expect(inputElement).toHaveValue('NEW VALUE');
  });
});
