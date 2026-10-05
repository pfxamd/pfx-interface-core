export const circularFixture = {
  color: {
    a: { $type: 'color', $value: '{color.b}' },
    b: { $type: 'color', $value: '{color.a}' },
  },
};

export const missingReferenceFixture = {
  color: {
    a: { $type: 'color', $value: '{color.missing}' },
  },
};
