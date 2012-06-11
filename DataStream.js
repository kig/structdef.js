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


DataStream.prototype.readStruct = function(structDefinition) {
  var idx = [this.position];
  var rv = DataStream.readStruct(this._dataView, idx, structDefinition);
  this.position = idx[0];
  return rv;
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


DataStream.readStruct = function(dataView, idx, structDefinition) {
  var struct = {}, t, v, n;
  for (n in structDefinition) {
    t = structDefinition[n];
    v = readType(dataView, idx, t, struct);
    if (v == null) {
      return null;
    }
    struct[n] = v;
  }
  return struct;
};

DataStream.eqCmp = function(a, b) { return a == b; };
DataStream.neqCmp = function(a, b) { return a != b; };

DataStream.readType = function(dataView, idx, t, struct) {
  var v, paddedTo = 0, le = false, tr, ref, cmp = this.eqCmp;
  var i,j,k,c;
  if (typeof t == 'string' && t.indexOf("=") > -1) {
    tr = t.split("=");
    t = tr[0];
    ref = tr[1];
    if (t.charAt(t.length-1) == '!') {
      t = t.slice(0,-1);
      cmp = this.neqCmp;
    }
  }
  if (typeof t == 'string' && t.indexOf(":") > -1) {
    var tp = t.split(":");
    t = tp[0];
    paddedTo = parseInt(tp[1]);
  }
  if (/^(u?int(8|16|32)|float(32|64))le$/.test(t)) {
    t = t.slice(0, -2);
    le = true;
  }
  switch(t) {

    case 'uint8':
      v = dataView.getUint8(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(1, paddedTo);
      return v;
    case 'int8':
      v = dataView.getInt8(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(1, paddedTo);
      return v;
    case 'uint16':
      v = dataView.getUint16(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(2, paddedTo);
      return v;
    case 'int16':
      v = dataView.getInt16(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(2, paddedTo);
      return v;
    case 'uint32':
      v = dataView.getUint32(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(4, paddedTo);
      return v;
    case 'int32':
      v = dataView.getInt32(idx[0], le);
      if (ref != null && !cmp(parseInt(ref), v)) return null;
      idx[0] += Math.max(4, paddedTo);
      return v;
    case 'float32':
      v = dataView.getFloat32(idx[0], le);
      if (ref != null && !cmp(parseFloat(ref), v)) return null;
      idx[0] += Math.max(4, paddedTo);
      return v;
    case 'float64':
      v = dataView.getFloat64(idx[0], le);
      if (ref != null && !cmp(parseFloat(ref), v)) return null;
      idx[0] += Math.max(8, paddedTo);
      return v;

    case 'string':
      v = '';
      i = 0;
      for (i = 0; i < paddedTo; i++) {
        c = dataView.getUint8(idx[0] + i);
        v += String.fromCharCode(c);
      }
      if (ref != null && !cmp(ref, v)) return null;
      idx[0] += paddedTo;
      return v;

    case 'cstring':
      v = '';
      i = 0;
      if (paddedTo) {
        for (i = 0; i < paddedTo; i++) {
          c = dataView.getUint8(idx[0] + i);
          if (c == 0) {
            break;
          }
          v += String.fromCharCode(c);
        }
      } else {
        while (c = dataView.getUint8(idx[0] + i++)) {
          v += String.fromCharCode(c);
        }
      }
      if (ref != null && !cmp(ref, v)) return null;
      idx[0] += Math.max(i, paddedTo);
      return v;

    default:
      if (t instanceof Array) {
        var ta = t[0];
        var length = t[1];
        if (typeof length == 'string') {
          if (length == '*') {
            v = [];
            var obj = null;
            while (idx[0] < dataView.byteLength) {
              obj = DataStream.readType(dataView, idx, ta, struct);
              if (!obj) break;
              v.push(obj);
            }
            return v;
          } else if (/[\*\-\+\/]/.test(length)) {
            var segs = length.replace(/\s+/g,'').split(/(?=[\*\-\+\/])/);
            var sum = 0;
            for (var j=0; j<segs.length; j++) {
              var seg = segs[j];
              var cmd = seg.charAt(0);
              if (/[\*\-\+\/]/.test(cmd)) {
                seg = seg.substring(1);
              } else {
                cmd = "+";
              }
              if (/^\d+$/.test(seg)) {
                seg = parseInt(seg);
              } else {
                seg = struct[seg];
              }
              switch(cmd) {
                case "+": sum += seg; break;
                case "-": sum -= seg; break;
                case "/": sum /= seg; break;
                case "*": sum *= seg; break;
                default: sum = seg;
              }
            }
            length = sum;
          } else {
            length = struct[length];
          }
  } else if (typeof length == 'object') { // branch
          i = idx[0];
          for (k=0; k < t.length; k++) {
            idx[0] = i;
            v = DataStream.readType(dataView, idx, t[k], struct);
            if (v) break;
          }
          return v;
        } else if (length < 0) {
          length = dataView.byteLength - idx[0] + length;
        }
        if (/^(u?int(8|16|32)|float(32|64))(le)?$/.test(ta)) {
          // Create Typed Array and swizzle in-place
          switch(ta.replace(/le$/, '')) {
            case 'uint8':
              v = new Uint8Array(dataView.buffer, idx[0], length);
              break;
            case 'uint16':
              if (idx[0] % 8 == 2) {
                v = new Uint16Array(dataView.buffer, idx[0], length);
              } else {
                v = new Uint16Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
            case 'uint32':
              if (idx[0] % 8 == 4) {
                v = new Uint32Array(dataView.buffer, idx[0], length);
              } else {
                v = new Uint32Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
            case 'int8':
              v = new Int8Array(dataView.buffer, idx[0], length);
              break;
            case 'int16':
              if (idx[0] % 8 == 2) {
                v = new Int16Array(dataView.buffer, idx[0], length);
              } else {
                v = new Int16Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
            case 'int32':
              if (idx[0] % 8 == 4) {
                v = new Int32Array(dataView.buffer, idx[0], length);
              } else {
                v = new Int32Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
            case 'float32':
              if (idx[0] % 4 == 0) {
                v = new Float32Array(dataView.buffer, idx[0], length);
              } else {
                v = new Float32Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
            case 'float64':
              if (idx[0] % 8 == 0) {
                v = new Float64Array(dataView.buffer, idx[0], length);
              } else {
                v = new Float64Array(length);
                new Int8Array(v.buffer).set(new Int8Array(dataView.buffer, idx[0], v.byteLength));
              }
              break;
          }
          arrayToNative(v, /le$/.test(ta));
          idx[0] += v.byteLength;
          return v;
        } else {
          v = new Array(length);
          for (i=0; i<length; i++) {
            v[i] = DataStream.readType(dataView, idx, ta, struct);
          }
          return v;
        }
      } else {
        return DataStream.readStruct(dataView, idx, t);
      }
  }
};

DataStream.writeStruct = function(dataView, idx, structDefinition, struct) {
  for (var n in structDefinition) {
    var t = structDefinition[n];
    DataStream.writeType(dataView, idx, t, struct[n]);
  }
  return;
};

DataStream.writeType = function(dataView, idx, t, v) {
  switch(t) {

    case 'uint8':
      dataView.setUint8(idx[0], v);
      idx[0]++;
      return;
    case 'int8':
      dataView.setInt8(idx[0], v);
      idx[0]++;
      return;
    case 'uint16':
      dataView.setUint16(idx[0], v);
      idx[0]+=2;
      return;
    case 'int16':
      dataView.setInt16(idx[0], v);
      idx[0]+=2;
      return;
    case 'uint32':
      dataView.setUint32(idx[0], v);
      idx[0]+=4;
      return;
    case 'int32':
      dataView.setInt32(idx[0], v);
      idx[0]+=4;
      return;
    case 'float32':
      dataView.setFloat32(idx[0], v);
      idx[0]+=4;
      return;
    case 'float64':
      dataView.setFloat64(idx[0], v);
      idx[0]+=8;
      return;

    case 'uint16le':
      dataView.setUint16(idx[0], v, true);
      idx[0]+=2;
      return;
    case 'int16le':
      dataView.setInt16(idx[0], v, true);
      idx[0]+=2;
      return;
    case 'uint32le':
      dataView.setUint32(idx[0], v, true);
      idx[0]+=4;
      return;
    case 'int32le':
      dataView.setInt32(idx[0], v, true);
      idx[0]+=4;
      return;
    case 'float32le':
      dataView.setFloat32(idx[0], v, true);
      idx[0]+=4;
      return;
    case 'float64le':
      dataView.setFloat64(idx[0], v, true);
      idx[0]+=8;
      return;

    case 'cstring':
      for (var i=0; i<v.length; i++) {
        dataView.setUint8(idx[0]++, v.charCodeAt(i));
      }
      dataView.setUint8(idx[0]++, 0);
      return;

    default:
      if (t instanceof Array) {
        var ta = t[0];
        for (var i=0; i<v.length; i++) {
          DataStream.writeType(dataView, idx, ta, v[i]);
        }
        return;
      } else {
        DataStream.writeStruct(dataView, idx, t, v);
        return;
      }
  }
};

