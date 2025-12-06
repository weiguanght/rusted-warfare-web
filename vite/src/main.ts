/**
 * src/main.ts
 * 应用入口
 */
import { WorkerMessageType } from './adapters/worker-bridge/message-protocol';
import type { WorkerResponse } from './adapters/worker-bridge/message-protocol';

// 1. 初始化 Worker
// Vite 特性: ?worker 后缀或 new Worker(..., {type: 'module'}) 均可
// 使用 type: 'module' 让 Worker 支持 ES import
const simWorker = new Worker(
    new URL('./worker/sim-worker.ts', import.meta.url),
    { type: 'module' }
);

console.log('[Main] Worker instance created.');

// 2. 监听 Worker 消息
simWorker.onmessage = (event: MessageEvent) => {
    const data = event.data as WorkerResponse;

    if (data.type === WorkerMessageType.SYNC_STATE) {
        const { tick, accumulator } = data.payload;
        console.log(
            `[Main] Recv State | Tick: ${tick} | Acc: ${accumulator.toFixed(2)}ms`
        );
    }
};

// 3. 启动引擎
// 发送 INIT 指令
simWorker.postMessage({ type: WorkerMessageType.INIT });

console.log('[Main] INIT sent to worker.');