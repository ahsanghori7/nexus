// Mock data for references-approval components
export const mockReferencesApprovalData = {
  project: 'Test Project Name',
  client: 'Test Client Company',
  email: 'test@example.com',
  value: '£50,000',
  completion_date: '2024-12-31',
  description_of_works: 'Test description of works for the project',
  subcontractor_name: 'Test Subcontractor Ltd'
};

// Mock PHPGlobals specifically for references-approval
export const mockPHPGlobalsReferencesApproval = jest.fn(() => ({
  data: mockReferencesApprovalData,
}));

export default mockPHPGlobalsReferencesApproval;
