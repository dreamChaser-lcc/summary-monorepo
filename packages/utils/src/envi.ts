/**
 * 判断浏览器环境的工具方法
 */

export const ua: any = typeof window == 'undefined' ? '' : (window.navigator.userAgent || '');

export function isAndroid() {
	return ua.indexOf('Android') > -1 || ua.indexOf('Linux') > -1;
}

export function isIOS() {
	return !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // ios终端
}

export function isWeixin() {
	return ua.toLowerCase().match(/MicroMessenger/i) == 'micromessenger';
}

export function isWeibo() {
	return ua.toLowerCase().match(/WeiBo/i) == 'weibo';
}

export function isChrome() {
	// @ts-ignore
	return !!(typeof window != 'undefined' && window.chrome);
}

export function isFireFox() {
	return /firefox/i.test(ua.toLowerCase());
}

/**是否为PC端 */
export function isPc() {
	return !isAndroid() && !isIOS();
}

// 是否在支付宝APP
export function isAlipayApp() {
	return /AlipayClient/.test(ua);
}

/**
 * app版本号
 * @param {*} type
 * @returns
 */
export function getQlEduAppVersion(type = 'number') {
	let qlver = ua.toLowerCase().match(/qlchat_edu[a-zA-Z]*?\/([\d.]+)/);

	if (qlver?.length) {
		if (type === 'number') {
			return parseInt(qlver[1]);
		}
		if (type === 'point') {
			let v = parseInt(qlver[1]);
			let version = (v / 10).toFixed(0).split('').join('.');
			return version;
		}
	}

	return 0;
}

export function isMac() {
	return !!ua.match(/\(Macintosh\; Intel /);
}
export function isSafari() {
	return !!ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/);
}

export function getQlchatVersion() {
	let qlver = ua.toLowerCase().match(/(qlchat)|(qlchat_edu)[a-zA-Z]*?\/([\d.]+)/);

	if (qlver?.length) {
		return parseInt(qlver[1]);
	}

	return;
}

export function getAndroidVersion() {
	if (isAndroid()) {
		let reg = /android [\d._]+/gi;
		let v_info = ua.match(reg);
		let version:(string|number) = (String(v_info)).replace(/[^0-9|_.]/ig, '').replace(/_/ig, '.'); // 得到版本号4.2.2
		version = parseInt(version.split('.')[0]);// 得到版本号第一位
		return Number(version);
	}
	return null;
}

export function getIosVersion() {
	let version = ua.toLowerCase().match(/os (.*?) like mac os/);

	return version?.[1]?.replace(/_/g, '.') || '';
}

// 判断是否为微信小程序
export function isWeapp() {
	// @ts-ignore
	return typeof window != 'undefined' && window.__wxjs_environment === 'miniprogram';
}

// 是否是京东app
export function isJdapp() {
	return /jdapp/i.test(ua);
}

export function isWindowsWechat() {
	return ua.toLowerCase().match(/windowswechat/i) == 'windowswechat';
}

export function isEdge() {
	return ua.toLowerCase().match(/edg/) == 'edg';
}
