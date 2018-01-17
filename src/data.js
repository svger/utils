import { getItem, setItem, Types } from 'cefc-utils/lib/storage';

let __cache = {
  user: {},
  oac: {},
  meta: {}
};

/**
 * 获取用户信息
 * @returns
 */
export const getUser = () => {
  return { ...__cache.user };
};

/**
 * 设置用户信息
 * @param {Object} user 用户数据
 */
export const setUser = (user) => {
  __cache.user = { ...user };
};

/**
 * 获取开户状态信息
 * @returns
 */
export const getOAC = () => {
  return { ...__cache.oac };
};

/**
 * 设置开户状态信息
 * @param {Object} oac 开户状态信息
 */
export const setOAC = (oac) => {
  __cache.oac = { ...oac };
};

/**
 * 获取应用描述信息
 * @returns { version: appVersion, deviceType, platform, debug }
 */
export const getAppMeta = () => {
  return { ...__cache.oac };
}

/**
 * 设置 AppMeta 信息
 * @param {Object} meta AppMeta 信息
 */
export const setAppMeta = (meta) => {
  __cache.meta = { ...meta };
}

/**
 * 可存取的字段
 */
export const Fields = {
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
  for (let key in Fields) {
    if (Fields[key] === field) {
      return true;
    }
  }

  return false;
}

export function set(field, val) {
  if (!isValidFields(field)) {
    throw Error(`不可设置不在 Fields 列表中的字段 ${field}`);
  }

  setItem(Types.LOCAL, field, val);
}

export function get(field) {
  if (!isValidFields(field)) {
    throw Error(`不可获取不在 Fields 列表中的字段 ${field}`);
  }

  getItem(Types.LOCAL, field);
}

/**
 * 根据市场类型获取股东账号
 * @param {string} marketType 交易市场类型, 深圳SZ - '0'
 *                                        上海SH - '1'
 *                                        香港HK - '2'
 */
export function getShareholderNo(marketType) {
  const shareholderNos = get(Fields.SHAREHOLDER_NOS);

  if (shareholderNos) {
    return shareholderNos[marketType];
  }
}
