/**
 * Biz/bridge
 */
import qs from 'qs';
const SCHEMA = 'cefcbridge://';

const _callNative = function(method) {
  const url = `${SCHEMA}${method}`;

  if (process.env.SERVER_ENV !== 'production') {
    console.log(`调用 Native【${method}】, ${url}`);
  }

  _callNativeUseLocation(url);
};

function _callNativeUseLocation(url) {
  window.location.href = url;
}

/**
 * 调用 Native
 * @description ios 10.2/10.1 会出现拦截到 about:blank
 * @param {string} url schema
 */
// eslint-disable-next-line no-unused-vars
function _callNativeUseIframe(url) {
  let iframe = document.createElement('iframe');
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(() => { iframe.remove(); }, 100);
}

function _scanIDCardCallBackFactory(ok, fail) {
  window.bank = window.bank || {};
  let cb = window.bank;

  cb.successCallback = ok;
  cb.nativeBack = fail;

  return cb;
}

function _videoCallBackFactory(ok, fail) {
  window.securVideoCall = window.securVideoCall || {};
  let cb = window.securVideoCall;

  cb.successCallback = ok;
  cb.failCallback = fail;

  return cb;
}

const Bridge = {
  /**
   * 开启新的 WebView 打开 url，设置标题为 title（默认为页面标题）
   * @param {string} url
   * @param {string} title
   */
  open(url, title) {
    _callNative(`open?url=${encodeURIComponent(url)}&title=${title != null && title !== '' ? encodeURIComponent(title) : ''}`);
  },

  /**
   * 关闭当前 WebView
   */
  close() {
    _callNative('close');
  },

  /**
   * 退出 SDK，回到接入方界面
   */
  exit() {
    _callNative('exit');
  },

  /**
   * 进入开户流程界面
   */
  oac() {
    _callNative('uploadCardInfo');
  },

  /**
   * 扫描身份证
   */
  scanIDCard(ok, fail) {
    _scanIDCardCallBackFactory(ok, fail);
    _callNative('openScanIDCard=true');
  },

  /**
   * 开始双向视频
   * @param options
   * @param ok
   * @param fail
   */
  video(options = {
    anyChatStreamIpOut: '',
    anyChatStreamPort: '',
    userName: '',
    loginPwd: '',
    roomId: '',
    roomPwd: '',
    remoteId: ''
  }, ok, fail) {
    _videoCallBackFactory(ok, fail);
    _callNative(`video?${qs.stringify(options)}`);
  }
};


export default Bridge;
