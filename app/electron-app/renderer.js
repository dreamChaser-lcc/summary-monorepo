function onLoad() {
  const ele = document.querySelector('#useApi');
  ele.addEventListener('click', async () => {
    console.log('inin我被点击了');
    const file = await window.api.readFile(
      'D:/Project/summary-monorepo/app/electron-app/configFile/nginx.conf',
    );
    document.querySelector('#renderFile').innerText = file;
  });
}

onLoad();
