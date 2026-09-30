import React, { useContext } from 'react';
import AccordionContext from 'react-bootstrap/AccordionContext';
import { useAccordionToggle } from 'react-bootstrap/AccordionToggle';
import NavUp from '../../../../global/public/images/svg/nav_up_gray.svg';
import NavDown from '../../../../global/public/images/svg/nav_down.svg';
import CategoryRow from '../list/content/CategoryRow';

const HeaderToggle = ({
  data,
  eventKey,
  showAllTenders,
  className,
  loadSidemodalFolders,
  addAllDocs,
  deleteFolder,
  renameFolder,
  setOpenSidemodalCategory,
  setLoading,
}) => {
  const currentEventKey = useContext(AccordionContext);

  const isCurrentEventKey = currentEventKey === eventKey;

  const handleOnClick = useAccordionToggle(eventKey, () => {
    if ('type' in data && !isCurrentEventKey) {
      loadSidemodalFolders(data);
    } else if (!showAllTenders && !isCurrentEventKey) {
      setOpenSidemodalCategory(data.id);
    } else if (!showAllTenders && isCurrentEventKey) {
      setOpenSidemodalCategory(false);
    }
  });

  return (
    <CategoryRow
      sidemodal
      item={data}
      className={className}
      showAllTenders={showAllTenders}
      addAllDocs={addAllDocs}
      deleteFolder={deleteFolder}
      renameFolder={renameFolder}
      setLoading={setLoading}
    >
      <div
        className="header-toggle-category"
        role="button"
        onClick={handleOnClick}
        onKeyDown={handleOnClick}
        tabIndex={eventKey}
      >
        {data.label}&nbsp;{isCurrentEventKey ? <NavUp /> : <NavDown />}
      </div>
    </CategoryRow>
  );
};

export default HeaderToggle;
