import React from 'react';
import { Slide } from 'pure-react-carousel';
import Button from 'react-bootstrap/Button';
import Tooltip from '@mui/material/Tooltip';
import { CONSTANTS, ButtonImage } from 'clink-components';
import { getUrl, goToNewTab } from 'v2/helpers/url';
import GreenButton from '../../../../global/components/general-ui/Buttons';
import ProjectService from '../../../services/project';
import LazyImage from '../../../../global/components/LazyImage';
import { analytics } from '../../../../global/helpers/services';

const { viewProfileCarousel } = CONSTANTS.s3;

const service = new ProjectService();
const optionsSuccess = {
  title: 'They’re on!',
  message: 'The selected subcontractors have been added to your schedule.',
  type: 'success',
};
const Slides = ({ interests, pid, callback, slug }) => {
  return (
    <>
      {interests.map((interest) => {
        const url = getUrl(
          'CLINK_APP_HOST',
          `/main-contractor/supply_chain/${interest.cid}?return=ps&slug=${slug}`
        );
        const goProfile = () => goToNewTab(url);
        return (
          <Slide key={`${interest.cid}-${interest.id}`}>
            <div className="position-relative m-1 mr-1 d-flex flex-column justify-conten-center align-items-center text-center sub-wrapper">
              <Tooltip title="View Profile" placement="bottom">
                <div className="sub-info position-absolute">
                  <ButtonImage
                    src={viewProfileCarousel}
                    handleClick={goProfile}
                  />
                </div>
              </Tooltip>
              <div className="sub-image w-100 justify-content-center align-items-center d-flex">
                <LazyImage src={interest.logo} alt={interest.name} />
              </div>
              <div className="sub-description mb-sm-3 mb-1">
                <p className="sub-name font-weight-bold">{interest.name}</p>
                <p className="sub-specialization font-weight-bold">
                  {interest.label}
                </p>
              </div>
              <div className="sub-buttons d-flex justify-content-around aling-items-center">
                <GreenButton
                  className="mr-sm-2 mr-1 d-flex align-items-center"
                  handleClick={() => {
                    const data = {
                      pid,
                      type: 'Interest',
                      status: 'accepted',
                      tid: interest.id,
                      sid: interest.cid,
                    };
                    return analytics(
                      'procurement_schedule.added',
                      Number(interest.cid),
                      () =>
                        service.updateProjectHistory(
                          data,
                          callback,
                          true,
                          'GET',
                          {},
                          optionsSuccess
                        )
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="red-inverted"
                  onClick={() => {
                    const data = {
                      pid,
                      type: 'Interest',
                      status: 'dismissed',
                      tid: interest.id,
                      sid: interest.cid,
                    };
                    return analytics(
                      'procurement_schedule.declined',
                      Number(interest.cid),
                      () => service.updateProjectHistory(data, callback)
                    );
                  }}
                >
                  Decline
                </Button>
              </div>
            </div>
          </Slide>
        );
      })}
    </>
  );
};

export default Slides;
