import Redis from 'ioredis'
const redis = new Redis()


export function useCache(resource: string, ttl_of_group = 300, group?: string) {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (params) {
            let data = await getFromCache(resource, group)
            if (data) {
                return data
            }
            let res = await originFunc.call(this, params);
            await setToCache(res, resource, ttl_of_group, group)
        }
    }
}

export function useCacheDelete(resource: string, group?: string) {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (params) {
            await originFunc.call(this, params);
            await delCache(resource, group)
        }
    }
}


export function useCacheRefresh(resource: string, ttl_of_group = 300, group?: string) {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) {
        let originFunc = descriptor.value!
        descriptor.value = async function (params) {
            let res = await originFunc.call(this, params);
            await setToCache(res, resource, ttl_of_group, group)
        }
    }
}


async function getFromCache(resource: string, group?: string) {
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

export async function delCache(resource: string, group?: string) {
    group = group || resource;
    const result = await redis.hdel(group, resource);
    return;
}

