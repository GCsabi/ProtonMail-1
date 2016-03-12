var client = require("./data.js");

client.app.on("ready", function(){
    // Application Startup
    var main = new client.browserwindow({
        title: client.name,
        width: 600,
        height: 300,
        useContentSize: true,
        center: true,
        resizable: false,
        fullscreenable: false
    });
    main.loadURL("file://" + __dirname + "/main/index.html");
    main.on("closed", function(){
        client.browserwindow.getAllWindows().forEach(function(v){
            v.close();
        });
        client.app.quit();
    });
});
