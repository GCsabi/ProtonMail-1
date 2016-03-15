(function(){
    "use strict";

    /* App */
    let client = require("../data.js");
    let viewport = client.remote.getCurrentWindow();

    /* Data */
    let login = atob(window.location.hash.substring(1));
    login = login.split("\0").map(function(v, i){return i < 2 ? atob(v) : v});

    /* Onload Scripts */
    window.addEventListener("load", function() {
        client.$("#pin_field").focus();

        // Unlock Button
        client.$("#unlock_btn").click(function(){
            // Test Whether PIN Is Long Enough
            let pin = client.$("#pin_field").val() || "";
            if (pin.length < 4) {
                alert("That PIN is not long enough.");
                return;
            }
            // Test PIN Validity Based On PIN Hash
            let hash = client.code.hash(login[1] + pin, false).hash;
            if (hash != login[0]) {
                alert("That PIN is incorrect.");
                return;
            }
            // Attempt To Decrypt Data
            let data = client.code.decrypt(login[1] + pin, login[3]);
            // Test Data Validity
            if (client.code.hash(data, false).hash != login[2]) {
                alert("Data did not decrypt correctly.");
                return;
            }
            // IT WORKED! Lock Everything Down.
            client.$("input").prop("readonly", true).blur().unbind().remove();
            client.$("button").prop("disabled", true).blur().unbind().remove();
            viewport.hide();
            viewport.setResizable(true);
            viewport.setMaximizable(true);
            viewport.setFullScreenable(true);
            viewport.setBounds({x: 0, y: 0, width: 900, height: 600});
            viewport.center();
            client.$("#login_view").get()[0].loadURL("https://www.protonmail.com/inbox");
            viewport.show();
            // Set Data To Login
            data = data.split("\0").map(atob);
            login = {username: data[0], password: data[1], mailbox: data[2]};
        });

        // Press Enter To Activate Default Button
        client.$(window).keypress(function(e){
            if ((ev.keyCode ? ev.keyCode : ev.which) == 13) client.$("#unlock_btn").click();
        });

        // Login Process
        client.$("#login_view").on("pageNavigated", function (e) {
            switch(e.detail){
                case "https://mail.protonmail.com/login":
                case "https://v2.protonmail.com/login":
                    console.log("logging in", login.username);
                    // Unlock and send data.
                    var _func = vi7LoginScript.toString();
                    var _user = new Buffer(login.username).toString("base64");
                    var _pass = new Buffer(login.password).toString("base64");
                    var _code = ["(", _func, ")(\"", _user, "\",\"", _pass, "\")"].join("");
                    e.target.executeJavaScript(_code);
                    break;
                case "https://mail.protonmail.com/login/unlock":
                case "https://v2.protonmail.com/login/unlock":
                    // Unlock and send data.
                    var _func = vi7LoginScript.toString();
                    var _mail = new Buffer(login.mailbox).toString("base64");
                    var _code = ["(", _func, ")(\"", _mail, "\")"].join("");
                    e.target.executeJavaScript(_code);
                    break;
            }
        });
    });

    /* Detect Events In Webview */
    window.addEventListener("load", function(){
        let webview = client.$("#login_view");
        // Open links in user's default browser
        webview.on("new-window", function(e){
            client.open(e.url);
        });
        // Detect main and inpage navigation
        let currUrl = "https://www.protonmail.com/inbox";
        webview.on("load-commit", function(){
            let url = this.getURL();
            if (url != currUrl) {
                currUrl = url;
                let event = new CustomEvent("pageNavigated", {detail: url});
                event.initEvent("pageNavigated", true, true);
                this.dispatchEvent(event);
            }
        });
        // Detect Console messages
        webview.on("new-window", function(e){
            console.log("GP:", e.message);
        });
    });

    /* Inpage Script To Be Injected */
    function vi7LoginScript () {
        if ("function" != typeof jQuery) throw("jQuery is not present!");
        var parameters = [].slice.call(arguments).map(function(value){
            try{return atob(value)}
            catch(e){return value || ""}
        });
        switch(window.location.href){
            case "https://mail.protonmail.com/login":
            case "https://v2.protonmail.com/login":
                jQuery("#username").val(parameters[0])
                    .trigger("compositionstart").trigger("compositionend");
                jQuery("#password").val(parameters[1])
                    .trigger("compositionstart").trigger("compositionend");
                jQuery("button[type='submit']").click();
                break;
            case "https://mail.protonmail.com/login/unlock":
            case "https://v2.protonmail.com/login/unlock":
                jQuery("#password").val(parameters[0])
                    .trigger("compositionstart").trigger("compositionend");
                jQuery("button[type='submit']").click();
                break;
        }
    }
})()
