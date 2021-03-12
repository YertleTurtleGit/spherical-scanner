"use strict";
DOMStatusElement.setParentDiv(LOADING_AREA);
const dataset = new SphericalDataset(TEST_DATASET_PATHS);
dataset.listenForTestButtonClick(TEST_BUTTON);
async function startCalculation() {
    INPUT_AREA.style.display = "none";
    const rotations = [
        { azimuthal: 0, polar: 0 },
        { azimuthal: 0, polar: 180 }, // back
        //{ azimuthal: 90, polar: 90 }, //top
        //{ azimuthal: 0, polar: 90 }, // right
    ];
    const pointCloudThreadPool = new ThreadPool(new DOMStatusElement("Calculating point cloud."));
    for (let i = 0, length = rotations.length; i < length; i++) {
        pointCloudThreadPool.add(getPointCloud.bind(null, dataset, rotations[i]));
    }
    const pointClouds = await pointCloudThreadPool.run();
    const pointCloudRenderer = new PointCloudRenderer(pointClouds, POINT_CLOUD_AREA);
    setTimeout(pointCloudRenderer.startRendering.bind(pointCloudRenderer));
    //pointCloud.downloadObj("monkey", null);
    //POINT_CLOUD_AREA.appendChild(normalMap.getAsJsImageObject());
}
async function getPointCloud(dataset, rotation) {
    const imageSet = await dataset.getImageSet(rotation.azimuthal, rotation.polar);
    const angleDistance = 1;
    const angles = new Array(360 / angleDistance);
    let angleOffset = 1;
    for (let i = 0; i < angles.length; i++) {
        angles[i] = angleOffset;
        angleOffset += angleDistance;
    }
    const normalMap = new NormalMap(imageSet, 0 /* RAPID_GRADIENT */);
    const mask = getMask(imageSet);
    const pointCloud = new PointCloud(normalMap, imageSet.all.width, imageSet.all.height, 0.05, 25000, angles, { azimuthal: rotation.azimuthal, polar: rotation.polar }, mask);
    await pointCloud.calculate();
    return pointCloud;
}
function getMask(imageSet) {
    const maskShader = new Shader({
        width: imageSet.all.width,
        height: imageSet.all.height,
    });
    maskShader.bind();
    const all = GlslImage.load(imageSet.all).getLuminanceFloat();
    const north = GlslImage.load(imageSet.north).getLuminanceFloat();
    const east = GlslImage.load(imageSet.east).getLuminanceFloat();
    const south = GlslImage.load(imageSet.south).getLuminanceFloat();
    const front = GlslImage.load(imageSet.front).getLuminanceFloat();
    const minimum = all.minimum(north, east, south, front);
    const maximum = all.maximum(north, east, south, front);
    const difference = maximum.subtractFloat(minimum);
    const mask = GlslRendering.render(new GlslVector3([difference, difference, difference]).getVector4()).getPixelArray();
    return mask;
}
TEST_BUTTON.addEventListener("click", startCalculation);
