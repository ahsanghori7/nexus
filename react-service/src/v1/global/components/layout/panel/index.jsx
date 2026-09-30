import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { Toggle } from './Generics';

const Panel = ({
  id,
  className,
  header,
  options,
  accordion,
  collapsed,
  titleCentered,
  actionsButtons = null,
  style,
  children,
  formViewerRef = null,
  extra = null,
}) => {
  const [toggle, setToggle] = useState(!collapsed);
  const icon = toggle ? faMinus : faPlus;

  return (
    <Accordion
      id={id}
      style={style}
      className={`panel ${className}`}
      defaultActiveKey={`${collapsed ? '' : '0'}`}
    >
      <Card className={`sector mr-0 ${className}--sector`}>
        {header && (
          <Card.Header className="sector-header">
            {titleCentered && <div />}
            <Grid className="sector-header__title" width="100%">
              {header}
            </Grid>
            {(options || accordion) && (
              <div className="sector-header__actions">
                {options}
                {accordion && (
                  <Toggle icon={icon} handleClick={() => setToggle(!toggle)} />
                )}
              </div>
            )}
          </Card.Header>
        )}
        {extra}
        {children && (
          <Accordion.Collapse eventKey="0">
            <Card.Body
              id="formViewerRef"
              ref={formViewerRef}
              className={`sector-content ${className}--sector-content`}
            >
              {children}
            </Card.Body>
          </Accordion.Collapse>
        )}
      </Card>
      {actionsButtons ?? actionsButtons}
    </Accordion>
  );
};

Panel.defaultProps = {
  id: null,
  className: '',
  header: null,
  options: null,
  accordion: false,
  collapsed: false,
  style: null,
  children: null,
};

Panel.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  header: PropTypes.element,
  options: PropTypes.element,
  accordion: PropTypes.bool,
  collapsed: PropTypes.bool,
  style: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default Panel;
