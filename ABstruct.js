ABStruct = {};
ABStruct.create = function(def) {
  var f = function(dataView) {
    this.dataView = dataView;
  };
  f.prototype = {};
  var idx = [0];
  for (var i in def) {
    Object.defineProperty(f.prototype, i, ABStruct.getter(def[i], idx));
  }
  return f;
};

ABStruct.getter = function(t, idx) {
  var i,g,s;
  i = idx[0];
  if (typeof t == 'string') {
    idx[0] += this.lengths[t];
    g = this.getters[t];
    s = this.setters[t];
    return {
      get: function() { return g(this.dataView, i); },
      set: function(v) { s(this.dataView, i, v); }
    };
  } else if (t instanceof Array) {
    var len = t[1];
    t = t[0];
    idx[0] += this.lengths[t]*len;
    var v = this.views[t];
    var abv = null;
    return {
      get: function() {
        if (abv == null) {
          abv = new v(this.dataView.buffer, this.dataView.byteOffset+i, len);
        }
        return abv; 
      },
      set: function(nv) {
        if (abv == null) {
          abv = new v(this.dataView.buffer, this.dataView.byteOffset+i, len);
        }
        for (var i=0; i<abv.length; i++) {
          abv[i] = nv[i];
        }
      }
    };
  }
};

ABStruct.lengths = {
  int8: 1, uint8: 1,
  int16: 2, uint16: 2,
  int32: 4, uint32: 4, 
  float32: 4, float64: 8
};

ABStruct.getters = {
  int8: function(dv, i){ return dv.getInt8(i); },
  uint8: function(dv, i){ return dv.getUint8(i); },
  int16: function(dv, i){ return dv.getInt16(i); },
  uint16: function(dv, i){ return dv.getUint16(i); },
  int32: function(dv, i){ return dv.getInt32(i); },
  uint32: function(dv, i){ return dv.getUint32(i); },
  float32: function(dv, i){ return dv.getFloat32(i); },
  float64: function(dv, i){ return dv.getFloat64(i); }
};

ABStruct.setters = {
  int8: function(dv, i, v){ return dv.setInt8(i,v); },
  uint8: function(dv, i, v){ return dv.setUint8(i,v); },
  int16: function(dv, i, v){ return dv.setInt16(i,v); },
  uint16: function(dv, i, v){ return dv.setUint16(i,v); },
  int32: function(dv, i, v){ return dv.setInt32(i,v); },
  uint32: function(dv, i, v){ return dv.setUint32(i,v); },
  float32: function(dv, i, v){ return dv.setFloat32(i,v); },
  float64: function(dv, i, v){ return dv.setFloat64(i,v); }
};

ABStruct.views = {
  int8: Int8Array,
  uint8: Uint8Array,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  float32: Float32Array,
  float64: Float64Array
};

MyStruct = ABStruct.create({
  tag: 'uint32',
  width: 'uint16',
  height: 'uint16',
  bias: 'float64',
  x: 'float32',
  y: 'float32',
  points: ['int32', 2]
});

var dv = new DataView(new ArrayBuffer(32));
var s = new MyStruct(dv);

s.tag = 0x88ffff44;
s.width = 1024;
s.height = 768;
s.bias = 0.00838;
s.x = 1284.4;
s.y = 8383.2;
s.points[0] = 23;
s.points[1] = -300;

var u8 = new Uint8Array(dv.buffer);
// [136, 255, 255, 68, 4, 0, 3, 0, 63, 129, 41, 136, 143, 134, 26, 97, 68, 160, 140, 205, 70, 2, 252, 205, 23, 0, 0, 0, 212, 254, 255, 255]
