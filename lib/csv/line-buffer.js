import { EventEmitter } from 'node:events';

class LineBuffer extends EventEmitter {
  constructor(options) {
    super();

    this.encoding = options.encoding;

    this.buffer = null;

    this.corked = false;
    this.queue = [];
  }

  write(chunk) {
    // find line or lines in chunk and emit them if not corked
    // or queue them if corked
    const data = this.buffer ? this.buffer + chunk : chunk;
    const lines = data.split(/\r?\n/g);

    // save the last line
    this.buffer = lines.pop();

    lines.forEach(function(line) {
      if (this.corked) {
        this.queue.push(line);
      } else {
        this.emit('line', line);
      }
    });

    return !this.corked;
  }

  cork() {
    this.corked = true;
  }

  uncork() {
    this.corked = false;
    this._flush();

    // tell the source I'm ready again
    this.emit('drain');
  }

  setDefaultEncoding() {
    // ?
  }

  end() {
    if (this.buffer) {
      this.emit('line', this.buffer);
      this.buffer = null;
    }
    this.emit('done');
  }

  _flush() {
    if (!this.corked) {
      this.queue.forEach(line => {
        this.emit('line', line);
      });
      this.queue = [];
    }
  }
}

export default LineBuffer;