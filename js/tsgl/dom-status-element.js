"use strict";
class DOMStatusElement {
    constructor(description) {
        this.description = description;
        DOMStatusElement.statusElements.push(this);
        this.createDOM();
        console.log(this.description);
    }
    static setParentDiv(parentDiv) {
        DOMStatusElement.parentDiv = parentDiv;
    }
    static setCssClass(cssClass) {
        DOMStatusElement.cssClass = cssClass;
    }
    updateProgress(progressPercent) {
        if (progressPercent > 0) {
            this.progressDOM.value = progressPercent;
        }
        else {
            // indeterminate progress bar style
            this.progressDOM.value = -1;
        }
    }
    setFinish() {
        this.progressDOM.value = 100;
        const divToRemove = this.divDOM;
        divToRemove.style.transition = "all 0.5s";
        divToRemove.style.transform += "translateY(-50%)";
        divToRemove.style.opacity = "0";
        setTimeout(() => {
            divToRemove.remove();
        }, 250);
    }
    createDOM() {
        if (DOMStatusElement.parentDiv) {
            this.divDOM = document.createElement("div");
            this.paragraphDOM = document.createElement("p");
            this.progressDOM = document.createElement("progress");
            this.paragraphDOM.innerText = this.description;
            this.progressDOM.max = 100;
            this.progressDOM.value = -1;
            this.divDOM.appendChild(this.paragraphDOM);
            this.divDOM.appendChild(this.progressDOM);
            this.divDOM.classList.add(DOMStatusElement.cssClass);
            DOMStatusElement.parentDiv.appendChild(this.divDOM);
        }
    }
}
DOMStatusElement.statusElements = [];
