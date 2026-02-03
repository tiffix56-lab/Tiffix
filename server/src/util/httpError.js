import errorObject from './errorObject.js';

export default (nextFunc, err, req, errorStatusCode = 500) => {
    console.log(err)
    const errorObj = errorObject(err, req, errorStatusCode);
    return nextFunc(errorObj);
};
