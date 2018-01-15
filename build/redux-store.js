'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = configureStore;
exports.addReducer = addReducer;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 给 thunk action 注入参数 fetch、history
 *
 * @example
 *
 * function aActionCreator() {
 *   return (dispatch, fetch, history) {
 *     fetch('https://xxx.com/a/b')
 *       .then(res => {
 *         history.push({ pathname: '/home', search: '?the=query', state: { some: 'state' } });
 *       });
 *   }
 * }
 */

/**
 * utils/redux-store
 *
 * actions、reducers 可以按业务模块写在一个文件中，并通过 addReducer 动态添加到 store
 */
function configureStore(initialState, helpers) {
  var middleware = [_reduxThunk2.default.withExtraArgument(helpers)];

  var enhancer = null;

  // eslint-disable-next-line no-underscore-dangle
  if (process.env.__DEV__) {
    // https://github.com/zalmoxisus/redux-devtools-extension#redux-devtools-extension
    var devToolsExtension = function devToolsExtension(f) {
      return f;
    };
    if (process.env.BROWSER && window.devToolsExtension) {
      devToolsExtension = window.devToolsExtension();
    }

    enhancer = (0, _redux.compose)(_redux.applyMiddleware.apply(undefined, middleware), devToolsExtension);
  } else {
    enhancer = _redux.applyMiddleware.apply(undefined, middleware);
  }

  // client 使用 global store
  return (0, _redux.createStore)(function (state) {
    return state;
  }, initialState, enhancer);
}

// eslint-disable-next-line prefer-const
var reducerCache = {};

/**
 * client 使用，动态增加 reducers
 * @param {*} reducers
 */
function addReducer(store, reducers) {
  if (process.env.BROWSER) {
    var reducerKeys = Object.keys(reducers);
    reducerKeys.forEach(function (key) {
      reducerCache[key] = reducers[key];
    });

    store.replaceReducer((0, _redux.combineReducers)(reducerCache));

    return;
  }

  // server 端
  store.replaceReducer((0, _redux.combineReducers)(reducers));
}