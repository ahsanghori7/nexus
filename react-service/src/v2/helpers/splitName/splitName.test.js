import splitName from './index';

describe('splitName function', () => {
    it('returns empty firstName and lastName when name is undefined', () => {
        const result = splitName(undefined);
        expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('returns empty firstName and lastName when name is null', () => {
        const result = splitName(null);
        expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('returns empty firstName and lastName when name is an empty string', () => {
        const result = splitName('');
        expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('returns empty firstName and lastName when name is only spaces', () => {
        const result = splitName('     ');
        expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('splits a single word name correctly (only firstName)', () => {
        const result = splitName('Sajid');
        expect(result).toEqual({ firstName: 'Sajid', lastName: '' });
    });

    it('splits a full name into firstName and lastName', () => {
        const result = splitName('Sajid Ali');
        expect(result).toEqual({ firstName: 'Sajid', lastName: 'Ali' });
    });

    it('handles names with multiple parts correctly', () => {
        const result = splitName('Syed Sajid Ali Khan');
        expect(result).toEqual({ firstName: 'Syed', lastName: 'Sajid Ali Khan' });
    });

    it('trims extra spaces before splitting', () => {
        const result = splitName('   Sajid   Ali   ');
        expect(result).toEqual({ firstName: 'Sajid', lastName: 'Ali' });
    });

    it('returns firstName and empty lastName for trailing spaces only', () => {
        const result = splitName('Sajid   ');
        expect(result).toEqual({ firstName: 'Sajid', lastName: '' });
    });

    it('handles mixed whitespace between names', () => {
        const result = splitName('  Sajid    Ali   Khan  ');
        expect(result).toEqual({ firstName: 'Sajid', lastName: 'Ali Khan' });
    });

    it('handles non-string input gracefully (number)', () => {
        const result = splitName(12345);
        expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('handles non-string input gracefully (object)', () => {
        const result = splitName({ name: 'Sajid' });
        expect(result).toEqual({ firstName: '', lastName: '' });
    });
});
