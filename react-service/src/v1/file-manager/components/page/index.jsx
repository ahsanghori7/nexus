import React from 'react';
import { connect } from 'react-redux';
import 'v1/global';
import 'v1/file-manager/public/styles/index.scss';
import { setUrl } from 'v2/helpers/url';
import { useLocation } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import AlertMUI from '@mui/material/Alert';
import { sizeFileIsCorrect, typeFileIsAccepted } from 'v2/helpers/files';
import flag from 'v2/helpers/flags';
import PanelForm from 'v1/global/components/layout/panel/Form';
import Panel from 'v1/global/components/layout/panel';
import Loading from 'v1/global/components/Loading';
import Search from 'v1/global/components/Search';
import Relay from 'v1/global/services/Relay';
import CategoriesService from 'v1/global/services/documents/Categories';
import { ETYPE_PROJECT, TYPE_STRUCTURAL } from 'v1/global/helpers/constants';
import DocumentsService from 'v1/global/services/documents';
import Folders from 'v1/file-manager/helpers/Folders';
import Files from 'v1/file-manager/helpers/Files';
import Tenders from 'v1/file-manager/helpers/Tenders';
import {
  getFolderFromUrl,
  getTenderFromUrl,
} from 'v1/file-manager/helpers/url';
import i18n from 'v2/helpers/i18n';
import alert from 'v1/global/helpers/alert';
import AcceptedFilesList from 'v1/global/components/plan-my-project/package-collator/AcceptedFilesList';
import { httpHelperV2 } from 'v2/services/httpHelper';
import AccordionCategories from './sidemodal/AccordionCategories';
import Header from './Header';
import List from './list';
import ArchivedModal from './archived-modal';
import DuplicateFilesModal from './duplicate-modal';
import AccordionTenders from './sidemodal/AccordionTenders';

const TERM_LENGTH_LIMIT = 3;
class FileManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      nonBlockLoading: false,
      loadingSidemodal: false,
      error: false,
      tenders: [],
      openSidemodalCategory: 0,
      selectedFiles: [],
      selectedSearchableItem: null,
      selectedTender: 0,
      selectedCategory: 0,
      selectAllChecked: false,
      archived: false,
      showAllTenders: false,
      duplicateFiles: [],
      nonDuplicateFiles: [],
    };

    this.setRoot = this.setRoot.bind(this);
    this.addSelectedToAttachments = this.addSelectedToAttachments.bind(this);
    this.setShowAllTenders = this.setShowAllTenders.bind(this);
    this.setOpenSidemodalCategory = this.setOpenSidemodalCategory.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.setError = this.setError.bind(this);
    this.addAllDocs = this.addAllDocs.bind(this);
    this.addFiles = this.addFiles.bind(this);
    this.bulkAddAllDocs = this.bulkAddAllDocs.bind(this);
    this.clickFolder = this.clickFolder.bind(this);
    this.deleteBulkFiles = this.deleteBulkFiles.bind(this);
    this.deleteBulkFolders = this.deleteBulkFolders.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
    this.initPageWithParams = this.initPageWithParams.bind(this);
    this.initWithTender = this.initWithTender.bind(this);
    this.loadFolders = this.loadFolders.bind(this);
    this.loadSidemodalFolders = this.loadSidemodalFolders.bind(this);
    this.loadSearchableOptions = this.loadSearchableOptions.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.selectSearchableItem = this.selectSearchableItem.bind(this);
    this.submitCategoryModal = this.submitCategoryModal.bind(this);
    this.selectFromExistingMedia = this.selectFromExistingMedia.bind(this);
    this.cloneFiles = this.cloneFiles.bind(this);
    this.addFilesSidemodal = this.addFilesSidemodal.bind(this);
    this.handleRenameDuplicates = this.handleRenameDuplicates.bind(this);
    this.handleOverwriteDuplicates = this.handleOverwriteDuplicates.bind(this);
    this.handleCancelDuplicates = this.handleCancelDuplicates.bind(this);

    this.categoriesService = null;
    this.uri = '';
    this.documentsService = new DocumentsService();
  }

  componentDidMount() {
    const { location, projectData, defaultTender, sidemodal , trAttachments } = this.props;
    const { id: pid, tender: projectTenders, archived } = projectData;

    if (trAttachments) {
      this.setState({ showAllTenders: true });
    }

    if (archived) {
      this.setState({ archived: true, loading: false });
    } else {
      this.categoriesService = new CategoriesService(projectData);

      if (sidemodal) {
        const tenders = Tenders.createTenders(projectTenders, pid);
        this.initWithTender(tenders, defaultTender);
      } else {
        const afterSlashPosition = location.pathname.lastIndexOf('/');
        const params = location.pathname.substring(afterSlashPosition + 1);
        this.initPageWithParams(params);
      }
    }
  }

  handleRenameDuplicates() {
    const {
      selectedTender,
      selectedCategory,
      duplicateFiles,
      nonDuplicateFiles,
      tenders,
    } = this.state;
    const tid = duplicateFiles[0]?.tid || selectedTender;
    const cid = duplicateFiles[0]?.cid || selectedCategory;

    const tender = Tenders.getTender(tenders, tid);
    const targetFolder = tender
      ? (tender.folders || []).find((folder) => folder.id === cid)
      : null;

    const existingFileNames = targetFolder
      ? (targetFolder.files || []).map((file) => file?.name?.toLowerCase())
      : [];

    const recreatedFiles = duplicateFiles.map((file) => {
      const original = file.rawFile;
      const originalName = original.name;
      const extensionIndex = originalName.lastIndexOf('.');
      const baseName =
        extensionIndex !== -1
          ? originalName.slice(0, extensionIndex)
          : originalName;
      const ext =
        extensionIndex !== -1 ? originalName.slice(extensionIndex) : '';

      const baseNameLower = baseName.toLowerCase();

      let maxVersion = 0;

      existingFileNames.forEach((name) => {
        const lastDotIndex = name.lastIndexOf('.');
        const existingBase =
          lastDotIndex !== -1 ? name.slice(0, lastDotIndex) : name;

        if (existingBase === baseNameLower) {
          if (maxVersion < 0) {
            maxVersion = 0;
          }
        } else if (existingBase.startsWith(`${baseNameLower}-v`)) {
          const versionPart = existingBase.slice(
            `${baseNameLower}-v`.length,
          );
          const parsed = parseInt(versionPart, 10);
          if (!Number.isNaN(parsed) && parsed > maxVersion) {
            maxVersion = parsed;
          }
        }
      });

      const nextVersion = maxVersion + 1;
      const newBaseName = `${baseName}-v${nextVersion}`;
      const newName = `${newBaseName}${ext}`;

      return new File([original.slice(0, original.size)], newName, {
        type: original.type,
      });
    });

    const allFilesToUpload = [...recreatedFiles, ...nonDuplicateFiles];

    this.setState({ duplicateFiles: [], nonDuplicateFiles: [] }, () => {
      this.addFiles(allFilesToUpload, tid, cid);
    });
  }

  handleOverwriteDuplicates() {
    const {
      duplicateFiles,
      nonDuplicateFiles,
      selectedTender,
      selectedCategory,
    } = this.state;
    const { sidemodal, callback } = this.props;

    const filesToUpload = duplicateFiles.map((file) => file.rawFile);

    const tid = duplicateFiles[0]?.tid || selectedTender;
    const cid = duplicateFiles[0]?.cid || selectedCategory;

    this.setState({ duplicateFiles: [], nonDuplicateFiles: [], loading: true });

    this.documentsService
      .createMany(filesToUpload)
      .then((resultFiles) => {
        const successfulUploads =
          resultFiles?.filter((fileObj) => fileObj.success) || [];

        if (successfulUploads.length === 0) {
          this.setState({ error: true, loading: false });
          return Promise.reject(new Error('No files uploaded successfully'));
        }

        const { tenders } = this.state;
        const tender = Tenders.getTender(tenders, tid);
        const targetFolder = tender
          ? (tender.folders || []).find((folder) => folder.id === cid)
          : null;

        const existingFiles = targetFolder
          ? (targetFolder.files || []).map((file) => ({
              id: file.id,
              name: file?.name?.toLowerCase(),
              cid,
            }))
          : [];

        const replacePromises = successfulUploads.map((uploadedFile) => {
          const fileName = uploadedFile?.file?.name?.toLowerCase();
          const oldFile = existingFiles.find((f) => f.name === fileName);

          if (oldFile) {
            const categoryId = cid !== 0 ? cid : null;
            return this.documentsService.replace(
              oldFile.id,
              uploadedFile.id,
              categoryId,
            );
          }
          return Promise.resolve({ success: false });
        });

        return Promise.all(replacePromises)
          .then(() => {
            if (nonDuplicateFiles.length > 0) {
              return this.documentsService
                .createMany(nonDuplicateFiles)
                .then((nonDupResults) => {
                  const nonDupDocs =
                    nonDupResults
                      ?.filter((fileObj) => fileObj.success)
                      .map((fileObj) => ({
                        id: fileObj.id,
                        name: fileObj.file.name,
                        type: fileObj.type.id,
                      })) || [];

                  if (nonDupDocs.length > 0) {
                    return this.categoriesService.addMany(
                      cid,
                      nonDupDocs.map((f) => f.id),
                    );
                  }
                  return Promise.resolve();
                });
            }
            return Promise.resolve();
          })
          .then(() => {
            if (tender) {
              if (sidemodal) {
                this.loadSidemodalFolders(tender);
                this.setState({ loading: false });
                if (callback) callback();
              } else {
                this.loadFolders(tender, () => {
                  this.setState({ loading: false });
                  if (callback) callback();
                });
              }
            } else {
              this.setState({ loading: false, nonBlockLoading: false });
              if (callback) callback();
            }
          });
      })
      .catch(() => {
        this.setState({ loading: false });
        alert(
          { success: false },
          null,
          {},
          {
            title: i18n.t('file-manager-action-not-completed'),
            message: i18n.t('file-manager-upload-error-msg'),
            type: 'error',
          },
        );
      });
  }

  handleCancelDuplicates() {
    this.setState({
      duplicateFiles: [],
      loading: false,
      nonBlockLoading: false,
    });
  }

  setRoot() {
    const { domain } = this.props;
    this.setState(
      {
        selectedTender: 0,
        selectedCategory: 0,
        selectedSearchableItem: null,
      },
      () => {
        setUrl(domain);
      },
    );
  }

  setShowAllTenders(value) {
    const { showAllFilesSidemodal } = this.props;
    this.setState({ showAllTenders: value }, showAllFilesSidemodal(value));
  }

  setOpenSidemodalCategory(cid) {
    const categoryId = cid || 0;
    this.setState({ openSidemodalCategory: categoryId });
  }

  setLoading(loading) {
    this.setState({ loading });
  }

  setError(error) {
    this.setState({ error });
  }

  addAllDocs(cat) {
    const { callback } = this.props;
    this.categoriesService.sync(cat.id).then((res) => {
      if (!res || res.success === false || res.documents.length === 0) {
        return;
      }

      this.setState(
        (prev) => {
          const { tenders } = prev;
          return {
            tenders: Tenders.addFiles(
              tenders,
              cat.tid,
              cat.cid,
              cat.pid,
              res.documents,
            ),
          };
        },
        () => {
          if (callback) {
            callback();
          }
        },
      );
    });
  }

  addFiles(files, selectedTid = '', selectedCid = '') {
    const { selectedTender, selectedCategory } = this.state;
    const { projectData, callback } = this.props;
    const { id: pid } = projectData;

    const tid = selectedTid === '' ? selectedTender : selectedTid;
    const cid = selectedCid === '' ? selectedCategory : selectedCid;

    const invalidSizesFiles = files
      .filter((f) => !sizeFileIsCorrect(f))
      .map((f) => ({ name: f.name, invalid: 'File too large' }));
    const invalidTypesFiles = files
      .filter((f) => !typeFileIsAccepted(f))
      .map((f) => ({ name: f.name, invalid: 'Invalid type' }));
    const filesToSend = files.filter(
      (f) => sizeFileIsCorrect(f) && typeFileIsAccepted(f),
    );

    if (filesToSend.length === 0) {
      const isSingular = files.length === 1;
      alert(
        { success: false },
        null,
        {},
        {
          title: isSingular
            ? i18n.t('file-manager-invalid-file-title')
            : i18n.t('file-manager-invalid-files-title'),
          message: isSingular
            ? i18n.t('file-manager-invalid-file-msg')
            : i18n.t('file-manager-invalid-files-msg'),
          type: 'error',
        },
      );
      return;
    }

    if (flag('OVERWRITE_FILE_MANAGER')) {
      const tender = Tenders.getTender(this.state.tenders, tid);
      const targetFolder = tender
        ? (tender.folders || []).find((folder) => folder.id === cid)
        : null;

      const existingFileNames = targetFolder
        ? (targetFolder.files || []).map((file) => file?.name?.toLowerCase())
        : [];

      const duplicateFiles = filesToSend.filter((file) =>
        existingFileNames.includes(file?.name?.toLowerCase()),
      );

      const nonDuplicateFiles = filesToSend.filter(
        (file) => !existingFileNames.includes(file?.name?.toLowerCase()),
      );

      if (duplicateFiles.length > 0) {
        const rawFileMap = new Map();
        filesToSend.forEach((f) => rawFileMap.set(f?.name?.toLowerCase(), f));

        const enrichedDuplicates = duplicateFiles.map((file) => ({
          ...file,
          rawFile: rawFileMap.get(file?.name?.toLowerCase()),
          tid,
          cid,
        }));

        this.setState({
          duplicateFiles: enrichedDuplicates,
          nonDuplicateFiles,
        });
        return;
      }
    }

    this.setState({ loading: true });

    this.documentsService
      .createMany(filesToSend)
      .then((resultFiles) => {
        const docObjs =
          resultFiles
            ?.filter((fileObj) => fileObj.success)
            .map((fileObj) => ({
              id: fileObj.id,
              name: fileObj.file.name,
              type: fileObj.type.id,
            })) || [];

        this.setState((prevState) => {
          const updatedTenders = Tenders.addFiles(
            prevState.tenders,
            tid,
            cid,
            pid,
            docObjs,
          );

          return {
            tenders: updatedTenders,
            loading: false,
            nonBlockLoading: true,
            duplicateFiles: [],
          };
        });

        this.categoriesService
          .addMany(
            cid,
            docObjs.map((f) => f.id),
          )
          .then(() => {
            this.setState({ nonBlockLoading: false });
          });

        if (callback) callback();
      })
      .catch(() => {
        this.setState({ loading: false });
        alert(
          { success: false },
          null,
          {},
          {
            title: i18n.t('file-manager-action-not-completed'),
            message: i18n.t('file-manager-upload-error-msg'),
            type: 'error',
          },
        );
      });

    const invalidFiles = [...invalidSizesFiles, ...invalidTypesFiles];
    if (invalidFiles.length > 0) {
      const isSingularInvalid = invalidFiles.length === 1;
      const Message = () =>
        invalidFiles
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((f) => (
            <>
              <span key={`${f.name}-${f.invalid}`}>
                {f.name} - <b>{f.invalid}</b>
              </span>
              <br />
            </>
          ));

      alert(
        { success: false },
        null,
        {},
        {
          title: isSingularInvalid
            ? i18n.t('file-manager-invalid-file-title')
            : i18n.t('file-manager-invalid-files-title'),
          message: (
            <>
              {isSingularInvalid
                ? i18n.t('file-manager-could-not-upload-file')
                : i18n.t('file-manager-could-not-upload-files')}
              <br />
              <br />
              <Message />
            </>
          ),
          type: 'error',
        },
      );
    }
  }

  bulkAddAllDocs() {
    const { tenders } = this.state;
    Tenders.getSelectedFolders(tenders).forEach((folder) => {
      this.addAllDocs(folder);
    });
  }

  loadFolders(tender, callback = () => { }) {
    const { domain, sidemodal } = this.props;
    const { pid, id: tid, type } = tender;
    this.setState({ loading: true }, () => {
      new CategoriesService({ id: tid })
        .getCategories(type === ETYPE_PROJECT)
        .then(
          (categories) => {
            this.setState((prevState) => {
              const { tenders: prevTenders } = prevState;

              const tenders = Tenders.setFolders(
                prevTenders,
                tid,
                pid,
                categories,
              );
              if (!sidemodal) {
                this.uri = type === ETYPE_PROJECT ? '/project' : '/tender';
                setUrl(`${domain}${this.uri}-${tid}`);
              }
              return {
                tenders,
                selectedTender: tid,
                loading: false,
              };
            }, callback);
          },
          true,
          tid,
        );
    });
  }

  loadSidemodalFolders(tender) {
    this.setState({ loadingSidemodal: true }, () => {
      new CategoriesService({ id: tender.id })
        .getCategories(tender.type === ETYPE_PROJECT)
        .then((categories) => {
          this.setState((prevState) => {
            const { tenders: prevTenders } = prevState;
            const tenders = Tenders.setFolders(
              prevTenders,
              tender.id,
              tender.pid,
              categories,
            );
            return { tenders, loadingSidemodal: false, selectedFiles: [] };
          });
        })
        .catch(() => {
          this.setState({ error: true, loading: false });
        });
    });
  }

  clickFolder(folder) {
    const { domain } = this.props;
    const { selectedTender } = this.state;
    const url = `${domain}${this.uri}-${selectedTender}`;
    let selectedCategory = 0;
    if (folder) {
      selectedCategory = folder.id;
      setUrl(`${url}-folder-${folder.id}`);
      this.setState({ selectedCategory, selectAllChecked: false });
    } else {
      setUrl(url);
      this.setState({
        selectedCategory,
        selectAllChecked: false,
        selectedSearchableItem: null,
      });
    }
  }

  deleteBulkFiles(files) {
    const { selectedCategory } = this.state;
    const { callback } = this.props;
    this.setState({ loading: true }, () => {
      this.categoriesService
        .removeMany(selectedCategory, files)
        .then((response) => {
          if (response && response.success) {
            this.setState(
              (prevState) => {
                const {
                  tenders,
                  selectedTender: tid,
                  selectedCategory: cid,
                } = prevState;
                return {
                  tenders: Tenders.deleteBulkFiles(tenders, tid, cid, files),
                  loading: false,
                };
              },
              () => {
                if (callback) {
                  callback();
                }
              },
            );
          }
        });
    });
  }

  deleteBulkFolders(folders) {
    const { callback } = this.props;
    this.setState({ loading: true }, () => {
      this.categoriesService.removeManyFolders(folders).then((response) => {
        if (response && response.success) {
          this.setState(
            (prevState) => {
              const { tenders, selectedTender: tid } = prevState;
              return {
                tenders: Tenders.deleteBulkFolders(tenders, tid, folders),
                loading: false,
              };
            },
            () => {
              if (callback) {
                callback();
              }
            },
          );
        }
      });
    });
  }

  deleteFile(file, selectedTid = '', selectedCid = '') {
    const { callback } = this.props;
    this.setState({ loading: true }, async () => {
      const tenderObj = Tenders.getTender(this.state.tenders, selectedTid);
      const isAllProjects = tenderObj?.type === ETYPE_PROJECT;
      await this.documentsService
        .delete(file.id, isAllProjects ? '' : file.cid)
        .then((response) => {
          if (response && response.success) {
            this.setState(
              (prevState) => {
                const {
                  tenders,
                  selectedTender,
                  selectedCategory,
                } = prevState;
                const tid = selectedTender || selectedTid;
                const cid =
                  selectedCid === '' ? selectedCategory : selectedCid;

                if (isAllProjects) {
                  const updatedTenders = tenders.map((tender) => ({
                    ...tender,
                    folders: (tender.folders || []).map((folder) => ({
                      ...folder,
                      files: Files.deleteFile(folder.files || [], file.id),
                    })),
                  }));

                  return {
                    tenders: updatedTenders,
                    loading: false,
                  };
                }

                return {
                  tenders: Tenders.deleteFile(tenders, tid, cid, file.id),
                  loading: false,
                };
              },
              () => {
                if (callback) {
                  callback();
                }
              },
            );
          }
        })
        .catch(() => {
          this.setState({ loading: false });
          alert(
            { success: false },
            null,
            {},
            {
              title: i18n.t('file-manager-action-not-completed'),
              message: i18n.t('file-manager-delete-error-msg'),
              type: 'error',
            },
          );
        });
    });
  }

  deleteFolder(folder) {
    const { callback } = this.props;
    this.setState({ loading: true }, () => {
      this.categoriesService.deleteCategory(folder.id).then((response) => {
        if (response && response.success) {
          this.setState(
            (prevState) => {
              const { tenders, selectedTender: tid } = prevState;
              return {
                tenders: Tenders.deleteFolder(tenders, tid, folder.id),
                loading: false,
              };
            },
            () => {
              if (callback) {
                callback();
              }
            },
          );
        }
      });
    });
  }

  initPageWithParams(params) {
    const { domain, projectData } = this.props;
    const { tender: projectTenders, id: pid } = projectData;

    const selectedTender = getTenderFromUrl(projectTenders, params);

    const tenders = Tenders.createTenders(projectTenders, pid);
    if (selectedTender) {
      this.initWithTender(tenders, selectedTender, params);
    } else {
      this.setState({ tenders }, () => {
        const [entity, id] = params.split('-');
        if (entity === ETYPE_PROJECT) {
          this.loadFolders({ id: Number(id), pid: Number(id), type: entity });
        } else {
          setUrl(domain);
          this.setState({ loading: false });
        }
      });
    }
  }

  initWithTender(tenders, tid, params = '') {
    this.setState({ tenders }, () => {
      this.loadFolders(Tenders.getTender(tenders, tid), () => {
        const { tenders: updatedTenders } = this.state;
        const tender = Tenders.getTender(updatedTenders, tid);
        const selectedCategory = getFolderFromUrl(tender.folders, params);
        if (selectedCategory) {
          this.clickFolder(Folders.getFolder(tender.folders, selectedCategory));
        }
      });
    });
  }

  selectAll() {
    this.setState((prevState) => {
      const { tenders, selectedTender, selectedCategory, selectAllChecked } =
        prevState;
      const newSelectAll = !selectAllChecked;
      const newTenders = selectedCategory
        ? Tenders.selectAllFiles(
          tenders,
          selectedTender,
          selectedCategory,
          newSelectAll,
        )
        : Tenders.selectAllFolders(tenders, selectedTender, newSelectAll);

      return { tenders: newTenders, selectAllChecked: newSelectAll };
    });
  }

  selectItem(item) {
    this.setState((prevState) => {
      const {
        tenders,
        selectedTender: tid,
        selectedCategory: cid,
        selectedFiles,
      } = prevState;
      const { defaultTender } = this.props;
      const newSelected = !item.checked;
      let newSelectedFiles = [...selectedFiles];
      let newTenders = tenders;
      if (defaultTender) {
        newTenders = Tenders.selectFile(
          tenders,
          item.tid,
          item.cid,
          item.id,
          newSelected,
        );
        newSelectedFiles = newSelected
          ? [...selectedFiles, item]
          : newSelectedFiles.filter((file) => file.id !== item.id);
      } else {
        newTenders = cid
          ? Tenders.selectFile(tenders, tid, cid, item.id, newSelected)
          : Tenders.selectFolder(tenders, tid, item.id, newSelected);
      }
      return { tenders: newTenders, selectedFiles: newSelectedFiles };
    });
  }

  loadSearchableOptions(term) {
    if (term && term.length > TERM_LENGTH_LIMIT) {
      const { selectedTender: eid } = this.state;
      const { projectData } = this.props;
      const { id: pid } = projectData;
      const params = { term, pid };
      if (eid) {
        params.eid = eid;
      }
      return this.categoriesService.search(params);
    }
    return null;
  }

  selectSearchableItem(item) {
    let selectedTender = 0;
    let selectedCategory = 0;

    if (item) {
      selectedTender = item.tid;
      selectedCategory = item.cid;
    }

    const { tenders } = this.state;
    const selectedTenderData = Tenders.getTender(tenders, selectedTender);
    this.setState(
      { selectedSearchableItem: item, selectedTender, selectedCategory },
      item && selectedTenderData
        ? () => this.loadFolders(selectedTenderData)
        : () => null,
    );
  }

  submitCategoryModal(newFolder, setShow, setError, setLoading, id = 0) {
    const { projectData } = this.props;
    const { id: pid } = projectData;
    const { selectedTender: tid, tenders } = this.state;
    const resolve = (response) => {
      if (response && response.success) {
        const newTenders = id
          ? Tenders.renameFolder(tenders, tid, id, newFolder)
          : Tenders.addFolder(tenders, tid, response.id, pid, newFolder);
        this.setState({ tenders: newTenders }, () => {
          setError(false);
          setLoading(false);
          setShow(false);
        });
      } else {
        setError(true);
        setLoading(false);
      }
    };

    if (id) {
      new CategoriesService({ id: tid })
        .renameCategory(id, newFolder)
        .then(resolve);
    } else {
      new CategoriesService({ id: tid })
        .createCategory(newFolder, pid === tid, pid)
        .then(resolve);
    }
  }

  selectFromExistingMedia() {
    const { selectedFiles, tenders, openSidemodalCategory } = this.state;
    if (selectedFiles.length) {
      const { defaultTender, projectData, callback } = this.props;
      const { id: pid } = projectData;
      this.setState({ loading: true });
      this.cloneFiles(selectedFiles)
        .then((responses) => {
          this.addFilesSidemodal(responses)
            .then((files) => {
              const newFiles = files.map((file) => {
                const { file: clonedFile, newId } = file;
                return { ...clonedFile, id: newId, type: TYPE_STRUCTURAL.id };
              });
              this.setState({
                loading: false,
                showAllTenders: false,
                tenders: Tenders.addFiles(
                  tenders,
                  defaultTender,
                  openSidemodalCategory,
                  pid,
                  newFiles,
                ),
              });
              this.setShowAllTenders(false);
              if (callback) {
                callback();
              }
            })
            .catch(() => {
              this.setState({ error: true });
            });
        })
        .catch(() => {
          this.setState({ error: true });
        });
    }
  }

  addSelectedToAttachments() {
    const { selectedFiles } = this.state;
    const { projectData, trAttachmentsData, callback, closeSidemodal, showSnackbar } = this.props;
    const { id: pid } = projectData;

    const newSelectedFiles = selectedFiles.map((file) => ({
      ...file,
      isExistingMedia: true,
    }));

    this.setState({ loading: true }, async () => {
      try {
        const response = await httpHelperV2({
          url: `project/${pid}/tender/${trAttachmentsData?.tid}/tender_recommendation/${trAttachmentsData?.trid}/upload_existing`,
          method: 'POST',
          body: {
            data: newSelectedFiles,
          },
        });

        if (response && !response?.skipped?.length) {
          this.setState({
            loading: false,
            showAllTenders: false,
            selectedFiles: [],
          });
          this.setShowAllTenders(false);
          showSnackbar(i18n.t('files-uploaded-successfully', { count: selectedFiles.length }),'success');


          if (closeSidemodal) {
            closeSidemodal();
          }

          if (callback) {
            callback();
          }
        } else {
          showSnackbar(i18n.t('failed-to-upload-files'),'error');
        }
      } catch (error) {
        this.setState({ loading: false });
        showSnackbar(i18n.t('failed-to-upload-files'),'error');
      }
    });
  }


  async addFilesSidemodal(responses) {
    const { openSidemodalCategory } = this.state;
    const promises = responses.map((res) => {
      const { id, file } = res;
      return new Promise((resolve, reject) => {
        const documentRelay = new Relay('document_category', 'addDocument', {
          cid: openSidemodalCategory,
          did: id,
        });
        // eslint-disable-next-line no-promise-executor-return
        return documentRelay
          .post()
          .then((response) => response.json())
          .then((json) => resolve({ json, newId: id, file }))
          .catch(reject);
      });
    });

    return Promise.all(promises);
  }

  async cloneFiles(selectedFiles) {
    const promises = selectedFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const documentRelay = new Relay('document', 'clone', { did: file.id });
        // eslint-disable-next-line no-promise-executor-return
        return documentRelay
          .post({ did: file.id })
          .then((response) => response.json())
          .then((json) => {
            resolve({ ...json, file });
          })
          .catch(reject);
      });
    });

    return Promise.all(promises);
  }

  render() {
    const {
      error,
      loading,
      nonBlockLoading,
      loadingSidemodal,
      archived,
      tenders,
      selectedFiles,
      selectedTender,
      selectedCategory,
      selectAllChecked,
      selectedSearchableItem,
      showAllTenders,
      duplicateFiles,
    } = this.state;
    const { projectData, defaultTender, sidemodal, tenderAddendum , trAttachments } =
      this.props;
    const header = (
      <Header
        sidemodal={sidemodal}
        tenderAddendum={tenderAddendum}
        selectedTender={selectedTender}
        selectedCategory={selectedCategory}
        showAllTenders={showAllTenders}
        selectedFiles={selectedFiles}
        addFolder={this.submitCategoryModal}
        selectFromExistingMedia={this.selectFromExistingMedia}
        addSelectedToAttachments={this.addSelectedToAttachments}
        addFiles={this.addFiles}
        setRoot={this.setRoot}
        trAttachments={trAttachments}
      />
    );

    const ContentLeft = (
      <List
        tenders={tenders}
        sidemodal={sidemodal}
        selectedTender={selectedTender}
        selectedCategory={selectedCategory}
        selectAllChecked={selectAllChecked}
        selectedSearchableItem={selectedSearchableItem}
        clickTender={this.loadFolders}
        clickFolder={this.clickFolder}
        renameFolder={this.submitCategoryModal}
        addAllDocs={this.addAllDocs}
        bulkAddAllDocs={this.bulkAddAllDocs}
        deleteFolder={this.deleteFolder}
        deleteFile={this.deleteFile}
        deleteBulkFiles={this.deleteBulkFiles}
        deleteBulkFolders={this.deleteBulkFolders}
        selectItem={this.selectItem}
        selectAll={this.selectAll}
      />
    );

    const ContentRight = (
      <>
        <Search
          handleChange={this.selectSearchableItem}
          loadSearchableOptions={this.loadSearchableOptions}
          value={selectedSearchableItem}
        />
        <Panel className="panel-info" style={{ visibility: 'visible' }}>
          <AcceptedFilesList />
        </Panel>
      </>
    );

    let folders = [];
    if (sidemodal) {
      const tender = Tenders.getTender(tenders, defaultTender);
      folders = tender ? tender.folders : [];
    }

    return sidemodal ? (
      <>
        {error && (
          <Alert variant="danger">
            An error occurred while fetching the form data.
          </Alert>
        )}
        {loading && <Loading />}
        {!loading && !error && (
          <>
            {header}
            {showAllTenders ? (
              <AccordionTenders
                tenders={tenders}
                folders={folders}
                tenderAddendum={tenderAddendum}
                defaultTender={defaultTender}
                showAllTenders={showAllTenders}
                loadingSidemodal={loadingSidemodal}
                addFiles={this.addFiles}
                addAllDocs={this.addAllDocs}
                deleteFolder={this.deleteFolder}
                deleteFile={this.deleteFile}
                renameFolder={this.submitCategoryModal}
                setLoading={this.setLoading}
                loadSidemodalFolders={this.loadSidemodalFolders}
                selectItem={this.selectItem}
              />
            ) : (
              <AccordionCategories
                tenders={tenders}
                folders={folders}
                tenderAddendum={tenderAddendum}
                defaultTender={defaultTender}
                addFiles={this.addFiles}
                addAllDocs={this.addAllDocs}
                deleteFolder={this.deleteFolder}
                deleteFile={this.deleteFile}
                renameFolder={this.submitCategoryModal}
                setShowAllTenders={this.setShowAllTenders}
                setOpenSidemodalCategory={this.setOpenSidemodalCategory}
                setLoading={this.setLoading}
              />
            )}
          </>
        )}
        {flag('OVERWRITE_FILE_MANAGER') && (
          <DuplicateFilesModal
            open={duplicateFiles.length > 0}
            onClose={this.handleCancelDuplicates}
            duplicateFiles={duplicateFiles}
            onRename={this.handleRenameDuplicates}
            onOverwrite={this.handleOverwriteDuplicates}
          />
        )}
      </>
    ) : (
      <>
        {error && (
          <Alert variant="danger">
            An error occurred while fetching the form data.
          </Alert>
        )}
        {loading && <Loading />}
        {!loading && !error && !archived && (
          <>
            {nonBlockLoading && (
              <AlertMUI
                icon={<Loading />}
                severity="warning"
                sx={{ justifyContent: 'space-evenly', alignItems: 'center' }}
              >
                We&apos;re saving your file structure. Do not leave the page.
              </AlertMUI>
            )}
            <Row className="file-manager-header">
              <div className="header-container">
                <Panel className="breadcrumbs-panel" header={header} />
              </div>
            </Row>
            <div className="file-manager-container">
              <PanelForm
                headerLeft={null}
                headerRight={null}
                contentLeft={ContentLeft}
                contentRight={ContentRight}
                rightContentInPanel={false}
                classNameLeft="file-manager-container--panel-left"
                classNameRight="file-manager-container--panel-right"
              />
            </div>
          </>
        )}
        {archived && <ArchivedModal project={projectData} />}
        {flag('OVERWRITE_FILE_MANAGER') && (
          <DuplicateFilesModal
            open={duplicateFiles.length > 0}
            onClose={this.handleCancelDuplicates}
            duplicateFiles={duplicateFiles}
            onRename={this.handleRenameDuplicates}
            onOverwrite={this.handleOverwriteDuplicates}
          />
        )}
      </>
    );
  }
}

function WrapperFileManager(props) {
  const location = useLocation();
  if (!props.projectData || !props.projectData.id) {
    return <Loading />;
  }
  return <FileManager {...props} location={location} />;
}

const mapStateToProps = (state) => {
  const domain = BASE_URLS.FILE_MANAGER.replace(
    ':slug',
    state.project.data?.slug || '',
  );

  return {
    projectData: state.project.data,
    domain,
  };
};

export default connect(mapStateToProps)(WrapperFileManager);
