/*!
 * Jellyfin TV Player tweaks for Samsung Tizen (and any TV layout):
 *  - OK/Enter on a hidden player bar shows the bar instead of pausing
 *  - Arrow down opens an on-screen subtitle settings bar (size XS–XL, 4 styles, live preview)
 *  - Subtitle button moved next to the transport controls + "Aa" settings button
 * Settings are stored per device in localStorage. Install via the "JavaScript Injector" plugin. MIT License.
 */
(function () {
'use strict';
if (window.__tvPlayer) return; window.__tvPlayer = true;
var LANGUAGE = 'auto'; // 'auto' | 'en' | 'de'
var DE = LANGUAGE === 'auto' ? /^de/i.test(document.documentElement.lang || navigator.language || '') : LANGUAGE === 'de';
var TX = DE ? { sub: 'Untertitel', set: 'Einstellungen', setT: 'Untertitel-Einstellungen', prev: 'So sehen deine Untertitel aus.', lang: 'Sprache', size: 'Textgröße', style: 'Stil', off: 'Aus', on: 'An' }
            : { sub: 'Subtitles', set: 'Settings', setT: 'Subtitle settings', prev: 'This is how your subtitles will look.', lang: 'Language', size: 'Text size', style: 'Style', off: 'Off', on: 'On' };
function isTv() { var d = document.documentElement; return !!window.tizen || d.classList.contains('layout-tv') || (document.body && document.body.classList.contains('layout-tv')); }
function activeBar() { var bars = document.querySelectorAll('.videoOsdBottom'); for (var i = 0; i < bars.length; i++) { var b = bars[i], pg = b.closest ? b.closest('.page') : null; if (pg && pg.classList.contains('hide')) continue; return b; } return null; }
function barHidden(b) { return b.classList.contains('videoOsdBottom-hidden') || b.classList.contains('hide'); }
var SIZES = [['XS', 1.6], ['S', 1.95], ['M', 2.25], ['L', 2.8], ['XL', 3.4]];
var OUT = '-.06em -.06em 0 #000,.06em -.06em 0 #000,-.06em .06em 0 #000,.06em .06em 0 #000,0 .08em .12em #000';
var STYLES = [
{ c: '#fff', bg: 'rgba(0,0,0,.78)', sh: 'none' },
{ c: '#fff', bg: 'transparent', sh: '0 0 .15em #000,0 0 .35em #000,.05em .05em .12em #000' },
{ c: '#ffd60a', bg: 'transparent', sh: '0 0 .15em #000,0 0 .35em #000,.05em .05em .12em #000' },
{ c: '#fff', bg: 'transparent', sh: OUT }
];
var cfg = { s: 2, st: 0 };
try { var sv = JSON.parse(localStorage.getItem('tvSubStyle') || 'null'); if (sv && SIZES[sv.s] && STYLES[sv.st]) cfg = sv; } catch (e) {}
var subStyle = document.createElement('style'); (document.head || document.documentElement).appendChild(subStyle);
function applySub(c) {
c = c || cfg; var s = SIZES[c.s], y = STYLES[c.st];
subStyle.textContent = '.videoSubtitles .videoSubtitlesInner{font-size:' + s[1] + 'vw!important;color:' + y.c + '!important;background-color:' + y.bg + '!important;text-shadow:' + y.sh + '!important;line-height:1.3!important;padding:.06em .3em!important;margin-bottom:4vh!important}' +
'video::cue{font-size:' + s[1] + 'vw!important;color:' + y.c + '!important;background-color:' + y.bg + '!important;text-shadow:' + y.sh + '!important}';
}
applySub();
var css = document.createElement('style');
css.textContent =
'.videoOsdBottom .btnSubtitles.ffSubMoved,.videoOsdBottom .ffAaBtn{width:auto!important;border-radius:2em!important;padding:0 1.1em 0 .8em!important;background:rgba(255,255,255,.14)!important;margin-left:.6em!important;color:#fff;border:0;font:inherit;cursor:pointer;height:2.6em}' +
'.videoOsdBottom .btnSubtitles.ffSubMoved::after{content:"' + TX.sub + '";font-size:.9em;font-weight:600;margin-left:.45em;vertical-align:middle}' +
'.videoOsdBottom .ffAaBtn{font-weight:700}' +
'.videoOsdBottom .btnSubtitles.ffSubMoved:focus,.videoOsdBottom .ffAaBtn:focus{background:#fff!important;color:#000!important;outline:none}' +
'#ffSubBar{position:fixed;left:0;right:0;bottom:0;z-index:100000;padding:3.2vh 4vw 4.5vh;background:linear-gradient(0deg,rgba(0,0,0,.95) 0%,rgba(0,0,0,.85) 60%,rgba(0,0,0,0) 100%);color:#fff;font-family:inherit;display:flex;align-items:flex-end;gap:2.5vw}' +
'#ffSubBar .ffg{flex:1;background:rgba(255,255,255,.08);border-radius:.6vw;padding:1.2vh 1.6vw 1.4vh}' +
'#ffSubBar .ffg.ffwide{flex:1.25}' +
'#ffSubBar .fflab{font-size:1.15vw;font-weight:500;opacity:.9;margin-bottom:1.6vh}' +
'#ffSubBar .ffitems{display:flex;align-items:center;justify-content:space-around}' +
'#ffSubBar .ffit{border:0;background:transparent;color:#fff;font:inherit;font-size:1.45vw;font-weight:700;padding:.55vh .8vw;border-radius:.35vw;cursor:pointer;min-width:3.2vw;line-height:1.2;outline:none}' +
'#ffSubBar .fflang{font-size:1.4vw;text-align:left;justify-content:flex-start}' +
'#ffSubBar .ffsz.ffsel{background:#1f6feb}' +
'#ffSubBar .ffst{font-size:1.55vw;font-weight:600;border:.25vw solid transparent;padding:.4vh .7vw}' +
'#ffSubBar .ffst.ffsel{border-color:#fff}' +
'#ffSubBar .ffit:focus{box-shadow:0 0 0 .2vw #fff;transform:scale(1.12)}' +
'#ffSubBar .ffsz.ffsel:focus{box-shadow:0 0 0 .2vw #fff}' +
'html.ffSubOpen .videoSubtitles{visibility:hidden!important}html.ffSubOpen video::cue{color:transparent!important;background:transparent!important;text-shadow:none!important}' +
'#ffSubPrev{position:fixed;left:0;right:0;bottom:24vh;z-index:100000;text-align:center;pointer-events:none}' +
'#ffSubPrev span{display:inline-block;line-height:1.3;padding:.06em .3em}';
(document.head || document.documentElement).appendChild(css);
var bar = null, prev = null, items = [], saved = null, returnFocus = null;
var LANG = DE ? { ger: 'Deutsch', deu: 'Deutsch', de: 'Deutsch', eng: 'Englisch', en: 'Englisch', kor: 'Koreanisch', ko: 'Koreanisch', jpn: 'Japanisch', spa: 'Spanisch', fre: 'Französisch', fra: 'Französisch', chi: 'Chinesisch', zho: 'Chinesisch', por: 'Portugiesisch', ita: 'Italienisch' }
  : { ger: 'German', deu: 'German', de: 'German', eng: 'English', en: 'English', kor: 'Korean', ko: 'Korean', jpn: 'Japanese', spa: 'Spanish', fre: 'French', fra: 'French', chi: 'Chinese', zho: 'Chinese', por: 'Portuguese', ita: 'Italian' };
function langLabel(el) {
try {
var a = window.ApiClient; if (!a) return;
a.getJSON(a.getUrl('Sessions', { deviceId: a.deviceId() })).then(function (s) {
var se = s && s[0]; if (!se || !se.NowPlayingItem) return;
var idx = se.PlayState ? se.PlayState.SubtitleStreamIndex : null;
var st = (se.NowPlayingItem.MediaStreams || []).filter(function (m) { return m.Type === 'Subtitle' && m.Index === idx; })[0];
el.textContent = (idx == null || idx < 0 || !st) ? TX.off : (LANG[(st.Language || '').toLowerCase()] || st.Language || st.DisplayTitle || TX.on);
});
} catch (e) {}
}
function preview(c) {
var s = SIZES[c.s], y = STYLES[c.st], sp = prev.querySelector('span');
sp.style.fontSize = s[1] + 'vw'; sp.style.color = y.c; sp.style.background = y.bg; sp.style.textShadow = y.sh;
}
function mark() {
for (var i = 0; i < items.length; i++) { var it = items[i]; it.classList.toggle('ffsel', (it._k === 's' && it._v === cfg.s) || (it._k === 'st' && it._v === cfg.st)); }
}
function onFocusItem(it) {
if (it._k === 's' || it._k === 'st') { var t = { s: cfg.s, st: cfg.st }; t[it._k] = it._v; applySub(t); preview(t); }
}
function select(it) {
if (it._k === 'lang') { closeBar(true); var b = activeBar(); var sub = b && b.querySelector('.btnSubtitles'); if (sub) sub.click(); return; }
cfg[it._k] = it._v; try { localStorage.setItem('tvSubStyle', JSON.stringify(cfg)); } catch (e) {} applySub(); preview(cfg); mark();
}
function openBar() {
if (bar) return;
returnFocus = document.activeElement; saved = { s: cfg.s, st: cfg.st };
prev = document.createElement('div'); prev.id = 'ffSubPrev'; prev.innerHTML = '<span>' + TX.prev + '</span>';
bar = document.createElement('div'); bar.id = 'ffSubBar';
var h = '<div class="ffg"><div class="fflab">' + TX.lang + '</div><div class="ffitems" style="justify-content:flex-start"><button class="ffit fflang">…</button></div></div>';
h += '<div class="ffg ffwide"><div class="fflab">' + TX.size + '</div><div class="ffitems">';
for (var i = 0; i < SIZES.length; i++) h += '<button class="ffit ffsz" data-v="' + i + '">' + SIZES[i][0] + '</button>';
h += '</div></div><div class="ffg ffwide"><div class="fflab">' + TX.style + '</div><div class="ffitems">';
for (var j = 0; j < STYLES.length; j++) { var y = STYLES[j]; h += '<button class="ffit ffst" data-v="' + j + '" style="color:' + y.c + ';text-shadow:' + y.sh + ';' + (y.bg !== 'transparent' ? 'background:' + y.bg : '') + '">Aa</button>'; }
h += '</div></div>';
bar.innerHTML = h;
document.body.appendChild(prev); document.body.appendChild(bar); document.documentElement.classList.add('ffSubOpen');
items = Array.prototype.slice.call(bar.querySelectorAll('.ffit'));
items.forEach(function (it) {
if (it.classList.contains('fflang')) it._k = 'lang'; else { it._k = it.classList.contains('ffsz') ? 's' : 'st'; it._v = parseInt(it.getAttribute('data-v'), 10); }
it.addEventListener('focus', function () { onFocusItem(it); });
it.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); select(it); });
it.addEventListener('mouseenter', function () { it.focus(); });
});
langLabel(items[0]); mark(); preview(cfg);
var first = items.filter(function (x) { return x._k === 's' && x._v === cfg.s; })[0] || items[1];
first.focus();
}
function closeBar(keep) {
if (!bar) return;
if (!keep && saved) { cfg = saved; }
applySub(); document.documentElement.classList.remove('ffSubOpen'); bar.remove(); prev.remove(); bar = null; prev = null; items = [];
try { if (returnFocus && document.body.contains(returnFocus)) returnFocus.focus(); } catch (e) {}
}
function addButtons() {
var b = activeBar(); if (!b) return;
var sub = b.querySelector('.btnSubtitles'), ff = b.querySelector('.btnFastForward');
if (sub && ff && !sub.classList.contains('ffSubMoved')) { var after = b.querySelector('.btnNextTrack') || ff; if (after.parentNode) { after.parentNode.insertBefore(sub, after.nextSibling); sub.classList.add('ffSubMoved'); } }
if (sub && !b.querySelector('.ffAaBtn')) {
var aa = document.createElement('button'); aa.className = 'ffAaBtn'; aa.title = TX.setT; aa.textContent = 'Aa  ' + TX.set;
aa.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openBar(); });
sub.parentNode.insertBefore(aa, sub.nextSibling);
}
}
setInterval(function () { addButtons(); if (bar && !document.querySelector('.videoPlayerContainer')) closeBar(true); }, 1000);
function fire(target, key) { var ev; try { ev = new KeyboardEvent('keydown', { key: key, code: key, bubbles: true, cancelable: true }); } catch (x) { return; } (target || document.body).dispatchEvent(ev); }
function stop(e) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
document.addEventListener('keydown', function (e) {
var k = e.key, kc = e.keyCode;
if (bar) {
var cur = items.indexOf(document.activeElement); if (cur < 0) cur = 1;
if (k === 'ArrowRight' || kc === 39) { items[Math.min(items.length - 1, cur + 1)].focus(); stop(e); }
else if (k === 'ArrowLeft' || kc === 37) { items[Math.max(0, cur - 1)].focus(); stop(e); }
else if (k === 'Enter' || kc === 13) { var it = items[cur]; select(it); if (it._k !== 'lang') closeBar(true); stop(e); }
else if (k === 'Escape' || k === 'Backspace' || kc === 10009 || kc === 27 || kc === 8 || kc === 461 || k === 'ArrowUp' || kc === 38 || k === 'ArrowDown' || kc === 40) { closeBar(false); stop(e); }
return;
}
if (!isTv() || !document.querySelector('.videoPlayerContainer')) return;
if (e.target && e.target.tagName === 'BUTTON') return;
var b = activeBar(); if (!b || !barHidden(b)) return;
if (k === 'Enter' || kc === 13) { stop(e); fire(e.target, 'ArrowUp'); }
else if (k === 'ArrowDown' || k === 'Down' || kc === 40) { stop(e); addButtons(); openBar(); }
}, true);
})();