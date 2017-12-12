import axios from 'axios';
import EventEmitter from 'eventemitter3';
import { sign } from 'cefc-utils/src/sign';
import { genTrackStat } from './tracker';
import { getUser, getAppMeta } from './data';
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
 * Request.on(Request.ResEvtType.DEFAULT_BIZ_ERR, () => { // 弹框提示错误信息 });
 * const AUTH_ERR_CODE = Request.buildBizErrTypeWithCode('123456');
 * Request.on(AUTH_ERR_CODE, () => { // 跳转到登录页面 });
 *
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
  if (!config.cancelToken) {
    config._source = axios.CancelToken.source();
    config.cancelToken = config._source.token;
  }

  request(config);
}

const EE = new EventEmitter();

Object.assign(Request, EE);

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
Request.ResEvtType = {
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

// 请求中的 reqUniqId 集合
Request._reqs = new Set();

request.interceptors.request.use(reqInspector, reqErrInspector);
request.interceptors.response.use(resInspector, resErrInspector);

const SAME_REQ_CANCELED = 'same_req_canceled';

// 请求拦截器
function reqInspector(config) {
  const uniqId = genReqUniqId(config);

  // 3
  if (Request._reqs.has(uniqId)) {
    config._source && config._source.cancel(SAME_REQ_CANCELED);

    return config;
  }

  Request._reqs.add(uniqId);

  // 1
  if (Request.loading.on && !config.silent) {
    Request.loading.show();
  }

  // 5
  if (config.data && config.method.toLowerCase() === Request.Methods.POST) {
    const { clientId, tpId } = getUser();
    const trackStat = genTrackStat();
    const { version, deviceType } = getAppMeta();

    // 组装 sas 身份验证、用户有效性验证、签名验证所需请求头
    Object.assign(config.headers, {
      ...trackStat,
      sign: sign(JSON.stringify(config.data), trackStat.uuid, tpId),
      deviceId: tpId,
      tpClientId: clientId,
      timestamp: Date.now(),
      noncestr: trackStat.uuid,
      v: version,
      deviceType
    });

    // 2
    // 适配 sas 数据格式
    config.data = { data: config.data };
  }

  // 6
  if (!config.params) {
    config.params = {};
  }

  config.params._ = Date.now();

  config.extra = { uniqId };

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
    res: { headers }
  };

  // 3
  // 请求完成从集合中删除锁
  Request._reqs.delete(config.extra.uniqId);

  // 1
  if (Request.loading.on && !config.silent) {
    // 网络错误或服务异常
    if (status !== 200) {
      Request.loading.fail();
      Request.emit(Request.ResEvtType.NET_ERR, res);
      Log.warn({
        name: '网络错误或服务异常',
        error: { data, status, statusText },
        ...errInfo
      });
    } else {
      Request.loading.close();
    }
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
      if (Request.listenerCount(bizErrType) > 0) {
        Request.emit(bizErrType, data.error);
      } else {
        // 业务错误码默认处理
        Request.emit(Request.ResEvtType.DEFAULT_BIZ_ERR, data.error);
      }
    }
  }

  return res;
}

function resErrInspector(error) {
  return Promise.reject(error);
}

/**
 * 根据 config 生成 reqUniqId
 * @param {object} config req 配置
 */
function genReqUniqId({
  baseURL, url, method, data, headers, params
}) {
  if (method === Request.Methods.GET
    || method === Request.Methods.DELETE
    || method === Request.Methods.HEAD
    || method === Request.Methods.OPTIONS) {
    let _params = { ...params };

    if (_params._) {
      delete _params._;
    }

    return `${method}|${baseURL}${url}|${JSON.stringify(_params)}|${JSON.stringify(headers)}`;
  }

  if (method === Request.Methods.POST
    || method === Request.Methods.PUT
    || method === Request.Methods.PATCH) {
    return `${method}|${baseURL}${url}|${JSON.stringify(data)}|${JSON.stringify(headers)}`;
  }
}

/**
 * 生成响应结果的业务错误类型
 * @param {string} code 业务错误码
 */
function buildBizErrTypeWithCode(code) {
  return `${Request.ResEvtType.BIZ_ERR}_${code}`;
}

function reqFactory(type) {
  return function(url, data, config) {
    let short = false;

    if (type === Request.Methods.GET
      || type === Request.Methods.DELETE
      || type === Request.Methods.HEAD
      || type === Request.Methods.OPTIONS
    ) {
      config = data;
      short = true;
    }

    if (!config.cancelToken) {
      config._source = axios.CancelToken.source();
      config.cancelToken = config._source.token;
    }

    if (short) {
      return request[type](url, config);
    }

    return request[type](url, data, config);
  }
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
