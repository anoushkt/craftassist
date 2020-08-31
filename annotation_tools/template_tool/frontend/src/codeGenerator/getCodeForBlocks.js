/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines the base code generator function that
 * provides corresponding logical-surface forms for templates or template
 * objects in the workspace.
 */

import * as Blockly from 'blockly/core';
import getSpans from '../helperFunctions/getSpans';
import getTypes from '../helperFunctions/getTypes';
import generateCodeAndSurfaceForm from
  '../helperFunctions/generateCodeAndSurface';
const nestedProperty = require('nested-property');
const merge = require('deepmerge');

const spanPaths = [
  'block_type',
  'steps',
  'has_measure',
  'has_name',
  'has_size',
  'has_colour',
  'repeat_count',
  'ordinal',
  'has_block_type',
  'has_name',
  'has_size',
  'has_orientation',
  'has_thickness',
  'has_colour',
  'has_height',
  'has_length',
  'has_radius',
  'has_slope',
  'has_width',
  'has_base',
  'has_depth',
  'has_distance',
  'text_span',
  'pitch',
  'yaw',
  'yaw_pitch',
  'coordinates_span',
  'ordinal',
  'number'
];


// This function returns the deepest path in an object
function getDeepest(object) {
  return object && typeof object === 'object' ?
    Object.entries(object).reduce((r, [k, o]) => {
      const temp = getDeepest(o).reduce((r, a, i) => {
        if (!i || r[0].length < a.length) return [a];
        if (r[0].length === a.length) r.push(a);
        return r;
      }, []);

      return temp.length ?
        [...r, ...temp.map((t) => [k].concat(t))] :
        [...r, [k]];
    }, []) :
    [];
}

// This function returns all paths in an object
function paths(root) {
  const paths = [];
  const nodes = [
    {
      obj: root,
      path: [],
    },
  ];
  while (nodes.length > 0) {
    const n = nodes.pop();
    Object.keys(n.obj).forEach((k) => {
      if (typeof n.obj[k] === 'object') {
        const path = n.path.concat(k);
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
  return getDeepest(object).map((a) => a.join('.'))[0];
}

/**
 * This function generates logical, surface form pairs for templates
 */
function getCodeForBlocks() {
  const allBlocksInWorkspace = Blockly.mainWorkspace.getAllBlocks();
  const allBlocks = [];
  for (let i = 0; i < allBlocksInWorkspace.length; i++) {
    if (
      allBlocksInWorkspace[i].type == 'textBlock' ||
      allBlocksInWorkspace[i].type == 'random'
    ) {
      allBlocks.push(allBlocksInWorkspace[i]);
    }
  }
  let code; let surfaceForms;
  if (!generateCodeAndSurfaceForm(allBlocks)) return false;
  [surfaceForms, code] = generateCodeAndSurfaceForm(allBlocks);
  const spans = getSpans(surfaceForms);
  let surfaceForm = surfaceForms.join(' ');
  const templatesString = localStorage.getItem('templates');
  if (templatesString) {
    // refactors
    const templates = JSON.parse(templatesString);
    const types = getTypes(allBlocks).join(' ');
    if (templates[types]) {
      if (templates[types]['changes']) {
        const changes = templates[types]['changes'];
        changes.forEach((change) => {
          if (change[0] == surfaceForm) {
            surfaceForm = change[1];
          }
        });
      }
    }
  }

  for (let i = 0; i < code.length; i++) {
    const curCode = code[i];
    if (curCode) {
      // merge current code into the template code
      const deepest = getDeepestkey(code[i]);
      const all = deepest.split('.');
      const latest = all[all.length - 1];
      console.log(latest);
      if (spanPaths.includes(latest)) {
        // it is a span
        const spanCount = getSpanCount(spans, surfaceForm, i);
        nestedProperty.set(code[i], deepest, spanCount);
      }
    }
  }
  const skeletal = generateDictionary(allBlocks, code);
  document.getElementById('generatedCode').innerText +=
    surfaceForm + '     ' + JSON.stringify(skeletal, null, 2) + '\n';

  document.getElementById('surfaceForms').innerText += surfaceForm + '\n';
  localStorage.setItem(
    'current',
    document.getElementById('surfaceForms').innerText,
  );
}

export default getCodeForBlocks;


// This function returns the span count of a span, given a surface form
function getSpanCount(spans, surfaceForm, i) {
  const spanArray = spans[i].split(' ');
  const surfaceFormWords = surfaceForm.split(' ');
  const startSpan = surfaceFormWords.indexOf(spanArray[0]);
  const endSpan = startSpan + spanArray.length - 1;
  const span = [startSpan, endSpan];
  return [0, span];
}

// This function generates the dictionary for a template
function generateDictionary(allBlocks, code, i = 0, skeletal = {}) {
  if (i == allBlocks.length) {
    return skeletal;
  }
  if (code[i]) {
    const curCode = code[i];
    let finalCode = curCode;
    let parent = '';
    const parentBlockConnection = allBlocks[i].parentBlock_;

    if (parentBlockConnection) {
      // block has a parent
      parent = parentBlockConnection.getFieldValue('parent');
    }

    if (parent) {
      // nest the block in the parent
      finalCode = {};
      nestedProperty.set(finalCode, parent, curCode);
    }

    const pathsCur = paths(skeletal);
    let found = false;
    pathsCur.forEach((element) => {
      if (element[element.length - 1] == Object.keys(finalCode)[0]) {
        // a subset of the current path exists in the skeletal dictionary
        found = true;
        const fullPath = element.join('.');
        const currentDict = nestedProperty.get(skeletal, fullPath);
        const newDict = merge(currentDict,
          finalCode[Object.keys(finalCode)[0]]);
        nestedProperty.set(skeletal, fullPath, newDict);
      }
    });

    if (!found) {
      // the current key doesn't exist
      skeletal = merge(skeletal, finalCode);
    }
  }

  return generateDictionary(allBlocks, code, i + 1, skeletal);
}
