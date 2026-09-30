import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import setNameErrorMessage, { USER_TYPING_DELAY } from './errorHelper';
import SupplyChainService from '../../../../../services';

const service = new SupplyChainService();
const FindSubcontractorHooks = (accountData) => {
  const { id: idCountry = 0 } = accountData?.country || {};
  const [loading, setLoading] = useState(false);

  const [nameSearch, setNameSearch] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameOptions, setNameOptions] = useState([]);
  const [nameFocused, setNameFocused] = useState(false);

  const [regSearch, setRegSearch] = useState('');
  const [regError, setRegError] = useState('');
  const [regFocused, setRegFocused] = useState(false);

  const [companyFound, setCompanyFound] = useState(false);
  const [localFormData, setLocalFormData] = useState({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedNameSearch = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm || !searchTerm.trim() || nameError || regError) {
        return;
      }
      setLoading(true);
      service
        .searchByInternalData(idCountry, { name: searchTerm })
        .then((response) => {
          if (response?.data?.length) {
            const options = response.data.map((item) => {
              const user = item.users ? item.users[0] : {};
              return {
                ...item,
                found: true,
                has_account: true,
                number: item.reg_number,
                in_supply_chain: item.in_supply_chain,
                content: item.name,
                user,
              };
            });
            setNameOptions(options || []);
            // we automatically fill data if there's only one option
            if (
              options.length === 1 &&
              (options[0]?.name || '').toLowerCase() ===
                (searchTerm || '').toLowerCase()
            ) {
              const [company] = options;
              const { name, number, in_supply_chain } = company;
              setNameError(in_supply_chain ? 'in_supply_chain' : '');
              setNameSearch(name);
              setRegSearch(number);
              setLocalFormData(company);
              setNameOptions([]);
            } else {
              // we empty reg number just in case
              setRegSearch('');
              setNameError('');
            }
          } else {
            setLocalFormData({
              company_name: searchTerm,
              reg_number: regSearch,
              has_account: false,
            });
            setNameOptions([]);
            setNameError('');
          }
          setRegError('');
          setCompanyFound(Boolean(response?.data));
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setNameError('error');
          setCompanyFound(false);
        });
    }, USER_TYPING_DELAY),
    [idCountry, nameSearch],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRegSearch = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm || !searchTerm.trim() || nameError) {
        return;
      }
      setLoading(true);
      service
        .searchByInternalData(idCountry, { reg_number: searchTerm })
        .then((response) => {
          if (response?.data?.length) {
            const [company] = response.data;
            const [user] = company.users;
            setRegError(company.in_supply_chain ? 'in_supply_chain' : '');
            setNameSearch(company.name);
            setLocalFormData({ ...company, has_account: true, user });
          } else {
            setLocalFormData({
              company_name: nameSearch,
              reg_number: searchTerm,
              has_account: false,
            });
            setNameOptions([]);
            setRegError('');
          }
          setNameError('');
          setCompanyFound(Boolean(response?.data));
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setRegError('error');
          setCompanyFound(false);
        });
    }, USER_TYPING_DELAY),
    [idCountry, regSearch],
  );

  useEffect(() => {
    debouncedNameSearch(nameSearch);
    return () => {
      debouncedNameSearch.cancel();
    };
  }, [nameSearch, debouncedNameSearch]);

  useEffect(() => {
    debouncedRegSearch(regSearch);
    return () => {
      debouncedRegSearch.cancel();
    };
  }, [regSearch, debouncedRegSearch]);

  const handleClickOption = (response) => {
    const { found, content, number, in_supply_chain } = response;
    setNameOptions([]);
    if (found) {
      setNameError(in_supply_chain ? 'in_supply_chain' : '');
      setNameSearch(content);
      setRegSearch(number);
      setLocalFormData(response);
    }
  };

  const isDisabled =
    nameError || regError || loading || !nameSearch || !regSearch;

  const customNameError = nameError
    ? setNameErrorMessage('company-name', nameError)
    : {};
  const customRegError = regError
    ? setNameErrorMessage('company-reg', regError)
    : {};
  const newNameOptions = companyFound ? nameOptions : [];

  return {
    loading,
    setLoading,
    nameSearch,
    setNameSearch,
    setCompanyFound,
    nameFocused,
    setNameFocused,
    nameError,
    setNameError,
    regSearch,
    setRegSearch,
    regError,
    setRegError,
    regFocused,
    setRegFocused,
    localFormData,
    handleClickOption,
    isDisabled,
    customNameError,
    customRegError,
    newNameOptions,
  };
};

export default FindSubcontractorHooks;
