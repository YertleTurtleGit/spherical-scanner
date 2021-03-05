"use strict";

const STATUS_ELEMENT = document.getElementById("current-task-info");


function statusCallback(
   description: string,
   level: number,
   percent: number = undefined
): void {
   if (!percent) {
      console.log(description);
   }
   if (level <= 2) {
      const domStatus: HTMLDivElement = document.createElement("div");
      const domDescription: HTMLParagraphElement = document.createElement("p");
      domStatus.appendChild(domDescription);
      if (percent) {
         const domProgress: HTMLProgressElement = document.createElement(
            "progress"
         );
         domProgress.max = 100;
         domProgress.value = percent;
         domStatus.appendChild(domProgress);
      }
      STATUS_ELEMENT.appendChild(domStatus);
   }
}
