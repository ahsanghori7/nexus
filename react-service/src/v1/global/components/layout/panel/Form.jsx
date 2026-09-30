import React from 'react';
import isNil from 'lodash/isNil';
import Panel from './index';
import HelpInfoSvg from '../../../public/images/svg/icon-help-info.svg';

const HELP_LABEL = 'Help';

const Header = ({ title }) => {
  return (
    <>
      {title === HELP_LABEL && <HelpInfoSvg />}
      <b>&nbsp;{title}</b>
    </>
  );
};

const Form = ({
  title,
  classNameLeft = '',
  headerLeft = <Header title={title} />,
  contentLeft = null,
  classNameRight = '',
  headerRight = <Header title={HELP_LABEL} />,
  contentRight = null,
  actionsButtons = null,
  leftContentInPanel = true,
  rightContentInPanel = true,
  children,
}) => {
  return (
    <div className="panel-form">
      {leftContentInPanel ? (
        <Panel
          style={
            isNil(contentLeft)
              ? { visibility: 'hidden' }
              : { visibility: 'visible' }
          }
          className={`${classNameLeft} panel-left`}
          header={headerLeft}
          actionsButtons={actionsButtons}
        >
          {contentLeft}
          {children}
        </Panel>
      ) : (
        <div
          style={
            isNil(contentLeft)
              ? { visibility: 'hidden' }
              : { visibility: 'visible' }
          }
          className={`${classNameLeft} panel-left`}
        >
          {contentLeft}
          {children}
        </div>
      )}
      {rightContentInPanel ? (
        <Panel
          style={
            isNil(contentRight)
              ? { visibility: 'hidden' }
              : { visibility: 'visible' }
          }
          header={headerRight}
          className={`${classNameRight} panel-right`}
        >
          {contentRight}
        </Panel>
      ) : (
        <div
          style={
            isNil(contentRight)
              ? { visibility: 'hidden' }
              : { visibility: 'visible' }
          }
          className={`${classNameRight} panel-right`}
        >
          {contentRight}
        </div>
      )}
    </div>
  );
};

export default Form;
