// ==UserScript==
// @name         Twicas Enter to Send
// @namespace    https://github.com/CKYlab/twicas-enter-to-send
// @version      1.1.3
// @description  TwitCastingでEnterキーによるコメント送信を有効にします。Shift+Enterで改行します。
// @match        https://twitcasting.tv/*
// @grant        none
// @license      MIT
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
       const lower = text.toLowerCase();

       if (
         text.includes('コメント') ||
         text.includes('匿名コメント') ||

          lower.includes('comment') ||
          lower.includes('anonymously') ||
         lower.includes('send') ||

         text.includes('댓글') ||
         text.includes('익명') ||

         text.includes('留言') ||
         text.includes('匿名')
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
          ph.includes('댓글') ||
          ph.includes('留言') ||

          name.includes('comment') ||
          name.includes('message') ||

          aria.includes('コメント') ||
          aria.includes('comment') ||
          aria.includes('댓글') ||
          aria.includes('留言')
        ) {
          attach(el);
        }
      });
    }

  scan();

  const mo = new MutationObserver(() => scan());
  mo.observe(document.body, { childList: true, subtree: true });

})();
