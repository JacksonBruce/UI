"use strict";

(function ($) {

    function req(opt) { $.ajaxFormData(opt) }
    function isBaseType(o) { var t; return o === null || o instanceof Date || (t = typeof (o)) == "string" || t == "number" || t == "boolean" };
    function pars(str) {
        if (str) {
            var o;
            try { eval("o=" + str) } catch (x) { o = null }
            return o;
        }
        return str;
    }
    function parsePostParams(e) { var p = null; if (!$.isPlainObject(p = pars(e.attr("data-postparams")))) { if ($.isFunction(p)) { p = p.call(e) } else if (p instanceof jQuery) { p = p.modelState().model; } } return p; }
    function getPostParams(s, d) {
        if (!s.length || $.isPlainObject(d)) return d;
        var k = "postparams";
        d = $.data(s[0], k);
        if (!$.isPlainObject(d)) { d = parsePostParams(s); if (!$.isPlainObject(d)) { d = {} } }
        return d;
    }
    /// json填充扩展
    (function () {
        function setValue(e, vl, o, path, opt, propertyName) {
            var p = "data-defaultValue";
            var cfn = opt && opt.columns && opt.columns[path];
            if (!$.isFunction(cfn)) {
                cfn = (function (p) {
                    return function (v, arg) {
                        if (p == null) return v;
                        if (isBaseType(p)) { return v || p; }
                        return p[v];
                    }
                })(cfn);
            }
            $.each(e, function (i, n) {
                var tag = n.tagName
                    , pr = (n = $(n)).attr("data-property")
                    , arg = { item: o, path: path, propertyName: propertyName }
                    , fn = opt && opt.formatter
                    , v = vl
                    , rgx, m;

                if (v === null) { v = n.attr(p) || null; }
                else if (typeof (v) == "string") {
                    if ((m = (/Date\((-?\d+)\)/).exec(v))) { v = new Date(parseInt(m[1])) }
                    else if ((/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}(\s\d{1,2}(:\d{1,2}){1,2})$/).test(v)) {
                        v = new Date(v.replace(/\-/g, '/'));
                    }
                }
                if ($.isFunction(fn)) {
                    v = fn.call(n, v, arg)
                }
                v = cfn.call(n, v, arg);
                if (v instanceof Date) {
                    var fm = n.attr("data-dateFormat"), wday;
                    // v=new Date();
                    if (fm) {
                        wday = v.getDay();
                        if ((m = (rgx = /\{w:([^\}]+)\}/).exec(fm))) {
                            m = (m = m[1].split(",")).length == 7 ? m[wday] : "";
                            fm = fm.replace(rgx, m);
                        }

                        v = (function (str, arr) {
                            for (var i = 0; i < arr.length; i++) {
                                var o = arr[i], num = o[1];
                                str = str.replace(o[0], (num < 10 ? '0' : '') + num);
                            }
                            return str;
                        })(fm, [[/\{yyyy\}/g, v.getFullYear()],
                            [/\{MM\}/g, v.getMonth() + 1],
                            [/\{dd\}/g, v.getDate()],
                            [/\{hh\}/g, v.getHours()],
                            [/\{mm\}/g, v.getMinutes()],
                            [/\{ss\}/g, v.getSeconds()]
                        ]);
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
                    if (tmp === "" || tmp == "on" || tmp === undefined) { n.val(v) }
                    else { n[0].checked = n.val() == v + "" }
                }
                else if (n.is("input,textarea,select")) { n.val(v) }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v + '') }
                else if (tag == "IMG") { n.attr("src", v); }
                else if (!n.children().length) { n.text(v) }
            })
        }

        $.prototype.fill = function (url, data, opt, cfn) {
            var fnstr = "function", tmp, root = $(this),
                filter = function (d) { return d; },
                callFilling = function (opt, arg, x) {
                    var f, pn;
                    if (opt && $.isFunction(f = opt.filling))
                    { f.call(root, x, arg) }
                    if (opt && opt.tree === true && (x instanceof Array) && x.length && (pn = arg.propertyName) && (pn == opt.children || pn.toLowerCase() == "children")) {
                        var creArg = { cancel: false, target: arg.target, children: x, item: arg.item };
                        if ($.isFunction(f = opt.creatingNodes)) {
                            f.call(root, creArg);
                        }
                        if (!creArg.cancel) {
                            var t = arg.target, tg = t.parent()[0].tagName;
                            t.addClass("has-children").next().clone().appendTo("<" + tg + "></" + tg + ">").parent().appendTo(t);
                        }
                    }
                }
            , fn = function (x, path, obj, propertyName, index) {

                var self = this, f, cs
                    , arg = { cancel: false, item: obj, propertyName: propertyName, path: (path = (path || "")), sender: self }
                    , arr// = path ? path.split(".") : []
                    ///查找填充目标
                    , find = function (m) {
                        if (!m) return $();
                        var t;
                        try { t = $("#" + m.replace(/\./g, "_"), self) } catch (x) { t = $() }
                        if (t.length == 0) {
                            t = $("[data-fill='" + m + "']", self);
                            if (t.length == 0) {
                                t = $("[data-field='" + m + "']", self);
                                if (t.length == 0) {
                                    t = $("[name='" + m + "']", self)
                                }
                            }
                        }
                        return t
                    }
                , e = path ? find(path) : self;
                if (!e || e.length == 0) { e = (e = find(propertyName ? propertyName : (arr = path.split("."))[arr.length - 1])).length ? e : self }

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
                    var v, ics = "fill-item", templateContainer, intopoint;
                    if ((f = e.data('fill-template')) || (f = e.children("." + (cs = "template"))).length || (f = e.find("." + cs)).length) {
                        if (!e.data('fill-template')) {
                            e.data('fill-template-container', templateContainer = f.parent());
                            e.data('fill-template', f);
                            if (f.next().length) { e.data('fill-template-intopoint', intopoint = f.next()); }
                            f.remove().removeClass(cs).addClass(ics);
                        } else { templateContainer = e.data('fill-template-container'); intopoint = e.data('fill-template-intopoint'); }
                        ///如果不是追加，那么移除已填充的项
                        if (!(opt && opt.append)) { templateContainer.children('.' + ics).remove(); }
                        var els = [];
                        $.each(x, function (i, n) {
                            if (n) {
                                var el = f.clone();
                                if (opt && $.isFunction(opt.creating)) {
                                    var craArg = { cancel: false, item: n, index: i, path: path };
                                    opt.creating.call(e, craArg, el);
                                    if (craArg.cancel) return;
                                }
                                fn.call(el, n, path, x, '[]', i);
                                els.push(el);
                            }
                        });
                        if (intopoint) { for (var i = 0; i < els.length; i++) els[i].insertBefore(intopoint) }
                        else { templateContainer.append(els); }
                    }
                    return
                }
                ///填充对象数据
                if (x instanceof Object) {
                    for (var i in x) {
                        if (!i) continue;
                        var item = x[i];
                        fn.call(e, item, path + (path ? "." : "") + i, x, i, index)
                    }
                    return
                }
            }
            , addState = function (n, v) {
                if (!root.length) return;
                var s = $.data(root[0], "state");
                if (!s) { $.data(root[0], "state", s = {}); }
                s[n] = v;
            }
            , fi = function (d) {

                opt = opt || pars(root.attr("data-options"));

                var type_opt = typeof (opt);
                if (type_opt == fnstr) {
                    opt = typeof (cfn) == fnstr ? { complete: cfn, filling: opt } : { complete: opt };
                }
                else if (type_opt == "boolean") { opt = { pager: opt, complete: cfn } }
                if (d !== null) {
                    if (isBaseType(d)) {
                        setValue(root, d, null, "", opt)
                    }
                    else {
                        var emptyData = root.find(".empty-data"), bindEventN = "boundEvent", p_opt = opt ? opt.pager : null, p, gtp = function (o, n, f) {
                            var some = function (a, cb) {
                                if (a.some) { return a.some(cb); }
                                for (var i = 0; i < a.length; i++) {
                                    if (cb(a[i])) return true
                                }
                                return false;
                            };
                            for (var i in o) {
                                if ((f && i === n) || some(n, function (a) { return a == i.toLowerCase() })) return o[i];
                            }
                            return null;
                        };
                        if (p_opt) {
                            var rows;
                            if ((p = (typeof (p_opt.prop) == "string" ? gtp(d, p_opt.prop, true) : null) || gtp(d, ["page", "pager", "paging", "pagination"]))
                                && (rows = (typeof (p_opt.rows) == "string" ? gtp(d, p_opt.rows, true) : null) || gtp(d, ["data", 'items', "rows", "list", "array", "collection"])) instanceof Array) {
                                d = rows
                            }
                        }
                        if (!d || (d instanceof Array && d.length == 0)) { emptyData.show(); } else { emptyData.hide() }
                        fn.call(root, d);

                        ///分页器
                        if (p) {
                            var p_sltr = p_opt.selector || '.pagination',
                                indexName = p_opt.indexName || "pageindex",
                                el = (p_sltr instanceof jQuery) ? p_sltr : root.find(p_sltr), dpn = "data-page",
                                btns = p_opt.buttons, paging = p_opt.paging,
                                total = gtp(p, ["total", "records"]),
                                p_offset = p_opt.offset ? p_opt.offset : 0,
                                p_index = (function () { var i = gtp(p, ["index", indexName]) - p_offset; if (i < 0) { i = 0; } return i })(),
                                p_next = p_index + 1,
                                p_prev = p_index - 1,
                                p_count = gtp(p, ["count", "pagecount"]),
                                p_size;

                            if (total > 0 && (isNaN(p_count) || p_count <= 0)) {
                                p_size = gtp(p, ["size", "pagesize"]) || 10;
                                p_count = Math.floor(total / p_size) + (total % p_size > 0 ? 1 : 0);
                            }
                            el.fill(p, opt);
                            if (p_count > 1) {
                                el.show();
                                if (!el.length) { el = $("<ul class='pagination'><li class='first'><a href='javascript:' aria-label='First'><span aria-hidden='true'>&laquo;</span></a></li><li class='number'><a href='javascript:'></a></li><li class='last'><a href='javascript:' aria-label='Last'><span aria-hidden='true'>&raquo;</span></a></li></ul>").appendTo(root); }
                                if (!$.data(el[0], bindEventN)) {
                                    var ev = function () {
                                        var s = $(this), n = Number(s.attr(dpn)), p_arg = { page: n, data: $.data(root[0], "postparams"), container: root, option: opt, cancel: false };
                                        if (typeof (paging) == fnstr) {
                                            paging.call(this, p_arg);
                                        }
                                        if (!p_arg.cancel) {
                                            if (!p_arg.data) { p_arg.data = {} }
                                            p_arg.data[indexName] = n;
                                            if (typeof (url) != "string") { url = root.attr("data-src") }
                                            root.fill(url, p_arg.data, opt, cfn);
                                        }
                                    };
                                    tmp = " a[" + dpn + "][" + dpn + "!='']";
                                    if (el.live) { $(tmp, el).live("click", ev); }
                                    else { el.on("click", tmp, ev); }
                                    $.data(el[0], bindEventN, true);
                                }
                                tmp = "disabled";

                                var toggleBtnFN = function (cs, flg, n) {
                                    var b = el.find(cs).toggleClass(tmp, flg), a = b.find('a');
                                    if (!a.length) { a = b }
                                    a.attr(dpn, flg ? '' : n);
                                };
                                toggleBtnFN('.first', p_index == 0, p_offset);
                                toggleBtnFN('.last', p_index >= p_count - 1, p_count - 1 + p_offset);
                                toggleBtnFN('.next', p_next >= p_count, p_next + p_offset);
                                toggleBtnFN('.prev', p_prev < 0, p_prev + p_offset);

                                tmp = el.find(".number");
                                if (tmp.length) {
                                    if (!btns || isNaN(btns) || btns <= 0) { btns = 10 }
                                    var p_end = p_index + Math.floor(btns / 2), p_start, item_css = "item", active_css = p_opt.active || 'active';
                                    if (p_end >= p_count) { p_end = p_count - 1; }
                                    p_start = p_end + 1 - btns;
                                    if (p_start < 0) {
                                        p_end += 0 - p_start;
                                        if (p_end >= p_count) { p_end = p_count - 1; }
                                        p_start = 0;
                                    }

                                    tmp.hide().prevAll('[role="page-number"]').remove();
                                    for (var i = p_start; i <= p_end; i++) {
                                        var clone = tmp.clone().removeClass('number').css('display', '').addClass(item_css).attr('role', 'page-number').insertBefore(tmp), link = clone.find('a');
                                        if (!link.length) { link = clone; }
                                        link.text(i + 1);
                                        if (p_index == i) { clone.addClass(active_css) }
                                        else { link.attr(dpn, i + p_offset) }
                                    }

                                }
                            }
                            else { el.hide() }

                            ///排序
                            if (d && d.length && root.length && !$.data(root[0], bindEventN)) {
                                var thead, sortItemSltr = ".sort", sortHandler = function () {
                                    var s = $(this), sortExp = s.attr("sortExpression") || s.attr("data-sortExpression"), currentCss = "active", desc = "desc"
                                        , handler = $.isFunction(opt.sort) ? opt.sort : ($.isPlainObject(opt.sort) && $.isFunction(opt.sort.handler) ? opt.sort.handler : null)
                                        , sortName = opt.sort.name || "sortExpression", sortValue, s_arg;
                                    if (!s.hasClass(currentCss)) { thead.find(sortItemSltr + "." + currentCss).removeClass(currentCss); s.addClass(currentCss) }
                                    else { s.toggleClass(desc) }
                                    sortValue = sortExp + (s.hasClass(desc) ? " desc" : "");
                                    s_arg = { data: $.data(root[0], "postparams"), sortExpression: sortValue, option: opt, cancel: false };
                                    if (handler) { handler.call(this, s_arg); }
                                    if (!s_arg.cancel) {
                                        if (!s_arg.data) { s_arg.data = {} }
                                        s_arg.data[sortName] = sortValue;
                                        addState(sortName, sortValue);
                                        if (typeof (url) != "string") { url = root.attr("data-src") }
                                        root.fill(url, s_arg.data, s_arg.option, cfn);
                                    }
                                };

                                if (opt && opt.sort && (thead = root.find(typeof (opt.sort) == "string" ? opt.sort : (opt.sort.thead ? opt.sort.thead : ".thead"))).length) {
                                    if (thead.live) { $(sortItemSltr, thead).live("click", sortHandler) } else { thead.on("click", sortItemSltr, sortHandler); }
                                }
                                $.data(root[0], bindEventN, true);
                            }
                        }
                    }
                }
                if (opt && $.isFunction(opt.complete)) {
                    opt.complete.call(root, d);
                    var empty = root.find('.empty-data');
                    if (empty.length) {
                        empty.toggle(!(d && d.length > 0));
                    }
                }
            };

            if (typeof (url) != "string") {
                if (url) {
                    opt = data;
                    data = null
                }
                fi(url);
            }
            else {
                if ((tmp = typeof (data)) == fnstr || tmp == "boolean") { cfn = opt; opt = data; data = null; }
                if (root.length) {
                    data = getPostParams(root, data);
                    if (tmp = $.data(root[0], "state")) {
                        if (!$.isPlainObject(data)) { data = {} }
                        for (var i in tmp) {
                            if (data[i] == null) { data[i] = tmp[i]; }
                        }
                    }
                    $.data(root[0], "postparams", data);
                }
                var loading = opt ? opt.loading : null;
                if (opt && $.isFunction(opt.filter)) { filter = opt.filter; }
                req({
                    url: url
                    , type: "POST"
                    , dataType: "json"
                    , data: $.toNameValues(data)
                    , success: function (d) { fi(filter.call(root, d, opt, data)) }
                    , complete: function () { if (loading.length) { loading.hide(); } }
                    , beforeSend: function () { loading = (loading ? $(loading) : root.find(".loading")).show(); }
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
            else if (e.is("input[type='file']")) {
                //var udfs, w = window//, sup = getVal.SupportFile || (getVal.SupportFile = typeof (w.File) !== (udfs = 'undefined') && typeof (w.FileList) !== udfs && (typeof (w.Blob) === "function" && (!!w.Blob.prototype.webkitSlice || !!w.Blob.prototype.mozSlice || !!w.Blob.prototype.slice || false)));
                if (e.length) {
                    v = e[0].files;
                    if (!(v instanceof window.FileList)) { v = e.val() } else if (!v.length) { v = null }
                }
            }
            else if (e.is("input,textarea,select")) { v = e.val() }
            else if (tag == "IMG") { v = e.attr("src") }
            else if (!e.children().length) { v = e.text() }
            else { v = null }
            return v
        };
        $.prototype.modelState = function (a) {
            var s = this, fd = "data-field", fl = "data-fill", ne = "name", m = {}, errors = [];
            $.each(s.find("[" + fd + "],[" + fl + "],[" + ne + "]").andSelf()
                , function (i, e) {
                    var v, fn, err = false, lbls, j = $(e), n = j.attr(ne) || j.attr(fl) || j.attr(fd);
                    if (n) {
                        v = getVal(j);
                        if (j.valid && e.form) { try { if (!j.valid()) { err = true; lbls = $(e.form).validate().errorsFor(e) } } catch (x) { } }
                        fn = a ? a[n] : null;
                        if ($.isFunction(fn)) {
                            var arg = { element: j, errors: lbls, value: v };
                            err = fn.call(s, v, arg) === false || err;
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
                            if (arg.cancel) { return }
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
                        else if (!j.children().length) { j.text(v) }
                        //else { j.text(v) }
                    }
                });
            return s
        }
    })();

    $.extend({
        ///将模型转换成键值对字典。提交复杂的数据模型，转换成键值对，服务端可以直接使用mvc的默认模型绑定器
        toNameValues: function (m, IFD) {
            var win = window,
                filelist = win.FileList,
                blob = win.Blob,
                file = win.File,
                isFormData = IFD === true,
                isF = function (f) { var b = (filelist && (f instanceof filelist)) || (file && f instanceof file) || (blob && f instanceof blob); if (b && !isFormData) { isFormData = true } return b };
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
                else if (isF(v)) {
                    if (v instanceof filelist) { for (var i = 0; i < v.length; i++) { d[k + "[" + i + "]"] = v[i] } } else { d[k] = v }

                }
                else { fn(v, k) }
            };
            fn(m, "");
            if (isFormData && win.FormData) {
                var fd = new FormData();
                for (var i in d) {
                    fd.append(i, d[i])
                }
                d = fd;
            }
            return d
        }
        ,
        ajaxFormData: function (url, s) {
            if ($.isPlainObject(url))
            { s = url; url = s.url; delete s.url; }
            if (!url) return;
            var isFD = false;
            if (s && s.data && window.FormData && !(isFD = (s.data instanceof FormData))) {
                s.data = $.toNameValues(s.data);
                isFD = (s.data instanceof FormData)
            }
            if (!s || !window.FormData || !s.data || (!isFD && !$.isFunction(s.progress))) {
                if (!s) { s = {} }
                if (!s.type) { s.type = 'POST' }
                if ($.isFunction(s.success)) {
                    s.success = (function (b) {
                        return function (r, t, x) {
                            if (!$.isPlainObject(r)) { try { r = $.parseJSON(r) } catch (e) { } }
                            b.call(this, r, t, x);
                        }
                    })(s.success)
                }
                $.ajax(url, s);
                return;
            }
            if (!isFD)
            { s.data = $.toNameValues(s.data, true); }
            var xhr = new XMLHttpRequest(), self = this, ex = function (f) {
                if (!$.isFunction(f)) return;
                var a = arguments, p = [];
                if (a.length > 1) {
                    for (var i = 1; i < a.length; i++) {
                        p.push(a[i]);
                    }
                }
                return f.apply(self, p);
            }, r;
            xhr.addEventListener("error", function (e) { ex(s.error, xhr, e) }, false);
            xhr.addEventListener("readystatechange", function () {
                if (xhr.readyState == 4) {
                    r = xhr.responseText;
                    if (s.dataFilter) { r = ex(s.dataFilter, r, s.dataType) }
                    else { try { r = $.parseJSON(r) } catch (x) { } }
                    if (xhr.status == 200) { ex(s.success, r, xhr.statusText, xhr); }
                    else { ex(s.error, xhr, xhr.status, xhr.statusText); }
                    ex(s.complete, xhr, xhr.statusText, xhr.status);
                }
            }, false);

            xhr.upload.addEventListener("progress", function (e) { ex(s.progress, e, xhr) }, false);
            xhr.open("post", url, s.async !== false);
            if (s.headers) {
                for (var i in s.headers) {
                    xhr.setRequestHeader(i, s.headers[i])
                }
            }
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            ex(s.beforeSend, xhr);
            xhr.send(s.data)

        }
    });

    $(function () {
        //====================================================
        var livable = !!$().live, ev = 'click';
        ///填充触发器
        (function () {
            var sltr = "[data-toggle='fill'][data-target]", fn = function () {
                var e = $(this), opt = "data-options", target = e.attr('data-target'), s = target ? $(target) : e, src = 'data-src', u = e.attr(src) || s.attr(src);
                if (!u || !s.length) return;
                s.fill(u, parsePostParams(e) || parsePostParams(s) || {}, $.data(this, opt) || pars($(this).attr(opt)))
            };
            //点击时触发
            if (livable) { $(sltr).live(ev, fn) } else { $("body").on(ev, sltr, fn) }
            //装载时触发
            $("[data-src][data-src!=''][data-toggle='load']").each(function (i, e) { fn.call(e) })
        })();
        ///动作触发器
        (function () {
            var sltr = "[data-toggle='action'][data-target]", fn = function () {
                var e = $(this), s = $(e.attr('data-target')), a = "action", d_a = 'data-' + a, u = e.attr(d_a) || s.attr(d_a) || s.attr(a) || location.href,
                    valid = pars(e.attr('data-valid') || s.attr('data-valid')), ms;
                if (!s.length) return;
                if (!(ms = $.isPlainObject(valid) ? s.modelState(valid) : s.modelState()).errors) {
                    var m = ms.model, params = parsePostParams(e), reset, result = null, err = null, prog_pnl = null, prog = e.data('progress') || pars(prog_pnl = e.attr('data-progress'));
                    if (params && $.isPlainObject(params)) { for (var i in m) { params[i] = m[i] } }
                    else { params = m }
                    if ($.isFunction(e.button)) { e.button('loading'); reset = true }
                    if (!$.isFunction(prog) && prog_pnl && (prog_pnl = $(prog_pnl)).length) {
                        var progFn, prog_bar;
                        if (prog_pnl.is('progress')) {
                            prog_bar = prog_pnl.show();
                            progFn = function (p) {
                                var v = (prog_bar.attr('max') || 0) * p / 100;
                                if (v) { prog_bar.val(v) }
                            };
                        }
                        else {
                            prog_bar = prog_pnl.show().find('.progress-bar');
                            progFn = function (p) {
                                var v = ((prog_bar.attr('aria-valuemax') || 0) - (prog_bar.attr('aria-valuemin') || 0)) * p / 100;
                                prog_bar.width(p + '%'); if (v) { prog_bar.attr('aria-valuenow', v) }
                            };
                        }
                        progFn(0);
                        prog = function (a, b) { progFn(a.loaded / a.total * 100); }
                    }
                    $.ajaxFormData(u, {
                        data: params,
                        progress: $.isFunction(prog) ? function (a, b) { prog.call(e, a, b) } : null,
                        success: function (json) { result = json; },
                        error: function (req, ts, et) { err = { req: req, textStatus: ts, errorThrown: et } },
                        complete: function () {
                            if (reset === true) { e.button('reset') }
                            var dcbn = 'callback', b = e.data(dcbn) //|| pars(e.attr('data-' + dcbn))
                                , arg = { cancel: false, error: err, context: s, posted: params };
                            if (typeof (b) === "string") { b = pars(b); }
                            if ($.isFunction(b)) { b.call(e[0], result, arg); }
                            if (!arg.cancel) {

                                if (!err) { s.clearModel() }

                                if (prog_pnl instanceof jQuery) { setTimeout(function () { prog_pnl.hide(); }, 2000) }
                            }
                        }
                    });
                }
            };
            if (livable) { $(sltr).live(ev, fn) } else { $("body").on(ev, sltr, fn) }
        })();



    });

})(window.jQuery)
