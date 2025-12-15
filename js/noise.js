/**
 * Seeded Random Number Generator and Simplex Noise 2D Implementation
 * 
 * Usage:
 * 1. Call initSeed(12345) to set the seed.
 * 2. Call noise2D(x, y) to get a value between -1 and 1.
 */

// --- Internal State ---
let _seed = 0;
let _perm = new Uint8Array(512);
let _permMod12 = new Uint8Array(512);

// --- Mulberry32 Seeded RNG ---
// Returns a float between 0 and 1
function _mulberry32() {
    let t = _seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// --- Initialization ---
/**
 * Initializes the RNG and the Simplex Noise permutation table with a specific seed.
 * @param {number} seed - The seed value (integer recommended).
 */
function initSeed(seed) {
    _seed = Math.floor(seed);
    
    // Initialize permutation table
    for (let i = 0; i < 256; i++) {
        _perm[i] = i;
    }

    // Shuffle using the seeded RNG (Fisher-Yates shuffle)
    for (let i = 0; i < 255; i++) {
        const r = i + ~~( _mulberry32() * (256 - i));
        const aux = _perm[i];
        _perm[i] = _perm[r];
        _perm[r] = aux;
    }

    // Duplicate the permutation table to avoid overflow checks
    for (let i = 0; i < 256; i++) {
        _perm[256 + i] = _perm[i];
        _permMod12[i] = _permMod12[256 + i] = _perm[i] % 12;
    }
}

// --- Simplex Noise 2D ---
// Skewing and Unskewing factors for 2D
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

// Gradient vectors for 2D (directions from center to edges of a hexagon)
const _grad3 = new Float32Array([
    1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
    1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
    0, 1, 1,   0, -1, 1, 0, 1, -1,   0, -1, -1
]);

/**
 * Generates 3D Simplex Noise.
 * @param {number} xin - X coordinate.
 * @param {number} yin - Y coordinate.
 * @param {number} zin - Z coordinate.
 * @returns {number} Noise value roughly between -1.0 and 1.0.
 */
function noise3D(xin, yin, zin) {
    let n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    const s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);

    const t = (i + j + k) * G3;
    const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0; // The x,y,z distances from the cell origin
    const y0 = yin - Y0;
    const z0 = zin - Z0;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords

    if (x0 >= y0) {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // X Y Z order
        else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } // X Z Y order
        else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } // Z X Y order
    } else { // x0 < y0
        if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } // Z Y X order
        else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } // Y Z X order
        else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // Y X Z order
    }

    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    const x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
        const gi0 = _permMod12[ii + _perm[jj + _perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (_grad3[gi0] * x0 + _grad3[gi0 + 1] * y0 + _grad3[gi0 + 2] * z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
        const gi1 = _permMod12[ii + i1 + _perm[jj + j1 + _perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (_grad3[gi1] * x1 + _grad3[gi1 + 1] * y1 + _grad3[gi1 + 2] * z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
        const gi2 = _permMod12[ii + i2 + _perm[jj + j2 + _perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (_grad3[gi2] * x2 + _grad3[gi2 + 1] * y2 + _grad3[gi2 + 2] * z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
        const gi3 = _permMod12[ii + 1 + _perm[jj + 1 + _perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (_grad3[gi3] * x3 + _grad3[gi3 + 1] * y3 + _grad3[gi3 + 2] * z3);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3);
}

/**
 * Generates 2D Simplex Noise.
 * @param {number} xin - X coordinate.
 * @param {number} yin - Y coordinate.
 * @returns {number} Noise value roughly between -1.0 and 1.0.
 */
function noise2D(xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    const s = (xin + yin) * F2; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);

    const t = (i + j) * G2;
    const X0 = i - t; // Unskew the cell origin back to (x,y) space
    const Y0 = j - t;
    const x0 = xin - X0; // The x,y distances from the cell origin
    const y0 = yin - Y0;

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        i1 = 1; j1 = 0; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    } else {
        i1 = 0; j1 = 1; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0.0;
    } else {
        const gi0 = _permMod12[ii + _perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (_grad3[gi0] * x0 + _grad3[gi0 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0.0;
    } else {
        const gi1 = _permMod12[ii + i1 + _perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (_grad3[gi1] * x1 + _grad3[gi1 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0.0;
    } else {
        const gi2 = _permMod12[ii + 1 + _perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (_grad3[gi2] * x2 + _grad3[gi2 + 1] * y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
}
