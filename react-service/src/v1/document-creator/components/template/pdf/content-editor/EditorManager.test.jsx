import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropTypes from 'prop-types';
import EditorManager from './EditorManager';

describe('EditorManager', () => {
  let consoleLogSpy;
  const mockHandleConfigChange = jest.fn();
  const mockSetShow = jest.fn();
  const defaultProps = {
    value: { content: '<p>Initial content</p>' },
    handleConfigChange: mockHandleConfigChange,
    setShow: mockSetShow,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it('should render with default props', () => {
    render(<EditorManager />);

    // Verify the component renders with default props
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
  });

  // PropTypes validation tests
  describe('PropTypes', () => {
    const consoleError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = consoleError;
    });

    it('should not throw error for valid props', () => {
      PropTypes.checkPropTypes(
        EditorManager.propTypes,
        defaultProps,
        'prop',
        'EditorManager',
      );
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should throw error for invalid value prop type', () => {
      const invalidProps = {
        ...defaultProps,
        value: 'string instead of object',
      };

      PropTypes.checkPropTypes(
        EditorManager.propTypes,
        invalidProps,
        'prop',
        'EditorManager',
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw error for invalid handleConfigChange prop type', () => {
      const invalidProps = {
        ...defaultProps,
        handleConfigChange: 'string instead of function',
      };

      PropTypes.checkPropTypes(
        EditorManager.propTypes,
        invalidProps,
        'prop',
        'EditorManager',
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw error for invalid setShow prop type', () => {
      const invalidProps = {
        ...defaultProps,
        setShow: 'string instead of function',
      };

      PropTypes.checkPropTypes(
        EditorManager.propTypes,
        invalidProps,
        'prop',
        'EditorManager',
      );
      expect(console.error).toHaveBeenCalled();
    });
  });
});
