"use strict";
/*
Spherical Coordinates
The azimuthal angle is denoted by φ (phi).
The polar angle is denoted by θ (theta).
In the following, the notation [φ, θ] is used.
https://www.geogebra.org/m/FzkZPN3K
*/
const EAST = 0;
const NORTH_EAST = 45;
const NORTH = 90;
const NORTH_WEST = 135;
const WEST = 180;
const SOUTH_WEST = 225;
const SOUTH = 270;
const SOUTH_EAST = 315;
/*
The lighting degrees array describes all spherical degrees.
*/
const LIGHTING_AZIMUTHAL_ANGLES = [
    EAST,
    NORTH_EAST,
    NORTH,
    NORTH_WEST,
    WEST,
    SOUTH_WEST,
    SOUTH,
    SOUTH_EAST,
];
class NormalMap {
    constructor(imageSet, calculationMethod, polarAngle = 90) {
        this.imageSet = imageSet;
        this.calculationMethod = calculationMethod;
        this.dimensions = {
            width: imageSet.north.width,
            height: imageSet.north.height,
        };
    }
    getDimensions() {
        return this.dimensions;
    }
    calculatePhotometricStereo() {
        const maxImage = GlslImage.load(this.imageSet.all);
        let all = maxImage.getLuminanceFloat();
        let north = GlslImage.load(this.imageSet.north).getLuminanceFloat();
        let east = GlslImage.load(this.imageSet.east).getLuminanceFloat();
        let south = GlslImage.load(this.imageSet.south).getLuminanceFloat();
        let west = GlslImage.load(this.imageSet.west).getLuminanceFloat();
        const noLightImage = this.imageSet.none;
        let noLight;
        if (noLightImage) {
            noLight = GlslImage.load(noLightImage).getLuminanceFloat();
            all = all.subtractFloat(noLight);
            north = north.subtractFloat(noLight);
            east = north.subtractFloat(noLight);
            south = north.subtractFloat(noLight);
            west = north.subtractFloat(noLight);
        }
        north = north.divideFloat(all);
        east = east.divideFloat(all);
        south = south.divideFloat(all);
        west = west.divideFloat(all);
        let result;
        if (this.calculationMethod === 0 /* RAPID_GRADIENT */) {
            let front = GlslImage.load(this.imageSet.front).getLuminanceFloat();
            if (noLightImage) {
                front = front.subtractFloat(noLight);
            }
            front = front.divideFloat(all);
            result = new GlslVector3([east, north, front]).getVector4();
        }
        if (this.calculationMethod === 1 /* PHOTOMETRIC_STEREO */) {
            let northeast = GlslImage.load(this.imageSet.northeast).getLuminanceFloat();
            let southeast = GlslImage.load(this.imageSet.southeast).getLuminanceFloat();
            let southwest = GlslImage.load(this.imageSet.southwest).getLuminanceFloat();
            let northwest = GlslImage.load(this.imageSet.northwest).getLuminanceFloat();
            if (noLightImage) {
                northeast = north.subtractFloat(noLight);
                southeast = north.subtractFloat(noLight);
                southwest = north.subtractFloat(noLight);
                northwest = north.subtractFloat(noLight);
            }
            northeast = northeast.divideFloat(all);
            southeast = southeast.divideFloat(all);
            southwest = southwest.divideFloat(all);
            northwest = northwest.divideFloat(all);
            const imageLuminances = [
                north,
                northeast,
                east,
                southeast,
                south,
                southwest,
                west,
                northwest,
            ];
            const COMBINATIONS = [
                [WEST, NORTH, EAST],
                [WEST, SOUTH, EAST],
                [SOUTH, WEST, NORTH],
                [SOUTH, EAST, NORTH],
                [NORTH_WEST, NORTH_EAST, SOUTH_EAST],
                [NORTH_WEST, SOUTH_WEST, SOUTH_EAST],
                [NORTH_EAST, SOUTH_EAST, SOUTH_WEST],
                [NORTH_EAST, NORTH_WEST, SOUTH_WEST],
            ];
            console.log("Calculating anisotropic reflection matrices.");
            let normalVectors = [];
            for (let i = 0; i < COMBINATIONS.length; i++) {
                normalVectors.push(this.getAnisotropicNormalVector(imageLuminances, ...COMBINATIONS[i]));
            }
            let normalVector = new GlslVector3([
                new GlslFloat(0),
                new GlslFloat(0),
                new GlslFloat(0),
            ])
                .addVector3(...normalVectors)
                .divideFloat(new GlslFloat(normalVectors.length));
            /*
            TODO:
            Somewhere and somehow the red and green channels are swapped.
            Thus, there are swapped here again.
            */
            result = new GlslVector3([
                normalVector.channel(1 /* GREEN */),
                normalVector.channel(0 /* RED */),
                normalVector.channel(2 /* BLUE */),
            ]).getVector4();
        }
    }
    calculateRapidGradient() {
        const all = GlslImage.load(this.imageSet.all).getLuminanceFloat();
        const north = GlslImage.load(this.imageSet.north)
            .getLuminanceFloat()
            .divideFloat(all);
        const east = GlslImage.load(this.imageSet.east)
            .getLuminanceFloat()
            .divideFloat(all);
        const south = GlslImage.load(this.imageSet.south)
            .getLuminanceFloat()
            .divideFloat(all);
        const west = GlslImage.load(this.imageSet.west)
            .getLuminanceFloat()
            .divideFloat(all);
        const front = GlslImage.load(this.imageSet.front)
            .divideFloat(all)
            .getLuminanceFloat();
        let x = east.subtractFloat(west);
        let y = north.subtractFloat(south);
        x = x.addFloat(new GlslFloat(1));
        y = y.addFloat(new GlslFloat(1));
        x = x.divideFloat(new GlslFloat(2));
        y = y.divideFloat(new GlslFloat(2));
        return new GlslVector3([x, y, front]);
    }
    getGlslNormal() {
        if (this.calculationMethod === 0 /* RAPID_GRADIENT */) {
            return this.calculateRapidGradient();
        }
        if (this.calculationMethod === 1 /* PHOTOMETRIC_STEREO */) {
            return this.calculatePhotometricStereo();
        }
    }
    render() {
        const normalMapShader = new Shader(this.dimensions);
        normalMapShader.bind();
        const result = this.getGlslNormal().getVector4();
        const rendering = GlslRendering.render(result);
        normalMapShader.purge();
        return rendering;
    }
    getAnisotropicNormalVector(imageLuminances, originAzimuthalAngle, orthogonalAzimuthalAngle, oppositeAzimuthalAngle) {
        const lights = this.getLights(originAzimuthalAngle, orthogonalAzimuthalAngle, oppositeAzimuthalAngle);
        const reflectionR = imageLuminances[LIGHTING_AZIMUTHAL_ANGLES.indexOf(originAzimuthalAngle)];
        const reflectionG = imageLuminances[LIGHTING_AZIMUTHAL_ANGLES.indexOf(orthogonalAzimuthalAngle)];
        const reflectionB = imageLuminances[LIGHTING_AZIMUTHAL_ANGLES.indexOf(oppositeAzimuthalAngle)];
        const reflection = new GlslVector3([
            reflectionR,
            reflectionG,
            reflectionB,
        ]);
        return lights
            .multiplyVector3(reflection)
            .normalize()
            .addFloat(new GlslFloat(1))
            .divideFloat(new GlslFloat(2));
    }
    getLights(originAzimuthalAngle, orthogonalAzimuthalAngle, oppositeAzimuthalAngle) {
        const originLightDir = this.getLightDirectionVector(originAzimuthalAngle);
        const orthogonalLightDir = this.getLightDirectionVector(orthogonalAzimuthalAngle);
        const oppositeLightDir = this.getLightDirectionVector(oppositeAzimuthalAngle);
        return new GlslMatrix3([
            [
                originLightDir.channel(0 /* X */),
                originLightDir.channel(1 /* Y */),
                originLightDir.channel(2 /* Z */),
            ],
            [
                orthogonalLightDir.channel(0 /* X */),
                orthogonalLightDir.channel(1 /* Y */),
                orthogonalLightDir.channel(2 /* Z */),
            ],
            [
                oppositeLightDir.channel(0 /* X */),
                oppositeLightDir.channel(1 /* Y */),
                oppositeLightDir.channel(2 /* Z */),
            ],
        ]).inverse();
    }
    getLightDirectionVector(azimuthalAngle) {
        let glslPolar = new GlslFloat(this.polarAngle).radians();
        let glslAzimuthal = new GlslFloat(azimuthalAngle).radians();
        let sinPolar = glslPolar.sin();
        let cosPolar = glslPolar.cos();
        let sinAzimuthal = glslAzimuthal.sin();
        let cosAzimuthal = glslAzimuthal.cos();
        let light = new GlslVector3([
            sinPolar.multiplyFloat(cosAzimuthal),
            sinPolar.multiplyFloat(sinAzimuthal),
            cosPolar,
        ]);
        return light.normalize();
    }
}
