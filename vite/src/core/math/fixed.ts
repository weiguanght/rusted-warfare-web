import { Constants } from './utils';

export class FixedMath {
    private static sqrtLookup: Int8Array;
    private static initialized = false;

    // [Match Java Source Line 728: unitLimit]
    // 默认 Unit Limit 为 1000，这是随机数种子混合的一部分
    private static readonly DEFAULT_UNIT_LIMIT = 1000;

    static initialize(): void {
        if (this.initialized) return;
        this.sqrtLookup = new Int8Array(Constants.SQRT_TABLE_SIZE);
        for (let i = 0; i < this.sqrtLookup.length; i++) {
            this.sqrtLookup[i] = Math.round(Math.sqrt(i));
        }
        this.initialized = true;
    }

    static sqrtInt(value: number): number {
        if (value < 0) return 0;
        if (value < Constants.SQRT_TABLE_SIZE) {
            return this.sqrtLookup[value | 0];
        }
        return Math.round(Math.sqrt(value));
    }

    static clamp(value: number, minVal: number, maxVal: number): number {
        if (value > maxVal) return maxVal;
        if (value < minVal) return minVal;
        return value;
    }

    static lerp(from: number, to: number, t: number): number {
        return from + (to - from) * t;
    }

    // ==================== 确定性随机数 ====================

    /**
     * 确定性随机整数 [min, max)
     * [Match Java Source 'a(int i2, int i3, int i4)' Line 41]
     * @param min 最小值 (包含)
     * @param max 最大值 (不包含) - 注意与 JS 习惯不同，但匹配 Java 源码
     * @param seed 种子 (i4)
     * @param frame 帧数/Tick (lVarB.bx)
     */
    static random(min: number, max: number, seed: number, frame: number = 0): number {
        // [Match Java Line 42] min >= max check
        if (min >= max) return min;

        // [Match Java Line 45] int i5 = i3 - i2;
        const range = max - min; 
        
        // [Match Java Line 46]
        // 算法: ((((bJ + ((seed * 133333333) * range)) + (seed * 13131313)) + ...) % range
        // 注意：Java 的 bJ 是 unitLimit，默认 1000
        const bJ = this.DEFAULT_UNIT_LIMIT;

        // 使用 Math.imul 强制模拟 Java int32 溢出
        let acc = bJ;
        
        // term1: (seed * 133333333) * range
        const t1 = Math.imul(Math.imul(seed, 133333333), range);
        acc = (acc + t1) | 0;

        // term2: seed * 13131313
        const t2 = Math.imul(seed, 13131313);
        acc = (acc + t2) | 0;

        // term3: seed * (frame * 13131313)
        const t3 = Math.imul(seed, Math.imul(frame, 13131313));
        acc = (acc + t3) | 0;

        // term4: (frame * 1313131313)
        const t4 = Math.imul(frame, 1313131313);
        acc = (acc + t4) | 0;

        // term5: frame % 10
        const t5 = frame % 10;
        acc = (acc + t5) | 0;

        let result = acc % range;
        
        // Java % operator preserves sign, handle negative results
        if (result < 0) result = -result;

        return result + min;
    }
}

FixedMath.initialize();