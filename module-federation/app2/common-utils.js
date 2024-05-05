
const wrap = document.createElement('div');
wrap.style= "padding:12px;border:1px solid #c3c3c3;margin-top:12px"

wrap.innerHTML ='App2共享模块添加的内容'

export const addContent = ()=>{
    document.body.appendChild(wrap)
}