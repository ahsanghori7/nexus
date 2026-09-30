const TENDER_RETURN = 1;
const START_ON_SITE = 2;
const mapping = {
  [TENDER_RETURN]: {
    id: TENDER_RETURN,
    value: TENDER_RETURN,
    label: 'Tender return',
  },
  [START_ON_SITE]: {
    id: START_ON_SITE,
    value: START_ON_SITE,
    label: 'Start on site',
  },
};

export { TENDER_RETURN, START_ON_SITE, mapping };
