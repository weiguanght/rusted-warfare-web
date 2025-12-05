/**
 * src/constants.ts
 * 全局常量定义
 */

// 逻辑更新频率：每秒 15 次 (模拟原版 RTS 的低帧率逻辑)
export const LOGIC_TICK_RATE = 15;

// 单个逻辑帧的时间长度 (毫秒)
// 1000 / 15 = 66.666... ms
export const STEP_TIME_MS = 1000 / LOGIC_TICK_RATE;

// 螺旋死亡保护：单次 Update 允许运行的最大 Tick 数
// 如果超过此数值，说明机器性能已无法追上时间流逝，必须丢弃剩余时间防止卡死
export const MAX_CATCHUP_TICKS = 100;

// Worker 心跳频率 (毫秒)
// 设置为 16ms (约 60Hz) 以便及时响应输入，尽管逻辑只跑 15Hz
export const WORKER_HEARTBEAT_MS = 16;