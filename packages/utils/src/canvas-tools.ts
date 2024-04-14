/*
 * file: 常用的canvas卡片绘制工具函数
 */

/*
多行文字显示，可指定文本位置，最大行数，宽度，行高
distX, distY,width, maxLine, lineHeight
*/
/**
 * 多行文字显示，可指定文本位置，最大行数，宽度，行高
 * @param {any} ctx        canvas 的 getContext('2d')
 * @param {string} text    文本
 * @param textObj          文本显示样式设置
 * {
	distX:number,
	distY:number,
	width:number,
	color:string,
	bolder:boolean,
	maxLine:number,
	fontWeight: string,
	lineHeight:number,
 }
 * @param {string} fontFamiry   字体，可选，默认值微软雅黑
 */
 function multiText(ctx:CanvasRenderingContext2D, text, textObj, fontFamiry = "微软雅黑") {
	let { left, top, width, maxLine, lineHeight, font, color, fontWeight, bolder, align } = textObj;
	let targetLeft = 0;
	ctx.save();
	ctx.font = (fontWeight ? (fontWeight + ' ') : '') + font + 'px ' + fontFamiry;
	ctx.fillStyle = color;
	var words = text.split('');
	var line = '';
	var lines = 1;
	for (var i = 0; i < words.length; i++) {
		line += words[i];
		/* 文字内容全部取完，直接绘制文字*/
		if (i === words.length - 1) {
			if (align === 'center') {
				const textWidth = ctx.measureText(line).width;
				targetLeft = left - textWidth / 2;
			}

			ctx.fillText(line, align === 'center' ? targetLeft : left, top, width);
			break;
		}
		if (ctx.measureText(line).width >= width) {
			/* 已经到达最大行数，用省略号代替后面的部分*/
			if (lines === maxLine) {
				line = line.slice(0, line.length - 3) + '...';
			}

			if (align === 'center') {
				const textWidth = ctx.measureText(line).width;
				targetLeft = left - textWidth / 2;
			}

			ctx.fillText(line, align === 'center' ? targetLeft : left, top, width);
			if (lines === maxLine) {
				break;
			}
			line = '';
			top += lineHeight;
			lines += 1;
		}
	}
	ctx.restore();
};

/**
 * 时间戳的格式化
 * @param {number} timeStamp 时间戳
 * @param {string} line 分隔符，可选。默认值为'-'
 */
function timeParse(timeStamp, line = '-') {
	var t = new Date(timeStamp);
	var week = '';

	switch (t.getDay()) {
		case 1: week = '一'; break;
		case 2: week = '二'; break;
		case 3: week = '三'; break;
		case 4: week = '四'; break;
		case 5: week = '五'; break;
		case 6: week = '六'; break;
		case 0: week = '日'; break;
	}

	let month:string|number = t.getMonth() + 1;
	if (month < 10) {
		month = '0' + month;
	}
	let day:string|number = t.getDate();
	if (day < 10) {
		day = '0' + day;
	}

	let hours:string|number = t.getHours();
	if (hours < 10) {
		hours = '0' + hours;
	}

	let monutes:string|number = t.getMinutes();
	if (monutes < 10) {
		monutes = '0' + monutes;
	}
    let formateTime:Record<string, string|number> = {};
	formateTime.date = t.getFullYear() + line + month + line + day;
	formateTime.day = '星期' + week + ' ';
	formateTime.time = hours + ':' + monutes;
	return formateTime;
}

interface ITextStyle{
    left:number, 
    top:number, 
    font:number, 
    color:string, 
    fontWeight: string,
    bolder:boolean
    gradientList: Array<any>
    align: 'left'| 'center' | 'right',
    /**后缀单位配置 */
    suffix?: any;
    /**绘制文本 */
    text?:string;
}
/**
 * 绘制单行文本
 * @param {any} ctx        canvas 的 getContext('2d')
 * @param {string} text    文本
 * @param {ITextStyle} textObj 文本显示样式设置
 * @param {string} fontFamiry   字体，可选，默认值微软雅黑
 */
function drawText(ctx:CanvasRenderingContext2D, text, textObj:ITextStyle, fontFamiry = "微软雅黑") {
	let { left, top, font, color, fontWeight, align = 'left', suffix, gradientList } = textObj;

	if (align === 'center' || suffix && suffix.text && suffix.font) {
		ctx.font = (fontWeight ? (fontWeight + ' ') : '') + font + 'px ' + fontFamiry;
		const textWidth = ctx.measureText(text).width
		if (align === 'center') {
			left = left - textWidth / 2
		}
		if (suffix && suffix.text && suffix.font) {
			let { text: suffixText, font: suffixFont, color: suffixColor, fontWeight: suffixFontWeight, lSpace = 0 } = suffix;
			ctx.font = (suffixFontWeight ? (suffixFontWeight + ' ') : '') + suffixFont + 'px ' + fontFamiry;
			if (align === 'center') {
				const suffixTextWidth = ctx.measureText(suffixText).width + lSpace
				left = left - suffixTextWidth / 2
			}
			ctx.fillStyle = suffixColor || color;
			ctx.fillText(suffixText, left + textWidth + lSpace, top);
		}
	}
	ctx.font = (fontWeight ? (fontWeight + ' ') : '') + font + 'px ' + fontFamiry;
    // 文本颜色渐变
	if (gradientList && !!gradientList.length) {
		let textWidth = ctx.measureText(text).width
		let gradient = ctx.createLinearGradient(0, 0, 360, 0)
		gradientList.forEach((item) => {
			gradient.addColorStop(item.opc, item.bg)
		});
		ctx.fillStyle = gradient
	} else {
		ctx.fillStyle = color;
	}
	ctx.fillText(text || textObj.text, left, top);
}

/**
 * 绘制单行文本,可以指定字的宽度 
 * @param {any} ctx        canvas 的 getContext('2d')
 * @param {string} str     文本
 * @param {object} textObj 文本显示样式设置
 * {
	x:number, 
	y:number, 
	spaceWidth:number, 
	font:number, 
	color:string, 
	bolder:boolean}
 * @param {string} fontFamiry    字体，可选，默认值微软雅黑
 */
function drawTextSpace(ctx, str, textObj, fontFamiry = "微软雅黑") {
	let { x, y, spaceWidth, font, color, bolder } = textObj;
	var strArray = str.split("");
	for (var i = 0; i < strArray.length; i++) {
		ctx.font = (bolder ? 'bold ' : '') + font + 'px ' + fontFamiry;
		ctx.fillStyle = color;
		ctx.fillText(strArray[i], x + spaceWidth * i, y);
	}
}

/** 裁剪图片配置 */
interface IClipRoundedStyle {
    x:number, 
    y:number, 
    w:number, 
    h:number, 
    r:{
        r_top_right:number,
        r_bottom_right:number,
        r_bottom_left:number,
        r_top_left:number
    }, 
    bdWidth:number, //边框的宽度厚度
    bdColor:string, //边框的颜色
    bgcolor:string, //背景色（如果isLinear为true时，bgcolor作为渐变第一色）
    isLinear:boolean,  //是否渐变
    linearColor:string,  //渐变的第二色
    [key: string]: any
}
/**
 * 画圆角矩形块，渐变色块
 *（可以用于画透明层色块，渐变层）
 *（可以设置上面是圆角，下面是直角 ）
 * headBgClipRounded 方法如果单独使用，填充请手动加上ctx.fill();
 * @param {any} ctx       canvas 的 getContext('2d')
 * @param {IClipRoundedParams}clipObj 图片显示样式设置
 
 */
function headBgClipRounded(ctx:CanvasRenderingContext2D, clipObj:IClipRoundedStyle) {
	let { x, y, w, h, r, bdWidth, bdColor, bgcolor, isLinear, linearColor } = clipObj;
	let r_all:any = '';
	if (typeof r === 'number' || typeof r === 'string') {
		r_all = r;
	}
	ctx.beginPath();
	ctx.moveTo(x + (r_all || r.r_top_left), y);
	ctx.lineWidth = bdWidth;
	ctx.strokeStyle = bdColor;

	if (isLinear) {
		/* 指定渐变区域 */
		var grad = ctx.createLinearGradient(x, y, x, y + h);
		/* 指定几个颜色 */
		grad.addColorStop(0, bgcolor);
		grad.addColorStop(1, linearColor);
		/* 将这个渐变设置为fillStyle */
		ctx.fillStyle = grad;
	} else {
		ctx.fillStyle = bgcolor;
	}

	ctx.arcTo(x + w, y, x + w, y + h, r_all || r.r_top_right);
	ctx.arcTo(x + w, y + h, x, y + h, r_all || r.r_bottom_right);
	ctx.arcTo(x, y + h, x, y, r_all || r.r_bottom_left);
	ctx.arcTo(x, y, x + w, y, r_all || r.r_top_left);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();
};

interface IImgStyle{
    left:number, 
    top:number, 
    width:number, 
    height:number, 
    isClip?:boolean, 
    x?:number, 
    y?:number, 
    w?:number, 
    h?:number, 
    r?:number, 
    bdWidth?:number, 
    bdColor?:string, 
    bgcolor?:string, 
    isLinear?:boolean, 
    linearColor?:string
    [key:string]:any
}
/**
 * 画图方法，指定图片的位置和宽高
 * @param {any} ctx         canvas 的 getContext('2d')
 * @param {string} bgUrl    图片链接
 * @param {object} imageObj 图片显示样式设置
 * 
 * @param {function} imageProxyFunc 
 * @param {function} cb 
 */
function drawImage(ctx:CanvasRenderingContext2D, bgUrl, imageObj:IImgStyle, imageProxyFunc, cb) {
	if (bgUrl != "") {
		let bgImg = new Image();
		if (/^data:image\/\w+;base64,/.test(bgUrl)) {
            bgImg.crossOrigin = 'Anonymous';//跨域，如果是database64，则不需要这个
            bgImg.setAttribute('crossOrigin', 'anonymous');
		}
		bgImg.crossOrigin = 'anonymous';
		// bgImg.src = imageProxyFunc ? imageProxyFunc(bgUrl) : bgUrl;
		bgImg.src = bgUrl;
		bgImg.onload = function () {
			__drawPic(ctx, bgImg, imageObj, cb);
		}
	} else {
		__drawPic(ctx, "", '', cb);
	}
}

/**
 * 添加一张图片或矩形块进入画布
 * @param ctx 
 * @param bgImg 
 * @param imageObj 
 * @param cb 
 */
function __drawPic(ctx, bgImg, imageObj, cb) {
	let { top, left, width, height } = imageObj;
	if (bgImg != "") {
		// ctx.globalCompositeOperation = 'destination-over';
		ctx.drawImage(bgImg, left, top, width, height);
		ctx.restore();
		cb && cb();
	} else { 
        // 画一个白色背景
		ctx.beginPath();
		ctx.moveTo(left, top);
		ctx.fillStyle = "#fff";
		ctx.lineTo(left + width, top);
		ctx.lineTo(left + width, top + height);
		ctx.lineTo(left, top + height);
		ctx.closePath();
		ctx.fill();
		cb && cb();
	}

}

/**
 * 处理图片跨域问题，如果是符合 /^data:image\/\w+;base64,/ 规则的图片，不做处理返回原链接，其余的都要处理返回新链接；
 * 该方法返回的方法参数是一个图片链接[string] 判断为空则返回空。
 * @param {string} api string  接口
 */
function imageProxy(api) {
	return function (url) {
		if (url != '') {
			if (/^data:image\/\w+;base64,/.test(url)) {
				return url
			} else {
				return api + encodeURIComponent(url);
			}
		} else {
			return '';
		}

	}

}

interface IContentImgStyle{
    left:number, 
    top:number, 
    width:number, 
    height:number, 
    isClip?:boolean, 
    x?:number, 
    y?:number, 
    w?:number, 
    h?:number, 
    r?:number, 
    bdWidth?:number, 
    bdColor?:string, 
    bgcolor?:string, 
    isLinear?:boolean, 
    linearColor?:string
    [key: string]: any
}
/**
 * 应用于画图圆角矩形图片
 * @param ctx          canvas 的 getContext('2d')
 * @param bgUrl        图片链接
 * @param imageObj     图片显示样式设置
 *
 * @param imageProxyFunc:any
 * @param cb any
 * 画经过 clip 的图片（圆形，圆角矩形）
 * imageObj:{left, top, width, height, isClip, x, y, w, h, r, bdWidth, bdColor, bgcolor, isLinear, linearColor}
 */
function drawStyleImage(ctx:CanvasRenderingContext2D, imageUrl, imageObj:IContentImgStyle, imageProxyFunc, cb) {
	let { left, top, width, height, isClip, x, y, w, h, r, bdWidth, bdColor, bgcolor, isLinear, linearColor } = imageObj;
	ctx.save();

	if (isClip) {
        // @ts-ignore
		r && headBgClipRounded(ctx, { x, y, w, h, r, bdWidth, bdColor, bgcolor, isLinear, linearColor });
		ctx.clip();
	}

	drawImage(ctx, imageUrl, { left, top, width, height }, imageProxyFunc, cb);
}



/**
 * 截取化图片某个尺寸，获取格式化后的链接
 * @param {string} url   链接
 * @param {string} formatStrQ   阿里云图片截取格式 "?x-oss-process=image/resize,m_fill,limit_0,h_64,w_64"
 * @param {string} formatStrW   微信图片截取格式 "/64"
 *  图片截取大小格式化，获取链接 （兼容微信图片和阿里云图片）
 *
 *  例子：imgUrlFormat(url, "?x-oss-process=image/resize,m_fill,limit_0,h_64,w_64", "/64");
 */

function imgUrlFormat(url, formatStrQ = "?x-oss-process=image/resize,m_fill,limit_0,h_64,w_64", formatStrW = "/64") {

	if (/(img\.qlchat\.com)/.test(url)) {
		url = url.replace(/@.*/, "") + formatStrQ;
	} else if (/(wx\.qlogo\.cn\/mmopen)/.test(url)) {
		url = url.replace(/(\/(0|132|64|96)$)/, formatStrW);
	};

	return url;
};

/**
 * 冒泡对话框形状的图片
 * imageObj{x, y, w, h, r_all, bdWidth, bdColor, bgcolor, isLinear, linearColor }
 * 该方法当时用于冒泡对话框形状的图片剪切，目前只应用于一个场景，其他场景未必适用
 * @param {any}ctx      canvas 的 getContext('2d')
 * @param {object}imageObj  图片显示样式设置
 * {
	x:number, 
	y:number, 
	w:number, 
	h:number, 
	r:{
		r_top_right:number,
		r_bottom_right:number,
		r_bottom_left:number,
		r_top_left:number
	}, 
	bdWidth:number, //边框的宽度厚度
	bdColor:string, //边框的颜色
	bgcolor:string, //背景色（如果isLinear为true时，bgcolor作为渐变第一色）
	isLinear:boolean,  //是否渐变
	linearColor:string,  //渐变的第二色
	r_all:number}
 */
function headBgClipDialog(ctx, imageObj) {
	let { x, y, w, h, r_all, bdWidth, bdColor, bgcolor, isLinear, linearColor } = imageObj;
	if (!r_all) { return false }
	ctx.moveTo(x + r_all, y);
	ctx.lineWidth = bdWidth;
	ctx.strokeStyle = bdColor;

	if (isLinear) {
		/* 指定渐变区域 */
		var grad = ctx.createLinearGradient(0, 0, 0, h);
		/* 指定几个颜色 */
		grad.addColorStop(0, bgcolor);
		grad.addColorStop(1, linearColor);
		/* 将这个渐变设置为fillStyle */
		ctx.fillStyle = grad;
	} else {
		ctx.fillStyle = bgcolor;
	}

	ctx.arcTo(x + w, y, x + w, y + h, r_all);
	ctx.arcTo(x + w, y + h, x + 20, y + h, r_all);
	ctx.arcTo(x + 18, y + h, x + 12, y + h - 5, r_all);
	ctx.arcTo(x + 8, y + h + 2, x, y + h, r_all);
	ctx.arcTo(x + 4, y + h - 4, x + 8, y + h - 10, r_all);
	ctx.arcTo(x + 5, y + h - 12, x + 5, y + h - 20, r_all);
	ctx.arcTo(x + 5, y + h - 20, x + 5, y, r_all);
	ctx.arcTo(x + 5, y, x + w + 5, y, r_all);

	ctx.stroke();
}


/**
 * 加载特殊样式的数字图片
 * @param {Array} numUrlArray  是自定义的图片链接，定制规则是 0~9是数字0~9的图片，10是小数点，11是￥的符号,（12是+号，13是－号,14是:号，目前这三个没有默认图，不想报错又想用就自己上传吧，）。
 * 其他的符号的图片可后续优化添加。
 * @param {any} imageProxyFunc 图片代理方法
 * @param {function} cb 回调函数
 * 加载特殊样式的数字图片
 * loadNumImg( numUrlArray:[url:string],imageProxyFunc:any ,cb:any)
 * 使用时，先loadNumImg,获取图片数组。
 * 再使用showNumDraw方法画出数字图案。
 */
function loadNumImg(numUrlArray, imageProxyFunc, cb) {
	var a = 0;
	let numImfArray:any[] = [];
	var numUrlArray = numUrlArray.length > 0 ? numUrlArray : [
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-0.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-1.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-2.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-3.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-4.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-5.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-6.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-7.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-8.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-9.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-dian.png",
		"https://img.qlchat.com/qlLive/liveCommon/coupon-card-num-money.png",
	];
	for (var i = 0; i < numUrlArray.length; i++) {
		numImfArray[i] = new Image();
		numImfArray[i].crossOrigin = 'Anonymous';
		numImfArray[i].src = imageProxyFunc(numUrlArray[i]);
		numImfArray[i].onload = function () {
			a++;
			if (a >= numUrlArray.length) {
				typeof cb === 'function' && cb(numImfArray);
				return numImfArray;
			}
		};
	}
}
// /**
//  * 画特殊样式的数字
//  * @param {any} ctx         canvas 的 getContext('2d')
//  * @param {number} num      数字文本
//  * @param {any}numObj       显示样式设置
//  * {top:number, 
// 	left:number, 
// 	width:number, 
// 	height:number }
//  * @param {Array} numImfArray Array     显示图片的数组
//  *    showNumDraw(ctx, num, numObj, numImfArray)
//  *    numObj{ top, left, width, height } , width, height 定制每个数字字符的图片显示的宽高
//  *    numImfArray 是应用的定制图片的数组
//  *    使用showNumDraw方法画出数字图案。
//  */
// function showNumDraw(ctx, num, numObj, numImfArray) {
// 	let numString = num.toString().split("");
// 	let numLen = numString.length;
// 	let allWidth = numObj.width * numLen;
// 	for (let index = 0; index < numLen; index++) {
// 		const element = numString[index];
// 		if (element === '.') {
// 			drawNum(ctx, 10, index, numImfArray, allWidth);
// 		} else if (element === '￥') {
// 			drawNum(ctx, 11, index, numImfArray, allWidth);
// 		} else if (element === '+') {
// 			drawNum(ctx, 12, index, numImfArray, allWidth);
// 		} else if (element === '-') {
// 			drawNum(ctx, 13, index, numImfArray, allWidth);
// 		} else if (element === ':') {
// 			drawNum(ctx, 14, index, numImfArray, allWidth);
// 		} else {
// 			drawNum(ctx, Number(element), index, numImfArray, allWidth);
// 		}
// 	}
// }
function drawNum(ctx, n, p, numObj, numImfArray, allWidth) {
	ctx.drawImage(
		numImfArray[n],
		numObj.left + numObj.width * p - (allWidth / 2),
		numObj.top,
		numObj.width,
		numObj.height
	);
}

var imageProxyFunc = imageProxy("/financial/image-proxy?url=");

/**
 * 加载图片
 * @param {any} cb
 */
function loadImage(ctx:CanvasRenderingContext2D, image:IContentImgStyle, cb) {
	drawStyleImage(
		ctx,
		image.url,
		image.style,
		image.skipProxy ? null : imageProxyFunc,
		() => {
			cb();
		}
	);
}

/**绘画到canvas上 */
function generate(ctx:CanvasRenderingContext2D, content:IDrawContent, cb) {
    const fontFamiry = '"苹方 常规","微软雅黑"';

	if (!content || !content.style) {
	    return cb && cb()
	}
    
	switch (content.type) {
		case 'image':
			loadImage(ctx, content as IImgStyle, cb)
			break;
		case 'singleText':
			drawText(
				ctx,
				content.text,
                // @ts-ignore
				content.style,
				fontFamiry
			)
			cb && cb()
			break;
		case 'multiText':
			multiText(
				ctx,
				content.text,
				content.style,
			)
			cb && cb()
			break;
		case 'block':
			headBgClipRounded(
				ctx,
				content.style as IClipRoundedStyle
			)
			cb && cb()
			break;
		default:
			cb && cb()
			break;
	}
}

interface IDrawContent{
    type: 'image' | 'singleText' | 'multiText' | 'block'
    url?: string
    text?: string
    style?: Partial<IImgStyle|ITextStyle|IContentImgStyle|IClipRoundedStyle>
    /**图片是否需要代理 */
    skipProxy?: boolean
    width?: number
    height?: number
    left?: number
    top?: number
}

interface IDrawCardParams{
    bgUrl?: string;
    cardWidth?: number;
    cardHeight?: number;
    contents?: IDrawContent[]
    // 成功生成后的函数
    cb?: (dataUrl:string)=>void;
    imgType?: string;
}
/**
 * 自定义海报
 * @param {IDrawCardParams} params
 */
export default function drawCard(params: IDrawCardParams) {
    const {
        bgUrl, // 海报背景
        cardWidth,
        cardHeight,
        contents = [],
        cb,
        imgType = 'image/png',
    } = params;
	const canvas = document.createElement("canvas");

	if (bgUrl) {
		contents.unshift({
			type: 'image',
			url: bgUrl,
			skipProxy: true,
			style: {
				top: 0,
				left: 0,
				width: cardWidth as number,
				height: cardHeight as number,
			}
		})
	}

	const ctx = canvas.getContext("2d");
    if(!ctx) return;

	canvas.width = cardWidth || 640;
	canvas.height = cardHeight || 1136;

	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	let i = 0
	const loop = () => {
		i += 1
		if (i < contents.length) {
			generate(ctx, contents[i], loop)
		} else {
			cb && cb(canvas.toDataURL(imgType, 0.9));
		}
	}
	generate(ctx, contents[i], loop)
}
