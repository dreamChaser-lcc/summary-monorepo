import('./bootstrap.js');

console.log('我被执行了')

/**
 * 定义了一个webComponent组件
 */
class CustomWebComponent extends HTMLElement{
    constructor(){
        super();
    }
    connectedCallback() {
      console.log("自定义元素添加至页面。");
      let template = document.getElementById("custom-web-component-template");
      let templateContent = template.content;
      // 获取父组件自定义的属性name   
      const name = this.getAttribute('name');
      // 将组件定义成shadow dom样式不会被外部影响
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(templateContent.cloneNode(true));
    }

    disconnectedCallback() {
     console.log("自定义元素从页面中移除。");
    }

    adoptedCallback() {
      console.log("自定义元素移动至新页面。");
    }

    attributeChangedCallback(name, oldValue, newValue) {
     console.log(`属性 ${name} 已变更。`);
    }
}

window.customElements.define('custom-web-component', CustomWebComponent)
