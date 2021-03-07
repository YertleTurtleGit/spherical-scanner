"use strict";

class SphericalDataset {
   private testDatasetPaths: string[];
   private imagePointer: {
      cameraAzimuthalAngle: number;
      cameraPolarAngle: number;
      lightAzimuthalAngle: number;
      lightPolarAngle: number;
      path: string;
   }[] = [];

   constructor(testDatasetPaths: string[]) {
      this.testDatasetPaths = testDatasetPaths;
   }

   public listenForTestButtonClick(testButton: HTMLButtonElement): void {
      testButton.addEventListener("click", this.testButtonClicked.bind(this));
   }

   public listenForAddImagesButtonClick(
      addImagesButton: HTMLButtonElement
   ): void {
      // TODO: Implement.
   }

   public async getImageSet(
      cameraAzimuthalAngle: number,
      cameraPolarAngle: number
   ): Promise<{
      north: HTMLImageElement;
      east: HTMLImageElement;
      south: HTMLImageElement;
      west: HTMLImageElement;
      all: HTMLImageElement;
      front: HTMLImageElement;
   }> {
      const imageSetThreadPool: ThreadPool = new ThreadPool(
         new DOMStatusElement("Loading images.")
      );

      imageSetThreadPool.add(
         this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 270),
         this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 0),
         this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 90),
         this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 180),
         this.getImage.bind(
            this,
            cameraAzimuthalAngle,
            cameraPolarAngle,
            Infinity,
            Infinity
         ),
         this.getImage.bind(this, cameraAzimuthalAngle, cameraPolarAngle, 0, 0)
      );

      const imageSet: HTMLImageElement[] = await imageSetThreadPool.run();
      return {
         north: imageSet[0],
         east: imageSet[1],
         south: imageSet[2],
         west: imageSet[3],
         all: imageSet[4],
         front: imageSet[5],
      };
   }

   private getImage(
      cameraAzimuthalAngle: number,
      cameraPolarAngle: number,
      lightAzimuthalAngle: number,
      lightPolarAngle: number = 90
   ): Promise<HTMLImageElement> {
      for (let i = 0, length = this.imagePointer.length; i < length; i++) {
         const imagePointer = this.imagePointer[i];
         if (
            imagePointer.cameraAzimuthalAngle === cameraAzimuthalAngle &&
            imagePointer.cameraPolarAngle === cameraPolarAngle &&
            imagePointer.lightAzimuthalAngle === lightAzimuthalAngle &&
            imagePointer.lightPolarAngle === lightPolarAngle
         ) {
            const imagePath: string = imagePointer.path;
            return new Promise((resolve) => {
               const image = new Image();
               image.addEventListener("load", () => {
                  resolve(image);
               });
               image.src = imagePath;
            });
         }
      }
      console.error(
         "Image with ca: " +
            cameraAzimuthalAngle +
            ", cp: " +
            cameraPolarAngle +
            "and la: " +
            lightAzimuthalAngle +
            " not found."
      );
      return null;
   }

   private testButtonClicked(): void {
      for (let i = 0, length = this.testDatasetPaths.length; i < length; i++) {
         const imagePath: string = this.testDatasetPaths[i];

         let lightAzimuthalAngle: number;
         let lightPolarAngle: number = 90;

         const lightAzimuthalAngleName: string = imagePath
            .split("l-")[1]
            .substring(0, 3);

         if (lightAzimuthalAngleName === "all") {
            lightAzimuthalAngle = Infinity;
            lightPolarAngle = Infinity;
            //TODO: Fix fro to front
         } else if (lightAzimuthalAngleName === "fro") {
            lightAzimuthalAngle = 0;
            lightPolarAngle = 0;
         } else {
            lightAzimuthalAngle = Number(lightAzimuthalAngleName);
         }

         const imagePointer: {
            cameraAzimuthalAngle: number;
            cameraPolarAngle: number;
            lightAzimuthalAngle: number;
            lightPolarAngle: number;
            path: string;
         } = {
            cameraAzimuthalAngle: Number(
               imagePath.split("ca-")[1].substring(0, 3)
            ),
            cameraPolarAngle: Number(imagePath.split("cp-")[1].substring(0, 3)),
            lightAzimuthalAngle: lightAzimuthalAngle,
            lightPolarAngle: lightPolarAngle,
            path: imagePath,
         };

         this.imagePointer.push(imagePointer);
      }
   }
}
