/**
 * src/core/loop/game-state.ts
 * 纯净的数据结构，不包含方法
 */

export interface Entity {
    id: number;
    // 预留其他属性
}

export interface GameState {
    /** 当前逻辑帧号 (从 0 开始) */
    tick: number;

    /** 实体列表 */
    entities: Entity[];
}

/** 创建初始状态 */
export function createInitialState(): GameState {
    return {
        tick: 0,
        entities: []
    };
}
