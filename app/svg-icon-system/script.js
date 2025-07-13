// SVG 图标系统 JavaScript 功能

// 图标管理类
class IconSystem {
    constructor() {
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.createDynamicIcons();
        this.setupAccessibility();
    }
    
    // 绑定事件
    bindEvents() {
        // 图标点击事件
        document.querySelectorAll('.icon-item').forEach(item => {
            item.addEventListener('click', this.handleIconClick.bind(this));
        });
        
        // 按钮点击事件
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', this.handleButtonClick.bind(this));
        });
        
        // 键盘导航支持
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    }
    
    // 处理图标点击
    handleIconClick(event) {
        const iconItem = event.currentTarget;
        const iconName = iconItem.querySelector('span').textContent;
        
        // 添加点击效果
        iconItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            iconItem.style.transform = '';
        }, 150);
        
        // 显示通知
        this.showNotification(`点击了 ${iconName} 图标`);
        
        // 复制图标代码到剪贴板
        const iconElement = iconItem.querySelector('.icon use');
        const iconId = iconElement.getAttribute('href');
        const iconCode = `<svg class="icon">\n    <use href="${iconId}"></use>\n</svg>`;
        
        this.copyToClipboard(iconCode);
    }
    
    // 处理按钮点击
    handleButtonClick(event) {
        const button = event.currentTarget;
        const buttonText = button.textContent.trim();
        
        // 添加点击动画
        button.style.transform = 'scale(0.98)';
        setTimeout(() => {
            button.style.transform = '';
        }, 100);
        
        this.showNotification(`执行了 ${buttonText} 操作`);
    }
    
    // 键盘导航
    handleKeyNavigation(event) {
        if (event.key === 'Tab') {
            // Tab 键导航时高亮当前焦点元素
            setTimeout(() => {
                const focusedElement = document.activeElement;
                if (focusedElement.classList.contains('icon-item')) {
                    focusedElement.style.outline = '2px solid #3498db';
                    setTimeout(() => {
                        focusedElement.style.outline = '';
                    }, 2000);
                }
            }, 0);
        }
    }
    
    // 动态创建图标
    createDynamicIcons() {
        // 创建一个动态图标示例
        const dynamicSection = document.createElement('div');
        dynamicSection.className = 'demo-section';
        dynamicSection.innerHTML = `
            <h2>动态创建的图标</h2>
            <div class="dynamic-icons">
                <button id="add-icon-btn" class="btn btn-primary">
                    <svg class="icon">
                        <use href="#icon-settings"></use>
                    </svg>
                    添加图标
                </button>
                <div id="dynamic-icon-container" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;"></div>
            </div>
        `;
        
        document.querySelector('.container').appendChild(dynamicSection);
        
        // 绑定添加图标按钮事件
        document.getElementById('add-icon-btn').addEventListener('click', () => {
            this.addDynamicIcon();
        });
    }
    
    // 添加动态图标
    addDynamicIcon() {
        const container = document.getElementById('dynamic-icon-container');
        const iconIds = ['#icon-home', '#icon-user', '#icon-settings', '#icon-search', '#icon-heart', '#icon-close'];
        const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];
        
        const randomIconId = iconIds[Math.floor(Math.random() * iconIds.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
            position: relative;
            display: inline-block;
            padding: 8px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        iconWrapper.innerHTML = `
            <svg class="icon" style="color: ${randomColor}; width: 32px; height: 32px;">
                <use href="${randomIconId}"></use>
            </svg>
            <button class="remove-icon" style="
                position: absolute;
                top: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                border: none;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                cursor: pointer;
                display: none;
            ">×</button>
        `;
        
        // 悬停显示删除按钮
        iconWrapper.addEventListener('mouseenter', () => {
            iconWrapper.querySelector('.remove-icon').style.display = 'block';
        });
        
        iconWrapper.addEventListener('mouseleave', () => {
            iconWrapper.querySelector('.remove-icon').style.display = 'none';
        });
        
        // 删除图标功能
        iconWrapper.querySelector('.remove-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            iconWrapper.style.transform = 'scale(0)';
            setTimeout(() => {
                iconWrapper.remove();
            }, 300);
        });
        
        // 添加入场动画
        iconWrapper.style.transform = 'scale(0)';
        container.appendChild(iconWrapper);
        
        setTimeout(() => {
            iconWrapper.style.transform = 'scale(1)';
        }, 100);
        
        this.showNotification('添加了一个新图标！');
    }
    
    // 显示通知
    showNotification(message) {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // 入场动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动消失
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('图标代码已复制到剪贴板！');
        } catch (err) {
            console.error('复制失败:', err);
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('图标代码已复制到剪贴板！');
        }
    }
    
    // 设置无障碍访问
    setupAccessibility() {
        // 为所有图标添加 aria-label
        document.querySelectorAll('.icon').forEach(icon => {
            const useElement = icon.querySelector('use');
            if (useElement) {
                const iconId = useElement.getAttribute('href').replace('#icon-', '');
                icon.setAttribute('aria-label', `${iconId} 图标`);
                icon.setAttribute('role', 'img');
            }
        });
        
        // 为按钮添加键盘支持
        document.querySelectorAll('.icon-item').forEach(item => {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }
    
    // 获取图标统计信息
    getIconStats() {
        const totalIcons = document.querySelectorAll('symbol').length;
        const usedIcons = document.querySelectorAll('use').length;
        
        return {
            total: totalIcons,
            used: usedIcons,
            efficiency: ((usedIcons / totalIcons) * 100).toFixed(1) + '%'
        };
    }
    
    // 切换主题色
    changeTheme(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        document.querySelectorAll('.icon-primary').forEach(icon => {
            icon.style.color = color;
        });
    }
}

// 工具函数
const IconUtils = {
    // 创建新图标
    createIcon(iconId, className = 'icon') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        
        svg.setAttribute('class', className);
        use.setAttribute('href', iconId);
        
        svg.appendChild(use);
        return svg;
    },
    
    // 批量替换图标
    replaceIcons(oldIconId, newIconId) {
        document.querySelectorAll(`use[href="${oldIconId}"]`).forEach(use => {
            use.setAttribute('href', newIconId);
        });
    },
    
    // 获取图标使用情况
    getIconUsage() {
        const usage = {};
        document.querySelectorAll('use').forEach(use => {
            const iconId = use.getAttribute('href');
            usage[iconId] = (usage[iconId] || 0) + 1;
        });
        return usage;
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const iconSystem = new IconSystem();
    
    // 在控制台输出图标系统信息
    console.log('SVG 图标系统已初始化');
    console.log('图标统计:', iconSystem.getIconStats());
    console.log('图标使用情况:', IconUtils.getIconUsage());
    
    // 全局暴露图标系统实例
    window.iconSystem = iconSystem;
    window.IconUtils = IconUtils;
    
    // 初始化动态颜色控制
    initDynamicColorControls();
});

// 动态颜色控制功能
function initDynamicColorControls() {
    const primaryColorInput = document.getElementById('primary-color');
    const secondaryOpacityInput = document.getElementById('secondary-opacity');
    const opacityValueSpan = document.getElementById('opacity-value');
    const interactiveStar = document.getElementById('interactive-star');
    const interactiveMail = document.getElementById('interactive-mail');
    
    if (!primaryColorInput || !secondaryOpacityInput || !opacityValueSpan || 
        !interactiveStar || !interactiveMail) {
        return; // 如果元素不存在，直接返回
    }
    
    // 更新颜色的函数
    function updateColors() {
        const primaryColor = primaryColorInput.value;
        const opacity = parseFloat(secondaryOpacityInput.value);
        const secondaryColor = `rgba(255,255,255,${opacity})`;
        
        // 更新透明度显示值
        opacityValueSpan.textContent = opacity.toFixed(1);
        
        // 应用颜色到交互式图标
        interactiveStar.style.color = primaryColor;
        interactiveStar.style.setProperty('--icon-secondary-color', secondaryColor);
        
        interactiveMail.style.color = primaryColor;
        interactiveMail.style.setProperty('--icon-secondary-color', secondaryColor);
    }
    
    // 绑定事件监听器
    primaryColorInput.addEventListener('input', updateColors);
    secondaryOpacityInput.addEventListener('input', updateColors);
    
    // 初始化颜色
    updateColors();
    
    // 添加预设颜色快速选择
    const presetColors = [
        { name: '蓝色', color: '#3498DB', opacity: 0.5 },
        { name: '绿色', color: '#2ECC71', opacity: 0.6 },
        { name: '红色', color: '#E74C3C', opacity: 0.4 },
        { name: '紫色', color: '#9B59B6', opacity: 0.7 },
        { name: '橙色', color: '#F39C12', opacity: 0.5 },
        { name: '金色', color: '#FFD700', opacity: 0.3 }
    ];
    
    // 创建预设颜色按钮
    const colorControls = document.querySelector('.color-controls');
    if (colorControls) {
        const presetContainer = document.createElement('div');
        presetContainer.className = 'preset-colors';
        presetContainer.innerHTML = '<label>快速选择:</label>';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'preset-buttons';
        
        presetColors.forEach(preset => {
            const button = document.createElement('button');
            button.className = 'preset-color-btn';
            button.style.backgroundColor = preset.color;
            button.title = preset.name;
            button.addEventListener('click', () => {
                primaryColorInput.value = preset.color;
                secondaryOpacityInput.value = preset.opacity;
                updateColors();
            });
            buttonContainer.appendChild(button);
        });
        
        presetContainer.appendChild(buttonContainer);
        colorControls.appendChild(presetContainer);
    }
}

// 初始化渐变色控制
function initGradientControls() {
    // 获取控制元素
    const gradientStartInput = document.getElementById('gradient-start');
    const gradientEndInput = document.getElementById('gradient-end');
    const gradientAngleInput = document.getElementById('gradient-angle');
    const angleValueSpan = document.getElementById('angle-value');
    
    const radialCenterInput = document.getElementById('radial-center');
    const radialEdgeInput = document.getElementById('radial-edge');
    const radialOpacityInput = document.getElementById('radial-opacity');
    const radialOpacityValueSpan = document.getElementById('radial-opacity-value');
    
    const presetGradientButtons = document.querySelectorAll('.preset-gradient-btn');
    
    // 更新线性渐变
    function updateLinearGradient() {
        if (!gradientStartInput || !gradientEndInput || !gradientAngleInput || !angleValueSpan) {
            return;
        }
        
        const startColor = gradientStartInput.value;
        const endColor = gradientEndInput.value;
        const angle = gradientAngleInput.value;
        
        // 计算渐变方向
        const radians = (angle * Math.PI) / 180;
        const x1 = Math.round(50 + 50 * Math.cos(radians + Math.PI)) + '%';
        const y1 = Math.round(50 + 50 * Math.sin(radians + Math.PI)) + '%';
        const x2 = Math.round(50 + 50 * Math.cos(radians)) + '%';
        const y2 = Math.round(50 + 50 * Math.sin(radians)) + '%';
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--gradient-start', startColor);
        document.documentElement.style.setProperty('--gradient-end', endColor);
        
        // 更新所有线性渐变定义的坐标
        const linearGradients = document.querySelectorAll('linearGradient');
        linearGradients.forEach(gradient => {
            gradient.setAttribute('x1', x1);
            gradient.setAttribute('y1', y1);
            gradient.setAttribute('x2', x2);
            gradient.setAttribute('y2', y2);
        });
        
        // 更新角度显示
        angleValueSpan.textContent = angle + '°';
    }
    
    // 更新径向渐变
    function updateRadialGradient() {
        console.log('执行updateRadialGradient函数');
        if (!radialCenterInput || !radialEdgeInput || !radialOpacityInput || !radialOpacityValueSpan) {
            console.log('径向渐变控制元素缺失');
            return;
        }
        
        const centerColor = radialCenterInput.value;
        const edgeColor = radialEdgeInput.value;
        const centerOpacity = radialOpacityInput.value;
        
        // 获取边缘透明度控制元素
        const radialEdgeOpacityInput = document.getElementById('radial-edge-opacity');
        const radialEdgeOpacityValueSpan = document.getElementById('radial-edge-opacity-value');
        
        // 默认边缘透明度为0.1，如果控制元素存在则使用其值
        let edgeOpacity = '0.1';
        if (radialEdgeOpacityInput) {
            edgeOpacity = radialEdgeOpacityInput.value;
            if (radialEdgeOpacityValueSpan) {
                radialEdgeOpacityValueSpan.textContent = edgeOpacity;
            }
        }
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--gradient-center', centerColor);
        document.documentElement.style.setProperty('--gradient-edge', edgeColor);
        document.documentElement.style.setProperty('--gradient-center-opacity', centerOpacity);
        document.documentElement.style.setProperty('--gradient-edge-opacity', edgeOpacity);
        
        // 更新所有径向渐变定义的属性
        const radialGradients = document.querySelectorAll('radialGradient');
        console.log('找到径向渐变元素数量:', radialGradients.length);
        
        if (radialGradients.length === 0) {
            console.log('警告: 未找到径向渐变元素!');
        }
        
        radialGradients.forEach((gradient, index) => {
            console.log(`处理径向渐变 #${index+1}:`, gradient.id);
            // 确保径向渐变的stop元素更新透明度
            const stops = gradient.querySelectorAll('stop');
            console.log('径向渐变中的stop元素数量:', stops.length);
            
            if (stops.length === 0) {
                console.log('警告: 径向渐变中没有stop元素!');
            }
            
            if (stops.length >= 1) {
                stops[0].setAttribute('stop-opacity', centerOpacity);
                console.log('设置中心透明度:', centerOpacity);
            }
            if (stops.length >= 2) {
                stops[1].setAttribute('stop-opacity', edgeOpacity);
                console.log('设置边缘透明度:', edgeOpacity);
            }
        });
        
        // 更新中心透明度显示
        radialOpacityValueSpan.textContent = centerOpacity;
    }
    
    // 绑定事件监听器
    if (gradientStartInput) {
        gradientStartInput.addEventListener('input', updateLinearGradient);
    }
    if (gradientEndInput) {
        gradientEndInput.addEventListener('input', updateLinearGradient);
    }
    if (gradientAngleInput) {
        gradientAngleInput.addEventListener('input', updateLinearGradient);
    }
    
    if (radialCenterInput) {
        radialCenterInput.addEventListener('input', updateRadialGradient);
    }
    if (radialEdgeInput) {
        radialEdgeInput.addEventListener('input', updateRadialGradient);
    }
    if (radialOpacityInput) {
        radialOpacityInput.addEventListener('input', updateRadialGradient);
    }
    
    // 添加边缘透明度控制的事件监听器
    const radialEdgeOpacityInput = document.getElementById('radial-edge-opacity');
    if (radialEdgeOpacityInput) {
        radialEdgeOpacityInput.addEventListener('input', updateRadialGradient);
    }
    
    // 预设渐变按钮事件
    presetGradientButtons.forEach(button => {
        button.addEventListener('click', () => {
            const startColor = button.dataset.start;
            const endColor = button.dataset.end;
            
            if (gradientStartInput && gradientEndInput) {
                gradientStartInput.value = startColor;
                gradientEndInput.value = endColor;
                updateLinearGradient();
            }
            
            // 添加点击效果
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    });
    
    // 初始化渐变
    updateLinearGradient();
    updateRadialGradient();
    
    // 手动设置径向渐变透明度
    setTimeout(() => {
        console.log('手动设置径向渐变透明度');
        const radialGradients = document.querySelectorAll('radialGradient');
        console.log('找到径向渐变元素数量:', radialGradients.length);
        
        // 获取透明度值
        const centerOpacity = radialOpacityInput ? radialOpacityInput.value : '0.8';
        const edgeOpacityInput = document.getElementById('radial-edge-opacity');
        const edgeOpacity = edgeOpacityInput ? edgeOpacityInput.value : '0.1';
        
        // 直接设置每个径向渐变的stop-opacity
        radialGradients.forEach((gradient, index) => {
            console.log(`处理径向渐变 #${index+1}:`, gradient.id);
            const stops = gradient.querySelectorAll('stop');
            console.log(`  stop元素数量: ${stops.length}`);
            
            if (stops.length >= 1) {
                stops[0].setAttribute('stop-opacity', centerOpacity);
                console.log(`  设置第一个stop的透明度: ${centerOpacity}`);
            }
            
            if (stops.length >= 2) {
                stops[1].setAttribute('stop-opacity', edgeOpacity);
                console.log(`  设置第二个stop的透明度: ${edgeOpacity}`);
            }
        });
    }, 500);
}

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    initDynamicColorControls();
    initGradientControls();
    
    // 确保径向渐变初始化 - 不再需要这些代码，因为我们在initGradientControls中添加了延时执行的函数
    /*
    const radialOpacity = document.getElementById('radial-opacity');
    if (radialOpacity) {
        radialOpacity.dispatchEvent(new Event('input'));
    }
    
    // 确保径向渐变边缘透明度初始化
    const radialEdgeOpacity = document.getElementById('radial-edge-opacity');
    if (radialEdgeOpacity) {
        radialEdgeOpacity.dispatchEvent(new Event('input'));
    }
    */
    
    // 直接设置径向渐变透明度
    setTimeout(() => {
        console.log('DOMContentLoaded后直接设置径向渐变透明度');
        const radialGradients = document.querySelectorAll('radialGradient');
        if (radialGradients.length > 0) {
            // 获取透明度值
            const centerOpacityInput = document.getElementById('radial-opacity');
            const centerOpacity = centerOpacityInput ? centerOpacityInput.value : '0.8';
            
            const edgeOpacityInput = document.getElementById('radial-edge-opacity');
            const edgeOpacity = edgeOpacityInput ? edgeOpacityInput.value : '0.1';
            
            console.log(`设置径向渐变透明度: 中心=${centerOpacity}, 边缘=${edgeOpacity}`);
            console.log('找到径向渐变元素数量:', radialGradients.length);
            
            // 直接设置每个径向渐变的stop-opacity
            radialGradients.forEach((gradient, index) => {
                console.log(`处理径向渐变 #${index+1}:`, gradient.id);
                const stops = gradient.querySelectorAll('stop');
                console.log(`  stop元素数量: ${stops.length}`);
                
                if (stops.length >= 1) {
                    stops[0].setAttribute('stop-opacity', centerOpacity);
                    console.log(`  设置第一个stop的透明度: ${centerOpacity}`);
                }
                if (stops.length >= 2) {
                    stops[1].setAttribute('stop-opacity', edgeOpacity);
                    console.log(`  设置第二个stop的透明度: ${edgeOpacity}`);
                }
            });
        }
    }, 100);
});

// 性能监控
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`图标系统加载时间: ${loadTime.toFixed(2)}ms`);
    });
}