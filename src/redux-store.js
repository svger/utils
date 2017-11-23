/**
 * utils/redux-store
 *
 * actions、reducers 可以按业务模块写在一个文件中，并通过 addReducer 动态添加到 store
 */
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import thunk from 'redux-thunk';

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

export default function configureStore(initialState, helpers) {
  const middleware = [thunk.withExtraArgument(helpers)];

  let enhancer = null;

  // eslint-disable-next-line no-underscore-dangle
  if (process.env.__DEV__) {
    // https://github.com/zalmoxisus/redux-devtools-extension#redux-devtools-extension
    let devToolsExtension = f => f;
    if (process.env.BROWSER && window.devToolsExtension) {
      devToolsExtension = window.devToolsExtension();
    }

    enhancer = compose(applyMiddleware(...middleware), devToolsExtension);
  } else {
    enhancer = applyMiddleware(...middleware);
  }

  // client 使用 global store
  return createStore(state => state, initialState, enhancer);
}

// eslint-disable-next-line prefer-const
let reducerCache = {};

/**
 * client 使用，动态增加 reducers
 * @param {*} reducers
 */
export function addReducer(store, reducers) {
  if (process.env.BROWSER) {
    const reducerKeys = Object.keys(reducers);
    reducerKeys.forEach(key => {
      reducerCache[key] = reducers[key];
    });

    store.replaceReducer(combineReducers(reducerCache));

    return;
  }

  // server 端
  store.replaceReducer(combineReducers(reducers));
}


