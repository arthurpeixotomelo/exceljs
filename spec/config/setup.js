import chai from 'chai';
import chaiXml from 'chai-xml';
import chaiDatetime from 'chai-datetime';
import dirtyChai from 'dirty-chai';

global.expect = chai.expect;

chai.use(chaiXml);
chai.use(chaiDatetime);
chai.use(dirtyChai);

