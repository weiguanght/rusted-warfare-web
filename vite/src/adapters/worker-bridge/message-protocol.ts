/**
 * src/adapters/worker-bridge/message-protocol.ts
 * Worker 通信协议定义
 */
import { GameState } from "../../core/loop/game-state";

// 消息类型枚举
export enum WorkerMessageType {
    INIT = 'INIT',
    STOP = 'STOP',
    SYNC_STATE = 'SYNC_STATE'
}

// 主线程发送给 Worker 的消息结构
export type WorkerMessage =
    | { type: WorkerMessageType.INIT }
    | { type: WorkerMessageType.STOP };

// Worker 发送回主线程的状态快照
export interface SyncStatePayload {
    /** 当前逻辑帧号 */
    tick: number;

    /** * 累积时间残差 (毫秒)
     * 用于渲染插值：alpha = accumulatedTime / STEP_TIME
     * 它可以告诉渲染器：当前逻辑状态虽然是 Tick N，但实际时间其实已经过了 N + 0.5 Tick
     */
    accumulator: number;

    /** 完整的游戏状态数据 */
    state: GameState;
}

// Worker 发送的消息结构
export type WorkerResponse = {
    type: WorkerMessageType.SYNC_STATE;
    payload: SyncStatePayload;
};