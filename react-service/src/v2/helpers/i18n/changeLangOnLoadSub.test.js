import { changeProsper } from './func';

// Mock the func module
jest.mock('./func', () => ({
  changeProsper: jest.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/dashboard',
  },
  writable: true,
});

const loadChangeLangOnLoadSub = async () => {
  await jest.isolateModulesAsync(async () => {
    await import('./changeLangOnLoadSub');
  });
};

describe('changeLangOnLoadSub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location.href for each test
    window.location.href = 'https://example.com/dashboard';
  });

  it('should call changeProsper when URL does not contain blocked patterns', async () => {
    // URL doesn't contain any blocked patterns
    window.location.href = 'https://example.com/dashboard';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).toHaveBeenCalledTimes(1);
  });

  it('should not call changeProsper when URL contains login', async () => {
    window.location.href = 'https://example.com/login';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains sign-up', async () => {
    window.location.href = 'https://example.com/sign-up';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains account/password', async () => {
    window.location.href = 'https://example.com/account/password';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains request_login', async () => {
    window.location.href = 'https://example.com/request_login';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains account/activation', async () => {
    window.location.href = 'https://example.com/account/activation';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains promo', async () => {
    window.location.href = 'https://example.com/promo';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains inbox', async () => {
    window.location.href = 'https://example.com/inbox';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });

  it('should not call changeProsper when URL contains inbox-app', async () => {
    window.location.href = 'https://example.com/inbox-app';
    
    await loadChangeLangOnLoadSub();

    expect(changeProsper).not.toHaveBeenCalled();
  });
});
