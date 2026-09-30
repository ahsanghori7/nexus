const DRAFT = 'Draft'; // Issue order from quotes & tender
const SENT = 'Sent'; // Wet
const WITHDRAW = 'Withdraw'; // (when you withdraw the order)
const WITHDREW = 'Withdrew'; // (when you withdraw the order)
const PENDING = 'Pending Signature'; // (the subcontractors didn’t signed it yet)
const AWAITING = 'Awaiting Signature'; // (subcontractors signed it and you need to sign it)
const ORDER_SIGNED = 'Order Signed'; // (everyone signed the order)
const SIGNED = 'Signed'; // (everyone signed the order)
const ORDER_REJECTED = 'Order Rejected'; // (if one of the subcontradctor / contractor rejects the signing of the document)
const REJECTED = 'Rejected'; // (if one of the subcontradctor / contractor rejects the signing of the document)
const IN_QUEUE = 'Processing'; // Status used until the process in queues is finished
const PENDING_APPROVAL = 'Pending Approval';

export {
  DRAFT,
  SENT,
  WITHDRAW,
  WITHDREW,
  PENDING,
  AWAITING,
  SIGNED,
  REJECTED,
  ORDER_REJECTED,
  ORDER_SIGNED,
  IN_QUEUE,
  PENDING_APPROVAL,
};
