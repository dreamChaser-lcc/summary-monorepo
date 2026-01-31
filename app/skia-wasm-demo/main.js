/* global CanvasKitInit */

/**
 * 初始化 CanvasKit 并返回上下文对象
 * @returns {Promise<{ck:any, surface:any, canvas:any}>} CanvasKit 实例、Surface、Canvas
 */
async function initCanvasKit() {
  const wasmUrl = 'https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.wasm';
  document.getElementById('stats').textContent = `正在加载 WASM 引擎: ${wasmUrl} ...`;

  const ck = await CanvasKitInit({
    locateFile: (file) => wasmUrl,
  });
  console.log('CanvasKit (WASM) loaded:', ck);

  // Load font for text rendering
  const fontData = await fetch('https://storage.googleapis.com/skia-cdn/misc/Roboto-Regular.ttf')
    .then((resp) => resp.arrayBuffer());
  const typeface = ck.Typeface.MakeFreeTypeFaceFromData(fontData);

  const surface = ck.MakeCanvasSurface('skCanvas');
  if (!surface) throw new Error('无法创建 CanvasSurface');
  const canvas = surface.getCanvas();
  return { ck, surface, canvas, typeface };
}

/**
 * 绘制表格标题和表头
 */
function drawHeader(ck, canvas, width, cellWidth, typeface) {
  const PaintCtor = ck.SkPaint || ck.Paint;
  const paint = PaintCtor.prototype ? new PaintCtor() : PaintCtor();
  const font = new ck.Font(typeface, 24);
  const smallFont = new ck.Font(typeface, 14);

  // Title
  paint.setColor(ck.Color(255, 255, 255, 1));
  const title = "High Performance Data Grid (Skia)";
  // Simple centering approximation
  canvas.drawText(title, width / 2 - 150, 40, paint, font);

  // Header Row Background
  paint.setColor(ck.Color(40, 45, 60, 1));
  canvas.drawRect(ck.XYWHRect(0, 60, width, 30), paint);

  // Header Columns
  paint.setColor(ck.Color(200, 200, 200, 1));
  let x = 0;
  let colIdx = 1;
  while (x < width) {
    canvas.drawText(`Col ${colIdx}`, x + 5, 80, paint, smallFont);
    x += cellWidth;
    colIdx++;
  }

  font.delete();
  smallFont.delete();
  paint.delete();
  
  return 90; // Header height offset
}

/**
 * 绘制单元格文本（仅在 Naive 模式或 Vertices 叠加模式下使用）
 */
function drawCellTexts(ck, canvas, rows, cols, cellWidth, cellHeight, offsetY, typeface) {
  const PaintCtor = ck.SkPaint || ck.Paint;
  const paint = PaintCtor.prototype ? new PaintCtor() : PaintCtor();
  paint.setColor(ck.Color(255, 255, 255, 0.8));
  const font = new ck.Font(typeface, 12);

  // 限制文本绘制数量以避免浏览器完全卡死，或者仅绘制可见区域
  // 为演示全量数据压力，这里我们还是循环，但只画数字
  // 注意：在 WASM 中 50000 次 drawText 调用极其昂贵
  
  for (let r = 0; r < rows; r++) {
    const y = offsetY + r * cellHeight;
    // Simple viewport culling optimization: don't draw if out of initial screen
    // But user wants "mass data", so we draw until some limit or all
    // Let's just draw first 100 rows for text to show it works, otherwise it's too slow for JS loop
    // Or if rows is small, draw all.
    
    // NOTE: To truly stress test Skia drawing, we should try to draw all, 
    // but JS loop overhead might dominate. 
    // Let's draw text for every cell.
    
    for (let c = 0; c < cols; c++) {
      const x = c * cellWidth;
      // Random number
      const val = (Math.random() * 1000).toFixed(1);
      canvas.drawText(val, x + 5, y + cellHeight - 5, paint, font);
    }
  }

  font.delete();
  paint.delete();
}

/**
 * 基线方案：逐格调用 Skia 绘制矩形
 * @param {any} ck CanvasKit
 * @param {any} canvas SkCanvas
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @param {number} cellWidth 单元格宽度
 * @param {number} cellHeight 单元格高度
 * @param {any} typeface 字体
 */
function drawNaive(ck, canvas, rows, cols, cellWidth, cellHeight, typeface) {
  const offsetY = drawHeader(ck, canvas, cols * cellWidth, cellWidth, typeface);

  const PaintCtor = ck.SkPaint || ck.Paint;
  if (!PaintCtor) throw new Error('Paint unavailable');
  const paint = PaintCtor.prototype ? new PaintCtor() : PaintCtor();
  paint.setAntiAlias(false); // 表格通常不需要抗锯齿，且关闭更快
  paint.setColor(ck.Color(120, 200, 255, 1));
  paint.setStyle(ck.PaintStyle.Fill); // 统一使用填充模式，便于对比
  // paint.setStrokeWidth(1);

  // 复用矩形对象以减少 GC，聚焦于 drawRect 的调用开销
  const rect = new Float32Array(4);
  const textPaint = PaintCtor.prototype ? new PaintCtor() : PaintCtor();
  textPaint.setColor(ck.Color(0, 0, 0, 1));
  const font = new ck.Font(typeface, 10);

  for (let r = 0; r < rows; r++) {
    const y = offsetY + r * cellHeight;
    for (let c = 0; c < cols; c++) {
      const x = c * cellWidth;
      
      // manually set LTRB, leave 1px gap to show grid structure
      rect[0] = x;
      rect[1] = y;
      rect[2] = x + cellWidth - 1;
      rect[3] = y + cellHeight - 1;
      
      // Vary color slightly to show "data"
      // (Optimization: don't make new color every time if possible, but here we want to test draw overhead)
      // paint.setColor(ck.Color(100 + (r%50)*2, 200 - (c%20)*5, 255, 1)); 
      // Using static color for fair comparison with Vertices (unless Vertices uses vertex colors)
      
      canvas.drawRect(rect, paint);
      
      // Draw Text
      const val = (Math.random() * 999).toFixed(0);
      canvas.drawText(val, x + 2, y + cellHeight - 4, textPaint, font);
    }
  }
  paint.delete();
  textPaint.delete();
  font.delete();
}

/**
 * 将表格转为三角形顶点（每个单元格用两个三角形组成矩形）
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @param {number} cellWidth 宽
 * @param {number} cellHeight 高
 * @returns {Array<number>} 扁平顶点数组 [x,y, x,y, ...]
 */
function buildVerticesSync(rows, cols, cellWidth, cellHeight) {
  // 每个单元格 2 个三角形 = 6 个顶点 = 12 个坐标
  const totalFloats = rows * cols * 12;
  const vertices = new Float32Array(totalFloats);
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellHeight;
    const y1 = y0 + cellHeight - 1;
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellWidth;
      const x1 = x0 + cellWidth - 1;

      // 三角形 1: (x0,y0) -> (x1,y0) -> (x0,y1)
      vertices[idx++] = x0; vertices[idx++] = y0;
      vertices[idx++] = x1; vertices[idx++] = y0;
      vertices[idx++] = x0; vertices[idx++] = y1;

      // 三角形 2: (x1,y0) -> (x1,y1) -> (x0,y1)
      vertices[idx++] = x1; vertices[idx++] = y0;
      vertices[idx++] = x1; vertices[idx++] = y1;
      vertices[idx++] = x0; vertices[idx++] = y1;
    }
  }
  return vertices;
}

/**
 * 使用 Web Worker 构建顶点
 */
function buildVerticesInWorker(rows, cols, cellWidth, cellHeight) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { type: 'module' });
    worker.onmessage = (e) => {
      resolve(e.data.vertices);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    worker.postMessage({ rows, cols, cellWidth, cellHeight });
  });
}

/**
 * 使用 SkVertices 批量提交绘制，减少 JS→WASM 调用开销
 * @param {any} ck CanvasKit
 * @param {any} canvas SkCanvas
 * @param {Array<Array<number>>} vertices 顶点数组
 * @param {number} width 
 * @param {number} cellWidth 
 * @param {any} typeface
 * @param {number} rows
 * @param {number} cols
 * @param {number} cellHeight
 */
function drawVertices(ck, canvas, vertices, width, cellWidth, typeface, rows, cols, cellHeight) {
  const offsetY = drawHeader(ck, canvas, width, cellWidth, typeface);
  
  // Transform canvas to account for header offset, because vertices are generated from (0,0)
  canvas.save();
  canvas.translate(0, offsetY);

  const PaintCtor = ck.SkPaint || ck.Paint;
  if (!PaintCtor) throw new Error('Paint unavailable');
  const paint = PaintCtor.prototype ? new PaintCtor() : PaintCtor();
  paint.setAntiAlias(false);
  paint.setColor(ck.Color(120, 255, 160, 1));
  paint.setStyle(ck.PaintStyle.Fill);

  const MakeVertices = ck.MakeSkVertices || ck.MakeVertices;
  const skVertices = MakeVertices(
    ck.VertexMode.Triangles,
    vertices,
    null,
    null,
    false
  );
  canvas.drawVertices(skVertices, ck.BlendMode.Src, paint);
  skVertices.delete();
  paint.delete();
  
  canvas.restore(); // Restore translation

  // Draw Text on top (Naive loop, sadly)
  // For Vertices demo, we often omit text to show pure geometry speed, 
  // but if user demands text, we must loop.
  // Note: This will slow down "Vertices" mode significantly if rows are huge.
  // But the "background" drawing is still faster.
  drawCellTexts(ck, canvas, rows, cols, cellWidth, cellHeight, offsetY, typeface);
}

function clearCanvas(ck, canvas) {
  canvas.clear(ck.Color(12, 15, 20, 1));
}

async function measure(el, label, fn) {
  const t0 = performance.now();
  await fn();
  const t1 = performance.now();
  const ms = Math.round(t1 - t0);
  el.textContent += `\n${label}：${ms}ms`;
  return ms;
}

async function main() {
  const statsEl = document.getElementById('stats');
  const rowsRange = document.getElementById('rowsRange');
  const rowsInput = document.getElementById('rowsInput');
  const colsRange = document.getElementById('colsRange');
  const colsInput = document.getElementById('colsInput');
  const heightRange = document.getElementById('heightRange');
  const heightInput = document.getElementById('heightInput');

  const btnNaive = document.getElementById('btnNaive');
  const btnVertices = document.getElementById('btnVertices');
  const btnClear = document.getElementById('btnClear');
  const useWorkerEl = document.getElementById('useWorker');

  const { ck, surface, canvas, typeface } = await initCanvasKit();
  statsEl.textContent = '状态：CanvasKit 初始化完成';

  function syncRangeInput(range, input) {
    range.addEventListener('input', () => (input.value = range.value));
    input.addEventListener('input', () => (range.value = input.value));
  }
  syncRangeInput(rowsRange, rowsInput);
  syncRangeInput(colsRange, colsInput);
  syncRangeInput(heightRange, heightInput);

  btnClear.addEventListener('click', () => {
    clearCanvas(ck, canvas);
    surface.flush();
    statsEl.textContent = '状态：已清空';
  });

  // 获取当前参数
  const getParams = () => ({
    rows: Number(rowsInput.value),
    cols: Number(colsInput.value),
    cellHeight: Number(heightInput.value),
    cellWidth: surface.width() / Number(colsInput.value) // 宽度自适应
  });

  btnNaive.addEventListener('click', async () => {
    const { rows, cols, cellWidth, cellHeight } = getParams();
    statsEl.textContent = `状态：逐格绘制，行=${rows}，列=${cols}`;
    clearCanvas(ck, canvas);

    await measure(statsEl, 'Loop DrawRect+Text', () => {
      drawNaive(ck, canvas, rows, cols, cellWidth, cellHeight, typeface);
    });
    surface.flush();
    statsEl.textContent += `\n完成：${rows * cols} 个单元格`;
  });

  btnVertices.addEventListener('click', async () => {
    const { rows, cols, cellWidth, cellHeight } = getParams();
    const useWorker = useWorkerEl.checked;
    statsEl.textContent = `状态：批量绘制，行=${rows}，列=${cols}，Worker=${useWorker}`;
    clearCanvas(ck, canvas);

    let vertices;
    if (useWorker) {
      await measure(statsEl, 'Worker 构建顶点', async () => {
        vertices = await buildVerticesInWorker(rows, cols, cellWidth, cellHeight);
      });
    } else {
      await measure(statsEl, '主线程构建顶点', () => {
        vertices = buildVerticesSync(rows, cols, cellWidth, cellHeight);
      });
    }

    await measure(statsEl, 'SkVertices+Text 提交', () => {
      drawVertices(ck, canvas, vertices, surface.width(), cellWidth, typeface, rows, cols, cellHeight);
    });
    surface.flush();
    statsEl.textContent += `\n完成：${rows * cols} 个单元格（${vertices.length / 2} 顶点）`;
  });
}

main().catch((e) => {
  document.getElementById('stats').textContent = '错误：' + e.message;
  console.error(e);
});
