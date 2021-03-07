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
    async getImageSet(cameraAzimuthalAngle, cameraPolarAngle) {
        const imageSetThreadPool = new ThreadPool(new DOMStatusElement("Loading images."));
        imageSetThreadPool.add(this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 270), this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 0), this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 90), this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 180), this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, Infinity, Infinity), this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 0, 0));
        const imageSet = await imageSetThreadPool.run();
        return {
            north: imageSet[0],
            east: imageSet[1],
            south: imageSet[2],
            west: imageSet[3],
            all: imageSet[4],
            front: imageSet[5],
        };
    }
    getImage(cameraAzimuthalAngle, cameraPolarAngle, lightAzimuthalAngle, lightPolarAngle = 90) {
        for (let i = 0, length = this.imagePointer.length; i < length; i++) {
            const imagePointer = this.imagePointer[i];
            if (imagePointer.cameraAzimuthalAngle === cameraAzimuthalAngle &&
                imagePointer.cameraPolarAngle === cameraPolarAngle &&
                imagePointer.lightAzimuthalAngle === lightAzimuthalAngle &&
                imagePointer.lightPolarAngle === lightPolarAngle) {
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
            let lightAzimuthalAngle;
            let lightPolarAngle = 90;
            const lightAzimuthalAngleName = imagePath
                .split("l-")[1]
                .substring(0, 3);
            if (lightAzimuthalAngleName === "all") {
                lightAzimuthalAngle = Infinity;
                lightPolarAngle = Infinity;
                //TODO: Fix fro to front
            }
            else if (lightAzimuthalAngleName === "fro") {
                lightAzimuthalAngle = 0;
                lightPolarAngle = 0;
            }
            else {
                lightAzimuthalAngle = Number(lightAzimuthalAngleName);
            }
            const imagePointer = {
                cameraAzimuthalAngle: Number(imagePath.split("ca-")[1].substring(0, 3)),
                cameraPolarAngle: Number(imagePath.split("cp-")[1].substring(0, 3)),
                lightAzimuthalAngle: lightAzimuthalAngle,
                lightPolarAngle: lightPolarAngle,
                path: imagePath,
            };
            this.imagePointer.push(imagePointer);
        }
    }
}
