(function () {
  "use strict";

  /* ---------- мобильное меню ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.textContent = open ? "✕" : "☰";
    });
  }

  /* ---------- год в подвале ---------- */
  document.querySelectorAll(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- фильтр игр по хэшу (#shutery, #ritm ...) ---------- */
  var games = document.querySelectorAll(".game[data-genre]");
  if (games.length) {
    var chips = document.querySelectorAll(".chip[data-filter]");
    var empty = document.querySelector(".empty-note");
    var applyFilter = function () {
      var f = (location.hash || "#vse").slice(1);
      var shown = 0;
      games.forEach(function (g) {
        var ok = f === "vse" || g.getAttribute("data-genre").split(" ").indexOf(f) !== -1;
        g.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      chips.forEach(function (c) { c.classList.toggle("active", c.getAttribute("data-filter") === f); });
      if (empty) empty.style.display = shown ? "none" : "block";
    };
    window.addEventListener("hashchange", applyFilter);
    applyFilter();
  }

  /* ---------- калькулятор стоимости ---------- */
  var calc = document.getElementById("calc");
  if (calc) {
    calc.addEventListener("submit", function (e) {
      e.preventDefault();
      var players = parseInt(calc.players.value, 10) || 1;
      var minutes = parseInt(calc.duration.value, 10) || 30;
      var day = calc.day.value;
      var rate = day === "weekday-day" ? 1000 : 1400; // за 30 минут на 1 игрока
      var halfHours = minutes / 30;
      var total = rate * halfHours * players;
      var discount = 0;
      if (players >= 4 && minutes >= 60) discount = 0.1;
      total = Math.round(total * (1 - discount));
      var out = document.getElementById("calc-result");
      out.innerHTML = "Итого: <b>" + total.toLocaleString("ru-RU") + " ₽</b>" +
        (discount ? "<div class='hint'>Учтена скидка 10% для компании от 4 человек на час и больше.</div>" : "") +
        "<div style='margin-top:14px'><a class='btn btn-sm' href='bron.html' data-goal='booking_click' data-goal-label='из калькулятора' data-gorizont='калькулятор::забронировать'>Забронировать</a></div>";
      out.style.display = "block";
      if (window.gvTrack) window.gvTrack("price_calc", { players: players, minutes: minutes, day: day, total: total });
    });
  }

  /* ---------- выбор времени на странице брони ---------- */
  var slotsBox = document.getElementById("slots");
  if (slotsBox) {
    var hidden = document.getElementById("time");
    var busy = ["12:00", "15:00", "19:00"];
    for (var h = 10; h <= 22; h++) {
      var t = (h < 10 ? "0" : "") + h + ":00";
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = t;
      b.setAttribute("data-gorizont", "бронь::время::" + t);
      if (busy.indexOf(t) !== -1) b.disabled = true;
      slotsBox.appendChild(b);
    }
    slotsBox.addEventListener("click", function (e) {
      var btn = e.target.closest(".slot");
      if (!btn || btn.disabled) return;
      slotsBox.querySelectorAll(".slot").forEach(function (s) { s.classList.remove("selected"); });
      btn.classList.add("selected");
      hidden.value = btn.textContent;
    });
    var dateInput = document.getElementById("date");
    if (dateInput) {
      var d = new Date();
      dateInput.min = d.toISOString().slice(0, 10);
      d.setDate(d.getDate() + 1);
      dateInput.value = d.toISOString().slice(0, 10);
    }
  }

  /* ---------- формы заявок (без отправки на сервер) ---------- */
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var time = form.querySelector("#time");
      if (time && !time.value) {
        alertBox(form, "Выберите время сеанса");
        return;
      }
      var goal = form.getAttribute("data-lead");
      var data = {};
      ["players", "format", "guests", "package"].forEach(function (k) {
        if (form[k]) data[k] = form[k].value;
      });
      if (window.gvEnsureUser) window.gvEnsureUser();
      if (window.gvTrack) window.gvTrack(goal, data);
      form.style.display = "none";
      var ok = document.getElementById(form.getAttribute("data-success"));
      if (ok) ok.classList.add("show");
    });
  });

  function alertBox(form, text) {
    var n = form.querySelector(".form-error");
    if (!n) {
      n = document.createElement("p");
      n.className = "form-error";
      n.style.color = "#ff7aa8";
      n.style.fontWeight = "700";
      form.insertBefore(n, form.querySelector("button[type=submit]"));
    }
    n.textContent = text;
  }
})();
