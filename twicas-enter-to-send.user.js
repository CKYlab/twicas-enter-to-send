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

  const SEND_BUTTON_TEXT_KEYWORDS = [
    'コメント',
    '匿名コメント',
    'comment',
    'anonymously',
    'send',
    '댓글',
    '익명',
    '留言',
    '匿名',
  ];

  const COMMENT_FIELD_HINT_KEYWORDS = [
    'コメント',
    'comment',
    '댓글',
    '留言',
  ];

  const COMMENT_FIELD_NAME_KEYWORDS = ['comment', 'message'];

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

  function includesAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
  }

  function findSendButton(fromEl) {
    const form = fromEl.closest('form') || document;
    const buttons = Array.from(form.querySelectorAll('button, input[type="submit"]'));

    for (const b of buttons) {
      if (!isVisible(b)) continue;

      const text = (b.innerText || b.value || b.getAttribute('aria-label') || '').trim();
      const lower = text.toLowerCase();
      if (includesAny(text, SEND_BUTTON_TEXT_KEYWORDS) || includesAny(lower, SEND_BUTTON_TEXT_KEYWORDS)) {
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
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const name = (el.getAttribute('name') || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

      const matchesCommentHint =
        includesAny(placeholder, COMMENT_FIELD_HINT_KEYWORDS) ||
        includesAny(ariaLabel, COMMENT_FIELD_HINT_KEYWORDS);
      const matchesFieldName = includesAny(name, COMMENT_FIELD_NAME_KEYWORDS);

      if (matchesCommentHint || matchesFieldName) {
        attach(el);
      }
    });
  }

   scan();

   const mo = new MutationObserver(() => scan());
   mo.observe(document.body, { childList: true, subtree: true });

 })();
