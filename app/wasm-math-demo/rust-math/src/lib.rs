use wasm_bindgen::prelude::*;

/// 计算阶乘（迭代版）
/// n: 输入的非负整数
/// 返回: n! 的结果；当 n 很大时可能溢出
#[wasm_bindgen]
pub fn factorial_iter(n: u32) -> u64 {
    let mut acc: u64 = 1;
    for i in 2..=n {
        acc = acc.saturating_mul(i as u64);
    }
    acc
}

/// 计算阶乘（递归版）
/// n: 输入的非负整数
/// 返回: n! 的结果；当 n 很大时可能溢出
#[wasm_bindgen]
pub fn factorial_rec(n: u32) -> u64 {
    if n <= 1 {
        1
    } else {
        let prev = factorial_rec(n - 1);
        prev.saturating_mul(n as u64)
    }
}

/// 矩阵乘法（方阵）
/// a: 长度为 n*n 的一维数组，表示左矩阵，按行存储
/// b: 长度为 n*n 的一维数组，表示右矩阵，按行存储
/// n: 方阵维度
/// 返回: 长度为 n*n 的乘积矩阵，按行存储
#[wasm_bindgen]
pub fn mat_mul(a: Vec<f64>, b: Vec<f64>, n: usize) -> Vec<f64> {
    if a.len() != n * n || b.len() != n * n {
        return Vec::new();
    }
    let mut c = vec![0.0_f64; n * n];
    for i in 0..n {
        for k in 0..n {
            let aik = a[i * n + k];
            for j in 0..n {
                c[i * n + j] += aik * b[k * n + j];
            }
        }
    }
    c
}

/// 生成随机矩阵（线性同余伪随机）
/// n: 方阵维度
/// seed: 随机种子
/// 返回: 长度为 n*n 的一维数组
#[wasm_bindgen]
pub fn make_rand_matrix(n: usize, seed: u32) -> Vec<f64> {
    let mut out = vec![0.0_f64; n * n];
    let mut x = seed.wrapping_mul(1664525).wrapping_add(1013904223);
    for i in 0..(n * n) {
        // 简易 LCG 生成 0..1 之间的浮点数
        x = x.wrapping_mul(1664525).wrapping_add(1013904223);
        let v = (x as f64 / u32::MAX as f64) - 0.5;
        out[i] = v;
    }
    out
}

