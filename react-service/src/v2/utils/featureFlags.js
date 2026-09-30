/**
 * Checks if a feature is enabled for an account, with optional role-based access control.
 *
 * @param {Object} account - The account object containing user and features information
 * @param {string} flagName - The name of the feature flag to check
 * @param {number[]} allowedRoleIDs - Optional array of role IDs that are allowed to access this feature
 * @returns {boolean} - Returns true if the feature flag is enabled and (if roles specified) the user's role is allowed
 *
 * @example
 * // Check if feature is enabled (no role restriction)
 * isFeatureEnabled(account, 'new-feature');
 *
 * @example
 * // Check if feature is enabled AND user has allowed role
 * isFeatureEnabled(account, 'admin-feature', [1, 2, 3]);
 */
export function isFeatureEnabled(account, flagName, allowedRoleIDs = []) {
  // Validate that allowedRoleIDs is an array of numbers
  if (allowedRoleIDs.length > 0) {
    const hasInvalidRoleID = allowedRoleIDs.some(id => typeof id !== 'number');
    if (hasInvalidRoleID) {
      console.error(`isFeatureEnabled: allowedRoleIDs must be an array of numbers, received:`, allowedRoleIDs);
      throw new TypeError('allowedRoleIDs must be an array of numbers, not strings');
    }
  }

  const currentUserTypeId = Number(account?.user?.type_id);
  const features = account?.features || [];
  const flagEnabled = features.some(flag => flag.name === flagName);
  if (!allowedRoleIDs.length) return flagEnabled;
  const rolePermitted = allowedRoleIDs.includes(currentUserTypeId);
  return flagEnabled && rolePermitted;
}
