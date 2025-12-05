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