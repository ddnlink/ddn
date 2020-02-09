import { join } from 'path';
import slash2 from 'slash2';

export default function(cwd, extraFiles = []) {
  const ddnEnv = process.env.DDN_ENV;
  require('@babel/register')({
    presets: [
      require.resolve('@babel/preset-typescript'),
      [
        require.resolve('babel-preset-umi'),
        {
          env: { targets: { node: 8 } },
          transformRuntime: false,
        },
      ],
    ],
    ignore: [/node_modules/],
    only: [
      join(cwd, 'config'),
      join(cwd, '.ddnrc.js'),
      join(cwd, '.ddnrc.ts'),
      ...(ddnEnv ? [join(cwd, `.ddnrc.${ddnEnv}.js`), join(cwd, `.ddnrc.${ddnEnv}.ts`)] : []),
    ]
      .concat(extraFiles)
      .map(file => slash2(file)),
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    babelrc: false,
    cache: false,
  });
}
