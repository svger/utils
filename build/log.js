'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /* global navigator */


var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _storage = require('cefc-utils/src/storage');

var _log = require('cefc-utils/src/log');

var _log2 = _interopRequireDefault(_log);

var _data = require('./data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isBrowser = process.env.BROWSER;

/**
 * 获取基本日志信息
 *
 * @returns {*}
 * @private
 */
function getBaseLogInfo() {
  var _getAppMeta = (0, _data.getAppMeta)(),
      version = _getAppMeta.version;

  var _getUser = (0, _data.getUser)(),
      fundId = _getUser.fundId,
      clientId = _getUser.clientId,
      snsAccount = _getUser.snsAccount;

  return {
    href: window.location.href,
    fundId: fundId,
    clientId: clientId,
    snsAccount: snsAccount,
    net: navigator.onLine,
    sessionStorage: (0, _storage.available)(_storage.Types.SESSION),
    localStorage: (0, _storage.available)(_storage.Types.LOCAL),
    sessionStorageDataSize: (0, _storage.calcStorageDataSize)(_storage.Types.SESSION),
    localStorageDataSize: (0, _storage.calcStorageDataSize)(_storage.Types.LOCAL),
    appVer: version,
    ua: navigator.userAgent
  };
}

/**
 * 监控异常信息
 * TODO 移动到业务公共层 Biz/monitor
 * @method monitoringException
 */
function monitorException() {
  window.onerror = function (error, scriptURI, lineNumber, colNumber, errorObj) {
    _log2.default.error({
      name: '脚本异常',
      error: error,
      scriptURI: scriptURI,
      lineNumber: lineNumber,
      colNumber: colNumber,
      stack: errorObj.stack
    });

    return false;
  };
}

function _defaultReporter(data) {
  (0, _axios2.default)({
    method: 'post',
    url: '/stats/log',
    data: _extends({ env: 'browser' }, data, getBaseLogInfo())
  });
}

_log2.default.init = function (reporter) {
  var _reporter = _defaultReporter;

  if (reporter) {
    _reporter = function _reporter(data) {
      var info = _extends({
        env: isBrowser ? 'browser' : 'server'
      }, data, {
        t: new Date().getTime()
      });

      if (isBrowser) {
        Object.assign(info, getBaseLogInfo());
      }

      reporter(info);
    };
  }

  // 日志上报设置
  _log2.default.setReporter(_reporter);

  if (isBrowser) {
    // 收集异常
    monitorException();
  }
};

exports.default = _log2.default;