以下是数学库代码：

### 1\. 核心定点数库 (补充 Sqrt)

**文件路径:** `src/core/math/fixed.ts`

```typescript
/**
 * src/core/math/fixed.ts
 * 核心定点数数学库 - 架构加固版
 * 变更：添加 sqrt，保持 strict math 逻辑
 */

export type FP = number;

export class Fixed {
    public static readonly SHIFT: number = 16;
    public static readonly ONE: FP = 1 << 16;
    public static readonly HALF: FP = 1 << 15;
    public static readonly MAX: FP = 2147483647;
    public static readonly MIN: FP = -2147483648;
    public static readonly PI: FP = 205887; // PI * 65536

    public static fromFloat(val: number): FP {
        return Math.round(val * Fixed.ONE) | 0;
    }

    public static toFloat(val: FP): number {
        return val / Fixed.ONE;
    }

    public static add(a: FP, b: FP): FP {
        return (a + b) | 0;
    }

    public static sub(a: FP, b: FP): FP {
        return (a - b) | 0;
    }

    public static mul(a: FP, b: FP): FP {
        return Math.trunc((a * b) / Fixed.ONE) | 0;
    }

    public static div(a: FP, b: FP): FP {
        if (b === 0) throw new Error("Division by zero");
        return Math.trunc((a * Fixed.ONE) / b) | 0;
    }

    /**
     * 开方运算
     * 逻辑：sqrt(val_float) -> float -> fixed
     * 使用 Math.trunc 保证向零取整
     */
    public static sqrt(a: FP): FP {
        if (a < 0) throw new Error("Sqrt of negative number");
        // 先转为浮点数计算 sqrt，再转回定点数
        // 注意：Math.sqrt(a / 65536) * 65536
        return Math.trunc(Math.sqrt(a / Fixed.ONE) * Fixed.ONE) | 0;
    }

    public static eq(a: FP, b: FP): boolean { return a === b; }
    public static ne(a: FP, b: FP): boolean { return a !== b; }
    public static gt(a: FP, b: FP): boolean { return a > b; }
    public static lt(a: FP, b: FP): boolean { return a < b; }
    public static ge(a: FP, b: FP): boolean { return a >= b; }
    public static le(a: FP, b: FP): boolean { return a <= b; }
    
    public static max(a: FP, b: FP): FP { return a > b ? a : b; }
    public static min(a: FP, b: FP): FP { return a < b ? a : b; }
    public static abs(a: FP): FP { return a < 0 ? -a : a; }
}
```

-----

### 2\. 三角函数库 (Atan2 确定性加固)

**文件路径:** `src/core/math/trig-lut.ts`

```typescript
/**
 * src/core/math/trig-lut.ts
 * 三角函数查表法 - 架构加固版
 * 变更：Trig.atan2 使用 Math.fround 增加确定性
 */
import { Fixed, FP } from './fixed';

const TABLE_SIZE = 4096;
const TABLE_MASK = TABLE_SIZE - 1;
const PI2 = Math.PI * 2;
const DEG_TO_INDEX = 4096.0 / 360.0; 

const SIN_TABLE = new Int32Array(TABLE_SIZE);
let isInitialized = false;

export class Trig {
    public static init(): void {
        if (isInitialized) return;
        for (let i = 0; i < TABLE_SIZE; i++) {
            const angleRad = (i / TABLE_SIZE) * PI2;
            SIN_TABLE[i] = Fixed.fromFloat(Math.sin(angleRad));
        }
        isInitialized = true;
    }

    public static sin(angleDegFP: FP): FP {
        const idx = Trig.angleToIndex(angleDegFP);
        return SIN_TABLE[idx];
    }

    public static cos(angleDegFP: FP): FP {
        const offset = 90 * Fixed.ONE;
        return Trig.sin(angleDegFP + offset);
    }

    /**
     * 计算 Atan2 (返回角度，单位：度)
     * 使用 Math.fround 强制单精度浮点，减少不同浏览器 JS 引擎的差异
     */
    public static atan2(y: FP, x: FP): FP {
        const yFloat = Fixed.toFloat(y);
        const xFloat = Fixed.toFloat(x);
        
        // 核心修正：使用 fround 模拟 C++ float (32-bit) 精度
        const angleRad = Math.atan2(Math.fround(yFloat), Math.fround(xFloat));
        
        // 转回度数
        const angleDeg = angleRad * (180.0 / Math.PI);
        
        return Fixed.fromFloat(angleDeg);
    }

    private static angleToIndex(angleFP: FP): number {
        const angleFloat = Fixed.toFloat(angleFP);
        const rawIndex = Math.trunc(angleFloat * DEG_TO_INDEX);
        return rawIndex & TABLE_MASK;
    }
}
```

-----

### 3\. 向量库 (零内存分配重构)

**文件路径:** `src/core/math/vector2-fixed.ts`

**核心变更：**

  * 移除所有返回 `new Vector2` 的静态方法。
  * 增加 `out` 参数。
  * 增加 `set`、`copy`、`clone` 等实用方法。

<!-- end list -->

```typescript
/**
 * src/core/math/vector2-fixed.ts
 * 2D 定点数向量 - 零内存分配版 (Zero-Allocation)
 * 警告：严禁在 GameLoop 中使用 new Vector2()，请复用对象池或组件数据
 */
import { Fixed, FP } from './fixed';

export class Vector2 {
    public x: FP;
    public y: FP;

    constructor(x: FP, y: FP) {
        this.x = x;
        this.y = y;
    }

    /** 设置值 (便于复用) */
    public set(x: FP, y: FP): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /** 从另一个向量拷贝 */
    public copy(other: Vector2): this {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /** 克隆 (仅在非高频逻辑中使用) */
    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    // --- 静态运算 (Zero-Allocation: 结果写入 out) ---

    /** out = a + b */
    public static add(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = Fixed.add(a.x, b.x);
        out.y = Fixed.add(a.y, b.y);
        return out;
    }

    /** out = a - b */
    public static sub(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = Fixed.sub(a.x, b.x);
        out.y = Fixed.sub(a.y, b.y);
        return out;
    }

    /** out = v * s (标量乘法) */
    public static mul(out: Vector2, v: Vector2, s: FP): Vector2 {
        out.x = Fixed.mul(v.x, s);
        out.y = Fixed.mul(v.y, s);
        return out;
    }

    /** out = v / s (标量除法) */
    public static div(out: Vector2, v: Vector2, s: FP): Vector2 {
        out.x = Fixed.div(v.x, s);
        out.y = Fixed.div(v.y, s);
        return out;
    }

    // --- 常用计算 ---

    /** 长度平方 (Fixed) */
    public lengthSqr(): FP {
        const xx = Fixed.mul(this.x, this.x);
        const yy = Fixed.mul(this.y, this.y);
        return Fixed.add(xx, yy);
    }

    /** 长度 (Fixed) - 使用新的 Fixed.sqrt */
    public length(): FP {
        return Fixed.sqrt(this.lengthSqr());
    }

    /** 归一化 (修改自身) */
    public normalize(): this {
        const len = this.length();
        if (len !== 0) {
            this.x = Fixed.div(this.x, len);
            this.y = Fixed.div(this.y, len);
        }
        return this;
    }

    /** 距离平方 */
    public static distanceSqr(a: Vector2, b: Vector2): FP {
        const dx = Fixed.sub(a.x, b.x);
        const dy = Fixed.sub(a.y, b.y);
        return Fixed.add(Fixed.mul(dx, dx), Fixed.mul(dy, dy));
    }
    
    /** 距离 */
    public static distance(a: Vector2, b: Vector2): FP {
        return Fixed.sqrt(Vector2.distanceSqr(a, b));
    }

    public toString(): string {
        return `(${Fixed.toFloat(this.x).toFixed(2)}, ${Fixed.toFloat(this.y).toFixed(2)})`;
    }
}
```

-----

**完成状态：**

  - [x] Fixed.sqrt 实现 (Math.trunc 修正)
  - [x] Trig.atan2 确定性优化 (Math.fround)
  - [x] Vector2 零分配重构 (out 参数)
