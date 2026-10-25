(function () {
  var D = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '966501264631';

  /* ---------- Riyadh time and opening hours ---------- */
  var OPEN = [360, 360, 360, 360, 360, 420, 420];     // Sun..Sat, minutes
  var CLOSE = [1440, 1440, 1440, 1440, 1560, 1560, 1440]; // Thu and Fri close at 2 AM next day
  function riyadh() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', hourCycle: 'h23', weekday: 'short', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
  }
  function state() {
    var t = riyadh(), mins = t.h * 60 + t.m, d = t.day, prev = (d + 6) % 7;
    var close = null, open = false;
    if (mins >= OPEN[d] && mins < CLOSE[d]) { open = true; close = CLOSE[d]; }
    else if (CLOSE[prev] > 1440 && mins < CLOSE[prev] - 1440) { open = true; close = CLOSE[prev] - 1440 + 1440; }
    var nextOpen = mins < OPEN[d] ? OPEN[d] : OPEN[(d + 1) % 7];
    return { open: open, close: close ? close % 1440 : 0, nextOpen: nextOpen, h: t.h, day: d };
  }
  function status() {
    var s = state(), ar, en;
    var morning = s.h >= 4 && s.h < 12;
    var gAr = morning ? 'صباح الخير' : 'مساء الخير';
    var gEn = morning ? 'Good morning' : (s.h >= 12 && s.h < 17 ? 'Good afternoon' : 'Good evening');
    if (s.open) {
      var cAr = s.close === 0 ? '12 منتصف الليل' : (s.close / 60) + ' بعد منتصف الليل';
      var cEn = s.close === 0 ? 'midnight' : (s.close / 60) + ' AM';
      ar = gAr + '، مفتوح حتى ' + cAr; en = gEn + ', open until ' + cEn;
    } else {
      var hr = s.nextOpen / 60;
      ar = gAr + '، نفتح ' + hr + ' صباحًا'; en = gEn + ', opens at ' + hr + ' AM';
    }
    D.classList.toggle('closed', !s.open);
    $$('[data-status]').forEach(function (el) {
      var a = $('[data-l=ar]', el), e = $('[data-l=en]', el);
      if (a) a.textContent = ar; if (e) e.textContent = en;
    });
    var key = ['sun-wed', 'sun-wed', 'sun-wed', 'sun-wed', 'thu', 'fri', 'sat'][s.day];
    $$('[data-hrow]').forEach(function (li) { li.classList.toggle('today', li.getAttribute('data-hrow') === key); });
    return s;
  }

  /* ---------- language ---------- */
  var toggle = $('#lang');
  function apply() {
    var l = D.lang;
    $$('[data-alt-ar]').forEach(function (i) { i.alt = i.getAttribute('data-alt-' + l) || ''; });
    var b = document.body;
    if (b.dataset['title' + (l === 'ar' ? 'Ar' : 'En')]) document.title = b.dataset['title' + (l === 'ar' ? 'Ar' : 'En')];
    var md = $('meta[name=description]');
    if (md && b.dataset['desc' + (l === 'ar' ? 'Ar' : 'En')]) md.content = b.dataset['desc' + (l === 'ar' ? 'Ar' : 'En')];
    if (toggle) toggle.setAttribute('aria-label', l === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    var lbm = $('#msg'); if (lbm) lbm.setAttribute('dir', 'auto');
    var back = $$('[data-aria-ar]');
    back.forEach(function (e) { e.setAttribute('aria-label', e.getAttribute('data-aria-' + l)); });
  }
  if (toggle) toggle.addEventListener('click', function () {
    var l = D.lang === 'ar' ? 'en' : 'ar';
    D.lang = l; D.dir = l === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('andarena-lang', l); } catch (e) {}
    apply(); status(); if (window.__lbRefresh) window.__lbRefresh();
  });

  /* ---------- header over hero ---------- */
  var hdr = $('.hdr'), hero = $('.hero');
  if (hdr && hero && 'IntersectionObserver' in window) {
    hdr.classList.add('on-hero');
    new IntersectionObserver(function (en) { hdr.classList.toggle('on-hero', en[0].isIntersecting); }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
  }

  /* ---------- intro: end of the lamp sequence ---------- */
  if (D.classList.contains('intro')) setTimeout(function () { D.classList.remove('intro'); }, 1300);

  /* ---------- menu chips ---------- */
  var chips = $$('.chip[data-cat]');
  if (chips.length) {
    var strip = $('.chips .scroll');
    var setOn = function (id) {
      chips.forEach(function (c) {
        var on = c.dataset.cat === id;
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
        if (on && strip) {
          var cr = c.getBoundingClientRect(), sr = strip.getBoundingClientRect();
          var delta = (cr.left + cr.width / 2) - (sr.left + sr.width / 2);
          if (Math.abs(delta) > 4) strip.scrollBy({ left: delta, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.preventDefault();
        var sec = document.getElementById(c.dataset.cat);
        if (sec) { sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); try { history.replaceState(null, '', '#' + c.dataset.cat); } catch (x) {} }
        setOn(c.dataset.cat);
      });
    });
    var secs = $$('.cat');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) setOn(e.target.id); });
      }, { rootMargin: '-140px 0px -65% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- menu: tap a description to read all of it ---------- */
  var dscs = $$('.card .dsc');
  if (dscs.length) {
    var fit = function () {
      dscs.forEach(function (b) {
        var open = b.getAttribute('aria-expanded') === 'true';
        if (open) return;
        var ok = b.scrollWidth <= b.clientWidth + 1;
        if (ok) { b.setAttribute('data-fit', ''); b.tabIndex = -1; } else { b.removeAttribute('data-fit'); b.removeAttribute('tabindex'); }
      });
    };
    dscs.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.hasAttribute('data-fit')) return;
        b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
        fit();
      });
    });
    fit(); window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (toggle) toggle.addEventListener('click', function () { setTimeout(fit, 0); });
  }

  /* ---------- lunch box form ---------- */
  var form = $('#lbform');
  if (form) {
    var msg = $('#msg'), err = $('#msg-err'), cnt = $('#cnt'), qty = $('#qty'), qn = $('#qn');
    var n = 1;
    var occTxt = { ar: { success: 'نجاح', congrats: 'تهنئة', surprise: 'مفاجأة بسيطة', birthday: 'عيد ميلاد' }, en: { success: 'Success', congrats: 'Congratulations', surprise: 'A small surprise', birthday: 'Birthday' } };
    var tomorrow = function () {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 864e5));
      return p;
    };
    var dateEl = $('#pickup'); if (dateEl) dateEl.min = tomorrow();
    window.__lbRefresh = function () { cnt.textContent = msg.value.length + '/30'; };
    msg.addEventListener('input', function () { window.__lbRefresh(); if (msg.value.trim()) { err.hidden = true; msg.removeAttribute('aria-invalid'); } });
    window.__lbRefresh();
    $$('input[name=kind]').forEach(function (r) { r.addEventListener('change', function () { qty.hidden = $('input[name=kind]:checked').value !== 'mini'; }); });
    var dec = $('#qdec'), inc = $('#qinc');
    dec.addEventListener('click', function () { n = Math.max(1, n - 1); qn.textContent = n; });
    inc.addEventListener('click', function () { n = Math.min(20, n + 1); qn.textContent = n; });
    var lastOcc = null;
    $$('input[name=occ]').forEach(function (r) {
      r.addEventListener('click', function () { if (lastOcc === r) { r.checked = false; lastOcc = null; } else lastOcc = r; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = msg.value.trim();
      if (!m) { err.hidden = false; msg.setAttribute('aria-invalid', 'true'); msg.focus(); return; }
      var l = D.lang, mini = $('input[name=kind]:checked').value === 'mini';
      var occ = $('input[name=occ]:checked'), date = dateEl.value, name = $('#cname').value.trim();
      var t;
      if (l === 'ar') {
        t = 'السلام عليكم، أود طلب ' + (mini ? n + ' ميني لانش بوكس' : 'لانش بوكس') + '. العبارة: «' + m + '».';
        if (occ) t += ' المناسبة: ' + occTxt.ar[occ.value] + '.';
        if (date) t += ' يوم الاستلام: ' + date + '.';
        if (name) t += ' الاسم: ' + name + '.';
      } else {
        t = "Hello, I'd like to order " + (mini ? n + ' Mini Lunch Box' : 'a Lunch Box') + '. Message: "' + m + '".';
        if (occ) t += ' Occasion: ' + occTxt.en[occ.value] + '.';
        if (date) t += ' Pickup day: ' + date + '.';
        if (name) t += ' Name: ' + name + '.';
      }
      var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
      form.dataset.lastUrl = url;
      window.open(url, '_blank', 'noopener');
    });
    var wb = $('#bar-wa'); if (wb) wb.addEventListener('click', function () { form.requestSubmit(); });
  }

  apply(); status();
  setInterval(status, 60000);
})();
