import React, { useContext } from 'react';
import i18next from 'v2/helpers/i18n';
import AccordionContext from 'react-bootstrap/AccordionContext';
import { useAccordionToggle } from 'react-bootstrap/AccordionToggle';
import { ConfirmAlert } from 'v1/global/components/clink-alert';
import BinIcon from '../../../public/images/svg/bin-icon.svg';
import NavUp from '../../../public/images/svg/nav_up.svg';
import NavDown from '../../../public/images/svg/nav_down.svg';

const Button = (props) => <BinIcon {...props} className="trash-bin" />;

const HeaderToggle = ({ children, eventKey, deleteTender, setOpen }) => {
  const currentEventKey = useContext(AccordionContext);

  const isCurrentEventKey = currentEventKey === eventKey;

  const handleOnClick = useAccordionToggle(eventKey, () => {
    setOpen(eventKey, !isCurrentEventKey);
  });

  const options = {
    title: 'Warning: Deleting this Package',
    message: (
      <>
        <div style={{ textAlign: 'justify', paddingBottom: '15px' }}>
          {i18next.t('delete-package-desc-1')}
        </div>
        <div style={{ textAlign: 'justify', paddingBottom: '15px' }}>
          <b>{i18next.t('delete-package-desc-2')}</b>
        </div>
      </>
    ),
    handleClick: deleteTender,
    acceptLabel: 'Delete Package',
    cancelLabel: 'Cancel',
    className: '',
  };
  return (
    <div
      role="button"
      onClick={handleOnClick}
      onKeyDown={handleOnClick}
      tabIndex={eventKey}
      data-testid={`work-package-toggle-${eventKey}`}
    >
      {children}
      <div className="toogle-icons">
        <ConfirmAlert
          Component={Button}
          props={{
            variant: 'success',
            type: 'button',
            children: 'Assign All',
            'data-testid': `work-package-delete-${eventKey}`,
          }}
          options={options}
        />
        {isCurrentEventKey ? (
          <NavUp className="angle angle--up" data-testid={`work-package-collapse-${eventKey}`} />
        ) : (
          <NavDown className="angle angle--down" data-testid={`work-package-expand-${eventKey}`} />
        )}
      </div>
    </div>
  );
};

export default HeaderToggle;
