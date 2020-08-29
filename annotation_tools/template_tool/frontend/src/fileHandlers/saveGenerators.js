
/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file contains the definition of a function to dump the information in local storage to a file, by making a request to the backend.
 */

var fileDownload = require('js-file-download');
function saveGenerators() {
    // dump the current local storage information to a file
    var toSave = [];
    var spans = localStorage.getItem("spans");
    var templates = localStorage.getItem("templates");

    if(!templates) return;
    templates=JSON.parse(templates);
    for(var template in templates){
        var surfaceForms=templates[template]["surfaceForms"];
        var code=templates[template]["code"];
        
        var toPush1=JSON.stringify({
            spans:spans
        });
        //`info={"span":"`+spans +`,"surfaceForms":surfaceForms, "code":code};`
        var toPush2="\n"+ template + `=generator(info)`;
        var toPush=toPush1+toPush2;
        toSave.push(toPush);
    }
    console.log(toSave);
    
    fileDownload(toSave, 'filename.py');
    
    toSave={"g":"he"};
    //callAPI(toSave);
  }
  
  function callAPI(data) {
    const HOST = "http://localhost:";
    const PORT = "9000";
    fetch(HOST + PORT + "/readAndSaveGenerators", {
      method: "POST",
      headers: {
        Accept: "text/json",
        "Content-Type": "text/json",
      },
  
      body: JSON.stringify(data),
    })
      .then((res) => res.text())
      .then((res) => this.setState({ apiResponse: res }))
      .catch((err) => err);
  }
  
  export default saveGenerators;
  