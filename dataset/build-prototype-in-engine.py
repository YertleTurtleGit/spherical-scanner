import math
import numpy as np


def enum(**enums):
    return type('Enum', (), enums)


RENDER_ENGINES = enum(BLENDER='blender', MAYA='maya')

RENDER_ENGINE = RENDER_ENGINES.BLENDER
RADIUS = 2  # Measured in meter.
LIGHT_COUNT = 20  # Light count on one circle of 360 degrees.
POLAR_RESOLUTION = 20  # Light count for simulating rotation of 180 degrees.
BRIGHTNESS_FACTOR = 0.5
LIGHT_ORIGINS = [0, 90, 180, 270]
ALL_LIGHT_IMAGE = True
FRONT_LIGHT_IMAGE = True
CAMERA_AZIMUTHAL_STEPS = 4
CAMERA_POLAR_STEPS = CAMERA_AZIMUTHAL_STEPS / 2

OBJECT_NAME = "testobject"
FILE_EXTENSION = "png"

if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
    import bpy
    import mathutils
    import os
if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
    """
    TODO:
    - Import stuff for Maya if necessary.
    """


def rotateVectorAroundAxis(vector, axis, angle):
    axis = np.asarray(axis)
    axis = axis / math.sqrt(np.dot(axis, axis))
    a = math.cos(angle / 2.0)
    b, c, d = -axis * math.sin(angle / 2.0)
    aa, bb, cc, dd = a * a, b * b, c * c, d * d
    bc, ad, ac, ab, bd, cd = b * c, a * d, a * c, a * b, b * d, c * d
    rotationMatrix = np.array([
        [aa + bb - cc - dd, 2 * (bc + ad), 2 * (bd - ac)],
        [2 * (bc - ad), aa + cc - bb - dd, 2 * (cd + ab)],
        [2 * (bd + ac), 2 * (cd - ab), aa + dd - bb - cc]])
    return np.dot(rotationMatrix, vector)


def angleBetweenVectors(vectorA, vectorB):
    unitVectorA = vectorA / np.linalg.norm(vectorA)
    unitVectorB = vectorB / np.linalg.norm(vectorB)
    dotProduct = np.dot(unitVectorA, unitVectorB)

    return np.arccos(dotProduct)


def getThreeDigitString(number):
    number = int(number)
    numberString = str(number)

    while(len(numberString) < 3):
        numberString = "0" + numberString

    return numberString


class SphericalScannerPrototype:

    def __init__(self,
                 radius=RADIUS,
                 lightCount=LIGHT_COUNT,
                 polarResolution=POLAR_RESOLUTION,
                 brightnessFactor=BRIGHTNESS_FACTOR,
                 lightOrigins=LIGHT_ORIGINS,
                 cameraAzimuthalSteps=CAMERA_AZIMUTHAL_STEPS,
                 cameraPolarSteps=CAMERA_POLAR_STEPS,
                 objectName=OBJECT_NAME,
                 fileExtension=FILE_EXTENSION):
        self.__radius = radius
        self.__lightCount = lightCount
        self.__polarResolution = polarResolution
        self.__cameraAzimuthalSteps = cameraAzimuthalSteps + 1
        self.__cameraPolarSteps = cameraPolarSteps + 1
        self.__brightnessFactor = brightnessFactor
        self.__lightOriginsDegree = lightOrigins
        self.__lightOrigins = self.__convertLightOrigins(lightOrigins)
        self.__objectName = objectName
        self.__fileExtension = fileExtension

        self.__cameraObject = None
        self.__azimuthalLightPositions = None
        self.__lightPositions = None
        self.__azimuthalCameraPositions = None
        self.__cameraPositions = None
        self.__lightObjects = []
        self.__frames = []

    def __convertLightOrigins(self, lightOrigins):
        convertedLightOrigins = []
        for lightOrigin in lightOrigins:
            lightOrigin -= 180
            while(lightOrigin < 0):
                lightOrigin += 360
            convertedLightOrigins.append(math.radians(lightOrigin))
        return convertedLightOrigins

    def __getAzimuthalCameraPositions(self):
        if(self.__azimuthalCameraPositions is None):
            self.__azimuthalCameraPositions = []
            yAxisVector = [0, 1, 0]
            angleStep = math.radians(360 / self.__cameraAzimuthalSteps)
            angleStop = math.radians(360)

            for angle in np.arange(0, angleStop, angleStep):
                azimuthalCameraPosition = [
                    math.cos(angle) * self.__radius,
                    math.sin(angle) * self.__radius,
                    0
                ]
                azimuthalCameraPosition = rotateVectorAroundAxis(
                    azimuthalCameraPosition, yAxisVector, math.radians(90)
                )
                self.__azimuthalCameraPositions.append(azimuthalCameraPosition)

        return self.__azimuthalCameraPositions

    def __getAzimuthalLightPositions(self):
        if(self.__azimuthalLightPositions is None):
            self.__azimuthalLightPositions = []
            angleStep = math.radians(360 / self.__lightCount)
            angleStop = math.radians(360)

            for angle in np.arange(0, angleStop, angleStep):
                x = math.cos(angle) * self.__radius
                y = math.sin(angle) * self.__radius
                z = 0
                self.__azimuthalLightPositions.append([x, y, z])

        return self.__azimuthalLightPositions

    def __getRotatedCameraPositions(self, angle):
        positions = self.__getAzimuthalCameraPositions()
        yAxisVector = [0, 1, 0]
        rotatedPositions = []

        for position in positions:
            rotatedPosition = rotateVectorAroundAxis(
                position, yAxisVector, angle
            )

            rotatedPositions.append(rotatedPosition)

        return rotatedPositions

    def __getRotatedLightPositions(self, angle):
        positions = self.__getAzimuthalLightPositions()
        yAxisVector = [0, 1, 0]
        rotatedPositions = []

        for position in positions:
            rotatedPosition = rotateVectorAroundAxis(
                position, yAxisVector, angle
            )

            rotatedPositions.append(rotatedPosition)

        return rotatedPositions

    def __getCameraPositions(self):
        if(self.__cameraPositions is None):
            polarAngleStep = math.radians(180 / self.__cameraPolarSteps)
            polarAngleStop = math.radians(180)

            self.__cameraPositions = []
            for polarAngle in np.arange(0, polarAngleStop, polarAngleStep):
                self.__cameraPositions.extend(
                    self.__getRotatedCameraPositions(polarAngle)
                )

        return self.__cameraPositions

    def __getLightPositions(self):
        if(self.__lightPositions is None):
            polarAngleStep = math.radians(180 / self.__polarResolution)
            polarAngleStop = math.radians(180)

            self.__lightPositions = []
            for polarAngle in np.arange(0, polarAngleStop, polarAngleStep):
                self.__lightPositions.extend(
                    self.__getRotatedLightPositions(polarAngle)
                )

        return self.__lightPositions

    def __createLight(self, position):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            lightData = bpy.data.lights.new(
                name="lightdata", type='POINT')
            lightObject = bpy.data.objects.new(
                name="light", object_data=lightData)
            bpy.context.collection.objects.link(lightObject)
            bpy.context.view_layer.objects.active = lightObject
            lightObject.location = (position[0], position[1], position[2])
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Create a light object in the scene.
            - Call its variable 'lightObject'.
            - Set its euler xyz position according to the
              passed variable named 'position'.
            """
        self.__lightObjects.append(lightObject)

    def __getMaximumBrightness(self):
        return math.radians(180) * self.__brightnessFactor

    def __getLightBrightness(self, lightPosition, lightOrigin):
        deltaAngle = angleBetweenVectors(lightPosition, lightOrigin)
        return deltaAngle * self.__brightnessFactor

    def __setLightBrightness(self, lightObject, brightness):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            lightObject.data.energy = brightness
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Set the brightness of the 'lightObject'
              variable according to the passed 'brightness'
              variable. (In blender 'brightness' is called
              energy and is measured in watts.)
            """

    def __getCameraObject(self):
        if(self.__cameraObject is None):
            if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
                cameraData = bpy.data.cameras.new(name='Camera')
                cameraObject = bpy.data.objects.new('Camera', cameraData)
                bpy.context.scene.collection.objects.link(cameraObject)
            if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
                """
                TODO:
                - Create a camera in the scene and assign it
                  to the variable 'cameraObject'.
                """
            self.__cameraObject = cameraObject
        return self.__cameraObject

    def __getCameraUpVector(self):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            return (self.__getCameraObject().matrix_world.to_quaternion()
                    @ mathutils.Vector((0.0, 1.0, 0.0)))
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Return camera up vector of
              'self.__getCameraObject()'
            """

    def __getCameraLookAtVector(self):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            return (self.__getCameraObject().matrix_world.to_quaternion()
                    @ mathutils.Vector((0.0, 0.0, -1.0)))
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Return camera look at vector of
              'self.__getCameraObject()'
            """

    def __setCameraPosition(self, position):
        cameraObject = self.__getCameraObject()

        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            cameraObject.location = position

            target = mathutils.Vector((0.0, 0.0, 0.0))
            loc = cameraObject.location
            direction = target - loc
            quat = direction.to_track_quat('-Z', 'Y')
            quat = quat.to_matrix().to_4x4()
            loc = loc.to_tuple()
            cameraObject.matrix_world = quat
            cameraObject.location = loc
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Set the position of the 'cameraObject'
              according to the passed variable 'position'.
            - Rotate the 'cameraObject' to look at th center
              XYZ(0, 0, 0).
            """

    def __buildObjects(self):
        if(len(self.__lightObjects) is 0):
            print("Building scene objects.")
            self.__getCameraObject()
            lightPositions = self.__getLightPositions()

            for lightPosition in lightPositions:
                self.__createLight(lightPosition)

            if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
                dg = bpy.context.evaluated_depsgraph_get()
                dg.update()
            if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
                """
                TODO:
                - Update the scene if necessary.
                """

    def __setLightKeyframe(self, lightObject, frame):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            lightObject.data.keyframe_insert(data_path="energy", frame=frame)
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Set keyframe of brightness of 'lightObject' at
              'frame'
            """

    def __setCameraKeyframe(self, cameraObject, frame):
        if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
            cameraObject.keyframe_insert(data_path="location", frame=frame)
            cameraObject.keyframe_insert(
                data_path="rotation_euler", frame=frame)
        if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
            """
            TODO:
            - Set keyframe of location of 'cameraObject' at
              'frame'
            - Set keyframe of rotation of 'cameraObject' at
              'frame'
            """

    def __buildKeyframe(
            self,
            cameraPosition,
            lightOriginAzimuthalAngle,
            frame,
            allLights=False,
            frontLight=False):
        self.__buildObjects()

        self.__setCameraPosition(cameraPosition)
        self.__setCameraKeyframe(self.__getCameraObject(), frame)

        if(not allLights):
            lightOrigin = rotateVectorAroundAxis(
                self.__getCameraUpVector(),
                self.__getCameraLookAtVector(),
                math.radians(90) + lightOriginAzimuthalAngle
            )
            lightOrigin = np.asarray(lightOrigin)

        for lightObject in self.__lightObjects:
            if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
                lightPosition = lightObject.location
            if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
                """
                TODO:
                - Set variable 'lightPosition' to the
                  position of 'lightObject'.
                """
            lightPosition = np.asarray(lightPosition)

            if(allLights):
                lightBrightness = self.__getMaximumBrightness()
            elif(frontLight):
                lightBrightness = self.__getLightBrightness(lightPosition, -cameraPosition)
            else:
                lightBrightness = self.__getLightBrightness(lightPosition,
                                                            lightOrigin)

            self.__setLightBrightness(lightObject, lightBrightness)
            self.__setLightKeyframe(lightObject, frame)

    def buildKeyframes(self):
        frame = 0
        totalFrameCount = (len(self.__getCameraPositions())
                           * len(self.__lightOrigins))

        if(ALL_LIGHT_IMAGE):
            totalFrameCount += len(self.__getCameraPositions())

        if(FRONT_LIGHT_IMAGE):
            totalFrameCount += len(self.__getCameraPositions())

        for cameraPosition in self.__getCameraPositions():
            for lightOrigin in self.__lightOrigins:
                frame += 1
                print("Building keyframe " + str(frame) +
                      " of " + str(totalFrameCount) + ".")
                self.__buildKeyframe(cameraPosition, lightOrigin, frame)

            if(ALL_LIGHT_IMAGE):
                frame += 1
                self.__buildKeyframe(cameraPosition, None, frame, True)

            if(FRONT_LIGHT_IMAGE):
                frame += 1
                self.__buildKeyframe(cameraPosition, 0, frame, False, True)

        print("Finished building keyframes.")

    def getFilenameFromFrame(self, frame):

        frame -= 1

        lightAzimuthalRepeat = 1
        lightAzimuthalCount = len(self.__lightOrigins)
        if(ALL_LIGHT_IMAGE):
            lightAzimuthalCount += 1
        if(FRONT_LIGHT_IMAGE):
            lightAzimuthalCount += 1

        lightAzimuthalIndex = math.floor(frame / lightAzimuthalRepeat)
        while(lightAzimuthalIndex > lightAzimuthalCount - 1):
            lightAzimuthalIndex -= lightAzimuthalCount

        if(ALL_LIGHT_IMAGE and lightAzimuthalIndex == lightAzimuthalCount - 2):
            lightAzimuthalName = "all"
        elif(FRONT_LIGHT_IMAGE and lightAzimuthalIndex == lightAzimuthalCount - 1):
            lightAzimuthalName = "front"
        else:
            lightAzimuthalName = getThreeDigitString(self.__lightOriginsDegree[lightAzimuthalIndex])

        cameraAzimuthalRepeat = lightAzimuthalCount
        cameraAzimuthalIndex = math.floor(frame / cameraAzimuthalRepeat)
        while(cameraAzimuthalIndex > self.__cameraAzimuthalSteps):
            cameraAzimuthalIndex -= self.__cameraAzimuthalSteps

        cameraAzimuthalName = getThreeDigitString(cameraAzimuthalIndex * (360 / self.__cameraAzimuthalSteps))

        cameraPolarRepeat = lightAzimuthalCount + self.__cameraAzimuthalSteps
        cameraPolarIndex = math.floor(frame / cameraPolarRepeat)
        while(cameraPolarIndex > self.__cameraPolarSteps):
            cameraPolarIndex -= self.__cameraPolarSteps

        cameraPolarName = getThreeDigitString(cameraPolarIndex * (360 / self.__cameraPolarSteps))

        # {object name}_ca-{camera azimuthal angle}_cp-{camera polar angle}_la-{light azimuthal angle}
        return (self.__objectName
                + "_ca-" + cameraAzimuthalName
                + "_cp-" + cameraPolarName
                + "_l-" + lightAzimuthalName
                + "." + self.__fileExtension)


SphericalScannerPrototype = SphericalScannerPrototype()
SphericalScannerPrototype.buildKeyframes()

if(RENDER_ENGINE is RENDER_ENGINES.BLENDER):
    currentFilePath = bpy.context.scene.render.filepath

    def onFrameChange(scene):
        bpy.context.scene.render.filepath = os.path.join(
            currentFilePath,
            SphericalScannerPrototype.getFilenameFromFrame(scene.frame_current))
        print(SphericalScannerPrototype.getFilenameFromFrame(scene.frame_current))

    bpy.app.handlers.frame_change_pre.clear()
    bpy.app.handlers.frame_change_pre.append(onFrameChange)
if(RENDER_ENGINE is RENDER_ENGINES.MAYA):
    """
    TODO (optional):
    - name the rendered files
      (use SphericalScannerPrototype.getFilenameFromFrame())
    """
