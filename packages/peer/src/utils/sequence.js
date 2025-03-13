/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:11:41
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the AGPL 3.0 License. See License.txt in the project root for license information.
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
    
    const doneHandler = (err, res) => {
      if (task.done && !task._handled) {
        task._handled = true
        setImmediate(() => task.done(err, res))
      }
      setImmediate(cb)
    }

    try {
      const result = task.worker.call(task, doneHandler)
      
      if (result && typeof result.then === 'function') {
        result
          .then(res => {
            if (!task._handled) {
              doneHandler(null, res)
            }
          })
          .catch(err => {
            if (!task._handled) {
              doneHandler(err)
            }
          })
      }
      else if (result !== undefined && !task._handled) {
        doneHandler(null, result)
      }
    } catch (err) {
      if (!task._handled) {
        doneHandler(err)
      }
    }
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
      this.sequence.push(task)
    }
  }

  count () {
    return this.sequence.length
  }

  // Promise风格的API
  addAsync(worker, args) {
    return new Promise((resolve, reject) => {
      this.add(
        async (done) => {
          try {
            const result = await worker(...(args || []))
            done(null, result)
          } catch (err) {
            done(err)
          }
        },
        (err, res) => {
          if (err) reject(err)
          else resolve(res)
        }
      )
    })
  }
}

export default Sequence
