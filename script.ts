"use strict";

DOMStatusElement.setParentDiv(LOADING_AREA);

const dataset: SphericalDataset = new SphericalDataset(TEST_DATASET_PATHS);
dataset.listenForTestButtonClick(TEST_BUTTON);

async function startCalculation(): Promise<void> {
   INPUT_AREA.style.display = "none";

   const rotations: { azimuthal: number; polar: number }[] = [
      { azimuthal: 0, polar: 0 }, // front
      { azimuthal: 90, polar: 90 }, //top
      //{ azimuthal: 0, polar: 90 }, // right
   ];
   const pointCloudThreadPool: ThreadPool = new ThreadPool(
      new DOMStatusElement("Calculating point cloud.")
   );

   for (let i = 0, length = rotations.length; i < length; i++) {
      pointCloudThreadPool.add(getPointCloud.bind(null, dataset, rotations[i]));
   }

   const pointClouds: PointCloud[] = await pointCloudThreadPool.run();

   const vertices: number[] = [];
   for (let i = 0, length = pointClouds.length; i < length; i++) {
      const newVertices: number[] = pointClouds[i].getGpuVertices();
      vertices.push(...newVertices);
   }

   const pointCloudRenderer = new PointCloudRenderer(
      vertices,
      POINT_CLOUD_AREA
   );

   setTimeout(pointCloudRenderer.startRendering.bind(pointCloudRenderer));
   //pointCloud.downloadObj("monkey", null);

   //POINT_CLOUD_AREA.appendChild(normalMap.getAsJsImageObject());
}

async function getPointCloud(
   dataset: SphericalDataset,
   rotation: { azimuthal: number; polar: number }
): Promise<PointCloud> {
   const imageSet = await dataset.getImageSet(
      rotation.azimuthal,
      rotation.polar
   );

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

   const mask: Uint8Array = getMask(imageSet);

   const pointCloud: PointCloud = new PointCloud(
      normalMap,
      imageSet.all.width,
      imageSet.all.height,
      0.05,
      25000,
      angles,
      { azimuthal: rotation.azimuthal, polar: rotation.polar },
      mask
   );

   await pointCloud.calculate();

   return pointCloud;
}

function getMask(imageSet: {
   north: HTMLImageElement;
   east: HTMLImageElement;
   south: HTMLImageElement;
   west: HTMLImageElement;
   all: HTMLImageElement;
   front: HTMLImageElement;
}): Uint8Array {
   const maskShader: Shader = new Shader({
      width: imageSet.all.width,
      height: imageSet.all.height,
   });
   maskShader.bind();
   const all: GlslFloat = GlslImage.load(imageSet.all).getLuminanceFloat();
   const north: GlslFloat = GlslImage.load(imageSet.north).getLuminanceFloat();
   const east: GlslFloat = GlslImage.load(imageSet.east).getLuminanceFloat();
   const south: GlslFloat = GlslImage.load(imageSet.south).getLuminanceFloat();
   const front: GlslFloat = GlslImage.load(imageSet.front).getLuminanceFloat();

   const minimum: GlslFloat = all.minimum(north, east, south, front);
   const maximum: GlslFloat = all.maximum(north, east, south, front);
   const difference: GlslFloat = maximum.subtractFloat(minimum);

   const mask: Uint8Array = GlslRendering.render(
      new GlslVector3([difference, difference, difference]).getVector4()
   ).getPixelArray();

   return mask;
}

TEST_BUTTON.addEventListener("click", startCalculation);
