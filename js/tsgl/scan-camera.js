"use strict";
const SCAN_CAMERA_FOCAL_LENGTH = 50; // in millimeter
const SCAN_CAMERA_SENSOR_WIDTH = 36; // in millimeter
class ScanCamera {
    constructor(focalLength = SCAN_CAMERA_FOCAL_LENGTH, sensorWidth = SCAN_CAMERA_SENSOR_WIDTH, sphericalPosition, resolution) {
        this.focalLength = focalLength;
        this.sensorSize = {
            width: sensorWidth,
            height: (resolution.height * sensorWidth) / resolution.width,
        };
        this.sphericalPosition = sphericalPosition;
        this.resolution = resolution;
        this.eulerPosition = this.getEulerPosition();
        this.singlePixelDimension = this.getSinglePixelSizeInMillimeter();
    }
    getVertexInMillimeter(vector) {
        const pointCoordinate = this.getPointCoordinatesInMillimeter({ x: vector.x, y: vector.y });
        const supportVector = {
            x: -this.eulerPosition.x,
            y: -this.eulerPosition.y,
            z: -this.eulerPosition.z,
        };
        const rightAngleToSupportAndXAxis = {
            x: 0,
            y: -supportVector.z,
            z: 1 * supportVector.y,
        };
    }
    getPointCoordinatesInMillimeter(pixelCoordinate) {
        return {
            x: pixelCoordinate.x * this.singlePixelDimension.width,
            y: pixelCoordinate.y * this.singlePixelDimension.height,
        };
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
}
