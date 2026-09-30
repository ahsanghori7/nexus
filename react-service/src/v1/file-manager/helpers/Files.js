import uniqBy from 'lodash/uniqBy';
import { getTypeLabel, existsUndefinedParams } from 'v1/global/helpers/data';
import { TYPE_STRUCTURAL } from 'v1/global/helpers/constants';

class Files {
  static get(files, selectedSearchableItem = null) {
    if (existsUndefinedParams(files)) {
      return null;
    }

    let newFiles = files.sort((fileA, fileB) =>
      fileA.name.toLowerCase().localeCompare(fileB.name.toLowerCase())
    );
    if (selectedSearchableItem && selectedSearchableItem.item === 'file') {
      newFiles = files.filter(
        (file) => Number(file.id) === Number(selectedSearchableItem.id)
      );
    }
    return newFiles;
  }

  static getCount(files) {
    return existsUndefinedParams(files)
      ? 0
      : files.filter((file) => file.visible).length;
  }

  static getSelected(files) {
    return existsUndefinedParams(files)
      ? null
      : files.filter((file) => file.checked).map((file) => Number(file.id));
  }

  static addFiles(files, pid, tid, cid, newFiles) {
    if (existsUndefinedParams(files, pid, tid, cid, newFiles)) {
      return null;
    }
    const newFormattedFiles = newFiles.map((file) => {
      const { id, name, type } = file;
      return Files.createFile(id, pid, tid, cid, name, type);
    });
    return Files.get([...files, ...newFormattedFiles]);
  }

  static createFile(id, pid, tid, cid, name, type) {
    if (existsUndefinedParams(id, pid, tid, cid, name, type)) {
      return null;
    }
    const fileType = getTypeLabel(name.split('.').pop());
    return {
      id: Number(id),
      pid: Number(pid),
      tid: Number(tid),
      cid: Number(cid),
      value: `${tid}-${cid}-${id}`,
      name,
      visible: Number(type) === TYPE_STRUCTURAL.id,
      type: fileType,
      checked: false,
      item: 'file',
    };
  }

  static deleteBulkFiles(files, newFiles) {
    return existsUndefinedParams(files, newFiles)
      ? null
      : Files.get(files.filter((file) => !newFiles.includes(Number(file.id))));
  }

  static deleteFile(files, id) {
    return existsUndefinedParams(files, id)
      ? null
      : Files.get(files.filter((file) => Number(file.id) !== Number(id)));
  }

  static filterRepeatedFiles(files, key = 'id') {
    return existsUndefinedParams(files) ? null : uniqBy(files, key);
  }

  static selectAll(files, checked) {
    return existsUndefinedParams(files, checked)
      ? null
      : Files.get(files.map((file) => ({ ...file, checked })));
  }

  static selectItem(files, id, checked) {
    return existsUndefinedParams(files, id)
      ? null
      : Files.get(
          files.map((file) =>
            Number(file.id) === Number(id) ? { ...file, checked } : file
          )
        );
  }
}

export default Files;
