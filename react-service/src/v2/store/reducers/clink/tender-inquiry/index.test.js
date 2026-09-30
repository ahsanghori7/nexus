import * as tenderInquiry from './index';

describe('tender-inquiry index', () => {
  it('should export assignTenderInquiryApprover', () => {
    expect(tenderInquiry.assignTenderInquiryApprover).toBeDefined();
    expect(typeof tenderInquiry.assignTenderInquiryApprover).toBe('function');
  });

  it('should export approveRejectInquiry', () => {
    expect(tenderInquiry.approveRejectInquiry).toBeDefined();
    expect(typeof tenderInquiry.approveRejectInquiry).toBe('function');
  });

  it('should export acknowledgeRejectionFeedback', () => {
    expect(tenderInquiry.acknowledgeRejectionFeedback).toBeDefined();
    expect(typeof tenderInquiry.acknowledgeRejectionFeedback).toBe('function');
  });

  it('should export assignedApproversTenderInquiry', () => {
    expect(tenderInquiry.assignedApproversTenderInquiry).toBeDefined();
    expect(typeof tenderInquiry.assignedApproversTenderInquiry).toBe('function');
  });

  it('should have the correct module structure', () => {
    const exportedKeys = Object.keys(tenderInquiry);

    expect(exportedKeys).toContain('assignTenderInquiryApprover');
    expect(exportedKeys).toContain('approveRejectInquiry');
    expect(exportedKeys).toContain('acknowledgeRejectionFeedback');
    expect(exportedKeys).toContain('assignedApproversTenderInquiry');
    expect(exportedKeys).toContain('fetchTenderEnquiryLogs');
    expect(exportedKeys).toHaveLength(5);
  });
});

