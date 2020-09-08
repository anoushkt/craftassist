/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file contains the callback function for the "saveBlock"
 * option that the custom block has. This saves information about the block to
 * local storage and the template library file.
 */

import saveTemplateObject from '../../saveToLocalStorage/saveTemplateObject';
import * as Blockly from 'blockly/core';
import saveTemplate from '../../saveToLocalStorage/saveTemplate';
import saveRandomTemplateObject from '../../saveToLocalStorage/saveRandom';
import saveToFile from '../../fileHandlers/saveToFile';

function deleteBlockCallback(block) {
  const blockAsText = Blockly.Xml.domToText(
    Blockly.Xml.blockToDom(block, true),
  );
  
  // wrap the block in xml tags
  let name = block.getFieldValue('name');

  console.log("name of block" + name);
  // get the blocks currently saved by name
  const currentSavedInfoString = localStorage.getItem('savedByName');
  let currentSavedInfo;

  if (currentSavedInfoString) {
    // blocks have already been saved
    currentSavedInfo = JSON.parse(currentSavedInfoString);
  } else {
    // no blocks saved, initialise the dictionary.
    currentSavedInfo = {};
  }
  console.log("before deleting savedbyname");
  console.log(currentSavedInfo);
  // remove this block from current info
  delete currentSavedInfo[name];
  console.log("after deleting savedbyname");
  console.log(currentSavedInfo);
  localStorage.setItem('savedByName', JSON.stringify(currentSavedInfo));

  // Now fix blocks
  const currentDropdownInfo = JSON.parse(localStorage.getItem('blocks'));
  var blockIndex = currentDropdownInfo.indexOf(name);// get name index
  
  if (blockIndex != -1) {
    // name found, delete block now
    currentDropdownInfo.splice(blockIndex, 1);
  }
  console.log("after deleting blocks");
  console.log(currentDropdownInfo);
  localStorage.setItem('blocks', JSON.stringify(currentDropdownInfo));


  // Now fix templates
  const currentTemplatesString = localStorage.getItem('templates');
  let currentTemplates;
  if (currentTemplatesString) {
    // blocks have already been saved
    currentTemplates = JSON.parse(currentTemplatesString);
  } else {
    // no blocks saved, initialise the dictionary.
    currentTemplates = {};
  }
  console.log("before deleting templates");
  console.log(currentTemplates);
  delete currentTemplates[name];
  console.log("after deleting templates");
  console.log(currentTemplates);
  localStorage.setItem('templates', JSON.stringify(currentTemplates));


  // delete from file
  saveToFile();

//   if (allBlocks.length == 1) {
//     // it is a template object
//     if (allBlocks[0].type == 'random') {
//       // delete random template
//       saveRandomTemplateObject(block, name);
//     } else {
//       // delete TO
//       saveTemplateObject(block, name);
//     }
//   } else {
//     // delete
//     saveTemplate(block, name);
//   }

  // refresh the dropdown selections
  window.location.reload(true);

  Blockly.Xml.DomToWorkspace(
    Blockly.Xml.blockToDom(block, true),
    Blockly.mainWorkspace,
  );
  console.log(Blockly.mainWorkspace.getAllBlocks());
}

export default deleteBlockCallback;
