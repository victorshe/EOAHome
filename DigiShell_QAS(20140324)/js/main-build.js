seajs.config({
    vars:{
        'locale': window.navigator.language
    },
    alias: {
        'jquery': 'jquery/jquery/{jqueryVersion}/jquery',
        'backbone': 'digishell/0.2/backbone'
    },
    preload:["jquery","backbone","jquery/bootstrap/bootstrap/2.3.2/bootstrap",
        ("JSON" in window ? "":"json2/json2"),
        "./js/ace/ace-elements.min",
        "./js/ace/ace.min",
    ]
});
seajs.use("digishell/0.2/core",function(digishell){
    this.digishell = digishell;
});