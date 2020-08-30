/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines a function to return an array of the
 * surface and logical forms associated with each template object of a template.
 */

/**
 * This function returns the logical and surface form array
 * associated with a list of blocks/ a template
*/
function generateCodeAndSurfaceForm(blocks) {
  const codeList = [];
  const surfaceForms = [];
  let templates = localStorage.getItem('templates');

  if (templates) {
    // template information exists
    templates = JSON.parse(templates);
  } else {
    // no template info exists
    templates = {};
  }

  blocks.forEach((element) => {
    // push code for this element
    // const parent=element.getFieldValue("parent");
    if (element.type != 'random') {
      if (!templates[element.getFieldValue("name")]) {
        return false;
      }
      const curCode = templates[element.getFieldValue('name')]['code'];
      codeList.push(curCode);
      let surfaceForm =
        templates[element.getFieldValue('name')]['surfaceForms'];
      surfaceForm = randomFromList(surfaceForm);
      surfaceForms.push(surfaceForm);
    } else {
      const randomChoices = element
        .getFieldValue('randomCategories')
        .split(', ');
      const choice = randomFromList(randomChoices);
      if (!templates[choice]) return false;
      const curCode = templates[choice]['code'];
      codeList.push(curCode);
      let surfaceForm = templates[choice]['surfaceForms'];
      surfaceForm = randomFromList(surfaceForm);
      surfaceForms.push(surfaceForm);
    }
  });

  return [surfaceForms, codeList];
}
export default generateCodeAndSurfaceForm;

/**
 * This function returns a random element from a list
 */
function randomFromList(list) {
  const numberLength = list.length;
  const x = Math.floor(Math.random() * numberLength);
  return list[x];
}
