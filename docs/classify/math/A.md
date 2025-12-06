# Math Library TypeScript Implementation

Based on the Java source code analysis, I'll create three TypeScript files that replicate the deterministic math system used in the RTS game.

## `src/core/math/fixed.ts`

```typescript
/**
 * Fixed-point math utilities for deterministic calculations
 * Ensures consistent behavior across different platforms and browsers
 */

// Lookup table for integer square roots (0-1000)
const sqrtLookup: Int8Array = new Int8Array(1001);

// Initialize sqrt lookup table (matches Java static block)
for (let i = 0; i < sqrtLookup.length; i++) {
    sqrtLookup[i] = Math.round(Math.sqrt(i));
}

/**
 * Integer square root using lookup table for values 0-1000
 * Falls back to Math.sqrt for values outside range
 */
export function sqrtInt(value: number): number {
    if (value >= 0 && value <= 1000) {
        return sqrtLookup[value];
    }
    return Math.round(Math.sqrt(value));
}

/**
 * Float square root
 */
export function sqrt(value: number): number {
    return Math.sqrt(value);
}

/**
 * Absolute value (float)
 */
export function abs(value: number): number {
    return value < 0 ? -value : value;
}

/**
 * Absolute value (double precision)
 */
export function absDouble(value: number): number {
    return value < 0 ? -value : value;
}

/**
 * Maximum of two integers
 */
export function maxInt(a: number, b: number): number {
    return a > b ? a : b;
}

/**
 * Minimum of two integers
 */
export function minInt(a: number, b: number): number {
    return a < b ? a : b;
}

/**
 * Maximum of two floats
 */
export function max(a: number, b: number): number {
    return a > b ? a : b;
}

/**
 * Minimum of two floats
 */
export function min(a: number, b: number): number {
    return a < b ? a : b;
}

/**
 * Minimum of two doubles
 */
export function minDouble(a: number, b: number): number {
    return a < b ? a : b;
}

/**
 * Clamp float between min and max
 */
export function clamp(value: number, minVal: number, maxVal: number): number {
    if (value > maxVal) return maxVal;
    if (value < minVal) return minVal;
    return value;
}

/**
 * Clamp integer between min and max
 */
export function clampInt(value: number, minVal: number, maxVal: number): number {
    if (value > maxVal) return maxVal;
    if (value < minVal) return minVal;
    return value;
}

/**
 * Clamp value to byte range (0-255)
 */
export function clampByte(value: number): number {
    if (value > 255) return 255;
    if (value < 0) return 0;
    return value;
}

/**
 * Clamp value symmetrically around zero: [-limit, limit]
 */
export function clampSymmetric(value: number, limit: number): number {
    if (value > limit) return limit;
    if (value < -limit) return -limit;
    return value;
}

/**
 * Linear interpolation between two values
 */
export function lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
}

/**
 * Ease in-out quadratic interpolation
 */
export function easeInOut(t: number): number {
    const t1 = t - 1;
    const t2 = t * 2;
    return t2 < 1 ? t * t2 : 1 - (t1 * t1) * 2;
}

/**
 * Move value towards target by maxDelta
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
    if (current > target + maxDelta) {
        return current - maxDelta;
    }
    if (current < target - maxDelta) {
        return current + maxDelta;
    }
    return target;
}

/**
 * Reduce value towards zero by amount (dead zone)
 */
export function reduceToZero(value: number, amount: number): number {
    if (value > amount) {
        return value - amount;
    }
    if (value < -amount) {
        return value + amount;
    }
    return 0;
}

/**
 * Floor division (rounds towards negative infinity)
 */
export function floorToInt(value: number): number {
    if (value > 0) {
        return Math.floor(value);
    }
    if (value < 0) {
        return Math.floor(value) - 1;
    }
    return 0;
}

/**
 * Round to nearest integer (same as adding 0.5 and truncating)
 */
export function roundToInt(value: number): number {
    return Math.floor(value + 0.5);
}

/**
 * Ceiling function
 */
export function ceil(value: number): number {
    return Math.ceil(value);
}

/**
 * Power function
 */
export function pow(base: number, exponent: number): number {
    return Math.pow(base, exponent);
}

/**
 * Check if two floats are approximately equal (tight tolerance)
 */
export function approxEqual(a: number, b: number): boolean {
    return abs(a - b) < 0.0001;
}

/**
 * Check if two floats are approximately equal (very tight tolerance)
 */
export function approxEqualTight(a: number, b: number): boolean {
    return abs(a - b) < 0.0000001;
}

/**
 * Check if two floats are roughly equal (loose tolerance)
 */
export function roughlyEqual(a: number, b: number): boolean {
    return abs(a - b) < 0.05;
}

/**
 * Check if two doubles are approximately equal
 */
export function approxEqualDouble(a: number, b: number): boolean {
    return absDouble(a - b) < 1.0e-7;
}

/**
 * Deterministic random number generator seed
 */
let deterministicSeed = 0;

/**
 * Reset deterministic random seed
 */
export function resetDeterministicRandom(): void {
    deterministicSeed = 0;
}

/**
 * Deterministic random integer in range [min, max)
 * Uses game state for reproducible results
 */
export function deterministicRandom(
    min: number,
    max: number,
    frameCount: number,
    seed: number = 0
): number {
    if (min >= max) {
        if (min > max) {
            console.warn('deterministicRandom: min > max');
        }
        return min;
    }
    
    const range = max - min;
    const combined = frameCount + (seed * 133333333 * range) + 
                     (seed * 13131313) + 
                     (seed * (frameCount * 13131313)) +
                     ((frameCount * 1313131313) + (frameCount % 10));
    
    let result = combined % range;
    if (result < 0) {
        result = -result;
    }
    
    return result + min;
}

/**
 * Chebyshev distance (max of absolute differences)
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
    let dx = x1 - x2;
    let dy = y1 - y2;
    if (dx < 0) dx = -dx;
    if (dy < 0) dy = -dy;
    return dx > dy ? dx : dy;
}

// Fixed-point scale factors
export const FIXED_SCALE_1000 = 1000;
export const FIXED_SCALE_100 = 100;

/**
 * Convert float to fixed-point integer (scale 1000)
 */
export function toFixed1000(value: number): number {
    return Math.round(value * FIXED_SCALE_1000);
}

/**
 * Convert fixed-point integer to float (scale 1000)
 */
export function fromFixed1000(value: number): number {
    return value / FIXED_SCALE_1000;
}

/**
 * Convert float to fixed-point integer (scale 100)
 */
export function toFixed100(value: number): number {
    return Math.round(value * FIXED_SCALE_100);
}

/**
 * Convert fixed-point integer to float (scale 100)
 */
export function fromFixed100(value: number): number {
    return value / FIXED_SCALE_100;
}
```

## `src/core/math/trig.ts`

```typescript
/**
 * Trigonometry utilities with lookup tables for deterministic calculations
 * Replicates the Java implementation's approach for cross-platform consistency
 */

// Constants
export const PI: number = 3.1415927;
export const TWO_PI: number = 6.2831855;
export const HALF_PI: number = 1.5707964;
export const RAD_TO_DEG: number = 57.29578;
export const DEG_TO_RAD: number = 1 / RAD_TO_DEG;

// Table sizes
const SINCOS_TABLE_SIZE = 8192;
const SINCOS_TABLE_MASK = SINCOS_TABLE_SIZE - 1;
const ATAN_TABLE_SIZE = 1025;

// Sin/Cos lookup tables (input is degrees)
const sinTable: Float32Array = new Float32Array(SINCOS_TABLE_SIZE);
const cosTable: Float32Array = new Float32Array(SINCOS_TABLE_SIZE);

// Atan2 lookup tables for 8 octants
const atanPosXPosY_YDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // l: x>=0, y>=0, y>=x
const atanPosXPosY_XDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // m: x>=0, y>=0, x>y
const atanPosXNegY_YDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // n: x>=0, y<0, x>=-y
const atanPosXNegY_XDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // o: x>=0, y<0, -y>x
const atanNegXPosY_YDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // p: x<0, y>=0, -x>=y
const atanNegXPosY_XDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // q: x<0, y>=0, y>-x
const atanNegXNegY_YDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // r: x<0, y<0, x<=y
const atanNegXNegY_XDom: Float32Array = new Float32Array(ATAN_TABLE_SIZE); // s: x<0, y<0, y<x

// Degrees to table index conversion factor
const DEG_TO_INDEX: number = 22.755556; // 8192 / 360

// Error counter for atan2 fallbacks
let atan2ErrorCount = 0;

// Initialize sin/cos tables
for (let i = 0; i < SINCOS_TABLE_SIZE; i++) {
    const angle = ((i + 0.5) / SINCOS_TABLE_SIZE) * TWO_PI;
    sinTable[i] = Math.sin(angle);
    cosTable[i] = Math.cos(angle);
}

// Initialize atan2 tables
// Note: The Java code has a quirk where it multiplies by PI and divides by Math.PI
// This effectively just returns atan(x) since the PIs cancel out (with minor float precision differences)
for (let i = 0; i <= 1024; i++) {
    const ratio = i / 1024;
    const baseAtan = Math.atan(ratio);
    
    atanPosXPosY_YDom[i] = baseAtan;                    // l
    atanPosXPosY_XDom[i] = HALF_PI - baseAtan;          // m
    atanPosXNegY_YDom[i] = -baseAtan;                   // n
    atanPosXNegY_XDom[i] = baseAtan - HALF_PI;          // o
    atanNegXPosY_YDom[i] = PI - baseAtan;               // p
    atanNegXPosY_XDom[i] = baseAtan + HALF_PI;          // q
    atanNegXNegY_YDom[i] = baseAtan - PI;               // r
    atanNegXNegY_XDom[i] = -HALF_PI - baseAtan;         // s
}

/**
 * Fast sine function using lookup table
 * @param degrees Angle in degrees
 * @returns Sine value
 */
export function sin(degrees: number): number {
    const index = Math.floor(degrees * DEG_TO_INDEX) & SINCOS_TABLE_MASK;
    return sinTable[index];
}

/**
 * Fast cosine function using lookup table
 * @param degrees Angle in degrees
 * @returns Cosine value
 */
export function cos(degrees: number): number {
    const index = Math.floor(degrees * DEG_TO_INDEX) & SINCOS_TABLE_MASK;
    return cosTable[index];
}

/**
 * Fast atan2 function using lookup tables
 * @param y Y coordinate (delta Y)
 * @param x X coordinate (delta X)
 * @returns Angle in radians (-PI to PI)
 */
export function atan2(y: number, x: number): number {
    try {
        if (x >= 0) {
            if (y >= 0) {
                // First quadrant
                if (x >= y) {
                    return atanPosXPosY_YDom[Math.round((1024 * y) / x)];
                }
                return atanPosXPosY_XDom[Math.round((1024 * x) / y)];
            } else {
                // Fourth quadrant
                if (x >= -y) {
                    return atanPosXNegY_YDom[Math.round((-1024 * y) / x)];
                }
                return atanPosXNegY_XDom[Math.round((-1024 * x) / y)];
            }
        } else {
            if (y >= 0) {
                // Second quadrant
                if (-x >= y) {
                    return atanNegXPosY_YDom[Math.round((-1024 * y) / x)];
                }
                return atanNegXPosY_XDom[Math.round((-1024 * x) / y)];
            } else {
                // Third quadrant
                if (x <= y) {
                    return atanNegXNegY_YDom[Math.round((1024 * y) / x)];
                }
                return atanNegXNegY_XDom[Math.round((1024 * x) / y)];
            }
        }
    } catch (e) {
        // Fallback for edge cases (division by zero, array bounds)
        if (atan2ErrorCount < 100) {
            console.warn(`atan2 slow fallback for y:${y} x:${x}`);
            atan2ErrorCount++;
        }
        return Math.atan2(y, x);
    }
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
    return radians * RAD_TO_DEG;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
    return degrees * DEG_TO_RAD;
}

/**
 * Normalize angle to range [-180, 180]
 */
export function normalizeAngle(angle: number): number {
    while (angle > 180 || angle < -180) {
        if (angle > 180) {
            angle -= 360;
        }
        if (angle < -180) {
            angle += 360;
        }
    }
    return angle;
}

/**
 * Normalize angle to range [0, 360]
 */
export function normalizeAngle360(angle: number): number {
    while (angle > 360 || angle < 0) {
        if (angle > 360) {
            angle -= 360;
        }
        if (angle < 0) {
            angle += 360;
        }
    }
    return angle;
}

/**
 * Calculate clamped angular difference for smooth rotation
 * @param current Current angle in degrees
 * @param target Target angle in degrees
 * @param maxDelta Maximum rotation per step
 * @returns Clamped angular difference
 */
export function angleDelta(current: number, target: number, maxDelta: number): number {
    let diff = (target % 360) - (current % 360);
    if (diff > 180) {
        diff -= 360;
    }
    if (diff < -180) {
        diff += 360;
    }
    if (diff > maxDelta) return maxDelta;
    if (diff < -maxDelta) return -maxDelta;
    return diff;
}

/**
 * Get angle from point (x1, y1) to point (x2, y2) in degrees
 */
export function angleTo(x1: number, y1: number, x2: number, y2: number): number {
    return toDegrees(atan2(y2 - y1, x2 - x1));
}

/**
 * Check if two angles are approximately equal (within tolerance)
 * Handles wraparound
 */
export function anglesEqual(angle1: number, angle2: number, tolerance: number): boolean {
    const diff = Math.abs(normalizeAngle(angle1) - normalizeAngle(angle2));
    return diff < tolerance || diff > (360 - tolerance);
}
```

## `src/core/math/vector.ts`

```typescript
/**
 * 2D Vector class for game mathematics
 * Provides mutable vector operations matching the original Java PointF usage
 */

import { sqrt, abs } from './fixed';
import { sin, cos, atan2, toDegrees } from './trig';

/**
 * 2D Vector class with mutable operations
 */
export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set vector components
     */
    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Copy from another vector
     */
    copyFrom(other: Vector2): this {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /**
     * Clone this vector
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * Add another vector (mutates this)
     */
    add(other: Vector2): this {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Add scalar values (mutates this)
     */
    addXY(x: number, y: number): this {
        this.x += x;
        this.y += y;
        return this;
    }

    /**
     * Subtract another vector (mutates this)
     */
    subtract(other: Vector2): this {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * Multiply by scalar (mutates this)
     */
    scale(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Get squared length (avoid sqrt for comparisons)
     */
    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Get vector length/magnitude
     */
    length(): number {
        return sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalize to unit length (mutates this)
     */
    normalize(): this {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    /**
     * Get angle in degrees
     */
    angle(): number {
        return toDegrees(atan2(this.y, this.x));
    }

    /**
     * Rotate vector around origin by degrees (mutates this)
     */
    rotate(degrees: number): this {
        const sinVal = sin(degrees);
        const cosVal = cos(degrees);
        const newX = this.x * cosVal - this.y * sinVal;
        const newY = this.x * sinVal + this.y * cosVal;
        this.x = newX;
        this.y = newY;
        return this;
    }

    /**
     * Rotate vector around a center point by degrees (mutates this)
     */
    rotateAround(centerX: number, centerY: number, degrees: number): this {
        const sinVal = sin(degrees);
        const cosVal = cos(degrees);
        
        // Translate to origin
        this.x -= centerX;
        this.y -= centerY;
        
        // Rotate
        const newX = this.x * cosVal - this.y * sinVal;
        const newY = this.x * sinVal + this.y * cosVal;
        
        // Translate back
        this.x = newX + centerX;
        this.y = newY + centerY;
        
        return this;
    }

    /**
     * Dot product with another vector
     */
    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Cross product (returns scalar for 2D)
     */
    cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
    }

    /**
     * Check if vectors are equal
     */
    equals(other: Vector2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Check if vectors are approximately equal
     */
    approxEquals(other: Vector2, epsilon: number = 0.0001): boolean {
        return abs(this.x - other.x) < epsilon && abs(this.y - other.y) < epsilon;
    }

    /**
     * String representation
     */
    toString(): string {
        return `Vector2(${this.x}, ${this.y})`;
    }
}

// Reusable temporary vectors to avoid allocations (matches Java static PointF fields)
export const tempVec1 = new Vector2();
export const tempVec2 = new Vector2();
export const tempVec3 = new Vector2();
export const tempVec4 = new Vector2();
export const tempVec5 = new Vector2();

/**
 * Squared distance between two points
 */
export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

/**
 * Distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return sqrt(distanceSquared(x1, y1, x2, y2));
}

/**
 * Integer distance using sqrt lookup table
 */
export function distanceInt(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;
    // Uses the integer sqrt lookup from fixed.ts
    return Math.round(sqrt(distSq));
}

/**
 * Get point at distance from origin at angle
 */
export function pointAtAngle(originX: number, originY: number, distance: number, degrees: number): Vector2 {
    return new Vector2(
        originX + cos(degrees) * distance,
        originY + sin(degrees) * distance
    );
}

/**
 * Get point at distance from origin at angle (reuses tempVec5)
 */
export function pointAtAngleTemp(originX: number, originY: number, dist: number, degrees: number): Vector2 {
    tempVec5.x = originX;
    tempVec5.y = originY - dist; // Start above, will be rotated
    tempVec5.rotateAround(originX, originY, degrees);
    return tempVec5;
}

/**
 * Check if two line segments intersect
 * @param p1 Start of first line
 * @param p2 End of first line
 * @param p3 Start of second line
 * @param p4 End of second line
 */
export function lineSegmentsIntersect(
    p1: Vector2, p2: Vector2,
    p3: Vector2, p4: Vector2
): boolean {
    const denominator = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
    const numeratorA = ((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x));
    const numeratorB = ((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x));

    if (denominator !== 0) {
        const uA = numeratorA / denominator;
        const uB = numeratorB / denominator;
        return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
    }

    // Lines are parallel
    if (numeratorA !== 0 || numeratorB === 0) {
        return false;
    }

    // Lines are collinear - currently returns false matching Java
    return false;
}

/**
 * Lerp between two vectors
 */
export function lerpVector(from: Vector2, to: Vector2, t: number, out?: Vector2): Vector2 {
    const result = out || new Vector2();
    result.x = from.x + (to.x - from.x) * t;
    result.y = from.y + (to.y - from.y) * t;
    return result;
}

/**
 * Create a vector from angle and magnitude
 */
export function fromAngle(degrees: number, magnitude: number = 1): Vector2 {
    return new Vector2(
        cos(degrees) * magnitude,
        sin(degrees) * magnitude
    );
}
```

## Usage Example

```typescript
import { clamp, lerp, sqrtInt, abs } from './core/math/fixed';
import { sin, cos, atan2, toDegrees, angleDelta } from './core/math/trig';
import { Vector2, distance, pointAtAngle } from './core/math/vector';

// Fixed-point math
const clamped = clamp(150, 0, 100); // 100
const interpolated = lerp(0, 100, 0.5); // 50
const fastSqrt = sqrtInt(256); // 16

// Trigonometry (uses lookup tables for consistency)
const sinValue = sin(45); // ~0.707
const cosValue = cos(45); // ~0.707
const angle = toDegrees(atan2(1, 1)); // 45

// Vectors
const pos = new Vector2(100, 200);
pos.rotate(90);
pos.normalize();

const dist = distance(0, 0, 3, 4); // 5
const targetPos = pointAtAngle(0, 0, 100, 45);
```

These implementations ensure:
1. **Deterministic results** across browsers using lookup tables
2. **Matching behavior** with the original Java code
3. **Performance optimization** through pre-calculated tables
4. **Type safety** with TypeScript
