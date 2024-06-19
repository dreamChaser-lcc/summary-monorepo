<!--
 * @Author: lcc
 * @Date: 2024-06-10 19:38:45
 * @LastEditTime: 2024-06-20 03:13:41
 * @LastEditors: lcc
 * @Description: 分片上传文件，暂时没有做断点续传
-->

<script lang="ts" setup>
import MLayout from '@components/m-layout/index.vue';
import { onMounted, ref } from 'vue';

const imgFile = ref<File>();
const chunkListRef = ref<any[]>([]);
onMounted(() => {});

// worker开启线程
const worker = new Worker(new URL('./components/worker-md5/worker.js', import.meta.url));
worker.onmessage = ({ data: chunkList }) => {
  chunkListRef.value = chunkList;
};

const onFileChange = (event: Event) => {
  const target = event.target as any;
  const files = target.files[0];
  imgFile.value = files;
  worker.postMessage({ file: files, chunkSize: 100 * 1024 });
};

/**执行web worker中的分片任务 */
const handleSplitFile = () => {
  if (!imgFile.value) {
    return window.alert('请先上传文件');
  }
  worker.postMessage({ file: imgFile.value });
};

// 合并分片 验证是否切割正确
const mergeFile = () => {
  const blobList = chunkListRef.value.map((item) => item.chunk);
  if (!blobList.length) {
    return window.alert('请先上传文件');
  }
  // 创建一个新的 Blob 对象用于存储合并后的文件内容
  const mergedBlob = new Blob(blobList, { type: 'image/jpg' });
  // 创建一个新的 FileReader 对象
  const reader = new FileReader();
  // 读取合并后的 Blob 对象
  reader.onload = function (event: any) {
    // const img = new Image();
    // img.setAttribute('style', 'width:200px;height:200px;object-fit:contain');
    // img.onload = function () {
    //   // 图片加载完成后，可以将其显示在页面上或进行其他操作
    //   document.body.appendChild(img);
    // };
    // // 将合并后的 Blob 对象转换为 Data URL
    // const dataURL = event.target.result;
    // // 设置 Image 对象的 src 为合并后的图片 Data URL
    // img.src = dataURL;
    // document.body.appendChild(img);
    document.querySelector('#merge-img-id')?.setAttribute('src', event.target.result);
  };
  // 读取合并后的 Blob 对象
  reader.readAsDataURL(mergedBlob);
};

/**分片上传请求 */
const fetchUploadSlice = () => {
  const chunks = chunkListRef.value;
  chunks.forEach((item) => {
    const formData = new FormData();
    formData.append('fileSlice', item.chunk);
    formData.append('md5', item.md5);
    formData.append('fileName', item.fileName);
    formData.append('suffix', item.suffix);
    formData.append('chunkIndex', String(item.chunkIndex));
    formData.append('total', String(chunks.length));

    fetch('/api/utils/uploadFileSlice', {
      method: 'POST',
      // body: JSON.stringify({ a: 1 }),
      body: formData, // 将 FormData 对象作为请求体
    }).then((response) => {
      console.log('🚀 ~ fetchUploadSlice ~ response:', response);
    });
  });
};
</script>
<template>
  <m-layout>
    <template #summary>
      <ul>
        <li>web worker 多线程</li>
      </ul>
    </template>
    <template #content>
      <input
        type="file"
        @change="onFileChange"
        id="fileElem"
        multiple
        accept="image/*"
        class="visually-hidden"
      />
      <label for="fileElem">
        <m-button style="pointer-events: none">选择一些文件</m-button>
      </label>
      <m-button @click="handleSplitFile">文件拆分</m-button>
      <m-button @click="mergeFile">文件合并(图片)</m-button>
      <m-button @click="fetchUploadSlice">发送请求</m-button>
      <div class="merge-img-area">
        <img id="merge-img-id" src="" alt="合并后展示图片占位区" />
      </div>
    </template>
  </m-layout>
</template>
<style lang="scss" scoped>
.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);

  &:is(:focus, :focus-within) + label {
    outline: thin dotted;
  }
}
.merge-img-area {
  #merge-img-id[src=''] {
    display: none;
  }
  #merge-img-id {
    margin-top: 12px;
    display: inline;
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
  }
}
</style>
