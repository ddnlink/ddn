/**
 * 避免Jest并行执行的问题，按照顺序先后执行测试任务
 */
import { Dao } from './dao/dao'
import { Contribution } from './dao/contribution'
import { Exchange } from './dao/exchange'

Dao()
Contribution()
Exchange()
