// 初始化并导入 WebAssembly 模块
// 加载由 wasm-pack 生成的 JS 入口（会自动拉取 .wasm）
/** 初始化 WebAssembly 模块，返回导出函数对象 */
export async function initWasm() {
  const stats = document.getElementById('stats');
  stats.textContent = '状态：正在加载 WebAssembly 模块（rust_math）...';
  const mod = await import('./pkg/rust_math.js');
  // wasm-pack web 目标通常需要调用默认导出 init()
  if (typeof mod.default === 'function') {
    await mod.default();
  }
  stats.textContent = '状态：WebAssembly 模块加载完成';
  return mod;
}

/** 使用 JS 迭代实现阶乘 */
function jsFactorialIter(n) {
  let acc = 1n;
  for (let i = 2n; i <= BigInt(n); i++) acc *= i;
  return acc;
}

/** 使用 JS 递归实现阶乘（演示用） */
function jsFactorialRec(n) {
  if (n <= 1) return 1n;
  return BigInt(n) * jsFactorialRec(n - 1);
}

/** 将矩阵乘法输入生成随机数组（Float64Array） */
function makeRandArray(n, seed = 123) {
  const out = new Float64Array(n * n);
  let x = seed >>> 0;
  for (let i = 0; i < out.length; i++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out[i] = (x / 0xffffffff) - 0.5;
  }
  return out;
}

/** 计时器辅助方法 */
async function measure(label, fn) {
  const t0 = performance.now();
  const res = await fn();
  const t1 = performance.now();
  return { label, ms: Math.round(t1 - t0), res };
}

/** 将错误安全打印到状态栏与控制台 */
function safeError(stats, err) {
  stats.textContent = '错误：' + (err?.message || String(err));
  console.error(err);
}

/** 主入口：绑定事件并运行演示 */
async function main() {
  const stats = document.getElementById('stats');
  const out = document.getElementById('out');
  const btnFact = document.getElementById('btnFact');
  const btnMat = document.getElementById('btnMat');
  const btnClear = document.getElementById('btnClear');
  const factN = document.getElementById('factN');
  const matN = document.getElementById('matN');

  const wasm = await initWasm();

  btnClear.addEventListener('click', () => {
    out.textContent = '';
    stats.textContent = '状态：已清空';
  });

  // 阶乘性能对比：JS vs WASM(Rust)
  btnFact.addEventListener('click', async () => {
    const n = Number(factN.value);
    if (!Number.isInteger(n) || n < 0 || n > 25) {
      stats.textContent = '错误：n 需为 0..25 的整数';
      return;
    }
    try {
      out.textContent = '';
      stats.textContent = `状态：运行阶乘对比，n=${n}`;
  
      const m1 = await measure('JS 迭代阶乘', () => jsFactorialIter(n));
      const m2 = await measure('JS 递归阶乘', () => jsFactorialRec(n));
      const m3 = await measure('WASM(Rust) 迭代阶乘', () => wasm.factorial_iter(n));
      const m4 = await measure('WASM(Rust) 递归阶乘', () => wasm.factorial_rec(n));
  
      out.textContent += `${m1.label}: ${m1.ms}ms, 结果=${m1.res}\n`;
      out.textContent += `${m2.label}: ${m2.ms}ms, 结果=${m2.res}\n`;
      out.textContent += `${m3.label}: ${m3.ms}ms, 结果=${m3.res}\n`;
      out.textContent += `${m4.label}: ${m4.ms}ms, 结果=${m4.res}\n`;
      stats.textContent = '状态：阶乘对比完成（查看输出）';
    } catch (err) {
      safeError(stats, err);
    }
  });

  // 矩阵乘法：生成两个随机矩阵并在 WASM 中计算
  btnMat.addEventListener('click', async () => {
    const n = Number(matN.value);
    if (!Number.isInteger(n) || n < 2 || n > 256) {
      stats.textContent = '错误：n 需为 2..256 的整数';
      return;
    }
    try {
      out.textContent = '';
      stats.textContent = `状态：运行矩阵乘法，n=${n}`;
  
      const a = makeRandArray(n, 123);
      const b = makeRandArray(n, 456);
  
      const mWasm = await measure('WASM(Rust) 矩阵乘法', () =>
        wasm.mat_mul(Array.from(a), Array.from(b), n)
      );
  
      // 简易 JS 基线（非常慢，仅小 n 使用）
      const mJs = await measure('JS 基线矩阵乘法', () => {
        const c = new Float64Array(n * n);
        for (let i = 0; i < n; i++) {
          for (let k = 0; k < n; k++) {
            const aik = a[i * n + k];
            for (let j = 0; j < n; j++) {
              c[i * n + j] += aik * b[k * n + j];
            }
          }
        }
        return c;
      });
  
      out.textContent += `${mWasm.label}: ${mWasm.ms}ms, 输出长度=${mWasm.res.length}\n`;
      out.textContent += `${mJs.label}: ${mJs.ms}ms, 输出长度=${mJs.res.length}\n`;
      stats.textContent = '状态：矩阵乘法完成（查看输出）';
    } catch (err) {
      safeError(stats, err);
    }
  });
}

main().catch((e) => {
  const stats = document.getElementById('stats');
  stats.textContent = '错误：' + e.message;
  console.error(e);
});
