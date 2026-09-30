import {
  AI_LIFECYCLE_STATUS,
  normalizeAiLifecycleStatus,
} from 'v2/apps/clink/pages/boq/boqAiStatus';

/**
 * Whether to GET ai/generate-boq/:packageId for a package with no persisted or draft rows.
 * Used after fetchBoQList wipes local draft state while AI job data may still exist on the server.
 * Does not re-fetch terminal FAILURE (invalid file) — UI stays on failure banner + New BoQ.
 */
export const shouldFetchAiGenerateBoqStatus = ({
  packageId,
  entity,
  aiGenerationById,
  skipAiRehydration,
}) => {
  if (!packageId || skipAiRehydration) return false;
  if (entity?.entries?.length) return false;
  if (entity?.nextEntries?.length) return false;

  const status = normalizeAiLifecycleStatus(
    aiGenerationById?.[packageId]?.status
  );
  if (!status) return true;
  if (
    status === AI_LIFECYCLE_STATUS.PENDING ||
    status === AI_LIFECYCLE_STATUS.STARTED
  ) {
    return true;
  }
  if (status === AI_LIFECYCLE_STATUS.SUCCESS && !aiGenerationById[packageId]?.result) {
    return true;
  }

  return false;
};
