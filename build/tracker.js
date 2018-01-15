'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SESSION_ID = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Biz/tracker
                                                                                                                                                                                                                                                                   * 行为统计
                                                                                                                                                                                                                                                                   * 主要是接口埋点，根据用户调用的接口分析用户的行为
                                                                                                                                                                                                                                                                   */


exports.genTrackStat = genTrackStat;
exports.hasCache = hasCache;
exports.cache = cache;
exports.page = page;
exports.pageView = pageView;

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _data = require('./data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// 一次会话一个 ID，最好在 Node Server 端生成
// 目前每加载一次页面会生成一个 ID，并不是一次会话一个 ID
// 因为 Node Server 端多进程没有共享 Session
var SESSION_ID = exports.SESSION_ID = (0, _uuid2.default)();

/**
 * 生成接口统计 Header 参数
 * @returns {{requestAppId: string, pageid: string, uuid: string, requestTime: number}}
 */
function genTrackStat() {
  return {
    requestAppId: SESSION_ID,
    // eslint-disable-next-line no-restricted-globals,no-undef
    pageid: window.location.href,
    uuid: (0, _uuid2.default)(),
    requestTime: Date.now()
  };
}

// 页面访问估计缓存
var _pageTrackCache = [];

/**
 * 检查是否有未上传的页面访问轨迹
 * @returns {boolean}
 */
function hasCache() {
  return _pageTrackCache.length > 0;
}

/**
 * 缓存页面访问轨迹
 * @param pageid
 * @param extras
 */
function cache(pageid, extras) {
  _pageTrackCache.push(_extends({ pageid: pageid }, extras));
}

/**
 * 上传上次缓存的页面访问轨迹
 */
function page(uploader) {
  var cache = _pageTrackCache.shift();

  if (!cache) {
    return;
  }

  var pageid = cache.pageid,
      entertime = cache.entertime;


  var headers = {
    requestAppId: SESSION_ID,
    requestTime: Date.now()
  };

  uploader && uploader(headers, {
    uuid: (0, _uuid2.default)(),
    pageid: pageid,
    entertime: entertime,
    exittime: Date.now()
  });
}

/**
 * 上传页面轨迹数据
 *
 * @param headers
 * @param data
 */
function uploadTrackInfo(uploader) {
  return function (headers, data) {
    var _getUser = (0, _data.getUser)(),
        fundId = _getUser.fundId,
        clientId = _getUser.clientId,
        snsAccount = _getUser.snsAccount;

    uploader(_extends({}, headers, { fundId: fundId, deviceId: clientId }), _extends({}, data, {
      snsAccount: snsAccount
    }));
  };
}

/**
 * 统计页面改变
 * @example
 *
 * // 上传数据函数
 * function upload(headers, data) {
 *   axios({ method: 'post', url: '/stats/track', headers, data });
 * }
 *
 * // 监听页面改变
 * browserHistory.listen(() => pageView(upload));
 *
 * @param {function} reporter 上传数据
 */
function pageView(reporter) {
  // 页面停留时间监控
  if (hasCache()) {
    page(uploadTrackInfo(reporter));
  }

  cache(window.location.href, {
    entertime: Date.now()
  });
}