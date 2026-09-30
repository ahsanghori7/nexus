import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import FileHeader from '../list/header/File';
import FileList from '../list/content/FileRow';
import HeaderToggle from './HeaderToggle';
import AddFiles from './AddFiles';
import CategoryHeader from '../list/header/Category';

const AccordionCategories = ({
  tenders,
  folders,
  tid,
  tenderAddendum,
  showAllTenders,
  className = '',
  addFiles,
  addAllDocs,
  deleteFolder,
  deleteFile,
  renameFolder,
  setLoading,
  selectItem,
  setOpenSidemodalCategory,
  setShowAllTenders,
}) => {
  let newFolders = folders;
  if (folders) {
    const contractualFiles = folders.flatMap((folder) =>
      folder.files.filter((file) => Number(file.id) === Number(tenderAddendum))
    );
    if (contractualFiles.length) {
      const folderIds = contractualFiles.map((file) => file.cid);
      newFolders = newFolders.filter((folder) =>
        folderIds.includes(Number(folder.id))
      );
    }
  }
  return (
    <>
      {!showAllTenders && (
        <CategoryHeader sidemodal tid={tid} tenders={tenders} />
      )}
      <Accordion as="ul">
        {newFolders.map((folder) => (
          <Card key={folder.id} as="li">
            <HeaderToggle
              eventKey={folder.id}
              data={folder}
              className={className}
              showAllTenders={showAllTenders}
              addAllDocs={addAllDocs}
              deleteFolder={deleteFolder}
              renameFolder={renameFolder}
              setOpenSidemodalCategory={setOpenSidemodalCategory}
              setLoading={setLoading}
            />
            <Accordion.Collapse eventKey={folder.id}>
              <Card.Body>
                <FileHeader
                  sidemodal
                  tid={folder.tid}
                  cid={folder.id}
                  className={className}
                  tenders={tenders}
                  showAllTenders={showAllTenders}
                />
                <ListGroup as="ul">
                  {folder.files
                    .filter((file) => file.visible)
                    .map((file) => (
                      <ListGroup.Item key={file.id} as="li" action>
                        <FileList
                          item={file}
                          className={className}
                          deleteFile={deleteFile}
                          showAllTenders={showAllTenders}
                          selectItem={selectItem}
                        />
                      </ListGroup.Item>
                    ))}
                </ListGroup>
                {!showAllTenders && (
                  <AddFiles
                    tid={folder.tid}
                    cid={folder.id}
                    addFiles={addFiles}
                    setLoading={setLoading}
                    setShowAllTenders={setShowAllTenders}
                  />
                )}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        ))}
      </Accordion>
    </>
  );
};

export default AccordionCategories;
