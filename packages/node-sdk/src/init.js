import Asset from '@ddn/asset-base';
import options from './options';

// fixme: 已经修改为 config.js
import assetPlugins from '../config.asset';

export default function (nethash) {
    if (nethash) {
        options.set("nethash", nethash);
    }

    Asset.Utils.loadFromObject(assetPlugins);
}