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
        propList: ["*"], // 需要转换的属性
        selectorBlackList: [],
        replace: true,
        mediaQuery: false,
        minPixelValue: 0,
        exclude: /node_modules/i,
        include: ["./src/vw-transform-page/*"],
        unit: 'px', // 要替换的单位
      },
    ],
    [
      // postcss-px-to-viewport上传到npm这个包的版本较旧,不支持注释取消自动转换;
      // 若要注释取消转换功能用下一个包,或者修改源码再发个包代替
      "postcss-px-to-viewport-8-plugin",
      // "@reaf-toolkit/postcss-px-to-viewport",
      {
        unitToConvert: 'px',
        viewportWidth: 750,
        unitPrecision: 5,
        propList: ['*'],
        viewportUnit: 'vw',
        fontViewportUnit: 'vw',
        selectorBlackList: [], // 添加需要忽略的选择器
        minPixelValue: 1,
        mediaQuery: false,
        replace: true,
        exclude: [/node_modules/i, /rem-transform-page/i, /assets/i], // 添加需要忽略转换vw的文件目录
        landscape: false,
        landscapeUnit: 'vw',
        landscapeWidth: 568
      }
    ]
  ],
}