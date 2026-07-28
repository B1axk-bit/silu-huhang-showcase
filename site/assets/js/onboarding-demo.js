(function () {
  "use strict";

  window.Showcase = window.Showcase || {};

  window.Showcase.initOnboardingDemo = function () {
    var timeline = document.getElementById("onboarding-timeline");
    if (!timeline) return;

    window.ShowcaseData.onboardingDays.forEach(function (topic, index) {
      var item = document.createElement("article");
      item.className = "timeline-item";
      var day = document.createElement("span");
      day.className = "timeline-day";
      day.textContent = "第" + (index + 1) + "天";
      var copy = document.createElement("p");
      copy.textContent = topic;
      item.append(day, copy);
      timeline.appendChild(item);
    });
  };
})();
