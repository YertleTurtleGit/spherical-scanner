"use strict";
DOMStatusElement.setParentDiv(LOADING_AREA);
const dataset = new SphericalDataset(TEST_DATASET_PATHS);
dataset.listenForTestButtonClick(TEST_BUTTON);
async function startCalculation() {
    INPUT_AREA.style.display = "none";
    const imageSet = await dataset.getImageSet(0, 0);
    const normalMap = new NormalMap(imageSet, 0 /* RAPID_GRADIENT */);
    await normalMap.calculate();
    const angleDistance = 1;
    const angles = new Array(360 / angleDistance);
    let angleOffset = 0;
    for (let i = 0; i < angles.length; i++) {
        angles[i] = angleOffset;
        angleOffset += angleDistance;
    }
    const pointCloud = new PointCloud(normalMap, imageSet.all.width, imageSet.all.height, 0.01, 25000, angles, normalMap.getAsPixelArray());
    await pointCloud.calculate();
    const pointCloudRenderer = new PointCloudRenderer(pointCloud, POINT_CLOUD_AREA, false);
    //setTimeout(pointCloudRenderer.startRendering.bind(pointCloudRenderer));
    POINT_CLOUD_AREA.appendChild(normalMap.getAsJsImageObject());
}
TEST_BUTTON.addEventListener("click", startCalculation);
