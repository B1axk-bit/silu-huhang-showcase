(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var modules = [
      "initNavigation",
      "initAssistantDemo",
      "initSelfCheckDemo",
      "initCaseDemo",
      "initOnboardingDemo"
    ];

    modules.forEach(function (moduleName) {
      if (window.Showcase && typeof window.Showcase[moduleName] === "function") {
        window.Showcase[moduleName]();
      }
    });
  });
})();
