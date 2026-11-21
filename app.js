'use strict';

// 夢の文章・画像は既存の20件をそのまま引き継ぐ。
// 次の開発でデータを編集可能にするまでは、この配列が初期データ。
const dreams = [{"id":1,"cat":"自由","text":"時間・お金・場所に縛られず、大切な人と好きなことを選べる人生を送る","img":"images/dream-01.jpg"},{"id":2,"cat":"自由","text":"朝起きて「今日は何をしよう」とワクワクできる毎日を送る","img":"images/dream-02.jpg"},{"id":3,"cat":"NP","text":"ナチュラリープラスでCFCタイトルを達成し、月収240万円を実現する","img":"images/dream-03.jpg"},{"id":4,"cat":"収入","text":"年収1億円を達成する","img":"images/dream-04.jpg"},{"id":5,"cat":"自由","text":"仕事は週2〜3日、1日2〜3時間程度にして、働く時間を自分で決める","img":"images/dream-05.jpg"},{"id":6,"cat":"NP","text":"ナチュラリープラス一本で生活しながら、仕事というより楽しみや趣味のような感覚で続ける","img":"images/dream-06.jpg"},{"id":7,"cat":"大切な人","text":"家族・恋人・友人との時間を最優先し、大切な日にはいつでも一緒に過ごせる生活をする","img":"images/dream-07.jpg"},{"id":8,"cat":"大切な人","text":"家族に毎月十分な仕送りをし、お金の心配をさせず、旅行や食事など様々な経験をプレゼントできるようになる","img":"images/dream-08.jpg"},{"id":9,"cat":"体験","text":"パートナーと世界中のディズニーパークを巡り、制覇する","img":"images/dream-09.jpg"},{"id":10,"cat":"体験","text":"思い立ったときにオーロラを見に行ける生活をする","img":"images/dream-10.jpg"},{"id":11,"cat":"仲間","text":"仲間とUSJを貸し切って思いきり遊ぶ","img":"images/dream-11.jpg"},{"id":12,"cat":"人生","text":"収入・仲間・時間・健康が満たされた人生を送る","img":"images/dream-12.jpg"},{"id":13,"cat":"人生","text":"「自分はこのために生まれてきた」と思える仕事と生き方を見つける","img":"images/dream-13.jpg"},{"id":14,"cat":"健康","text":"スノーボードなどアクティブな遊びを、年齢を気にせず楽しみ続ける","img":"images/dream-14.jpg"},{"id":15,"cat":"仲間","text":"ナチュラリープラスで、人生を豊かにする仲間が集まるコミュニティをつくる","img":"images/dream-15.jpg"},{"id":16,"cat":"NP","text":"ナチュラリープラスで、仲間が収入を得られるよう支えられる人になる","img":"images/dream-16.jpg"},{"id":17,"cat":"人生","text":"誰かの人生に良い影響を与え、夢を叶えるきっかけや支えになれる人になる","img":"images/dream-17.jpg"},{"id":18,"cat":"人生","text":"年齢を重ねても自分らしく生き、若い世代から尊敬されるお手本のような存在になる","img":"images/dream-18.jpg"},{"id":19,"cat":"健康","text":"生涯健康で、自分の足で動き、好きなことを楽しめる身体を保つ","img":"images/dream-19.jpg"},{"id":20,"cat":"人生","text":"人生の最後に、多くの人から「出会えてよかった」と思ってもらえる生き方をする","img":"images/dream-20.jpg"}];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const KEYS = Object.freeze({ today: 'ryoTodayDreamId', favorites: 'ryoFavsV2', legacyFavorites: 'ryoFavs' });
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
};
const hasId = (id) => dreams.some((dream) => dream.id === id);
const indexOfId = (id) => dreams.findIndex((dream) => dream.id === id);

function restoreFavorites() {
  const saved = store.get(KEYS.favorites);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set(parsed.map(Number).filter(hasId));
    } catch { /* 保存が壊れていた場合も起動を継続 */ }
  }
  // 旧版は0始まりの配列位置で保存していたため、夢のIDに移行する。
  try {
    const old = JSON.parse(store.get(KEYS.legacyFavorites) || '[]');
    if (Array.isArray(old)) {
      const migrated = new Set(old.filter((n) => Number.isInteger(n) && n >= 0 && n < dreams.length).map((n) => dreams[n].id));
      store.set(KEYS.favorites, JSON.stringify([...migrated]));
      return migrated;
    }
  } catch { /* 初期状態に戻す */ }
  return new Set();
}

let todayId = Number(store.get(KEYS.today));
if (!hasId(todayId)) todayId = dreams[0].id;
let focusIndex = indexOfId(todayId);
let activeTab = 'today';
let activeFilter = 'all';
let swipeStartX = null;
let lastSwipedAt = 0;
let lightboxReturnFocus = null;
const favorites = restoreFavorites();

function announce(message) {
  const target = $('#announcement');
  target.textContent = '';
  requestAnimationFrame(() => { target.textContent = message; });
}

function setFavoriteState(button, id) {
  const active = favorites.has(id);
  button.textContent = active ? '★' : '☆';
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? 'お気に入りから外す' : 'お気に入りに登録');
}
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  store.set(KEYS.favorites, JSON.stringify([...favorites]));
  renderFocus();
  renderFilters();
  renderGrid();
  announce(favorites.has(id) ? 'お気に入りに追加しました' : 'お気に入りから外しました');
}

function renderFocus() {
  const dream = dreams[focusIndex];
  const photo = $('#focusImg');
  if (photo.getAttribute('src') !== './' + dream.img) {
    photo.setAttribute('src', './' + dream.img);
  }
  photo.alt = dream.text + ' のイメージ';
  $('#focusCategory').textContent = dream.cat;
  $('#focusCount').innerHTML = String(dream.id).padStart(2, '0') + ' <span>/ ' + dreams.length + '</span>';
  $('#focusText').textContent = dream.text;
  setFavoriteState($('#focusFavorite'), dream.id);

  const isToday = dream.id === todayId;
  $('#focusStatus').lastElementChild.textContent = isToday ? '今日の夢に選択中' : '気に入ったら今日の夢に';
  const chooseButton = $('#selectToday');
  chooseButton.disabled = isToday;
  chooseButton.textContent = isToday ? '選択中 ✓' : '今日の夢にする';

  const dots = $('#focusDots');
  dots.replaceChildren();
  dreams.forEach((item, i) => {
    const dot = document.createElement('span');
    dot.className = 'page-dot' + (i === focusIndex ? ' is-active' : '');
    dot.setAttribute('aria-hidden', 'true');
    dots.appendChild(dot);
  });
  dots.setAttribute('aria-label', (focusIndex + 1) + ' / ' + dreams.length + ' 番目の夢');
}
function stepDream(delta) {
  focusIndex = (focusIndex + delta + dreams.length) % dreams.length;
  renderFocus();
}
function chooseToday(id) {
  if (!hasId(id)) return;
  todayId = id;
  focusIndex = indexOfId(id);
  store.set(KEYS.today, String(id));
  renderFocus();
  renderGrid();
  showTab('today');
  announce('今日の夢に設定しました');
}
function showTab(tab) {
  if (!['today', 'list', 'board'].includes(tab)) return;
  activeTab = tab;
  if (tab === 'today') {
    focusIndex = indexOfId(todayId);
    renderFocus();
  }
  $$('.page').forEach((page) => {
    const active = page.id === 'page-' + tab;
    page.hidden = !active;
    page.classList.toggle('is-active', active);
  });
  $$('.tab').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderFilters() {
  const filters = $('#filters');
  filters.replaceChildren();
  const categories = [
    { key: 'all', label: 'すべて' },
    { key: 'favorites', label: '★ お気に入り' },
    ...[...new Set(dreams.map((dream) => dream.cat))].map((cat) => ({ key: cat, label: cat }))
  ];
  categories.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter' + (key === activeFilter ? ' is-active' : '');
    button.textContent = label;
    button.setAttribute('aria-pressed', String(key === activeFilter));
    button.addEventListener('click', () => {
      activeFilter = key;
      renderFilters();
      renderGrid();
    });
    filters.appendChild(button);
  });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function createDreamCard(dream) {
  const card = element('article', 'dream-card');
  const open = element('button', 'card-open');
  open.type = 'button';
  open.setAttribute('aria-label', dream.text + ' の画像を拡大');
  const img = element('img');
  img.src = './' + dream.img;
  img.alt = dream.text + ' のイメージ';
  img.loading = 'lazy';
  img.decoding = 'async';
  open.append(img, element('span', 'card-zoom', '⤢ 拡大'));
  open.addEventListener('click', () => openLightbox(dream.img, img.alt, open));
  card.appendChild(open);

  const body = element('div', 'card-body');
  const meta = element('div', 'card-meta');
  meta.append(element('span', 'card-number', String(dream.id).padStart(2, '0')), element('span', 'card-category', dream.cat));
  body.append(meta, element('p', 'card-text', dream.text));

  const actions = element('div', 'card-actions');
  const choose = element('button', 'card-select' + (dream.id === todayId ? ' is-current' : ''), dream.id === todayId ? '✦ 今日の夢 ✓' : '✦ 今日の夢にする');
  choose.type = 'button';
  choose.disabled = dream.id === todayId;
  choose.addEventListener('click', () => chooseToday(dream.id));
  const star = element('button', 'favorite card-fav');
  star.type = 'button';
  setFavoriteState(star, dream.id);
  star.addEventListener('click', () => toggleFavorite(dream.id));
  actions.append(choose, star);
  body.append(actions);
  card.appendChild(body);
  return card;
}
function renderGrid() {
  const grid = $('#dreamGrid');
  const visible = dreams.filter((dream) => {
    if (activeFilter === 'favorites') return favorites.has(dream.id);
    return activeFilter === 'all' || dream.cat === activeFilter;
  });
  grid.replaceChildren(...visible.map(createDreamCard));
  $('#emptyState').hidden = visible.length > 0;
  $('#emptyState').textContent = activeFilter === 'favorites'
    ? 'まだお気に入りがありません。気になる夢に ☆ をつけてみよう。'
    : 'このカテゴリーに夢はありません。';
}

function openLightbox(src, alt, trigger) {
  lightboxReturnFocus = trigger;
  $('#lightboxImg').src = './' + src.replace(/^\.\//, '');
  $('#lightboxImg').alt = alt;
  $('#lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#closeLightbox').focus();
}
function closeLightbox() {
  $('#lightbox').hidden = true;
  document.body.style.overflow = '';
  if (lightboxReturnFocus) lightboxReturnFocus.focus();
}

$$('.tab').forEach((button) => button.addEventListener('click', () => showTab(button.dataset.tab)));
$('#focusPrev').addEventListener('click', () => stepDream(-1));
$('#focusNext').addEventListener('click', () => stepDream(1));
$('#selectToday').addEventListener('click', () => chooseToday(dreams[focusIndex].id));
$('#focusFavorite').addEventListener('click', (event) => {
  event.stopPropagation();
  toggleFavorite(dreams[focusIndex].id);
});
$('#focusMedia').addEventListener('click', (event) => {
  if (event.target.closest('button') || Date.now() - lastSwipedAt < 350) return;
  const dream = dreams[focusIndex];
  openLightbox(dream.img, dream.text + ' のイメージ', $('#focusMedia'));
});
$('#focusMedia').addEventListener('touchstart', (event) => {
  swipeStartX = event.touches[0].clientX;
}, { passive: true });
$('#focusMedia').addEventListener('touchend', (event) => {
  if (swipeStartX === null) return;
  const dx = event.changedTouches[0].clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(dx) > 55) {
    lastSwipedAt = Date.now();
    stepDream(dx < 0 ? 1 : -1);
  }
}, { passive: true });
$('#focusMedia').addEventListener('touchcancel', () => { swipeStartX = null; });
$('#focusMedia').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const dream = dreams[focusIndex];
    openLightbox(dream.img, dream.text + ' のイメージ', $('#focusMedia'));
  }
});
$('#openBoard').addEventListener('click', () => openLightbox('images/vision-board.jpg', '20の夢をまとめたビジョンボード', $('#openBoard')));
$('#closeLightbox').addEventListener('click', closeLightbox);
$('#lightbox').addEventListener('click', (event) => { if (event.target.id === 'lightbox') closeLightbox(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#lightbox').hidden) { closeLightbox(); return; }
  if (!$('#lightbox').hidden || activeTab !== 'today') return;
  if (event.target.closest('button, input, textarea, select')) return;
  if (event.key === 'ArrowLeft') stepDream(-1);
  if (event.key === 'ArrowRight') stepDream(1);
});

renderFocus();
renderFilters();
renderGrid();
showTab('today');

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // オフライン設定に失敗しても、オンライン利用は継続する。
    });
  });
}
