const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function seed(e=20) {
    let t = "";
    for (let n = 0; n < e; n++) {
        const e = Math.floor(Math.random() * characters.length);
        t += characters[e]
    }
    return t
}

function _(e) {
  var t, n = "", r = 32 * e.length;
  for (t = 0; t < r; t += 8)
      n += String.fromCharCode(e[t >> 5] >>> t % 32 & 255);
  return n
}
function i(e, t) {
  var n = (65535 & e) + (65535 & t);
  return (e >> 16) + (t >> 16) + (n >> 16) << 16 | 65535 & n
}
function a(e, t, n, r, o, a) {
  return i((s = i(i(t, e), i(r, a))) << (c = o) | s >>> 32 - c, n);
  var s, c
}
function s(e, t, n, r, o, i, s) {
  return a(t & n | ~t & r, e, t, o, i, s)
}
function c(e, t, n, r, o, i, s) {
  return a(t & r | n & ~r, e, t, o, i, s)
}
function u(e, t, n, r, o, i, s) {
  return a(t ^ n ^ r, e, t, o, i, s)
}
function l(e, t, n, r, o, i, s) {
  return a(n ^ (t | ~r), e, t, o, i, s)
}
function d(e, t) {
  var n, r, o, a, d;
  e[t >> 5] |= 128 << t % 32,
  e[14 + (t + 64 >>> 9 << 4)] = t;
  var _ = 1732584193
    , f = -271733879
    , E = -1732584194
    , p = 271733878;
  for (n = 0; n < e.length; n += 16)
      r = _,
      o = f,
      a = E,
      d = p,
      _ = s(_, f, E, p, e[n], 7, -680876936),
      p = s(p, _, f, E, e[n + 1], 12, -389564586),
      E = s(E, p, _, f, e[n + 2], 17, 606105819),
      f = s(f, E, p, _, e[n + 3], 22, -1044525330),
      _ = s(_, f, E, p, e[n + 4], 7, -176418897),
      p = s(p, _, f, E, e[n + 5], 12, 1200080426),
      E = s(E, p, _, f, e[n + 6], 17, -1473231341),
      f = s(f, E, p, _, e[n + 7], 22, -45705983),
      _ = s(_, f, E, p, e[n + 8], 7, 1770035416),
      p = s(p, _, f, E, e[n + 9], 12, -1958414417),
      E = s(E, p, _, f, e[n + 10], 17, -42063),
      f = s(f, E, p, _, e[n + 11], 22, -1990404162),
      _ = s(_, f, E, p, e[n + 12], 7, 1804603682),
      p = s(p, _, f, E, e[n + 13], 12, -40341101),
      E = s(E, p, _, f, e[n + 14], 17, -1502002290),
      _ = c(_, f = s(f, E, p, _, e[n + 15], 22, 1236535329), E, p, e[n + 1], 5, -165796510),
      p = c(p, _, f, E, e[n + 6], 9, -1069501632),
      E = c(E, p, _, f, e[n + 11], 14, 643717713),
      f = c(f, E, p, _, e[n], 20, -373897302),
      _ = c(_, f, E, p, e[n + 5], 5, -701558691),
      p = c(p, _, f, E, e[n + 10], 9, 38016083),
      E = c(E, p, _, f, e[n + 15], 14, -660478335),
      f = c(f, E, p, _, e[n + 4], 20, -405537848),
      _ = c(_, f, E, p, e[n + 9], 5, 568446438),
      p = c(p, _, f, E, e[n + 14], 9, -1019803690),
      E = c(E, p, _, f, e[n + 3], 14, -187363961),
      f = c(f, E, p, _, e[n + 8], 20, 1163531501),
      _ = c(_, f, E, p, e[n + 13], 5, -1444681467),
      p = c(p, _, f, E, e[n + 2], 9, -51403784),
      E = c(E, p, _, f, e[n + 7], 14, 1735328473),
      _ = u(_, f = c(f, E, p, _, e[n + 12], 20, -1926607734), E, p, e[n + 5], 4, -378558),
      p = u(p, _, f, E, e[n + 8], 11, -2022574463),
      E = u(E, p, _, f, e[n + 11], 16, 1839030562),
      f = u(f, E, p, _, e[n + 14], 23, -35309556),
      _ = u(_, f, E, p, e[n + 1], 4, -1530992060),
      p = u(p, _, f, E, e[n + 4], 11, 1272893353),
      E = u(E, p, _, f, e[n + 7], 16, -155497632),
      f = u(f, E, p, _, e[n + 10], 23, -1094730640),
      _ = u(_, f, E, p, e[n + 13], 4, 681279174),
      p = u(p, _, f, E, e[n], 11, -358537222),
      E = u(E, p, _, f, e[n + 3], 16, -722521979),
      f = u(f, E, p, _, e[n + 6], 23, 76029189),
      _ = u(_, f, E, p, e[n + 9], 4, -640364487),
      p = u(p, _, f, E, e[n + 12], 11, -421815835),
      E = u(E, p, _, f, e[n + 15], 16, 530742520),
      _ = l(_, f = u(f, E, p, _, e[n + 2], 23, -995338651), E, p, e[n], 6, -198630844),
      p = l(p, _, f, E, e[n + 7], 10, 1126891415),
      E = l(E, p, _, f, e[n + 14], 15, -1416354905),
      f = l(f, E, p, _, e[n + 5], 21, -57434055),
      _ = l(_, f, E, p, e[n + 12], 6, 1700485571),
      p = l(p, _, f, E, e[n + 3], 10, -1894986606),
      E = l(E, p, _, f, e[n + 10], 15, -1051523),
      f = l(f, E, p, _, e[n + 1], 21, -2054922799),
      _ = l(_, f, E, p, e[n + 8], 6, 1873313359),
      p = l(p, _, f, E, e[n + 15], 10, -30611744),
      E = l(E, p, _, f, e[n + 6], 15, -1560198380),
      f = l(f, E, p, _, e[n + 13], 21, 1309151649),
      _ = l(_, f, E, p, e[n + 4], 6, -145523070),
      p = l(p, _, f, E, e[n + 11], 10, -1120210379),
      E = l(E, p, _, f, e[n + 2], 15, 718787259),
      f = l(f, E, p, _, e[n + 9], 21, -343485551),
      _ = i(_, r),
      f = i(f, o),
      E = i(E, a),
      p = i(p, d);
  return [_, f, E, p]
}
function f(e) {
  var t, n = [];
  for (n[(e.length >> 2) - 1] = void 0,
  t = 0; t < n.length; t += 1)
      n[t] = 0;
  var r = 8 * e.length;
  for (t = 0; t < r; t += 8)
      n[t >> 5] |= (255 & e.charCodeAt(t / 8)) << t % 32;
  return n
}
function p(e) {
  return unescape(encodeURIComponent(e))
}
function h(e) {
  return function(e) {
      return _(d(f(e), 8 * e.length))
  }(p(e))
}
function E(e) {
  var t, n, r = "0123456789abcdef", o = "";
  for (n = 0; n < e.length; n += 1)
      t = e.charCodeAt(n),
      o += r.charAt(t >>> 4 & 15) + r.charAt(15 & t);
  return o
}

export const encodeToken = function(e) {
  const t = Math.round((new Date).getTime() / 1e3)
    , n = t + 3600
    , r = "".concat(t, ":").concat(n)
    , i = "Token:".concat(e)
    , s = seed(32)
    , c = E(h("".concat(s, "_").concat(i, "_").concat(r, "_").concat("V4")))
    , u = "".concat(c, "_").concat(s, "_").concat(i, "_").concat(r, "_").concat("V4");
  return u
}