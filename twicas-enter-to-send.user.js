// ==UserScript==
// @name         Twicas Enter to Send
// @namespace    https://github.com/CKYlab/twicas-enter-to-send
// @version      1.2.0
// @description  TwitCastingでEnterキーによるコメント送信を有効にします。Shift+Enterで改行します。
// @match        https://twitcasting.tv/*
// @match        https://ja.twitcasting.tv/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  if (window.__twicasEnterInjected) return;
  window.__twicasEnterInjected = true;

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

  const COMMENT_FIELD_NAME_KEYWORDS = [
    'comment',
    'message',
  ];

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return (
      style &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      el.offsetParent !== null
    );
  }

  function getText(el) {
    return (
      el.innerText ||
      el.value ||
      el.getAttribute('aria-label') ||
      ''
    ).trim().toLowerCase();
  }

  function includesAny(text, keywords) {
    return keywords.some((keyword) => {
      return text.includes(keyword.toLowerCase());
    });
  }

  function findSendButton(fromEl) {
    const form = fromEl.closest('form') || document;

    // 1. TwitCastingの送信ボタン共通クラスを最優先
    const primary = form.querySelector('button.tw-button-primary');

    if (primary && isVisible(primary)) {
      return primary;
    }

    // 2. 念のため、表示テキストでも探す
    const buttons = Array.from(
      form.querySelectorAll('button, input[type="submit"]')
    );

    for (const button of buttons) {
      if (!isVisible(button)) continue;

      const text = getText(button);

      if (includesAny(text, SEND_BUTTON_TEXT_KEYWORDS)) {
        return button;
      }
    }

    return null;
  }

  function attach(el) {
    if (!el || el.__twicasEnterBound) return;
    el.__twicasEnterBound = true;

    el.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.repeat) return;
      if (e.key !== 'Enter') return;

      // Shift+Enterなどは改行・通常操作として残す
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

      const value = el.value !== undefined ? el.value : el.textContent;
      if (!value || String(value).trim().length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const button = findSendButton(el);

      if (button) {
        button.click();
        return;
      }

      const form = el.closest('form');
      if (form) {
        if (form.requestSubmit) {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }
    }, true);
  }

  function scan() {
    document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]').forEach((el) => {
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const name = (el.getAttribute('name') || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

      const isTwicasCommentForm = Boolean(
        el.closest('form.tw-player-page__comment_post, form.tw-comment-post')
      );

      const matchesCommentHint =
        includesAny(placeholder, COMMENT_FIELD_HINT_KEYWORDS) ||
        includesAny(ariaLabel, COMMENT_FIELD_HINT_KEYWORDS);

      const matchesFieldName =
        includesAny(name, COMMENT_FIELD_NAME_KEYWORDS);

      if (isTwicasCommentForm || matchesCommentHint || matchesFieldName) {
        attach(el);
      }
    });
  }

  scan();

  const observer = new MutationObserver(() => {
    scan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
