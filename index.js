
//strings
export const capFirstLetter = (str) => {
  return str ? (str[0].toUpperCase() + str.slice(1)) : str;
}

export const capAllWords = str => {
  return str.split(' ').map(capFirstLetter).join(' ');
}

//numbers

//takes lower bound (inclusive) and upper bound (exclusive)
export const getRandomInt = (...args) => {
  const [lower, upper] = args.length === 1 ? [0, args[0]] : args;
  const rand = Math.random();
  return Math.floor(rand * (upper - lower)) + lower;
}

export const getRandomBool = () => {
  return getRandomInt(2) === 1;
}


//functional
export const identity = x => x;

export function memoize(fn, serializer = identity) {
  const cache = {};
  return (...args) => {
    //with identity, results in a string of args' elements comma-separated 
    const key = serializer(args);
    if (!cache[key]) {
      cache[key] = fn(...args);
    }
    return cache[key];
  }
}

const arrFunc = (funcName) => (arr, ...paramsToPass) => {
  return arr[funcName](...paramsToPass);
}

const [map, forEach, filter, reduce, every] = ['map', 'forEach', 'filter', 'reduce', 'every'].map(arrFunc);
export const map = map;
export const forEach = forEach;
export const filter = filter;
export const reduce = reduce;
export const every = every;

export const not = (fn) => (...args) => !fn(...args);

export const thunk = (fn) => (...args) => () => fn(...args);

export const wrap = (val) => () => val;

export const noArg = (fn) => () => fn();

export const noop = () => {};

export const once = (fn) => {
  let called, result;
  return (...args) => {
    if (!called) {
      result = fn(...args);
      called = true;
    } 

    return result;
  }
};


export const caller = (...funcs) => {
  return () => funcs.forEach(fn => fn());
}

export const mapMany = (arrToMap, ...funcs) => {
  return funcs.reduce((acc, curr) => {
    return acc.map(curr);
  }, arrToMap);
}

export const compose = (...funcs) => {
  if (funcs.length === 0) {
    return identity;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

export const pipeline = (...funcs) => {
  return compose(...funcs.reverse());
};

export const isTruthy = x => !!x;
export const orNull = x => x || null;
export const last = arr => arr[arr.length - 1];

//pass an array of condition/result pairs and a final default
//ifElse([[false, '3'], [true, 5]], 'default') --> 5
export const ifElse = (pairs, final) => {

  for (var i = 0; i < pairs.length; i++) {
    const [condition, result] = pairs[i];
    if (isTruthy(condition)) return result;
  }

  //to still permit passing undefined as an explicit default
  if (arguments.length === 2) {
    return final;
  } else {
    throw new Error("Error using ifElse: no conditions met.  Pass a second param to serve as a default if this is intended.");
  }
}

//objects
//use when first object cannot be mutated
export const assignToNew = (...params) => {
  const objParams = params.filter(isObject);
  return Object.assign({}, ...objParams);
}

//use when first object can be mutated
export const assignToOld = (...params) => {
  const objParams = params.filter(isObject);
  return Object.assign(...objParams);
}

//shallow copy
export const copySet = originalSet => new Set(originalSet);


export const keys = Object.keys;
export const values = (obj) => keys(obj).map(k => obj[k]);

export const entries = (obj) => keys(obj).map(k => [k, obj[k]]);
export const entriesToObj = (arr, fn = null) => (fn ? arr.map(fn) : arr).reduce((acc, [k, v]) => {
  return assignToOld(acc, {[k]: v});
}, {});


export const mapObj = (obj, fn) => entriesToObj(entries(obj).map(([k, v]) => fn([k, v], obj)));
export const filterObj = (obj, fn) => entriesToObj(entries(obj).filter(fn));
export const reduceObj = (obj, fn, starting) => entries(obj).reduce(fn, starting);

export const iterateObj = (obj, fn) => entries(obj).forEach((kvPair) => fn(kvPair, obj));


export const isObject = (x) => x !== null && typeof x === 'object';

export const pick = (obj, keysArr) => {
  const keysInObj = new Set(keys(obj));
  return keysArr.reduce((acc, curr) => keysInObj.has(curr) ? Object.assign(acc, {[curr]: obj[curr]}) : acc, {});
}

export const omit = (obj, keysArr) => {
  const keysToOmit = new Set(keysArr);
  return filterObj(obj, ([k, v]) => !keysToOmit.has(k));
}


//arrays
export const randomArrayEl = (arr) => arr[getRandomInt(arr.length)];

export const makeArr = (count, fn) => {
  var result = [];
  for (var i = 0; i < count; i++) {
    result.push(fn(i));
  }
  return result;
}

export const keyBy = (arr, keySelector, valSelector = identity, collisions = false) => {
  const resultObj = arr.reduce((acc, curr, i, arr) => {
    const key = keySelector(curr, i, arr);
    if (collisions) {
      if (!acc[key]) {
        acc[key] = [curr];
      } else {
        acc[key] = acc[key].slice().concat(curr);
      }
    } else {
      acc[key] = valSelector(curr); 
    }

    return acc;
  }, {});

  return resultObj;
}

export const isUndefined = val => val === undefined;

export const isEmptyObj = obj => Object.keys(obj).length === 0; 

export const valToObj = val => ({[val]: val});

//getNewVal(oldVal, property, innerObj)
export const updateObj = (startObj, path, getNewVal) => {

  //can pass a function getNewVal(oldVal, property, innerObj) that returns the new value, 
  //or just pass the desired new value
  if (typeof getNewVal !== 'function') {
    getNewVal = wrap(getNewVal);
  }
  
  const pathParts = path.split('.');
  
  const recurse = ((obj, [currPart, ...rest]) => {
    
    const valForCurrPart = rest.length === 0 
      ? getNewVal(obj[currPart], currPart, obj) 
      : recurse(obj[currPart], rest);
    
    return assignToNew(obj, {[currPart]: valForCurrPart});
  });
  
  return recurse(startObj, path.split('.'));
};

export const stringsToObj = (...strings) => keyBy(strings, identity);

export const deepRemoveKey = (startObj, pathToKey) => {
  const pathParts = pathToKey.split('.');
  if (pathParts.length === 1) {
    return omit(startObj, [pathToKey]);
  }

  const propertyToRemove = last(pathParts);
  const pathToPropertyParent = pathParts.slice(0, -1).join('.');
  
  const removeKey = (origInnerObj) => {
    const withKeyRemoved = omit(origInnerObj, [propertyToRemove]);
    return withKeyRemoved;
  }

  return updateObj(startObj, pathToPropertyParent, removeKey);
}


//components
export const bindTo = (context, ...methods) => { 
  methods.forEach(method => context[method.name] = method.bind(context));
};

//apply a series of updates sequentially to an object (used to batch state updates taking place outside an event handler: https://stackoverflow.com/a/48610973)

export const mergeUpdates = (obj, updaterFuncsArr, returnUpdatesAndFullObject = false) => {
  if (updaterFuncsArr.length === 0) return {};

  const updates = [];
  const updatedObj = updaterFuncsArr.reduce(
    (acc, currFunc) => {
      const currUpdate = currFunc(acc);
      updates.push(currUpdate);
      const objWithCurrUpdate = assignToOld(acc, currUpdate);
      return objWithCurrUpdate;
    }, 
    assignToNew(obj)
  );

  const mergedUpdates = assignToNew(...updates);

  return returnUpdatesAndFullObject ? {mergedUpdates, updatedObj} : mergedUpdates;
}

//make a string of conditional css classes
export const classes = (...args) => {
  let result = [];
  args.forEach(arg => {
    if (arg) {
      if (typeof arg === 'string') {
        result.push(arg);
      } else if (isObject(arg)) {
        entries(arg).forEach(([k, v]) => {
          if (v) {
            result.push(k);
          }
        });
      }
    }
  })

  return result.join(' ');
}

//global counter
export const getNextKey = (() => {
  let key = 0;
  return (offset = 0, asString = true) => {
    const val = offset + key++;
    return asString ? val.toString() : val;
  };
})();




export const eventVal = (fn) => (e) => fn(e.target.value);


const xOr = (cond1, cond2) => (cond1 || cond2) && !(cond1 && cond2);

const keyValSame = (obj1, obj2, key) => {
  if (obj1.hasOwnProperty(key) !== obj2.hasOwnProperty(key)) {
    //one has the key, the other does not
    return false;
  }
  const val1 = obj1[key], val2 = obj2[key];

  const bothObjects = isObject(val1) && isObject(val2);
  if (!bothObjects) {

    return val1 === val2;
  } else {
    return keys(val1).every((currKey) => {
      return keyValSame(val1, val2, currKey);
    });
  }
}

//assumes both objects have same top level keys
export const diffTopLevelKeyVals = (obj1, obj2) => {
  const result = {};
  keys(obj1).forEach(key => {
    result[key] = !keyValSame(obj1, obj2, key);
  });

  return result;
}

