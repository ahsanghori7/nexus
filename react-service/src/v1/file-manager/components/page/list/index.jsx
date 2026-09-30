import React from 'react';
import { renderToString } from 'react-dom/server';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import { INFO_CLINK_EMAIL } from '../../../../global/helpers/constants';
import Email from '../../../../global/components/Email';
import Tenders from '../../../helpers/Tenders';
import Folders from '../../../helpers/Folders';
import Files from '../../../helpers/Files';
import TenderHeader from './header/Tender';
import CategoryHeader from './header/Category';
import FileHeader from './header/File';
import TenderRow from './content/TenderRow';
import CategoryRow from './content/CategoryRow';
import FileRow from './content/FileRow';

const email = renderToString(<Email>{INFO_CLINK_EMAIL}</Email>);
const MAX_LIMIT_TITLE = 'Large folder';
const MAX_LIMIT_MESSAGE = `<i>The folder you are trying to download is too
  large (more than ${MAX_FILES_LIMIT} files per folder).<br><br>
  Please, email ${email} with your request and we will
  send them to you</i>`;
const List = ({
  tenders,
  sidemodal = false,
  selectedTender = 0,
  selectedCategory = 0,
  selectAllChecked = false,
  selectedSearchableItem = null,
  clickTender,
  clickFolder,
  renameFolder,
  addAllDocs,
  bulkAddAllDocs,
  deleteFolder,
  deleteFile,
  deleteBulkFiles,
  deleteBulkFolders,
  selectAll,
  selectItem,
}) => {
  const tenderIsSelected = Boolean(selectedTender);
  const categoryIsSelected = Boolean(selectedCategory);

  const getItems = () => {
    if (!tenderIsSelected) {
      return tenders;
    }
    const tender = Tenders.getTender(tenders, selectedTender);
    if (tenderIsSelected && !categoryIsSelected && tender && tender.folders) {
      return tender.folders;
    }
    if (tenderIsSelected && categoryIsSelected && tender && tender.folders) {
      const folder = Folders.getFolder(tender.folders, selectedCategory);
      const files = folder && folder.files;
      return (
        Files.get(files, selectedSearchableItem).filter(
          (file) => file.visible
        ) || []
      );
    }
    return [];
  };

  const handleClickItem = (item) => {
    if (!tenderIsSelected) {
      clickTender(item);
    } else if (!categoryIsSelected) {
      clickFolder(item);
    }
  };

  return (
    <div className="list-file-manager">
      <Row className="header-list-group-file-manager">
        {!tenderIsSelected && <TenderHeader />}
        {tenderIsSelected && !categoryIsSelected && (
          <CategoryHeader
            tid={selectedTender}
            tenders={tenders}
            sidemodal={sidemodal}
            selectAllChecked={selectAllChecked}
            addAllDocs={addAllDocs}
            bulkAddAllDocs={bulkAddAllDocs}
            deleteBulkFolders={deleteBulkFolders}
            selectAll={selectAll}
            maxLimitTitle={MAX_LIMIT_TITLE}
            maxLimitMessage={MAX_LIMIT_MESSAGE}
          />
        )}
        {tenderIsSelected && categoryIsSelected && (
          <FileHeader
            tid={selectedTender}
            cid={selectedCategory}
            tenders={tenders}
            selectAllChecked={selectAllChecked}
            deleteBulkFiles={deleteBulkFiles}
            selectAll={selectAll}
            clickFolder={clickFolder}
          />
        )}
      </Row>
      <ListGroup as="ul" className="list-group-file-manager">
        {getItems().map((item) => (
          <ListGroup.Item key={item.id} as="li" action>
            {!tenderIsSelected && (
              <TenderRow item={item} clickItem={handleClickItem} />
            )}
            {tenderIsSelected && !categoryIsSelected && (
              <CategoryRow
                item={item}
                sidemodal={sidemodal}
                clickItem={handleClickItem}
                renameFolder={renameFolder}
                addAllDocs={addAllDocs}
                deleteFolder={deleteFolder}
                selectItem={selectItem}
                maxLimitTitle={MAX_LIMIT_TITLE}
                maxLimitMessage={MAX_LIMIT_MESSAGE}
              />
            )}
            {tenderIsSelected && categoryIsSelected && (
              <FileRow
                item={item}
                deleteFile={deleteFile}
                selectItem={selectItem}
              />
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default List;
