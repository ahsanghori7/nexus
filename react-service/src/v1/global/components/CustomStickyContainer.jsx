import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { StickyContainer, Sticky } from 'react-sticky';

const Nav = ({ data, title = 'Selected packages', action = null }) => (
  <Sticky>
    {({ style }) => (
      <div className="custom-sticky-container__navigation" style={style}>
        {action}
        <div className="custom-sticky-container__navigation__header">
          <h1>{title}</h1>
        </div>
        <p>Jump to</p>
        <ul>
          {data.map((d) => (
            <li key={d.id}>
              <a href={`#${d.label}`}>{d.label}</a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </Sticky>
);

// content need to have a container with id prop filled with data.label
// navAction renders above the nav header (e.g. a project-level action button)
const CustomStickyContainer = ({
  navData,
  content,
  className = '',
  navAction = null,
}) => {
  return (
    <StickyContainer className={className}>
      <Row>
        <Col lg={2} md={2} sm={12}>
          <Nav data={navData ?? []} action={navAction} />
        </Col>
        <Col lg={10} md={10} sm={12}>
          {content}
        </Col>
      </Row>
    </StickyContainer>
  );
};

export default CustomStickyContainer;
