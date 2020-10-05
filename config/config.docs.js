module.exports = {
  title: 'DDN',
  mode: 'site',
  hash: true,
  favicon: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  logo: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  navs: [
    null,
    { title: '白皮书', path: 'https://github.com/ddnlink/whitepaper' },
    { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' }
  ],

  menus: {
    '/guide': [
      {
        title: '版本 3.6.0',
        children: []
      },
      {
        title: '介绍',
        children: ['guide/readme.md', 'guide/peer-install-testnet', 'guide/peer-install-mainnet', 'guide/config', 'guide/assetTypes', 'guide/ddn-cli']
      },
      {
        title: '应用开发',
        children: ['guide/app/wallet', 'guide/app/explorer']
      },
      {
        title: '框架扩展',
        children: ['guide/crypto', 'guide/asset', 'guide/app/dapp']
      },
      {
        title: '底层开发',
        children: ['guide/flows', 'guide/database', 'guide/context']
      },

      {
        title: '我要贡献',
        children: ['guide/contributing']
      }
    ]
  },

  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: 'css'
      }
    ],
  ],
  resolve: {
    // 文档所在路径
    includes: ['docs']
  }
};