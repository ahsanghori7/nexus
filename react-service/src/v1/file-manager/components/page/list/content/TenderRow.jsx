import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import FolderSvg from '../../../../../global/public/images/svg/icon-folder.svg';

const Tenders = ({ item, clickItem }) => {
  return (
    <Row className="tender-rows">
      <Col lg={10} md={10} sm={12} className="first-column-list">
        <FolderSvg />
        <Button
          variant="link"
          className="item-name"
          onClick={() => clickItem(item)}
        >
          {item.label}
        </Button>
      </Col>
      <Col lg={2} md={2} sm={12} />
    </Row>
  );
};

export default Tenders;
