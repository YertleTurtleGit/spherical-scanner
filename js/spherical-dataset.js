"use strict";
class SphericalDataset {
    constructor(testDatasetPaths) {
        this.imagePointer = [];
        this.testDatasetPaths = testDatasetPaths;
    }
    listenForTestButtonClick(testButton) {
        testButton.addEventListener("click", this.testButtonClicked.bind(this));
    }
    listenForAddImagesButtonClick(addImagesButton) {
        // TODO: Implement.
    }
    getImagePointer() {
        return this.imagePointer;
    }
    getImage(cameraAzimuthalAngle, cameraPolarAngle, lightAzimuthalAngle) {
        for (let i = 0, length = this.imagePointer.length; i < length; i++) {
            const imagePointer = this.imagePointer[i];
            if (imagePointer.cameraAzimuthalAngle === cameraAzimuthalAngle &&
                imagePointer.cameraPolarAngle === cameraPolarAngle &&
                imagePointer.lightAzimuthalAngle === lightAzimuthalAngle) {
                const imagePath = imagePointer.path;
                return new Promise((resolve) => {
                    const image = new Image();
                    image.addEventListener("load", () => {
                        resolve(image);
                    });
                    image.src = imagePath;
                });
            }
        }
        console.error("Image with ca: " +
            cameraAzimuthalAngle +
            ", cp: " +
            cameraPolarAngle +
            "and la: " +
            lightAzimuthalAngle +
            " not found.");
        return null;
    }
    testButtonClicked() {
        for (let i = 0, length = this.testDatasetPaths.length; i < length; i++) {
            const imagePath = this.testDatasetPaths[i];
            const imagePointer = {
                cameraAzimuthalAngle: Number(imagePath.split("ca-")[1].substring(0, 3)),
                cameraPolarAngle: Number(imagePath.split("cp-")[1].substring(0, 3)),
                lightAzimuthalAngle: Number(imagePath.split("la-")[1].substring(0, 3)),
                path: imagePath,
            };
            console.log(imagePointer);
            this.imagePointer.push(imagePointer);
        }
    }
}
