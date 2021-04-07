/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:11:41
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * this is a function queue
 * add the task into the queue
 * every 3 milliseconds will automatically execute a task
 *
 * no strict limit on the length of the queue
 * but a warning is given when there are more than 300 tasks.
 *
 * @param {config} config
 */
class Sequence {
  constructor (config) {
    const _default = {
      onWarning: null,
      warningLimit: 300,
      ...config
    }

    const self = this
    this.sequence = []
    this.counter = 1
    this.name = config.name

    setImmediate(function nextSequenceTick () {
      if (_default.onWarning && self.sequence.length >= _default.warningLimit) {
        _default.onWarning(self.sequence.length, _default.warningLimit)
      }

      self.__tick(() => {
        setTimeout(nextSequenceTick, 3)
      })
    })
  }

  __tick (cb) {
    const task = this.sequence.shift()
    if (!task) {
      return setImmediate(cb)
    }
    let args = [
      (err, res) => {
        // console.log(self.name + " sequence out " + task.counter + ' func ' + task.worker.name);
        task.done && setImmediate(task.done, err, res)
        setImmediate(cb)
      }
    ]
    if (task.args) {
      args = args.concat(task.args)
    }
    task.worker.apply(task, args) // FIXME?
  }

  add (worker, args, done) {
    if (!done && args && typeof args === 'function') {
      done = args
      args = undefined
    }
    if (worker && typeof worker === 'function') {
      const task = { worker, done }
      if (Array.isArray(args)) {
        task.args = args
      }
      task.counter = this.counter++
      // console.log(this.name + " sequence in " + task.counter + ' func ' + worker.name);
      this.sequence.push(task)
    }
  }

  count () {
    return this.sequence.length
  }
}

export default Sequence
