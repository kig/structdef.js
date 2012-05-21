/**
  Struct definition object:
  
  var myStruct = {
    'width': 'uint32',
    'height': 'uint32',
    'channels': 'uint8',
    'bias': 'float32',
    'name': 'cstring',
    'thumbnail': {
      'length': 'uint32',
      'data': ['uint8', 'length']
    }
  };

  var id3 = {
    tag: 'cstring:3',
    title: 'cstring:30',
    artist: 'cstring:30',
    album: 'cstring:30',
    year: 'cstring:4'
  };

var u = new Uint8Array([137, 80, 78, 71, 0, 136, 136, 255, 137, 80, 78, 71, 0, 136, 136, 255, 72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33, 0, 0, 2, 0,1,2,3, 1,2,3,4, 72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33, 0]);
var dv = new DataView(u.buffer);
var def = {
    tag: 'uint32',
    code: 'uint32le',
    embed: { tag:'uint32', code:'uint32le', greet:'cstring' },
    length: 'uint16',
    data: ['float32', 'length'],
    greet: 'cstring' };

var obj = readStruct(dv, [0], def);
var u2 = new Uint8Array(u.length);
var dv2 = new DataView(u2.buffer);
writeStruct(dv2, [0], def, obj);

var success = true;
for (var i=0; i<u2.length; i++) {
  if (u[i] != u2[i]) {
    console.log('roundtrip failure at', i, u[i] + ' != ' + u2[i]);
    success = false;
  }
}
console.log('success: ', success);

*/
var readStruct = function(dataView, idx, structDefinition) {
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

var readType = function(dataView, idx, t, struct) {
  var v, paddedTo = 0, le = false, tr, ref;
  if (typeof t == 'string' && t.indexOf("=") > -1) {
    tr = t.split("=");
    t = tr[0];
    ref = tr[1];
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
      idx[0] += Math.max(1, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'int8':
      v = dataView.getInt8(idx[0], le);
      idx[0] += Math.max(1, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'uint16':
      v = dataView.getUint16(idx[0], le);
      idx[0] += Math.max(2, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'int16':
      v = dataView.getInt16(idx[0], le);
      idx[0] += Math.max(2, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'uint32':
      v = dataView.getUint32(idx[0], le);
      idx[0] += Math.max(4, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'int32':
      v = dataView.getInt32(idx[0], le);
      idx[0] += Math.max(4, paddedTo);
      if (ref != null && parseInt(ref) != v) return null;
      return v;
    case 'float32':
      v = dataView.getFloat32(idx[0], le);
      idx[0] += Math.max(4, paddedTo);
      if (ref != null && parseFloat(ref) != v) return null;
      return v;
    case 'float64':
      v = dataView.getFloat64(idx[0], le);
      idx[0] += Math.max(8, paddedTo);
      if (ref != null && parseFloat(ref) != v) return null;
      return v;

    case 'cstring':    
      v = '';
      var c;
      var i = 0;
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
      idx[0] += Math.max(i, paddedTo);
      if (ref != null && ref != v) return null;
      return v;

    default:
      if (t instanceof Array) {
        var ta = t[0];
        var length = t[1];
        if (typeof length == 'string') {
          length = struct[length];
        }
        v = new Array(length);
        for (var i=0; i<length; i++) {
          v[i] = readType(dataView, idx, ta, struct);
        }
        return v;
      } else {
        return readStruct(dataView, idx, t);
      }
  }
};

var writeStruct = function(dataView, idx, structDefinition, struct) {
  for (var n in structDefinition) {
    var t = structDefinition[n];
    writeType(dataView, idx, t, struct[n]);
  }
  return;
};

var writeType = function(dataView, idx, t, v) {
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
          writeType(dataView, idx, ta, v[i]);
        }
        return;
      } else {
        writeStruct(dataView, idx, t, v);
        return;
      }
  }
};

