/* global describe, it, beforeEach */
import { assert } from 'chai';
import sinon from 'sinon';
import Request from '../src/request';

// --require babel-polyfill --require babel-register
const stockSearchUrl = 'https://baidu.com/'

describe('限流', () => {
  it('多个相同的请求同时只允许请求一次', (done) => {
    const cb = sinon.spy();

    let catchHandlerCalled = false;

    function catchHandler() {
      if (catchHandlerCalled) {
        return;
      }

      catchHandlerCalled = true;

      p1.then(() => {
        assert.equal(cb.callCount, 1, '只能调一次');
        done()
      });
    }

    const p1 = Request.get(stockSearchUrl, {
      params: {
        num: 6,
        id: 50
      }
    }).then(cb);

    Request.get(stockSearchUrl, {
      params: {
        num: 6,
        id: 50
      }
    }).then(cb).catch(catchHandler);

    Request.get(stockSearchUrl, {
      params: {
        num: 6,
        id: 50
      }
    }).then(cb).catch(catchHandler);

    Request.get(stockSearchUrl, {
      params: {
        num: 6,
        id: 50
      }
    }).then(cb).catch(catchHandler);
  });
});

describe('baseURL 配置', () => {
  Request.request.defaults.baseURL = 'http://baidu.com';

  it('url 使用绝对地址时，baseURL应不可用 ', (done) => {
    Request.get(stockSearchUrl, {
      params: {
        num: 6,
        id: 50
      }
    }).then((ret) => {
      assert.ok(ret.keyboardFairy.length > 0);
      done();
    });
  });

  it('url 使用相对地址，baseURL 可用', (done) => {
    Request.post('sas', {
      method: 'sas.assetsQuery',
      fundId: '880004877',
      moneyType: '0'
    }).then((ret) => {
      assert.ok(ret.length > 0);
      done();
    });
  })
});

describe('loading 配置', () => {
  // eslint-disable-next-line one-var, init-declarations
  let show, close, fail;

  beforeEach(() => {
    show = sinon.spy();
    close = sinon.spy();
    fail = sinon.spy();

    Request.loading = {
      on: true,
      show,
      close,
      fail
    };
  });

  it('loading 开关打开时，请求时展示loading，结束后自动关闭', (done) => {
    Request.post('sas', {
      method: 'sas.assetsQuery',
      fundId: '880004877',
      moneyType: '0'
    }).then((res) => {
      assert.ok(show.calledOnce, '展示loading');
      assert.ok(close.calledOnce, '关闭loading');
      assert.equal(fail.callCount, 0, '应不展示失败提示');
      done();
    });
  });

  it('loading 开关打开时，请求失败应展示失败提示', (done) => {
    Request.get('sas').catch((err) => {
      assert.ok(show.calledOnce, '展示loading');
      assert.equal(close.callCount, 0, '应不关闭loading');
      assert.equal(fail.callCount, 1, '应展示失败提示');
      done();
    });
  });

  it('若配置 silent，应不展示 loading', (done) => {
    Request({
      method: 'post',
      url: 'sas',
      data: {
        method: 'sas.assetsQuery',
        // fundId: '880004877',
        moneyType: '0'
      },
      silent: true
    }).catch((err) => {
      assert.equal(show.callCount, 0, '不展示loading');
      assert.equal(close.callCount, 0, '不关闭loading');
      assert.equal(fail.callCount, 0, '不展示失败提示');
      done();
    });
  });

  it('loading 开关关闭时，不应展示 loading 提示', (done) => {
    Request.loading.on = false;

    Request.get('trade').catch((err) => {
      assert.equal(show.callCount, 0, '不展示loading');
      assert.equal(close.callCount, 0, '不关闭loading');
      assert.equal(fail.callCount, 0, '不展示失败提示');
      done();
    });
  });
});

describe('业务错误码处理', () => {
  it('若对错误码没有特殊处理，则使用默认处理', (done) => {
    const defaultBizErrHandler = sinon.spy();
    Request.on(Request.ResEvtTypes.DEFAULT_BIZ_ERR, defaultBizErrHandler);

    Request.post('sas', {
      method: 'sas.assetsQuery',
      // fundId: '880004877',
      moneyType: '0'
    }).catch((err) => {
      assert.ok(defaultBizErrHandler.calledOnce, '业务错误码默认处理');
      Request.off(Request.ResEvtTypes.DEFAULT_BIZ_ERR);
      done();
    });
  });

  it('对公共业务错误码处理', (done) => {
    const notLoginHandler = sinon.spy();
    const pwdErrCode = Request.buildBizErrTypeWithCode(10505001);
    Request.on(pwdErrCode, notLoginHandler);

    Request.post('kh', {
      method: 'sso.login',
      inputId: '880004877',
      inputType: 'Z',
      netAddr: '5',
      netAddr2: '5',
      cryptPwd: ''
    }).catch((err) => {
      assert.ok(notLoginHandler.calledOnce, '具体业务错误码处理');
      Request.off(pwdErrCode);
      done();
    });
  });

  it('对特殊业务错误码处理', (done) => {
    const bizErrHandler = sinon.spy();
    const bizErrCode = Request.buildBizErrTypeWithCode(10800999);
    Request.once(bizErrCode, bizErrHandler);

    Request.post('sas', {
      method: 'sas.assetsQuery',
      // fundId: '880004877',
      moneyType: '0'
    }).catch((err) => {
      assert.ok(bizErrHandler.calledOnce, '特殊业务错误码处理');
      done();
    });
  });

  it('若配置 preventHandleResError 为 true，应不处理业务错误码', (done) => {
    const bizErrHandler = sinon.spy();
    const bizErrCode = Request.buildBizErrTypeWithCode(10800999);
    Request.once(bizErrCode, bizErrHandler);

    Request({
      method: 'post',
      url: 'sas',
      data: {
        method: 'sas.assetsQuery',
        // fundId: '880004877',
        // moneyType: "0"
      },
      preventHandleResError: true
    }).catch((err) => {
      assert.equal(bizErrHandler.callCount, 0, '不应被调用');
      done();
    });
  });
});
