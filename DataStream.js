DataStream = function(arrayBuffer, byteOffset, endianness) {
  this._byteOffset = byteOffset || 0;
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
  } else if (arrayBuffer instanceof DataView ||
             arrayBuffer instanceof ArrayBufferView) {
    this.dataView = arrayBuffer;
  } else {
    this.buffer = new ArrayBuffer(arrayBuffer || 0);
  }
  this._position = 0;
  this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
};
DataStream.BIG_ENDIAN = false;
DataStream.LITTLE_ENDIAN = true;

Object.defineProperty(DataStream.prototype, 'position',
  { get: function() {
      return this._position;
    },
    set: function(v) {
      this.seek(v);
    } });

Object.defineProperty(DataStream.prototype, 'buffer',
  { get: function() {
      return this._buffer;
    },
    set: function(v) {
      this._buffer = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this.seek(0);
    } });

Object.defineProperty(DataStream.prototype, 'byteOffset',
  { get: function() {
      return this._byteOffset;
    },
    set: function(v) {
      this._byteOffset = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this.seek(0);
    } });

Object.defineProperty(DataStream.prototype, 'dataView',
  { get: function() {
      return this._dataView;
    },
    set: function(v) {
      this._buffer = v.buffer;
      this._byteOffset = v.byteOffset;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this.seek(0);
    } });

DataStream.prototype.seek = function(pos) {
  var npos = Math.max(0, Math.min(
    this._buffer.byteLength - this._byteOffset, pos));
  this._position = isNaN(npos) ? 0 : npos;
};

DataStream.prototype.eof = function() {
  return (this._position === (this.buffer.byteLength - this._byteOffset));
};

DataStream.prototype.readInt32 = function() {
  var v = this._dataView.getInt32(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
  return v;
};

DataStream.prototype.writeInt32 = function(v) {
  this._dataView.setInt32(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
};

DataStream.prototype.readInt16 = function() {
  var v = this._dataView.getInt16(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 2);
  return v;
};

DataStream.prototype.writeInt16 = function(v) {
  this._dataView.setInt16(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 2);
};

DataStream.prototype.readInt8 = function() {
  var v = this._dataView.getInt8(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 1);
  return v;
};

DataStream.prototype.writeInt8 = function(v) {
  this._dataView.setInt8(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 1);
};

DataStream.prototype.readUint32 = function() {
  var v = this._dataView.getUint32(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
  return v;
};

DataStream.prototype.writeUint32 = function(v) {
  this._dataView.setUint32(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
};

DataStream.prototype.readUint16 = function() {
  var v = this._dataView.getUint16(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 2);
  return v;
};

DataStream.prototype.writeUint16 = function(v) {
  this._dataView.setUint16(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 2);
};

DataStream.prototype.readUint8 = function() {
  var v = this._dataView.getUint8(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 1);
  return v;
};

DataStream.prototype.writeUint8 = function(v) {
  this._dataView.setUint8(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 1);
};

DataStream.prototype.readFloat32 = function() {
  var v = this._dataView.getFloat32(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
  return v;
};

DataStream.prototype.writeFloat32 = function(v) {
  this._dataView.setFloat32(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 4);
};

DataStream.prototype.readFloat64 = function() {
  var v = this._dataView.getFloat64(this._position, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 8);
  return v;
};

DataStream.prototype.writeFloat64 = function(v) {
  this._dataView.setFloat64(this._position, v, this.endianness);
  this._position = Math.min(this._buffer.byteLength - this._byteOffset, 
                            this._position + 8);
};

