import { useCache, useCacheDelete, getFromCache } from "./redis-cache"
import should from 'should'


class TestUtil {

    @useCache('${a}')
    public static add(a: number, b: number) {
        return a + b
    }

    @useCache('${user.id}')
    public static getUserInfo(user: any) {
        return {
            test: 10000
        }
    }

    @useCacheDelete('${user.id}')
    public static updateUser(user: any) {
        return {
            test: 10000
        }
    }





}


describe("redis-cache", () => {

    it("should be cache", async () => {
        TestUtil.add(10, 1)
        should.equal(await getFromCache("10"), 11)

        TestUtil.getUserInfo({
            name: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            test: 10000
        })
    })


    it("should be delete", async () => {
        TestUtil.getUserInfo({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), {
            test: 10000
        })
        TestUtil.updateUser({
            id: 'test'
        })
        should.deepEqual(await getFromCache("test"), undefined)
    })



})