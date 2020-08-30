/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines a function to return an array of the codes associated with each template object of a template.
 */

function generateCodeAndSurfaceForm(blocks) {
  var codeList = [];
  var surfaceForms = [];
  var templates = localStorage.getItem("templates");

  if (templates) {
    // template information exists
    templates = JSON.parse(templates);
  } else {
    // no template info exists
    templates = {};
  }

  blocks.forEach((element) => {
    // push code for this element
    //const parent=element.getFieldValue("parent");
    if (element.type != "random") {
      const curCode = templates[element.getFieldValue("name")]["code"];
      codeList.push(curCode);
      var surfaceForm =
        templates[element.getFieldValue("name")]["surfaceForms"];
      surfaceForm = randomFromList(surfaceForm);
      surfaceForms.push(surfaceForm);
    } else {
      const randomChoices = element
        .getFieldValue("randomCategories")
        .split(", ");
      const choice = randomFromList(randomChoices);
      const curCode = templates[choice]["code"];
      codeList.push(curCode);
      var surfaceForm = templates[choice]["surfaceForms"];
      surfaceForm = randomFromList(surfaceForm);
      surfaceForms.push(surfaceForm);
    }
  });

  return [surfaceForms, codeList];
}
export default generateCodeAndSurfaceForm;

function randomFromList(list) {
  var number_length = list.length;
  var x = Math.floor(Math.random() * number_length);
  return list[x];
}
