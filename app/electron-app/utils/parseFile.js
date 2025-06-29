const generateAst = async () => {
  const data = await fs.promises.readFile(filePath, 'utf8'); // 使用 promises 版本避免阻塞主线程
};

module.exports = {
  generateAst,
};
