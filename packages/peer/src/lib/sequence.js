/*---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:11:41
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import util from 'util';

import extend from 'extend';

/**
 * 这是一个自定义的序列函数，只要把任务add进去，每3毫秒就会自动执行一个任务
 *
 * 序列长度没有严格限制，但超过 300 个任务时会警告。
 *
 * @param {config} config
 */
class Sequence {
  constructor(config) {
    let _default = {
      onWarning: null,
      warningLimit: 300
    };

    _default = extend(_default, config);

    const self = this;
    this.sequence = [];
    this.counter = 1;
    this.name = config.name;

    setImmediate(function nextSequenceTick() {
      if (_default.onWarning && self.sequence.length >= _default.warningLimit) {
        _default.onWarning(self.sequence.length, _default.warningLimit);
      }

      self.__tick(() => {
        setTimeout(nextSequenceTick, 3);
      });
    });
  }

  __tick(cb) {
    const task = this.sequence.shift();
    if (!task) {
      return setImmediate(cb);
    }
    let args = [(err, res) => {
      // console.log(self.name + " sequence out " + task.counter + ' func ' + task.worker.name);
      task.done && setImmediate(task.done, err, res);
      setImmediate(cb);
    }];
    if (task.args) {
      args = args.concat(task.args);
    }
    task.worker.apply(task.worker, args);
  }

  add(worker, args, done) {
    if (!done && args && typeof(args) == 'function') {
      done = args;
      args = undefined;
    }
    if (worker && typeof(worker) == 'function') {
      const task = {worker, done};
      if (util.isArray(args)) {
        task.args = args;
      }
      task.counter = this.counter++;
      // console.log(this.name + " sequence in " + task.counter + ' func ' + worker.name);
      this.sequence.push(task);
    }
  }

  count() {
    return this.sequence.length;
  }
}

export default Sequence;
