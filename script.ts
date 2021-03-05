"use strict";

DOMStatusElement.setParentDiv(LOADING_AREA);

const dataset: SphericalDataset = new SphericalDataset(TEST_DATASET_PATHS);
dataset.listenForTestButtonClick(TEST_BUTTON);
