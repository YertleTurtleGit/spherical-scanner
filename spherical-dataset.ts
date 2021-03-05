"use strict";

class SphericalDataset {
   private testDatasetPaths: string[];
   private imagePointer: {
      cameraAzimuthalAngle: number;
      cameraPolarAngle: number;
      lightAzimuthalAngle: number;
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

   public getImagePointer(): {
      cameraAzimuthalAngle: number;
      cameraPolarAngle: number;
      lightAzimuthalAngle: number;
      path: string;
   }[] {
      return this.imagePointer;
   }

   public getImage(
      cameraAzimuthalAngle: number,
      cameraPolarAngle: number,
      lightAzimuthalAngle: number
   ): Promise<HTMLImageElement> {
      for (let i = 0, length = this.imagePointer.length; i < length; i++) {
         const imagePointer = this.imagePointer[i];
         if (
            imagePointer.cameraAzimuthalAngle === cameraAzimuthalAngle &&
            imagePointer.cameraPolarAngle === cameraPolarAngle &&
            imagePointer.lightAzimuthalAngle === lightAzimuthalAngle
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

         const imagePointer: {
            cameraAzimuthalAngle: number;
            cameraPolarAngle: number;
            lightAzimuthalAngle: number;
            path: string;
         } = {
            cameraAzimuthalAngle: Number(
               imagePath.split("ca-")[1].substring(0, 3)
            ),
            cameraPolarAngle: Number(imagePath.split("cp-")[1].substring(0, 3)),
            lightAzimuthalAngle: Number(
               imagePath.split("la-")[1].substring(0, 3)
            ),
            path: imagePath,
         };

         console.log(imagePointer);

         this.imagePointer.push(imagePointer);
      }
   }
}
