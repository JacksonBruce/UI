

(function ($) {

    function req(opt) { $.ajax(opt) }
    function isBaseType(o) { return o === null || o instanceof Date || (t = typeof (o)) == "string" || t == "number" || t == "boolean"; }

    ///xml 填充扩展
    (function () {
        function setValue(e, x) {
            var p = "data-defaultValue"
            $.each(e, function (i, n) {
                var tag = n.tagName, f = (n = $(n)).attr("data-fill")
                , v = f && (f = f.split(":")).length > 1 ? x.attr(f[1]) : x.text();
                if (!v && (p = n.attr(p)))
                { v = p; }
                if (n.is("input,textarea,select")) {
                    n.val(v);
                }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v); }
                else if (tag == "IMG") { n.attr("src", v); }
                else { n.html(v); }
            })
        }
        function renderList(e, x, fn, path) {
            var f, cs, v, p;
            if ((f = e.children("." + (cs = "template"))).length && (v = x.children()).length > 0) {
                f.nextAll().remove();
                p = f.parent();
                $.each(v, function (i, n) { fn.call(f.clone().removeClass(cs).appendTo(p), n, path); });
                return true;
            }
            return false;
        }
        $.prototype.fillXml = function (url, data, opt) {
            var root = $(this)
                , fn = function (x, path) {

                    var self = this, f, cs
                        , tag = x.tagName
                        , arg = { cancel: false, iterate: true, path: (path = (path || "") + (path ? "/" : "") + tag), sender: self }
                    , e = $("#" + ((x = $(x)).attr("id") || tag), self), v
                    if (e.length == 0) {
                        e = $("#" + path.replace(/\//g, "_"), self)
                        if (e.length == 0) {
                            e = $("[data-fill^='" + path + ":'],[data-fill='" + path + "']", self);
                        }
                    }
                    arg.target = e;
                    if (opt && typeof (f = opt.filling) == "function")
                    { f(x, arg) }
                    if (!arg.cancel) {

                        if (e.length > 0) {
                            if (renderList(e, x, fn, path)) {
                                arg.iterate = false;
                            }
                            else {
                                setValue(e, x);
                            }
                        }

                    }
                    if (arg.iterate) {
                        $.each(x.children(), function (i, n) { fn.call(self, n, path) })
                    }
                }
            req({
                url: url
                , dataType: "xml"
                , data: data
                , success: function (d) {
                    if (!renderList(root, $(d).children(), fn, "")) {
                        $.each($(d).children().children(), function (i, n) { fn.call(root, n); })
                    }
                    if (opt && typeof (opt.complete) == "function") { opt.complete.call(root, d); }
                }
            });
        }
    })();

})(window.jQuery)