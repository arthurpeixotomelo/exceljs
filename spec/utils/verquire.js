// this module allows the specs to switch between source code and
// transpiled code depending on the environment variable EXCEL_BUILD

/* eslint-disable import/no-dynamic-require */

const libs = {};
const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
const basePath = process.env.EXCEL_BUILD === 'es5' || nodeMajorVersion < 10
  ? '../../dist/es5/'
  : '../../lib/';

export default async function verquire(path) {
  if (!libs[path]) {
    const module = await import(basePath + path + '.js');
    libs[path] = module.default || module;
  }
  return libs[path];
}
