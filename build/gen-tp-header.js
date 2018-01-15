'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = gen;

var _sign = require('cefc-utils/src/sign');

var _tracker = require('./tracker');

var _data = require('./data');

function gen(config) {
  var trackStat = (0, _tracker.genTrackStat)();

  var _getUser = (0, _data.getUser)(),
      clientId = _getUser.clientId,
      tpId = _getUser.tpId;

  var _getAppMeta = (0, _data.getAppMeta)(),
      version = _getAppMeta.version,
      deviceType = _getAppMeta.deviceType;

  // 组装 sas 身份验证、用户有效性验证、签名验证所需请求头


  return _extends({}, trackStat, {
    sign: (0, _sign.sign)(JSON.stringify(config.data), trackStat.uuid, tpId),
    deviceId: tpId,
    tpClientId: clientId,
    timestamp: Date.now(),
    noncestr: trackStat.uuid,
    v: version,
    deviceType: deviceType
  });
}