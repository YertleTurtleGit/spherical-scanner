"use strict";
const STATUS_ELEMENT = document.getElementById("current-task-info");
function statusCallback(description, level, percent = undefined) {
    if (!percent) {
        console.log(description);
    }
    if (level <= 2) {
        const domStatus = document.createElement("div");
        const domDescription = document.createElement("p");
        domStatus.appendChild(domDescription);
        if (percent) {
            const domProgress = document.createElement("progress");
            domProgress.max = 100;
            domProgress.value = percent;
            domStatus.appendChild(domProgress);
        }
        STATUS_ELEMENT.appendChild(domStatus);
    }
}
