import React, { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Snackbar Context
 * Global state management for snackbar notifications
 */
export const SnackbarContext = createContext({
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
    vertical: 'top',
    horizontal: 'right',
  },
  showSnackbar: () => {},
  closeSnackbar: () => {},
});

/**
 * Snackbar Provider Component
 * Wrap your app or component tree with this provider
 */
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    vertical: 'top',
    horizontal: 'right',
  });

  /**
   * Show snackbar with a message
   * @param {string} message - The message to display
   * @param {string} severity - The severity level ('success', 'error', 'warning', 'info')
   * @param {object} options - Additional options (vertical, horizontal, autoHideDuration)
   */
  const showSnackbar = useCallback((message, severity = 'info', options = {}) => {
    setSnackbar({
      open: true,
      message,
      severity,
      vertical: options.vertical || 'top',
      horizontal: options.horizontal || 'right',
      autoHideDuration: options.autoHideDuration || 4000,
    });
  }, []);

  /**
   * Close the snackbar
   */
  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const value = {
    snackbar,
    showSnackbar,
    closeSnackbar,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
    </SnackbarContext.Provider>
  );
};

SnackbarProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SnackbarContext;
