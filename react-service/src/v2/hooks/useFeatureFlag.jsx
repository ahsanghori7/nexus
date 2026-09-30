import { useSelector } from 'react-redux';
import { isFeatureEnabled } from 'v2/utils/featureFlags';

/**
 * Custom hook to check if a feature is enabled with optional role-based access control.
 *
 * This hook automatically retrieves the account from Redux store and provides
 * a convenient way to check feature flags in React components.
 *
 * @returns {Function} checkFeature - Function to check if a feature is enabled
 *
 * @example
 * // In a component
 * import useFeatureFlag from 'v2/hooks/useFeatureFlag';
 *
 * function MyComponent() {
 *   const checkFeature = useFeatureFlag();
 *
 *   // Check if feature is enabled (no role restriction)
 *   const canViewNewUI = checkFeature('new-ui');
 *
 *   // Check if feature is enabled AND user has allowed role
 *   const canAccessAdminPanel = checkFeature('admin-panel', [1, 2, 3]);
 *
 *   return (
 *     <>
 *       {canViewNewUI && <NewUIComponent />}
 *       {canAccessAdminPanel && <AdminPanel />}
 *     </>
 *   );
 * }
 */
const useFeatureFlag = () => {
  const account = useSelector((state) => state.clinkAccount);

  // list of feature flags function
  /**
   * Check if a feature is enabled for the current user
   *
   * @param {string} flagName - The name of the feature flag to check
   * @param {number[]} allowedRoleIDs - Optional array of role IDs that are allowed to access this feature
   * @returns {boolean} - Returns true if the feature flag is enabled and (if roles specified) the user's role is allowed
   */
  const checkFeature = (flagName, allowedRoleIDs = []) => {
    return isFeatureEnabled(account, flagName, allowedRoleIDs);
  };

  return {checkFeature};
};

export default useFeatureFlag;
