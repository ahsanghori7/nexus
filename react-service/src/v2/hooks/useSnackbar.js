import { useContext } from 'react';
import { SnackbarContext } from '../contexts/SnackbarContext';

/**
 * Custom hook to access Snackbar functionality
 *
 * @returns {Object} Snackbar context value
 * @returns {Object} snackbar - Current snackbar state
 * @returns {Function} showSnackbar - Function to show snackbar
 * @returns {Function} closeSnackbar - Function to close snackbar
 *
 * @example
 * const { showSnackbar, closeSnackbar } = useSnackbar();
 *
 * // Show success message
 * showSnackbar('Operation successful!', 'success');
 *
 * // Show error message
 * showSnackbar('Something went wrong', 'error');
 *
 * // Show with custom position
 * showSnackbar('Custom position', 'info', {
 *   vertical: 'bottom',
 *   horizontal: 'left'
 * });
 */
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }

  return context;
};

export default useSnackbar;
