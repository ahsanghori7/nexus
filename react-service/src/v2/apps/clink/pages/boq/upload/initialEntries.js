import { v4 as uuidv4 } from 'uuid';

const PRELIMS = 'Prelims';
const MEASURED_WORK = 'Measured work';
const OTHER = 'Other items';

const entries = [
  {
    id: uuidv4(),
    item_no: '',
    description: PRELIMS,
    type: 'Section',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 1,
  },
  {
    id: uuidv4(),
    item_no: '',
    description: '',
    type: 'Item',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 2,
  },
  {
    id: uuidv4(),
    item_no: '',
    description: MEASURED_WORK,
    type: 'Section',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 3,
  },
  {
    id: uuidv4(),
    item_no: '',
    description: '',
    type: 'Item',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 4,
  },
  {
    id: uuidv4(),
    item_no: '',
    description: OTHER,
    type: 'Section',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 5,
  },
  {
    id: uuidv4(),
    item_no: '',
    description: '',
    type: 'Item',
    unit_id: undefined,
    quantity: 0,
    tenderee_note: '',
    budget_rate: 0,
    budget_total: 0,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: 1,
    },
    position: 6,
  },
];

export default entries;
export { PRELIMS, MEASURED_WORK, OTHER };
