
const exportObj = {};
//strings
exportObj.capFirstLetter = (str) => {
  return str ? (str[0].toUpperCase() + str.slice(1)) : str;
}

exportObj.capAllWords = str => {
  return str.split(' ').map(capFirstLetter).join(' ');
}

//numbers

//takes lower bound (inclusive) and upper bound (exclusive)
exportObj.getRandomInt = (...args) => {
  const [lower, upper] = args.length === 1 ? [0, args[0]] : args;
  const rand = Math.random();
  return Math.floor(rand * (upper - lower)) + lower;
}

exportObj.getRandomBool = () => {
  return getRandomInt(2) === 1;
}


//functional
exportObj.identity = x => x;

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
exportObj.map = map;
exportObj.forEach = forEach;
exportObj.filter = filter;
exportObj.reduce = reduce;
exportObj.every = every;

exportObj.not = (fn) => (...args) => !fn(...args);

exportObj.thunk = (fn) => (...args) => () => fn(...args);

exportObj.wrap = (val) => () => val;

exportObj.noArg = (fn) => () => fn();

exportObj.noop = () => {};

exportObj.once = (fn) => {
  let called, result;
  return (...args) => {
    if (!called) {
      result = fn(...args);
      called = true;
    } 

    return result;
  }
};


exportObj.caller = (...funcs) => {
  return () => funcs.forEach(fn => fn());
}

exportObj.mapMany = (arrToMap, ...funcs) => {
  return funcs.reduce((acc, curr) => {
    return acc.map(curr);
  }, arrToMap);
}

exportObj.compose = (...funcs) => {
  if (funcs.length === 0) {
    return identity;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

exportObj.pipeline = (...funcs) => {
  return compose(...funcs.reverse());
};

exportObj.isTruthy = x => !!x;
exportObj.orNull = x => x || null;
exportObj.last = arr => arr[arr.length - 1];

//pass an array of condition/result pairs and a final default
//ifElse([[false, '3'], [true, 5]], 'default') --> 5
exportObj.ifElse = (pairs, final) => {

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
exportObj.assignToNew = (...params) => {
  const objParams = params.filter(isObject);
  return Object.assign({}, ...objParams);
}

//use when first object can be mutated
exportObj.assignToOld = (...params) => {
  const objParams = params.filter(isObject);
  return Object.assign(...objParams);
}

//shallow copy
exportObj.copySet = originalSet => new Set(originalSet);


exportObj.keys = Object.keys;
exportObj.values = (obj) => keys(obj).map(k => obj[k]);

exportObj.entries = (obj) => keys(obj).map(k => [k, obj[k]]);
exportObj.entriesToObj = (arr, fn = null) => (fn ? arr.map(fn) : arr).reduce((acc, [k, v]) => {
  return assignToOld(acc, {[k]: v});
}, {});


exportObj.mapObj = (obj, fn) => entriesToObj(entries(obj).map(([k, v]) => fn([k, v], obj)));
exportObj.filterObj = (obj, fn) => entriesToObj(entries(obj).filter(fn));
exportObj.reduceObj = (obj, fn, starting) => entries(obj).reduce(fn, starting);

exportObj.iterateObj = (obj, fn) => entries(obj).forEach((kvPair) => fn(kvPair, obj));


exportObj.isObject = (x) => x !== null && typeof x === 'object';

exportObj.pick = (obj, keysArr) => {
  const keysInObj = new Set(keys(obj));
  return keysArr.reduce((acc, curr) => keysInObj.has(curr) ? Object.assign(acc, {[curr]: obj[curr]}) : acc, {});
}

exportObj.omit = (obj, keysArr) => {
  const keysToOmit = new Set(keysArr);
  return filterObj(obj, ([k, v]) => !keysToOmit.has(k));
}


//arrays
exportObj.randomArrayEl = (arr) => arr[getRandomInt(arr.length)];

exportObj.makeArr = (count, fn) => {
  var result = [];
  for (var i = 0; i < count; i++) {
    result.push(fn(i));
  }
  return result;
}

exportObj.keyBy = (arr, keySelector, valSelector = identity, collisions = false) => {
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

exportObj.isUndefined = val => val === undefined;

exportObj.isEmptyObj = obj => Object.keys(obj).length === 0; 

exportObj.valToObj = val => ({[val]: val});

//getNewVal(oldVal, property, innerObj)
exportObj.updateObj = (startObj, path, getNewVal) => {

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

exportObj.stringsToObj = (...strings) => keyBy(strings, identity);

exportObj.deepRemoveKey = (startObj, pathToKey) => {
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
exportObj.bindTo = (context, ...methods) => { 
  methods.forEach(method => context[method.name] = method.bind(context));
};

//apply a series of updates sequentially to an object (used to batch state updates taking place outside an event handler: https://stackoverflow.com/a/48610973)

exportObj.mergeUpdates = (obj, updaterFuncsArr, returnUpdatesAndFullObject = false) => {
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
exportObj.classes = (...args) => {
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
exportObj.getNextKey = (() => {
  let key = 0;
  return (offset = 0, asString = true) => {
    const val = offset + key++;
    return asString ? val.toString() : val;
  };
})();




exportObj.eventVal = (fn) => (e) => fn(e.target.value);


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
exportObj.diffTopLevelKeyVals = (obj1, obj2) => {
  const result = {};
  keys(obj1).forEach(key => {
    result[key] = !keyValSame(obj1, obj2, key);
  });

  return result;
}

module.exports = exportObj;
