import { setupVariable } from '../data/test-utils/setup';
import { validateName, validateNamespace } from './AddDialog';

const variables = [
  setupVariable('NameNode0', []),
  setupVariable('NameNode1', [setupVariable('NameNode10', []), setupVariable('NameNode11', [setupVariable('NameNode110', [])])])
];

describe('validateName', () => {
  test('valid', () => {
    expect(validateName('Name', '', variables)).toBeUndefined();
    expect(validateName('Name', 'NameNode0', variables)).toBeUndefined();
    expect(validateName('Name', 'NameNode1', variables)).toBeUndefined();
  });

  describe('invalid', () => {
    describe('blank', () => {
      test('empty', () => {
        expect(validateName('', '', variables)).toEqual({ message: 'Name cannot be empty.', variant: 'error' });
      });

      test('whitespace', () => {
        expect(validateName('   ', '', variables)).toEqual({ message: 'Name cannot be empty.', variant: 'error' });
      });
    });

    test('taken', () => {
      const error = { message: 'Name is already present in this Namespace.', variant: 'error' };
      expect(validateName('NameNode0', '', variables)).toEqual(error);
      expect(validateName('NameNode10', 'NameNode1', variables)).toEqual(error);
    });

    test('containsDot', () => {
      expect(validateName('New.Name', '', variables)).toEqual({ message: "Character '.' is not allowed.", variant: 'error' });
    });
  });
});

describe('validateNamespace', () => {
  describe('valid', () => {
    test('empty', () => {
      expect(validateNamespace('', variables)).toBeUndefined();
    });

    test('completelyNew', () => {
      expect(validateNamespace('New.Namespace', variables)).toBeUndefined();
    });

    test('partiallyNew', () => {
      expect(validateNamespace('NameNode1.New.Namespace', variables)).toBeUndefined();
    });
  });

  describe('invalid', () => {
    test('firstPartIsNotAFolder', () => {
      expect(validateNamespace('NameNode0.New.Namespace', variables)).toEqual({
        message: "Namespace 'NameNode0' is not a folder, you cannot add a child to it.",
        variant: 'error'
      });
    });

    test('middlePartIsNotAFolder', () => {
      expect(validateNamespace('NameNode1.NameNode10.New.Namespace', variables)).toEqual({
        message: "Namespace 'NameNode1.NameNode10' is not a folder, you cannot add a child to it.",
        variant: 'error'
      });
    });

    test('lastPartIsNotAFolder', () => {
      expect(validateNamespace('NameNode1.NameNode11.NameNode110', variables)).toEqual({
        message: "Namespace 'NameNode1.NameNode11.NameNode110' is not a folder, you cannot add a child to it.",
        variant: 'error'
      });
    });
  });
});
