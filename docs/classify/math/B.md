1.  **保留了 `M` 和 `Vec2` 的类结构**：代码干净，调用方便，支持链式操作。
2.  **恢复了 8 卦限 `atan2` 查表**：这是 A 版本中保证不同设备（PC/手机）物理转向完全一致的核心，绝对不能删。
3.  **恢复了完整的确定性随机数**：保留了 A 版本复杂的种子混合算法，保证回放系统不出错。

-----

### 1\. 核心数学库 (`src/core/math/FastMath.ts`)

```typescript

export class M {
    public static readonly PI = 3.1415927;
    public static readonly TWO_PI = 6.2831855;
    public static readonly HALF_PI = 1.5707964;
    public static readonly RAD_TO_DEG = 57.29578;
    public static readonly DEG_TO_RAD = 0.01745329;

    // === 内部查找表配置 ===
    private static readonly SQRT_TBL = new Int8Array(1001);
    
    // Sin/Cos 表配置 (8192 精度)
    private static readonly SIN_BITS = 13; 
    private static readonly SIN_MASK = ~(-1 << M.SIN_BITS);
    private static readonly SIN_COUNT = M.SIN_MASK + 1;
    private static readonly DEG_IDX = M.SIN_COUNT / 360.0;
    private static sinTbl: Float32Array;
    private static cosTbl: Float32Array;

    // Atan2 表配置 (必须保留 c.md 的复杂 8 卦限表以保证确定性)
    private static readonly ATAN_SIZE = 1025;
    private static atanPosXPosY_YDom: Float32Array; // l
    private static atanPosXPosY_XDom: Float32Array; // m
    private static atanPosXNegY_YDom: Float32Array; // n
    private static atanPosXNegY_XDom: Float32Array; // o
    private static atanNegXPosY_YDom: Float32Array; // p
    private static atanNegXPosY_XDom: Float32Array; // q
    private static atanNegXNegY_YDom: Float32Array; // r
    private static atanNegXNegY_XDom: Float32Array; // s

    // === 静态初始化 (Static Block) ===
    static {
        // 1. 初始化 Sqrt 表 (0-1000)
        for (let i = 0; i < M.SQRT_TBL.length; i++) {
            M.SQRT_TBL[i] = Math.round(Math.sqrt(i));
        }

        // 2. 初始化 Sin/Cos 表
        // 采用 c.md 的 (i + 0.5) 偏移采样，精度通常比直接采样更高
        M.sinTbl = new Float32Array(M.SIN_COUNT);
        M.cosTbl = new Float32Array(M.SIN_COUNT);
        for (let i = 0; i < M.SIN_COUNT; i++) {
            const angle = ((i + 0.5) / M.SIN_COUNT) * M.TWO_PI;
            M.sinTbl[i] = Math.sin(angle);
            M.cosTbl[i] = Math.cos(angle);
        }

        // 3. 初始化 Atan2 表 (还原完整逻辑)
        M.atanPosXPosY_YDom = new Float32Array(M.ATAN_SIZE);
        M.atanPosXPosY_XDom = new Float32Array(M.ATAN_SIZE);
        M.atanPosXNegY_YDom = new Float32Array(M.ATAN_SIZE);
        M.atanPosXNegY_XDom = new Float32Array(M.ATAN_SIZE);
        M.atanNegXPosY_YDom = new Float32Array(M.ATAN_SIZE);
        M.atanNegXPosY_XDom = new Float32Array(M.ATAN_SIZE);
        M.atanNegXNegY_YDom = new Float32Array(M.ATAN_SIZE);
        M.atanNegXNegY_XDom = new Float32Array(M.ATAN_SIZE);

        for (let i = 0; i < M.ATAN_SIZE; i++) {
            const ratio = i / 1024.0;
            const baseAtan = Math.atan(ratio);
            
            M.atanPosXPosY_YDom[i] = baseAtan;
            M.atanPosXPosY_XDom[i] = M.HALF_PI - baseAtan;
            M.atanPosXNegY_YDom[i] = -baseAtan;
            M.atanPosXNegY_XDom[i] = baseAtan - M.HALF_PI;
            M.atanNegXPosY_YDom[i] = M.PI - baseAtan;
            M.atanNegXPosY_XDom[i] = baseAtan + M.HALF_PI;
            M.atanNegXNegY_YDom[i] = baseAtan - M.PI;
            M.atanNegXNegY_XDom[i] = -M.HALF_PI - baseAtan;
        }
    }

    // === 基础数学工具 ===

    /** 快速整数开方 (查表优化) */
    public static sqrtInt(val: number): number {
        if (val >= 0 && val <= 1000) return M.SQRT_TBL[val];
        return Math.round(Math.sqrt(val));
    }

    public static clamp(v: number, min: number, max: number): number {
        return v < min ? min : (v > max ? max : v);
    }

    public static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /** * 确定性随机数
     * 必须保留完整的混合算法，以确保回放一致性
     */
    public static rand(min: number, max: number, seed: number, frame: number): number {
        if (min >= max) return min;
        const range = max - min;
        
        // 还原 c.md 的复杂混合公式
        const combined = frame + (seed * 133333333 * range) + 
                         (seed * 13131313) + 
                         (seed * (frame * 13131313)) +
                         ((frame * 1313131313) + (frame % 10));

        let res = combined % range;
        // JS 的 % 运算符可能返回负数，需修正
        if (res < 0) res = -res;
        
        return res + min;
    }

    // === 三角函数工具 ===

    public static sin(deg: number): number {
        return M.sinTbl[(deg * M.DEG_IDX) & M.SIN_MASK | 0];
    }

    public static cos(deg: number): number {
        return M.cosTbl[(deg * M.DEG_IDX) & M.SIN_MASK | 0];
    }

    /** * 查表版 Atan2 (核心！)
     * 替代原生 Math.atan2，消除不同浏览器的精度差异
     */
    public static atan2(y: number, x: number): number {
        // 避免除零
        if (x === 0 && y === 0) return 0;

        try {
            if (x >= 0) {
                if (y >= 0) {
                    if (x >= y) return M.atanPosXPosY_YDom[((1024 * y) / x + 0.5) | 0];
                    return M.atanPosXPosY_XDom[((1024 * x) / y + 0.5) | 0];
                } else {
                    if (x >= -y) return M.atanPosXNegY_YDom[((-1024 * y) / x + 0.5) | 0];
                    return M.atanPosXNegY_XDom[((-1024 * x) / y + 0.5) | 0];
                }
            } else {
                if (y >= 0) {
                    if (-x >= y) return M.atanNegXPosY_YDom[((-1024 * y) / x + 0.5) | 0];
                    return M.atanNegXPosY_XDom[((-1024 * x) / y + 0.5) | 0];
                } else {
                    if (x <= y) return M.atanNegXNegY_YDom[((1024 * y) / x + 0.5) | 0];
                    return M.atanNegXNegY_XDom[((1024 * x) / y + 0.5) | 0];
                }
            }
        } catch (e) {
            // 极罕见情况的回退，通常不会走到这里
            return Math.atan2(y, x);
        }
    }

    public static angleDiff(current: number, target: number): number {
        let diff = (target - current) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return diff;
    }
}
```

-----

### 2\. 高性能向量库 (`src/core/math/Vec2.ts`)

```typescript

import { M } from './FastMath';

export class Vec2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    // === 基础修改操作 (支持链式调用) ===

    public set(x: number, y: number): this {
        this.x = x; this.y = y;
        return this;
    }

    public copy(v: Vec2): this {
        this.x = v.x; this.y = v.y;
        return this;
    }

    public add(x: number, y: number): this {
        this.x += x; this.y += y;
        return this;
    }

    public addV(v: Vec2): this {
        this.x += v.x; this.y += v.y;
        return this;
    }

    public subV(v: Vec2): this {
        this.x -= v.x; this.y -= v.y;
        return this;
    }

    public scl(scalar: number): this {
        this.x *= scalar; this.y *= scalar;
        return this;
    }

    /** 旋转向量 (必须使用 M.sin/cos 查表) */
    public rotate(deg: number): this {
        const c = M.cos(deg);
        const s = M.sin(deg);
        const ox = this.x;
        this.x = ox * c - this.y * s;
        this.y = ox * s + this.y * c;
        return this;
    }

    public normalize(): this {
        const len = Math.sqrt(this.x * this.x + this.y * this.y);
        if (len > 0.0001) {
            this.x /= len;
            this.y /= len;
        } else {
            this.x = 0; this.y = 0;
        }
        return this;
    }

    // === 查询与计算 (Query) ===

    public len2(): number {
        return this.x * this.x + this.y * this.y;
    }

    public dist2(v: Vec2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /** * 获取角度 
     * [关键修改] 这里调用 M.atan2 而不是 Math.atan2，确保结果跨端一致
     */
    public angle(): number {
        return M.atan2(this.y, this.x) * M.RAD_TO_DEG;
    }

    // === 静态对象池/临时变量 (零 GC 优化) ===
    
    public static readonly T1 = new Vec2();
    public static readonly T2 = new Vec2();
    public static readonly T3 = new Vec2();

    /** 快速距离平方检查 */
    public static distSq(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return dx * dx + dy * dy;
    }
}
```
