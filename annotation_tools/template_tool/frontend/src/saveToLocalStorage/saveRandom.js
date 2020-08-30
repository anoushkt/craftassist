import saveToFile from "../fileHandlers/saveToFile";
function saveRandomTemplateObject(block,name){
    if (localStorage.getItem("templates")) {
        // some templates have been stored already
        var templates = JSON.parse(localStorage.getItem("templates"));
    } else {
        // initialise templates
        templates = {};
    }
    var randomOver=block.getFieldValue("randomCategories").split(", ");
    var surfaceForms=[];
    var codes=[];
    randomOver.forEach(templateObject => {
        const code= templates[templateObject]["code"];
        const surfaceForm=templates[templateObject]["surfaceForms"];
        codes.push(code);
        surfaceForms.push(surfaceForm);
    });
    templates[name]={};
    templates[name]["code"]=codes;
    templates[name]["surfaceForms"]=surfaceForms;
    localStorage.setItem("templates", JSON.stringify(templates));
    saveToFile();
}

export default saveRandomTemplateObject