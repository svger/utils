import { sign } from 'cefc-utils/lib/sign';
import { genTrackStat } from './tracker';
import { getUser, getAppMeta } from './data';

export default function gen(config) {
  const trackStat = genTrackStat();
  const { clientId, tpId } = getUser();
  const { version, deviceType } = getAppMeta();

  // 组装 sas 身份验证、用户有效性验证、签名验证所需请求头
  return {
    ...trackStat,
    sign: sign(JSON.stringify(config.data), trackStat.uuid, tpId),
    deviceId: tpId,
    tpClientId: clientId,
    timestamp: Date.now(),
    noncestr: trackStat.uuid,
    v: version,
    deviceType
  }
}
