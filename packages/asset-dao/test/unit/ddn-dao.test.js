/**
 * 避免Jest并行执行的问题，按照顺序先后执行测试任务
 */
import { Dao } from './dao'
import { Contribution } from './contribution'
import { Exchange } from './exchange'

Dao()
Contribution()
Exchange()
