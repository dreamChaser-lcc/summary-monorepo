const listWrap = document.createElement('div');
listWrap.style= "padding:12px;border:1px solid #c3c3c3"

listWrap.innerHTML ='App1共享模块添加的内容'
const listObj = [
    { name: 'iframe' },
    { name: '路由分发方式' },
    { name: 'module-federation' },
    { name: 'single-spa', time:'较早'},
    { name: 'qiankun', team: '阿里' , time:'2019' },
    { name: 'EMP', team: '百度', time: 2020 },
    { name: 'wujie', team: '腾讯',time: 2021 },
    { name: 'micro-app', team: '京东' ,time: '2023.10'},
];

listObj.forEach(item=>{
    const p = document.createElement('p');
    p.innerHTML = `微前端解决${item.time?'框架':'方案'}: ${item.name}。${item.team ? ' team: ' + item.team: ''}${item.time ? '发布时间：' + item.time : ''}`;
    listWrap.appendChild(p);
});

export const addList = ()=>{
    document.body.appendChild(listWrap);
}