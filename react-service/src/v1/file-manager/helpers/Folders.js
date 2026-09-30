import { existsUndefinedParams } from '../../global/helpers/data';
import Files from './Files';

class Folders {
  static get(folders) {
    if (existsUndefinedParams(folders)) {
      return null;
    }

    const [numbers, others] = folders.reduce(
      (acc, val) => {
        // Check if the string contains a number
        const containsNumber = /\d/.test(val.label);
        // Push the value into the appropriate array
        acc[containsNumber ? 0 : 1].push(val);
        return acc;
      },
      [[], []]
    );

    const numSorted = numbers.sort((a, b) => {
      // Extract numbers from strings
      const aNumber = parseInt(a.label.match(/\d+/)[0], 10);
      const bNumber = parseInt(b.label.match(/\d+/)[0], 10);

      // Compare the numbers
      return aNumber - bNumber;
    });
    const nonNumSorted = others.sort((folderA, folderB) =>
      folderA.label.toLowerCase().localeCompare(folderB.label.toLowerCase())
    );

    return [...numSorted, ...nonNumSorted];
  }

  static getFolder(folders, cid) {
    if (existsUndefinedParams(folders, cid)) {
      return null;
    }
    const [selectedFolder] = folders.filter(
      (folder) => Number(folder.id) === Number(cid)
    );
    return selectedFolder ?? null;
  }

  static getSelected(folders) {
    return existsUndefinedParams(folders)
      ? null
      : folders.filter((folder) => folder.checked);
  }

  static addFiles(folders, pid, tid, cid, newFiles) {
    return existsUndefinedParams(folders, pid, tid, cid, newFiles)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(cid)
              ? {
                  ...folder,
                  files: Files.addFiles(folder.files, pid, tid, cid, newFiles),
                }
              : folder
          )
        );
  }

  static addFolder(folders, pid, tid, id, label) {
    return existsUndefinedParams(folders, pid, tid, id, label)
      ? null
      : Folders.get([...folders, Folders.createFolder(id, pid, tid, label)]);
  }

  static createFolder(id, pid, tid, label, files = []) {
    return existsUndefinedParams(id, pid, tid, label)
      ? null
      : {
          id: Number(id),
          pid: Number(pid),
          tid: Number(tid),
          entity_id: Number(tid),
          cid: Number(id),
          label,
          name: label,
          value: `${tid}-${id}`,
          files: Files.get(
            Files.filterRepeatedFiles(files).map((file) =>
              Files.createFile(file.id, pid, tid, id, file.name, file.type)
            )
          ),
          checked: false,
          item: 'folder',
        };
  }

  static createFolders(pid, tid, categories) {
    return existsUndefinedParams(pid, tid, categories)
      ? null
      : Folders.get(
          Object.keys(categories).map((cid) =>
            Folders.createFolder(
              Number(cid),
              pid,
              categories[cid].entity_id,
              categories[cid].label,
              categories[cid].documents
            )
          )
        );
  }

  static deleteBulkFiles(folders, cid, files) {
    return existsUndefinedParams(folders, cid, files)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(cid)
              ? { ...folder, files: Files.deleteBulkFiles(folder.files, files) }
              : folder
          )
        );
  }

  static deleteBulkFolders(folders, removedFolders) {
    return existsUndefinedParams(folders, removedFolders)
      ? null
      : Folders.get(
          folders.filter((folder) => !removedFolders.includes(folder.id))
        );
  }

  static deleteFile(folders, cid, id) {
    const newFolders = folders.map((folder) =>
      Number(folder.id) === Number(cid)
        ? { ...folder, files: Files.deleteFile(folder.files, id) }
        : folder
    );
    return existsUndefinedParams(folders, cid, id)
      ? null
      : Folders.get(newFolders);
  }

  static deleteFolder(folders, cid) {
    return existsUndefinedParams(folders, cid)
      ? null
      : Folders.get(
          folders.filter((folder) => Number(folder.id) !== Number(cid))
        );
  }

  static renameFolder(folders, cid, label) {
    return existsUndefinedParams(folders, cid, label)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(cid) ? { ...folder, label } : folder
          )
        );
  }

  static selectAll(folders, checked) {
    return existsUndefinedParams(folders, checked)
      ? null
      : Folders.get(folders.map((folder) => ({ ...folder, checked })));
  }

  static selectAllFiles(folders, cid, checked) {
    return existsUndefinedParams(folders, cid, checked)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(cid)
              ? {
                  ...folder,
                  files: Files.selectAll(folder.files, checked),
                }
              : folder
          )
        );
  }

  static selectItem(folders, id, checked) {
    return existsUndefinedParams(folders, id, checked)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(id) ? { ...folder, checked } : folder
          )
        );
  }

  static selectItemFile(folders, cid, id, checked) {
    return existsUndefinedParams(folders, cid, id, checked)
      ? null
      : Folders.get(
          folders.map((folder) =>
            Number(folder.id) === Number(cid)
              ? {
                  ...folder,
                  files: Files.selectItem(folder.files, id, checked),
                }
              : folder
          )
        );
  }
}

export default Folders;
