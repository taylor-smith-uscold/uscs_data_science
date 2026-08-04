#!/usr/bin/env python3
"""Build the guide's favicon assets from docs/uscs_shield.png.

    python3 tools/make_icons.py docs

Writes favicon-32.png, favicon-64.png and apple-touch-icon.png into that
directory, overwriting whatever is there. Re-run after changing PLATE_LIGHT.

The source logo is a flat #EEF0F1 silhouette on transparency, i.e. a
light-on-dark mark. Rendered directly into a favicon it disappears against a
light tab strip, so each icon composites the shield onto a rounded plate in the
guide's petrol accent. Pure stdlib: no PIL, no ImageMagick, since neither is
available here and sips cannot composite.
"""
import struct, zlib, sys, os

PLATE_LIGHT = (0x1f, 0x56, 0x73)   # --tech, the guide's accent
SHIELD      = (0xee, 0xf0, 0xf1)   # the logo's own colour
SS          = 3                    # supersample factor for antialiasing


# ---------------------------------------------------------------- decode ----
def decode_png(path):
    d = open(path, 'rb').read()
    pos, idat, w, h, ct = 8, b'', None, None, None
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos + 4])[0]
        typ = d[pos + 4:pos + 8]
        data = d[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct = struct.unpack('>IIBB', data[:10])
            assert bd == 8 and ct == 6, 'expected 8-bit RGBA'
        elif typ == b'IDAT':
            idat += data
        pos += 12 + ln
    raw = zlib.decompress(idat)
    bpp, stride = 4, w * 4
    out, prev, i = bytearray(), bytearray(stride), 0
    for _ in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i + stride]); i += stride
        if f:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                if f == 1:   line[x] = (line[x] + a) & 255
                elif f == 2: line[x] = (line[x] + b) & 255
                elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
                elif f == 4:
                    p = a + b - c
                    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                    line[x] = (line[x] + (a if (pa <= pb and pa <= pc)
                                          else (b if pb <= pc else c))) & 255
        out += line
        prev = line
    return w, h, out


# ---------------------------------------------------------------- encode ----
def encode_png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


# ------------------------------------------------------------- resampling ---
def box_alpha(src_w, src_h, src, dst_w, dst_h):
    """Downsample just the alpha channel with a box filter."""
    out = bytearray(dst_w * dst_h)
    for y in range(dst_h):
        y0, y1 = y * src_h // dst_h, max(y * src_h // dst_h + 1, (y + 1) * src_h // dst_h)
        for x in range(dst_w):
            x0, x1 = x * src_w // dst_w, max(x * src_w // dst_w + 1, (x + 1) * src_w // dst_w)
            tot = n = 0
            for yy in range(y0, y1):
                base = yy * src_w * 4
                for xx in range(x0, x1):
                    tot += src[base + xx * 4 + 3]
                    n += 1
            out[y * dst_w + x] = tot // n
    return out


def downsample_rgba(w, h, px, f):
    """Average f x f blocks down to (w//f, h//f)."""
    nw, nh = w // f, h // f
    out = bytearray(nw * nh * 4)
    inv = 1.0 / (f * f)
    for y in range(nh):
        for x in range(nw):
            r = g = b = a = 0
            for dy in range(f):
                base = ((y * f + dy) * w + x * f) * 4
                for dx in range(f):
                    o = base + dx * 4
                    al = px[o + 3]
                    r += px[o] * al; g += px[o + 1] * al; b += px[o + 2] * al; a += al
            o = (y * nw + x) * 4
            if a:
                out[o] = int(r / a); out[o + 1] = int(g / a); out[o + 2] = int(b / a)
            out[o + 3] = int(a * inv)
    return nw, nh, out


# ------------------------------------------------------------------ build ---
def make_icon(size, sw, sh, shield, plate, radius_ratio=0.22, inset_ratio=0.16):
    S = size * SS
    r = int(S * radius_ratio)
    px = bytearray(S * S * 4)

    # rounded-rect plate
    for y in range(S):
        for x in range(S):
            cx = min(max(x, r), S - 1 - r)
            cy = min(max(y, r), S - 1 - r)
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy <= r * r:
                o = (y * S + x) * 4
                px[o:o + 3] = bytes(plate)
                px[o + 3] = 255

    # shield, scaled to fit inside the inset and centred
    inner = int(S * (1 - 2 * inset_ratio))
    tw = inner
    th = max(1, int(inner * sh / sw))
    if th > inner:
        th, tw = inner, max(1, int(inner * sw / sh))
    a = box_alpha(sw, sh, shield, tw, th)
    ox, oy = (S - tw) // 2, (S - th) // 2
    for y in range(th):
        for x in range(tw):
            al = a[y * tw + x]
            if not al:
                continue
            o = ((oy + y) * S + ox + x) * 4
            t = al / 255.0
            for c in range(3):
                px[o + c] = int(px[o + c] * (1 - t) + SHIELD[c] * t)
            px[o + 3] = max(px[o + 3], al)

    return downsample_rgba(S, S, px, SS)


if __name__ == '__main__':
    docs = sys.argv[1]
    sw, sh, shield = decode_png(os.path.join(docs, 'uscs_shield.png'))
    print('source: %dx%d' % (sw, sh))
    for name, size in [('favicon-32.png', 32), ('favicon-64.png', 64),
                       ('apple-touch-icon.png', 180)]:
        w, h, px = make_icon(size, sw, sh, shield, PLATE_LIGHT)
        out = os.path.join(docs, name)
        encode_png(out, w, h, px)
        print('  %-22s %dx%d  %.1f KB' % (name, w, h, os.path.getsize(out) / 1024))
