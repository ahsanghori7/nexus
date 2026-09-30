/** Bump when starting/cancelling AI so in-flight GET polls are ignored. */
export function bumpAiPollGeneration(state, packageId) {
  if (packageId == null) return;
  const current = state.aiPollGenerationById?.[packageId] ?? 0;
  state.aiPollGenerationById[packageId] = current + 1;
}

/** True when a GET response belongs to a superseded poll generation. */
export function isStaleAiPollResponse(state, packageId, pollGeneration) {
  if (packageId == null) return true;
  if (pollGeneration == null) return false;
  return pollGeneration !== state.aiPollGenerationById?.[packageId];
}
