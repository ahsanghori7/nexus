import React from 'react';
import Requester from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester';
import { expiredDate } from 'v2/helpers/date';
import { insurancesSx } from './styles';

const Wrapper = ({ children, data, aid, extra = false }) => {
  if (!data.date || expiredDate(new Date(data.date))) {
    return (
      <Requester
        aid={aid}
        type="insurances"
        sx={{
          ...insurancesSx,
          minWidth: extra ? { xs: 0, lg: 'auto' } : insurancesSx.minWidth,
          height: extra ? 8 : insurancesSx.height,
          top: extra ? 8 : insurancesSx.top,
          display: {
            xs: 'none',
            lg: 'flex',
          },
          flexBasis: { xs: '50%', lg: 'auto' },
        }}
        data={data}
        extra={extra}
      >
        {children}
      </Requester>
    );
  }
  return children;
};

export default Wrapper;
