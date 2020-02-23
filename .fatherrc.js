export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  disableTypeCheck: true,
  doc: {
    themeConfig: { mode: 'light' },
    base: '/doc'
  },
};
