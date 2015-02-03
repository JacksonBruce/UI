

(function ($) {

    function req(opt) {
        $.ajax(opt);
    }
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
    /// json填充扩展
    (function () {
        function setValue(e, v, o, path, opt) {
            var p = "data-defaultValue"

            $.each(e, function (i, n) {
                var tag = n.tagName
                    , pr = (n = $(n)).attr("data-property")
                    , arg = { item: o, path: path }, fn = opt && opt.formater
                    , rgx, m;

                if (v === null && (p = n.attr(p))) { v = p; }
                else if (typeof (v) == "string" && (m = (/Date\((-?\d+)\)/).exec(v))) {
                    v = new Date(parseInt(m[1]));
                }

                if (typeof (fn) == "function") {
                    v = fn.call(n, v, arg);
                }
                else if (v instanceof Date) {
                    var fm = n.attr("data-dateFormat"), wday
                    // v=new Date();
                    if (fm) {
                        wday = v.getDay();
                        if ((m = (rgx = /\{w:([^\}]+)\}/).exec(fm))) {
                            m = (m = m[1].split(",")).length == 7 ? m[wday] : "";
                            fm = fm.replace(rgx, m);
                        }
                        v = fm.replace(/\{yyyy\}/g, v.getFullYear()).replace(/\{MM\}/g, v.getMonth() + 1).replace(/\{dd\}/g, v.getDate()).replace(/\{mm\}/g, v.getMinutes()).replace(/\{hh\}/, v.getHours()).replace(/\{ss\}/g, v.getSeconds());
                    }
                    else {
                        v = v.toLocaleString();
                    }
                }


                if (pr) {
                    if (pr == ":html") { n.html(v) }
                    else if (pr == ":text") { n.text(v); }
                    else { n.attr(pr, v); }
                }
                else if (n.is(":checkbox,:radio")) {
                    var tmp = n.val();
                    if (tmp === "") { n.val(v) }
                    else { n[0].checked = n.val() == v + "";}
                }
                else if (n.is("input,textarea,select")) { n.val(v); }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v); }
                else if (tag == "IMG") { n.attr("src", v); }
                else {
                    if (path == "Type") { alert("text"); }
                    n.text(v);
                }
            })
        }

        $.prototype.fill = function (url, data, opt) {
            var root = $(this), callFilling = function (opt, arg, x) {
                    var f;
                    if (opt && typeof (f = opt.filling) == "function")
                    { f(x, arg) }
                }
            , fn = function (x, path, obj, index) {

                var self = this, f, cs
                    , arg = { cancel: false, path: (path = (path || "")), sender: self }
                    , arr = path ? path.split(".") : []
                    ///查找填充目标
                    , find = function (m) {
                        if (!m) return null;
                        var t
                        try { t = $("#" + m.replace(/\./g, "_"), self); } catch (x) { t = $() }
                        if (t.length == 0) {
                            t = $("[data-field='" + m + "']", self);
                            if (t.length == 0) {
                                t = $("[data-fill='" + m + "']", self);
                                if (t.length == 0) {
                                    t = $("[name='" + m + "']", self);
                                }
                            }
                        }
                        return t;
                    }
                , e = arr.length == 0 ? self : find(arr[arr.length - 1]);
                if (!e || e.length == 0) { e = (e = find(path)).length ? e : self; }

                arg.target = e;
                callFilling(opt, arg, x);
                if (arg.cancel) { return }

                ///基础数据类型
                if (isBaseType(x)) {
                    if (root != e && e.length) {
                        setValue(e, x, obj, path, opt);
                    }
                    return;
                }
                ///填充列表数据
                if (x instanceof Array) {
                    var v, ics = "fill-item";
                    if ((f = e.children("." + (cs = "template"))).length || (f = e.find("." + cs)).length) {
                        ///如果不是追加，那么移除已填充的项
                        if (!(opt && opt.append)) { f.prevAll("." + ics).remove() }
                        $.each(x, function (i, n) {
                            fn.call(f.clone().removeClass(cs).addClass(ics).insertBefore(f), n, path, i);
                        });
                    }
                    return;
                }
                ///填充对象数据
                if (x instanceof Object) {
                    for (var i in x) {
                        if (!i) continue;
                        var item = x[i];
                        fn.call(e, item, path + (path ? "." : "") + i, x, index);
                    }
                    return;
                }
            }
            , fi = function (d) {
                if (d !== null) {
                    if (isBaseType(d)) {
                        setValue(root, d, null, "", opt);
                    }
                    else { fn.call(root, d) }
                }
                if (opt && typeof (opt.complete) == "function") { opt.complete.call(root, d); }
            }
            if (typeof (url) != "string") {
                if (url) {
                    opt = data;
                    data = url;
                }
                fi(data);
            }
            else {
                req({
                    url: url
                    , type: "POST"
                    , dataType: "json"
                    , data: data
                    , success: function (d) { fi(d) }
                });
            }

            return this
        }

    })();
    ////获取model的扩展方法
    (function () {
        var getVal = function (e, pr) {
            var tag = e[0].tagName;
            if (pr === undefined) {
                pr = e.attr("data-property");
            }
            var v;
            if (pr) {
                if (pr == ":html") { v = e.html() }
                else if (pr == ":text") { v = e.text(); }
                else { v = e.attr(pr); }
            }
            else if (e.is(":checkbox,:radio")) {
                v = e[0].checked ? e.val() : null;
            }
            else if (e.is("input,textarea,select")) { v = e.val() }
            else if (tag == "IMG") { v = e.attr("src") }
            else { v = e.text() }
            return v;
        }
        $.prototype.model = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name", m = {}, errors = [];
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]")
                , function (i, e) {
                    var v, fn, err = false, n = (e = $(e)).attr(fd) || e.attr(fl) || e.attr(ne)
                    if (n) {
                        v = getVal(e);
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: e, value: v };
                            err = fn.call(s, v, arg);
                            v = arg.value;
                        }
                        if (v !== null) {
                            var tmp = m[n];
                            //m[n] = typeof (tmp) == "string" ? tmp + ($.trim(tmp) == "" ? "" : ",") + v : v;
                           
                            if (tmp==null) { m[n] = v; }
                            else if (typeof (tmp) == "string"){ m[n] = [tmp, v] }
                            else {tmp.push(v)}
                        }
                        if (err) {
                            errors.push({ element: e, value: v, name: n });
                        }
                    }
                });
            return { errors: errors && errors.length ? errors : null, model: m };
        }
        $.prototype.clearModel = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name";
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]")
                , function (i, e) {
                    var v, fn, tag = e.tagName, n = (e = $(e)).attr(fd) || e.attr(fl) || e.attr(ne), pr = e.attr("data-property")
                    if (n) {
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: e, cancel: false };
                            v = fn.call(s, getVal(e, pr), arg);
                            if (arg.cancel) return;
                        } else { v = fn || ""; }
                        if (pr) {
                            if (pr == ":html") { e.html(v) }
                            else if (pr == ":text") { e.text(v); }
                            else { e.attr(pr, v); }
                        }
                        else if (e.is(":checkbox,:radio")) {
                            if (v === "") { v = getVal(e, pr) }
                            e[0].checked = v && e.val() == v;
                        }
                        else if (e.is("input,textarea,select")) { e.val(v) }
                        else if (tag == "IMG") { e.attr("src", v) }
                        else { e.text(v) }


                    }
                });
            return s;
        }
    })();

    $.extend({
        ///将模型转换成键值对字典。
        modelToNamesValues: function (m) {
            if (isBaseType(m)) return m;
            var d = {}, fn = function (o, prefix) {
                if (o instanceof Array) {
                    for (var i = 0; i < o.length; i++) {
                        sn(prefix + "[" + i + "]", o[i]);
                    }
                }
                else if (o instanceof Object)
                {
                    for (var i in o) {
                        if (!i) continue;
                        sn(prefix + (prefix ? "." : "") + i, o[i]);
                    }
                }
            }
            , sn = function (k, v) {
                
                if (isBaseType(v)) { d[k] = v instanceof Date ? v.toJSON(): v }
                else {fn(v,k)}
            }
            fn(m, "");
            return d;
        }
    });


})(window.jQuery)
