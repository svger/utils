/**
 * Biz/tracker
 * 行为统计
 * 主要是接口埋点，根据用户调用的接口分析用户的行为
 */
import uuid from 'uuid';

import { getUser } from './data';

// 一次会话一个 ID，最好在 Node Server 端生成
// 目前每加载一次页面会生成一个 ID，并不是一次会话一个 ID
// 因为 Node Server 端多进程没有共享 Session
export const SESSION_ID = uuid();

/**
 * 生成接口统计 Header 参数
 * @returns {{requestAppId: string, pageid: string, uuid: string, requestTime: number}}
 */
export function genTrackStat() {
  return {
    requestAppId: SESSION_ID,
    // eslint-disable-next-line no-restricted-globals,no-undef
    pageid: window.location.href,
    uuid: uuid(),
    requestTime: Date.now()
  }
}

// 页面访问估计缓存
let _pageTrackCache = [];

/**
 * 检查是否有未上传的页面访问轨迹
 * @returns {boolean}
 */
export function hasCache() {
  return _pageTrackCache.length > 0;
}

/**
 * 缓存页面访问轨迹
 * @param pageid
 * @param extras
 */
export function cache(pageid, extras) {
  _pageTrackCache.push({ pageid, ...extras });
}

/**
 * 上传上次缓存的页面访问轨迹
 */
export function page(uploader) {
  const cache = _pageTrackCache.shift();

  if (!cache) {
    return;
  }

  const { pageid, entertime } = cache;

  const headers = {
    requestAppId: SESSION_ID,
    requestTime: Date.now()
  };

  uploader && uploader(headers, {
    uuid: uuid(),
    pageid,
    entertime,
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
  return (headers, data) => {
    const { fundId, clientId, snsAccount } = getUser();

    uploader({ ...headers, fundId, deviceId: clientId }, {
      ...data,
      snsAccount
    });
  }
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
 * @param {function} uploader 上传数据
 */
export default function pageView(uploader) {
  // 页面停留时间监控
  if (hasCache()) {
    page(uploadTrackInfo(uploader));
  }

  cache(window.location.href, {
    entertime: Date.now()
  });
}
