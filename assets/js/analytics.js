/*
 * Отправка целевых событий сразу в два сервиса:
 *  - Sber Ads (бывший Рамблер/Топ-100): top100Counter.trackEvent(name, data)
 *  - MyTracker (VK, бывший Top.Mail.Ru):  _tmr.push({type: 'reachGoal', ...})
 * LiveInternet цели не поддерживает, он считает только просмотры.
 *
 * Любой элемент с атрибутом data-goal="имя_цели" при клике отправляет событие.
 * Из других скриптов можно вызвать window.gvTrack('имя_цели', {...}).
 */
(function () {
  "use strict";

  function myTrackerId() {
    return window.MYTRACKER_ID || null;
  }

  function sendTop100(goal, data) {
    try {
      if (window.top100Counter && typeof window.top100Counter.trackEvent === "function") {
        window.top100Counter.trackEvent(goal, data);
      } else {
        // счётчик ещё не загрузился — ставим вызов в очередь загрузчика Топ-100
        (window._top100q = window._top100q || []).push(function () {
          if (window.top100Counter) window.top100Counter.trackEvent(goal, data);
        });
      }
    } catch (e) { /* счётчик заблокирован или не установлен */ }
  }

  function sendMyTracker(goal, data) {
    var id = myTrackerId();
    if (!id) return;
    try {
      var _tmr = window._tmr || (window._tmr = []);
      _tmr.push({ id: id, type: "reachGoal", goal: goal, params: data });
    } catch (e) { /* ignore */ }
  }

  function track(goal, data) {
    data = data || {};
    data.page = data.page || location.pathname.split("/").pop() || "index.html";
    sendTop100(goal, data);
    sendMyTracker(goal, data);
    if (window.console && console.info) console.info("[goal]", goal, data);
  }

  /* Учёт пользователей: после отправки заявки посетитель получает
     случайный идентификатор (никаких личных данных), который передаётся
     в оба счётчика и на следующих визитах. */
  function syncUser(uid) {
    if (!uid) return;
    try { if (window.top100Counter && window.top100Counter.syncUserId) window.top100Counter.syncUserId(uid); } catch (e) {}
    try { (window._tmr || (window._tmr = [])).push({ type: "setUserID", userid: uid }); } catch (e) {}
  }

  function ensureUser() {
    var uid = null;
    try {
      uid = localStorage.getItem("gv_uid");
      if (!uid) {
        uid = "guest-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("gv_uid", uid);
      }
    } catch (e) { uid = "guest-" + Math.random().toString(36).slice(2, 10); }
    syncUser(uid);
    return uid;
  }

  window.gvTrack = track;
  window.gvEnsureUser = ensureUser;

  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-goal]") : null;
    if (!el) return;
    var label = el.getAttribute("data-goal-label") || (el.textContent || "").trim().slice(0, 40);
    track(el.getAttribute("data-goal"), { label: label });
  });

  window.addEventListener("load", function () {
    var uid = null;
    try { uid = localStorage.getItem("gv_uid"); } catch (e) {}
    if (uid) setTimeout(function () { syncUser(uid); }, 1500);
  });
})();
