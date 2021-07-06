import * as redisCache from "./redis-cache"
import sinon from 'sinon'
import should from 'should'

class TestUtil{

    @redisCache.useCache('${user.name}')
    public static add(a: number, b: number, user: any) {
        return a + b
    }
}


describe("redis-cache", () => {

    it("", async () => {
        let useCacheSpy = sinon.spy(redisCache, 'useCache')
        TestUtil.add(1, 1, {name: "test"})
        should.equal(useCacheSpy.callCount, 1)
    })

})