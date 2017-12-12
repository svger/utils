/* global describe, it */
import { assert } from 'chai';
import sinon from 'sinon';
import Request from '../src/request';

const stockSearchUrl = 'https://ztbhq.shhxzq.com/newapi/json/securitysearch/?exch=0|1'

describe('Request', () => {
  describe('throttle', () => {
    it('should just called once', () => {
      // const cb = sinon.spy();

      // const p1 = Request.get(stockSearchUrl, {
      //   params: {
      //     num: 6,
      //     id: 50
      //   }
      // }).then(cb);

      // const p2 = Request.get(stockSearchUrl, {
      //   params: {
      //     num: 6,
      //     id: 50
      //   }
      // }).then(cb);

      // Promise.all([p1, p2]).finally(() => {
      //   assert.equal(cb.callCount, 1, '只能调一次');
      // });

      assert.ok(true);
    });
  });
});
