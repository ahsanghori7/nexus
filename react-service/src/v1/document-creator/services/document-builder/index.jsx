import React from 'react';
import includes from 'lodash/includes';
import replace from 'lodash/replace';
import isObject from 'lodash/isObject';
import ContentEditor from 'v1/document-creator/components/template/pdf/content-editor';
import getContent from './getContent';
import {
  Div,
  Img,
  AttendanceCheckbox,
  DeleteButton,
  AddAttendance,
  AttendanceInput,
  MiniboqInput,
  MoneyInput,
  PercentageInput,
} from './components';

// TODO: Move this outside
function getShortcodeContent(shortcodes, elem, content, inputFocused) {
  const focused = includes(elem, `{${inputFocused}}`);
  let newContent = content;
  for (const shortcode in shortcodes) {
    if (includes(elem, `{${shortcode}}`) && shortcodes[shortcode]) {
      newContent = replace(newContent, `{${shortcode}}`, shortcodes[shortcode]);
    }
  }
  return {
    focused,
    content: newContent,
  };
}

class DocumentBuilder {
  constructor(handleConfigChange = null) {
    this._handleConfigChange = handleConfigChange;
    this.formFields = [];
    this.getLastIndex = this.getLastIndex.bind(this);
    this.build = this.build.bind(this);
  }

  get handleConfigChange() {
    return this._handleConfigChange;
  }

  getLastIndex(content) {
    let indexLast = content.indexOf('}');
    let contentToSearch = content;
    // We check if the sentence we're checking has a shortcode or more htmlTags in it
    // so, we make sure we take the one we desire
    const nextBracket = content.indexOf('{', indexLast);
    if (nextBracket !== -1) {
      contentToSearch = content.substring(0, nextBracket);
    }
    // While we don't get the last close bracket, we continue finding it
    while (contentToSearch.includes('}', indexLast + 1)) {
      indexLast = contentToSearch.indexOf('}', indexLast + 1);
    }

    return indexLast;
  }

  build(
    // eslint-disable-next-line default-param-last
    config = [],
    shortcodes,
    inputFocused,
    inputRef,
    vat,
    formValues = {},
    handleUpdateAttendance = () => null,
    handleLocalMiniBoq = () => null,
    handleUpdateVat = () => null,
    level = 0,
    levelId = 'level.0',
    editable = true,
    parentContext = {},
  ) {
    const nextLevel = level + 1;
    return config.map((elem, index) => {
      let nextParentContext = parentContext;

      if (elem?.type === 'table') {
        nextParentContext = {
          ...parentContext,
          isNd112Table: (elem?.children || []).some((row) =>
            row?.children?.some((col) =>
              (col?.children || []).includes('{b:Item}'),
            ),
          ),
        };
      }

      if (
        elem?.type === 'row' &&
        elem?.props?.className?.includes('preliminaries') &&
        nextParentContext.isNd112Table &&
        !(elem?.children || []).some((col) =>
          (col?.children || []).includes('{b:Item}'),
        )
      ) {
        nextParentContext = { ...nextParentContext, isNd112DataRowParent: true };
      }

      const uniqueKey = `${levelId}-item.${index}`;

      const props = { ...(elem?.props || {}) };
      let Component = elem?.name === 'image' ? Img : Div;
      const isCheckbox = elem?.name === 'attendance-checkbox';
      const isButtonRemoveAttendance = elem?.name === 'delete-button';
      const isButtonAddAttendance = elem?.name === 'add-attendance';
      const isButtonAddAttendanceSection = elem?.name === 'add-section';
      const isAttendanceInput = elem?.name === 'attendance-input';
      const isMoneyInput = elem?.name === 'money-input';
      const isMiniBoqInput = elem?.name === 'miniboq-input';
      const isPercentageInput = elem?.name === 'percentage-input';
      Component = isCheckbox ? AttendanceCheckbox : Component;
      Component = isButtonRemoveAttendance ? DeleteButton : Component;
      Component =
        isButtonAddAttendance || isButtonAddAttendanceSection
          ? AddAttendance
          : Component;
      Component = isAttendanceInput ? AttendanceInput : Component;
      Component = isMiniBoqInput ? MiniboqInput : Component;
      Component = isMoneyInput ? MoneyInput : Component;
      Component = isPercentageInput ? PercentageInput : Component;
      const hasChildren = elem?.children?.length && !React.isValidElement(elem);

      const isNd112TotalCell =
        parentContext.isNd112TotalColumn ||
        (parentContext.isNd112DataRowParent &&
          index === 5 &&
          typeof elem === 'string');

      let content = !hasChildren && elem;
      let inputHasFocus = false;
      let disableInlineEdit = false;
      let tooltipLabel = '';
      if (
        !hasChildren &&
        !isCheckbox &&
        !isButtonRemoveAttendance &&
        !isButtonAddAttendance &&
        !isButtonAddAttendanceSection &&
        !isAttendanceInput
      ) {
        if (typeof elem === 'string') {
          const managedFieldKey = Object.keys(formValues).find(
            (key) =>
              isObject(formValues[key]) &&
              'editorHtml' in formValues[key] &&
              elem.includes(`{${key}}`),
          );
          if (managedFieldKey) {
            disableInlineEdit = true;
            tooltipLabel =
              this.formFields.find((field) => field.name === managedFieldKey)
                ?.tooltipLabel || '';
          }
        }
        const contentChanged = getShortcodeContent(
          shortcodes,
          elem,
          content,
          inputFocused,
        );
        inputHasFocus = contentChanged?.focused;
        content = contentChanged?.content;
        content = getContent(content);
      }

      if (isNd112TotalCell && content) {
        const isEmptyTotal = [].concat(content).every(
          (item) =>
            !item ||
            item === '\u00A0' ||
            item === '{br}' ||
            (typeof item === 'object' && item?.type === 'br'),
        );
        if (isEmptyTotal) content = ['\u00A0'];
      }

      let newHandleConfigChange = () => null;
      if (this.handleConfigChange) {
        newHandleConfigChange = (value) =>
          this.handleConfigChange(value, uniqueKey);
      }

      const isEditable = props?.editable || editable;
      const newProps = { ...props };
      delete newProps.editable;

      let newClasses = props?.className ?? '';
      if (inputHasFocus) {
        newClasses = `${newClasses} focused`;
      }

      if (elem?.changed) {
        newClasses = `${newClasses} content-changed`;
      }

      if (elem?.name === 'page' && 'conditionalContent' in elem) {
        const shortcode = elem?.conditionalContent;
        const keyShortcode = shortcode.replace(/[{}]/g, '');
        if (formValues[keyShortcode]) {
          const { value: valConditionalContent } = formValues[keyShortcode];
          const valval = isObject(valConditionalContent)
            ? valConditionalContent?.value
            : valConditionalContent;
          newClasses = Boolean(valval)
            ? `${newClasses} hide-number-document`
            : newClasses;
        } else {
          newClasses = `${newClasses} hide-number-document`;
        }
      }

      if (newClasses) {
        newProps.className = newClasses;
      }

      if (
        isCheckbox ||
        isButtonAddAttendance ||
        isButtonAddAttendanceSection ||
        isAttendanceInput ||
        isButtonRemoveAttendance
      ) {
        newProps.handleUpdateAttendance = handleUpdateAttendance;
      }
      if (isMiniBoqInput || isMoneyInput) {
        newProps.handleLocalMiniBoq = handleLocalMiniBoq;
      }
      if (isPercentageInput) {
        newProps.value = vat;
        newProps.onChange = handleUpdateVat;
      }

      if (isButtonAddAttendanceSection) {
        newProps.section = true;
      }

      return (
        <Component
          {...newProps}
          key={uniqueKey}
          uniqueKey={uniqueKey}
          style={elem?.style || {}}
          inputRef={(inputHasFocus && inputRef) || {}}
        >
          {content && (
            <ContentEditor
              key={`${uniqueKey}-content-editor`}
              uniqueKey={`${uniqueKey}-content-editor`}
              content={content}
              handleConfigChange={newHandleConfigChange}
              editable={isEditable}
              disableInlineEdit={disableInlineEdit}
              tooltipLabel={tooltipLabel}
            />
          )}
          {hasChildren &&
            this.build(
              elem?.children || [],
              shortcodes,
              inputFocused,
              inputRef,
              vat,
              formValues,
              handleUpdateAttendance,
              handleLocalMiniBoq,
              handleUpdateVat,
              nextLevel,
              `${uniqueKey}-level.${nextLevel}`,
              isEditable,
              parentContext.isNd112DataRowParent && index === 5 && elem?.type === 'column'
                ? { ...nextParentContext, isNd112TotalColumn: true }
                : nextParentContext,
            )}
        </Component>
      );
    });
  }
}

export default DocumentBuilder;
