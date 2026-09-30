import { useState, useEffect, useRef } from 'react';
import setNameErrorMessage, { USER_TYPING_DELAY } from './errorHelper';
import SupplyChainService from '../../../../../services';

const service = new SupplyChainService();
const FindSubcontractorHooks = () => {
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

  const initialRenderName = useRef(true);
  const initialRenderReg = useRef(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (initialRenderName.current) {
        initialRenderName.current = false;
      } else if (nameFocused) {
        setLoading(true);
        setNameError('');
        if (nameSearch && nameSearch.trim()) {
          service
            .searchByName({name:nameSearch})
            .then((result) => {
              if (result.found) {
                setNameOptions(result.companies || []);
              } else {
                setNameError(result.found ? '' : 'not_found');
              }
              setRegError('');
              setCompanyFound(result.found);
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
              setNameError('error');
              setCompanyFound(false);
            });
        } else {
          setRegSearch('');
          setLoading(false);
        }
      }
    }, USER_TYPING_DELAY);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (initialRenderReg.current) {
        initialRenderReg.current = false;
      } else if (regFocused) {
        setLoading(true);
        setRegError('');
        if (regSearch && regSearch.trim()) {
          service
            .searchByNumber(regSearch)
            .then((result) => {
              if (result.found) {
                setNameSearch(result.name);
                setLocalFormData(result);
                setRegError(result.in_supply_chain ? 'in_supply_chain' : '');
              } else {
                setRegError(result.found ? '' : 'not_found');
                setNameSearch('');
              }
              setNameError('');
              setCompanyFound(result.found);
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
              setRegError('error');
              setCompanyFound(false);
            });
        } else {
          setNameSearch('');
          setLoading(false);
        }
      }
    }, USER_TYPING_DELAY);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regSearch]);

  const handleClickOption = (response) => {
    const { found, content, number, in_supply_chain } = response;
    setNameOptions([]);
    if (found) {
      setNameSearch(content);
      setRegSearch(number);
      setLocalFormData(response);
      setNameError(in_supply_chain ? 'in_supply_chain' : '');
    }
  };

  const isDisabled =
    !companyFound ||
    nameError ||
    regError ||
    nameOptions.length ||
    loading ||
    !nameSearch ||
    !regSearch;

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
    initialRenderReg,
  };
};

export default FindSubcontractorHooks;
