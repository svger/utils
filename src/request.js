import axios from 'axios';
import EventEmitter from 'eventemitter3';
// import { sign } from 'cefc-utils/src/sign';
// import { genTrackStat } from './tracker';
// import { getUser, getAppMeta } from './data';
import Log from './log';

/**
 * Biz/request
 *
 * @description 处理与服务端通信，主要功能点如下:
 *              1. 请求中支持 loading 状态
 *              2. body 参数结构化
 *              3. 限制同一接口多次频繁请求
 *              4. 针对业务错误码或请求网络错误友好提示
 *              5. Header 中签名/统计/用户标识信息
 *              6. 打通 nginx、node、service 标识请求唯一的字段
 *              7. 异常日志记录
 * @example
 * // 默认配置 sas 服务为 baseURL，行情接口请求时可直接传绝对地址
 * Request.request.defaults.baseURL = CONFIG.API_SERVER;
 * // 配置 loading 样式
 * Request.loading = {
 *   on: true,
 *   show() { Loading.show({ content: '加载中', state: 'loading' }); },
 *   close() { Loading.hide(); },
 *   fail() { Loading.show({ content: '加载失败', state: 'fail', time: 1500, isHide: true }); }
 * };
 *
 * // 业务错误码默认处理
 * Request.on(Request.ResEvtType.DEFAULT_BIZ_ERR, () => { // 弹框提示错误信息 });
 *
 * // 业务错误码特殊处理，适用于所有请求的错误码
 * const AUTH_ERR_CODE = Request.buildBizErrTypeWithCode('123456');
 * Request.on(AUTH_ERR_CODE, () => { // 跳转到登录页面 });
 * // 适用于特定请求的业务错误码处理
 * const BIZ_ERR_CODE = Request.buildBizErrTypeWithCode('234567');
 * Request.once(BIZ_ERR_CODE, () => { // 错误码处理 })
 *
 * Request.post('/trade', {
 *   method: 'xxx',
 *   market, price, bsFlag, secuId, stkCode
 * }, {
 *   headers: {
 *     token: cookies.get('token')
 *   },
 *   silent: false,
 *   // preventHandleResError: false
 * }).then((ret) => {
 *   // 正常情况处理
 * }).catch((err) => {
 *   // 异常处理，一般不需自行处理，除非设置 preventHandleResError 为 true
 *   // err 可能为业务错对象或 Error 的实例(网络错误对象或代码异常对象)
 * });
 *
 */

const request = axios.create();

// 设置 60s 超时
request.defaults.timeout = 1000 * 60;
// 设置 baseURL
// request.defaults.baseURL = CONFIG.API_SERVER;

/**
 * 包装 request 增加 cancable 功能
 *
 * @param {object} config 请求配置
 * @param {boolean} config.preventHandleResError 是否阻止处理响应错误，默认不阻止
 * @param {boolean} config.silent 是否静默请求，不展示 loading，默认不展示 true
 */
function Request(config) {
  // 3
  const uniqId = genReqUniqId({
    baseURL: request.defaults.baseURL,
    ...config
  });

  if (Request._reqs.has(uniqId)) {
    return Promise.reject(SAME_REQ_CANCELED);
  }
  Request._reqs.add(uniqId);
  config.extra = { uniqId };

  return request(config).then((res) => {
    if (isNoBodyMethod(config.method)) {
      return res.data;
    }

    if (res.data && res.data.error) {
      return Promise.reject(res.data.error);
    }

    return res.data.result;
  });
}

const EE = new EventEmitter();

Request.on = (...args) => { EE.on(...args); };
Request.once = (...args) => { EE.once(...args) };
Request.off = (...args) => { EE.off(...args) };
Request.removeAllListeners = (...args) => { EE.removeAllListeners(...args); };

// 所有请求方法集合
Request.Methods = {
  POST: 'post',
  GET: 'get',
  PUT: 'put',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options',
  PATCH: 'patch'
};

// 所有响应事件
Request.ResEvtTypes = {
  BIZ_ERR: 'biz_err',
  NET_ERR: 'net_err',
  DEFAULT_BIZ_ERR: 'default_biz_err'
};

Request.loading = {
  on: false,
  show() {},
  close() {},
  fail() {}
};

// 根据请求配置生成自定义 headers
Request.dynamicHeaders = () => {}

// 请求中的 reqUniqId 集合
Request._reqs = new Set();

request.interceptors.request.use(reqInspector, reqErrInspector);
request.interceptors.response.use(resInspector, resErrInspector);

const SAME_REQ_CANCELED = 'same_req_canceled';

// 请求拦截器
function reqInspector(config) {
  // 1
  if (Request.loading.on && !config.silent) {
    Request.loading.show();
  }

  // 5
  if (config.data && config.method.toLowerCase() === Request.Methods.POST) {
    // 组装 sas 身份验证、用户有效性验证、签名验证所需请求头
    Object.assign(config.headers, Request.dynamicHeaders(config) || {});

    // const { clientId, tpId } = getUser();
    // const trackStat = genTrackStat();
    // const { version, deviceType } = getAppMeta();

    // 组装 sas 身份验证、用户有效性验证、签名验证所需请求头
    // Object.assign(config.headers, {
    //   ...trackStat,
    //   sign: sign(JSON.stringify(config.data), trackStat.uuid, tpId),
    //   deviceId: tpId,
    //   tpClientId: clientId,
    //   timestamp: Date.now(),
    //   noncestr: trackStat.uuid,
    //   v: version,
    //   deviceType
    // });

    // 2
    // 适配 sas 数据格式
    config.data = { data: config.data };
  }

  // 6
  if (!config.params) {
    config.params = {};
  }

  config.params._ = Date.now();

  return config;
}

function reqErrInspector(error) {
  return Promise.reject(error);
}

// 响应拦截器
function resInspector(res) {
  const {
    data, config, status, statusText, headers
  } = res;
  const errInfo = {
    api: config.url,
    req: {
      method: config.method,
      params: config.params,
      data: config.data,
      headers: config.headers,
      responseType: config.responseType,
      timeout: config.timeout
    },
    res: { status, statusText, headers }
  };

  // 3
  // 请求完成从集合中删除锁
  Request._reqs.delete(config.extra.uniqId);

  // 1
  if (Request.loading.on && !config.silent) {
    Request.loading.close();
  }

  // 4
  if (data.error) {
    // 7
    // 业务响应错误日志记录
    Log.warn({
      name: '业务响应错误码',
      error: data.error,
      ...errInfo
    });

    if (!config.preventHandleResError) {
      const bizErrType = buildBizErrTypeWithCode(data.error.code);

      // 项目有特殊处理
      if (EE.listenerCount(bizErrType) > 0) {
        EE.emit(bizErrType, data.error);
      } else {
        // 业务错误码默认处理
        EE.emit(Request.ResEvtTypes.DEFAULT_BIZ_ERR, data.error);
      }
    }
  }

  return res;
}

function resErrInspector(error) {
  const {
    data, config, status, statusText, headers
  } = error.response;
  const errInfo = {
    api: config.url,
    req: {
      method: config.method,
      params: config.params,
      data: config.data,
      headers: config.headers,
      responseType: config.responseType,
      timeout: config.timeout
    },
    res: { status, statusText, headers }
  };
  // 网络错误或服务异常
  if (Request.loading.on && !config.silent) {
    Request.loading.fail();
  }

  EE.emit(Request.ResEvtTypes.NET_ERR, error.response);
  Log.warn({
    name: '网络错误或服务异常',
    error: { data },
    ...errInfo
  });

  return Promise.reject(error);
}

/**
 * 根据 config 生成 reqUniqId
 * @param {object} config req 配置
 */
function genReqUniqId({
  baseURL, url, method, data, params
}) {
  if (isNoBodyMethod(method)) {
    let _params = { ...params };

    if (_params._) {
      delete _params._;
    }

    return `${method}|${baseURL}${url}|${JSON.stringify(_params)}`;
  }

  return `${method}|${baseURL}${url}|${JSON.stringify(data)}`;
}

/**
 * 生成响应结果的业务错误类型
 * @param {string} code 业务错误码
 */
function buildBizErrTypeWithCode(code) {
  return `${Request.ResEvtTypes.BIZ_ERR}_${code}`;
}

function reqFactory(method) {
  return function(url, data, config) {
    let ret = {
      baseURL: request.defaults.baseURL, url, method
    }

    const isNoBody = isNoBodyMethod(method);

    if (isNoBody) {
      config = data;
    } else {
      ret.data = data;
    }

    if (!config) {
      config = {};
    }

    ret.params = config.params;

    // 3
    const uniqId = genReqUniqId(ret);
    if (Request._reqs.has(uniqId)) {
      return Promise.reject(SAME_REQ_CANCELED);
    }
    Request._reqs.add(uniqId);
    config.extra = { uniqId };

    if (isNoBody) {
      return request[method](url, config).then(res => res.data);
    }

    return request[method](url, data, config).then((res) => {
      if (res.data && res.data.error) {
        return Promise.reject(res.data.error);
      }

      return res.data.result;
    });
  }
}

/**
 * 是否是不含 body 的请求类型
 * @param {string} method 请求类型
 */
function isNoBodyMethod(method) {
  return method === Request.Methods.GET
    || method === Request.Methods.DELETE
    || method === Request.Methods.HEAD
    || method === Request.Methods.OPTIONS;
}

// 提供业务增加 inspector
Request.request = request;
Request.get = reqFactory(Request.Methods.GET);
Request.post = reqFactory(Request.Methods.POST);
Request.delete = reqFactory(Request.Methods.DELETE);
Request.head = reqFactory(Request.Methods.HEAD);
Request.options = reqFactory(Request.Methods.OPTIONS);
Request.patch = reqFactory(Request.Methods.PATCH);
Request.buildBizErrTypeWithCode = buildBizErrTypeWithCode;

export default Request;
