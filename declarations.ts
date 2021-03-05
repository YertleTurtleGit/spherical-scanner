"use strict";

const LOADING_AREA: HTMLDivElement = <HTMLDivElement>(
   document.getElementById("loading-area")
);
const TEST_BUTTON: HTMLButtonElement = <HTMLButtonElement>(
   document.getElementById("test-dataset-button")
);

const TEST_DATASET_PATHS: string[] = [
   "dataset/test/testobject_ca-000_cp-000_la-000.png",
   "dataset/test/testobject_ca-120_cp-000_la-090.png",
   "dataset/test/testobject_ca-120_cp-240_la-180.png",
   "dataset/test/testobject_ca-240_cp-120_la-270.png",
   "dataset/test/testobject_ca-240_cp-360_la-all.png",
   "dataset/test/testobject_ca-000_cp-000_la-090.png",
   "dataset/test/testobject_ca-120_cp-000_la-180.png",
   "dataset/test/testobject_ca-120_cp-240_la-270.png",
   "dataset/test/testobject_ca-240_cp-120_la-all.png",
   "dataset/test/testobject_ca-360_cp-120_la-000.png",
   "dataset/test/testobject_ca-000_cp-000_la-180.png",
   "dataset/test/testobject_ca-120_cp-120_la-270.png",
   "dataset/test/testobject_ca-120_cp-360_la-all.png",
   "dataset/test/testobject_ca-240_cp-360_la-000.png",
   "dataset/test/testobject_ca-360_cp-240_la-090.png",
   "dataset/test/testobject_ca-000_cp-000_la-270.png",
   "dataset/test/testobject_ca-120_cp-120_la-all.png",
   "dataset/test/testobject_ca-240_cp-120_la-000.png",
   "dataset/test/testobject_ca-240_cp-360_la-090.png",
   "dataset/test/testobject_ca-360_cp-240_la-180.png",
   "dataset/test/testobject_ca-000_cp-000_la-all.png",
   "dataset/test/testobject_ca-120_cp-240_la-000.png",
   "dataset/test/testobject_ca-240_cp-120_la-090.png",
   "dataset/test/testobject_ca-240_cp-360_la-180.png",
   "dataset/test/testobject_ca-360_cp-240_la-270.png",
   "dataset/test/testobject_ca-120_cp-000_la-000.png",
   "dataset/test/testobject_ca-120_cp-240_la-090.png",
   "dataset/test/testobject_ca-240_cp-120_la-180.png",
   "dataset/test/testobject_ca-240_cp-360_la-270.png",
   "dataset/test/testobject_ca-360_cp-240_la-all.png",
];
