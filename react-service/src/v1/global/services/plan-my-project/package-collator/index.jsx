import { getTypeLabel } from 'v1/global/helpers/data';
import CategoriesService from 'v1/global/services/documents/Categories';
import defaultConfig from './config';

const DOCUMENT_FORM_DATA_ID = 0;
class PackageCollator extends CategoriesService {
  constructor(projectData, config = defaultConfig) {
    super(projectData, config);
    this.initializeHandleDropzone = this.initializeHandleDropzone.bind(this);
    this.editProjectInitialize = this.editProjectInitialize.bind(this);
    this.setDropzone = this.setDropzone.bind(this);
    this.editProjectSetDropzone = this.editProjectSetDropzone.bind(this);
    this.handleDeleteCategory = this.handleDeleteCategory.bind(this);
    this.editProjectRemoveDropzone = this.editProjectRemoveDropzone.bind(this);
  }

  async initializeHandleDropzone(
    categories = [],
    documents = this.formFields[DOCUMENT_FORM_DATA_ID],
    cb = this.editProjectInitialize,
  ) {
    let dropzoneData = [];
    let dropzoneValues = {};
    if (categories && !categories.error) {
      dropzoneValues = [];
      const catArray = Object.values(categories);
      dropzoneData = catArray.map((category) => {
        const catName = category.label.toLowerCase().split(' ').join('-');
        dropzoneValues[catName] = category.documents.map((doc) => {
          const fileType = doc.name.split('.').pop();
          const file = new File(['foo'], doc.name, {
            type: getTypeLabel(fileType),
          });
          return {
            file,
            error: false,
            id: doc.id,
          };
        });
        return {
          label: category.label,
          name: catName,
          key: category.id,
          catArray,
        };
      });
    }
    cb(documents, dropzoneValues, dropzoneData);
  }

  editProjectInitialize(documents, dropzoneValues, dropzoneData) {
    this.initialValues = {
      documents: dropzoneValues,
    };
    this.formFields = [
      {
        ...documents,
        values: dropzoneData,
        handleSetDropzone: this.setDropzone,
        handleDeleteCategory: this.handleDeleteCategory,
      },
    ];
  }

  setDropzone(label, callback, resolve = this.editProjectSetDropzone) {
    return this.createCategory(label).then((response) => {
      resolve(response, label);
      const errorMessage =
        response && !response.success ? response.message || '' : '';
      if (errorMessage === 'already_exists') {
        this.alert(response, null, null, {
          title: 'Error',
          message: 'Category name already exists',
          type: 'error',
        });
      } else {
        this.alert(response);
      }
      callback();
      return response.success;
    });
  }

  editProjectSetDropzone(response, label) {

    if (response && response.success) {
      const [documents] = this.formFields;
      const categoryName = label.toLowerCase().split(' ').join('-');

      // Create the base new category object
    const newCategory = {
      label,
      name: categoryName,
      key: response.id,
    };

    // If documents.values exists and has items, use the first item's catArray
    // Otherwise, create a new catArray with just this new category
    if (documents?.values?.length > 0) {
      // Clone the existing catArray from first item (if it exists)
      const existingCatArray = documents?.values[0]?.catArray || [];

      // Add the new category to catArray
      newCategory.catArray = [
        ...existingCatArray,
        {
          id: response.id,
          label,
          entity_id: response.entity_id || 0,
          entity_type: response.entity_type || "project",
          parent_id: response.parent_id || 0,
          documents: []
        }
      ];
    } else {
      // First item - create new catArray
      newCategory.catArray = [
        {
          id: response.id,
          label,
          entity_id: response.entity_id || 0,
          entity_type: response.entity_type || "project",
          parent_id: response.parent_id || 0,
          documents: []
        }
      ];
    }
      this.formFields = [
        {
          ...documents,
          handleSetDropzone: this.setDropzone,
          values: [...documents.values, newCategory],
        },
      ];
    }
  }

  handleDeleteCategory(
    categoryId,
    label,
    callback,
    resolve = this.editProjectRemoveDropzone,
  ) {
    return this.deleteCategory(categoryId).then((response) => {
      resolve(response, categoryId);

      const errorMessage =
        response && !response.success ? response.message || '' : '';

      if (errorMessage === 'not_found') {
        this.alert(response, null, null, {
          title: 'Error',
          message: 'Category not found',
          type: 'error',
        });
      } else {

        this.alert(response);
      }

      callback();
      return response.success;
    });
  }

  editProjectRemoveDropzone(response, categoryId) {
    if (response && response.success) {
      const [documents] = this.formFields;
      const updatedValues = documents.values.filter(
        (cat) => cat.key !== categoryId,
      );

      this.formFields = [
        {
          ...documents,
          handleDeleteCategory: this.handleDeleteCategory,
          values: updatedValues,
        },
      ];
    }
  }
}

export default PackageCollator;
