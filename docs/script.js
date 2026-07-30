/* ============================================================
   Data Science in the Cold Chain — reader behavior
   Section routing, on-page contents, pager, search, theme.
   No dependencies. Without JS every section renders stacked.
   ============================================================ */
(function () {
  'use strict';

  var root  = document.documentElement;
  var body  = document.body;
  var docEl = document.getElementById('doc');
  var rail  = document.getElementById('rail');
  var tocEl = document.getElementById('toc');
  var pager = document.getElementById('pager');
  var input = document.getElementById('q');
  var results = document.getElementById('results');

  var sections = [].slice.call(docEl.querySelectorAll('.mdoc'));
  var railLinks = [].slice.call(rail.querySelectorAll('.mod'));

  var DOCS = sections.map(function (el, i) {
    return {
      id: el.id,
      n: String(i).padStart(2, '0'),
      title: el.getAttribute('data-title') || el.id,
      el: el,
      link: rail.querySelector('.mod[data-doc="' + el.id + '"]')
    };
  });
  var byId = {};
  DOCS.forEach(function (d) { byId[d.id] = d; });

  /* ---------------- theme ---------------- */
  var THEME_KEY = 'ds-guide-theme';
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) {}
  setTheme(savedTheme || (window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  document.getElementById('theme').addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------------- rail drawer (small screens) ---------------- */
  var railBtn = document.getElementById('railtoggle');
  function closeRail() {
    body.classList.remove('rail-open');
    railBtn.setAttribute('aria-expanded', 'false');
  }
  railBtn.addEventListener('click', function () {
    var open = body.classList.toggle('rail-open');
    railBtn.setAttribute('aria-expanded', String(open));
  });

  /* ---------------- on-page contents ---------------- */
  var spy = null;

  function buildTOC(doc) {
    var heads = [].slice.call(doc.el.querySelectorAll('h2[id],h3[id]'));
    if (spy) { spy.disconnect(); spy = null; }

    if (heads.length < 2) { tocEl.innerHTML = ''; return; }

    var html = '<h6>On this page</h6>';
    heads.forEach(function (h) {
      html += '<a href="#' + h.id + '" data-h="' + h.id + '"' +
              (h.tagName === 'H3' ? ' class="lvl3"' : '') + '>' +
              h.textContent + '</a>';
    });
    tocEl.innerHTML = html;

    var links = [].slice.call(tocEl.querySelectorAll('a'));
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('data-h'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (!('IntersectionObserver' in window)) return;
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('on', a.getAttribute('data-h') === en.target.id);
        });
      });
    }, { rootMargin: '-70px 0px -72% 0px', threshold: 0 });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* ---------------- prev / next ---------------- */
  function buildPager(i) {
    var prev = DOCS[i - 1], next = DOCS[i + 1];
    var html = '';
    html += prev
      ? '<a href="#' + prev.id + '" data-d="prev" data-goto="' + prev.id + '">' +
        '<span class="k">← ' + prev.n + ' previous</span><span class="v">' + prev.title + '</span></a>'
      : '<span class="ph"></span>';
    html += next
      ? '<a href="#' + next.id + '" data-d="next" data-goto="' + next.id + '">' +
        '<span class="k">' + next.n + ' next →</span><span class="v">' + next.title + '</span></a>'
      : '<span class="ph"></span>';
    pager.innerHTML = html;
  }

  /* ---------------- routing ---------------- */
  var current = null;

  function show(id, opts) {
    opts = opts || {};
    var doc = byId[id] || DOCS[0];
    if (current === doc && !opts.force) { return doc; }

    DOCS.forEach(function (d) {
      d.el.hidden = d !== doc;
      if (d.link) d.link.classList.toggle('on', d === doc);
    });
    docEl.classList.toggle('wide', doc.el.classList.contains('wide'));
    current = doc;

    buildTOC(doc);
    buildPager(DOCS.indexOf(doc));
    document.title = doc.title + ' — Data Science in the Cold Chain';

    if (opts.hash !== false && location.hash.slice(1) !== doc.id) {
      // pushState throws on file:// in some browsers; the hash fallback still works.
      try { history.pushState(null, '', '#' + doc.id); }
      catch (e) { location.hash = doc.id; }
    }
    if (opts.scroll !== false) window.scrollTo(0, 0);
    closeRail();
    return doc;
  }

  /* Intercept in-page section links anywhere in the reader. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!byId[id]) return;              // let ordinary anchors behave normally
    e.preventDefault();
    resetSearch();
    show(id);
  });

  window.addEventListener('popstate', function () {
    show(location.hash.slice(1) || DOCS[0].id, { hash: false });
  });

  /* ---------------- use-case filter ---------------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-filter]'));
  var cards = [].slice.call(document.querySelectorAll('.card[data-cat]'));
  var cardsEmpty = document.getElementById('cards-empty');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      cards.forEach(function (card) {
        var match = key === 'all' ||
          card.getAttribute('data-cat').split(/\s+/).indexOf(key) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      if (cardsEmpty) cardsEmpty.hidden = shown !== 0;
    });
  });

  /* ---------------- search ---------------- */
  var INDEX = [];

  DOCS.forEach(function (d) {
    var heading = null;
    var walker = document.createTreeWalker(d.el, NodeFilter.SHOW_ELEMENT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var tag = node.tagName;
      if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
        heading = { text: node.textContent.trim(), id: node.id || null };
        continue;
      }
      if (tag !== 'P' && tag !== 'LI' && tag !== 'DD' && tag !== 'TD' && tag !== 'SUMMARY') continue;
      if (node.querySelector('p,li,dd,td')) continue;   // container, not a leaf
      var text = node.textContent.replace(/\s+/g, ' ').trim();
      if (text.length < 12) continue;
      INDEX.push({
        doc: d,
        head: heading ? heading.text : d.title,
        anchor: heading && heading.id ? heading.id : d.id,
        text: text
      });
    }
  });

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var at = lower.indexOf(terms[0]);
    var start = Math.max(0, at - 70);
    var cut = text.slice(start, start + 240);
    var out = escHtml((start > 0 ? '…' : '') + cut + (start + 240 < text.length ? '…' : ''));
    terms.forEach(function (t) {
      out = out.replace(new RegExp('(' + escRe(escHtml(t)) + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  function runSearch(raw) {
    var terms = raw.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) { clearSearch(); return; }

    var hits = [];
    INDEX.forEach(function (row) {
      var hay = (row.text + ' ' + row.head).toLowerCase();
      var score = 0, all = true;
      terms.forEach(function (t) {
        var i = hay.indexOf(t);
        if (i === -1) { all = false; return; }
        score += row.head.toLowerCase().indexOf(t) !== -1 ? 3 : 1;
      });
      if (all) hits.push({ row: row, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });

    body.classList.add('searching');
    if (!hits.length) {
      results.innerHTML = '<div class="rhead">No matches</div>' +
        '<p class="nohit">Nothing in the guide matches “' + escHtml(raw) + '”.</p>';
      return;
    }

    var html = '<div class="rhead">' + hits.length + ' match' + (hits.length === 1 ? '' : 'es') + '</div>';
    hits.slice(0, 40).forEach(function (h) {
      var r = h.row;
      html += '<a class="hit" href="#' + r.doc.id + '" data-hit="' + r.doc.id + '" data-anchor="' + r.anchor + '">' +
              '<div class="hit-m"><b>' + r.doc.n + '</b> · ' + escHtml(r.doc.title) + '</div>' +
              '<div class="hit-t">' + escHtml(r.head) + '</div>' +
              '<div class="hit-s">' + snippet(r.text, terms) + '</div></a>';
    });
    results.innerHTML = html;
  }

  /* Hide results but leave the query alone — used while the user is still typing. */
  function clearSearch() {
    body.classList.remove('searching');
    results.innerHTML = '';
  }

  /* Abandon the search entirely — used when navigating away from results. */
  function resetSearch() {
    input.value = '';
    clearSearch();
  }

  var t = null;
  input.addEventListener('input', function () {
    clearTimeout(t);
    var v = input.value.trim();
    t = setTimeout(function () {
      if (v.length < 2) clearSearch(); else runSearch(v);
    }, 110);
  });

  results.addEventListener('click', function (e) {
    var hit = e.target.closest ? e.target.closest('.hit') : null;
    if (!hit) return;
    e.preventDefault();
    resetSearch();
    show(hit.getAttribute('data-hit'), { scroll: false });
    var target = document.getElementById(hit.getAttribute('data-anchor'));
    if (target && target !== current.el) {
      target.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === 'Escape') {
      if (body.classList.contains('searching')) {
        resetSearch();
        input.blur();
      } else if (body.classList.contains('rail-open')) {
        closeRail();
      }
    }
  });

  /* ---------------- boot ---------------- */
  show(location.hash.slice(1) || DOCS[0].id, { hash: false, scroll: false, force: true });
})();
