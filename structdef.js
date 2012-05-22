/**
  structdef.js, see the README at http://github.com/kig/structdef.js
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

var eqCmp = function(a, b) { return a == b; };
var neqCmp = function(a, b) { return a != b; };

var readType = function(dataView, idx, t, struct) {
  var v, paddedTo = 0, le = false, tr, ref, cmp = eqCmp;
  var i,j,k,c;
  if (typeof t == 'string' && t.indexOf("=") > -1) {
    tr = t.split("=");
    t = tr[0];
    ref = tr[1];
    if (t.charAt(t.length-1) == '!') {
      t = t.slice(0,-1);
      cmp = neqCmp;
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
              obj = readType(dataView, idx, ta, struct);
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
            v = readType(dataView, idx, t[k], struct); 
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
            v[i] = readType(dataView, idx, ta, struct);
          }
          return v;
        }
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

ArrayBuffer.littleEndian = new Int8Array(new Int16Array([1]).buffer)[0] > 0;

var arrayToNative = function(array, arrayIsLittleEndian) {
  if (!!arrayIsLittleEndian == ArrayBuffer.littleEndian) {
    return array;
  } else {
    return flipArrayEndianness(array);
  }
};

var nativeToEndian = function(array, littleEndian) {
  if (ArrayBuffer.littleEndian == !!littleEndian) {
    return array;
  } else {
    return flipArrayEndianness(array);
  }
};

var flipArrayEndianness = function(array) {
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