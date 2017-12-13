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
    it('loading 开关打开时，请求时展示loading，结束后自动关闭', (done) => {
      const show = sinon.spy();
      const close = sinon.spy();
      const fail = sinon.spy();
      Request.loading = {
        on: true,
        show, close, fail
      };

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
      const show = sinon.spy();
      const close = sinon.spy();
      const fail = sinon.spy();
      Request.loading = {
        on: true,
        show, close, fail
      };

      Request.get('sas').catch((err) => {
        assert.ok(show.calledOnce, '展示loading');
        assert.equal(close.callCount, 0, '应不关闭loading');
        assert.equal(fail.callCount, 1, '应展示失败提示');
        done();
      });
    });
    
  });
});
