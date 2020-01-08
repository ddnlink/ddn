const { fork } = require('child_process');
const { join } = require('path');

const DEV_SCRIPT = join(__dirname, '../examples/fun-tests/app.js');

function startDevServer(opts = {}) {
  const { cwd } = opts;
  return new Promise(resolve => {
    console.log(`Start dev blockchain for ${cwd}`);
    const child = fork(DEV_SCRIPT, ['dev', '--cwd', cwd], {
      env: {
        ...process.env,
        // https://github.com/webpack/webpack-dev-server/issues/128
        UV_THREADPOOL_SIZE: '100',
        BROWSER: 'none',
        PROGRESS: 'none',
      },
    });
    child.on('message', args => {
      if (args.type === 'DONE') {
        resolve({
          child,
        });
      }
    });
  });
}

function start() {
  return startDevServer({ cwd: join(__dirname, 'node') });
}

start();
