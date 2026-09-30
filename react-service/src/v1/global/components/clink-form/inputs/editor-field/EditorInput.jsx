import React, { forwardRef } from 'react';
import ReactDomServer from 'react-dom/server';
import FormLabel from 'react-bootstrap/FormLabel';
import { Field } from 'formik';
import FieldError from '../../FieldError';
import FieldHolder from '../../FieldHolder';
import EditorV2 from 'v2/apps/shared/components/editor';
import Editor from '../editor';
import Loading from '../../../Loading';
import getContent from '../../../../../document-creator/services/document-builder/getContent';
import Config from '../../../../../document-creator/helpers/config';

const EditorInput = forwardRef((props, ref) => {
  const {
    name,
    className = '',
    type,
    label = null,
    placeholder = '',
    required = false,
    handleChange = null,
    handleBlur = null,
    handleFocus = null,
    setFieldValue,
    value,
    validationFieldSchema = {},
    children,
    attachment = true,
    bullet = true,
    ordered = true,
    docCreator = false,
    error = null,
    loading = null,
    triggerCustomErrors = false,
    testId = undefined,
  } = props;

  return (
    <Field name={name} validate={validationFieldSchema[name]}>
      {({ field, form }) => {
        const { ...rest } = field;
        let content = '';
        if (typeof value === 'object' && 'editorHtml' in value) {
          const { editorHtml } = value;
          content = editorHtml;
        } else {
          content = value || '';
        }

        // we check if we have full brackets
        if (Config.hasHtmlCode(content)) {
          content = ReactDomServer.renderToStaticMarkup(getContent(content));
        }
        const newValue = {
          ...value,
          editorHtml: content,
        };
        const input = {
          ...rest,
          type,
          value: newValue,
          onChange: handleChange || field.onChange,
          onBlur: handleBlur || (() => null),
          onFocus: handleFocus || field.onFocus,
        };
        return (
          <FieldHolder className={className} data-testid={testId}>
            <FormLabel htmlFor={field.name}>
              {children} {label} {required && <div className="required">*</div>}
            </FormLabel>
            {loading && (
              <div className="container-loading" style={{ margin: '20px' }}>
                <Loading />
              </div>
            )}
            {/* TODO: To remove V1 Editor */}
            {!loading && !docCreator && (
              <Editor
                {...input}
                placeholder={placeholder}
                setFieldValue={setFieldValue}
                attachment={attachment}
                bullet={bullet}
                ordered={ordered}
                docCreator={docCreator}
                docCreatorLoading={loading}
              />
            )}
            {!loading && docCreator && (
              <EditorV2 ref={ref} defaultValue={content} />
            )}
            {form.errors.description && form.touched.description && (
              <FieldError msg={form.errors.description.editorHtml} />
            )}
            {error && (
              <FieldError
                triggerCustomErrors={triggerCustomErrors}
                name={name}
                customErrors={{ [name]: error }}
              />
            )}
          </FieldHolder>
        );
      }}
    </Field>
  );
});

export default EditorInput;
