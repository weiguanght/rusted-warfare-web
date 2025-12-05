/**
 * src/core/loop/game-state.ts
 * 纯净的数据结构，不包含方法
 */

export interface GameState {
    /** 当前逻辑帧号 (从 0 开始) */
    tick: number;

    /** 实体列表 (预留，后续替换为 ECS 或 Entity数组) */
    entities: any[];
}

/** 创建初始状态 */
export function createInitialState(): GameState {
    return {
        tick: 0,
        entities: []
    };
}