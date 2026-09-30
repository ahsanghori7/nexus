const DRAFT = 'Draft';
const REJECTION_ACKNOWLEDGED = 'Rejection Acknowledged';
const IN_PROGRESS = "in_progress";
const PENDING = "pending"

// A status is either a plain string or a { label } object depending on the endpoint.
const getStatusValue = (status) =>
  typeof status === 'string' ? status : status?.label;

const isDraft = (status) => {
  if (!status) return true;
  return getStatusValue(status)?.toLowerCase() === DRAFT.toLowerCase();
};

const isRejectionAcknowledged = (status) => {
  if (!status) return false;
  return (
    getStatusValue(status)?.toLowerCase() ===
    REJECTION_ACKNOWLEDGED.toLowerCase()
  );
};

// Suppliers a requester may submit for approval: never submitted, or rejected
// and acknowledged so they can be resubmitted.
const isSelectableForApproval = (status) =>
  isDraft(status) || isRejectionAcknowledged(status);

const isPending = (status) => {
  if (!status) return false;
  return getStatusValue(status)?.toLowerCase() === PENDING;
};

/**
 * The one place that knows how a shortlisted subcontractor's `approvals` is
 * shaped: an object keyed by level when `isLevel`, a flat array of approver
 * rows otherwise. Returns the approver rows belonging to `userId` on levels
 * that are currently in progress — levels not yet started come back as
 * 'locked' from the API and are correctly ignored.
 *
 * `pendingOnly` narrows to decisions the user has not made yet; pass false to
 * get every row of theirs on the live level (used to collect approval ids).
 */
const getApproverRowsForUser = (
  subcontractor,
  userId,
  { pendingOnly = true } = {},
) => {
  if (!userId || !subcontractor) return [];

  const rawApprovals = subcontractor?.approvals;
  const levels = Array.isArray(rawApprovals)
    ? rawApprovals
    : Object.values(rawApprovals || {}).filter(
        (level) => getStatusValue(level?.status)?.toLowerCase() === IN_PROGRESS,
      );

  return levels
    .flatMap((level) =>
      Array.isArray(level?.approvers) ? level.approvers : [level],
    )
    .filter((approver) => {
      if (String(approver?.approver_user_id) !== String(userId)) return false;
      if (!pendingOnly) return true;
      return getStatusValue(approver?.status)?.toLowerCase() === PENDING;
    });
};

const isCurrentUserAnApprover = (subcontractor, userId) =>
  getApproverRowsForUser(subcontractor, userId).length > 0;

// A row the current user can approve or reject right now.
const isApprovableByUser = (subcontractor, userId) =>
  isPending(subcontractor?.status) &&
  isCurrentUserAnApprover(subcontractor, userId);

export {
  DRAFT,
  REJECTION_ACKNOWLEDGED,
  IN_PROGRESS,
  PENDING,
  getStatusValue,
  isDraft,
  isRejectionAcknowledged,
  isSelectableForApproval,
  isPending,
  getApproverRowsForUser,
  isCurrentUserAnApprover,
  isApprovableByUser
};
