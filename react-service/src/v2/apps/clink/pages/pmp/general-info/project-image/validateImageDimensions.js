import i18next from 'v2/helpers/i18n';

const allowedTypes = ['image/jpg', 'image/jpeg'];

const validateImageDimensions = (
  file,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight
) => {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    // Check if file type is allowed
    if (!allowedTypes.includes(file.type)) {
      reject(new Error(i18next.t('unsupported-format')));
      return;
    }

    // Create a FileReader to read the file
    const reader = new FileReader();

    // Set up the onload event handler for the FileReader
    reader.onload = (e) => {
      const img = new Image();

      // Set up the onload event handler for the image
      // eslint-disable-next-line func-names
      img.onload = function () {
        const width = this.width; // Now 'this' refers to the img element
        const height = this.height;

        // Validate dimensions
        if (width < minWidth || height < minHeight) {
          reject(
            new Error(
              `Image is too small. Minimum dimensions are ${minWidth}x${minHeight} pixels.`
            )
          );
        } else if (width > maxWidth || height > maxHeight) {
          reject(
            new Error(
              `Image is too large. Maximum dimensions are ${maxWidth}x${maxHeight} pixels.`
            )
          );
        } else {
          // Only resolve here when we know the dimensions are valid
          resolve({ width, height, size: Math.round(file.size / 1024) });
        }
      };

      // Set up error handler for the image
      img.onerror = () => {
        reject(new Error('Failed to load image. Please try again.'));
      };

      // Set the source of the image to the data URL
      // This must be done AFTER setting up the onload handler
      img.src = e.target.result;
    };

    // Set up error handler for the FileReader
    reader.onerror = () => {
      reject(new Error('Error reading file. Please try again.'));
    };

    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
};

export default validateImageDimensions;
export { allowedTypes };
