import * as Blockly from "blockly/core";
import "blockly/javascript";
import saveBlockCallback from "./rightClickCallbacks/saveBlockCallback";
import tagBlockCallback from "./rightClickCallbacks/tagBlockCallback";

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

// Custom right click menu for the block. We add a saveBlock and tagBlock option.

const customInit = (block) => {
  const menuCustomizer = (menu) => {
    const saveOption = {
      text: "Save by name",
      enabled: true,
      callback: () => saveBlockCallback(block),
    };
    menu.push(saveOption);

    const tagOption = {
      text: "Save by tag",
      enabled: true,
      callback: () => tagBlockCallback(block),
    };
    menu.push(tagOption);

    return menu;
  };
  block.customContextMenu = menuCustomizer;

  /*block.select=function(){
      Blockly.selected = this;
      this.addSelect();
      //window.alert(Blockly.selected);
    
    
    //Blockly.fireUiEvent(this.workspace.getCanvas(), 'blocklySelectChange');
  
    }*/
};
