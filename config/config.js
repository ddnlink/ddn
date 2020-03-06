export default {
    title: 'DDN',
    mode: 'site',
    favicon: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
    logo: 'http://testnet.ddn.link/static/ddnlogo.b8ab60d5.png',
    menus: {
        '/guide': [
            {
              title: '插件化',
              children: ['packages/asset', 'packages/crypto', 'packages/ddn'],
            },
            
          ],
    },
    navs: [
      null,
      { title: 'GitHub', path: 'https://github.com/ddnlink/ddn' },
      { title: '更新日志', path: 'https://github.com/ddnlink/ddn/releases' },
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