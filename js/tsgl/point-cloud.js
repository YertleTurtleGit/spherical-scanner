"use strict";
const DEGREE_TO_RADIAN_FACTOR = Math.PI / 180;
const SLOPE_SHIFT = -(255 / 2);
class PointCloud {
    constructor(normalMap, width, height, depthFactor, maxVertexCount, azimuthalAngles, vertexAlbedoColors) {
        this.gpuVertexErrorColors = [];
        this.normalMap = normalMap;
        this.depthFactor = depthFactor;
        this.width = width;
        this.height = height;
        this.maxVertexCount = maxVertexCount;
        this.azimuthalAngles = azimuthalAngles;
        this.vertexAlbedoColors = vertexAlbedoColors;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getAzimuthalAngles() {
        return this.azimuthalAngles;
    }
    downloadObj(filename, vertexColorArray, button) {
        button.style.display = "none";
        const cThis = this;
        setTimeout(() => {
            filename += ".obj";
            let element = document.createElement("a");
            element.style.display = "none";
            let blob = new Blob([cThis.getObjString()], {
                type: "text/plain; charset = utf-8",
            });
            let url = window.URL.createObjectURL(blob);
            element.setAttribute("href", window.URL.createObjectURL(blob));
            element.setAttribute("download", filename);
            document.body.appendChild(element);
            element.click();
            window.URL.revokeObjectURL(url);
            element.remove();
            setTimeout(() => {
                button.style.display = "inherit";
            }, 500);
        });
    }
    getEdgeFramePixels() {
        if (this.edgeFramePixels === undefined) {
            this.edgeFramePixels = [];
            const topY = -1;
            const bottomY = this.height;
            const leftX = -1;
            const rightX = this.width;
            for (let x = 0; x < this.width; x++) {
                this.edgeFramePixels.push({ x: x, y: topY });
                this.edgeFramePixels.push({ x: x, y: bottomY });
            }
            for (let y = 0; y < this.height; y++) {
                this.edgeFramePixels.push({ x: leftX, y: y });
                this.edgeFramePixels.push({ x: rightX, y: y });
            }
        }
        return this.edgeFramePixels;
    }
    isInDimensions(pixel) {
        return (pixel.x < this.width &&
            pixel.y < this.height &&
            pixel.x >= 0 &&
            pixel.y >= 0);
    }
    getPixelLine(startPixel, stepVector, gradientPixelArray) {
        const pixelLine = [];
        const stepOffset = {
            x: startPixel.x,
            y: startPixel.y,
        };
        const pixel = {
            x: startPixel.x,
            y: startPixel.y,
        };
        const nextPixel = { x: pixel.x, y: pixel.y };
        let inDimensions;
        do {
            do {
                stepOffset.x += stepVector.x;
                stepOffset.y += stepVector.y;
                nextPixel.x = Math.round(stepOffset.x);
                nextPixel.y = Math.round(stepOffset.y);
            } while (nextPixel.x === pixel.x && nextPixel.y === pixel.y);
            pixel.x = nextPixel.x;
            pixel.y = nextPixel.y;
            inDimensions = this.isInDimensions(pixel);
            if (inDimensions) {
                const pixelSlope = this.getPixelSlope(pixel, stepVector, gradientPixelArray);
                pixelLine.push({ x: pixel.x, y: pixel.y, slope: pixelSlope });
            }
        } while (inDimensions);
        return pixelLine;
    }
    getPixelLinesFromAzimuthalAngle(azimuthalAngle, gradientPixelArray) {
        const pixelLines = [];
        // Inverse and thus, line FROM and NOT TO azimuthal angle.
        azimuthalAngle += 180;
        const azimuthalAngleInRadians = azimuthalAngle * DEGREE_TO_RADIAN_FACTOR;
        const stepVector = {
            x: Math.cos(azimuthalAngleInRadians),
            y: Math.sin(azimuthalAngleInRadians),
        };
        const minimumStep = 0.00000001;
        if (stepVector.x < minimumStep && stepVector.x > -minimumStep) {
            stepVector.x = 0;
        }
        if (stepVector.y < minimumStep && stepVector.y > -minimumStep) {
            stepVector.y = 0;
        }
        for (let i = 0; i < this.getEdgeFramePixels().length; i++) {
            const startPixel = this.getEdgeFramePixels()[i];
            const pixelLine = this.getPixelLine(startPixel, stepVector, gradientPixelArray);
            if (pixelLine.length > 1) {
                pixelLines.push(pixelLine);
            }
        }
        return pixelLines;
    }
    isPixelMaskedOut(pixelIndex) {
        let normal = {
            red: this.normalMap.getAsPixelArray()[pixelIndex + 0 /* RED */],
            green: this.normalMap.getAsPixelArray()[pixelIndex + 1 /* GREEN */],
            blue: this.normalMap.getAsPixelArray()[pixelIndex + 2 /* BLUE */],
        };
        if (normal.blue >= 255 * 0.9) {
            return true;
        }
        return false;
    }
    getPixelSlope(pixel, stepVector, gradientPixelArray) {
        const index = (pixel.x + pixel.y * this.width) * 4;
        const rightSlope = gradientPixelArray[index + 0 /* RED */] + SLOPE_SHIFT;
        const topSlope = gradientPixelArray[index + 1 /* GREEN */] + SLOPE_SHIFT;
        return stepVector.x * rightSlope + stepVector.y * topSlope;
    }
    getLocalGradientFactor() {
        const normalMapImage = this.normalMap.getAsJsImageObject();
        const width = normalMapImage.width;
        const height = normalMapImage.height;
        let pointCloudShader = new Shader(width, height);
        pointCloudShader.bind();
        const glslNormalMap = GlslImage.load(normalMapImage);
        const red = glslNormalMap.channel(0 /* RED */);
        const green = glslNormalMap.channel(1 /* GREEN */);
        const blue = glslNormalMap.channel(2 /* BLUE */);
        const result = new GlslVector3([
            red.divideFloat(blue),
            green.divideFloat(blue),
            blue,
        ]);
        const gradientPixelArray = GlslRendering.render(result.getVector4()).getPixelArray();
        pointCloudShader.purge();
        return gradientPixelArray;
    }
    calculateAnisotropicIntegral(azimuthalAngle, gradientPixelArray) {
        const integral = new Array(this.width * this.height);
        let pixelLines = this.getPixelLinesFromAzimuthalAngle(azimuthalAngle, gradientPixelArray);
        /*console.log(
           "Calculating " +
              pixelLines.length +
              " integrals from azimuthal angle " +
              azimuthalAngle +
              ".",
           3
        );*/
        for (let j = 0; j < pixelLines.length; j++) {
            let lineOffset = 0;
            for (let k = 0; k < pixelLines[j].length; k++) {
                const index = pixelLines[j][k].x + pixelLines[j][k].y * this.width;
                integral[index] = lineOffset;
                lineOffset += pixelLines[j][k].slope * -this.depthFactor;
            }
        }
        return integral;
    }
    summarizeHorizontalImageLine(y, samplingRateStepX, resolution, normalMapPixelArray) {
        const result = { averageError: 0, highestError: 0, zErrors: new Array(this.width) };
        for (let x = 0; x < this.width; x += samplingRateStepX) {
            const index = x + y * this.width;
            const vectorIndex = index * 3;
            const colorIndex = index * 4;
            let zAverage = 0;
            let zError = 0;
            let averageDivisor = this.integrals.length;
            for (let i = 0; i < this.integrals.length; i++) {
                const currentZ = this.integrals[i][index];
                if (!isNaN(currentZ)) {
                    zAverage += currentZ;
                    if (i !== 0) {
                        zError += Math.abs(this.integrals[0][index] - currentZ);
                    }
                }
            }
            zAverage /= averageDivisor;
            zError /= averageDivisor;
            result.averageError += zError / resolution;
            result.highestError = Math.max(result.highestError, zError);
            result.zErrors[x] = zError;
            this.gpuVertices[vectorIndex + 0 /* X */] = x / this.width - 0.5;
            this.gpuVertices[vectorIndex + 1 /* Y */] = y / this.width - 0.5;
            this.gpuVertices[vectorIndex + 2 /* Z */] =
                zAverage / this.width - 0.5;
            const red = this.vertexAlbedoColors[colorIndex + 0 /* RED */] / 255;
            const green = this.vertexAlbedoColors[colorIndex + 1 /* GREEN */] / 255;
            const blue = this.vertexAlbedoColors[colorIndex + 2 /* BLUE */] / 255;
            this.gpuVertexAlbedoColors[vectorIndex + 0 /* RED */] = red;
            this.gpuVertexAlbedoColors[vectorIndex + 1 /* GREEN */] = green;
            this.gpuVertexAlbedoColors[vectorIndex + 2 /* BLUE */] = blue;
            const normalRed = normalMapPixelArray[colorIndex + 0 /* RED */] / 255;
            const normalGreen = normalMapPixelArray[colorIndex + 1 /* GREEN */] / 255;
            const normalBlue = normalMapPixelArray[colorIndex + 2 /* BLUE */] / 255;
            this.gpuVertexNormalColors[vectorIndex + 0 /* RED */] = normalRed;
            this.gpuVertexNormalColors[vectorIndex + 1 /* GREEN */] = normalGreen;
            this.gpuVertexNormalColors[vectorIndex + 2 /* BLUE */] = normalBlue;
            this.objString +=
                "v " +
                    x +
                    " " +
                    y +
                    " " +
                    zAverage +
                    " " +
                    red +
                    " " +
                    green +
                    " " +
                    blue +
                    "\n";
        }
        return result;
    }
    async calculate() {
        const gradientDOMStatus = new DOMStatusElement("Calculating slopes.");
        const integralDOMStatus = new DOMStatusElement("Integrating normal mapping.");
        const summarizeDOMStatus = new DOMStatusElement("Summarizing data.");
        const gradientThreadPool = new ThreadPool(gradientDOMStatus);
        gradientThreadPool.add(this.getLocalGradientFactor.bind(this));
        const gradientPixelArrayPromise = await gradientThreadPool.run();
        const gradientPixelArray = gradientPixelArrayPromise[0];
        const integralThreadPool = new ThreadPool(integralDOMStatus);
        for (let i = 0, length = this.azimuthalAngles.length; i < length; i++) {
            const integralMethod = this.calculateAnisotropicIntegral.bind(this, this.azimuthalAngles[i], gradientPixelArray);
            integralThreadPool.add(integralMethod);
        }
        this.integrals = await integralThreadPool.run();
        this.objString = "";
        let resolution = this.width * this.height;
        let samplingRateStep = { x: 1, y: 1 };
        /* TODO: Fix point cloud sampling.
        while (resolution > this.maxVertexCount) {
           samplingRateStep.x += 0.01 * (this.width / this.height);
           samplingRateStep.y += 0.01 * (this.height / this.width);
  
           resolution =
              (this.width / samplingRateStep.x) *
              (this.height / samplingRateStep.y);
        }
        */
        const dimensionSingleChannel = this.width * this.height;
        const dimensionThreeChannel = dimensionSingleChannel * 3;
        const zErrors = new Array(dimensionSingleChannel);
        this.gpuVertices = new Array(dimensionThreeChannel);
        this.gpuVertexAlbedoColors = new Array(dimensionThreeChannel);
        this.gpuVertexNormalColors = new Array(dimensionThreeChannel);
        const normalMapPixelArray = this.normalMap.getAsPixelArray();
        const summerizeThreadPool = new ThreadPool(summarizeDOMStatus);
        for (let y = 0; y < this.height; y += samplingRateStep.y) {
            const summerizeMethod = this.summarizeHorizontalImageLine.bind(this, y, samplingRateStep.x, resolution, normalMapPixelArray);
            summerizeThreadPool.add(summerizeMethod);
        }
        const results = await summerizeThreadPool.run();
        let highestError = 0;
        let averageError = 0;
        for (let j = 0, length = results.length; j < length; j++) {
            highestError = Math.max(...results[j].zErrors, highestError);
            averageError += results[j].averageError;
        }
        for (let j = 0, length = results.length; j < length; j++) {
            const zErrorsLine = results[j].zErrors;
            for (let i = 0, length = zErrorsLine.length; i < length; i++) {
                this.gpuVertexErrorColors.push(zErrorsLine[i] / highestError, 1 - zErrorsLine[i] / highestError, 0);
                zErrors.push(zErrorsLine[i]);
            }
        }
        console.log("Average error of z values: " + averageError, 1);
        /*console.log(
           "Reduced point cloud resolution by around " +
              Math.round(100 - (resolution / (this.width * this.height)) * 100) +
              " percent. Currently " +
              this.gpuVertices.length / 3 +
              " vertices."
        );*/
    }
    getAnglesZValues() {
        return this.integrals;
    }
    getObjString() {
        return this.objString;
    }
    getGpuVertices() {
        return this.gpuVertices;
    }
    getGpuVertexAlbedoColors() {
        return this.gpuVertexAlbedoColors;
    }
    getGpuVertexNormalColors() {
        return this.gpuVertexNormalColors;
    }
    getGpuVertexErrorColors() {
        return this.gpuVertexErrorColors;
    }
}
