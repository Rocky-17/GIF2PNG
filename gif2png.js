// ===================  omggif ================================

function GifReader(u) {
    var p = 0;
    if (u[p++] !== 0x47 || u[p++] !== 0x49 || u[p++] !== 0x46 || u[p++] !== 0x38 || (u[p++] + 1 & 0xfd) !== 0x38 || u[p++] !== 0x61) {
        throw new Error("Invalid GIF 87a/89a header.");
    }
    var v = u[p++] | u[p++] << 8;
    var z = u[p++] | u[p++] << 8;
    var A = u[p++];
    var B = A >> 7;
    var C = A & 0x7;
    var D = 1 << (C + 1);
    var E = u[p++];
    u[p++];
    var F = null;
    var G = null;
    if (B) {
        F = p;
        G = D;
        p += D * 3
    }
    var H = true;
    var I = [];
    var J = 0;
    var K = null;
    var L = 0;
    var M = null;
    this.width = v;
    this.height = z;
    while (H && p < u.length) {
        switch (u[p++]) {
            case 0x21:
                switch (u[p++]) {
                    case 0xff:
                        if (u[p] !== 0x0b || u[p + 1] == 0x4e && u[p + 2] == 0x45 && u[p + 3] == 0x54 && u[p + 4] == 0x53 && u[p + 5] == 0x43 && u[p + 6] == 0x41 && u[p + 7] == 0x50 && u[p + 8] == 0x45 && u[p + 9] == 0x32 && u[p + 10] == 0x2e && u[p + 11] == 0x30 && u[p + 12] == 0x03 && u[p + 13] == 0x01 && u[p + 16] == 0) {
                            p += 14;
                            M = u[p++] | u[p++] << 8;
                            p++
                        } else {
                            p += 12;
                            while (true) {
                                var N = u[p++];
                                if (!(N >= 0)) throw Error("Invalid block size");
                                if (N === 0) break;
                                p += N
                            }
                        }
                        break;
                    case 0xf9:
                        if (u[p++] !== 0x4 || u[p + 4] !== 0) throw new Error("Invalid graphics extension block.");
                        var O = u[p++];
                        J = u[p++] | u[p++] << 8;
                        K = u[p++];
                        if ((O & 1) === 0) K = null;
                        L = O >> 2 & 0x7;
                        p++;
                        break;
                    case 0x01:
                    case 0xfe:
                        while (true) {
                            var N = u[p++];
                            if (!(N >= 0)) throw Error("Invalid block size");
                            if (N === 0) break;
                            p += N
                        }
                        break;
                    default:
                        throw new Error("Unknown graphic control label: 0x" + u[p - 1].toString(16));
                }
                break;
            case 0x2c:
                var x = u[p++] | u[p++] << 8;
                var y = u[p++] | u[p++] << 8;
                var w = u[p++] | u[p++] << 8;
                var h = u[p++] | u[p++] << 8;
                var P = u[p++];
                var Q = P >> 7;
                var R = P >> 6 & 1;
                var S = P & 0x7;
                var T = 1 << (S + 1);
                var U = F;
                var V = G;
                var W = false;
                if (Q) {
                    var W = true;
                    U = p;
                    V = T;
                    p += T * 3
                }
                var X = p;
                p++;
                while (true) {
                    var N = u[p++];
                    if (!(N >= 0)) throw Error("Invalid block size");
                    if (N === 0) break;
                    p += N
                }
                I.push({
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    has_local_palette: W,
                    palette_offset: U,
                    palette_size: V,
                    data_offset: X,
                    data_length: p - X,
                    transparent_index: K,
                    interlaced: !!R,
                    delay: J,
                    disposal: L
                });
                break;
            case 0x3b:
                H = false;
                break;
            default:
                throw new Error("Unknown gif block: 0x" + u[p - 1].toString(16));
                break
        }
    }
    this.numFrames = function () {
        return I.length
    };
    this.loopCount = function () {
        return M
    };
    this.frameInfo = function (a) {
        if (a < 0 || a >= I.length) throw new Error("Frame index out of range.");
        return I[a]
    };
    this.decodeAndBlitFrameBGRA = function (a, c) {
        var d = this.frameInfo(a);
        var e = d.width * d.height;
        var f = new Uint8Array(e);
        GifReaderLZWOutputIndexStream(u, d.data_offset, f, e);
        var h = d.palette_offset;
        var j = d.transparent_index;
        if (j === null) j = 256;
        var k = d.width;
        var l = v - k;
        var m = k;
        var n = ((d.y * v) + d.x) * 4;
        var o = ((d.y + d.height) * v + d.x) * 4;
        var p = n;
        var q = l * 4;
        if (d.interlaced === true) {
            q += v * 4 * 7
        }
        var s = 8;
        for (var i = 0, il = f.length; i < il; ++i) {
            var t = f[i];
            if (m === 0) {
                p += q;
                m = k;
                if (p >= o) {
                    q = l * 4 + v * 4 * (s - 1);
                    p = n + (k + l) * (s << 1);
                    s >>= 1
                }
            }
            if (t === j) {
                p += 4
            } else {
                var r = u[h + t * 3];
                var g = u[h + t * 3 + 1];
                var b = u[h + t * 3 + 2];
                c[p++] = b;
                c[p++] = g;
                c[p++] = r;
                c[p++] = 255
            } --m
        }
    };
    this.decodeAndBlitFrameRGBA = function (a, c) {
        var d = this.frameInfo(a);
        var e = d.width * d.height;
        var f = new Uint8Array(e);
        GifReaderLZWOutputIndexStream(u, d.data_offset, f, e);
        var h = d.palette_offset;
        var j = d.transparent_index;
        if (j === null) j = 256;
        var k = d.width;
        var l = v - k;
        var m = k;
        var n = ((d.y * v) + d.x) * 4;
        var o = ((d.y + d.height) * v + d.x) * 4;
        var p = n;
        var q = l * 4;
        if (d.interlaced === true) {
            q += v * 4 * 7
        }
        var s = 8;
        for (var i = 0, il = f.length; i < il; ++i) {
            var t = f[i];
            if (m === 0) {
                p += q;
                m = k;
                if (p >= o) {
                    q = l * 4 + v * 4 * (s - 1);
                    p = n + (k + l) * (s << 1);
                    s >>= 1
                }
            }
            if (t === j) {
                p += 4
            } else {
                var r = u[h + t * 3];
                var g = u[h + t * 3 + 1];
                var b = u[h + t * 3 + 2];
                c[p++] = r;
                c[p++] = g;
                c[p++] = b;
                c[p++] = 255
            } --m
        }
    }
}

function GifReaderLZWOutputIndexStream(a, p, c, d) {
    var e = a[p++];
    var f = 1 << e;
    var g = f + 1;
    var h = g + 1;
    var i = e + 1;
    var j = (1 << i) - 1;
    var l = 0;
    var m = 0;
    var n = 0;
    var o = a[p++];
    var q = new Int32Array(4096);
    var r = null;
    while (true) {
        while (l < 16) {
            if (o === 0) break;
            m |= a[p++] << l;
            l += 8;
            if (o === 1) {
                o = a[p++]
            } else {
                --o
            }
        }
        if (l < i) break;
        var s = m & j;
        m >>= i;
        l -= i;
        if (s === f) {
            h = g + 1;
            i = e + 1;
            j = (1 << i) - 1;
            r = null;
            continue
        } else if (s === g) {
            break
        }
        var t = s < h ? s : r;
        var u = 0;
        var v = t;
        while (v > f) {
            v = q[v] >> 8;
            ++u
        }
        var k = v;
        var w = n + u + (t !== s ? 1 : 0);
        if (w > d) {
            console.log("Warning, gif stream longer than expected.");
            return
        }
        c[n++] = k;
        n += u;
        var b = n;
        if (t !== s) c[n++] = k;
        v = t;
        while (u--) {
            v = q[v];
            c[--b] = v & 0xff;
            v >>= 8
        }
        if (r !== null && h < 4096) {
            q[h++] = r << 8 | k;
            if (h >= j + 1 && i < 12) {
                ++i;
                j = j << 1 | 1
            }
        }
        r = s
    }
    if (n !== d) {
        console.log("Warning, gif stream shorter than expected.")
    }
    return c
}


// ========== 读取GIF base64 ===================

function base64ToUint8Array(base64) {
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  function getFirstFramePixelsFromBase64GIF(base64GIF) {
    var base64Header = 'data:image/gif;base64,';
    var base64Data = base64GIF.substring(base64Header.length);
    var gifData = base64ToUint8Array(base64Data);
    var gifReader = new GifReader(gifData);
  
    var width = gifReader.width;
    var height = gifReader.height;
    var numPixels = width * height;
    var pixels = new Uint8Array(numPixels * 4);
  
    gifReader.decodeAndBlitFrameRGBA(0, pixels);
  
    return {
      width: width,
      height: height,
      pixels: pixels
    };
  }
  
  

//=========================     png编码         =============================================

// png简单压缩算法
function simpleDeflate(input) {
    const output = [];
    let inputIndex = 0;

    // Write header
    output.push(0x78, 0x9C);

    while (inputIndex < input.length) {
        const blockSize = Math.min(0xFFFF, input.length - inputIndex);
        const lastBlock = inputIndex + blockSize === input.length;

        // Write block header
        output.push(lastBlock ? 1 : 0);
        output.push(blockSize & 0xFF, blockSize >>> 8);
        output.push(~blockSize & 0xFF, (~blockSize >>> 8) & 0xFF);

        // Write block data
        output.push(...input.slice(inputIndex, inputIndex + blockSize));

        inputIndex += blockSize;
    }

    return new Uint8Array(output);
}


//png编码
class PNGEncoder {
    constructor(width, height, pixelData) {
        this.width = width;
        this.height = height;
        this.pixelData = pixelData;
    }

    createHeader() {
        const header = new ArrayBuffer(8);
        const headerView = new Uint8Array(header);
        headerView.set([137, 80, 78, 71, 13, 10, 26, 10]);
        return header;
    }

    createChunk(type, data) {
        const chunkSize = new Uint32Array(1);
        chunkSize[0] = data ? data.byteLength : 0;

        const chunkType = new TextEncoder().encode(type);
        const crcData = new Uint8Array(chunkSize[0] + 4);
        crcData.set(chunkType, 0);
        if (data) {
            crcData.set(new Uint8Array(data), 4);
        }

        const crc = new Uint32Array(1);
        crc[0] = this.crc32(crcData);

        const chunk = new ArrayBuffer(12 + chunkSize[0]);
        const chunkView = new DataView(chunk);
        chunkView.setUint32(0, chunkSize[0], false);
        chunkView.setUint32(4, chunkType[0] << 24 | chunkType[1] << 16 | chunkType[2] << 8 | chunkType[3], false);
        if (data) {
            new Uint8Array(chunk).set(new Uint8Array(data), 8);
        }
        chunkView.setUint32(8 + chunkSize[0], crc[0], false);

        return chunk;
    }

    crc32(data) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            }
            table[i] = c;
        }

        let crc = -1;
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
        }
        return crc ^ -1;
    }

    createIHDR() {
        const data = new ArrayBuffer(13);
        const dataView = new DataView(data);
        dataView.setUint32(0, this.width, false);
        dataView.setUint32(4, this.height, false);
        dataView.setUint8(8, 8); // bit depth
        dataView.setUint8(9, 6); // color type (6 = RGBA)
        dataView.setUint8(10, 0); // compression method
        dataView.setUint8(11, 0); // filter method
        dataView.setUint8(12, 0); // interlace method

        return this.createChunk('IHDR', data);
    }

    createIDAT() {
        const scanlines = new Uint8Array((this.width * 4 + 1) * this.height);
        for (let i = 0; i < this.height; i++) {
            const scanlineStart = i * (this.width * 4 + 1);
            scanlines[scanlineStart] = 0; // filter type (0 = None)
            scanlines.set(this.pixelData.subarray(i * this.width * 4, (i + 1) * this.width * 4), scanlineStart + 1);
        }

        const compressedData = simpleDeflate(scanlines);
        return this.createChunk('IDAT', compressedData);
    }

    createIEND() {
        return this.createChunk('IEND');
    }

    encode() {
        const header = this.createHeader();
        const ihdr = this.createIHDR();
        const idat = this.createIDAT();
        const iend = this.createIEND();

        const totalSize = header.byteLength + ihdr.byteLength + idat.byteLength + iend.byteLength;
        const encodedData = new Uint8Array(totalSize);

        let offset = 0;
        encodedData.set(new Uint8Array(header), offset);
        offset += header.byteLength;

        encodedData.set(new Uint8Array(ihdr), offset);
        offset += ihdr.byteLength;

        encodedData.set(new Uint8Array(idat), offset);
        offset += idat.byteLength;

        encodedData.set(new Uint8Array(iend), offset);

        return encodedData;
    }
}


function uint8ArrayToBase64(uint8Array) {
    const binary = String.fromCharCode.apply(null, uint8Array);
    const base64 = btoa(binary);
    return base64;
  }
  

//====================== 用例 ================================================

  const fs = require('fs');

  function writePixelsToFile(pixels, filename) {
    const pixelData = [];
    for (let i = 0; i < pixels.length; i++) {
      pixelData.push(pixels[i].toString());
    }
  
    const pixelDataString = pixelData.join(',');
  
    fs.writeFile(filename, pixelDataString, (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File has been written successfully.');
      }
    });
  }
  

  
  
var base64Gif = "";
var firstFrame = getFirstFramePixelsFromBase64GIF(base64Gif);


const pngEncoder = new PNGEncoder(firstFrame.width,firstFrame.height, firstFrame.pixels);
const pngData = pngEncoder.encode();



const pngBase64 = uint8ArrayToBase64(pngData);
const pngDataURL = 'data:image/png;base64,' + pngBase64;

// 输出 Base64 编码的 PNG 图像
console.log(pngDataURL);
