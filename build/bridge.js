'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SCHEMA = 'cefcbridge://'; /**
                               * Biz/bridge
                               */


var _callNative = function _callNative(method) {
  var url = '' + SCHEMA + method;

  if (process.env.SERVER_ENV !== 'production') {
    // eslint-disable-next-line
    console.log('\u8C03\u7528 Native\u3010' + method + '\u3011, ' + url);
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
  var iframe = document.createElement('iframe');
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(function () {
    iframe.remove();
  }, 100);
}

function _scanIDCardCallBackFactory(ok, fail) {
  window.bank = window.bank || {};
  var cb = window.bank;

  cb.successCallback = ok;
  cb.nativeBack = fail;

  return cb;
}

function _videoCallBackFactory(ok, fail) {
  window.securVideoCall = window.securVideoCall || {};
  var cb = window.securVideoCall;

  cb.successCallback = ok;
  cb.failCallback = fail;

  return cb;
}

var Bridge = {
  /**
   * 开启新的 WebView 打开 url，设置标题为 title（默认为页面标题）
   * @param {string} url
   * @param {string} title
   */
  open: function open(url, title) {
    _callNative('open?url=' + encodeURIComponent(url) + '&title=' + (title != null && title !== '' ? encodeURIComponent(title) : ''));
  },


  /**
   * 关闭当前 WebView
   */
  close: function close() {
    _callNative('close');
  },


  /**
   * 退出 SDK，回到接入方界面
   */
  exit: function exit() {
    _callNative('exit');
  },


  /**
   * 进入开户流程界面
   */
  oac: function oac() {
    _callNative('uploadCardInfo');
  },


  /**
   * 扫描身份证
   */
  scanIDCard: function scanIDCard(ok, fail) {
    _scanIDCardCallBackFactory(ok, fail);
    _callNative('openScanIDCard=true');
  },


  /**
   * 开始双向视频
   * @param options
   * @param ok
   * @param fail
   */
  video: function video() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      anyChatStreamIpOut: '',
      anyChatStreamPort: '',
      userName: '',
      loginPwd: '',
      roomId: '',
      roomPwd: '',
      remoteId: ''
    };
    var ok = arguments[1];
    var fail = arguments[2];

    _videoCallBackFactory(ok, fail);
    _callNative('video?' + _qs2.default.stringify(options));
  }
};

exports.default = Bridge;