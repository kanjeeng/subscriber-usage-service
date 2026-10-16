// Aturan ini menangkap bug jenis Q4 (callback reduce tanpa return, mutasi parameter).
module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
    rules: {
      'array-callback-return': ['error', { checkForEach: true }],
      'no-param-reassign': 'error',
      'no-unused-vars': 'warn',
      eqeqeq: 'error',
    },
  },
];
