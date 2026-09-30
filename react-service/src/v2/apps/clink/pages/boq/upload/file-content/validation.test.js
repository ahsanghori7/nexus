import validateData, { trimVal } from './validation';

describe('validation.js', () => {
  describe('trimVal', () => {
    it('should trim string values', () => {
      expect(trimVal('  test  ')).toBe('test');
      expect(trimVal('test')).toBe('test');
      expect(trimVal('')).toBe('');
    });

    it('should return non-string values as-is', () => {
      expect(trimVal(123)).toBe(123);
      expect(trimVal(null)).toBe(null);
      expect(trimVal(undefined)).toBe(undefined);
      expect(trimVal(true)).toBe(true);
      expect(trimVal({})).toEqual({});
    });
  });

  describe('validateData', () => {
    const validUnits = [
      { symbol: 'm' },
      { symbol: 'm²' },
      { symbol: 'item' },
      { symbol: 'kg' }
    ];

    const createValidData = () => [
      {
        'item type': 'section',
        description: 'prelims',
        item: null,
        quantity: null,
        unit: null,
        'budget rate': null,
        'budget total': null
      },
      {
        'item type': 'section',
        description: 'measured work',
        item: null,
        quantity: null,
        unit: null,
        'budget rate': null,
        'budget total': null
      },
      {
        'item type': 'section',
        description: 'other items',
        item: null,
        quantity: null,
        unit: null,
        'budget rate': null,
        'budget total': null
      },
      {
        'item type': 'grouped heading',
        description: 'Foundation work',
        item: '1.0',
        quantity: null,
        unit: null,
        'budget rate': null,
        'budget total': null
      },
      {
        'item type': 'item',
        description: 'Concrete foundation',
        item: '1.1',
        quantity: '10',
        unit: 'm²',
        'budget rate': '100',
        'budget total': '1000'
      }
    ];

    it('should return no errors for valid data', () => {
      const validData = createValidData();
      const errors = validateData(validData, validUnits);
      expect(errors).toEqual([]);
    });

    describe('Section validation', () => {
      it('should require exactly three sections', () => {
        const dataWithTwoSections = [
          {
            'item type': 'section',
            description: 'prelims'
          },
          {
            'item type': 'section',
            description: 'measured work'
          }
        ];

        const errors = validateData(dataWithTwoSections, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': '',
            'Column': 'item type',
            'Provided Value': 2,
            'Error Type': 'Incorrect number of Section entries',
            'System Message': 'There must be exactly three Section entries.'
          })
        );
      });

      it('should require valid section descriptions', () => {
        const dataWithInvalidSection = [
          {
            'item type': 'section',
            description: 'invalid section'
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          }
        ];

        const errors = validateData(dataWithInvalidSection, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 2,
            'Column': 'Description',
            'Provided Value': 'invalid section',
            'Error Type': 'Invalid Section description'
          })
        );
      });

      it('should require description for sections', () => {
        const dataWithMissingDescription = [
          {
            'item type': 'section',
            description: ''
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          }
        ];

        const errors = validateData(dataWithMissingDescription, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 2,
            'Column': 'Description',
            'Error Type': 'Missing required fields in any row'
          })
        );
      });

      it('should not allow item field for sections', () => {
        const dataWithItemInSection = [
          {
            'item type': 'section',
            description: 'prelims',
            item: '1.0'
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          }
        ];

        const errors = validateData(dataWithItemInSection, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 2,
            'Column': 'Item',
            'Provided Value': '1.0',
            'Error Type': "'item' field filled for a 'section' row"
          })
        );
      });
    });

    describe('Grouped Heading validation', () => {
      it('should require item number for grouped headings', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'grouped heading',
            description: 'Test heading',
            item: null
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Item',
            'Error Type': 'Missing required fields in any row'
          })
        );
      });

      it('should require description for grouped headings', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'grouped heading',
            description: null,
            item: '2.0'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Description',
            'Error Type': 'Missing required fields in any row'
          })
        );
      });
    });

    describe('Item validation', () => {
      it('should require all mandatory fields for items', () => {
        const incompleteItem = {
          'item type': 'item',
          description: null,
          item: null,
          quantity: null,
          unit: null,
          'budget rate': null,
          'budget total': null
        };

        const data = [...createValidData(), incompleteItem];
        const errors = validateData(data, validUnits);

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Item',
            'Error Type': 'Missing required fields in any row'
          })
        );

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Description',
            'Error Type': 'Missing required fields in any row'
          })
        );

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Quantity',
            'Error Type': 'Missing required fields in any row'
          })
        );

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Unit',
            'Error Type': 'Missing required fields in any row'
          })
        );

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Budget Rate',
            'Error Type': 'Missing required fields in any row'
          })
        );

        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Budget Total',
            'Error Type': 'Missing required fields in any row'
          })
        );
      });

      it('should validate duplicate item identifiers', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Another item',
            item: '1.1', // Duplicate of existing item
            quantity: '5',
            unit: 'm',
            'budget rate': '50',
            'budget total': '250'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Item',
            'Error Type': 'Duplicate item identifier',
            'System Message': 'Item identifiers must be unique. Duplicate found: 1.1.'
          })
        );
      });

      it('should validate positive quantities', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: '-5',
            unit: 'm',
            'budget rate': '100',
            'budget total': '500'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Quantity',
            'Provided Value': '-5',
            'Error Type': 'Quantities are not positive numbers'
          })
        );
      });

      it('should validate zero quantities', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: '0',
            unit: 'm',
            'budget rate': '100',
            'budget total': '100'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Quantity',
            'Provided Value': '0',
            'Error Type': 'Quantities are not positive numbers'
          })
        );
      });

      it('should validate non-numeric quantities', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: 'abc',
            unit: 'm',
            'budget rate': '100',
            'budget total': '100'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Quantity',
            'Provided Value': 'abc',
            'Error Type': 'Quantities are not positive numbers'
          })
        );
      });

      it('should validate units against provided unit list', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: '10',
            unit: 'invalid_unit',
            'budget rate': '100',
            'budget total': '1000'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Unit',
            'Provided Value': 'invalid_unit',
            'Error Type': 'Units of measurement are unrecognized or inappropriate'
          })
        );
      });

      it('should validate numeric budget rates', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: '10',
            unit: 'm',
            'budget rate': 'abc',
            'budget total': '1000'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Budget Rate',
            'Provided Value': 'abc',
            'Error Type': 'Budget Rate is not numerical'
          })
        );
      });

      it('should validate numeric budget totals', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'item',
            description: 'Test item',
            item: '2.1',
            quantity: '10',
            unit: 'm',
            'budget rate': '100',
            'budget total': 'xyz'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'Budget Total',
            'Provided Value': 'xyz',
            'Error Type': 'Budget Total is not numerical'
          })
        );
      });
    });

    describe('Cross-type validation', () => {
      it('should not allow budget for sections', () => {
        const data = [
          {
            'item type': 'section',
            description: 'prelims',
            'budget rate': '100'
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 2,
            'Error Type': 'Budget provided for Sections or Grouped Headings'
          })
        );
      });

      it('should not allow budget for grouped headings', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'grouped heading',
            description: 'Test heading',
            item: '2.0',
            'budget total': '1000'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Error Type': 'Budget provided for Sections or Grouped Headings'
          })
        );
      });

      it('should not allow units for sections', () => {
        const data = [
          {
            'item type': 'section',
            description: 'prelims',
            unit: 'm'
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 2,
            'Error Type': "'Unit' field filled for 'section' or 'grouped heading' rows"
          })
        );
      });

      it('should not allow quantities for grouped headings', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'grouped heading',
            description: 'Test heading',
            item: '2.0',
            quantity: '10'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Error Type': "'Quantity' field filled for 'section' or 'grouped heading' rows"
          })
        );
      });

      it('should validate incorrect item types', () => {
        const data = [
          ...createValidData(),
          {
            'item type': 'invalid_type',
            description: 'Test'
          }
        ];

        const errors = validateData(data, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Row': 7,
            'Column': 'item type',
            'Provided Value': 'invalid_type',
            'Error Type': 'Incorrect use of Item Type values'
          })
        );
      });
    });

    describe('Overall structure validation', () => {
      it('should require at least one of each type', () => {
        const dataWithoutSections = [
          {
            'item type': 'grouped heading',
            description: 'Test heading',
            item: '1.0'
          },
          {
            'item type': 'item',
            description: 'Test item',
            item: '1.1',
            quantity: '10',
            unit: 'm',
            'budget rate': '100',
            'budget total': '1000'
          }
        ];

        const errors = validateData(dataWithoutSections, validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Error Type': 'Template provided does not match the system'
          })
        );
      });

      it('should work with empty units array', () => {
        const data = createValidData();
        const errors = validateData(data, []);
        
        // Should have errors for units not being recognized
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Column': 'Unit',
            'Error Type': 'Units of measurement are unrecognized or inappropriate'
          })
        );
      });

      it('should work without units parameter', () => {
        const data = createValidData();
        const errors = validateData(data);
        
        // Should have errors for units not being recognized since no units provided
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Column': 'Unit',
            'Error Type': 'Units of measurement are unrecognized or inappropriate'
          })
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle empty data', () => {
        const errors = validateData([], validUnits);
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Error Type': 'Template provided does not match the system'
          })
        );
      });

      it('should handle data with whitespace in fields', () => {
        const data = [
          {
            'item type': '  section  ',
            description: '  prelims  '
          },
          {
            'item type': 'section',
            description: 'measured work'
          },
          {
            'item type': 'section',
            description: 'other items'
          },
          {
            'item type': '  grouped heading  ',
            description: '  Test heading  ',
            item: '  1.0  '
          },
          {
            'item type': '  item  ',
            description: '  Test item  ',
            item: '  1.1  ',
            quantity: '  10  ',
            unit: '  m  ',
            'budget rate': '  100  ',
            'budget total': '  1000  '
          }
        ];

        const errors = validateData(data, validUnits);
        // The validation logic checks structure first, so we expect a template error
        // because trimmed values are processed differently in the structure check
        expect(errors).toContainEqual(
          expect.objectContaining({
            'Error Type': 'Template provided does not match the system'
          })
        );
      });
    });
  });
});