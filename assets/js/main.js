/* Ovoko BE landing — vanilla JS, no dependencies */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia(q).matches; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');

  /* 1 · UTM / click-id pass-through to every ovoko.be link */
  var keep = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var params = new URLSearchParams(location.search);
  var carry = new URLSearchParams();
  keep.forEach(function (k) { if (params.get(k)) carry.set(k, params.get(k)); });
  if (!carry.has('utm_source')) { carry.set('utm_source', 'landing'); carry.set('utm_medium', 'lp_be_fr'); }
  document.querySelectorAll('a[href^="https://ovoko.be"]').forEach(function (a) {
    try {
      var u = new URL(a.href);
      carry.forEach(function (v, k) { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
      a.href = u.toString();
    } catch (e) {}
  });

  /* 2 · Click-out tracking (the conversion). Works with Meta Pixel and/or GTM when present. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.js-cta');
    if (!a) return;
    var label = a.getAttribute('data-cta') || 'cta';
    try { if (window.fbq) window.fbq('trackCustom', 'OutboundClick', { cta: label }); } catch (err) {}
    try { (window.dataLayer = window.dataLayer || []).push({ event: 'outbound_click', cta: label, hero: document.documentElement.getAttribute('data-hero') }); } catch (err) {}
  });

  /* 3 · Reviews: clone cards into the three desktop columns */
  document.querySelectorAll('[data-fill]').forEach(function (col) {
    col.getAttribute('data-fill').split(' ').forEach(function (name) {
      var src = document.querySelector('[data-review="' + name + '"]');
      if (src) { var c = src.cloneNode(true); c.removeAttribute('data-review'); col.insertBefore(c, col.querySelector('.stories__photo')); }
    });
  });

  /* 4 · Looping sliders. Any row that scrolls sideways (carousels, mobile sliders) loops endlessly:
         one set of clones before and after the real items; when a scroll settles inside a clone set
         we jump by exactly one set width, which lands on an identical frame, so the jump is invisible. */
  function loopSlider(track, ui) {
    ui = ui || {};
    var originals = Array.prototype.slice.call(track.children).filter(function (c) { return !c.classList.contains('is-clone'); });
    var N = originals.length;
    if (N < 2) return;
    var before = [], after = [], all = originals, on = false, settleT = 0;
    var dots = [];
    if (ui.dotsWrap) {
      dots = originals.map(function (_, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', (k + 1) + ' / ' + N);
        b.addEventListener('click', function () { goReal(k); });
        ui.dotsWrap.appendChild(b); return b;
      });
    }
    function clone(el) {
      var c = el.cloneNode(true);
      c.classList.add('loop-clone'); c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('data-review'); c.removeAttribute('id');
      c.querySelectorAll('a, button, [tabindex]').forEach(function (x) { x.tabIndex = -1; });
      if (c.matches('a, button')) c.tabIndex = -1;
      return c;
    }
    function scrollable() {
      var cs = getComputedStyle(track);
      return cs.display !== 'none' && cs.display !== 'contents' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && track.scrollWidth > track.clientWidth + 4;
    }
    function target(el) {
      var tr = track.getBoundingClientRect(), r = el.getBoundingClientRect();
      var left = track.scrollLeft + (r.left - tr.left);
      var align = getComputedStyle(el).scrollSnapAlign || '';
      if (align.indexOf('center') > -1) return left + r.width / 2 - track.clientWidth / 2;
      var sp = parseFloat(getComputedStyle(track).scrollPaddingLeft); if (isNaN(sp)) sp = 0;
      return left - sp;
    }
    function nearest() {
      var best = 0, bestD = Infinity, x = track.scrollLeft;
      all.forEach(function (el, k) { var d = Math.abs(target(el) - x); if (d < bestD) { bestD = d; best = k; } });
      return best;
    }
    function jump(x) {
      track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto';
      track.scrollLeft = x;
      requestAnimationFrame(function () { track.style.scrollSnapType = ''; track.style.scrollBehavior = ''; });
    }
    function settle() {
      if (!on) return sync();
      var k = nearest(), setW = originals[0].offsetLeft - before[0].offsetLeft;
      if (k < N) jump(track.scrollLeft + setW);
      else if (k >= 2 * N) jump(track.scrollLeft - setW);
      sync();
    }
    function realIndex() { return on ? nearest() % N : (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 ? N - 1 : nearest()); }
    function sync() {
      var i = realIndex();
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (ui.nums) ui.nums.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
      if (ui.dotsWrap) ui.dotsWrap.classList.toggle('is-on', on || scrollable());
      if (!on && ui.prev) { ui.prev.disabled = i === 0; ui.next.disabled = i === N - 1; }
    }
    function goTo(el) { track.scrollTo({ left: target(el), behavior: reduceMotion ? 'auto' : 'smooth' }); }
    function step(d) {
      var k = nearest() + d;
      if (!on) k = Math.max(0, Math.min(N - 1, k));
      goTo(all[k]);
    }
    function goReal(k) { var cur = nearest(); goTo(all[on ? cur + (k - cur % N) : k]); }
    function enable(startAt) {
      if (on || !scrollable()) return sync();
      originals.forEach(function (o) { var c = clone(o); track.appendChild(c); after.push(c); });
      for (var k = N - 1; k >= 0; k--) { var c = clone(originals[k]); track.insertBefore(c, track.firstChild); before.unshift(c); }
      all = before.concat(originals, after); on = true;
      if (ui.prev) { ui.prev.disabled = false; ui.next.disabled = false; }
      jump(target(originals[startAt || 0]));
      sync();
    }
    function disable() {
      if (!on) return 0;
      var k = nearest() % N;
      before.concat(after).forEach(function (c) { c.remove(); });
      before = []; after = []; all = originals; on = false;
      jump(0); jump(target(originals[k]));
      return k;
    }
    if (ui.prev) ui.prev.addEventListener('click', function () { step(-1); });
    if (ui.next) ui.next.addEventListener('click', function () { step(1); });
    if ('onscrollend' in window) track.addEventListener('scrollend', settle);
    track.addEventListener('scroll', function () { clearTimeout(settleT); settleT = setTimeout(settle, 160); sync(); }, { passive: true });
    // re-measure only when the width changes (mobile browsers fire resize when the address bar hides)
    var rt, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(rt); rt = setTimeout(function () { enable(disable()); }, 200);
    });
    enable();
  }
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    loopSlider(root.querySelector('.carousel__track'), {
      prev: root.querySelector('[data-prev]'), next: root.querySelector('[data-next]'),
      nums: Array.prototype.slice.call(root.querySelectorAll('.pager__nums span')),
      dotsWrap: root.querySelector('.dots')
    });
  });
  document.querySelectorAll('[data-mslider], [data-mdots]').forEach(function (track) {
    var wrap = document.createElement('div'); wrap.className = 'mdots';
    track.parentNode.insertBefore(wrap, track.nextSibling);
    loopSlider(track, { dotsWrap: wrap });
  });

  /* 5 · Hero B parts slider: 5 s auto-advance, chips switch slides.
         The new slide fades in over the old one (which stays fully visible underneath), so there is no dip. */
  document.querySelectorAll('[data-slider]').forEach(function (root) {
    var slides = root.querySelectorAll('.slide');
    var chips = root.querySelectorAll('.chip');
    var bar = root.querySelector('.progress i');
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 5000;
    var i = 0, timer = null, prevT = null;
    slides.forEach(function (s) { var im = s.querySelector('img'); if (im) { im.loading = 'eager'; if (im.decode) im.decode().catch(function () {}); } });
    function show(n, instant) {
      var old = i;
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-prev', !instant && k === old && old !== i);
        s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); s.tabIndex = k === i ? 0 : -1;
      });
      clearTimeout(prevT);
      prevT = setTimeout(function () { slides.forEach(function (s) { s.classList.remove('is-prev'); }); }, 950);
      chips.forEach(function (c, k) { c.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (bar) bar.style.transform = 'translate3d(' + (i * 100) + '%,0,0)';
    }
    function play() { stop(); if (!reduceMotion) timer = setInterval(function () { show(i + 1); }, interval); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    chips.forEach(function (c, k) { c.addEventListener('click', function () { if (k !== i) show(k); play(); }); });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    show(0, true);
    if (document.documentElement.getAttribute('data-hero') === 'b') play();
    document.addEventListener('ovoko:hero', function () { if (document.documentElement.getAttribute('data-hero') === 'b') { show(0, true); play(); } else stop(); });
  });

  /* 6 · Exact-part marquee: duplicate each row so the loop is seamless (desktop) */
  document.querySelectorAll('[data-marquee]').forEach(function (row) {
    Array.prototype.slice.call(row.children).forEach(function (c) {
      var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.tabIndex = -1; d.classList.add('is-clone'); row.appendChild(d);
    });
  });
  var style = document.createElement('style');
  style.textContent = '@media (max-width:1199px){.lcard.is-clone{display:none}}';
  document.head.appendChild(style);

  /* 7 · Partner video: click to play (no autoplay in in-app browsers), sound toggle */
  document.querySelectorAll('[data-video]').forEach(function (box) {
    var v = box.querySelector('video');
    var play = box.querySelector('.video__play');
    var sound = box.querySelector('.video__sound');
    play.addEventListener('click', function () {
      v.muted = false; box.classList.remove('is-muted');
      sound.setAttribute('aria-label', 'Couper le son');
      var p = v.play();
      box.classList.add('is-playing');
      if (p && p.catch) p.catch(function () { v.muted = true; box.classList.add('is-muted'); v.play(); });
    });
    v.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
    sound.addEventListener('click', function () {
      v.muted = !v.muted; box.classList.toggle('is-muted', v.muted);
      sound.setAttribute('aria-label', v.muted ? 'Activer le son' : 'Couper le son');
    });
  });

  /* 8 · FAQ accordion */
  document.querySelectorAll('[data-faq] .faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement, open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* 9 · Simple disclosure toggles */
  document.querySelectorAll('.js-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('aria-controls'));
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (el) el.hidden = !open;
    });
  });

  /* 10 · Sticky CTA (mobile + tablet): after the hero, hidden while the final CTA is on screen */
  var sticky = document.querySelector('[data-sticky]');
  if (sticky && 'IntersectionObserver' in window) {
    var heroVisible = true, finalVisible = false;
    var update = function () {
      var on = !heroVisible && !finalVisible;
      sticky.classList.toggle('is-visible', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      var link = sticky.querySelector('a'); if (link) link.tabIndex = on ? 0 : -1;
    };
    var heroes = document.querySelectorAll('.hero-a, .hero-a-s, .hero-b');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target.id === 'final') finalVisible = en.isIntersecting;
        else if (getComputedStyle(en.target).display !== 'none') heroVisible = en.isIntersecting;
      });
      update();
    }, { rootMargin: '0px 0px -40% 0px' });
    heroes.forEach(function (h) { io.observe(h); });
    var fin = document.getElementById('final'); if (fin) io.observe(fin);
  }

  /* 11 · Floating cards and photos follow the pointer a little (desktop, fine pointers only).
         Eased every frame (lerp), so the motion stays smooth however jumpy the mouse events are. */
  if (!reduceMotion && mq('(hover: hover) and (pointer: fine)')) {
    document.querySelectorAll('[data-parallax]').forEach(function (zone) {
      var tx = 0, ty = 0, x = 0, y = 0, running = false;
      function frame() {
        x += (tx - x) * 0.08; y += (ty - y) * 0.08;
        zone.style.setProperty('--mx', x.toFixed(4)); zone.style.setProperty('--my', y.toFixed(4));
        if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) requestAnimationFrame(frame); else running = false;
      }
      function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
      zone.addEventListener('pointermove', function (e) {
        var r = zone.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width) * 2 - 1; ty = ((e.clientY - r.top) / r.height) * 2 - 1; kick();
      });
      zone.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
    });
  }

  /* 12 · Numbers count up, bars grow, stat boxes rise when their block scrolls into view */
  var fmtCache = {};
  function countUp(el, dur) {
    var orig = el.getAttribute('data-orig') || el.textContent;
    el.setAttribute('data-orig', orig);
    var m = orig.match(/\d[\d\u00a0\u202f ]*(?:,\d+)?/);
    if (!m) return;
    var raw = m[0].replace(/[\s\u00a0\u202f]+$/, '');
    var dec = (raw.split(',')[1] || '').length;
    var val = parseFloat(raw.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
    var pre = orig.slice(0, m.index), post = orig.slice(m.index + raw.length);
    var fmt = fmtCache[dec] || (fmtCache[dec] = new Intl.NumberFormat('fr-BE', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
    var t0 = performance.now();
    el.classList.add('is-counting');
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? pre + fmt.format(val * e).replace(/[\u202f ]/g, '\u00a0') + post : orig;
      if (p < 1) requestAnimationFrame(step); else el.classList.remove('is-counting');
    })(t0);
  }
  var groups = document.querySelectorAll('[data-reveal]');
  if (groups.length && !reduceMotion && 'IntersectionObserver' in window) {
    var play = function (g) {
      g.classList.remove('rv-wait'); g.classList.add('rv-in');
      g.querySelectorAll('.num, .s-save b, .s-cmp__save').forEach(function (n, k) { setTimeout(function () { countUp(n, 1300); }, k * 120); });
    };
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { rio.unobserve(en.target); play(en.target); } });
    }, { threshold: 0.3 });
    groups.forEach(function (g) {
      if (getComputedStyle(g).display === 'none' || g.closest('[hidden]')) return;
      g.classList.add('rv-wait');
      rio.observe(g);
    });
  }
})();
