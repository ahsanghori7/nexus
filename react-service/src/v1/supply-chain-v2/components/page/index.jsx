import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useContext } from 'hooks/context';
import 'v1/global';
import 'v1/supply-chain-v2/public/styles/index.scss';
import { connect } from 'react-redux';
import Alert from 'react-bootstrap/Alert';
import Skeleton from '@mui/material/Skeleton';
import Grid2 from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import DemoButton from 'v2/apps/shared/components/demo-button';
import GreenButton from 'v1/global/components/general-ui/Buttons';
import Panel from '../../../global/components/layout/panel';
import { dedupeAttributeOptions } from '../../services';
import { SubcontractorModal } from './header';
import Container from './Container';
import Search from './Search';
import InfoModal from 'v2/apps/shared/components/InfoModal';
import { useTranslation } from 'react-i18next';
import { httpHelperV2 } from 'v2/services/httpHelper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Button, Typography, Autocomplete, TextField, Chip, Checkbox } from '@mui/material';
import i18n from 'v2/helpers/i18n';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import { useSnackbar } from 'v2/hooks/useSnackbar';

const ShowButtonModal = ({ handleClick, onClick, content, children }) => (
  <GreenButton
    className="form-subcontractor-show-button"
    label={content || children}
    handleClick={handleClick}
    onClick={onClick}
  />
);

const   SupplyChain = (props) => {
  const {
    clinkAccount,
    prequalificationV2,
    supplyChain,
    trades,
    regions,
    setTerm,
    setPaginationRowsPerPage,
    setOffset,
    setOrder,
    setDesc,
    setPaginationPage,
    addData,
    editData,
    removeData,
    setFilters,
  } = props;

  const {
    data: contractors,
    info,
    loading,
    error,
    term,
    paginationPage,
    desc,
    order,
    paginationRowsPerPage,
  } = supplyChain;

  const { total } = info;
  const { user } = clinkAccount;
  const { statuses = [] } = prequalificationV2;
  const accountType = user && user.type_id ? user.type_id : 0;
  const { t } = useTranslation();

  const [isFilterEnabled,setIsFilterEnabled] = useState(false);

  // Derive sort value from order and desc
 const getSortValue = () => {
    switch (order) {
      case 'company':
        return desc === 0 ? 'desc' : 'asc';

      case '':
        return desc === 1 ? 'new' : 'old';

      default:
        return 'desc';
    }
  };

  const [sortValue, setSortValue] = useState(getSortValue());
  const [selectedActivationStatus, setSelectedActivationStatus] = useState([]);
  const [selectedTradeType, setSelectedTradeType] = useState([]);
  const [selectedPqqStatus, setSelectedPqqStatus] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);

  // Update filters when selection changes
  useEffect(() => {
      setFilters({
        activated: selectedActivationStatus.map(item => item.id),
        pqq_status: selectedPqqStatus.map(item => item.id),
        trades: selectedTradeType.map(item => Number(item.id)),
        regions: selectedLocation.map(item => Number(item.id)),
      });

  }, [selectedActivationStatus, selectedPqqStatus, selectedTradeType, selectedLocation, setFilters]);


  useEffect(() => {
    const newSortValue = getSortValue();
    setSortValue(newSortValue);
  }, [order, desc]);

  // Multi-select filter component
  const MultiSelectFilter = ({ label, options, selectedValues, setSelectedValues, placeholder, 'data-testid': testId }) => {
    return (
      <Box data-testid={testId}>
        <Typography
          variant="body2"
          sx={{
            marginBottom: '8px',
            fontWeight: 600,
            color: '#333'
          }}
        >
          {label}
        </Typography>
        <FormControl fullWidth size="small">
          <Autocomplete
            multiple
            limitTags={1}
            id={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
            options={options}
            disableCloseOnSelect
            getOptionLabel={(option) => option.label}
            value={selectedValues}
            onChange={(event, newValue) => {
              setSelectedValues(newValue);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={selectedValues.length === 0 ? placeholder : ''}
              />
            )}
            ChipProps={{
              size: 'small',
            }}
          />
        </FormControl>
      </Box>
    );
  };

  const activationStatus = [
    {
      label:'Activated',
      id:1,

    },
    {
      label:'Not Activated',
      id:0,

    },
  ]

  const pqqStatus = [
    {
      label:'Not Started',
      id:0,

    },
    {
      label:'Partially Completed',
      id:2,

    },
    {
      label:'Completed',
      id:1,

    },
  ]


  const header =
      <Box>
        <FormControl size="small" sx={{flexDirection: 'row',justifyContent:'start',gap: '20px'}}>
          <Search
          term={term}
          setTerm={setTerm}
          placeholder="Search by company"
          />
          <Select
            displayEmpty
            value=""
            data-testid="supply-chain-download-select"
            IconComponent={KeyboardArrowDownIcon}
            renderValue={() => (
              <Box sx={{ display: 'flex', alignItems: 'center' ,gap: '10px',fontWeight: 500,paddingRight: '10px', borderRadius: '4px' }}>
                <FileDownloadOutlinedIcon
                  sx={{
                    width:28,
                    height:28
                  }}
                />
                <span>{t('download-supply-chain')}</span>
              </Box>
            )}
            sx={{
              color: '#4cc0ad',
              fontWeight:'bold',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(76, 192, 173, 0.04)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4cc0ad',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4cc0ad',
                borderWidth: '1px',
              },
              '& .MuiSvgIcon-root.MuiSelect-icon': {
                color: '#4cc0ad !important',
                transform: 'unset !important'
              },
            }}
          >
            <MenuItem>
              <Box
                onClick={()=> handleDownload('contact-list','supply-chain-contact-list')}
                sx={{
                  display:'flex',
                  gap:'8px',
                  alignItems:'center'
                }}
              >
                <FileDownloadOutlinedIcon
                  sx={{
                    width:22,
                    height:22,
                    color:'#969696'
                  }}
                />
                {t('supply-chain-contact-list')}
              </Box>
            </MenuItem>

            <MenuItem>
              <Box
                onClick={()=> handleDownload('status-report','supply-chain-status-report')}
                sx={{
                  display:'flex',
                  gap:'8px',
                  alignItems:'center'
                }}
              >
                <FileDownloadOutlinedIcon
                  sx={{
                    width:22,
                    height:22,
                    color:'#969696'
                  }}
                />
                {t('supply-chain-status-report')}
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        <Grid2 container mt={2} display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={2}>
          <Box flex={1} display={'flex'} alignItems={'center'} gap={2}>
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth sx={{
                display:'flex',
                flexDirection:'row',
                alignItems:'center',
                gap:'5px'

              }}>
                <Typography>{i18n.t('sort-by')}</Typography>
                <Select
                  value={sortValue}
                  data-testid="supply-chain-sort-select"
                  onChange={(event) => {
                    const selectedSort = event.target.value;
                    setSortValue(selectedSort);

                    let newOrder
                    let newDesc

                    newOrder = 'company';
                    newDesc = selectedSort === 'desc' ? 0 : 1;
                    if(selectedSort === 'new'){
                      newOrder = '';
                      newDesc = 1;
                    }
                    if(selectedSort === 'old'){
                      newOrder = '';
                      newDesc = 0;
                    }

                    setOrder(newOrder);
                    setDesc(newDesc);
                  }}
                  displayEmpty
                  sx={{flex:1}}
                >
                  <MenuItem value="desc">{t('sc-company-az')}</MenuItem>
                  <MenuItem value="asc">{t('sc-company-za')}</MenuItem>
                  <MenuItem value="new">{t('sc-company-new-first')}</MenuItem>
                  <MenuItem value="old">{t('sc-company-old-first')}</MenuItem>
                </Select>
              </FormControl>
            </Grid2>

            {/* filter button */}
            <Button
              id="btn-filter"
              data-testid="supply-chain-filter-button"
              variant='outlined'
              onClick={()=>setIsFilterEnabled(!isFilterEnabled)}
            >
                <FilterAltOutlinedIcon fontSize='medium' sx={{
                  marginTop:'5px',
                }} /> <Typography fontWeight={600} >{t('Filters')} {(selectedActivationStatus.length > 0 ||
                  selectedPqqStatus.length > 0 ||
                  selectedTradeType.length > 0 ||
                  selectedLocation.length > 0) && (<CircleIcon fontSize='small' sx={{ color: '#4cc0ad', fontSize: '12px',marginLeft:'10px' }} />)}</Typography>

            </Button>
            {(selectedActivationStatus.length > 0 ||
              selectedPqqStatus.length > 0 ||
              selectedTradeType.length > 0 ||
              selectedLocation.length > 0) && (
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  data-testid="supply-chain-clear-filters-button"
                  onClick={() => {
                    setSelectedActivationStatus([]);
                    setSelectedPqqStatus([]);
                    setSelectedTradeType([]);
                    setSelectedLocation([]);
                  }}
                >
                  {t('clear-all-filters')}
                </Button>
              </Box>
            )}
          </Box>
          <Typography fontWeight={600} data-testid="supply-chain-results-count">{total} results</Typography>
        </Grid2>

        {
          isFilterEnabled && (
            <Box className='filters-container' data-testid="supply-chain-filters-container" sx={{ mt: 4 }}>
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <MultiSelectFilter
                    label="Activation Status"
                    options={activationStatus}
                    selectedValues={selectedActivationStatus}
                    setSelectedValues={setSelectedActivationStatus}
                    placeholder="All"
                    data-testid="supply-chain-filter-activation-status"
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <MultiSelectFilter
                    label="PQQ Status"
                    options={pqqStatus}
                    selectedValues={selectedPqqStatus}
                    setSelectedValues={setSelectedPqqStatus}
                    placeholder="All"
                    data-testid="supply-chain-filter-pqq-status"
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <MultiSelectFilter
                    label="Trade Type"
                    options={trades}
                    selectedValues={selectedTradeType}
                    setSelectedValues={setSelectedTradeType}
                    placeholder="All"
                    data-testid="supply-chain-filter-trade-type"
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <MultiSelectFilter
                    label="Location"
                    options={regions}
                    selectedValues={selectedLocation}
                    setSelectedValues={setSelectedLocation}
                    placeholder="All locations"
                    data-testid="supply-chain-filter-location"
                  />
                </Grid2>
              </Grid2>
            </Box>
          )
        }
      </Box>

  const skeletonLoader = (
    <div>
      <Skeleton
        variant="rectangular"
        width={300}
        height={40}
        style={{ marginBottom: 20 }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={60}
        style={{ marginBottom: 10 }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={60}
        style={{ marginBottom: 10 }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={60}
        style={{ marginBottom: 10 }}
      />
    </div>
  );

  const content = (
    <Container
      term={term}
      contractors={contractors}
      addData={addData}
      editData={editData}
      removeData={removeData}
      regions={regions}
      trades={trades}
      total={total}
      paginationRowsPerPage={paginationRowsPerPage}
      setPaginationRowsPerPage={setPaginationRowsPerPage}
      setOffset={setOffset}
      order={order}
      statuses={statuses}
      setOrder={setOrder}
      desc={desc}
      setDesc={setDesc}
      paginationPage={paginationPage}
      setPaginationPage={setPaginationPage}
      accountData={clinkAccount}
      accountType={accountType}
      loadingContractors={loading}
    />
  );

  const isAssistant = Number(accountType) === 4;
  const options = isAssistant ? null : (
    <Grid2 container spacing={2} justifyContent="end">
      <Grid2>
        <DemoButton type="ifs" />
      </Grid2>
      <Grid2>
        <SubcontractorModal
          addData={addData}
          regions={regions}
          trades={trades}
          accountData={clinkAccount}
          title="Add Subcontractor"
          subtitle="Complete the remaining empty fields"
          showButtonModal={ShowButtonModal}
        />
      </Grid2>
    </Grid2>
  );

  const panelClass =
    !loading && !contractors.length
      ? 'supply-chain__empty supply-chain'
      : 'supply-chain';

  const handleDownload = async (type,filenmame) => {
    try {
      const response = await httpHelperV2({
        url: `account/supply-chain/export?type=${type}`,
        method: 'GET',
        responseType: 'blob',
      });

      // Create download link for Excel file
      const blobUrl = URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filenmame}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      // eslint-disable-next-line no-console
      console.error('Error in Downloading Excel files:', downloadError);
      throw downloadError;
    }
  };





  return (
    <div className="supply-chain-page" data-testid="supply-chain-page">
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && skeletonLoader}
      {!loading && !error && (
        <>
          <Panel className="header-panel" extra={options} />
          <Panel>
            <div className="panel-form">
            <Panel
                className={panelClass}
                header={header}
              >

                {content}
              </Panel>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
};

const Wrapper = ({ dispatch, ...rest }) => {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();

  const [infoModalState, setInfoModalState] = useState({
    open: false,
    titleKey: '',
    messageKey: '',
    selfDeleted: false,
  });

  const infoProps = {
    theme: 'c-link',
    title: t(infoModalState.titleKey),
    message: t(infoModalState.messageKey),
    closeLabel: t('close'),
    disableEscapeKeyDown: true,
    onHidden: () => {
      setInfoModalState({ ...infoModalState, open: false });
      if (infoModalState.selfDeleted) {
        window.location.reload();
        goTo('/login');
      }
    },
  };


  const getTransformedStatuses = (statuses)=>{
    if(statuses.length > 0){
      if(statuses.includes(1) && statuses.includes(0)){
        return ""
      }
      return statuses[0]
    }
    return "";

  }

  const context = useContext('clink');
  const { actions } = context;
  const {
    term,
    order,
    desc,
    paginationRowsPerPage: limit,
    offset,
  } = rest.supplyChain;

  const [filters, setFilters] = useState({
    activated: [],
    pqq_status: [],
    trades: [],
    regions: [],
  });

  const fetchAll = useCallback(() => {
    const objToSend = {
      term,
      order,
      desc,
      limit,
      offset,
      activated: getTransformedStatuses(filters.activated),
      pqq_status: filters.pqq_status.length > 0 ? filters.pqq_status.join(',') : "",
      trades: filters.trades.length > 0 ? filters.trades.join(',') : "",
      regions: filters.regions.length > 0 ? filters.regions.join(',') : "",
    }

    dispatch(actions.fetchAll(objToSend));
  }, [dispatch, actions, term, order, desc, limit, offset, filters.activated.length, filters.pqq_status.length, filters.trades.length, filters.regions.length]);

  const addData = useCallback(
    (data) => {
      dispatch(actions.addData(data))
        .unwrap()
        .then(() => {
          // Show success snackbar when subcontractor is added successfully
          showSnackbar(t('subcontractor-added-to-supply-chain'), 'success');
        })
        .catch((error) => {
          const message = error?.response?.data?.message || error?.message;
          setInfoModalState({
            open: true,
            titleKey: 'error-adding-supply-chain-title',
            messageKey: message,
          });
        });
    },
    [dispatch, actions, showSnackbar, t],
  );

  const editData = useCallback(
    (id, data) => {
      dispatch(actions.editData({ data, params: { id } }));
    },
    [dispatch, actions],
  );

  const removeData = useCallback(
    (data) => {
      dispatch(actions.removeData(data));
    },
    [dispatch, actions],
  );

  const setTerm = useCallback(
    (value) => {
      dispatch(actions.setTerm(value));
    },
    [dispatch, actions],
  );

  const setPaginationRowsPerPage = useCallback(
    (value) => {
      dispatch(actions.setPaginationRowsPerPage(value));
    },
    [dispatch, actions],
  );

  const setOffset = useCallback(
    (value) => {
      dispatch(actions.setOffset(value));
    },
    [dispatch, actions],
  );

  const setOrder = useCallback(
    (value) => {
      dispatch(actions.setOrder(value));
    },
    [dispatch, actions],
  );

  const setDesc = useCallback(
    (value) => {
      dispatch(actions.setDesc(value));
    },
    [dispatch, actions],
  );

  const setPaginationPage = useCallback(
    (value) => {
      dispatch(actions.setPaginationPage(value));
    },
    [dispatch, actions],
  );

  useEffect(() => {
    dispatch(actions.resetProject());
    dispatch(actions.resetQuotesTender());
    dispatch(actions.restartOrders());
    dispatch(actions.restartProcurement());
    dispatch(actions.setBreadcrumbs([]));
    dispatch(actions.setProjectName(false));
    dispatch(actions.setSlug(false));
  }, [actions, dispatch]);

  useEffect(() => {
    fetchAll();
  }, [actions, dispatch, fetchAll]);

  useEffect(() => {
    if (rest?.clinkAccount?.id) {
      dispatch(actions.getPrequalificationStatuses(rest?.clinkAccount?.id));
      dispatch(actions.fetchAttrRegions());
      dispatch(actions.fetchAttrTrades(rest?.clinkAccount?.id));
    }
  }, [rest?.clinkAccount?.id, actions, dispatch]);

  const { attributes } = rest;
  const { regions, trades } = attributes;
  const regionsFiltered = useMemo(() => dedupeAttributeOptions(regions), [regions]);
  const tradesFiltered = useMemo(() => dedupeAttributeOptions(trades), [trades]);

  return (
    <>
      <SupplyChain
        {...rest}
        addData={addData}
        editData={editData}
        removeData={removeData}
        setTerm={setTerm}
        setPaginationRowsPerPage={setPaginationRowsPerPage}
        setOffset={setOffset}
        setOrder={setOrder}
        setDesc={setDesc}
        setPaginationPage={setPaginationPage}
        setFilters={setFilters}
        regions={regionsFiltered}
        trades={tradesFiltered}
      />

      {infoModalState.open && <InfoModal {...infoProps} />}
    </>
  );
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
  prequalificationV2: state.prequalificationV2,
  supplyChain: state.supplyChain,
  attributes: state.attributes,
});

export default connect(mapStateToProps)(Wrapper);
