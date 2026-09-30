import React from 'react';
import Select from 'react-select/async';
import InputGroup from 'react-bootstrap/InputGroup';
import SearchSvg from '../public/images/svg/icon-search.svg';
import FolderSvg from '../public/images/svg/icon-folder.svg';
import File from '../public/images/svg/pdf-icon.svg';
import Tenders from '../../file-manager/helpers/Tenders';

const CustomOption = (props) => {
  const regex = /(?:\.([^.]+))?$/; // check if label has extension
  const { innerProps, data, isFocused, isSelected } = props;
  const { name } = data;
  const ext = regex.exec(name)[1];
  const className = `search-files__option ${
    (isSelected || isFocused) && 'search-files__option--focused'
  }`;
  const icon = ext ? <File /> : <FolderSvg />;
  return (
    <div {...innerProps} className={className}>
      <div className="option-icon">{icon}</div>
      <div className="option-text">{name}</div>
    </div>
  );
};

const Search = ({
  handleChange,
  loadSearchableOptions,
  value,
  placeholder = 'Search for files',
}) => {
  const loadOptions = async (inputValue, callback) => {
    const response = await loadSearchableOptions(inputValue);
    if (response) {
      callback(Tenders.createOptions(response));
    }
  };
  return (
    <InputGroup>
      <InputGroup.Prepend className="search-icon">
        <InputGroup.Text>
          <SearchSvg />
        </InputGroup.Text>
      </InputGroup.Prepend>
      <Select
        isClearable
        placeholder={placeholder}
        className="react-select-container form-control search-files"
        classNamePrefix="react-select"
        onChange={handleChange}
        value={value}
        components={{ Option: CustomOption }}
        defaultOptions={[]}
        loadOptions={loadOptions}
      />
    </InputGroup>
  );
};

export default Search;
