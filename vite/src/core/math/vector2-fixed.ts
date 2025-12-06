/**
 * src/core/math/vector2-fixed.ts
 * 2D 定点数向量 - 零内存分配版 (Zero-Allocation)
 * 警告：严禁在 GameLoop 中使用 new Vector2()，请复用对象池或组件数据
 */
import { Fixed } from './fixed';
import type { FP } from './fixed';

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