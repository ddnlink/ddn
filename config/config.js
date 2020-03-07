export default {
  title: 'DDN',
  mode: 'site',
  favicon: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  logo: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  navs: [
    null,
    { title: '白皮书', path: 'https://github.com/ddnlink/whitepaper' },
    { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' },
  ],
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: 'css',
      },
    ],
  ],
  resolve: {
    includes: ['doc']
  }
};