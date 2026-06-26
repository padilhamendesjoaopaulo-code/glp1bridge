/* =========================================================================
   GLP1Bridge.com — shared client JS (no framework, no dependencies)
   Each module guards on the elements it needs, so one file is safe to load
   on every page.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- Mobile nav toggle ------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var btn = document.querySelector(".nav-toggle");
    if (!nav || !btn) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Set current year in footers --------------------------- */
  function initYear() {
    var els = document.querySelectorAll("[data-year]");
    var y = new Date().getFullYear();
    els.forEach(function (el) { el.textContent = y; });
  }

  /* ---------- Eligibility wizard ------------------------------------ */
  /* The wizard is intentionally framework-free. Logic only — AdSense is
     never injected into these steps or the result screen (per spec).      */
  function initWizard() {
    var wizard = document.getElementById("eligibility-wizard");
    if (!wizard) return;

    var steps = Array.prototype.slice.call(wizard.querySelectorAll(".wizard-step"));
    var result = wizard.querySelector(".wizard-result");
    var progress = wizard.querySelector(".wizard-progress");
    var current = 0;
    var answers = {};

    // Build progress segments
    if (progress) {
      steps.forEach(function () {
        var seg = document.createElement("span");
        seg.className = "seg";
        progress.appendChild(seg);
      });
    }

    function renderProgress() {
      if (!progress) return;
      Array.prototype.forEach.call(progress.children, function (seg, i) {
        seg.classList.toggle("active", i <= current);
      });
    }

    function show(i) {
      steps.forEach(function (s, idx) { s.classList.toggle("active", idx === i); });
      result.classList.remove("active");
      current = i;
      renderProgress();
      wizard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function evaluate() {
      // Decision logic for the Medicare GLP-1 Bridge program (informational).
      // "yes" = likely eligible, "maybe" = needs review, "no" = unlikely.
      var verdict = "maybe";
      var reasons = [];

      if (answers.medicare === "no") {
        verdict = "no";
        reasons.push("The Bridge program is for people enrolled in Medicare Part D. You told us you are not currently enrolled in Medicare.");
      } else if (answers.partd === "no") {
        verdict = "no";
        reasons.push("Bridge coverage runs through Medicare Part D drug plans. A standalone Part D or Medicare Advantage drug plan is required.");
      } else if (answers.condition === "none") {
        verdict = "no";
        reasons.push("Current Medicare rules tie GLP-1 coverage to a qualifying condition (such as type 2 diabetes or a cardiovascular indication). Coverage for weight loss alone remains limited.");
      } else {
        verdict = "yes";
        if (answers.condition === "diabetes") reasons.push("Type 2 diabetes is an established, covered indication for GLP-1 medications under Part D.");
        if (answers.condition === "cardio") reasons.push("A cardiovascular indication (e.g., Wegovy for reducing cardiovascular risk) is recognized by many Part D plans.");
        if (answers.condition === "obesity") { verdict = "maybe"; reasons.push("Obesity-based coverage depends on your specific plan and the new Bridge guidance — many plans will require documentation and prior authorization."); }
        if (answers.priorauth === "yes") reasons.push("You indicated a prior authorization may already be on file, which can speed approval.");
      }

      var banner = result.querySelector(".result-banner");
      var title = result.querySelector("[data-result-title]");
      var body = result.querySelector("[data-result-body]");

      banner.className = "result-banner " + verdict;
      if (verdict === "yes") title.textContent = "You likely qualify for Bridge coverage";
      else if (verdict === "maybe") title.textContent = "You may qualify — a review is needed";
      else title.textContent = "You likely do not qualify right now";

      body.innerHTML = "";
      reasons.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = r;
        body.appendChild(li);
      });

      steps.forEach(function (s) { s.classList.remove("active"); });
      result.classList.add("active");
      if (progress) Array.prototype.forEach.call(progress.children, function (seg) { seg.classList.add("active"); });
      wizard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Option selection
    wizard.addEventListener("change", function (e) {
      var input = e.target;
      if (input.matches('input[type="radio"]')) {
        answers[input.name] = input.value;
        var group = input.closest(".options");
        if (group) group.querySelectorAll(".option").forEach(function (o) {
          o.classList.toggle("selected", o.contains(input));
        });
        // auto-advance after a brief beat
        var step = input.closest(".wizard-step");
        var idx = steps.indexOf(step);
        setTimeout(function () {
          if (idx < steps.length - 1) show(idx + 1);
          else evaluate();
        }, 220);
      }
    });

    // Back buttons & restart
    wizard.addEventListener("click", function (e) {
      if (e.target.matches("[data-back]")) {
        e.preventDefault();
        if (current > 0) show(current - 1);
      }
      if (e.target.matches("[data-restart]")) {
        e.preventDefault();
        answers = {};
        wizard.querySelectorAll('input[type="radio"]').forEach(function (i) { i.checked = false; });
        wizard.querySelectorAll(".option").forEach(function (o) { o.classList.remove("selected"); });
        show(0);
      }
    });

    show(0);
  }

  /* ---------- Cost calculator --------------------------------------- */
  function initCostCalc() {
    var calc = document.getElementById("cost-calc");
    if (!calc) return;

    // List prices are approximate U.S. retail (no insurance) and are used
    // only to illustrate potential out-of-pocket ranges.
    var DRUGS = {
      wegovy:   { name: "Wegovy", list: 1349 },
      zepbound: { name: "Zepbound", list: 1086 },
      foundayo: { name: "Foundayo", list: 999 },
      ozempic:  { name: "Ozempic", list: 969 }
    };

    var drug = calc.querySelector("[name=drug]");
    var coverage = calc.querySelector("[name=coverage]");
    var months = calc.querySelector("[name=months]");
    var monthsVal = calc.querySelector("[data-months-val]");

    var outMonthly = calc.querySelector("[data-out-monthly]");
    var outTotal = calc.querySelector("[data-out-total]");
    var outNote = calc.querySelector("[data-out-note]");

    function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

    function compute() {
      var d = DRUGS[drug.value];
      var m = parseInt(months.value, 10);
      monthsVal.textContent = m;
      var monthly, note;

      switch (coverage.value) {
        case "bridge":
          // Illustrative Bridge cost share once approved.
          monthly = 35;
          note = "Estimated copay once Bridge prior authorization is approved. Many Part D plans cap covered GLP-1 copays in this range.";
          break;
        case "partd":
          monthly = 0.25 * d.list;
          note = "Typical Part D coinsurance before reaching the catastrophic phase. Your plan's tier and deductible will change this.";
          break;
        case "savings":
          monthly = d.list * 0.5;
          note = "Manufacturer savings programs are generally NOT available to Medicare members. Shown for comparison only.";
          break;
        default:
          monthly = d.list;
          note = "Full cash price with no coverage applied.";
      }

      outMonthly.textContent = money(monthly);
      outTotal.textContent = money(monthly * m);
      outNote.textContent = note;
    }

    calc.addEventListener("input", compute);
    calc.addEventListener("change", compute);
    compute();
  }

  /* ---------- Weight-loss projection (Option D) --------------------- */
  function initProjection() {
    var calc = document.getElementById("projection-calc");
    if (!calc) return;

    // Average total body-weight loss from pivotal trials (illustrative).
    // Sources cited on-page (FDA labeling / NEJM trial summaries).
    var DRUGS = {
      wegovy:   { name: "Wegovy (semaglutide 2.4mg)", pct: 0.15, weeks: 68 },
      zepbound: { name: "Zepbound (tirzepatide)",     pct: 0.205, weeks: 72 },
      foundayo: { name: "Foundayo (oral GLP-1)",      pct: 0.12, weeks: 64 }
    };

    var startW = calc.querySelector("[name=startWeight]");
    var startVal = calc.querySelector("[data-start-val]");
    var drug = calc.querySelector("[name=projDrug]");
    var weeks = calc.querySelector("[name=projWeeks]");
    var weeksVal = calc.querySelector("[data-weeks-val]");

    var chart = calc.querySelector("[data-chart]");
    var tbody = calc.querySelector("[data-proj-body]");
    var statLost = calc.querySelector("[data-stat-lost]");
    var statFinal = calc.querySelector("[data-stat-final]");
    var statPct = calc.querySelector("[data-stat-pct]");

    function projectedLossPct(d, week) {
      // Titration curve: loss accrues gradually, approaching the trial average.
      // Modeled as an ease-out toward the drug's average at its trial endpoint.
      var t = Math.min(week / d.weeks, 1);
      var eased = 1 - Math.pow(1 - t, 1.6);
      return d.pct * eased;
    }

    function compute() {
      var sw = parseInt(startW.value, 10);
      var d = DRUGS[drug.value];
      var wk = parseInt(weeks.value, 10);
      startVal.textContent = sw.toLocaleString("en-US");
      weeksVal.textContent = wk;

      // Build week markers (every ~ week count / 8, plus endpoint)
      var marks = [];
      var stepN = Math.max(1, Math.round(wk / 8));
      for (var w = 0; w <= wk; w += stepN) marks.push(w);
      if (marks[marks.length - 1] !== wk) marks.push(wk);

      // Stats at endpoint
      var endPct = projectedLossPct(d, wk);
      var lostLbs = sw * endPct;
      statLost.textContent = "-" + Math.round(lostLbs).toLocaleString("en-US") + " lb";
      statFinal.textContent = Math.round(sw - lostLbs).toLocaleString("en-US") + " lb";
      statPct.textContent = "-" + (endPct * 100).toFixed(1) + "%";

      // Table
      tbody.innerHTML = "";
      marks.forEach(function (w) {
        var pct = projectedLossPct(d, w);
        var lost = sw * pct;
        var cur = sw - lost;
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + w + "</td>" +
          "<td>" + Math.round(cur).toLocaleString("en-US") + " lb</td>" +
          "<td>-" + Math.round(lost).toLocaleString("en-US") + " lb</td>" +
          "<td>-" + (pct * 100).toFixed(1) + "%</td>";
        tbody.appendChild(tr);
      });

      // Pure-CSS bar chart (% lost at each mark)
      chart.innerHTML = "";
      var maxPct = d.pct; // scale bars to the drug's max for visual consistency
      marks.forEach(function (w) {
        var pct = projectedLossPct(d, w);
        var h = maxPct > 0 ? (pct / maxPct) * 100 : 0;
        var col = document.createElement("div");
        col.className = "bar-col";
        col.innerHTML =
          '<div class="bar" style="height:' + Math.max(h, 2) + '%">' +
            '<span class="val">' + (pct * 100).toFixed(0) + '%</span>' +
          '</div>' +
          '<span class="x">wk ' + w + '</span>';
        chart.appendChild(col);
      });
    }

    calc.addEventListener("input", compute);
    calc.addEventListener("change", compute);
    compute();
  }

  /* ---------- Sortable + filterable data table (Option C) ----------- */
  function initDataTable() {
    var tables = document.querySelectorAll("[data-sortable]");
    tables.forEach(function (table) {
      var tbody = table.querySelector("tbody");
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
      var headers = Array.prototype.slice.call(table.querySelectorAll("th.sortable"));

      // Wire up external controls by data-controls id
      var controlsId = table.getAttribute("data-controls");
      var controls = controlsId ? document.getElementById(controlsId) : null;
      var search = controls ? controls.querySelector("[data-search]") : null;
      var statusSel = controls ? controls.querySelector("[data-filter-status]") : null;
      var paSel = controls ? controls.querySelector("[data-filter-pa]") : null;
      // The count label may live outside the controls container, so fall back
      // to a document-level lookup.
      var count = (controls && controls.querySelector("[data-count]")) || document.querySelector("[data-count]");

      function applyFilters() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var st = statusSel ? statusSel.value : "";
        var pa = paSel ? paSel.value : "";
        var shown = 0;
        rows.forEach(function (r) {
          var text = r.textContent.toLowerCase();
          var matchQ = !q || text.indexOf(q) !== -1;
          var matchSt = !st || r.getAttribute("data-status") === st;
          var matchPa = !pa || r.getAttribute("data-pa") === pa;
          var ok = matchQ && matchSt && matchPa;
          r.style.display = ok ? "" : "none";
          if (ok) shown++;
        });
        if (count) count.textContent = shown + " of " + rows.length + " states shown";
      }

      function sortBy(index, type, dir) {
        var sorted = rows.slice().sort(function (a, b) {
          var av = a.children[index].getAttribute("data-sort") || a.children[index].textContent.trim();
          var bv = b.children[index].getAttribute("data-sort") || b.children[index].textContent.trim();
          if (type === "num") { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
          if (av < bv) return dir === "asc" ? -1 : 1;
          if (av > bv) return dir === "asc" ? 1 : -1;
          return 0;
        });
        sorted.forEach(function (r) { tbody.appendChild(r); });
      }

      headers.forEach(function (th) {
        var btn = th.querySelector("button") || th;
        btn.addEventListener("click", function () {
          var index = Array.prototype.indexOf.call(th.parentNode.children, th);
          var type = th.getAttribute("data-type") || "text";
          var curr = th.getAttribute("aria-sort");
          var dir = curr === "ascending" ? "desc" : "asc";
          headers.forEach(function (h) { h.removeAttribute("aria-sort"); });
          th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
          sortBy(index, type, dir);
        });
      });

      if (search) search.addEventListener("input", applyFilters);
      if (statusSel) statusSel.addEventListener("change", applyFilters);
      if (paSel) paSel.addEventListener("change", applyFilters);
      applyFilters();
    });
  }

  /* ---------- Init -------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initYear();
    initWizard();
    initCostCalc();
    initProjection();
    initDataTable();
  });
})();
