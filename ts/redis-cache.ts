import Redis from 'ioredis'
import _ from 'lodash'
const redis = new Redis()

export function useCache(resource: string, ttl_of_group = 300, group: string=''): any {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (...params) {
            let data = await getFromCache(resource, group)
            if (data) {
                return data
            }
            let res = await originFunc.call(this, ...params);
            resource = buildKey(resource, originFunc, params)
            group = buildKey(group, originFunc, params)
            await setToCache(res, resource, ttl_of_group, group)
            return res
        }
    }
}

export function useCacheDelete(resource: string, group: string = "") {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (...params) {
            resource = buildKey(resource, originFunc, params)
            group = buildKey(group, originFunc, params)
            await delCache(resource, group)
            let res = await originFunc.call(this, ...params);
            return res
        }
    }
}


export function useCacheRefresh(resource: string, ttl_of_group = 300, group: string="") {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (...params) {
            resource = buildKey(resource, originFunc, params)
            group = buildKey(group, originFunc, params)
            await delCache(resource, group)
            let res = await originFunc.call(this, ...params);
            await setToCache(res, resource, ttl_of_group, group)
            return res
        }
    }
}

export async function getFromCache(resource: string, group?: string) {
    group = group || resource;
    let data;
    // 获取缓存
    data = await redis.hget(group, resource);
    if (data) {
        return JSON.parse(data);
    }
    return
}

async function setToCache(data: any, resource: string, ttl_of_group = 300, group?: string) {
    group = group || resource;
    await redis.hset(group, resource, JSON.stringify(data));
    await redis.expire(group, ttl_of_group);
    return
}

async function delCache(resource: string, group?: string) {
    group = group || resource;
    const result = await redis.hdel(group, resource);
    return;
}

function buildKey(template: string, fun: Function, params: any) {
    if (!_.includes(template, "$")) {
        return template
    }
    const paramNames = getParams(fun)
    const paramJson = _.zipObject(paramNames, params)
    const cacheKey = interpolate(template, paramJson)
    return cacheKey
}


function getParams(func:Function) {

    // String representaation of the function code
    var str = func.toString();

    // Remove comments of the form /* ... */
    // Removing comments of the form //
    // Remove body of the function { ... }
    // removing '=>' if func is arrow function 
    str = str.replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/(.)*/g, '')
        .replace(/{[\s\S]*}/, '')
        .replace(/=>/g, '')
        .trim();

    // Start parameter names after first '('
    var start = str.indexOf("(") + 1;

    // End parameter names is just before last ')'
    var end = str.length - 1;

    var result = str.substring(start, end).split(", ");

    var params: any = [];

    result.forEach(element => {

        // Removing any default value
        element = element.replace(/=[\s\S]*/g, '').trim();

        if (element.length > 0)
            params.push(element);
    });

    return params;
}

function interpolate(str: string, params: any) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${str}\`;`)(...vals);
}
