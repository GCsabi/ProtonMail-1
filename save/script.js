(function(){
    "use strict";

    /* App */
    let client = require("../data.js");
    let viewport = client.remote.getCurrentWindow();

    /* Done, Exit Out */
    function done () {
        client.$("input").prop("readonly", true).blur().unbind();
        client.$("button").prop("disabled", true).blur().unbind();
        error("Done!");
        setTimeout(function(){
            viewport.close();
        }, 800);
    }

    /* Save User Data */
    function set (path, pin, username, password, mailbox) {
        let passcode = client.code.hash(pin);
        let datapoints = [passcode.hash, passcode.salt, username, password, mailbox]
            .map(function(v){return v || ""}).map(btoa);
        let databuffer = datapoints.slice(2, 5).join("\0");
        let encryption = client.code.encrypt(passcode.salt + pin, databuffer);
        let returndata = [datapoints[0], datapoints[1], encryption.checksum, encryption.data].join("\0");
        // Save
        if (client.file.existsSync(path)) {
            if (confirm("A login save with that name already exists, overwrite?")) {
                client.file.writeFileSync(path, returndata, "utf8");
                done();
            }
        }
        else {
            client.file.writeFileSync(path, returndata, "utf8");
            done();
        }
    }

    function error (text) {
        client.$("input").blur();
        client.$(".toolitem").css("display", "none");
        client.$("#error_tool").css("display", "block").html(text ? text : "");
    }

    /* Run scripts after fully loaded */
    window.addEventListener("load", function() {

        // Tooltip position
        let tooltip = client.$("#tooltip");
        setInterval(function(){
            let anchor = tooltip.attr("anchor-y") | 0;
            let place = anchor - (tooltip.outerHeight(true) / 2);
            tooltip.css("top", place + "px");
        }, 20);

        // Tooltip activation
        let tooltipghost = client.$("<div>");
        client.$("input, #submit_btn").focus(function(){
            let element = client.$(this);
            let anchor = element.offset().top + (element.outerHeight(true) / 2);
            tooltipghost.stop().css({y: tooltip.attr("anchor-y") | 0}).animate({y: anchor}, { duration: 700, step: function(a){tooltip.attr("anchor-y", a)}});
            client.$(".toolitem").css("display", "none");
            client.$("#" + element.attr("id").split("_")[0] + "_tool").css("display", "block");
        });
        client.$("#name_field").focus();

        // Username
        client.$("#name_field").on("input", function(){
            let value = client.$("#name_field").val().replace(/\W/g, "");
            client.$("#name_tool_result")
                .html((value ? value : "filename") + ".protonmail")
                .css({color: (value ? "#219911" : "#F20000")})
        });

        // PIN
        client.$("#pin_field").on("input", function(){
            let value = client.$("#pin_field").val().replace(/\W/g, "");
            let color = (value.length < 4 ? "#F20000" : "#219911");
            client.$("#pin_tool_length").css({color: color});
            client.$("#pin_tool_result").html(value ? value : "PIN").css({color: color});
        });

        // Save Location
        client.$("#save_field").on("change", function(){
            client.$("#save_tool_result").html(
                client.$(this).is(":checked") ? "In-App" : "Manually"
            );
        });

        // Cancel
        client.$("#stop_btn").click(function(){
            viewport.close();
        });

        // Reset
        client.$("#reset_btn").click(function(){
            client.$("input").val("").trigger("input");
        });

        // Save
        client.$("#submit_btn").click(function(){
            // Track Errors
            let errors = [];
            // Name
            let filename = (client.$("#name_field").val() || "").replace(/\W/g, "")
            if (filename.length < 1) errors.push("Save name cannot be empty!");
            filename += ".protonmail";
            // PIN
            let pincode = (client.$("#pin_field").val() || "").replace(/\W/g, "");
            if (pincode.length < 4) errors.push("PIN must be at least four characters!");
            // Credentials
            let username = client.$("#username_field").val() || "";
            let password = client.$("#password_field").val() || "";
            let mailbox = client.$("#mailbox_field").val() || "";
            // Save Location
            let savepref = client.$("#save_field").is(":checked");
            // Check Accumulative Errors
            if (errors.length > 0) {
                error(errors.join("<br>"));
                return;
            }
            // If Save Location Is Set To Manual, Get Location
            if (savepref) {
                let savelocation = client.path.join(client.save, filename);
                set(savelocation, pincode, username, password, mailbox);
            }
            else {
                client.dialog.showOpenDialog(viewport, {
                    title: "Where to save your login?",
                    defaultPath: client.home,
                    properties: ["openDirectory"]
                }, function (folder) {
                    if (folder instanceof Array) {
                        let savelocation = client.path.join(folder[0], filename);
                        set(savelocation, pincode, username, password, mailbox);
                    }
                    else error("No location selected.");
                })
            }
        });
    });
})()
