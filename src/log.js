/* global navigator */
import axios from 'axios';
import { calcStorageDataSize, available, Types } from 'cefc-utils/es/storage';
import Log from 'cefc-utils/es/log';
import { getUser, getAppMeta } from './data';

const isBrowser = process.env.BROWSER;

/**
 * 获取基本日志信息
 *
 * @returns {*}
 * @private
 */
function getBaseLogInfo() {
  const { version } = getAppMeta();
  const { fundId, clientId, snsAccount } = getUser();

  return {
    href: window.location.href,
    fundId,
    clientId,
    snsAccount,
    net: navigator.onLine,
    sessionStorage: available(Types.SESSION),
    localStorage: available(Types.LOCAL),
    sessionStorageDataSize: calcStorageDataSize(Types.SESSION),
    localStorageDataSize: calcStorageDataSize(Types.LOCAL),
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
  window.onerror = (error, scriptURI, lineNumber, colNumber, errorObj) => {
    Log.error({
      name: '脚本异常',
      error,
      scriptURI,
      lineNumber,
      colNumber,
      stack: errorObj.stack
    });

    return false;
  }
}

function _defaultReporter(data) {
  axios({
    method: 'post',
    url: '/stats/log',
    data: { env: 'browser', ...data, ...getBaseLogInfo() }
  });
}

Log.init = function (reporter) {
  let _reporter = _defaultReporter;

  if (reporter) {
    _reporter = (data) => {
      let info = {
        env: isBrowser ? 'browser' : 'server',
        ...data,
        t: new Date().getTime()
      };

      if (isBrowser) {
        Object.assign(info, getBaseLogInfo());
      }

      reporter(info);
    };
  }

  // 日志上报设置
  Log.setReporter(_reporter);

  if (isBrowser) {
    // 收集异常
    monitorException();
  }
};


export default Log;

