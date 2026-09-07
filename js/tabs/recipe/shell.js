/* shell.js — 3つのビューで共通に使う土台
 *
 * ・レシピDBの読み込みとインデックス構築
 * ・上部バーのバナー / データ状況表示
 * ・ジョブ名・レベル・パッチチップなど、表示の小物
 *
 * gamedata.js / icons.js / reverse.js のロジックには手を入れず、
 * それらを呼ぶ側の共通処理だけをここに集めている。
 */
(function () {
  'use strict';

  var GameData = FF14.craft.GameData;
  var Index = FF14.reverse.Index;
  var Patch = FF14.reverse.PatchData;
  var Icons = FF14.core.Icons;

  var LS_UI = 'ff14reverse.v1.ui';
  var LS_RECENT = 'ff14reverse.v1.recent';
  var RECENT_MAX = 12;

  var root = null;

  /* 通常クラフター（DoHのClassJob ID）。teamcraft のレシピは job に
     これを持つ。0 は会社製作（カンパニークラフト）、負値は開拓用などの特殊。 */
  var JOBS = [
    { job: 8,  name: '木工師' },
    { job: 9,  name: '鍛冶師' },
    { job: 10, name: '甲冑師' },
    { job: 11, name: '彫金師' },
    { job: 12, name: '革細工師' },
    { job: 13, name: '裁縫師' },
    { job: 14, name: '錬金術師' },
    { job: 15, name: '調理師' },
    { job: 0,  name: 'カンパニークラフト' },
    { job: -10, name: '特殊製作' }
  ];

  function setRoot(el) { root = el; }
  function getRoot() { return root || document; }

  /* IDは rcp- 接頭辞つきで一意なので document から引いて問題ない。 */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function n(x) { return Number(x).toLocaleString(); }

  function readJSON(key, dflt) {
    try {
      var o = JSON.parse(localStorage.getItem(key));
      if (o == null || typeof o !== 'object') return dflt;
      if (!Array.isArray(dflt)) for (var k in dflt) if (!(k in o)) o[k] = dflt[k];
      return o;
    } catch (e) { return dflt; }
  }
  function writeJSON(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }

  /* ---------- 最近見たアイテム ---------- */
  function recent() { var a = readJSON(LS_RECENT, []); return Array.isArray(a) ? a : []; }
  function pushRecent(id) {
    var a = recent().filter(function (x) { return x !== id; });
    a.unshift(id);
    writeJSON(LS_RECENT, a.slice(0, RECENT_MAX));
  }

  /* ---------- バナー / ステータス ---------- */
  function banner(msg, kind) {
    var el = $('#rcp-banner');
    if (!el) return;
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.className = 'banner' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    el.hidden = false;
  }

  function p2(x) { return (x < 10 ? '0' : '') + x; }

  function renderStatus(info) {
    var el = $('#rcp-status');
    if (!el) return;
    var age = GameData.dataAge();
    var d = age ? new Date(age) : null;
    var when = d ? (d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())) : '不明';
    el.innerHTML =
      '<span>レシピ <b>' + n(GameData.recipeCount()) + '</b></span>' +
      '<span>アイテム <b>' + n(GameData.itemCount()) + '</b></span>' +
      '<span>うち素材として使われるもの <b>' + n(Index.ingredientItemCount()) + '</b></span>' +
      '<span>取得 <b>' + esc(when) + '</b>' + (info && info.fromCache ? '（キャッシュ）' : '') + '</span>' +
      '<span>台帳既定 <b>P' + esc(Patch.meta.defaultPatch) + '</b></span>';
  }

  /* 表の列見出し（.rev-head）を上部バーの真下で止めるための実測値。
     バーの高さは画面幅やハブバーの有無で変わるので、CSS変数に流し込む。 */
  function syncStickyTop() {
    if (!root || !root.style) return;
    var bar = root.querySelector('.top');
    var barH = bar ? bar.getBoundingClientRect().height : 0;
    var hub = document.querySelector('.hub-bar');
    var hubH = hub ? hub.getBoundingClientRect().height : 0;
    root.style.setProperty('--rcp-bar-top', Math.round(hubH) + 'px');
    root.style.setProperty('--rcp-sticky-top', Math.round(hubH + barH) + 'px');
  }

  function focusSearch() {
    var q = $('#rcp-q');
    if (q && !q.disabled) { try { q.focus(); } catch (e) {} }
  }

  /**
   * レシピDBを読み込み、逆引きインデックスを組んでから ready を呼ぶ。
   * @param {{ready:function(info), onReload?:function()}} opts
   */
  /* DBの読み込み中は検索欄の下にバーを走らせる（css/motion.css の .is-busy）。
     初回は約2MBの取得があり、待ち時間が長いため。 */
  function setBusy(on) {
    if (!root) return;
    root.querySelectorAll('.search-wrap').forEach(function (w) {
      w.classList.toggle('is-busy', !!on);
    });
  }

  function boot(opts) {
    opts = opts || {};
    banner('レシピDBを読み込み中…（初回のみ約2MB）');
    setBusy(true);
    syncStickyTop();
    window.addEventListener('resize', syncStickyTop);

    return GameData.load({ onProgress: banner }).then(function (info) {
      banner('レシピDBを展開中…');
      Index.build();
      banner(null);
      setBusy(false);
      renderStatus(info);
      syncStickyTop();

      var reload = $('#rcp-reload');
      if (reload) {
        reload.addEventListener('click', function () {
          if (reload.disabled) return;
          reload.disabled = true;
          setBusy(true);
          banner('レシピDBを再取得中…');
          GameData.load({ force: true, onProgress: banner }).then(function (i2) {
            Index.build();
            banner(null);
            renderStatus(i2);
            reload.disabled = false;
            setBusy(false);
            if (opts.onReload) opts.onReload(i2);
          }).catch(function (err) {
            banner('再取得に失敗しました: ' + (err && err.message), 'err');
            reload.disabled = false;
            setBusy(false);
          });
        });
      }

      if (info && info.stale) {
        banner('レシピDBの更新に失敗したため、保存済みの古いデータを使っています。', 'err');
      }
      if (opts.ready) opts.ready(info);
      return info;
    }).catch(function (err) {
      console.error(err);
      setBusy(false);
      banner('レシピDBを取得できませんでした（' + (err && err.message) +
             '）。ネットワークを確認して再読み込みしてください。', 'err');
      throw err;
    });
  }

  /* ---------- ジョブ / レベル ---------- */
  function isNormalJob(job) { return job >= 8 && job <= 15; }
  function jobLabel(job) {
    if (isNormalJob(job)) return GameData.jobName(job);
    return job === 0 ? '会社製作' : '特殊製作';
  }
  /** タブなどで使う正式名（木工師 / カンパニークラフト …） */
  function jobFullName(job) {
    for (var i = 0; i < JOBS.length; i++) if (JOBS[i].job === job) return JOBS[i].name;
    return '職' + job;
  }
  function jobClass(job) { return isNormalJob(job) ? 'job-' + job : 'job-x'; }
  function jobBadge(job) {
    return '<span class="job ' + jobClass(job) + '">' + esc(jobLabel(job)) + '</span>';
  }
  function lvText(job, lvl) { return isNormalJob(job) ? 'Lv' + lvl : '—'; }

  /* ---------- パッチ ---------- */
  function patchInfo(kind, id) {
    return kind === 'item' ? Patch.itemPatch(id) : Patch.recipePatch(id);
  }
  function patchLabel(info) { return (info.source === 'default' ? '≧' : '') + (info.patch || '?'); }
  function patchTitle(info) {
    var t = info.source === 'default' ? '台帳に個別エントリなし（既定値からの暫定表示）'
          : info.source === 'local' ? '画面から補記（localStorage）'
          : 'パッチ台帳に登録済み';
    return info.note ? t + ' — ' + info.note : t;
  }
  /** 編集できるパッチチップ */
  function patchChip(kind, id) {
    var info = patchInfo(kind, id);
    return '<button class="patch patch-' + info.source + '" data-edit-patch="' + kind + '" data-pid="' + id +
           '" title="' + esc(patchTitle(info)) + ' / クリックで編集">' + esc(patchLabel(info)) + '</button>';
  }
  /** 表示専用のパッチチップ（クリックしても何も起きない） */
  function patchText(id) {
    var info = patchInfo('recipe', id);
    return '<span class="patch patch-' + info.source + ' ro" title="' + esc(patchTitle(info)) + '">' +
           esc(patchLabel(info)) + '</span>';
  }
  /** "7.25" のようなパッチ番号を比較用の数値にする。数字が拾えなければ -1。 */
  function patchNum(s) {
    var m = String(s == null ? '' : s).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!m) return -1;
    return (+m[1]) * 10000 + (+(m[2] || 0)) * 100 + (+(m[3] || 0));
  }

  /* ---------- ビュー間リンク ----------
     href はハッシュ（単体ページ用の見た目とミドルクリック向け）で、
     実際の遷移は data-goview をビュールーターが拾って行う。
     ハブ内ではルーターが preventDefault するので URL は変わらない。 */
  function itemLinkAttrs(id) {
    return 'href="#/search?item=' + id + '" data-goview="search" data-goparams="item=' + id + '"';
  }
  function viewLinkAttrs(view, params) {
    var qs = FF14.reverse.View.buildQuery(params || {});
    return 'href="#/' + view + (qs ? '?' + qs : '') + '" data-goview="' + view +
           '" data-goparams="' + esc(qs) + '"';
  }

  function hydrate(r) { try { Icons.hydrate(r || getRoot()); } catch (e) {} }
  function prefetch(ids) { try { Icons.prefetch(ids); } catch (e) {} }

  FF14.reverse.Shell = {
    JOBS: JOBS,
    LS_UI: LS_UI,
    setRoot: setRoot, getRoot: getRoot, focusSearch: focusSearch, syncStickyTop: syncStickyTop,
    $: $, $$: $$, esc: esc, n: n,
    readJSON: readJSON, writeJSON: writeJSON,
    recent: recent, pushRecent: pushRecent,
    banner: banner, renderStatus: renderStatus, boot: boot,
    isNormalJob: isNormalJob, jobLabel: jobLabel, jobFullName: jobFullName,
    jobClass: jobClass, jobBadge: jobBadge, lvText: lvText,
    patchInfo: patchInfo, patchLabel: patchLabel, patchTitle: patchTitle,
    patchChip: patchChip, patchText: patchText, patchNum: patchNum,
    itemLinkAttrs: itemLinkAttrs, viewLinkAttrs: viewLinkAttrs,
    hydrate: hydrate, prefetch: prefetch,
    placeholder: Icons.placeholder
  };
})();
