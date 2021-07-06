import { useCache, useCacheDelete, useCacheRefresh, getFromCache } from "./redis-cache"
import should from 'should'


class TestUtil {

    @useCache('${a}')
    public static async add(a: number, b: number) {
        return a + b
    }

    @useCache('${user.id}')
    public static async getUserInfo(user: any) {
        return {
            id: 'test',
            test: 10000,
            ...user
        }
    }

    @useCacheDelete('${user.id}')
    public static async deleteUser(user: any) {
        return true
    }

    public static async updateUser(user: any) {
        await TestUtil.freshUserToCache(user)
        return true
    }


    @useCacheRefresh('${user.id}')
    public static async freshUserToCache(user: any) {
        return TestUtil.getUserInfo({
            updated: true
        })
    }
}


describe("redis-cache", () => {

    it("should be cache", async () => {
        await TestUtil.add(10, 1)
        should.equal(await getFromCache("10"), 11)

        await TestUtil.getUserInfo({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            id: 'test',
            test: 10000
        })
    })


    it("should be delete", async () => {
        await TestUtil.getUserInfo({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            id: 'test',
            test: 10000
        })
        await TestUtil.deleteUser({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), undefined)
    })

    it("should be refresh", async () => {
        await TestUtil.deleteUser({
            id: 'test'
        })
        await TestUtil.getUserInfo({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            id: 'test',
            test: 10000
        })
        await TestUtil.updateUser({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            id: 'test',
            test: 10000,
            updated: true
        })
    })



})