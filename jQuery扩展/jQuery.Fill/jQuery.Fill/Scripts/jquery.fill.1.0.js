

(function ($) {

    function req(opt) { $.ajax(opt) }
    function isBaseType(o) { return o === null || o instanceof Date || (t = typeof (o)) == "string" || t == "number" || t == "boolean"};

    /// json填充扩展
    (function () {
        function setValue(e, v, o, path, opt, propertyName) {
            var p = "data-defaultValue";

            $.each(e, function (i, n) {
                var tag = n.tagName
                    , pr = (n = $(n)).attr("data-property")
                    , arg = { item: o, path: path, propertyName: propertyName }, fn = opt && opt.formater
                    , rgx, m;

                if (v === null && (p = n.attr(p))) { v = p}
                else if (typeof (v) == "string" && (m = (/Date\((-?\d+)\)/).exec(v))) {
                    v = new Date(parseInt(m[1]))
                }

                if (typeof (fn) == "function") {
                    v = fn.call(n, v, arg)
                }
                else if (v instanceof Date) {
                    var fm = n.attr("data-dateFormat"), wday;
                    // v=new Date();
                    if (fm) {
                        wday = v.getDay();
                        if ((m = (rgx = /\{w:([^\}]+)\}/).exec(fm))) {
                            m = (m = m[1].split(",")).length == 7 ? m[wday] : "";
                            fm = fm.replace(rgx, m);
                        }
                        v = fm.replace(/\{yyyy\}/g, v.getFullYear()).replace(/\{MM\}/g, v.getMonth() + 1).replace(/\{dd\}/g, v.getDate()).replace(/\{mm\}/g, v.getMinutes()).replace(/\{hh\}/, v.getHours()).replace(/\{ss\}/g, v.getSeconds())
                    }
                    else {
                        v = v.toLocaleString()
                    }
                }


                if (pr) {
                    if (pr == ":html") { n.html(v) }
                    else if (pr == ":text") { n.text(v) }
                    else { n.attr(pr, v) }
                }
                else if (n.is(":checkbox,:radio")) {
                    var tmp = n.val();
                    if (tmp === ""||tmp=="on"||tmp===undefined) { n.val(v) }
                    else { n[0].checked = n.val() == v + ""}
                }
                else if (n.is("input,textarea,select")) { n.val(v) }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v) }
                else if (tag == "IMG") { n.attr("src", v); }
                else if(!n.children().length) {n.text(v)}
            })
        }

        $.prototype.fill = function (url, data, opt,cfn) {
            var fnstr = "function",tmp,root = $(this), callFilling = function (opt, arg, x) {
                var f,pn,fn="function";
                if (opt && typeof (f = opt.filling) == fn)
                { f(x, arg) }
                if (opt && opt.tree===true && (x instanceof Array) && x.length && (pn = arg.propertyName) && (pn == opt.children || pn.toLowerCase() == "children")) {
                    var creArg = { cancel: false, target: arg.target, children: x, item: arg.item };
                    if ((f=opt.creatingNodes)&&typeof(f)==fn)
                    {
                        f.call(root, creArg);
                    }
                    if (!creArg.cancel) {
                        var t = arg.target, tg = t.parent()[0].tagName;
                        t.addClass("has-children").next().clone().appendTo("<"+tg+"></"+tg+">").parent().appendTo(t);
                    }
                }
            }
            , fn = function (x, path, obj,propertyName, index) {

                var self = this, f, cs
                    , arg = { cancel: false,item:obj,propertyName:propertyName, path: (path = (path || "")), sender: self }
                    , arr = path ? path.split(".") : []
                    ///查找填充目标
                    , find = function (m) {
                        if (!m) return $();
                        var t;
                        try { t = $("#" + m.replace(/\./g, "_"), self) } catch (x) { t = $() }
                        if (t.length == 0) {
                            t = $("[data-field='" + m + "']", self);
                            if (t.length == 0) {
                                t = $("[data-fill='" + m + "']", self);
                                if (t.length == 0) {
                                    t = $("[name='" + m + "']", self)
                                }
                            }
                        }
                        return t
                    }
                , e = arr.length == 0 ? self : find(arr[arr.length - 1]);
                if (!e || e.length == 0) { e = (e = find(path)).length ? e : self }

                arg.target = e;
                callFilling(opt, arg, x);
                if (arg.cancel) { return }

                ///基础数据类型
                if (isBaseType(x)) {
                    if (root != e && e.length) {
                        setValue(e, x, obj, path, opt, propertyName);
                    }
                    return
                }
                ///填充列表数据
                if (x instanceof Array) {
                    var v, ics = "fill-item";
                    if ((f = e.children("." + (cs = "template"))).length || (f = e.find("." + cs)).length) {
                        ///如果不是追加，那么移除已填充的项
                        if (!(opt && opt.append)) { f.prevAll("." + ics).remove() }
                        $.each(x, function (i, n) {
                            var el = f.clone().removeClass(cs).addClass(ics);
                            if (opt && typeof (opt.creating) == "function")
                            {
                                var craArg = { cancel: false, item: n, index: i }
                                opt.creating.call(e, craArg, el);
                                if (craArg.cancel) return;
                            }
                            fn.call(el.insertBefore(f), n, path,"",i)
                        })
                    }
                    return
                }
                ///填充对象数据
                if (x instanceof Object) {
                    for (var i in x) {
                        if (!i) continue;
                        var item = x[i];
                        fn.call(e, item, path + (path ? "." : "") + i, x,i, index)
                    }
                    return
                }
            }
            , fi = function (d) {
                var  type_opt = typeof (opt);
                if (type_opt == fnstr) {
                    opt = typeof (cfn) == fnstr ? { complete: cfn, filling: opt } : { complete: opt };
                }
                else if (type_opt == "boolean") { opt = { pager: opt, complete: cfn } }
                if (d !== null) {
                    if (isBaseType(d)) {
                        setValue(root, d, null, "", opt)
                    }
                    else {
                        var p =opt? opt.pager:null, gtp = function (o,n, f) {
                                for (var i in o)
                                    if ((f && i === n) || n.some(function(a){return a== i.toLowerCase()}))return o[i];
                                return null;
                            }
                        if (p) {
                            var rows
                            if ((p = (typeof (p) == "string" ? gtp(d,p,true) : null) || gtp(d,["page", "pager", "paging", "pagination"]))
                                && (rows = gtp(d,["data", "rows", "list", "array", "collection"])) instanceof Array) {
                                d = rows
                            }
                        }
                        fn.call(root, d)
                        if (p)
                        {
                            
                            var el = root.find(".pager"), dpn = "data-page", btns = opt ? opt.pageButtons : null, paging = opt ? opt.paging : null
                                , total = gtp(p, ["total", "records"]), p_index = gtp(p, ["index", "pageindex"]), p_next = p_index + 1, p_prev = p_index - 1, p_count = gtp(p, ["count", "pagecount"])
                               
                                , p_size;
                            if (total>0 && (isNaN(p_count) || p_count <= 0)) {
                                p_size = gtp(p, ["size", "pagesize"]);
                                p_count = total / p_size + (total % p_size > 0 ? 1 : 0);
                            }
                            el.fill(p, opt);
                            if (p_count > 1) {

                                if (!el.length) { el = $("<div class='pager'><span class='number'></span></div>").appendTo(root); }
                                if (!el.attr("data-ini")) {
                                    var ev = function () {
                                        var s = $(this), n = Number(s.attr(dpn)), p_arg = {page:n,data:data,option:opt,cancel:false};
                                        if (typeof(paging) == fnstr)
                                        {
                                            paging.call(this, p_arg);
                                        }
                                        if (!p_arg.cancel) {
                                            if (!p_arg.data) { p_arg.data = {} }
                                            p_arg.data["pageindex"] = n;
                                            root.fill(url, p_arg.data, opt, cfn);
                                        }
                                    }
                                    if (el.live) { $(".pager a").live("click", ev); }
                                    else { root.on("click", ".pager a", ev); }
                                    el.attr("data-ini", true);
                                }
                                el.find(".next").attr(dpn, p_next >= p_count ? "" : p_next);
                                el.find(".prev").attr(dpn, p_prev < 0 ? "" : p_prev);
                                tmp = el.find(".number");
                                if (tmp.length) {
                                    if (!btns || isNaN(btns) || btns <= 0) { btns = 10 }
                                    var p_end = p_index + Math.ceil(btns / 2), p_start, item_css = "item";
                                    if (p_end >= p_end) { p_end = p_count - 1; }
                                    p_start = p_end - btns;
                                    if (p_start < 0) { p_start = 0 }
                                    tmp.empty();
                                    for (var i =p_start; i < p_end; i++) {
                                        $(p_index == i ? "<span class='" + item_css + " current'></span>" : "<a href='javascript:' class='" + item_css + "' " + dpn + "='" + i + "'></a>").appendTo(tmp).text(i + 1);
                                    }
                                }
                            }
                           
                           
                          

                        }
                    }
                }
                if (opt && typeof (opt.complete) == fnstr) { opt.complete.call(root, d) }
            };
            if (typeof (url) != "string") {
                if (url) {
                    opt = data;
                    data = url
                }
                fi(data)
            }
            else {
                if ((tmp = typeof (data)) == fnstr || tmp == "boolean") { cfn = opt; opt = data; data = null; }
                req({
                    url: url
                    , type: "POST"
                    , dataType: "json"
                    , data:$.toNameValues(data)
                    , success: function (d) { fi(d) }
                })
            }
            return this
        }

    })();
    ////获取modelState的扩展方法
    (function () {
        var getVal = function (e, pr) {
            var tag = e[0].tagName;
            if (pr === undefined) {
                pr = e.attr("data-property")
            }
            var v;
            if (pr) {
                if (pr == ":html") { v = e.html() }
                else if (pr == ":text") { v = e.text() }
                else { v = e.attr(pr) }
            }
            else if (e.is(":checkbox,:radio")) {
                v = e[0].checked ? e.val() : null
            }
            else if (e.is("input,textarea,select")) { v = e.val() }
            else if (tag == "IMG") { v = e.attr("src") }
            else if (!e.children().length) { v = e.text() }
            else { v = null }
            return v
        };
        $.prototype.modelState = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name", m = {}, errors = [];
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]")
                , function (i, e) {
                    var v, fn, err = false, lbls, j = $(e), n = j.attr(fd) || j.attr(fl) || j.attr(ne);
                    if (n) {
                        v = getVal(j);
                        if (j.valid && e.form) { try { if (!j.valid()) { err = true; lbls = $(e.form).validate().errorsFor(e) } } catch (x) { } }
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: j, errors: lbls, value: v };
                            err = fn.call(s, v, arg) || err;
                            v = arg.value;
                            if (arg.errors && !lbls)
                            { lbls = arg.errors }
                        }
                        if (v !== null) {
                            var tmp = m[n];
                            if (tmp == null) { m[n] = v }
                            else if (typeof (tmp) == "string") { m[n] = [tmp, v] }
                            else if (tmp instanceof Array) { tmp.push(v) }
                        }
                        if (err) { errors.push({ element: j, value: v, name: n, labels: lbls }) }
                    }
                });
            return { errors: errors && errors.length ? errors : null, model: m }
        };
        $.prototype.clearModel = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name";
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]")
                , function (i, e) {
                    var v, fn, tag = e.tagName, j = $(e), n = j.attr(fd) || j.attr(fl) || j.attr(ne), pr = j.attr("data-property");
                    if (n) {
                        fn = a ? a[n] : null;
                        if (typeof (fn) == "function") {
                            var arg = { element: j, cancel: false };
                            v = fn.call(s, getVal(j, pr), arg);
                            if (arg.cancel) return
                        } else { v = fn || "" }
                        if (pr) {
                            if (pr == ":html") { j.html(v) }
                            else if (pr == ":text") { j.text(v) }
                            else { j.attr(pr, v) }
                        }
                        else if (j.is(":checkbox,:radio")) {
                            if (v === "") { v = getVal(j, pr) }
                            j[0].checked = v && j.val() == v
                        }
                        else if (j.is("input,textarea,select")) { j.val(v) }
                        else if (tag == "IMG") { j.attr("src", v) }
                        else { j.text(v) }


                    }
                });
            return s
        }
    })();

    $.extend({
        ///将模型转换成键值对字典。提交复杂的数据模型，转换成键值对，服务端可以直接使用mvc的默认模型绑定器
        toNameValues: function (m) {
            if (isBaseType(m)) return m;
            var d = {}, fn = function (o, prefix) {
                if (o instanceof Array) {
                    for (var i = 0; i < o.length; i++) {
                        sn(prefix + "[" + i + "]", o[i])
                    }
                }
                else if (o instanceof Object) {
                    for (var i in o) {
                        if (!i) continue;
                        sn(prefix + (prefix ? "." : "") + i, o[i])
                    }
                }
            }
            , sn = function (k, v) {

                if (isBaseType(v)) { d[k] = v instanceof Date ? v.toJSON() : v }
                else { fn(v, k) }
            };
            fn(m, "");
            return d
        }
    });

    $(function () {
        function pars(str)
        {
            if (str)
            {
                var o;
                try {eval("o=" + str)} catch (x) {o = str}
                return o;
            }
            return str;
        }
        function loadData(s, u, e, params,opt)
        {
            if (!e) { e = s[0]}
            var n = "fill-option", pn = "post-params";
            if (!opt) { opt = $.data(e, n) }
            if (!opt) {
                opt = pars(s.attr("data-options"));
                if (opt) {$.data(e, n, opt)}
            }
            if (!params) { params = $.data(e, pn) }
            if (!params) {
                params = pars(s.attr("data-postparams"));
                if (params) {$.data(e, pn, params) }
            }
            s.fill(u, params, opt);
        }
        ////
        ///$("[data-src][data-src!=''][data-auto]").each(function (i, e) { var s = $(e), u = s.attr("data-src"); if (u) { loadData(s, u, e) } });
        $("[data-src][data-src!=''][data-delegate][data-delegate!='']").each(function (i, e) {
            var s = $(e), u = s.attr("data-src"), d = $.trim(s.attr("data-delegate"));
            if (u && d) {
                if (d.toLowerCase() == "load" || (d = pars(d)).load === true) { loadData(s, u, e) }
                var c = d.controls, t = d.type;
                if (c && t) {
                    var fn = function () { var pk = "data-postparams", ok = "data-options"; loadData(s, u, e, $.data(this, pk) || pars($(this).attr(pk)), $.data(this, ok) || pars($(this).attr(ok))) };
                    if (s.live) { $(c).live(t, fn) } else { $("body").on(t, c, fn) }
                }
            }

        })
    })

})(window.jQuery)
