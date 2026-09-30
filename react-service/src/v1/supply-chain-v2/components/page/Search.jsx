import React, { useEffect, useState, useRef } from 'react';
import { Searchbox } from 'clink-components';

const Search = ({ placeholder = '', setTerm, term = '' }) => {
  const [searchTerm, setSearchTerm] = useState(term);
  const firstRun = useRef(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const input = wrapperRef.current?.querySelector('input');
    if (input) {
      input.setAttribute('data-testid', 'supply-chain-search-input');
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (firstRun.current) {
        firstRun.current = false;
        if (!searchTerm.trim()) return;
      }

      if (setTerm) {
        setTerm(searchTerm.trim());
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const searchbox = {
    showIcon: true,
    name: 'search',
    theme: 'c-link',
    value: searchTerm,
    placeholder,
    handleChange: (event) => setSearchTerm(event.target.value),
    styles:{width: '30rem'}
  };
  return (
    <div ref={wrapperRef} className="sector-title mb-0 sc-search-box" style={searchbox.styles} data-testid="supply-chain-search">
      <Searchbox {...searchbox} />
    </div>
  );
};

export default Search;
