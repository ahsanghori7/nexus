import React from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import {
  Card,
  CardBody,
  CardInfoLine,
  Badge,
  Image,
  CONSTANTS,
} from 'clink-components';
import InfoTooltip from 'v2/apps/shared/components/cards/big/InfoTooltip';
import Options from './Options';
import {
  StyledCardItemHead,
  StyledCardItemHeadTitle,
  StyledCardItemHeadDescription,
  StyledCardItemInfoSubtitle,
  StyledCardItemHeadTags,
  StyledCardItemHeadInfo,
  StyledCardItemInfoTradesSubtitle,
  StyledCardInfoDescription,
  StyledCardInfoTradesDescription,
  StyledCardItemClosed,
  StyledCardItemClosedImage,
  StyledCardItemClosedText,
  StyledCardItemTrades,
  StyledInfoLineWrapper,
} from './styled';

const { closedIcon } = CONSTANTS.s3;
const PackageCard = ({
  pack,
  subcontractor = {},
  handleRegister,
  claimToken = () => null,
  fetchSingleProject = null,
}) => {
  const { t } = useTranslation();
  const {
    registered = false,
    can_register: canRegister = false,
    awarded: closed = false,
    matched = false,
    can_register_message: restrictedMessage,
    label: packageName = '*****',
    service: serviceType = '*****',
    start_on_site: startingDate = '*****',
    tender_return: tenderReturn = '*****',
    size: projectSize = '*****',
    packages: tenderTags = [],
    id: packageID,
    interest_count: interestCount = 0,
    cardTheme = 'prosper-package-card',
  } = pack;

  return (
    <Card theme={cardTheme}>
      {closed && (
        <StyledCardItemClosed>
          <StyledCardItemClosedImage>
            <Image src={closedIcon} alt="Closed icon" />
          </StyledCardItemClosedImage>
          <StyledCardItemClosedText>
            {t('opportunity-closed')}
          </StyledCardItemClosedText>
        </StyledCardItemClosed>
      )}
      <StyledCardItemHead matched={matched} closed={closed}>
        <StyledCardItemHeadTitle matched={matched} closed={closed}>
          {packageName}
        </StyledCardItemHeadTitle>
        <StyledCardItemHeadInfo matched={matched} closed={closed}>
          <b>{interestCount > 5 ? '5+' : interestCount}</b>
          {t('registered-interests')}
          <InfoTooltip matched={matched} closed={closed} />
        </StyledCardItemHeadInfo>
        <StyledCardItemHeadDescription matched={matched}>
          <StyledCardItemHeadTags matched={matched} closed={closed}>
            {t('text-trade-tags')}:
          </StyledCardItemHeadTags>
          {tenderTags.map((tag) => (
            <Badge color="prosper-orange" key={tag} text={tag} />
          ))}
        </StyledCardItemHeadDescription>
      </StyledCardItemHead>
      <CardBody theme={cardTheme} disabled={!matched || closed}>
        <StyledInfoLineWrapper>
          <CardInfoLine theme={cardTheme}>
            <StyledCardItemInfoSubtitle matched={matched} closed={closed}>
              {t('text-service-required')}:
            </StyledCardItemInfoSubtitle>
            <StyledCardInfoDescription>{serviceType}</StyledCardInfoDescription>
          </CardInfoLine>
          <CardInfoLine theme={cardTheme}>
            <StyledCardItemInfoSubtitle matched={matched} closed={closed}>
              {t('text-tender-return')}:
            </StyledCardItemInfoSubtitle>
            <StyledCardInfoDescription>
              {String(moment(new Date(tenderReturn)).format('Do MMMM YYYY'))}
            </StyledCardInfoDescription>
          </CardInfoLine>
          <CardInfoLine theme={cardTheme}>
            <StyledCardItemInfoSubtitle matched={matched} closed={closed}>
              {t('text-start-on-site')}:
            </StyledCardItemInfoSubtitle>
            <StyledCardInfoDescription>
              {String(moment(new Date(startingDate)).format('Do MMMM YYYY'))}
            </StyledCardInfoDescription>
          </CardInfoLine>
          <CardInfoLine theme={cardTheme}>
            <StyledCardItemInfoSubtitle matched={matched} closed={closed}>
              {t('text-project-size')}:
            </StyledCardItemInfoSubtitle>
            <StyledCardInfoDescription>{projectSize}</StyledCardInfoDescription>
          </CardInfoLine>
        </StyledInfoLineWrapper>
        <StyledCardItemTrades>
          <StyledCardItemInfoTradesSubtitle>
            {t('text-trade-tags')}:
          </StyledCardItemInfoTradesSubtitle>

          {tenderTags && tenderTags.length && (
            <StyledCardInfoTradesDescription>
              {tenderTags.map((tag) => (
                <Badge color="prosper-orange" key={tag} text={tag} />
              ))}
            </StyledCardInfoTradesDescription>
          )}
        </StyledCardItemTrades>
        {matched && !closed && (
          <Options
            registered={registered}
            canRegister={canRegister}
            restrictedMessage={restrictedMessage}
            cardTheme={cardTheme}
            subcontractor={subcontractor}
            handleRegister={() => handleRegister(packageID)}
            tenderReturn={tenderReturn}
            claimToken={claimToken}
            fetchSingleProject={fetchSingleProject}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default PackageCard;
