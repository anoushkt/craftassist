/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file defines the main Blockly component and basic layout of the template generator.
 */

import React from "react";
import "./App.css";
import "blockly/blocks";
import saveGenerators from  "./fileHandlers/saveGenerators"
import "./block/random";
import "./block/textBlock";
import "./block/parent";
import restore from "./fileHandlers/readFromFile";
import Button from "@material-ui/core/Button";
import filterFunction from "./dropdownFunctions/filterFunction";
import searchForBlocks from "./dropdownFunctions/searcher";
import highlightSelectedText from "./highlightSelectedText";
import getCodeForBlocks from "./codeGenerator/getCodeForBlocks";
import BlocklyComponent, { Block, Value, Field, Shadow } from "./Blockly";
import { Container, Row, Col } from "react-grid-system";
import saveChanges from "./saveChanges";
import BlocklyJS from "blockly/javascript";

const alphaSort = require("alpha-sort");

var spans = localStorage.getItem("spans");
if (spans) {
  // saved information about spans exists
  window.spans = JSON.parse(spans);
} else {
  // no saved information, initialise
  window.spans = {};
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.simpleWorkspace = React.createRef();
  }
  //componentDidMount() {
  //restore();
  // }

  generateCode = () => {
    // clear the boxes to hold generations
    clear();
    var numberOfGenerations = document.getElementById("numberOfGen").value;
    if (!numberOfGenerations) {
      // no input has been provided, default to 1 generation
      numberOfGenerations = 1;
    }
    var i = 0;
    while (i < numberOfGenerations) {
      i++;
      getCodeForBlocks();
    }
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <BlocklyComponent
            ref={this.simpleWorkspace}
            readOnly={false}
            trashcan={true}
            media={"media/"}
            move={{
              scrollbars: true,
              drag: true,
              wheel: true,
            }}
          >
            <Block type="random" />
            <Block type="parent" />
            <Block type="textBlock" />
          </BlocklyComponent>
        </header>

        <Container id="searchBar">
          <Row>
            <Col
              sm={3}
              id="searchInput"
              contentEditable="true"
              onKeyUp={filterFunction}
              placeholder="Search for blocks.."
            ></Col>
          </Row>
          <Row>
            <ul id="UL">{listItems}</ul>
          </Row>
        </Container>

        <div id="containersForText">
          <Row>
            <Col sm={3} offset={{ md: 1 }}>
              {" "}
              Surface forms{" "}
            </Col>
            <Col sm={3} offset={{ md: 1 }}>
              {" "}
              Enter logical forms{" "}
            </Col>
          </Row>

          <Row>
            <Col
              sm={3}
              id="surfaceForms"
              contentEditable="true"
              offset={{ md: 1 }}
            ></Col>
            <Col sm={6} offset={{ md: 1 }}>
              <pre id="actionDict" contentEditable="true"></pre>
            </Col>
          </Row>
        </div>

        <div id="buttons">
          <Row>
            <Col sm={1}>
              <Button
                id="highlight"
                variant="contained"
                color="primary"
                onClick={highlightSelectedText}
              >
                Highlight
              </Button>
            </Col>

            <Col sm={1}>
              <Button
                id="saveChanges"
                variant="contained"
                color="primary"
                onClick={saveChanges}
              >
                Save changes
              </Button>
            </Col>
            <Col sm={1}>
              <Button
                id="generator"
                variant="contained"
                color="primary"
                onClick={this.generateCode}
              >
                Generate code
              </Button>

              <input
                id="numberOfGen"
                placeholder="Number of generations"
              ></input>
            </Col>
            <Col sm={1}>
              <Button
                id="clear"
                variant="contained"
                color="primary"
                onClick={clear}
              >
                Clear boxes
              </Button>
            </Col>

            <Col sm={1}>
              <Button
                id="restorer"
                variant="contained"
                color="primary"
                onClick={restore}
              >
                Restore
              </Button>
            </Col>
          </Row>
        </div>

        <div>
          <div id="codeHeading">Generated surface-logical forms</div>
          <pre id="generatedCode" contentEditable="true"></pre>
        </div>
      </div>
    );
  }
}

export default App;

var textList = localStorage.getItem("blocks");
var text;
if (textList) {
  // the dropdown has been populated
  text = JSON.parse(textList).sort(alphaSort.ascending);
} else {
  // the dropdown has only the default element
  text = ["Custom block"];
  localStorage.setItem("blocks", JSON.stringify(text));
}
var listItems = text.map((str) => (
  // map each string to a list element
  <li>
    <a
      onClick={() => {
        document.getElementById("searchInput").innerText = str;
        searchForBlocks();
      }}
    >
      {str}
    </a>
  </li>
));

// This function clears the data holding boxes
function clear() {
  document.getElementById("surfaceForms").innerText = "";
  document.getElementById("actionDict").innerText = "";

  document.getElementById("generatedCode").innerText = "";
}
