import React from 'react';
import isNil from 'lodash/isNil';
import { Accordion, Card } from 'react-bootstrap';
import HeaderToggle from '../HeaderToggle';
import Form from './Form';

const FormCard = (props) => {
  const {
    pid,
    selectedTenders,
    tid,
    formData,
    region,
    constants,
    deleteTender,
    setOpenForm,
    updateForms,
    triggerCustomErrors,
    showEmptyError,
    init,
    currentDependencies,
    project,
    milestones,
    hasAsiteFoldersFeature,
  } = props;

  const isOpen = isNil(formData?.isOpen) ? formData?.open : formData?.isOpen;

  const handleOnClick = (eventKey, isCurrentEventKey) => {
    setOpenForm(eventKey, isCurrentEventKey);
  };

  const handleDeleteTender = () => deleteTender(tid);

  return (
    <Accordion
      defaultActiveKey={
        (isNil(formData.isOpen) ? formData.open : formData.isOpen) && tid
      }
      data-testid={`work-package-card-${tid}`}
    >
      <Card
        key={tid}
        className={`${
          isOpen ? 'form-is-open' : ''
        } ${formData.error || showEmptyError ? 'red' : ''}`}
      >
        <Card.Header>
          <HeaderToggle
            eventKey={tid}
            deleteTender={handleDeleteTender}
            setOpen={handleOnClick}
          >
            <b>
              <span>
                {formData.label} <span className="required">*</span>
              </span>
            </b>
          </HeaderToggle>
        </Card.Header>
        <Accordion.Collapse eventKey={tid}>
          <Card.Body>
            <Form
              pid={pid}
              selectedTenders={selectedTenders}
              tid={tid}
              formData={formData}
              region={region}
              constants={constants}
              updateForms={updateForms}
              triggerCustomErrors={triggerCustomErrors}
              init={init}
              currentDependencies={currentDependencies}
              project={project}
              milestones={milestones}
              hasAsiteFoldersFeature={hasAsiteFoldersFeature}
              isOpen={isOpen}
            />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
};

export default FormCard;
