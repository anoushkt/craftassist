import * as Blockly from "blockly/core";
import "blockly/javascript";
import customInit from "./customInit"

Blockly.Blocks["random"] = {
  init: function () {
    this.appendValueInput("next")
      .setCheck(null)
      .appendField("random over")
      .appendField(new Blockly.FieldTextInput("default"), "randomCategories");
    this.setOutput(true, null);
    this.setColour(230);
    this.setNextStatement(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    customInit(this);
  },
};

Blockly.JavaScript["random"] = function (block) {
  console.log(block.getNextStatement());
  //Blockly.JavaScript.statementToCode(block,"next");
  var valueName = block.getFieldValue("name");

  // Information about template/template objects
  var templatesString = localStorage.getItem("templates");

  var code;

  if (templatesString) {
    // If information about the template/template object exists, we use it
    var templates = JSON.parse(templatesString);
    code = templates[valueName]["code"];
  }

  return [JSON.stringify(code), Blockly.JavaScript.ORDER_ATOMIC];

  //return [JSON.stringify(code), Blockly.JavaScript.ORDER_ATOMIC];
};
