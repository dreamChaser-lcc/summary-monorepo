module.exports = function (types) {
  // console.log('🚀 ~ types:', types);
  return {
    visitor: {
      // Identifier(path) {
      //   console.log('🚀 ~ Identifier ~ path:', path);
      //   const name = path.node.name;
      //   // reverse the name: JavaScript -> tpircSavaJ
      //   path.node.name = name.split('').reverse().join('');
      // },
      IfStatement(path) {
        console.log('IfStatement', this);
      },
    },
  };
};
