(function () {
  "use strict";

  window.Showcase = window.Showcase || {};

  var giftActions = [
    "暂停对外发布和执行；",
    "核对公司审批方案；",
    "删除未经批准的礼品或利益安排；",
    "必要时提交有权岗位复核；",
    "完整保留活动方案及沟通记录。"
  ];

  function getAnswers(form, questions) {
    return questions.reduce(function (answers, question) {
      var checked = form.querySelector('input[name="' + question.id + '"]:checked');
      answers[question.id] = checked ? checked.value : "unknown";
      return answers;
    }, {});
  }

  function evaluate(questions, answers) {
    var confirmedRisks = questions.filter(function (question) {
      var answer = answers[question.id];
      return answer !== "unknown" && answer !== question.safeAnswer;
    });
    var unknownQuestions = questions.filter(function (question) {
      return answers[question.id] === "unknown";
    });
    var hardRisks = confirmedRisks.filter(function (question) {
      return question.hardStop;
    });
    var completionRisks = confirmedRisks.filter(function (question) {
      return !question.hardStop;
    });

    var outcome = "no_known_blocker";
    if (hardRisks.length) outcome = "stop_and_escalate";
    else if (unknownQuestions.length || completionRisks.length) outcome = "complete_before_proceeding";

    return {
      outcome: outcome,
      triggeredReasons: confirmedRisks.map(function (question) {
        return question.riskMessage;
      }),
      pendingItems: unknownQuestions
        .map(function (question) {
          return "「" + question.text + "」当前为待确认，请完成核实。";
        })
        .concat(
          completionRisks.map(function (question) {
            return question.riskMessage;
          })
        ),
      hardRisks: hardRisks
    };
  }

  function renderResult(container, evaluation) {
    var labels = {
      stop_and_escalate: "暂停并升级",
      complete_before_proceeding: "补充后再开展",
      no_known_blocker: "暂未发现阻断项"
    };
    var descriptions = {
      stop_and_escalate: "已明确命中硬性风险，当前不应继续实施相关安排。",
      complete_before_proceeding: "没有已确认的硬性风险，但仍有事实或准备事项需要完成。",
      no_known_blocker: "根据当前演示答案，暂未发现阻断项；仍不构成业务审批或合规批准。"
    };

    container.replaceChildren();
    var label = document.createElement("span");
    label.className = "outcome-label";
    label.textContent = "自查结果";
    var heading = document.createElement("h3");
    heading.textContent = labels[evaluation.outcome];
    var description = document.createElement("p");
    description.textContent = descriptions[evaluation.outcome];
    container.append(label, heading, description);

    if (evaluation.triggeredReasons.length) {
      var reasons = document.createElement("div");
      reasons.className = "result-block";
      var reasonsTitle = document.createElement("strong");
      reasonsTitle.textContent = "已确认触发原因";
      var reasonsList = document.createElement("ul");
      evaluation.triggeredReasons.forEach(function (reason) {
        var li = document.createElement("li");
        li.textContent = reason;
        reasonsList.appendChild(li);
      });
      reasons.append(reasonsTitle, reasonsList);
      container.appendChild(reasons);
    }

    if (evaluation.pendingItems.length) {
      var pending = document.createElement("div");
      pending.className = "result-block";
      var pendingTitle = document.createElement("strong");
      pendingTitle.textContent = "待补充事项";
      var pendingList = document.createElement("ul");
      evaluation.pendingItems.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        pendingList.appendChild(li);
      });
      pending.append(pendingTitle, pendingList);
      container.appendChild(pending);
    }

    var actions = document.createElement("div");
    actions.className = "result-block";
    var actionsTitle = document.createElement("strong");
    actionsTitle.textContent = "建议动作";
    var actionsList = document.createElement("ul");
    var items;
    if (evaluation.hardRisks.some(function (risk) { return risk.id === "gift"; })) {
      items = giftActions;
    } else if (evaluation.outcome === "stop_and_escalate") {
      items = ["暂停相关安排；", "核实已确认风险；", "按有权流程处理并完整留痕。"];
    } else if (evaluation.outcome === "complete_before_proceeding") {
      items = ["逐项核实待确认事项；", "完成必要方案、材料和留痕准备；", "确认边界后再开展。"];
    } else {
      items = ["按已确认方案执行；", "持续关注事实变化；", "完整保留活动及沟通记录。"];
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      actionsList.appendChild(li);
    });
    actions.append(actionsTitle, actionsList);
    container.appendChild(actions);
  }

  window.Showcase.initSelfCheckDemo = function () {
    var questions = window.ShowcaseData.selfCheckQuestions;
    var form = document.getElementById("self-check-form");
    var list = document.getElementById("self-check-questions");
    var result = document.getElementById("self-check-result");
    var demoButton = document.getElementById("self-check-demo-fill");
    var resetButton = document.getElementById("self-check-reset");

    if (!form || !list || !result) return;

    questions.forEach(function (question, questionIndex) {
      var row = document.createElement("fieldset");
      row.className = "question-row";
      var legend = document.createElement("legend");
      legend.className = "sr-only";
      legend.textContent = question.text;
      var text = document.createElement("p");
      text.innerHTML = "<strong>" + (questionIndex + 1) + ".</strong> " + question.text;
      var group = document.createElement("div");
      group.className = "answer-group";

      [
        { value: "yes", label: "是" },
        { value: "no", label: "否" },
        { value: "unknown", label: "待确认" }
      ].forEach(function (option) {
        var wrapper = document.createElement("span");
        wrapper.className = "answer-option";
        var input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.id = "check-" + question.id + "-" + option.value;
        input.value = option.value;
        input.checked = option.value === "unknown";
        var label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = option.label;
        wrapper.append(input, label);
        group.appendChild(wrapper);
      });

      row.append(legend, text, group);
      list.appendChild(row);
    });

    function update() {
      renderResult(result, evaluate(questions, getAnswers(form, questions)));
    }

    form.addEventListener("change", update);
    demoButton.addEventListener("click", function () {
      var demoAnswers = {
        approval: "unknown",
        materials: "yes",
        gift: "yes",
        audience: "unknown",
        suitability: "unknown",
        record: "unknown",
        data: "unknown"
      };
      Object.keys(demoAnswers).forEach(function (questionId) {
        var input = form.querySelector(
          'input[name="' + questionId + '"][value="' + demoAnswers[questionId] + '"]'
        );
        if (input) input.checked = true;
      });
      update();
      result.focus();
    });
    resetButton.addEventListener("click", function () {
      questions.forEach(function (question) {
        var input = form.querySelector('input[name="' + question.id + '"][value="unknown"]');
        if (input) input.checked = true;
      });
      update();
    });

    update();
  };
})();
