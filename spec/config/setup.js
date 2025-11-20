import {afterAll, afterEach, beforeAll, beforeEach} from 'vitest'
import chai from 'chai'
import chaiXml from 'chai-xml'
import chaiDatetime from 'chai-datetime'
import dirtyChai from 'dirty-chai'

chai.use(chaiXml)
chai.use(chaiDatetime)
chai.use(dirtyChai)

globalThis.expect = chai.expect
globalThis.before = beforeAll
globalThis.after = afterAll
globalThis.beforeEach = beforeEach
globalThis.afterEach = afterEach

