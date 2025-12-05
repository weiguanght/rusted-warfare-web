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