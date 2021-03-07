"use strict";

DOMStatusElement.setParentDiv(LOADING_AREA);

const dataset: SphericalDataset = new SphericalDataset(TEST_DATASET_PATHS);
dataset.listenForTestButtonClick(TEST_BUTTON);

async function startCalculation(): Promise<void> {
   INPUT_AREA.style.display = "none";

   const imageSet: {
      north: HTMLImageElement;
      east: HTMLImageElement;
      south: HTMLImageElement;
      west: HTMLImageElement;
      all: HTMLImageElement;
      front: HTMLImageElement;
   } = await dataset.getImageSet(0, 0);

   const angleDistance: number = 1;
   const angles: number[] = new Array(360 / angleDistance);

   let angleOffset: number = 1;
   for (let i = 0; i < angles.length; i++) {
      angles[i] = angleOffset;
      angleOffset += angleDistance;
   }

   const normalMap: NormalMap = new NormalMap(
      imageSet,
      NORMAL_CALCULATION_METHOD.RAPID_GRADIENT
   );

   const pointCloud: PointCloud = new PointCloud(
      normalMap,
      imageSet.all.width,
      imageSet.all.height,
      0.05,
      25000,
      angles
   );

   await pointCloud.calculate();

   const pointCloudRenderer = new PointCloudRenderer(
      pointCloud,
      POINT_CLOUD_AREA,
      false
   );

   setTimeout(pointCloudRenderer.startRendering.bind(pointCloudRenderer));
   //pointCloud.downloadObj("monkey", null);

   //POINT_CLOUD_AREA.appendChild(normalMap.getAsJsImageObject());
}

TEST_BUTTON.addEventListener("click", startCalculation);
