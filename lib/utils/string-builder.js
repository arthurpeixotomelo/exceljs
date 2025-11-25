class StringBuilder {
  constructor() {
    this.reset();
  }

  get length() {
    return this._buf.length;
  }

  toString() {
    return this._buf.join('');
  }

  reset(position) {
    if (position) {
      while (this._buf.length > position) {
        this._buf.pop();
      }
    } else {
      this._buf = [];
    }
  }

  addText(text) {
    this._buf.push(text);
  }

  addStringBuf(inBuf) {
    this._buf.push(inBuf.toString());
  }
}

export default StringBuilder;