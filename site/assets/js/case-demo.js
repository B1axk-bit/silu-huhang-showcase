(function () {
  "use strict";

  window.Showcase = window.Showcase || {};
  var lastTrigger = null;

  function appendList(parent, title, items) {
    var section = document.createElement("section");
    var heading = document.createElement("h3");
    heading.textContent = title;
    var list = document.createElement("ul");
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    section.append(heading, list);
    parent.appendChild(section);
  }

  function closeModal() {
    var backdrop = document.getElementById("case-modal-backdrop");
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  function openModal(item, trigger) {
    var backdrop = document.getElementById("case-modal-backdrop");
    var modal = document.getElementById("case-modal");
    var title = document.getElementById("case-modal-title");
    var body = document.getElementById("case-modal-body");
    var closeButton = document.getElementById("case-modal-close");
    if (!backdrop || !modal || !body) return;

    lastTrigger = trigger;
    title.textContent = item.title;
    body.replaceChildren();

    var fact = document.createElement("section");
    fact.className = "source-fact";
    var factTitle = document.createElement("h3");
    factTitle.textContent = "官方文件确认";
    var officialTitle = document.createElement("p");
    officialTitle.textContent = item.officialTitle;
    var factCopy = document.createElement("p");
    factCopy.textContent = item.officialFact;
    fact.append(factTitle, officialTitle, factCopy);

    var interpretation = document.createElement("section");
    interpretation.className = "interpretation";
    var interpretationTitle = document.createElement("h3");
    interpretationTitle.textContent = "小航风险解读｜为什么与一线员工有关";
    var relevance = document.createElement("p");
    relevance.textContent = item.relevance;
    interpretation.append(interpretationTitle, relevance);

    var columns = document.createElement("div");
    columns.className = "list-columns";
    appendList(columns, "三项风险点", item.risks);
    appendList(columns, "三项正确做法", item.practices);
    appendList(columns, "三项立即自查", item.checks);

    var quiz = document.createElement("section");
    quiz.className = "quiz-box";
    var quizTitle = document.createElement("h3");
    quizTitle.textContent = "微测｜" + item.quiz.question;
    var options = document.createElement("div");
    options.className = "quiz-options";
    item.quiz.options.forEach(function (option, index) {
      var label = document.createElement("label");
      label.className = "quiz-option";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "case-quiz";
      input.value = String(index);
      var text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      options.appendChild(label);
    });
    var feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.setAttribute("aria-live", "polite");
    options.addEventListener("change", function (event) {
      var correct = Number(event.target.value) === item.quiz.correct;
      feedback.textContent = correct ? "回答正确。" + item.quiz.feedback : "再想一想。" + item.quiz.feedback;
      feedback.style.color = correct ? "var(--success)" : "var(--danger)";
    });
    quiz.append(quizTitle, options, feedback);

    var takeaway = document.createElement("section");
    takeaway.className = "notice-box";
    var takeawayTitle = document.createElement("strong");
    takeawayTitle.textContent = "一句话记住：";
    takeaway.append(takeawayTitle, document.createTextNode(item.takeaway));

    var sourceButton = document.createElement("a");
    sourceButton.className = "button button--jade";
    sourceButton.href = item.sourceUrl;
    sourceButton.target = "_blank";
    sourceButton.rel = "noopener noreferrer";
    sourceButton.textContent = "查看证监会官方来源";

    var notice = document.createElement("p");
    notice.className = "notice-box";
    notice.textContent =
      "小航风险解读仅用于员工合规学习，不构成对其他客户、员工或事项的事实认定、责任判断或处理结论。";

    body.append(fact, interpretation, columns, quiz, takeaway, sourceButton, notice);
    backdrop.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  window.Showcase.initCaseDemo = function () {
    var cases = window.ShowcaseData.cases;
    var grid = document.getElementById("case-grid");
    var backdrop = document.getElementById("case-modal-backdrop");
    var modal = document.getElementById("case-modal");
    var closeButton = document.getElementById("case-modal-close");
    if (!grid || !backdrop || !modal || !closeButton) return;

    cases.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "card case-card";
      var source = document.createElement("p");
      source.className = "case-source";
      source.textContent = item.fileType + "｜" + item.agency;
      var title = document.createElement("h3");
      title.textContent = item.title;
      var reading = document.createElement("p");
      reading.textContent = "2分钟阅读｜公开文件与员工行动分层呈现";
      var tags = document.createElement("div");
      tags.className = "chip-row";
      item.tags.forEach(function (tag) {
        var chip = document.createElement("span");
        chip.className = "risk-tag";
        chip.textContent = tag;
        tags.appendChild(chip);
      });
      var button = document.createElement("button");
      button.type = "button";
      button.className = "button button--ghost";
      button.textContent = "查看学习卡";
      button.addEventListener("click", function () {
        openModal(item, button);
      });
      card.append(source, title, reading, tags, button);
      grid.appendChild(card);
    });

    closeButton.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (backdrop.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === "Tab") {
        var focusable = Array.from(
          modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(function (element) {
          return !element.hidden;
        });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  };
})();
