import chunk from 'lodash/chunk';
import { getRelayUrl } from 'v2/helpers/url';
import FileService from '../File';
import { TYPE_STRUCTURAL, TYPE_CONTRACTUAL } from '../../helpers/constants';

const fileConfig = {
  submitUrl: getRelayUrl('project', 'addLogo', { pid: '' }),
};

const UPLOAD_BATCH_NUMBER = 3;

class Documents extends FileService {
  constructor(config = fileConfig) {
    super(config);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(document, typeStructural) {
    const type = typeStructural ? TYPE_STRUCTURAL : TYPE_CONTRACTUAL;
    this.submitUrl = this.relayUrl('document', 'create', { type: type.name });
    this.method = 'POST';
    return this.submitFile({ document }).then((json) => ({
      ...json,
      type,
      file: document,
    }));
  }

  async createMany(documents = [], typeStructural = true) {
    const chunkOfFiles = chunk(documents, UPLOAD_BATCH_NUMBER);

    const recursiveCall = async (currentChunk) => {
      if (currentChunk && currentChunk.length) {
        const [first, ...rest] = currentChunk;
        const promises = first.map((file) => this.create(file, typeStructural));
        return Promise.all(promises).then(async (result) => [
          ...result,
          ...(await recursiveCall(rest)),
        ]);
      }
      return [];
    };
    return recursiveCall(chunkOfFiles);
  }

  delete(did, cid = null) {
    const params = { did };
    if (cid) {
      params.cid = cid;
    }
    this.submitUrl = this.relayUrl('document', 'remove', params);
    this.method = 'DELETE';
    return this.asyncCall();
  }

  replace(oldDocId, newDocId, cid = null) {
    const params = { did: oldDocId, id: newDocId };
    if (cid !== null && cid !== undefined) {
      params.cid = cid;
    }
    this.submitUrl = this.relayUrl('document', 'replace', params);
    this.method = 'POST';
    return this.asyncCall();
  }
}

export default Documents;
