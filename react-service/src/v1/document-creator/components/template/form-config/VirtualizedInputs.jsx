import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { VariableSizeList } from 'react-window';
import FieldRenderer from 'v1/global/components/clink-form/inputs/FieldRenderer';

const DEFAULT_VIEWPORT_HEIGHT = 950;
const DEFAULT_FIELD_HEIGHT = 96;
const OVERSCAN_COUNT = 6;
const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"])',
  'textarea',
  'button',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const getEstimatedFieldHeight = (field = {}) => {
  if (field.type === 'dropzone') return 220;
  if (field.type === 'multi-dropzone') return 280;
  if (field.type === 'pdf') return 180;
  if (field.type === 'editor') return 96;
  if (field.type === 'textarea') return 132;
  if (field.type === 'money') return 112;
  if (field.type === 'filemanager' || field.type === 'reference') return 104;
  if (field.calendar || field.as === 'select') return 104;
  return DEFAULT_FIELD_HEIGHT;
};

const VirtualizedRow = ({ data, index, style }) => {
  const {
    formFields,
    setRowHeight,
    focusTargetName,
    clearFocusTarget,
    ...fieldRendererProps
  } = data;
  const field = formFields[index];
  const rowRef = useRef(null);

  useLayoutEffect(() => {
    const element = rowRef.current;
    if (!element || !field?.name) return undefined;

    const updateHeight = () => {
      const nextHeight = Math.ceil(element.getBoundingClientRect().height);
      if (nextHeight) {
        setRowHeight(field.name, index, nextHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [field?.name, index, setRowHeight]);

  useEffect(() => {
    if (focusTargetName !== field?.name) return undefined;

    const element = rowRef.current;
    if (!element) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const focusableElement = element.querySelector(FOCUSABLE_SELECTOR);
      if (focusableElement?.focus) {
        focusableElement.focus();
      }
      clearFocusTarget(field.name);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [clearFocusTarget, field?.name, focusTargetName]);

  return (
    <div style={style}>
      <div
        className="pdf-edit-form__virtual-row"
        ref={rowRef}
        data-testid={field?.testId}
      >
        <FieldRenderer field={field} {...fieldRendererProps} />
      </div>
    </div>
  );
};

const VirtualizedInputs = forwardRef((props, ref) => {
  const { formFields, formViewerRef, ...fieldRendererProps } = props;
  const listRef = useRef(null);
  const viewportRef = useRef(null);
  const rowHeightsRef = useRef({});
  const [focusTargetName, setFocusTargetName] = useState(null);
  const [viewportSize, setViewportSize] = useState({
    height: DEFAULT_VIEWPORT_HEIGHT,
    width: '100%',
  });

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const { height, width } = element.getBoundingClientRect();
      setViewportSize({
        height: height || DEFAULT_VIEWPORT_HEIGHT,
        width: width || '100%',
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const fieldNames = new Set(formFields.map((field) => field.name));
    Object.keys(rowHeightsRef.current).forEach((fieldName) => {
      if (!fieldNames.has(fieldName)) {
        delete rowHeightsRef.current[fieldName];
      }
    });
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [formFields]);

  const setRowHeight = useCallback(
    (fieldName, index, height) => {
      const estimatedHeight = getEstimatedFieldHeight(formFields[index]);
      const nextHeight = Math.max(height, estimatedHeight);
      if (rowHeightsRef.current[fieldName] === nextHeight) return;
      rowHeightsRef.current[fieldName] = nextHeight;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    },
    [formFields],
  );

  const clearFocusTarget = useCallback((fieldName) => {
    setFocusTargetName((currentFieldName) =>
      currentFieldName === fieldName ? null : currentFieldName,
    );
  }, []);

  const getFieldIndex = useCallback(
    (fieldName) =>
      formFields.findIndex((field) => field.name === fieldName),
    [formFields],
  );

  const scrollToField = useCallback(
    (fieldName, align = 'smart') => {
      const fieldIndex = getFieldIndex(fieldName);
      if (fieldIndex < 0 || !listRef.current) return false;
      listRef.current.scrollToItem(fieldIndex, align);
      return true;
    },
    [getFieldIndex],
  );

  const focusField = useCallback(
    (fieldName, align = 'smart') => {
      const didScroll = scrollToField(fieldName, align);
      setFocusTargetName(didScroll ? fieldName : null);
      return didScroll;
    },
    [scrollToField],
  );

  const getItemSize = useCallback(
    (index) => {
      const field = formFields[index];
      if (!field) return DEFAULT_FIELD_HEIGHT;
      return (
        rowHeightsRef.current[field.name] || getEstimatedFieldHeight(field)
      );
    },
    [formFields],
  );

  useImperativeHandle(
    ref,
    () => ({
      focusField,
      scrollToField,
    }),
    [focusField, scrollToField],
  );

  const itemData = {
    ...fieldRendererProps,
    clearFocusTarget,
    focusTargetName,
    formFields,
    setRowHeight,
  };

  if (!formFields.length) {
    return null;
  }

  return (
    <div className="pdf-edit-form__virtual-body" ref={viewportRef}>
      <VariableSizeList
        className="pdf-edit-form__virtual-list"
        height={viewportSize.height}
        itemCount={formFields.length}
        itemData={itemData}
        itemKey={(index) =>
          formFields[index]?.key || formFields[index]?.name || index
        }
        itemSize={getItemSize}
        outerRef={formViewerRef}
        overscanCount={OVERSCAN_COUNT}
        ref={listRef}
        width={viewportSize.width}
      >
        {VirtualizedRow}
      </VariableSizeList>
    </div>
  );
});

VirtualizedInputs.displayName = 'VirtualizedInputs';

export default VirtualizedInputs;
