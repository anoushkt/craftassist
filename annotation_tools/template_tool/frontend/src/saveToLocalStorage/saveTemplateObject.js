/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines a function to save a template object to
 * local storage, and then call upon a function to dump contents of
 * local storage to a file.
 */

import saveToFile from '../fileHandlers/saveToFile';

/**
 * This function saves a template object to local storage,
 * and then calls upon the backend to save it to a file
 * @param {object} block The block to be saved
 * @param {string} name The name of the block to be saved
 */
function saveTemplateObject(block, name) {
  const surfaceForms = document
    .getElementById('surfaceForms')
    .innerText.split('\n');

  // if categorical

  let actionDict = document.getElementById('actionDict').innerText;

  if (actionDict) {
    // associated with code
    actionDict = JSON.parse(actionDict);
  }
  let templateObjectsSaved = localStorage.getItem('templates');
  if (templateObjectsSaved) {
    templateObjectsSaved = JSON.parse(templateObjectsSaved);
  } else {
    templateObjectsSaved = {};
  }

  if (!templateObjectsSaved[name]) {
    templateObjectsSaved[name] = {};
  }
  templateObjectsSaved[name]['surfaceForms'] = surfaceForms;
  if (actionDict) {
    templateObjectsSaved[name]['code'] = actionDict;
  }
  console.log(templateObjectsSaved);
  localStorage.setItem('templates', JSON.stringify(templateObjectsSaved));

  saveToFile(); // dump new local storage information to file
}

export default saveTemplateObject;
