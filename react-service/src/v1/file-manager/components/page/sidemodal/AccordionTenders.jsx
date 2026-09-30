import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Loading from '../../../../global/components/Loading';
import HeaderToggle from './HeaderToggle';
import TenderHeader from '../list/header/Tender';
import AccordionCategories from './AccordionCategories';

const AccordionTenders = ({
  tenders,
  defaultTender,
  showAllTenders,
  selectItem,
  tenderAddendum,
  loadingSidemodal,
  loadSidemodalFolders,
}) => {
  return (
    <>
      <TenderHeader
        sidemodal
        tid={defaultTender}
        tenders={tenders}
        showAllTenders={showAllTenders}
      />
      <Accordion as="ul">
        {tenders.map((tender) => (
          <Card key={tender.id} as="li">
            <HeaderToggle
              eventKey={tender.id}
              data={tender}
              loadSidemodalFolders={loadSidemodalFolders}
              className="show-all-header"
              showAllTenders={showAllTenders}
            />
            <Accordion.Collapse eventKey={tender.id}>
              <Card.Body>
                {loadingSidemodal ? (
                  <Loading />
                ) : (
                  <AccordionCategories
                    tenders={tenders}
                    tenderAddendum={tenderAddendum}
                    loadingSidemodal={loadingSidemodal}
                    className="show-all-categories"
                    showAllTenders={showAllTenders}
                    folders={tender.folders}
                    tid={tender.id}
                    selectItem={selectItem}
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

export default AccordionTenders;
