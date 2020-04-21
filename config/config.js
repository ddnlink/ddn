export default {
  title: 'DDN',
  mode: 'site',
  hash: true,
  favicon: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  logo: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  navs: [
    null,
    { title: '白皮书', path: 'https://github.com/ddnlink/whitepaper' },
    { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' },
  ],

  menus: {
    '/guide': [
      {
        title: '版本 3.0',
        children: []
      },
      {
        title: '介绍',
        children: ['guide/readme.md', 'guide/get-started', 'guide/peer-install']
      },
      {
        title: '框架',
        children: ['guide/framework', 'guide/config', 'guide/database', 'guide/context']
      },
      
      {
        title: '贡献',
        children: ['guide/contributing']
      }
    ],
  },

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