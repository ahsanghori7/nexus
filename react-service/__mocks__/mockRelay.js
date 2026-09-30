// Mock for v2/services/relay
class MockRelay {
  constructor(resource, version, host) {
    this.resource = resource;
    this.version = version;
    this.host = host;
  }

  buildServiceUrl() {
    return `/api/v1/${this.resource}`;
  }

  getUrl(method, params) {
    const base = this.buildServiceUrl();
    const urlMethod = method ? `/${method}` : '';
    return `${base}${urlMethod}`;
  }

  // Mock successful responses by default
  patch(data, method) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        message: 'Operation successful'
      })
    });
  }

  post(data, method) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        message: 'Operation successful'
      })
    });
  }

  get(method, params) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        data: {}
      })
    });
  }

  put(data, method) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        message: 'Operation successful'
      })
    });
  }

  deleter(method, params, data) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        message: 'Operation successful'
      })
    });
  }
}

export default MockRelay;
