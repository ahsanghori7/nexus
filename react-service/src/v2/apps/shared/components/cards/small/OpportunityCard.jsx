import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardDeleteButton,
  CardImage,
  CardInfoLine,
  CardLink,
  CardTitle,
  CONSTANTS,
} from 'clink-components';
import { checkIfImageExists } from 'v2/helpers/url';
import { ImageContent, Content, DeleteContent } from './styled';

const { prosperPackagesDefault } = CONSTANTS.s3;

const Anchor = ({ children, item }) => (
  <a href={item.viewProject}>{children}</a>
);

const OpportunityCard = ({
  item,
  onDelete,
  theme = 'prosper-opportunities-small',
}) => {
  const [imageExists, setImageExists] = useState(false);

  const Wrapper = !item.restricted ? Anchor : React.Fragment;
  const wrapperProps = !item.restricted ? { item } : {};

  useEffect(() => {
    checkIfImageExists(item.projectImage, (exists) => {
      setImageExists(exists);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    item && (
      <Card key={item.id} theme={theme}>
        <CardBody disabled={item.restricted} theme={theme}>
          <ImageContent>
            <Wrapper {...wrapperProps}>
              <CardImage
                theme={theme}
                src={imageExists ? item.projectImage : prosperPackagesDefault}
                alt={item.projectName}
                disabled={item.restricted}
                disabledMessage="UPGRADE TO VIEW"
              />
            </Wrapper>
          </ImageContent>
          <Content>
            <CardTitle theme={theme}>{item.projectName}</CardTitle>
            {item.region && (
              <CardInfoLine theme={theme}>
                Region: <span>{item.region}</span>
              </CardInfoLine>
            )}
            {item.projectCompany && (
              <CardInfoLine theme={theme}>
                Company: <span>{item.projectCompany}</span>
              </CardInfoLine>
            )}
            {item.projectName2 && (
              <CardInfoLine theme={theme}>
                Project: <span>{item.projectName2}</span>
              </CardInfoLine>
            )}
            {item.projectPack && (
              <CardInfoLine theme={theme}>
                Package: <span>{item.projectPack}</span>
              </CardInfoLine>
            )}
            {item.tokenAmount && (
              <CardInfoLine theme={theme}>
                Number of tokens: <span>{item.tokenAmount}</span>
              </CardInfoLine>
            )}
            {item.tokenCost && (
              <CardInfoLine theme={theme}>
                Cost: <span>{item.tokenCost}</span>
              </CardInfoLine>
            )}
            {item.projectDate && (
              <CardInfoLine theme={theme}>
                Added: <span>{item.projectDate}</span>
              </CardInfoLine>
            )}
            {item.viewProject && (
              <CardLink
                theme={theme}
                disabled={item.restricted}
                href={item.viewProject}
              >
                View Project
              </CardLink>
            )}
          </Content>
          {onDelete && (
            <DeleteContent>
              <CardDeleteButton
                theme={theme}
                disabled={item.restricted}
                onDelete={() => onDelete && onDelete(item)}
              />
            </DeleteContent>
          )}
        </CardBody>
      </Card>
    )
  );
};

export default OpportunityCard;
