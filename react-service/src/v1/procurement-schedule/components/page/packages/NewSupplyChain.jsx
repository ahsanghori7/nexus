import React, { useState, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Add from '@mui/icons-material/Add';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import { ThemeProvider } from '@mui/material/styles';
import useTheme from 'v2/apps/shared/components/muiTheme';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import GlobalModal from 'v1/global/components/modal'; // TO REMOVE
import GreenButton from 'v1/global/components/general-ui/Buttons'; // TO REMOVE
import ClinkService from 'v1/global/services/clink'; // TO REMOVE
import { ConfirmAlert } from 'v1/global/components/clink-alert'; // TO REMOVE
import { CONSTANTS } from 'clink-components';
import { InputAdornment } from '@mui/material';
import {
  clinkBlack,
  clinkGreenHover,
  clinkLightGray,
  mutedGray,
} from 'v2/constants/colors';
import { Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const { ruby, white } = CONSTANTS.colors.general;

const ShowButton = ({ handleClick, onClick, content, children }) => {
  return (
    <Button
      data-testid="add-supplier-btn"
      sx={{ margin: '24px 32px' }}
      startIcon={<Add />}
      onClick={handleClick || onClick}
      variant="outlined"
      color="primary"
    >
      {content || children}
    </Button>
  );
};

const optionsError = {
  title: 'Supply Chain Empty',
  message:
    "You don't have any subcontractors that offer this trade in your supply chain." +
    " If you have an external subcontractor that you'd like to add to your supply chain, " +
    'you can add them by visiting the supply chain area in your account.',
  acceptLabel: 'Go to Supply Chain',
  cancelLabel: 'Close',
  handleClick: () =>
    window
      .open(
        `${BASE_URLS.CLINK_APP_HOST}/main-contractor/supply_chain`,
        '_blank',
      )
      .focus(),
};

const NoSupplyButton = ({ content }) => (
  <ConfirmAlert
    Component={ShowButton}
    props={{
      children: content,
    }}
    options={optionsError}
  />
);

const FIRST = 0;

const NewSupplyModal = ({
  service,
  packageId,
  bulkUpdateProjectHistory,
  subcontractor,
  packages,
  supplyChain = [],
  init = () => {},
  addToShortlist,
  shortlistedSubcontractors = [],
}) => {
  const theme = useTheme('clink');
  const [searchSupplier, setSearchSupplier] = useState('');
  const { checkFeature } = useFeatureFlag();
  const { t } = useTranslation();
  const isShortlistedSubcontractorEnabled = checkFeature(
    'SUBCONTRACTOR_LIST_APPROVAL',
  );
  const serviceCopy = cloneDeep(service);
  const filterIds = ClinkService.transformToArray(subcontractor).map((sub) =>
    Number(sub.sub_id),
  );
  const shortlistedIds = (
    Array.isArray(shortlistedSubcontractors) ? shortlistedSubcontractors : []
  ).map((sub) => Number(sub.subcontractor_id));

  const filterCurrentChain = supplyChain.filter(
    (sub) =>
      sub?.id &&
      !filterIds.includes(Number(sub.id)) &&
      !shortlistedIds.includes(Number(sub.id)),
  );
  const filteredCurrentTrade = filterCurrentChain.filter(
    (sub) =>
      sub?.trades?.filter((trade) => packages.includes(Number(trade?.id)))
        .length,
  );

  serviceCopy.setOptions(filteredCurrentTrade);
  const formFields = serviceCopy.formFields;
  const ShowButtonModal = isEmpty(formFields[FIRST].options)
    ? NoSupplyButton
    : ShowButton;

  const [selectedSubcontractors, setSelectedSubcontractors] = useState([]);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (selectedSubcontractors?.length > 0) {
      setDisabled(false);
    }
  }, [selectedSubcontractors]);

  const selectedValues = selectedSubcontractors.map(
    (selectedOption) => selectedOption.value,
  );

  const filteredOptions = formFields[0].options
    .filter((option) => !shortlistedIds.includes(Number(option.value)))
    .sort((a, b) => a.label && a.label.localeCompare(b.label));

  const handleSubmit = async (e, setShow) => {
    e.preventDefault();
    setDisabled(true);

    if (isShortlistedSubcontractorEnabled && addToShortlist) {
      const account_ids = selectedSubcontractors.map((sub) => sub?.id);
      await addToShortlist({ account_ids }, packageId);
    } else {
      // Original behavior: add directly to supply chain
      const data = { supplyChain: selectedSubcontractors };
      await bulkUpdateProjectHistory(data, null, packageId);
    }

    setShow(false);
    setSelectedSubcontractors([]);
    init();
  };

  return (
    <GlobalModal
      title="Add Supply Chain"
      subtitle="Add a subcontractor from your supply chain."
      buttonContent="Add Supplier"
      className="enquiry-generator-modal"
      dialogClassName="enquiry-generator-modal-dialog"
      ShowButton={ShowButtonModal}
      render={(props) => {
        const { setShow } = props;
        const closeModal = () => setShow(false);
        const CloseButton = () => (
          <Button
            type="button"
            data-testid="supply-chain-modal-go-back"
            onClick={closeModal}
            variant="outlined"
            sx={{
              color: ruby,
              backgroundColor: white,
              border: `1px solid ${ruby}`,
              borderRadius: 1,
              mr: 1,
            }}
          >
            Go Back
          </Button>
        );

        const searchFilteredOptions = filteredOptions.filter((option) =>
          option.label?.toLowerCase().includes(searchSupplier.toLowerCase()),
        );

        const isAllSelected =
          searchFilteredOptions.length > 0 &&
          searchFilteredOptions.every((option) =>
            selectedValues.includes(option.value),
          );

        const handleToggle = (option) => {
          const isSelected = selectedValues.includes(option.value);
          let newSelected;
          if (isSelected) {
            newSelected = selectedSubcontractors.filter(
              (sub) => sub.value !== option.value,
            );
          } else {
            newSelected = [...selectedSubcontractors, option].sort((a, b) =>
              a.label.localeCompare(b.label),
            );
          }
          setSelectedSubcontractors(newSelected);
        };

        const handleSelectAll = () => {
          if (isAllSelected) {
            const filteredValues = searchFilteredOptions.map(
              (option) => option.value,
            );
            setSelectedSubcontractors((prev) =>
              prev.filter(
                (subContractor) =>
                  !filteredValues.includes(subContractor.value),
              ),
            );
          } else {
            const newOptions = searchFilteredOptions.filter(
              (option) => !selectedValues.includes(option.value),
            );
            setSelectedSubcontractors((prev) =>
              [...prev, ...newOptions].sort((a, b) =>
                a.label.localeCompare(b.label),
              ),
            );
          }
        };

        return (
          <form onSubmit={(e) => handleSubmit(e, setShow)}>
            <ThemeProvider theme={theme}>
              <Box>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('search-suppliers')}
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  slotProps={{ htmlInput: { 'data-testid': 'supply-chain-modal-search-input' } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <TableContainer
                  sx={{
                    maxHeight: '350px',
                    border: `1px solid ${clinkLightGray}`,
                    borderRadius: 1,
                    mt: 3,
                  }}
                >
                  <Table size="small" aria-label="supply chain table">
                    <TableHead>
                      {searchFilteredOptions.length === 0 && searchSupplier ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            sx={{
                              textAlign: 'center',
                              color: mutedGray,
                              py: 2,
                              background: clinkLightGray + '4D',
                              border: 'none',
                            }}
                          >
                            <Box
                              component={'div'}
                              sx={{
                                fontSize: '16px',
                                fontWeight: '500',
                                mb: 1,
                              }}
                            >
                              {t('no-suppliers-found')}
                            </Box>
                            {t('couldnot-find-suppliers-matching')}
                            <strong>&quot;{searchSupplier}&quot;.</strong>
                            {t('try-different')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell
                            padding="checkbox"
                            sx={{ background: clinkLightGray + '4D' }}
                          >
                            <Checkbox
                              data-testid="supply-chain-modal-select-all"
                              checked={isAllSelected}
                              indeterminate={
                                !isAllSelected &&
                                searchFilteredOptions.some((option) =>
                                  selectedValues.includes(option.value),
                                )
                              }
                              onChange={handleSelectAll}
                              sx={{
                                color: clinkLightGray,
                                '&.Mui-checked': {
                                  color: clinkLightGray,
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell
                            colSpan={2}
                            sx={{
                              background: clinkLightGray + '4D',
                            }}
                          >
                            {t('select-all')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {searchFilteredOptions.map((option) => {
                        const isSelected = selectedValues.includes(
                          option.value,
                        );
                        const initial = option.label
                          ? option.label.charAt(0).toUpperCase()
                          : '?';
                        return (
                          <TableRow
                            key={option.value}
                            data-testid={`supply-chain-modal-row-${option.value}`}
                            hover
                            onClick={() => handleToggle(option)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: white,
                              '&:nth-of-type(odd)': { backgroundColor: white },
                              '&:nth-of-type(even)': { backgroundColor: white },
                              '&:nth-of-type(odd):hover': {
                                backgroundColor: clinkGreenHover + '1D',
                              },
                              '&:nth-of-type(even):hover': {
                                backgroundColor: clinkGreenHover + '1D',
                              },
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                data-testid={`supply-chain-modal-checkbox-${option.value}`}
                                checked={isSelected}
                                sx={{ color: clinkLightGray }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{ py: 1, width: 40, paddingRight: 0 }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: clinkLightGray,
                                  color: clinkBlack,
                                  fontSize: '14px',
                                }}
                              >
                                {initial}
                              </Avatar>
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>{option.label}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box
                sx={{
                  mt: 3,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  '& .green-button': { borderRadius: 1 },
                }}
              >
                <CloseButton />
                <GreenButton
                  className="green-button"
                  data-testid="supply-chain-modal-add-button"
                  type="submit"
                  disabled={disabled}
                  label={t('add')}
                />
              </Box>
            </ThemeProvider>
          </form>
        );
      }}
    />
  );
};

export default NewSupplyModal;
