// Mock i18next
jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock JSON imports
jest.mock('./UK/admin.json', () => ({ 'admin-key-uk': 'Admin UK Text' }));
jest.mock('./UK/prosper.json', () => ({ 'prosper-key-uk': 'Prosper UK Text' }));
jest.mock('./UK/clink.json', () => ({ 'clink-key-uk': 'Clink UK Text' }));
jest.mock('./EU/admin.json', () => ({ 'admin-key-eu': 'Admin EU Text' }));
jest.mock('./EU/prosper.json', () => ({ 'prosper-key-eu': 'Prosper EU Text' }));
jest.mock('./EU/clink.json', () => ({ 'clink-key-eu': 'Clink EU Text' }));
jest.mock('./NZ/admin.json', () => ({ 'admin-key-nz': 'Admin NZ Text' }));
jest.mock('./NZ/prosper.json', () => ({ 'prosper-key-nz': 'Prosper NZ Text' }));
jest.mock('./NZ/clink.json', () => ({ 'clink-key-nz': 'Clink NZ Text' }));
jest.mock('./AUS/admin.json', () => ({ 'admin-key-aus': 'Admin AUS Text' }));
jest.mock('./AUS/prosper.json', () => ({ 'prosper-key-aus': 'Prosper AUS Text' }));
jest.mock('./AUS/clink.json', () => ({ 'clink-key-aus': 'Clink AUS Text' }));

const loadI18nModule = async () => import('./index');

const loadI18nWithMocks = async () => {
  const mockI18n = await import('i18next');
  await import('react-i18next');
  await loadI18nModule();
  return mockI18n;
};

describe('i18n configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should export default i18n instance', async () => {
    const { default: i18n } = await loadI18nModule();
    expect(i18n).toBeDefined();
    expect(typeof i18n).toBe('object');
  });

  it('should export resources object', async () => {
    const { resources } = await loadI18nModule();
    expect(resources).toBeDefined();
    expect(typeof resources).toBe('object');
  });

  it('should have correct structure for resources', async () => {
    const { resources } = await loadI18nModule();
    expect(resources).toHaveProperty('UK');
    expect(resources).toHaveProperty('EU');
    expect(resources).toHaveProperty('NZ');
    expect(resources).toHaveProperty('AUS');
  });

  it('should have translation property for each region', async () => {
    const { resources } = await loadI18nModule();
    expect(resources.UK).toHaveProperty('translation');
    expect(resources.EU).toHaveProperty('translation');
    expect(resources.NZ).toHaveProperty('translation');
    expect(resources.AUS).toHaveProperty('translation');
  });

  it('should merge admin, prosper, and clink translations for UK', async () => {
    const { resources } = await loadI18nModule();
    expect(resources.UK.translation).toEqual({
      'admin-key-uk': 'Admin UK Text',
      'prosper-key-uk': 'Prosper UK Text',
      'clink-key-uk': 'Clink UK Text',
    });
  });

  it('should merge admin, prosper, and clink translations for EU', async () => {
    const { resources } = await loadI18nModule();
    expect(resources.EU.translation).toEqual({
      'admin-key-eu': 'Admin EU Text',
      'prosper-key-eu': 'Prosper EU Text',
      'clink-key-eu': 'Clink EU Text',
    });
  });

  it('should merge admin, prosper, and clink translations for NZ', async () => {
    const { resources } = await loadI18nModule();
    expect(resources.NZ.translation).toEqual({
      'admin-key-nz': 'Admin NZ Text',
      'prosper-key-nz': 'Prosper NZ Text',
      'clink-key-nz': 'Clink NZ Text',
    });
  });

  it('should merge admin, prosper, and clink translations for AUS', async () => {
    const { resources } = await loadI18nModule();
    expect(resources.AUS.translation).toEqual({
      'admin-key-aus': 'Admin AUS Text',
      'prosper-key-aus': 'Prosper AUS Text',
      'clink-key-aus': 'Clink AUS Text',
    });
  });

  it('should call i18n.use with initReactI18next', async () => {
    const mockI18n = await loadI18nWithMocks();
    expect(mockI18n.use).toHaveBeenCalled();
  });

  it('should call i18n.init with correct configuration', async () => {
    const mockI18n = await loadI18nWithMocks();
    expect(mockI18n.init).toHaveBeenCalledWith({
      resources: expect.any(Object),
      lng: 'UK',
      fallbackLng: 'UK',
      interpolation: {
        escapeValue: false,
      },
    });
  });
});
