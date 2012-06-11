/**
  DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
  It's like a file-like DataView on steroids.

  @param {ArrayBuffer} arrayBuffer ArrayBuffer to read from.
  @param {?Number} byteOffset Offset from arrayBuffer beginning for the DataStream.
  @param {?Boolean} endianness DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN (the default).
  */
DataStream = function(arrayBuffer, byteOffset, endianness) {
  this._byteOffset = byteOffset || 0;
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
  } else if (typeof arrayBuffer == "object") {
    this.dataView = arrayBuffer;
    if (byteOffset) {
      this._byteOffset += byteOffset;
    }
  } else {
    this.buffer = new ArrayBuffer(arrayBuffer || 0);
  }
  this.position = 0;
  this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
};
DataStream.prototype = {};

/**
  Big-endian const to use as default endianness.
  */
DataStream.BIG_ENDIAN = false;

/**
  Little-endian const to use as default endianness.
  */
DataStream.LITTLE_ENDIAN = true;

/**
  Whether to extend DataStream buffer when trying to write beyond its size.
  If set, the buffer is reallocated to twice its current size until the
  requested write fits the buffer.
  */
DataStream.prototype._dynamicSize = true;
Object.defineProperty(DataStream.prototype, 'dynamicSize',
  { get: function() {
      return this._dynamicSize;
    },
    set: function(v) {
      if (!v) {
        this._trimAlloc();
      }
      this._dynamicSize = v;
    } });

/**
  Virtual byte length of the DataStream backing buffer.
  Updated to be max of original buffer size and last written size.
  If dynamicSize is false is set to buffer size.
  */
DataStream.prototype._byteLength = 0;

/**
  Returns the byte length of the DataStream object.
  */
Object.defineProperty(DataStream.prototype, 'byteLength',
  { get: function() {
    return this._byteLength - this._byteOffset;
  }});

/**
  Set/get the backing ArrayBuffer of the DataStream object.
  The setter updates the DataView to point to the new buffer.
  */
Object.defineProperty(DataStream.prototype, 'buffer',
  { get: function() {
      this._trimAlloc();
      return this._buffer;
    },
    set: function(v) {
      this._buffer = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._buffer.byteLength;
    } });

/**
  Set/get the byteOffset of the DataStream object.
  The setter updates the DataView to point to the new byteOffset.
  */
Object.defineProperty(DataStream.prototype, 'byteOffset',
  { get: function() {
      return this._byteOffset;
    },
    set: function(v) {
      this._byteOffset = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._buffer.byteLength;
    } });

/**
  Set/get the backing DataView of the DataStream object.
  The setter updates the buffer and byteOffset to point to the DataView values.
  */
Object.defineProperty(DataStream.prototype, 'dataView',
  { get: function() {
      return this._dataView;
    },
    set: function(v) {
      this._buffer = v.buffer;
      this._byteOffset = v.byteOffset;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._buffer.byteLength;
    } });

DataStream.prototype._realloc = function(extra) {
  if (!this.dynamicSize) {
    return;
  }
  var req = this._byteOffset + this.position + extra;
  var blen = this._buffer.byteLength;
  if (req <= blen) {
    if (req > this._byteLength) {
      this._byteLength = req;
    }
    return;
  }
  if (blen < 1) {
    blen = 1;
  }
  while (req > blen) {
    blen *= 2;
  }
  var buf = new ArrayBuffer(blen);
  var src = new Uint8Array(this._buffer);
  var dst = new Uint8Array(buf, 0, src.length);
  dst.set(src);
  this.buffer = buf;
  this._byteLength = req;
};

DataStream.prototype._trimAlloc = function() {
  if (this._byteLength == this._buffer.byteLength) {
    return;
  }
  var buf = new ArrayBuffer(this._byteLength);
  var dst = new Uint8Array(buf);
  var src = new Uint8Array(this._buffer, 0, dst.length);
  dst.set(src);
  this.buffer = buf;
};

/**
  Sets the DataStream read/write position to given position.
  Clamps between 0 and DataStream length.
  */
DataStream.prototype.seek = function(pos) {
  var npos = Math.max(0, Math.min(
    this._buffer.byteLength - this._byteOffset, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
};

/**
  Returns true if the DataStream pointer is at the end of buffer and there's
  no more data to read.
  */
DataStream.prototype.isEof = function() {
  return (this.position >= this._byteLength);
};


DataStream.prototype.mapInt32Array = function(length) {
  this._realloc(length * 4);
  var arr = new Int32Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};

DataStream.prototype.mapInt16Array = function(length) {
  this._realloc(length * 2);
  var arr = new Int16Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};

DataStream.prototype.mapInt8Array = function(length) {
  this._realloc(length * 1);
  var arr = new Int8Array(this.buffer, this.byteOffset+this.position, length);
  return arr;
};

DataStream.prototype.mapUint32Array = function(length) {
  this._realloc(length * 4);
  var arr = new Uint32Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};

DataStream.prototype.mapUint16Array = function(length) {
  this._realloc(length * 2);
  var arr = new Uint16Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};

DataStream.prototype.mapUint8Array = function(length) {
  this._realloc(length * 1);
  var arr = new Uint8Array(this.buffer, this.byteOffset+this.position, length);
  return arr;
};

DataStream.prototype.mapFloat64Array = function(length) {
  this._realloc(length * 8);
  var arr = new Float64Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};

DataStream.prototype.mapFloat32Array = function(length) {
  this._realloc(length * 4);
  var arr = new Float32Array(this.buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, this.endianness);
  return arr;
};


DataStream.prototype.readInt32Array = function(length) {
  var arr = new Int32Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
};

DataStream.prototype.readInt16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readInt16();
  }
  return arr;
};

DataStream.prototype.readInt8Array = function(length) {
  var arr = new Int8Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readInt8();
  }
  return arr;
};

DataStream.prototype.readUint32Array = function(length) {
  var arr = new Uint32Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
};

DataStream.prototype.readUint16Array = function(length) {
  var arr = new Uint16Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
};

DataStream.prototype.readUint8Array = function(length) {
  var arr = new Uint8Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
};

DataStream.prototype.readFloat64Array = function(length) {
  var arr = new Float64Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readFloat64();
  }
  return arr;
};

DataStream.prototype.readFloat32Array = function(length) {
  var arr = new Float32Array(length);
  for (var i=0; i<length; i++) {
    arr[i] = this.readFloat32();
  }
  return arr;
};


DataStream.prototype.writeInt32Array = function(arr) {
  this._realloc(arr.length * 4);
  for (var i=0; i<arr.length; i++) {
    this.writeInt32(arr[i]);
  }
};

DataStream.prototype.writeInt16Array = function(arr) {
  this._realloc(arr.length * 2);
  for (var i=0; i<arr.length; i++) {
    this.writeInt16(arr[i]);
  }
};

DataStream.prototype.writeInt8Array = function(arr) {
  this._realloc(arr.length * 1);
  for (var i=0; i<arr.length; i++) {
    this.writeInt8(arr[i]);
  }
};

DataStream.prototype.writeUint32Array = function(arr) {
  this._realloc(arr.length * 4);
  for (var i=0; i<arr.length; i++) {
    this.writeUint32(arr[i]);
  }
};

DataStream.prototype.writeUint16Array = function(arr) {
  this._realloc(arr.length * 2);
  for (var i=0; i<arr.length; i++) {
    this.writeUint16(arr[i]);
  }
};

DataStream.prototype.writeUint8Array = function(arr) {
  this._realloc(arr.length * 1);
  for (var i=0; i<arr.length; i++) {
    this.writeUint8(arr[i]);
  }
};

DataStream.prototype.writeFloat64Array = function(arr) {
  this._realloc(arr.length * 8);
  for (var i=0; i<arr.length; i++) {
    this.writeFloat64(arr[i]);
  }
};

DataStream.prototype.writeFloat32Array = function(arr) {
  this._realloc(arr.length * 4);
  for (var i=0; i<arr.length; i++) {
    this.writeFloat32(arr[i]);
  }
};



DataStream.prototype.readInt32 = function() {
  var v = this._dataView.getInt32(this.position, this.endianness);
  this.position += 4;
  return v;
};

DataStream.prototype.readInt16 = function() {
  var v = this._dataView.getInt16(this.position, this.endianness);
  this.position += 2;
  return v;
};

DataStream.prototype.readInt8 = function() {
  var v = this._dataView.getInt8(this.position, this.endianness);
  this.position += 1;
  return v;
};

DataStream.prototype.readUint32 = function() {
  var v = this._dataView.getUint32(this.position, this.endianness);
  this.position += 4;
  return v;
};

DataStream.prototype.readUint16 = function() {
  var v = this._dataView.getUint16(this.position, this.endianness);
  this.position += 2;
  return v;
};

DataStream.prototype.readUint8 = function() {
  var v = this._dataView.getUint8(this.position, this.endianness);
  this.position += 1;
  return v;
};

DataStream.prototype.readFloat32 = function() {
  var v = this._dataView.getFloat32(this.position, this.endianness);
  this.position += 4;
  return v;
};

DataStream.prototype.readFloat64 = function() {
  var v = this._dataView.getFloat64(this.position, this.endianness);
  this.position += 8;
  return v;
};


DataStream.prototype.writeInt32 = function(v) {
  this._realloc(4);
  this._dataView.setInt32(this.position, v, this.endianness);
  this.position += 4;
};

DataStream.prototype.writeInt16 = function(v) {
  this._realloc(2);
  this._dataView.setInt16(this.position, v, this.endianness);
  this.position += 2;
};

DataStream.prototype.writeInt8 = function(v) {
  this._realloc(1);
  this._dataView.setInt8(this.position, v, this.endianness);
  this.position += 1;
};

DataStream.prototype.writeUint32 = function(v) {
  this._realloc(4);
  this._dataView.setUint32(this.position, v, this.endianness);
  this.position += 4;
};

DataStream.prototype.writeUint16 = function(v) {
  this._realloc(2);
  this._dataView.setUint16(this.position, v, this.endianness);
  this.position += 2;
};

DataStream.prototype.writeUint8 = function(v) {
  this._realloc(1);
  this._dataView.setUint8(this.position, v, this.endianness);
  this.position += 1;
};

DataStream.prototype.writeFloat32 = function(v) {
  this._realloc(4);
  this._dataView.setFloat32(this.position, v, this.endianness);
  this.position += 4;
};

DataStream.prototype.writeFloat64 = function(v) {
  this._realloc(8);
  this._dataView.setFloat64(this.position, v, this.endianness);
  this.position += 8;
};


DataStream.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;

DataStream.arrayToNative = function(array, arrayIsLittleEndian) {
  if (arrayIsLittleEndian == this.endianness) {
    return array;
  } else {
    return this.flipArrayEndianness(array);
  }
};

DataStream.nativeToEndian = function(array, littleEndian) {
  if (this.endianness == littleEndian) {
    return array;
  } else {
    return this.flipArrayEndianness(array);
  }
};

DataStream.flipArrayEndianness = function(array) {
  var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  for (var i=0; i<array.byteLength; i+=array.BYTES_PER_ELEMENT) {
    for (var j=i+array.BYTES_PER_ELEMENT-1, k=i; j>k; j--, k++) {
      var tmp = u8[k];
      u8[k] = u8[j];
      u8[j] = tmp;
    }
  }
  return array;
};
