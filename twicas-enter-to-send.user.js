// ==UserScript==
// @name         キャスコメ楽々送信
// @namespace    twicas-enter
// @version      1.0
// @description  Enterでコメント送信（Shift+Enterで改行）
// @match        https://twitcasting.tv/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.__twicasEnterInjected) return;
  window.__twicasEnterInjected = true;

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return (
      style &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      el.offsetParent !== null
    );
  }

  function findSendButton(fromEl) {
    const form = fromEl.closest('form') || document;
    const buttons = Array.from(form.querySelectorAll('button, input[type="submit"]'));

    for (const b of buttons) {
      if (!isVisible(b)) continue;

      const text = (b.innerText || b.value || b.getAttribute('aria-label') || '').trim();

      if (
        text === 'コメント' ||
        text === '匿名コメント' ||
        text.toLowerCase() === 'comment' ||
        text.toLowerCase() === 'send'
      ) {
        return b;
      }
    }

    return null;
  }

  function attach(el) {
    if (!el || el.__twicasEnterBound) return;
    el.__twicasEnterBound = true;

    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key !== 'Enter') return;

      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

      const val = el.value !== undefined ? el.value : el.textContent;
      if (!val || String(val).trim().length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const btn = findSendButton(el);
      if (btn) {
        btn.click();
      } else {
        const form = el.closest('form');
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
      }
    }, true);
  }

  function scan() {
    document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]').forEach((el) => {
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      const name = (el.getAttribute('name') || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();

      if (
        ph.includes('コメント') ||
        ph.includes('comment') ||
        name.includes('comment') ||
        aria.includes('コメント')
      ) {
        attach(el);
      }
    });
  }

  scan();

  const mo = new MutationObserver(() => scan());
  mo.observe(document.body, { childList: true, subtree: true });

})();
