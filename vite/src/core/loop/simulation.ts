/**
 * src/core/loop/simulation.ts
 */
import { STEP_TIME_MS, MAX_CATCHUP_TICKS } from '../../constants';
import { GameState, createInitialState } from './game-state';

export class Simulation {
    public state: GameState;
    // 将 accumulatedTime 设为 public readonly，以便 Worker 读取用于插值计算
    public accumulatedTime: number = 0;

    constructor() {
        this.state = createInitialState();
        // console.log 移至 Worker 层或被移除，保持核心纯净
    }

    public update(deltaTimeMs: number): void {
        this.accumulatedTime += deltaTimeMs;

        let loops = 0;
        while (this.accumulatedTime >= STEP_TIME_MS) {
            this.tick();
            this.accumulatedTime -= STEP_TIME_MS;
            loops++;

            if (loops >= MAX_CATCHUP_TICKS) {
                // 简单的防死锁日志，保留警告是必要的
                console.warn(`[Sim] Spiral of death! Dropping ${this.accumulatedTime.toFixed(2)}ms`);
                this.accumulatedTime = 0;
                break;
            }
        }
    }

    private tick(): void {
        this.state.tick++;
        // 移除 console.log，由 Worker 决定何时发送状态
    }

    /**
     * 获取当前状态的深拷贝
     * 防止主线程渲染时修改了 Worker 的引用对象 (虽然 postMessage 会结构化克隆，但显式拷贝是好习惯)
     */
    public getSnapshot(): GameState {
        // 目前 state 很简单，浅拷贝即可。
        // 未来如果有复杂的嵌套对象（如 Entity Map），需要深拷贝。
        return {
            ...this.state,
            entities: [...this.state.entities] // 浅拷贝数组
        };
    }
}