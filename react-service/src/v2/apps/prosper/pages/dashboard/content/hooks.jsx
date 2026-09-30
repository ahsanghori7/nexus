import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import columns from './columns';
import grid2 from './grid-v2';
import minGrid from './min-grid';
import minGrid2 from './min-grid-2';

const useConfig = (
  layout = 'columns',
  opportunities = {},
  enquiries = {},
  subcontractor = {},
  dispatch = () => null,
) => {
  if (
    !subcontractor ||
    (subcontractor && !subcontractor.country) ||
    (subcontractor && subcontractor.country && !subcontractor.country.code)
  ) {
    return [
      {
        key: { one: true },
        title: <Skeleton variant="text" />,
        content: <Skeleton variant="rectangular" width={400} height={300} />,
      },
      {
        key: { two: true },
        title: <Skeleton variant="text" />,
        content: <Skeleton variant="rectangular" width={400} height={300} />,
      },
      {
        key: { three: true },
        title: <Skeleton variant="text" />,
        content: <Skeleton variant="rectangular" width={400} height={300} />,
      },
      {
        key: { four: true },
        title: <Skeleton variant="text" />,
        content: <Skeleton variant="rectangular" width={400} height={300} />,
      },
    ];
  }
  if (subcontractor?.country?.code === 'EU') {
    return minGrid(enquiries, dispatch);
  }
  if (
    subcontractor?.country?.code === 'AUS' ||
    subcontractor?.country?.code === 'NZ'
  ) {
    return minGrid2(opportunities, enquiries, subcontractor, dispatch);
  }
  if (layout === 'grid') {
    return grid2(opportunities, enquiries, subcontractor, dispatch);
  }
  return columns(opportunities, enquiries, subcontractor, dispatch);
};

export default useConfig;
