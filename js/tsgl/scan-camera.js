"use strict";
// https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
// TODO: Separate vector operations.
const SCAN_CAMERA_FOCAL_LENGTH = 50; // in millimeter
const SCAN_CAMERA_SENSOR_WIDTH = 36; // in millimeter
const SCAN_CAMERA_RADIUS = 2; // in meter
class ScanCamera {
    constructor(sphericalPosition, resolution, focalLength = SCAN_CAMERA_FOCAL_LENGTH, sensorWidth = SCAN_CAMERA_SENSOR_WIDTH) {
        this.focalLength = focalLength;
        this.sensorSize = {
            width: sensorWidth,
            height: (resolution.height * sensorWidth) / resolution.width,
        };
        if (sphericalPosition.radius) {
            this.sphericalPosition = {
                azimuthalDeg: sphericalPosition.azimuthalDeg,
                polarDeg: sphericalPosition.polarDeg,
                radius: sphericalPosition.radius,
            };
        }
        else {
            this.sphericalPosition = {
                azimuthalDeg: sphericalPosition.azimuthalDeg,
                polarDeg: sphericalPosition.polarDeg,
                radius: SCAN_CAMERA_RADIUS,
            };
        }
        this.resolution = resolution;
        this.dimensions = this.getImageDimensionsInMillimeter();
        this.eulerPosition = this.getEulerPosition();
        this.singlePixelDimension = this.getSinglePixelSizeInMillimeter();
        this.lookAt = this.getLookAtVector();
        this.back = { x: -this.lookAt.x, y: -this.lookAt.y, z: -this.lookAt.z };
        this.up = this.getUpVector();
        this.down = { x: -this.up.x, y: -this.up.y, z: -this.up.z };
        this.right = this.getRightVector();
        this.left = { x: -this.right.x, y: -this.right.y, z: -this.right.z };
    }
    getGuiLineGpuVertices() {
        const size = 0.1;
        const origin = [
            this.eulerPosition.x / this.sphericalPosition.radius,
            this.eulerPosition.y / this.sphericalPosition.radius,
            this.eulerPosition.z / this.sphericalPosition.radius,
        ];
        const scaledLookAt = {
            x: (-this.lookAt.x * size * 100) / 2,
            y: (-this.lookAt.y * size * 100) / 2,
            z: (-this.lookAt.z * size * 100) / 2,
        };
        const topLeft = [
            this.eulerPosition.x +
                scaledLookAt.x -
                this.left.x / 2 -
                this.up.x / 2,
            this.eulerPosition.y +
                scaledLookAt.y -
                this.left.y / 2 -
                this.up.y / 2,
            this.eulerPosition.z +
                scaledLookAt.z -
                this.left.z / 2 -
                this.up.z / 2,
        ];
        topLeft[0] *= size;
        topLeft[1] *= size;
        topLeft[2] *= size;
        const topRight = [
            this.eulerPosition.x +
                scaledLookAt.x -
                this.right.x / 2 -
                this.up.x / 2,
            this.eulerPosition.y +
                scaledLookAt.y -
                this.right.y / 2 -
                this.up.y / 2,
            this.eulerPosition.z +
                scaledLookAt.z -
                this.right.z / 2 -
                this.up.z / 2,
        ];
        topRight[0] *= size;
        topRight[1] *= size;
        topRight[2] *= size;
        const bottomLeft = [
            this.eulerPosition.x +
                scaledLookAt.x -
                this.left.x / 2 -
                this.down.x / 2,
            this.eulerPosition.y +
                scaledLookAt.y -
                this.left.y / 2 -
                this.down.y / 2,
            this.eulerPosition.z +
                scaledLookAt.z -
                this.left.z / 2 -
                this.down.z / 2,
        ];
        bottomLeft[0] *= size;
        bottomLeft[1] *= size;
        bottomLeft[2] *= size;
        const bottomRight = [
            this.eulerPosition.x +
                scaledLookAt.x -
                this.right.x / 2 -
                this.down.x / 2,
            this.eulerPosition.y +
                scaledLookAt.y -
                this.right.y / 2 -
                this.down.y / 2,
            this.eulerPosition.z +
                scaledLookAt.z -
                this.right.z / 2 -
                this.down.z / 2,
        ];
        bottomRight[0] *= size;
        bottomRight[1] *= size;
        bottomRight[2] *= size;
        return [
            ...origin,
            ...topLeft,
            ...origin,
            ...topRight,
            ...origin,
            ...bottomLeft,
            ...origin,
            ...bottomRight,
            ...topLeft,
            ...topRight,
            ...bottomLeft,
            ...bottomRight,
            ...topRight,
            ...bottomRight,
            ...topLeft,
            ...bottomLeft,
        ];
    }
    getGpuDepthPixelsInMillimeter(pixels) {
        const millimeterPixels = [];
        for (let i = 0, length = pixels.length; i < length; i += 3) {
            const millimeterPixel = this.getDepthPixelInMillimeter({
                x: pixels[i],
                y: pixels[i + 1],
                z: pixels[i + 2],
            });
            if (!isNaN(millimeterPixel.x) &&
                !isNaN(millimeterPixel.y) &&
                !isNaN(millimeterPixel.z)) {
                millimeterPixels.push(millimeterPixel.x, millimeterPixel.y, millimeterPixel.z);
            }
        }
        console.log(Math.max(...millimeterPixels));
        console.log(Math.min(...millimeterPixels));
        return millimeterPixels;
    }
    getDepthPixelInMillimeter(pixel) {
        const topLeft = this.addVectors(this.left, this.up);
        const leftShift = this.multiplyVectors({
            x: this.singlePixelDimension.width * pixel.x,
            y: this.singlePixelDimension.width * pixel.x,
            z: this.singlePixelDimension.width * pixel.x,
        }, this.left);
        const downShift = this.multiplyVectors({
            x: this.singlePixelDimension.height * pixel.y,
            y: this.singlePixelDimension.height * pixel.y,
            z: this.singlePixelDimension.height * pixel.y,
        }, this.up);
        // TODO: Correct depth factor.
        const depthShift = this.multiplyVectors({
            x: this.singlePixelDimension.height * pixel.z + 0.00015,
            y: this.singlePixelDimension.height * pixel.z + 0.00015,
            z: this.singlePixelDimension.height * pixel.z + 0.00015,
        }, this.back);
        // TODO: Dynamic scaling.
        const relative = this.multiplyVectors(this.addVectors(this.addVectors(leftShift, downShift), depthShift), {
            x: 200,
            y: 200,
            z: 200,
        });
        return relative;
    }
    getSinglePixelSizeInMillimeter() {
        return {
            width: this.getImageDimensionsInMillimeter().width / this.resolution.width,
            height: this.getImageDimensionsInMillimeter().height /
                this.resolution.height,
        };
    }
    getImageDimensionsInMillimeter() {
        const fieldOfViewAngle = this.getFieldOfViewAngle();
        return {
            width: 2 *
                this.sphericalPosition.radius *
                Math.tan(fieldOfViewAngle.horizontal / 2),
            height: 2 *
                this.sphericalPosition.radius *
                Math.tan(fieldOfViewAngle.vertical / 2),
        };
    }
    getLookAtVector() {
        return this.getUnitVector({
            x: -this.eulerPosition.x,
            y: -this.eulerPosition.y,
            z: -this.eulerPosition.z,
        });
    }
    getUpVector() {
        const zAxis = { x: 0, y: 0, z: 1 };
        const yAxis = { x: 0, y: 1, z: 0 };
        if (this.getUnitVector(this.eulerPosition).x === zAxis.x &&
            this.getUnitVector(this.eulerPosition).y === zAxis.y &&
            this.getUnitVector(this.eulerPosition).z === zAxis.z) {
            return yAxis;
        }
        return this.getUnitVector(this.getCrossProduct(this.lookAt, zAxis));
    }
    getRightVector() {
        return this.getUnitVector(this.getCrossProduct(this.lookAt, this.up));
    }
    getEulerPosition() {
        const azimuthal = this.sphericalPosition.azimuthalDeg * DEGREE_TO_RADIAN_FACTOR;
        const polar = this.sphericalPosition.polarDeg * DEGREE_TO_RADIAN_FACTOR;
        return {
            x: this.sphericalPosition.radius *
                Math.cos(azimuthal) *
                Math.sin(polar),
            y: this.sphericalPosition.radius *
                Math.sin(azimuthal) *
                Math.sin(polar),
            z: this.sphericalPosition.radius * Math.cos(polar),
        };
    }
    getFieldOfViewAngle() {
        return {
            horizontal: 2 * Math.atan(this.sensorSize.width / 2 / this.focalLength),
            vertical: 2 * Math.atan(this.sensorSize.height / 2 / this.focalLength),
        };
    }
    getCrossProduct(vectorA, vectorB) {
        return {
            x: vectorA.y * vectorB.z - vectorA.z * vectorB.y,
            y: vectorA.z * vectorB.x - vectorA.x * vectorB.z,
            z: vectorA.x * vectorB.y - vectorA.y * vectorB.x,
        };
    }
    getUnitVector(vector) {
        const length = this.getVectorLength(vector);
        if (length === 0) {
            return { x: 0, y: 0, z: 0 };
        }
        return {
            x: vector.x / length,
            y: vector.y / length,
            z: vector.z / length,
        };
    }
    getVectorLength(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    }
    addVectors(vectorA, vectorB) {
        return {
            x: vectorA.x + vectorB.x,
            y: vectorA.y + vectorB.y,
            z: vectorA.z + vectorB.z,
        };
    }
    multiplyVectors(vectorA, vectorB) {
        return {
            x: vectorA.x * vectorB.x,
            y: vectorA.y * vectorB.y,
            z: vectorA.z * vectorB.z,
        };
    }
}
