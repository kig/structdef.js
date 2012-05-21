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

