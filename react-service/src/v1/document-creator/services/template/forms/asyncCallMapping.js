import Relay from '../../../../global/services/Relay';

const emptyFetch = {
  success: false,
  content: '',
};

const sow = {
  save: async (did, data) => {
    const service = new Relay('sow', 'save', { did });
    return service.patch(data);
  },
  fetch: async (did) => {
    const service = new Relay('sow', 'fetch', { did });
    return service
      .getJson()
      .then((response) => ({ ...response, success: true }))
      .catch(() => {
        return emptyFetch;
      });
  },
};

const nd = {
  create: async (did, numDoc, data) => {
    const service = new Relay('number_document', 'create', { did, nd: numDoc });
    return service
      .postForm(data)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        return emptyFetch;
      })
      .catch(() => {
        return emptyFetch;
      });
  },
  save: async (did, data) => {
    const service = new Relay('number_document', 'save', { did });
    return service
      .postForm(data)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        return emptyFetch;
      })
      .catch(() => {
        return emptyFetch;
      });
  },
  remove: async (did) => {
    const service = new Relay('number_document', 'remove', { did });
    return service
      .deleter()
      .then((response) => ({ ...response, success: true }))
      .catch(() => {
        return emptyFetch;
      });
  },
};

// TODO: Check if error handlers needed
const asyncCallMapping = {
  subcontract_works: sow,
};

export default asyncCallMapping;
export { sow, nd };
