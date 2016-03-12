(function(){
    "use strict";

    /* App */
    let client = require("../data.js");
    let windows = { this: client.remote.getCurrentWindow() };

    /* Load A Login, Opens Window */
    function load () {
        // Normalise Path, Just In Case
        let path = client.path.normalize([].slice.call(arguments, 0, 1)[0]);
        let file = client.path.basename(path);
        // Check For Pre-Existing Window
        if (windows[path]) return;
        // Check File
        if (file.split(".").pop() != "protonmail") throw "That is not a ProtonMail login file.";
        if (!client.file.existsSync(path)) throw "That file does not exist.";
        // Get File Contents While We Know It Exists
        let data = client.file.readFileSync(path, "utf8");
        // If File Wasn't Stored In-App, Ask For Import
        if (client.path.dirname(path) != client.save) {
            if (confirm("Do you want to import that login save?")) {
                let saveto = client.path.join(client.save, file);
                if (client.file.existsSync(saveto)) {
                    if (confirm("A login save with that name already exists, overwrite?")) {
                        client.file.writeFileSync(saveto, data, "utf8");
                    }
                }
                else client.file.writeFileSync(saveto, data, "utf8");
            }
        }
        // Resolve File Location To Load, Append Base64-Ified File Data
        let page = client.path.resolve(__dirname, "..", "login/index.html#" + btoa(data));
        // Load File Into Window
        windows[path] = new client.browserwindow({
            title: client.name + " - " + client.path.basename(file, ".protonmail"),
            width: 435,
            height: 230,
            useContentSize: true,
            center: true,
            resizable: false,
            fullscreenable: false
        });
        windows[path].loadURL("file://" + page);
        windows[path].on("closed", function(){
            delete windows[path];
        });
    }

    /* Create A New Login, Opens Window */
    function create () {
        // Check For Pre-Existing Window
        if (windows["create"]) return;
        // Resolve File Location To Load, Append Base64-Ified File Data
        let page = client.path.resolve(__dirname, "..", "save/index.html");
        // Load File Into Window
        windows["create"] = new client.browserwindow({
            title: client.name + " - Create New Login",
            width: 550,
            height: 410,
            useContentSize: true,
            center: true,
            resizable: false,
            fullscreenable: false
        });
        windows["create"].loadURL("file://" + page);
        windows["create"].on("closed", function(){
            delete windows["create"];
        });
    }

    window.addEventListener("load", function() {
        // Open A Specific Login Save
        client.$("#open_btn").click(function(){
            client.dialog.showOpenDialog(windows.this, {
                title: "Find and open a login save.",
                defaultPath: client.home,
                filters: [
                    {
                        name: "Login Saves",
                        extensions: ["protonmail"]
                    }
                ],
                properties: ["openFile"]
            }, function (file) {
                if (file instanceof Array) load(file[0]);
            })
        });

        // Open Local Save Location
        client.$("#files_btn").click(function(){
            client.open(client.save);
        });

        // Create A New Login Save
        client.$("#new_btn").click(create);

        // List All Locally Saved Logins
        function recents () {
            client.$("#recent_logins").html("");
            try {
                client.file.readdirSync(client.save)
                    .map(function(v){
                        return client.path.basename(v, ".protonmail");
                    })
                    .filter(client.junk.not)
                    .forEach(function(v){
                        let item = client.$("<div>").html(v).addClass("login_item").attr("src", client.path.join(client.save, v + ".protonmail")).click(function(e){
                            let loc = client.$(this).attr("src") || false;
                            if (false != loc) load(loc);
                        })
                        client.$("#recent_logins").append(item);
                        return;
                    });
            }
            catch(e) { throw e; }
        }
        client.file.watch(client.save, {persistent: true}, recents);
        recents();
    });
})()
