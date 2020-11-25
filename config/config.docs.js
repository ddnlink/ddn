module.exports = {
  title: 'DDN',
  mode: 'site',
  hash: true,
  favicon: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  logo: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
  navs: {
    'en-US': [
      null,
      { title: 'whitepaper', path: 'https://github.com/ddnlink/whitepaper' },
      { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' }
    ],
    'zh-CN': [
      null,
      { title: '白皮书', path: 'https://github.com/ddnlink/whitepaper' },
      { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' }
    ]
  },

  menus: {
    '/guide': [
      {
        title: 'Version 3.6.0',
        children: []
      },
      {
        title: 'Introduction',
        children: [
          'guide/readme',
          'guide/peer-install-testnet',
          'guide/peer-install-mainnet',
          'guide/peer-upgrade-mainnet',
          'guide/config',
          'guide/assetTypes',
          'guide/ddn-cli',
          'guide/integration-exc'
        ]
      },
      {
        title: 'Frame extension',
        children: ['guide/crypto', 'guide/asset', 'guide/app/dapp']
      },
      {
        title: 'Core development',
        children: ['guide/flows', 'guide/database', 'guide/context']
      },

      {
        title: 'Contribute',
        children: ['guide/contributing']
      }
    ],
    '/zh-CN/guide': [
      {
        title: '版本 3.6.0',
        children: []
      },
      {
        title: '介绍',
        children: [
          'guide/readme',
          'guide/peer-install-testnet',
          'guide/peer-install-mainnet',
          'guide/peer-upgrade-mainnet',
          'guide/config',
          'guide/assetTypes',
          'guide/ddn-cli',
          'guide/integration-exc'
        ]
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
    ]
  ],
  resolve: {
    // 文档所在路径
    includes: ['docs']
  }
}
