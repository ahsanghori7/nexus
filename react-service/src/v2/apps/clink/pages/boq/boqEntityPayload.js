import { v4 as uuidv4 } from 'uuid';
import { normalizeBoqLineBreaks } from 'v2/apps/shared/components/boq/boqLineText';

/** Matches draft `item_version` used in upload / default scratch rows (see upload/initialEntries). */
export const defaultBoqItemVersion = () => ({
  boq_item_mapping_id: undefined,
  id: undefined,
  status: 2,
  version: 1,
});

/**
 * Resolves `unit_id` from `unit` label/symbol (same as upload file-content + units list).
 * @param {string|null|undefined} unitSymbol
 * @param {Array<{ symbol?: string, value?: number }>} [units]
 * @param {number|undefined} [existingUnitId]
 */
export const resolveUnitId = (unitSymbol, units, existingUnitId) => {
  if (existingUnitId != null) return existingUnitId;
  if (!unitSymbol || !units?.length) return undefined;
  const match = units.find(
    (u) =>
      String(u.symbol).toLowerCase() === String(unitSymbol).toLowerCase()
  );
  return match?.value;
};

/**
 * PATCH `boq/entity/:id` body: same object `handleUpdateBoQ` / Save sends.
 * @param {{ id?: number|null, text?: string } | null | undefined} nextNote
 * @param {Array<Record<string, unknown>>} nextEntries
 * @param {number} deleteStatus
 */
export const buildBoqEntityUpdatePayload = (nextNote, nextEntries, deleteStatus) => {
  let index = 0;
  return {
    notes: {
      id: nextNote?.id ?? null,
      text: nextNote?.text ?? '',
    },
    entries: nextEntries.map((item) => {
      const newItem = { ...item };
      if ('edited' in newItem) {
        delete newItem.edited;
      }
      const { status } = newItem.item_version || {};
      if (Number(status) === deleteStatus) {
        if ('position' in newItem) {
          delete newItem.position;
        }
        return newItem;
      }
      index += 1;
      return {
        ...newItem,
        position: index,
        budget_rate: Number(newItem.budget_rate),
        budget_total: Number(newItem.budget_total),
        quantity: Number(newItem.quantity),
      };
    }),
  };
};

/**
 * "New BoQ" confirm: same PATCH as Save (`boq/entity/:id`) but every row is soft-deleted
 * (version mapping status = deleted). Strips `position` (per legacy behaviour); coerces
 * budget/quantity numbers like Save. Notes shape matches `buildBoqEntityUpdatePayload`.
 *
 * @param {{ id?: number|null, text?: string } | null | undefined} nextNote
 * @param {Array<Record<string, unknown>>} nextEntries
 * @param {number} deleteStatus
 */
export const buildNewBoqUpdatePayload = (nextNote, nextEntries, deleteStatus) => ({
  is_new: true,
  notes: {
    id: nextNote?.id ?? null,
    text: nextNote?.text ?? '',
  },
  entries: nextEntries.map((item) => {
    const newItem = { ...item };
    if ('edited' in newItem) {
      delete newItem.edited;
    }
    if ('position' in newItem) {
      delete newItem.position;
    }
    const baseIv =
      newItem.item_version && typeof newItem.item_version === 'object'
        ? newItem.item_version
        : defaultBoqItemVersion();
    return {
      ...newItem,
      budget_rate: Number(newItem.budget_rate),
      budget_total: Number(newItem.budget_total),
      quantity: Number(newItem.quantity),
      item_version: {
        ...baseIv,
        status: deleteStatus,
      },
    };
  }),
});

/**
 * One AI API line item → in-memory BOQ row matching grid / fetchBoQList + scratch templates.
 * @param {object} e – raw `result.entries[]` from GET ai/generate-boq
 * @param {{ units?: Array<{ symbol?: string, value?: number }>, index: number }} ctx
 */
export const mapAiApiEntryToBoqDraftRow = (e, { units, index: idx }) => {
  const typeRaw = String(e.type || '').toLowerCase().replace(/\s+/g, '_');
  // AI GET response may include backend ids / item_version metadata.
  // For draft preview we always use a clean client-side version object; server ids should only
  // be introduced via `fetchBoQList` after a user explicitly saves.
  const itemVersion = defaultBoqItemVersion();

  const unitId = resolveUnitId(e.unit, units, e.unit_id);

  return {
    // New lines from Smart BoQ: client id until save (same as upload scratch / quick upload rows)
    id: uuidv4(),
    item_no: normalizeBoqLineBreaks(e.item_no ?? ''),
    description: normalizeBoqLineBreaks(e.description ?? ''),
    type: typeRaw,
    quantity: Number(e.quantity ?? 0),
    tenderee_note: normalizeBoqLineBreaks(e.tenderee_note ?? ''),
    budget_rate: Number(e.budget_rate ?? 0),
    budget_total: Number(e.budget_total ?? 0),
    unit_id: unitId,
    unit: e.unit ?? null,
    item_version: itemVersion,
    position: e.position != null ? Number(e.position) : idx + 1,
  };
};

/**
 * @param {Array<object>|undefined} rawEntries
 * @param {{ units?: Array<{ symbol?: string, value?: number }> }} ctx
 * @returns {Array<ReturnType<typeof mapAiApiEntryToBoqDraftRow>>}
 */
export const mapAiResultEntriesToBoqDraftRows = (rawEntries, { units = [] } = {}) =>
  (rawEntries || []).map((e, index) => mapAiApiEntryToBoqDraftRow(e, { units, index }));

/**
 * @param {{ id?: null, text?: string }|null|undefined} raw
 */
export const mapAiNoteToDraft = (raw) => ({
  id: raw?.id ?? null,
  text: normalizeBoqLineBreaks(raw?.text ?? ''),
});

export const BOQ_ROW_DELETE_STATUS = 4;

export const hasActiveBoqRows = (rows) =>
  (rows || []).some(
    (e) => Number(e?.item_version?.status) !== BOQ_ROW_DELETE_STATUS
  );

/** Rows saved with published item_version status (read-only published BoQ). */
export const hasPublishedBoqRows = (rows, publishedStatusId) => {
  if (publishedStatusId == null) return false;
  const published = Number(publishedStatusId);
  return (rows || []).some(
    (e) =>
      Number(e?.item_version?.status) !== BOQ_ROW_DELETE_STATUS &&
      Number(e?.item_version?.status) === published
  );
};

/**
 * After GET project boq list: stay in edit mode for new/upload/scratch drafts on a
 * previously published package (rows not yet published).
 *
 * When `projectStatuses.published.id` is not loaded yet (list and statuses fetch in
 * parallel), default published packages to read-only — do not treat missing status
 * as "draft-only" or Save/Publish will flash until a second list refresh.
 */
export const resolveBoqEditingAfterListFetch = (
  entity,
  entries,
  projectStatuses,
  { hasAiSuccessDraft = false } = {}
) => {
  if (hasAiSuccessDraft) return true;
  if (!entity?.has_published_version) return true;
  if (!hasActiveBoqRows(entries)) return true;

  const publishedStatusId = projectStatuses?.published?.id;
  if (publishedStatusId == null) {
    return false;
  }
  if (!hasPublishedBoqRows(entries, publishedStatusId)) return true;
  return false;
};

/** Edit only when viewing a published BoQ in read-only mode (not an in-progress draft). */
export const shouldShowBoqEditButton = ({
  editing,
  isSmartBoqFailedResult,
  hasPublishedVersion,
  entries,
  projectStatuses,
}) =>
  !editing &&
  !isSmartBoqFailedResult &&
  Boolean(hasPublishedVersion) &&
  hasActiveBoqRows(entries) &&
  hasPublishedBoqRows(entries, projectStatuses?.published?.id);
