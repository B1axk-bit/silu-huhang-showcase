(function () {
  "use strict";

  window.Showcase = window.Showcase || {};

  function makeList(items) {
    var list = document.createElement("ul");
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    return list;
  }

  function renderCell(parent, title, content) {
    var cell = document.createElement("section");
    cell.className = "result-cell";
    var heading = document.createElement("h3");
    heading.textContent = title;
    cell.appendChild(heading);
    if (Array.isArray(content)) {
      cell.appendChild(makeList(content));
    } else {
      var paragraph = document.createElement("p");
      paragraph.textContent = content;
      cell.appendChild(paragraph);
    }
    parent.appendChild(cell);
  }

  function initTabs(tabList, panels) {
    var tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));

    function activate(tab, focus) {
      tabs.forEach(function (candidate) {
        var selected = candidate === tab;
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(candidate.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex !== null) {
          event.preventDefault();
          activate(tabs[nextIndex], true);
        }
      });
    });

    panels.forEach(function (panel, index) {
      panel.hidden = index !== 0;
    });
  }

  function renderResult(container, item) {
    var result = item.result;
    container.replaceChildren();

    var banner = document.createElement("div");
    banner.className = "result-banner";
    var bannerCopy = document.createElement("div");
    var title = document.createElement("strong");
    title.textContent = "放行结果｜仅限首轮回复";
    var subtitle = document.createElement("p");
    subtitle.textContent = "首轮沟通可使用，最终责任、赔偿、处分或账户措施仍按有权流程处理。";
    bannerCopy.append(title, subtitle);
    var chip = document.createElement("span");
    chip.className = "status-chip status-chip--warning";
    chip.textContent = "受控回复";
    banner.append(bannerCopy, chip);

    var grid = document.createElement("div");
    grid.className = "result-grid";
    renderCell(grid, "场景识别", result.scene);
    renderCell(grid, "待确认事实", result.facts);

    var scriptPanel = document.createElement("section");
    scriptPanel.className = "script-panel";
    var tabList = document.createElement("div");
    tabList.className = "tab-list";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", "沟通方式");

    var tabDefinitions = [
      { key: "wechat", label: "企微回复", text: result.wechat },
      { key: "phone", label: "电话话术", text: result.phone }
    ];
    var panels = [];
    tabDefinitions.forEach(function (definition, index) {
      var tabId = "assistant-tab-" + definition.key;
      var panelId = "assistant-panel-" + definition.key;
      var tab = document.createElement("button");
      tab.type = "button";
      tab.id = tabId;
      tab.className = "tab-button";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panelId);
      tab.setAttribute("aria-selected", String(index === 0));
      tab.tabIndex = index === 0 ? 0 : -1;
      tab.textContent = definition.label;
      tabList.appendChild(tab);

      var panel = document.createElement("p");
      panel.id = panelId;
      panel.className = "script-copy";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      panel.tabIndex = 0;
      panel.textContent = definition.text;
      panels.push(panel);
    });
    scriptPanel.appendChild(tabList);
    panels.forEach(function (panel) {
      scriptPanel.appendChild(panel);
    });
    grid.appendChild(scriptPanel);

    renderCell(grid, "风险提示", result.risks);
    renderCell(grid, "法规依据可追溯", result.source);
    renderCell(grid, "留痕建议", result.record);
    renderCell(grid, "使用边界", "仅可作为脱敏演示中的首轮沟通参考，不构成正式业务结论。");

    var disclosure = document.createElement("p");
    disclosure.className = "fixed-disclaimer";
    disclosure.textContent = "演示内容｜非真实AI调用｜非正式业务结论";

    container.append(banner, grid, disclosure);
    initTabs(tabList, panels);
  }

  window.Showcase.initAssistantDemo = function () {
    var data = window.ShowcaseData.assistantExamples;
    var input = document.getElementById("assistant-question");
    var examples = document.getElementById("assistant-examples");
    var button = document.getElementById("assistant-generate");
    var loading = document.getElementById("assistant-loading");
    var resultContainer = document.getElementById("assistant-result");

    if (!input || !examples || !button || !resultContainer) return;

    data.forEach(function (item, index) {
      var example = document.createElement("button");
      example.type = "button";
      example.className = "example-button";
      example.textContent = "示例" + (index + 1) + "｜" + item.shortLabel;
      example.addEventListener("click", function () {
        input.value = item.question;
        input.dataset.exampleId = item.id;
        input.focus();
      });
      examples.appendChild(example);
    });

    input.addEventListener("input", function () {
      delete input.dataset.exampleId;
    });

    button.addEventListener("click", function () {
      var question = input.value.trim();
      if (!question) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");

      var selected = data.find(function (item) {
        return item.id === input.dataset.exampleId || item.question === question;
      });
      if (!selected) {
        selected = /投诉|赔偿|处分/.test(question)
          ? data[2]
          : /测试|测评|答案/.test(question)
            ? data[1]
            : data[0];
      }

      button.disabled = true;
      loading.hidden = false;
      resultContainer.hidden = true;

      window.setTimeout(function () {
        renderResult(resultContainer, selected);
        loading.hidden = true;
        resultContainer.hidden = false;
        button.disabled = false;
        resultContainer.focus({ preventScroll: true });
        resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 700);
    });
  };
})();
