module.exports = new function ProtonMailClient () {
    /* Scope */
    var that = this;

    /* Application */
    this.name = "ProtonMail";
    this.cite = "org.vi7.protonmail";
    this.electron = require("electron");
    this.remote = require("electron");
    if (this.electron.remote) {
        this.remote = this.electron.remote;
        this.electron = this.remote.require("electron");
    }
    this.app = this.electron.app;
    this.browserwindow = this.electron.BrowserWindow;
    this.dialog = this.electron.dialog;
    this.menu = this.electron.Menu;
    this.menuItem = this.electron.MenuItem;

    /* Dependencies */
    this.$ = require("jquery");
    this.file = require("fs");
    this.path = require("path");
    this.save = (function(){
        var a = require("appdirectory");
        var b = new a(that.cite).userData();
        var c = that.path.normalize(b + "/Logins");
        try {that.file.accessSync(c)}
        catch (e) {that.file.mkdirSync(c)}
        return c;
    })();
    this.home = require("homedir")();
    this.junk = require("junk");
    this.open = require("open");
    this.code = new function ProtonMailClientCrypto () {
        var cache = [require("crypto"), "aes256", "sha256"];
        // Hash Some Data, Auto Generates Salt
        this.hash = function ProtonMailClientCryptoHash (data, doSalt) {
            if ("string" != typeof data) data = "";
            if ("boolean" != typeof doSalt) doSalt = true;
            var salt = doSalt != true ? "" : (function(){
                var a = "", b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                while (a.length <= 20) a += b.charAt(Math.floor(Math.random() * 62));
                return a;
            })();
            var hash = cache[0].createHash(cache[2]).update(salt + data).digest("hex");
            return {hash: hash, salt: salt};
        }
        // Encrypt Some Data
        this.encrypt = function ProtonMailClientCryptoEncrypt (pass, data) {
            if ("string" != typeof pass) throw "You have not provided a passphrase.";
            if (pass.length < 4) throw "You passphrase must be at least four characters.";
            if ("string" != typeof data) data = "";
            var codecypher = cache[0].createCipher(cache[1], pass);
            var product = (codecypher.update(data, "utf8", "hex")) + codecypher.final("hex");
            return { data: product, checksum: this.hash(data, false).hash };
        }
        // Decrypt Some Data
        this.decrypt = function ProtonMailClientCryptoDecrypt (pass, data, checksum) {
            if ("string" != typeof pass) throw "You have not provided a passphrase.";
            if (pass.length < 4) throw "You passphrase must be at least four characters.";
            if ("string" != typeof data) data = "";
            if ("undefined" != typeof checksum) {
                if ("string" != typeof checksum) throw "Your checksum is not a string.";
                if (checksum.length < 1) throw "Your checksum is empty";
            }
            var codecypher = cache[0].createDecipher(cache[1], pass);
            var product = (codecypher.update(data, "hex", "utf8")) + codecypher.final("utf8");
            if (checksum) {
                if (this.hash(product, false).hash != checksum) {
                    throw "Data didn't decrypt correctly.";
                }
            }
            return product;
        }
    }
};
