import isEmpty from 'lodash/isEmpty';
import { existsUndefinedParams } from '../../global/helpers/data';
import Folders from './Folders';
import Files from './Files';
import { ETYPE_PROJECT, ETYPE_TENDER } from '../../global/helpers/constants';

const ALL_PROJECT_FILES_LABEL = 'All Project Files';

class Tenders {
  /**
   * This function removes the first item, which is assumes is All Project Files,
   * Sorts the array, with all project removed, and then adds it to the front again
   * @param tenders
   * @returns {null|*[]}
   */

  static get(tenders) {
    if (existsUndefinedParams(tenders)) {
      return null;
    }
    const [firstTender] = tenders;
    return [
      firstTender,
      ...Tenders.sortTenders(
        tenders.filter((tender) => tender.label !== ALL_PROJECT_FILES_LABEL)
      ),
    ];
  }

  static getTender(tenders, tid) {
    if (existsUndefinedParams(tenders, tid)) {
      return null;
    }
    const [selectedTender] = tenders.filter(
      (tender) => Number(tender.id) === Number(tid)
    );
    return selectedTender ?? null;
  }

  /**
   * Set the folders for one tender, matched by tender id,
   * then return a sorted list of tenders via the get functions
   * @param tenders
   * @param tid
   * @param pid
   * @param categories
   * @returns {null|*[]}
   */
  static setFolders(tenders, tid, pid, categories) {
    if (existsUndefinedParams(tenders, pid, tid, categories)) {
      return null;
    }

    const mapped = tenders.map((tender) => {
      if (Number(tid) === Number(tender.id)) {
        return {
          ...tender,
          folders: Folders.createFolders(pid, tid, categories),
        };
      }
      return tender;
    });
    return Tenders.get(mapped);
  }

  static addFolder(tenders, tid, cid, pid, label) {
    return Tenders.response(
      Folders.addFolder,
      tenders,
      tid,
      pid,
      tid,
      cid,
      label
    );
  }

  static addFiles(tenders, tid, cid, pid, newFiles) {
    return Tenders.response(
      Folders.addFiles,
      tenders,
      tid,
      pid,
      tid,
      cid,
      newFiles
    );
  }

  static createOptions(searchOptions) {
    const { documents, categories } = searchOptions;
    return isEmpty(documents) && isEmpty(categories)
      ? null
      : [
          ...categories.map((cat) =>
            Folders.createFolder(
              cat.id,
              cat.parent_id,
              cat.entity_id,
              cat.label
            )
          ),
          ...documents.map((doc) => {
            const { categories: docCategories } = doc;
            const [category] = docCategories;
            return Files.createFile(
              doc.id,
              category.parent_id,
              category.entity_id,
              category.id,
              doc.name,
              doc.type
            );
          }),
        ];
  }

  static createTender(id, pid, label, folders = [], type = ETYPE_TENDER) {
    return existsUndefinedParams(id, pid, label)
      ? null
      : { id: Number(id), pid: Number(pid), label, folders, type };
  }

  static createTenders(tenders, pid) {
    if (existsUndefinedParams(tenders, pid)) {
      return null;
    }

    const AllProject = Tenders.createTender(
      pid,
      pid,
      ALL_PROJECT_FILES_LABEL,
      [],
      ETYPE_PROJECT
    );
    const items = Tenders.sortTenders(
      tenders.map((tender) =>
        Tenders.createTender(tender.id, pid, tender.label)
      )
    );
    return [AllProject, ...items];
  }

  static deleteBulkFiles(tenders, tid, cid, files) {
    return Tenders.response(Folders.deleteBulkFiles, tenders, tid, cid, files);
  }

  static deleteBulkFolders(tenders, tid, folders) {
    return Tenders.response(Folders.deleteBulkFolders, tenders, tid, folders);
  }

  static deleteFile(tenders, tid, cid, id) {
    return Tenders.response(Folders.deleteFile, tenders, tid, cid, id);
  }

  static deleteFolder(tenders, tid, cid) {
    return Tenders.response(Folders.deleteFolder, tenders, tid, cid);
  }

  static renameFolder(tenders, tid, cid, label) {
    return Tenders.response(Folders.renameFolder, tenders, tid, cid, label);
  }

  static response(...args) {
    const [action, tenders = [], tid, ...rest] = args;
    const newTenders = tenders.map((tender) => {
      let newTender = { ...tender };
      if (Number(tid) === Number(tender.id)) {
        newTender = {
          ...tender,
          folders: action(tender.folders, ...rest),
        };
      }
      return newTender;
    });
    return existsUndefinedParams(...args) ? null : Tenders.get(newTenders);
  }

  static selectFile(tenders, tid, cid, id, checked) {
    return Tenders.response(
      Folders.selectItemFile,
      tenders,
      tid,
      cid,
      id,
      checked
    );
  }

  static selectFolder(tenders, tid, cid, checked) {
    return Tenders.response(Folders.selectItem, tenders, tid, cid, checked);
  }

  static selectAllFiles(tenders, tid, cid, checked) {
    return Tenders.response(Folders.selectAllFiles, tenders, tid, cid, checked);
  }

  static selectAllFolders(tenders, tid, checked) {
    return Tenders.response(Folders.selectAll, tenders, tid, checked);
  }

  static getSelectedFolders(tenders) {
    if (existsUndefinedParams(tenders)) {
      return null;
    }
    const folders = [];
    tenders.forEach((tender) => {
      Folders.getSelected(tender.folders).forEach((folder) => {
        folders.push(folder);
      });
    });
    return folders;
  }

  static sortTenders(tenders) {
    return existsUndefinedParams(tenders)
      ? null
      : tenders.sort((tenderA, tenderB) =>
          tenderA.label.toLowerCase().localeCompare(tenderB.label.toLowerCase())
        );
  }
}

export default Tenders;
export { ALL_PROJECT_FILES_LABEL };
