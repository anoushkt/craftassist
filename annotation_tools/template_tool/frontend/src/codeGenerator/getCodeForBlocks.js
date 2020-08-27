/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines the base code generator function that provides corresponding logical-surface forms for templates or template objects in the workspace.
 */

import * as Blockly from "blockly/core";
import { getSurfaceForms } from "../helperFunctions/getSurfaceForms";
import getSpans from "../helperFunctions/getSpans";
import getTypes from "../helperFunctions/getTypes";
import generateCodeAndSurfaceForm from "../helperFunctions/generateCodeAndSurface";
var nestedProperty = require("nested-property");
const merge = require("deepmerge");

const spanPaths = [
  "block_type",
  "steps",
  "has_measure",
  "has_name",
  "has_size",
  "has_colour",
  "repeat_count",
  "ordinal",
  "has_block_type",
  "has_name",
  "has_size",
  "has_orientation",
  "has_thickness",
  "has_colour",
  "has_height",
  "has_length",
  "has_radius",
  "has_slope",
  "has_width",
  "has_base",
  "has_depth",
  "has_distance",
  "text_span",
  "pitch",
  "yaw",
  "yaw_pitch",
  "coordinates_span",
  "ordinal",
];

const categoricals = [
  "relative_direction",
  "condition_type",
  "repeat_key",
  "repeat_dir",
];

// This function returns the deepest path in an object
function getDeepest(object) {
  return object && typeof object === "object"
    ? Object.entries(object).reduce((r, [k, o]) => {
        var temp = getDeepest(o).reduce((r, a, i) => {
          if (!i || r[0].length < a.length) return [a];
          if (r[0].length === a.length) r.push(a);
          return r;
        }, []);

        return temp.length
          ? [...r, ...temp.map((t) => [k].concat(t))]
          : [...r, [k]];
      }, [])
    : [];
}

// This function returns all paths in an object
function paths(root) {
  let paths = [];
  let nodes = [
    {
      obj: root,
      path: [],
    },
  ];
  while (nodes.length > 0) {
    let n = nodes.pop();
    Object.keys(n.obj).forEach((k) => {
      if (typeof n.obj[k] === "object") {
        let path = n.path.concat(k);
        paths.push(path);
        nodes.unshift({
          obj: n.obj[k],
          path: path,
        });
      }
    });
  }
  return paths;
}

function getDeepestkey(object) {
  return getDeepest(object).map((a) => a.join("."))[0];
}

function getCodeForBlocks() {
  const allBlocksInWorkspace = Blockly.mainWorkspace.getAllBlocks();
  var allBlocks = [];
  for (var i = 0; i < allBlocksInWorkspace.length; i++) {
    if (
      allBlocksInWorkspace[i].type == "textBlock" ||
      allBlocksInWorkspace[i].type == "random"
    ) {
      allBlocks.push(allBlocksInWorkspace[i]);
    }
  }
  var code, surfaceForms;
  [surfaceForms, code] = generateCodeAndSurfaceForm(allBlocks);
  const spans = getSpans(surfaceForms);
  var surfaceForm = surfaceForms.join(" ");
  const templatesString = localStorage.getItem("templates");
  if (templatesString) {
    const templates = JSON.parse(templatesString);
    const types = getTypes(allBlocks).join(" ");
    if (templates[types]) {
      if (templates[types]["changes"]) {
        const changes = templates[types]["changes"];
        changes.forEach((change) => {
          if (change[0] == surfaceForm) {
            surfaceForm = change[1];
          }
        });
      }
    }
  }

  for (var i = 0; i < code.length; i++) {
    var curCode = code[i];
    if (curCode) {
      var deepest = getDeepestkey(code[i]);
      var all = deepest.split(".");
      var latest = all[all.length - 1];
      console.log(latest);
      if (spanPaths.includes(latest)) {
        var spanCount = getSpanCount(spans, surfaceForm, i);
        nestedProperty.set(code[i], deepest, spanCount);
      }
    }
  }
  var skeletal = generateDictionary(allBlocks, code);
  document.getElementById("generatedCode").innerText +=
    surfaceForm + "     " + JSON.stringify(skeletal, null, 2) + "\n";

  document.getElementById("surfaceForms").innerText += surfaceForm + "\n";
}

export default getCodeForBlocks;

function getSpanCount(spans, surfaceForm, i) {
  var spanArray = spans[i].split(" ");
  var surfaceFormWords = surfaceForm.split(" ");
  var startSpan = surfaceFormWords.indexOf(spanArray[0]);
  var endSpan = startSpan + spanArray.length - 1;
  var span = [startSpan, endSpan];
  return [0, span];
}

function generateDictionary(allBlocks, code, i = 0, skeletal = {}) {
  if (i == allBlocks.length) {
    return skeletal;
  }
  if (code[i]) {
    var curCode = code[i];
    var finalCode = curCode;
    var parent = "";
    var parentBlockConnection = allBlocks[i].parentBlock_;
    
    if (parentBlockConnection) {
      parent = parentBlockConnection.getFieldValue("parent");
    }

    if (parent) {
      finalCode = {};
      nestedProperty.set(finalCode, parent, curCode);
    }

    var pathsCur = paths(skeletal);
    var found = false;
    pathsCur.forEach((element) => {
      if (element[element.length - 1] == Object.keys(finalCode)[0]) {
        found = true;
        var fullPath = element.join(".");
        var currentDict = nestedProperty.get(skeletal, fullPath);
        var newDict = merge(currentDict, finalCode[Object.keys(finalCode)[0]]);
        nestedProperty.set(skeletal, fullPath, newDict);
      }
    });

    if (!found) {
      var keys = Object.keys(skeletal)[0];
      if (keys) {
        console.log(keys);
        skeletal[keys] = merge(skeletal[keys], finalCode);
      } else {
        skeletal = merge(skeletal, finalCode);
      }
    }

  }

  return generateDictionary(allBlocks, code, i + 1, skeletal);
}
