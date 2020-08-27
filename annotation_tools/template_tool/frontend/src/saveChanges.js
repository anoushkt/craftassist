import * as Blockly from "blockly/core";

import getTypes from "./helperFunctions/getTypes";
import saveToFile from "./fileHandlers/saveToFile";

function saveChanges() {
  const generated = localStorage.getItem("current").split("\n");
  const current = document.getElementById("surfaceForms").innerText.split("\n");
  const allBlocks = Blockly.mainWorkspace.getAllBlocks();
  const types = getTypes(allBlocks).join(" ");
  var savedInfo = localStorage.getItem("templates");
  if (savedInfo) {
    savedInfo = JSON.parse(savedInfo);
  } else {
    savedInfo = {};
  }
  if (!savedInfo[types]) {
    window.alert("save the template first");
    return;
  }
  savedInfo[types]["changes"] = [];
  for (var i = 0; i < generated.length; i++) {
    if (generated[i] != current[i]) {
      savedInfo[types]["changes"].push([generated[i], current[i]]);
    }
  }
  localStorage.setItem("templates", JSON.stringify(savedInfo));
  saveToFile();
}
export default saveChanges;
