/*!
 * Jellyfin TV Home — a Netflix-style home screen for Jellyfin Web, built for Samsung Tizen TVs
 * (tested on The Frame 2022 / Tizen 6.5 / Chromium 85) and still nice on desktop, iPad and phones.
 * Install via the "JavaScript Injector" plugin. MIT License.
 */
(function () {
'use strict';
if (window.__tvHome) return; window.__tvHome = true;

/* ===================== CONFIG ===================== */
var CONFIG = {
  brand: 'Jellyfin',                 // used in row titles like "New on Jellyfin"
  language: 'auto',                  // 'auto' | 'en' | 'de'
  spotlightCollectionId: '',         // optional: a BoxSet/Playlist id whose items feed the hero + "Top 10"
  hiddenLibraries: [],               // library names (prefix match) that should not get their own row, e.g. ['Home Videos']
  hiddenPathRegex: null,             // e.g. /Home Videos|Private/i  — items whose path matches never show up in recommendations
  heroIntervalMs: 9000
};
/* ================================================== */

var I18N = {
  en: { cont: 'Continue Watching', media: 'My Media', top: 'Top 10 on {b}', because: 'Because you like {g}', themes: 'Collections', newOn: 'New on {b}', more: 'More {g} for you', again: 'Watch Again', tip: '{b} Pick', play: '\u25B6  Play', resume: '\u25B6  Resume', replay: '\u21BB  Watch again', info: '\u24D8  More Info', all: 'Show all {n} \u203A', series: 'Series', rating: 'Rated ', hr: 'h ', min: 'min', ep: 'E', match: '% Match' },
  de: { cont: 'Weiterschauen', media: 'Meine Medien', top: 'Top 10 bei {b}', because: 'Weil du gern {g} schaust', themes: 'Themenwelten', newOn: 'Neu bei {b}', more: 'Mehr {g} für dich', again: 'Nochmal ansehen', tip: '{b}-Tipp', play: '\u25B6  Abspielen', resume: '\u25B6  Fortsetzen', replay: '\u21BB  Nochmal ansehen', info: '\u24D8  Mehr Infos', all: 'Alle {n} anzeigen \u203A', series: 'Serie', rating: 'FSK ', hr: ' Std. ', min: ' Min.', ep: 'F', match: ' % Match' }
};
var LANG = CONFIG.language !== 'auto' ? CONFIG.language : (/^de/i.test((document.documentElement.lang || navigator.language || 'en')) ? 'de' : 'en');
var L = I18N[LANG] || I18N.en;
function t(k, o) { var s = L[k] || I18N.en[k] || k; o = o || {}; o.b = CONFIG.brand; return s.replace(/\{(\w)\}/g, function (_, x) { return o[x] != null ? o[x] : ''; }); }
var PRIVAT_VIEWS = CONFIG.hiddenLibraries;
var PRIVAT_PATH = CONFIG.hiddenPathRegex || /$^/;
function off() { try { return localStorage.getItem('tvHomeOff') === '1'; } catch (e) { return false; } }
function mode() {
var d = document.documentElement, b = document.body || d;
if (window.tizen || d.classList.contains('layout-tv') || b.classList.contains('layout-tv')) return 'tv';
if (d.classList.contains('layout-mobile') || b.classList.contains('layout-mobile') || window.innerWidth < 760) return 'mob';
return 'desk';
}
var css = '' +
'html.ff-home-on #slides-container,html.ff-home-on .slides-container{display:none!important}' +
'.ff-active .homeSectionsContainer,.ff-active .sections,.ff-active #slides-container,.ff-active .slides-container{display:none!important}' +
'#ffHome{position:relative;color:#fff;padding-bottom:6vh;background:#141414;--g:4vw}' +
'#ffHero{position:relative;overflow:hidden;background:#141414}' +
'.ff-desk #ffHero{height:72vh;min-height:420px}' +
'.ff-mob #ffHero{height:68vh}' +
'#ffHero .ffbg{position:absolute;top:0;right:0;width:74%;height:100%;background-size:cover;background-position:center top;transition:opacity .5s}' +
'.ff-mob #ffHero .ffbg{width:100%}' +
'#ffHero .ffshade{position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,#141414 24%,rgba(20,20,20,.7) 44%,rgba(20,20,20,0) 68%),linear-gradient(0deg,#141414 0%,rgba(20,20,20,0) 38%)}' +
'.ff-mob #ffHero .ffshade{background:linear-gradient(0deg,#141414 8%,rgba(20,20,20,.55) 45%,rgba(20,20,20,.1) 75%)}' +
'#ffHero .ffinfo{position:absolute;left:var(--g);width:40vw}' +
'.ff-desk #ffHero .ffinfo{bottom:16%}' +
'.ff-mob #ffHero .ffinfo{left:5vw;right:5vw;width:auto;bottom:4vh;text-align:center}' +
'#ffHero .fflogo{max-width:30vw;max-height:16vh;display:block;margin-bottom:2vh}' +
'.ff-tv #ffHero .fflogo{max-width:28vw;max-height:12vh}' +
'.ff-mob #ffHero .fflogo{max-width:70vw;max-height:14vh;margin:0 auto 1.6vh}' +
'#ffHero .fftitle{font-weight:800;line-height:1.05;margin:0 0 1.5vh;font-size:3.4vw}.ff-mob #ffHero .fftitle{font-size:8vw}' +
'#ffHero .fftag{display:inline-block;font-size:.8em;font-weight:800;letter-spacing:.08em;color:#e50914;margin-bottom:.8vh;text-transform:uppercase}' +
'#ffHero .ffmeta{color:#bcbcbc;margin-bottom:1.4vh}' +
'#ffHero .ffmeta b{color:#46d369;margin-right:.6em}' +
'#ffHero .ffov{line-height:1.45;color:#e5e5e5;max-height:4.4em;overflow:hidden}.ff-mob #ffHero .ffov{display:none}' +
'.ff-tv{font-size:1.15vw}.ff-desk{font-size:clamp(14px,1.05vw,19px)}.ff-mob{font-size:14px}' +
'#ffHero .ffbtns{margin-top:2.4vh}' +
'.ffbtn{font-size:1.05em;font-weight:700;border:0;border-radius:6px;padding:.6em 1.6em;margin-right:.8em;background:rgba(109,109,110,.7);color:#fff;cursor:pointer;font-family:inherit}' +
'.ffbtn.ffplay{background:#fff;color:#000}' +
'.ffbtn:hover{opacity:.85}.ffbtn:focus{outline:none;transform:scale(1.07);box-shadow:0 0 0 3px #fff}.ffbtn.ffplay:focus{background:#e50914;color:#fff}' +
'.ff-tv .ffbtn:focus{box-shadow:none;outline:.2vw solid #fff}' +
'.ff-mob .ffbtn{padding:.65em 1.4em;margin:0 .3em}' +
'.ffrow{position:relative;margin:2.2vh 0 0}' +
'.ffrow h2{font-size:1.3em;font-weight:700;margin:0 0 .4em var(--g);color:#e5e5e5}.ff-mob .ffrow h2{margin-left:4vw;font-size:1.15em}' +
'.ffscroll{display:flex;padding:1.2vh var(--g) 2vh;scroll-behavior:smooth;scrollbar-width:none}' +
'.ffscroll::-webkit-scrollbar{display:none}' +
'.ff-desk .ffscroll,.ff-mob .ffscroll{overflow-x:auto;overflow-y:hidden}' +
'.ff-mob .ffscroll{padding-left:4vw;padding-right:4vw;-webkit-overflow-scrolling:touch}' +
'.ffcard{flex:0 0 auto;position:relative;margin-right:.5em;padding:0;border:0;border-radius:6px;background:#2a2a2a center/cover no-repeat;transition:transform .2s ease,box-shadow .2s ease;cursor:pointer;overflow:hidden;animation:ffpulse 1.4s ease-in-out infinite}' +
'.ffcard.ffl{animation:none}' +
'@keyframes ffpulse{0%,100%{background-color:#2a2a2a}50%{background-color:#3a3a3a}}' +
'.ff-desk .ffland{width:19vw;height:10.7vw}.ff-desk .ffbig{width:13vw;height:19.5vw}' +
'.ff-mob .ffland{width:44vw;height:24.75vw}.ff-mob .ffbig{width:30vw;height:45vw}' +
'.ffcard:focus{outline:none;transform:scale(1.09);z-index:3;box-shadow:0 0 0 3px #fff,0 1vw 2vw rgba(0,0,0,.6)}' +
'.ff-desk .ffcard:hover{transform:scale(1.07);z-index:3;box-shadow:0 10px 30px rgba(0,0,0,.6)}' +
'.ffcard .ffcap{position:absolute;left:0;right:0;bottom:0;padding:2em .6em .5em;font-size:.85em;font-weight:700;text-align:left;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,0))}' +
'.ffcard .ffprog{position:absolute;left:.5em;right:.5em;bottom:.4em;height:4px;background:rgba(255,255,255,.3);border-radius:2px}' +
'.ffcard .ffprog i{display:block;height:100%;background:#e50914;border-radius:2px}' +
'.ffcard .ffrank{position:absolute;top:.4em;left:.4em;background:#e50914;color:#fff;font-size:.7em;font-weight:800;padding:.15em .45em;border-radius:3px}' +
'.ffcard .ffmatch{position:absolute;top:.4em;right:.4em;background:rgba(0,0,0,.7);color:#46d369;font-size:.7em;font-weight:800;padding:.15em .45em;border-radius:3px;opacity:0;transition:opacity .2s}' +
'.ffcard:hover .ffmatch,.ffcard:focus .ffmatch{opacity:1}' +
'html.ff-home-on .skinHeader{z-index:10!important}' +
'#ffHome.ff-tv{position:fixed;top:0;left:0;width:100vw;height:100vh;overflow:hidden;z-index:1;padding:0;background:#141414}' +
'.ff-tv #ffHero{position:absolute;top:0;left:0;right:0;height:60vh;z-index:1}' +
'.ff-tv #ffHero .ffinfo{top:auto;bottom:4vh;width:42vw}' +
'.ff-tv #ffHero .ffbg{transition:opacity .25s}' +
'.ff-tv #ffRowsView{position:absolute;top:58vh;left:0;right:0;bottom:0;overflow:hidden;z-index:2;background:#141414}' +
'.ff-tv #ffRowsTrack{transition:transform .28s ease;will-change:transform}' +
'.ff-tv .ffrow{overflow:hidden;margin:0}' +
'.ff-tv .ffrow h2{margin-top:1vh}' +
'.ff-tv .ffscroll{overflow:visible;padding:1.6vh 4vw 2.6vh;transition:transform .28s ease;will-change:transform}' +
'.ff-tv .ffcard{animation:none;transition:transform .15s ease;box-shadow:none}' +
'.ff-tv .ffcard:focus{transform:scale(1.07);box-shadow:none;outline:.22vw solid #fff;outline-offset:0}' +
'.ff-tv .ffland{width:16vw;height:9vw}.ff-tv .ffbig{width:11.5vw;height:17.25vw}' +
'.ff-tv .ffcard .ffmatch{opacity:1}' +
'.ffcard.ffall{display:flex;align-items:center;justify-content:center;animation:none;background:#232323;border:2px solid #3a3a3a;color:#fff;font-weight:800;font-size:1.05em;text-align:center;padding:0 1em}' +
'.ffarrow{display:none;position:absolute;top:2.2em;bottom:2vh;width:var(--g);border:0;background:rgba(20,20,20,.55);color:#fff;font-size:2em;cursor:pointer;z-index:4}' +
'.ff-desk .ffrow:hover .ffarrow{display:block}.ffarrow.l{left:0}.ffarrow.r{right:0}';
function addCss() {
if (document.getElementById('ffHomeCss')) return;
var s = document.createElement('style'); s.id = 'ffHomeCss'; s.textContent = css; document.head.appendChild(s);
}
function api() { return window.ApiClient; }
function uid() { return api().getCurrentUserId(); }
function get(path, q) { return api().getJSON(api().getUrl(path, q)).catch(function () { return { Items: [] }; }); }
function items(r) { return (r && (r.Items || (Array.isArray(r) ? r : []))) || []; }
function img(item, type, w) {
var id = item.Id, tag;
if (type === 'Backdrop') {
if (item.BackdropImageTags && item.BackdropImageTags.length) tag = item.BackdropImageTags[0];
else if (item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) { tag = item.ParentBackdropImageTags[0]; id = item.ParentBackdropItemId; }
else return img(item, 'Primary', w);
} else if (type === 'Thumb') {
if (item.ImageTags && item.ImageTags.Thumb) tag = item.ImageTags.Thumb;
else if (item.ParentThumbImageTag) { tag = item.ParentThumbImageTag; id = item.ParentThumbItemId; }
else if (item.SeriesThumbImageTag) { tag = item.SeriesThumbImageTag; id = item.SeriesId; }
else return img(item, 'Backdrop', w);
} else if (type === 'Logo') {
if (item.ImageTags && item.ImageTags.Logo) tag = item.ImageTags.Logo;
else if (item.ParentLogoImageTag) { tag = item.ParentLogoImageTag; id = item.ParentLogoItemId; }
else return null;
} else {
if (item.ImageTags && item.ImageTags.Primary) tag = item.ImageTags.Primary;
else if (item.SeriesPrimaryImageTag) { tag = item.SeriesPrimaryImageTag; id = item.SeriesId; }
else return null;
}
return api().getScaledImageUrl(id, { type: type, tag: tag, maxWidth: w, quality: 85 });
}
var FIELDS = 'Path,Overview,Genres,ProductionYear,OfficialRating,RunTimeTicks,CommunityRating';
function q(extra) {
var o = { userId: uid(), Fields: FIELDS, EnableImageTypes: 'Primary,Backdrop,Thumb,Logo', ImageTypeLimit: 1 };
for (var j in extra) o[j] = extra[j]; return o;
}
function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function clean(list) { return list.filter(function (i) { return i && i.Id && !PRIVAT_PATH.test(i.Path || ''); }); }
var profile = null, topGenres = [];
function buildProfile() {
return Promise.all([
get('Items', { userId: uid(), Recursive: true, Filters: 'IsPlayed', IncludeItemTypes: 'Movie', Fields: 'Genres,Path', Limit: 300, SortBy: 'DatePlayed', SortOrder: 'Descending' }),
get('Items', { userId: uid(), Recursive: true, Filters: 'IsPlayed', IncludeItemTypes: 'Episode', Fields: 'Path', Limit: 400, SortBy: 'DatePlayed', SortOrder: 'Descending' })
]).then(function (r) {
var cnt = {};
function add(gs, w) { (gs || []).forEach(function (g) { cnt[g] = (cnt[g] || 0) + w; }); }
clean(items(r[0])).forEach(function (m) { add(m.Genres, 2); });
var ser = {}; clean(items(r[1])).forEach(function (e) { if (e.SeriesId) ser[e.SeriesId] = (ser[e.SeriesId] || 0) + 1; });
var ids = Object.keys(ser);
var p = ids.length ? get('Items', { userId: uid(), Ids: ids.slice(0, 80).join(','), Fields: 'Genres' }) : Promise.resolve({ Items: [] });
return p.then(function (s) {
items(s).forEach(function (x) { add(x.Genres, 1 + Math.min(4, Math.floor((ser[x.Id] || 0) / 3))); });
var max = 0; for (var g in cnt) max = Math.max(max, cnt[g]);
if (!max) return;
profile = {}; for (var k in cnt) profile[k] = cnt[k] / max;
topGenres = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 4);
});
});
}
function match(item) {
if (!profile || !item.Genres || !item.Genres.length) return 0;
var w = 0; item.Genres.forEach(function (g) { w += profile[g] || 0; });
var pct = Math.round(62 + 36 * Math.min(1, w / Math.min(2, item.Genres.length)));
return pct >= 70 ? pct : 0;
}
var heroTimer = null, heroItems = [], heroIdx = 0, heroItem = null, heroHover = false;
function runtime(x) { var m = Math.round(x / 6e8); return Math.floor(m / 60) ? Math.floor(m / 60) + t('hr') + (m % 60) + t('min') : m + t('min'); }
function meta(item) {
var p = [], m = match(item);
if (m) p.push('<b>' + m + t('match') + '</b>');
if (item.ProductionYear) p.push(item.ProductionYear);
if (item.OfficialRating) p.push(t('rating') + String(item.OfficialRating).replace(/^(DE-|FSK-?)/, ''));
if (item.Type === 'Series') p.push(t('series')); else if (item.RunTimeTicks) p.push(runtime(item.RunTimeTicks));
if (item.Genres && item.Genres.length) p.push(item.Genres.slice(0, 2).join(' · '));
return p.join(' &nbsp;');
}
function showHero(item, tag) {
var hero = document.getElementById('ffHero'); if (!hero || !item) return;
heroItem = item; heroItem._tag = tag || heroItem._tag || '';
var bg = hero.querySelector('.ffbg'), url = img(item, 'Backdrop', tv ? 960 : 1280);
bg.style.opacity = 0;
var pre = new Image(); pre.onload = pre.onerror = function () { if (heroItem !== item) return; bg.style.backgroundImage = url ? 'url("' + url + '")' : 'none'; bg.style.opacity = 1; };
pre.src = url || '';
var logo = img(item, 'Logo', 600);
var name = item.Type === 'Episode' && item.SeriesName ? item.SeriesName : item.Name;
var label = heroItem._tag ? '<div class="fftag">' + esc(heroItem._tag) + '</div>' : '';
hero.querySelector('.ffhead').innerHTML = label + (logo ? '<img class="fflogo" src="' + logo + '" alt="' + esc(name) + '">' : '<div class="fftitle">' + esc(name) + '</div>');
hero.querySelector('.ffmeta').innerHTML = meta(item) + (item.Type === 'Episode' ? ' &nbsp;S' + (item.ParentIndexNumber || 1) + ':' + t('ep') + (item.IndexNumber || 1) + ' "' + esc(item.Name) + '"' : '');
hero.querySelector('.ffov').textContent = item.Overview || '';
var ud = item.UserData || {};
hero.querySelector('.ffplay').textContent = ud.PlaybackPositionTicks > 0 ? t('resume') : (ud.Played ? t('replay') : t('play'));
}
function rotateHero() {
clearInterval(heroTimer);
heroTimer = setInterval(function () {
if (!document.getElementById('ffHome')) { clearInterval(heroTimer); return; }
var a = document.activeElement;
if (heroHover || (a && a.classList && a.classList.contains('ffcard')) || !heroItems.length) return;
heroIdx = (heroIdx + 1) % heroItems.length; showHero(heroItems[heroIdx].i, heroItems[heroIdx].t);
}, CONFIG.heroIntervalMs);
}
function openDetails(item) { location.hash = '#/details?id=' + item.Id + '&serverId=' + api().serverId(); }
function playItem(item) {
var a = api(), pick = Promise.resolve(item);
if (item.Type === 'BoxSet' || item.Type === 'Playlist') return openDetails(item);
if (item.Type === 'Series') {
pick = get('Shows/NextUp', { userId: uid(), seriesId: item.Id, Limit: 1 }).then(function (r) {
if (items(r).length) return items(r)[0];
return get('Shows/' + item.Id + '/Episodes', { userId: uid(), Limit: 1 }).then(function (e) { return items(e)[0]; });
});
}
pick.then(function (it) {
if (!it) return openDetails(item);
return a.getJSON(a.getUrl('Sessions', { deviceId: a.deviceId() })).then(function (s) {
if (!s || !s.length) return openDetails(item);
var pos = it.UserData && it.UserData.PlaybackPositionTicks ? it.UserData.PlaybackPositionTicks : 0;
return a.ajax({ type: 'POST', url: a.getUrl('Sessions/' + s[0].Id + '/Playing', { playCommand: 'PlayNow', itemIds: it.Id, startPositionTicks: pos }) });
});
}).catch(function () { openDetails(item); });
}
var io = window.IntersectionObserver ? new IntersectionObserver(function (es) {
es.forEach(function (e) { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
}, { rootMargin: '30% 60%' }) : null;
function load(b) {
var u = b.getAttribute('data-bg'); if (!u) return;
var im = new Image(); im.onload = function () { b.style.backgroundImage = 'url("' + u + '")'; b.classList.add('ffl'); }; im.onerror = function () { b.classList.add('ffl'); };
im.src = u;
}
function card(item, kind, rank, M) {
var b = document.createElement('button');
b.className = 'ffcard ' + (kind === 'big' ? 'ffbig' : 'ffland');
b.setAttribute('title', item.Type === 'Episode' ? (item.SeriesName + ' – ' + item.Name) : item.Name);
var url = kind === 'big' ? img(item, 'Primary', 360) : img(item, 'Thumb', 480);
b._item = item;
if (url) { b.setAttribute('data-bg', url); if (M !== 'tv') { if (io) io.observe(b); else load(b); } } else b.classList.add('ffl');
var h = '';
var cap = item.Type === 'Episode' ? (item.SeriesName || '') + ' · ' + t('ep') + (item.IndexNumber || '') : item.Name;
if (kind !== 'big' && !(item.ImageTags && item.ImageTags.Thumb) && !item._route) h += '<div class="ffcap">' + esc(cap) + '</div>';
if (rank) h += '<div class="ffrank">TOP ' + rank + '</div>';
var m = match(item); if (m) h += '<div class="ffmatch">' + m + ' %</div>';
var ud = item.UserData;
if (ud && ud.PlayedPercentage > 0 && ud.PlayedPercentage < 100) h += '<div class="ffprog"><i style="width:' + Math.round(ud.PlayedPercentage) + '%"></i></div>';
b.innerHTML = h;
b.addEventListener('click', function () { if (item._route) { location.href = item._route; } else openDetails(item); });
return b;
}
function row(home, title, list, kind, M, ranked, more) {
list = (list || []).filter(function (i) { return i && i.Id; });
if (!list.length) return;
if (M === 'tv') list = list.slice(0, 16);
var r = document.createElement('div'); r.className = 'ffrow';
r.innerHTML = '<h2>' + esc(title) + '</h2>';
var sc = document.createElement('div'); sc.className = 'ffscroll';
list.forEach(function (it, i) { sc.appendChild(card(it, kind, ranked && i < 10 ? i + 1 : 0, M)); });
if (more) { var al = document.createElement('button'); al.className = 'ffcard ffall ' + (kind === 'big' ? 'ffbig' : 'ffland'); al.innerHTML = '<span>' + t('all', { n: more.n || '' }) + '</span>'; al._item = more.item; al.addEventListener('click', function () { location.href = more.route; }); sc.appendChild(al); }
r.appendChild(sc);
if (M === 'desk') {
['l', 'r'].forEach(function (d) {
var a = document.createElement('button'); a.className = 'ffarrow ' + d; a.setAttribute('tabindex', '-1');
a.textContent = d === 'l' ? '‹' : '›';
a.addEventListener('click', function () { sc.scrollLeft += (d === 'l' ? -1 : 1) * sc.clientWidth * 0.8; });
r.appendChild(a);
});
}
if (M === 'tv' && tv) { tv.track.appendChild(r); tv.rows.push(r); tv.c.push(0); if (tv.rows.length <= 2) loadRow(r, 0); }
else home.appendChild(r);
}
var tv = null, heroT = null;
function tvSetup(home) {
var view = document.createElement('div'); view.id = 'ffRowsView';
var track = document.createElement('div'); track.id = 'ffRowsTrack';
view.appendChild(track); home.appendChild(view);
tv = { home: home, view: view, track: track, rows: [], c: [], r: -1, hb: 0 };
}
function loadRow(row, c) {
var cards = row.querySelectorAll('.ffcard');
for (var i = 0; i < cards.length && i <= c + 7; i++) {
var b = cards[i], u = b.getAttribute('data-bg');
if (u && !b._ld) { b._ld = 1; b.style.backgroundImage = 'url("' + u + '")'; b.classList.add('ffl'); }
}
}
function heroSoon(item) { clearTimeout(heroT); heroT = setTimeout(function () { showHero(item, ''); }, 320); }
function tvFocus() {
if (!tv) return;
if (tv.r < 0) {
var bs = tv.home.querySelectorAll('#ffHero .ffbtn');
tv.track.style.transform = 'translate3d(0,0,0)';
if (bs[tv.hb]) bs[tv.hb].focus();
return;
}
var row = tv.rows[tv.r]; if (!row) return;
var cards = row.querySelectorAll('.ffcard'); if (!cards.length) return;
var c = Math.max(0, Math.min(tv.c[tv.r], cards.length - 1)); tv.c[tv.r] = c;
tv.track.style.transform = 'translate3d(0,' + (-row.offsetTop) + 'px,0)';
var sc = row.querySelector('.ffscroll');
var x = cards[c].offsetLeft - cards[0].offsetLeft;
var maxX = Math.max(0, sc.scrollWidth - tv.view.clientWidth);
sc.style.transform = 'translate3d(' + (-Math.min(maxX + 40, Math.max(0, x - (c > 0 ? cards[0].offsetWidth * 0.5 : 0)))) + 'px,0,0)';
try { cards[c].focus({ preventScroll: true }); } catch (e) { cards[c].focus(); }
for (var k = tv.r - 1; k <= tv.r + 2; k++) if (tv.rows[k]) loadRow(tv.rows[k], k === tv.r ? c : 0);
heroSoon(cards[c]._item);
}
document.addEventListener('focusin', function (e) {
if (!tv || !tv.home.contains(e.target)) return;
var t = e.target;
if (t.classList.contains('ffbtn')) { tv.r = -1; tv.hb = t.classList.contains('ffmore') ? 1 : 0; tv.track.style.transform = 'translate3d(0,0,0)'; }
else if (t.classList.contains('ffcard')) {
var row = t.parentNode.parentNode, i = tv.rows.indexOf(row);
if (i >= 0 && (tv.r !== i || tv.rows[i].querySelectorAll('.ffcard')[tv.c[i]] !== t)) {
tv.r = i; tv.c[i] = Array.prototype.indexOf.call(row.querySelectorAll('.ffcard'), t); tvFocus();
}
}
}, true);
document.addEventListener('keydown', function (e) {
if (!tv || !document.body.contains(tv.home) || !tv.home.contains(document.activeElement)) return;
var k = e.keyCode;
if (k === 40) { if (tv.r < tv.rows.length - 1) tv.r++; }
else if (k === 38) { if (tv.r >= 0) tv.r--; else return; }
else if (k === 39) { if (tv.r < 0) { if (tv.hb < 1) tv.hb++; } else tv.c[tv.r]++; }
else if (k === 37) { if (tv.r < 0) { if (tv.hb > 0) tv.hb--; } else if (tv.c[tv.r] > 0) tv.c[tv.r]--; }
else if (k === 10009 || k === 27 || k === 8 || k === 461) { if (tv.r >= 0) tv.r = -1; else return; }
else return;
e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
tvFocus();
}, true);
var building = false;
function build(page) {
if (building || page.querySelector('#ffHome')) return;
building = true; addCss();
var M = mode();
page.classList.add('ff-active');
var home = document.createElement('div'); home.id = 'ffHome'; home.className = 'ff-' + M;
home.innerHTML = '<div id="ffHero"><div class="ffbg"></div><div class="ffshade"></div><div class="ffinfo"><div class="ffhead"></div><div class="ffmeta"></div><div class="ffov"></div><div class="ffbtns"><button class="ffbtn ffplay"></button><button class="ffbtn ffmore"></button></div></div></div>';
var anchor = page.querySelector('.homeSectionsContainer') || page.firstElementChild;
if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(home, anchor); else page.appendChild(home);
home.querySelector('.ffplay').textContent = t('play'); home.querySelector('.ffmore').textContent = t('info');
home.querySelector('.ffplay').addEventListener('click', function () { if (heroItem) playItem(heroItem); });
home.querySelector('.ffmore').addEventListener('click', function () { if (heroItem) openDetails(heroItem); });
if (M === 'tv') tvSetup(home); else tv = null;
var hero = home.querySelector('#ffHero');
hero.addEventListener('mouseenter', function () { heroHover = true; });
hero.addEventListener('mouseleave', function () { heroHover = false; });
Promise.all([
(CONFIG.spotlightCollectionId ? get('Items', q({ ParentId: CONFIG.spotlightCollectionId })) : get('Items', q({ IncludeItemTypes: 'Movie,Series', Recursive: true, SortBy: 'CommunityRating', SortOrder: 'Descending', Limit: 20 }))),
get('Users/' + uid() + '/Items/Resume', q({ Limit: 16, MediaTypes: 'Video' })),
get('Shows/NextUp', q({ Limit: 16 })),
get('Users/' + uid() + '/Views'),
get('Items', q({ IncludeItemTypes: 'BoxSet', Recursive: true, SortBy: 'Random', Limit: 20 })),
buildProfile().catch(function () {})
]).then(function (r) {
var spot = items(r[0]), resume = items(r[1]), next = items(r[2]);
var weiter = resume.concat(next.filter(function (n) { return !resume.some(function (x) { return x.SeriesId && x.SeriesId === n.SeriesId; }); }));
var weiterClean = clean(weiter);
heroItems = weiterClean.slice(0, 2).map(function (i) { return { i: i, t: t('cont') }; })
.concat(shuffle(spot.slice()).map(function (i) { return { i: i, t: t('tip') }; }));
if (heroItems.length) showHero(heroItems[0].i, heroItems[0].t);
rotateHero();
row(home, t('cont'), weiter, 'land', M);
var cats = items(r[3]).filter(function (v) { return !PRIVAT_VIEWS.some(function (p) { return v.Name.indexOf(p) === 0; }); }).map(function (v) { var o = {}; for (var k in v) o[k] = v[k]; try { o._route = window.Emby && Emby.Page && Emby.Page.getRouteUrl ? Emby.Page.getRouteUrl(v) : null; } catch (e) {} if (!o._route) o._route = '#/list?parentId=' + v.Id; return o; });
row(home, t('media'), cats, 'land', M);
row(home, t('top'), spot.slice(0, 10), 'big', M, true);
if (M === 'tv' && tv && !home.contains(document.activeElement)) { tv.r = -1; tvFocus(); }
var views = items(r[3]).filter(function (v) {
return !PRIVAT_VIEWS.some(function (p) { return v.Name.indexOf(p) === 0; }) && v.CollectionType !== 'playlists' && v.CollectionType !== 'boxsets';
});
var g1 = topGenres[0], g2 = topGenres[1];
var chain = Promise.resolve();
if (g1) chain = chain.then(function () {
return get('Items', q({ Recursive: true, Genres: g1, Filters: 'IsUnplayed', IncludeItemTypes: 'Movie,Series', SortBy: 'Random', Limit: 24 }))
.then(function (x) { row(home, t('because', { g: g1 }), clean(items(x)).slice(0, 18), 'land', M); });
});
chain = chain.then(function () { row(home, t('themes'), items(r[4]), 'land', M); });
chain = chain.then(function () {
return get('Items', q({ IncludeItemTypes: 'Movie,Series', Recursive: true, SortBy: 'DateCreated', SortOrder: 'Descending', Limit: 30 }))
.then(function (x) { row(home, t('newOn'), clean(items(x)).slice(0, 20), 'land', M); });
});
if (g2) chain = chain.then(function () {
return get('Items', q({ Recursive: true, Genres: g2, Filters: 'IsUnplayed', IncludeItemTypes: 'Movie,Series', SortBy: 'Random', Limit: 24 }))
.then(function (x) { row(home, t('more', { g: g2 }), clean(items(x)).slice(0, 18), 'big', M); });
});
views.forEach(function (v, i) {
chain = chain.then(function () {
return get('Items', q({ ParentId: v.Id, Recursive: true, IncludeItemTypes: 'Movie,Series,Video,MusicVideo', SortBy: 'Random', Limit: 18 }))
.then(function (x) { var rt = null; try { rt = Emby.Page.getRouteUrl(v); } catch (e) {} row(home, v.Name, items(x), i % 3 === 1 ? 'big' : 'land', M, false, { n: x.TotalRecordCount, route: rt || ('#/list?parentId=' + v.Id), item: v }); });
});
});
chain = chain.then(function () {
return get('Items', q({ Recursive: true, Filters: 'IsPlayed', IncludeItemTypes: 'Movie', SortBy: 'Random', Limit: 20 }))
.then(function (x) { row(home, t('again'), clean(items(x)).slice(0, 14), 'land', M); });
});
return chain;
}).catch(function (e) { console.error('tv-home', e); })
.then(function () { building = false; });
}
function check() {
var on = !off() && !!document.querySelector('.homePage:not(.hide) #ffHome') && (location.hash || '#/home').indexOf('#/home') === 0;
document.documentElement.classList.toggle('ff-home-on', on);
if (off() || !window.ApiClient || !api().getCurrentUserId || !api().getCurrentUserId()) return;
var page = document.querySelector('.homePage:not(.hide)');
if (page && (location.hash || '#/home').indexOf('#/home') === 0) build(page);
}
document.addEventListener('viewshow', function () { setTimeout(check, 50); });
window.addEventListener('hashchange', function () { setTimeout(check, 300); });
setInterval(check, 1500);
})();