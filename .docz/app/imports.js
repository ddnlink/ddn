export const imports = {
  'README-zh-CN.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "readme-zh-cn" */ 'README-zh-CN.md'
    ),
  'doc/config/config.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "doc-config-config" */ 'doc/config/config.md'
    ),
  'doc/packages/asset.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "doc-packages-asset" */ 'doc/packages/asset.md'
    ),
  'doc/packages/ddn.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "doc-packages-ddn" */ 'doc/packages/ddn.md'
    ),
  'doc/packages/crypto.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "doc-packages-crypto" */ 'doc/packages/crypto.md'
    ),
  'packages/peer/README-zh-CN.md': () =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "packages-peer-readme-zh-cn" */ 'packages/peer/README-zh-CN.md'
    ),
}
