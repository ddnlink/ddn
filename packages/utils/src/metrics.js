import { Registry, Counter, Histogram, Summary, Gauge } from 'prom-client';

/**
 * 区块链监控指标收集器【待使用】
 * 
 * 采用单例模式确保全局统一监控
 * 
 * 主要功能特征：
 * ## 1. 性能监控
 * - 实时记录区块处理耗时(block_processing_duration)
 * - 跟踪网络延迟分布(network_latency)
 * - 监控交易池容量变化(transaction_pool_size)
 * ## 2. DPOS专项指标
 * - 委托节点出块成功率统计
 * - 投票轮次时间分布直方图
 * - 节点存活状态检测（通过node_uptime）
 * ## 3. 架构设计
 * - 单例模式确保全局统一采集
 * - 模块化设计便于扩展指标类型
 * - 提供标准化数据输出接口
 * ## 4. 集成方式
 * - 被core和peer包中的区块处理模块调用
 * - 与p2p网络模块深度集成采集网络指标
 * - 通过REST API暴露给监控系统
 * 
 * ##  5. TODO 在适当的地方添加下面的接口代码
 * import metrics from '@ddn/utils/metrics';

 * // 在启动方法中添加
 * app.get('/metrics', async (req, res) => {
 *     try {
 *         res.set('Content-Type', metrics.registry.contentType);
 *         res.end(await metrics.metrics());
 *     } catch (err) {
 *         res.status(500).end(err);
 *     }
 * });
 */
class Metrics {
  constructor() {
    this.registry = new Registry();
    this.counters = new Map();
    this.histograms = new Map();
    this.metrics = {
      // 区块处理性能指标
      block_processing_duration: new Histogram(),
      // 网络通信指标
      network_latency: new Summary(),
      // 节点活跃状态
      node_uptime: new Gauge(),
      // 交易池状态
      transaction_pool_size: new Counter()
    };
  }

  createCounter(name, help, labelNames = []) {
    const counter = new Counter({ name, help, labelNames, registers: [this.registry] });
    this.counters.set(name, counter);
    return counter;
  }

  createHistogram(name, help, buckets, labelNames = []) {
    const histogram = new Histogram({ name, help, buckets, labelNames, registers: [this.registry] });
    this.histograms.set(name, histogram);
    return histogram;
  }

  increment(name, value = 1, labels = {}) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.inc(labels, value);
    } else {
      console.warn(`Counter ${name} not registered`);
    }
  }

  observe(name, value, labels = {}) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(labels, value);
    } else {
      console.warn(`Histogram ${name} not registered`);
    }
  }

  async metrics() {
    return this.registry.metrics();
  }

  // 注册DPOS特定指标
  registerDposMetrics() {
    // 委托节点出块成功率
    this.metrics.delegate_success_rate = new Counter();
    // 投票轮次统计
    this.metrics.voting_rounds = new Histogram();
  }

  // 暴露指标收集接口（供其他模块调用）
  getMetrics() {
    return Object.entries(this.metrics).reduce((acc, [key, metric]) => {
      acc[key] = metric.getValues();
      return acc;
    }, {});
  }
}

// 导出单例实例
module.exports = new Metrics();

// 预定义核心指标
metrics.createCounter('block_apply_errors', 'Total block apply errors', ['error_type']);
metrics.createHistogram('block_apply_duration', 'Block apply duration in ms', [0.1, 5, 15, 50, 100, 500]); 