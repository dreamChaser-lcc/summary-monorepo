module.exports = {
  plugins: [
    [
      "postcss-preset-env",
      {
        // autoprefixer: true,
        stage: 3, // 兼容新特性转换
      },// Options
    ],
    [
      "postcss-pxtorem",
      {
        rootValue: 75, // 1rem = 75px
        unitPrecision: 5, // 转换后保留小数点后5位
        propList: ['font', 'font-size', 'line-height', 'letter-spacing'], // 需要转换的属性
        selectorBlackList: [],
        replace: true,
        mediaQuery: false,
        minPixelValue: 0,
        exclude: /node_modules/i,
        unit: 'px', // 要替换的单位
      },
    ],
  ],
}