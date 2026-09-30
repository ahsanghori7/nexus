import { useState, useEffect } from 'react';

const required = (name) => ({
  [name]: 'Required',
});
const validateEmail = (emailValue) => {
  return String(emailValue)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

const FormSubcontractorHooks = (dataToUpdate, onSubmit = () => null) => {
  const {
    id,
    account_id,
    display_name,
    type,
    // eslint-disable-next-line no-unused-vars
    users = {},
    hasAccount,
    is_non_uk,
    ...rest
  } = dataToUpdate;
  const initialValues = {
    company_name: '',
    reg_number: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    locations: [],
    trades: [],
    ...rest,
  };

  const isNonUk = is_non_uk || false;

  const [loading, setLoading] = useState(false);

  const [company_name, setCompany_name] = useState(initialValues.company_name);
  const [company_nameError, setCompany_nameError] = useState({});
  const [reg_number, setReg_number] = useState(initialValues.reg_number);
  const [reg_numberError, setReg_numberError] = useState({});
  const [firstname, setFirstname] = useState(initialValues.firstname);
  const [firstnameError, setFirstnameError] = useState({});
  const [lastname, setLastname] = useState(initialValues.lastname);
  const [lastnameError, setLastnameError] = useState({});
  const [email, setEmail] = useState(initialValues.email);
  const [emailError, setEmailError] = useState({});
  const [phone, setPhone] = useState(initialValues.phone);
  const [phoneError, setPhoneError] = useState({});
  const [address, setAddress] = useState(initialValues.address);
  const [addressError, setAddressError] = useState({});
  const [locations, setLocations] = useState(initialValues.locations);
  const [locationsError, setLocationsError] = useState({});
  const [trades, setTrades] = useState(initialValues.trades);
  const [tradesError, setTradesError] = useState({});

  // Update state when dataToUpdate changes
  useEffect(() => {
    const fieldSetters = {
      company_name: setCompany_name,
      reg_number: setReg_number,
      firstname: setFirstname,
      lastname: setLastname,
      email: setEmail,
      phone: setPhone,
      address: setAddress,
      locations: setLocations,
      trades: setTrades,
    };

    Object.entries(fieldSetters).forEach(([field, setter]) => {
      if (rest[field] !== undefined) {
        setter(rest[field]);
      }
    });

    // Clear errors for optional fields when non-UK subcontractor
    if (isNonUk) {
      setReg_numberError({});
      setPhoneError({});
    }
  }, [
    rest.company_name,
    rest.reg_number,
    rest.firstname,
    rest.lastname,
    rest.email,
    rest.phone,
    rest.address,
    rest.locations,
    rest.trades,
    isNonUk,
  ]);

  const isDisabled = !hasAccount
    ? !company_name ||
      company_nameError.company_name ||
      !reg_number ||
      reg_numberError.reg_number ||
      !firstname ||
      firstnameError.firstname ||
      !lastname ||
      lastnameError.lastname ||
      !email ||
      emailError.email ||
      !phone ||
      phoneError.phone ||
      !address ||
      addressError.address ||
      !trades.length ||
      tradesError.trades ||
      !locations.length ||
      locationsError.locations ||
      loading
    : !trades.length ||
      tradesError.trades ||
      !locations.length ||
      locationsError.locations ||
      loading;

  const handleSubmit = () => {
    const dataToSubmit = {
      company_name,
      reg_number,
      firstname,
      lastname,
      email,
      phone,
      address,
      trades,
      locations,
      type,
      is_non_uk: isNonUk,
    };
    onSubmit(dataToSubmit);
  };

  const handleInputChange = (event, name, setFunc, setErrorFunc) => {
    const { value } = event.target;
    let error = {};
    if (!value) {
      error = required(name);
    }
    setFunc(value);
    setErrorFunc(error);
  };

  const handleMultipleSelectChange = (data, name, setFunc, setErrorFunc) => {
    let error = false;
    if (!data.length) {
      error = required(name);
    }
    setFunc(data);
    setErrorFunc(error);
  };

  const handleCompanyName = (event) =>
    handleInputChange(
      event,
      'company_name',
      setCompany_name,
      setCompany_nameError,
    );

  const handleRegNumber = (event) => {
    const { value } = event.target;
    let error = {};
    // For non-UK subcontractors, reg_number is optional
    if (!value && !isNonUk) {
      error = required('reg_number');
    }
    setReg_number(value);
    setReg_numberError(error);
  };

  const handleFirstName = (event) =>
    handleInputChange(event, 'firstname', setFirstname, setFirstnameError);
  const handleLastName = (event) =>
    handleInputChange(event, 'lastname', setLastname, setLastnameError);

  const handleEmail = (event) => {
    const { value } = event.target;
    let error = {};
    if (!value) {
      error = required('email');
    }
    setEmail(value);
    if (!validateEmail(value)) {
      error.email = 'Invalid email';
    }
    setEmailError(error);
  };

  const handlePhone = (event) => {
    const { value } = event.target;
    let error = {};
    // For non-UK subcontractors, phone is optional
    if (!value && !isNonUk) {
      error = required('phone');
    }
    setPhone(value);
    setPhoneError(error);
  };

  const handleAddress = (event) =>
    handleInputChange(event, 'address', setAddress, setAddressError);
  const handleLocations = (data) => {
    handleMultipleSelectChange(
      data,
      'locations',
      setLocations,
      setLocationsError,
    );
  };
  const handleTrades = (data) => {
    handleMultipleSelectChange(data, 'trades', setTrades, setTradesError);
  };

  return {
    isDisabled,
    loading,
    setLoading,
    company_name,
    company_nameError,
    handleCompanyName,
    reg_number,
    reg_numberError,
    handleRegNumber,
    firstname,
    firstnameError,
    handleFirstName,
    lastname,
    lastnameError,
    handleLastName,
    email,
    emailError,
    handleEmail,
    phone,
    phoneError,
    handlePhone,
    address,
    addressError,
    handleAddress,
    locations,
    locationsError,
    handleLocations,
    trades,
    tradesError,
    handleTrades,
    handleSubmit,
    hasAccount,
  };
};

export default FormSubcontractorHooks;
