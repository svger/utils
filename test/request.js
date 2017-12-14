/* global describe, it */
import { assert } from 'chai';
import sinon from 'sinon';
import Request from '../src/request';

// --require babel-polyfill --require babel-register
const stockSearchUrl = 'https://ztbhq.shhxzq.com/newapi/json/securitysearch/?exch=0|1'

describe('Request', () => {
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

      const p2 = Request.get(stockSearchUrl, {
        params: {
          num: 6,
          id: 50
        }
      }).then(cb).catch(catchHandler);

      const p3 = Request.get(stockSearchUrl, {
        params: {
          num: 6,
          id: 50
        }
      }).then(cb).catch(catchHandler);

      const p4 = Request.get(stockSearchUrl, {
        params: {
          num: 6,
          id: 50
        }
      }).then(cb).catch(catchHandler);
    });
  });

  describe('baseURL 配置', () => {
    Request.request.defaults.baseURL = 'http://nbuat.shhxzq.com/api/nbcb/';

    it('url 使用绝对地址时，baseURL应不可用 ', (done) => {
      Request.get(stockSearchUrl, {
        params: {
          num: 6,
          id: 50
        }
      }).then((res) => {
        assert.ok(typeof res.data === 'object');
        done();
      });
    });

    it('url 使用相对地址，baseURL 可用', (done) => {
      Request.post('sas', {
        method: 'sas.assetsQuery',
        fundId: '880004877',
        moneyType: "0"
      }).then((res) => {
        assert.ok(typeof res.data === 'object');
        done();
      });
    })
  });

  describe('loading 配置', () => {
    let show, close, fail;

    beforeEach(() => {
      show = sinon.spy();
      close = sinon.spy();
      fail = sinon.spy();

      Request.loading = {
        on: true,
        show, close, fail
      };
    });

    it('loading 开关打开时，请求时展示loading，结束后自动关闭', (done) => {
      Request.post('sas', {
        method: 'sas.assetsQuery',
        fundId: '880004877',
        moneyType: "0"
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
});
