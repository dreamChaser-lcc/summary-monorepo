/**
 * 构建表格的三角形顶点
 * @param {number} rows
 * @param {number} cols
 * @param {number} cellWidth
 * @param {number} cellHeight
 * @returns {Float32Array}
 */
function buildGridVertices(rows, cols, cellWidth, cellHeight) {
  const totalFloats = rows * cols * 12; // 2 triangles * 3 vertices * 2 coords
  const vertices = new Float32Array(totalFloats);
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellHeight;
    const y1 = y0 + cellHeight - 1;
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellWidth;
      const x1 = x0 + cellWidth - 1;

      // Triangle 1
      vertices[idx++] = x0; vertices[idx++] = y0;
      vertices[idx++] = x1; vertices[idx++] = y0;
      vertices[idx++] = x0; vertices[idx++] = y1;

      // Triangle 2
      vertices[idx++] = x1; vertices[idx++] = y0;
      vertices[idx++] = x1; vertices[idx++] = y1;
      vertices[idx++] = x0; vertices[idx++] = y1;
    }
  }
  return vertices;
}

self.onmessage = (e) => {
  const { rows, cols, cellWidth, cellHeight } = e.data;
  const vertices = buildGridVertices(rows, cols, cellWidth, cellHeight);
  
  // Transfer buffer ownership for zero-copy
  self.postMessage({ vertices }, [vertices.buffer]);
};
