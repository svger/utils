'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Fields = exports.setAppMeta = exports.getAppMeta = exports.setOAC = exports.getOAC = exports.setUser = exports.getUser = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.set = set;
exports.get = get;
exports.getShareholderNo = getShareholderNo;

var _storage = require('cefc-utils/src/storage');

var __cache = {
  user: {},
  oac: {},
  meta: {}
};

/**
 * 获取用户信息
 * @returns
 */
var getUser = exports.getUser = function getUser() {
  return _extends({}, __cache.user);
};

/**
 * 设置用户信息
 * @param {Object} user 用户数据
 */
var setUser = exports.setUser = function setUser(user) {
  __cache.user = _extends({}, user);
};

/**
 * 获取开户状态信息
 * @returns
 */
var getOAC = exports.getOAC = function getOAC() {
  return _extends({}, __cache.oac);
};

/**
 * 设置开户状态信息
 * @param {Object} oac 开户状态信息
 */
var setOAC = exports.setOAC = function setOAC(oac) {
  __cache.oac = _extends({}, oac);
};

/**
 * 获取应用描述信息
 * @returns { version: appVersion, deviceType, platform, debug }
 */
var getAppMeta = exports.getAppMeta = function getAppMeta() {
  return _extends({}, __cache.oac);
};

/**
 * 设置 AppMeta 信息
 * @param {Object} meta AppMeta 信息
 */
var setAppMeta = exports.setAppMeta = function setAppMeta(meta) {
  __cache.meta = _extends({}, meta);
};

/**
 * 可存取的字段
 */
var Fields = exports.Fields = {
  // 股东账号
  SHAREHOLDER_NOS: 'accountMap',
  // 客户号
  CLIENT_NO: 'inputId',
  // 手机号
  MOBILE: 'mobile',
  // 设置
  SETTINGS: 'userHabits'
};

function isValidFields(field) {
  for (var key in Fields) {
    if (Fields[key] === field) {
      return true;
    }
  }

  return false;
}

function set(field, val) {
  if (!isValidFields(field)) {
    throw Error('\u4E0D\u53EF\u8BBE\u7F6E\u4E0D\u5728 Fields \u5217\u8868\u4E2D\u7684\u5B57\u6BB5 ' + field);
  }

  (0, _storage.setItem)(_storage.Types.LOCAL, field, val);
}

function get(field) {
  if (!isValidFields(field)) {
    throw Error('\u4E0D\u53EF\u83B7\u53D6\u4E0D\u5728 Fields \u5217\u8868\u4E2D\u7684\u5B57\u6BB5 ' + field);
  }

  (0, _storage.getItem)(_storage.Types.LOCAL, field);
}

/**
 * 根据市场类型获取股东账号
 * @param {string} marketType 交易市场类型, 深圳SZ - '0'
 *                                        上海SH - '1'
 *                                        香港HK - '2'
 */
function getShareholderNo(marketType) {
  var shareholderNos = get(Fields.SHAREHOLDER_NOS);

  if (shareholderNos) {
    return shareholderNos[marketType];
  }
}