import chunk from 'lodash/chunk';
import { ETYPE_PROJECT, ETYPE_TENDER } from '../../helpers/constants';
import GlobalService, { getConfig } from '../clink';

const defaultConfig = getConfig({
  method: 'GET',
  key: 'categories',
});

const UPLOAD_BATCH_NUMBER = 3;

class DocumentCategories extends GlobalService {
  constructor(entityData, config = defaultConfig) {
    super(config);
    this._entityData = entityData;
    this._eid = entityData && entityData.id;

    this.getCategories = this.getCategories.bind(this);
    this.createCategory = this.createCategory.bind(this);
    this.addFile = this.addFile.bind(this);
  }

  get eid() {
    return this._eid;
  }

  set eid(eid) {
    this._eid = eid;
  }

  get entityData() {
    return this._entityData;
  }

  set entityData(entityData) {
    this._entityData = entityData;
  }

  get docService() {
    return this._docService;
  }

  set docService(docService) {
    this._docService = docService;
  }

  async getCategories(eTypeProject = true) {
    const etype = eTypeProject ? ETYPE_PROJECT : ETYPE_TENDER;
    this.method = 'GET';
    if (this.eid) {
      this.submitUrl = this.relayUrl('document_category', 'fetchAll', {
        eid: this.eid,
        etype,
      });
      return super.asyncCall();
    }
    return null;
  }

  createCategory(label, typeProject = true, parent = null) {
    const etype = typeProject ? ETYPE_PROJECT : ETYPE_TENDER;
    const params = {
      eid: this.eid,
      etype,
    };
    //  If its a tender type, then it needs a parent id
    if (!typeProject && parent) {
      params.parent_id = parent;
    }

    this.method = 'POST';
    this.submitUrl = this.relayUrl('document_category', 'create', params);
    const body = {
      label,
    };
    return super.asyncCall(body);
  }

  renameCategory(cid, label) {
    this.method = 'PATCH';
    this.submitUrl = this.relayUrl('document_category', 'rename', { cid });
    return super.asyncCall({ label });
  }

  deleteCategory(cid) {
    this.method = 'DELETE';
    this.submitUrl = this.relayUrl('document_category', 'remove', { cid });
    return super.asyncCall();
  }

  addFile(cid, did) {
    this.method = 'PATCH';
    this.submitUrl = this.relayUrl('document_category', 'addDocument', {
      cid,
      did,
    });
    return super.asyncCall();
  }

  addMany(cid, documentIds = []) {
    const chunkOfIds = chunk(documentIds, UPLOAD_BATCH_NUMBER);

    const recursiveCall = async (currentChunk) => {
      if (currentChunk && currentChunk.length) {
        const [first, ...rest] = currentChunk;
        const promises = first.map((did) => this.addFile(cid, did));
        return Promise.all(promises).then(async (result) => [
          ...result,
          ...(await recursiveCall(rest)),
        ]);
      }
      return [];
    };
    return recursiveCall(chunkOfIds);
  }

  removeMany(cid, files = []) {
    this.submitUrl = this.relayUrl('document_category', 'bulkRemoveDocument', {
      cid,
    });
    this.method = 'DELETE';
    return this.asyncCall(files);
  }

  removeManyFolders(folders = []) {
    this.submitUrl = this.relayUrl('document_category', 'bulkDelete');
    this.method = 'DELETE';
    return this.asyncCall({ categories: folders });
  }

  sync(cid) {
    this.submitUrl = this.relayUrl('document_category', 'syncParent', { cid });
    this.method = 'PATCH';
    return this.asyncCall();
  }

  search(params) {
    this.submitUrl = this.relayUrl('document_category', 'search', params);
    this.method = 'GET';
    return this.asyncCall();
  }
}

export default DocumentCategories;
export { ETYPE_PROJECT, ETYPE_TENDER };
