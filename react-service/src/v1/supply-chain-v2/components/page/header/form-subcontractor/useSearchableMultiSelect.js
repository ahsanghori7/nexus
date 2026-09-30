import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  filterOptionsBySearch,
  isClickInsideAutocomplete,
  tagOrderingHandler,
} from './autocomplete-shared';

const useSearchableMultiSelect = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const containerRef = useRef(null);
  const stableOptionsRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    stableOptionsRef.current = null;
  }, []);

  const setOpenState = useCallback((nextOpen) => {
    if (nextOpen) {
      stableOptionsRef.current = filterOptionsBySearch(options, '', value);
      setOpen(true);
      return;
    }
    close();
  }, [options, value, close]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      if (!isClickInsideAutocomplete(event.target, containerRef)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, close]);

  const filteredOptions = useMemo(() => {
    if (search) {
      return filterOptionsBySearch(options, search, value);
    }
    if (open && stableOptionsRef.current) {
      return stableOptionsRef.current;
    }
    return filterOptionsBySearch(options, '', value);
  }, [options, search, value, open]);

  return {
    open,
    setOpen: setOpenState,
    search,
    setSearch,
    searchRef,
    containerRef,
    close,
    filteredOptions,
    handleChange: tagOrderingHandler(value, onChange),
  };
};

export default useSearchableMultiSelect;
