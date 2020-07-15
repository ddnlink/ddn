import { readdirSync } from 'fs';
import { join } from 'path';

const headPkgs = ['utils', 'core', 'crypto'];
const tailPkgs = ['peer', 'test-utils', 'node-sdk', 'js-sdk'];
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  (pkg) =>
    pkg.charAt(0) !== '.' && !headPkgs.includes(pkg) && !tailPkgs.includes(pkg),
);

export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true, minify: true },
  disableTypeCheck: false,
  pkgs: [...headPkgs, ...otherPkgs, ...tailPkgs],
  doc: {
    themeConfig: { mode: 'light' },
    base: '/doc'
  }
};
