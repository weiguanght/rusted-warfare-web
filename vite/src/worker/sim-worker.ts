/**
 * src/worker/sim-worker.ts
 */
import { Simulation } from '../core/loop/simulation';
import { WORKER_HEARTBEAT_MS } from '../constants';
import { WorkerMessageType, WorkerResponse } from '../adapters/worker-bridge/message-protocol';

declare const self: DedicatedWorkerGlobalScope;

let simulation: Simulation | null = null;
let intervalId: any = null;
let lastTime: number = 0;

const handlers: Record<string, (payload: any) => void> = {
    [WorkerMessageType.INIT]: handleInit,
    [WorkerMessageType.STOP]: handleStop
};

self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;
    const handler = handlers[type];
    if (handler) {
        handler(payload);
    }
};

function handleInit() {
    if (simulation) return;

    console.log('[Worker] Starting simulation thread...');
    simulation = new Simulation();
    lastTime = performance.now();
    intervalId = setInterval(loop, WORKER_HEARTBEAT_MS);
}

function handleStop() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    simulation = null;
    console.log('[Worker] Stopped.');
}

function loop() {
    if (!simulation) return;

    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    // 1. 执行物理/逻辑模拟
    simulation.update(delta);

    // 2. 发送状态快照 (为了测试，限制发送频率)
    // 只有当 tick 发生变化，或者为了调试每秒发一次
    // 这里我们按照 Prompt 要求：每 15 帧发送一次 (大约 1 秒一次)
    if (simulation.state.tick % 15 === 0) {
        sendSnapshot();
    }
}

function sendSnapshot() {
    if (!simulation) return;

    // 构造符合协议的消息
    const response: WorkerResponse = {
        type: WorkerMessageType.SYNC_STATE,
        payload: {
            tick: simulation.state.tick,
            accumulator: simulation.accumulatedTime, // 关键：用于插值
            state: simulation.getSnapshot()
        }
    };

    // postMessage 会自动序列化对象
    self.postMessage(response);
}}