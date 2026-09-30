import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const Tender = ({ showAllTenders }) => {
  const label = showAllTenders ? 'Category' : 'Folder / Package Name';
  return (
    <Row className="tender-rows-header">
      <Col lg={10} md={10} sm={12}>
        <strong>{label}</strong>
      </Col>
      <Col lg={2} md={2} sm={12} />
    </Row>
  );
};

export default Tender;
