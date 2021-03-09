"use strict";

const INPUT_AREA: HTMLDivElement = <HTMLDivElement>(
   document.getElementById("input-area")
);
const LOADING_AREA: HTMLDivElement = <HTMLDivElement>(
   document.getElementById("loading-area")
);
const POINT_CLOUD_AREA: HTMLDivElement = <HTMLDivElement>(
   document.getElementById("point-cloud-area")
);
const TEST_BUTTON: HTMLButtonElement = <HTMLButtonElement>(
   document.getElementById("test-dataset-button")
);

const TEST_DATASET_PATHS: string[] = [
   "testobject_ca-000_cp-000_l-000.png",
   "testobject_ca-090_cp-090_l-000.png",
   "testobject_ca-000_cp-000_l-090.png",
   "testobject_ca-090_cp-090_l-090.png",
   "testobject_ca-000_cp-000_l-180.png",
   "testobject_ca-090_cp-090_l-180.png",
   "testobject_ca-000_cp-000_l-270.png",
   "testobject_ca-090_cp-090_l-270.png",
   "testobject_ca-000_cp-000_l-all.png",
   "testobject_ca-090_cp-090_l-all.png",
   "testobject_ca-000_cp-000_l-front.png",
   "testobject_ca-090_cp-090_l-front.png",
   "testobject_ca-000_cp-090_l-000.png",
   "testobject_ca-090_cp-180_l-000.png",
   "testobject_ca-000_cp-090_l-090.png",
   "testobject_ca-090_cp-180_l-090.png",
   "testobject_ca-000_cp-090_l-180.png",
   "testobject_ca-090_cp-180_l-180.png",
   "testobject_ca-000_cp-090_l-270.png",
   "testobject_ca-090_cp-180_l-270.png",
   "testobject_ca-000_cp-090_l-all.png",
   "testobject_ca-090_cp-180_l-all.png",
   "testobject_ca-000_cp-090_l-front.png",
   "testobject_ca-090_cp-180_l-front.png",
];

for (let i = 0, length = TEST_DATASET_PATHS.length; i < length; i++) {
   TEST_DATASET_PATHS[i] = "./dataset/test/" + TEST_DATASET_PATHS[i];
}
