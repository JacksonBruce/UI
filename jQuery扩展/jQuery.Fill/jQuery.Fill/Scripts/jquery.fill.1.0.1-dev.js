/// v 1.0.1

"use strict";

(function ($) {

    function req(opt) { return $.ajaxFormData(opt) }
    function isBaseType(o) { var t; return o === null || o instanceof Date || (t = typeof (o)) == "string" || t == "number" || t == "boolean" };
    function pars(str) {
        if (str) {
            var o;
            try { eval("o=" + str) } catch (x) { o = null }
            return o;
        }
        return str;
    }
    function parsePostParams(e) {
        var p = null;
        if (!$.isPlainObject(p = pars(e.attr("data-postparams")))) {
            if ($.isFunction(p)) {
                p = p.call(e)
            }
            else if (p && $.isFunction(p.modelState)) {
                p = p.modelState().model;
            }
        }
        return p;
    }
    function getPostParams(s, d) {
        var c = getContext(s);
        if (!$.isPlainObject(d) && !$.isPlainObject(d = c.postparams) && !$.isPlainObject(d = parsePostParams(s))) {
            d = {}
        }
        return c.postparams = d;
    }
    function getContext(e) {
        if ($.isFunction(e.data)) {
            var n = 'fill-context', c = e.data(n);
            if (c == null) { e.data(n, c = {}); }
            return c;
        }
        return null;
    }
    /// json填充扩展
    (function () {


        function setValue(root, pars) {

            var vl = pars.value,
                o = pars.item,
                path = pars.path,
                propertyName = pars.propertyName,
                e = pars.target,
                opt = getContext(root).option;
            if (!e) return;
            var p = "data-defaultValue";
            var cfn = null;
            if (opt && opt.columns) {
                cfn = opt.columns[path] || opt.columns[propertyName];
            }

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
                else if (n.is("select")) {
                    n.children().each(function (i, e) { if (v == $(e).val() || v == $(e).text()) { e.selected = true; return false; } })
                }
                else if (n.is("input,textarea")) { n.val(v) }
                else if (tag == "TEXT" || n.attr("data-replace") !== undefined) { n.replaceWith(v + '') }
                else if (tag == "IMG") { n.attr("src", v); }
                else if (!n.children().length) { n.text(v) }
            })
        }

        var fillPoliy = (function () { var fns = arguments; return function () { for (var i = 0, fn; fn = fns[i++];) { if (fn.apply(this, arguments) === true) { return true } } return false; } })
            (function (root, pars) {
                var c = getContext(root),
                    opt = c.option,
                    pn = pars.propertyName,
                    arg = { cancel: false, item: pars.item, propertyName: pn, path: pars.path, sender: root },
                    f;
                if (opt && $.isFunction(f = opt.filling))
                { f.call(root, pars.value, arg) }

                if (opt && opt.tree === true && (pars.value instanceof Array) && pars.value.length && pn && (pn == opt.children || pn.toLowerCase() == "children")) {
                    arg = { cancel: false, target: pars.target, children: pars.value, item: pars.item };
                    if ($.isFunction(f = opt.creatingNodes)) {
                        f.call(root, arg);
                    }
                    if (!arg.cancel) {
                        var t = pars.target;
                        if (t.parent().length) {
                            var tg = t.parent()[0].tagName;
                            t.addClass("has-children").next().clone().appendTo("<" + tg + "></" + tg + ">").parent().appendTo(t);
                        }
                    }
                }
            },///触发填充事件
            function (root, pars) {

                if (pars.deep === 0 && pars.value == null) {
                    return true;
                }
            },///空数据
            function (root, pars) {
                if (isBaseType(pars.value)) {
                    //pars.value = d;
                    setValue(root, pars);
                    return true;
                }
            },///基本类型的数据
            function (root, pars) {
                var d = pars.value;
                if ($.isPlainObject(d)) {
                    var el = pars.target || root;
                    if (el.is(':empty')) {
                        setValue(root, pars);
                        return true;
                    }

                    var p = pars.path || ''
                    if (p) { p = p + '.'; }
                    for (var i in d) {
                        if (!i) continue;
                        var path = p + i, propertyName = i;
                        var target = findElements(el, path, propertyName);
                        fillPoliy(root, { deep: pars.deep + 1, value: d[i], item: d, target: target, propertyName: propertyName, path: path });
                    }
                    return true;
                }
            },///填充对象数据
            function (root, pars) {
                var d = pars.value;
                if ($.isArray(d)) {
                    var e = pars.target || root;
                    if (e.is(':empty')) {
                        setValue(root, pars);
                        return true;
                    }
                    var ics = "fill-item",
                        tk = 'fill-template',
                        ck = 'fill-template-container',
                        ik = 'fill-template-intopoint',
                        opt = getContext(root).option,
                        tmp, cs,
                        templateContainer, intopoint;
                    if ((tmp = e.data(tk)) || (tmp = e.children("." + (cs = "template"))).length || (tmp = e.find("." + cs)).length) {
                        if (!e.data(tk)) {
                            e.data(ck, templateContainer = tmp.parent());
                            e.data(tk, tmp);
                            if (tmp.next().length) { e.data(ik, intopoint = tmp.next()); }
                            tmp.remove().removeClass(cs).addClass(ics);
                        } else {
                            templateContainer = e.data(ck);
                            intopoint = e.data(ik);
                        }

                        if (tmp.length == 0 || (tmp.is('[data-path]') && !tmp.is('[data-path="' + (pars.path || '/') + '"]'))) {
                            return false;
                        }

                        ///如果不是追加，那么移除已填充的项
                        if (!(opt && opt.append)) { templateContainer.children('.' + ics).remove(); }
                        var arr = [];
                        $.each(d, function (i, n) {
                            if (n) {
                                var el = tmp.clone();
                                if (opt && $.isFunction(opt.creating)) {
                                    var arg = { cancel: false, item: n, index: i, path: pars.path };
                                    opt.creating.call(e, arg, el);
                                    if (arg.cancel) { return }
                                }
                                fillPoliy(root, { deep: pars.deep, target: el, value: n, path: pars.path, propertyName: '[]', index: i });
                                arr.push(el);
                            }
                        });
                        if (intopoint) { for (var i = 0; i < arr.length; i++) arr[i].insertBefore(intopoint) }
                        else { templateContainer.append(arr); }
                    }
                    return true;
                }
            }///填充列表数据
            );
        //装载数据
        function load(d, c) {
            c.fillData = d;
            var root = this,
                opt = c.option,
                emptyData = c.emptyData;
            d = trimData(c, d);
            if (d.info) {
                renderPagination(root, c, d.info);
                d = d.rows;
            }
            fillPoliy(root, { deep: 0, value: d, path: '', propertyName: '' });
            if (emptyData.length) {
                emptyData.toggle(!(d && d.length > 0));
            }
            complete(root, opt, d);
        }
        function complete(root, opt, d, error) {
            setCurrentSortElement(root);
            if (opt && $.isFunction(opt.complete)) {
                opt.complete.call(root, { error: error, data: d, option: opt });
            }
        }

        //初始化填充器
        function init(root, c) {
            if (c.init === true) return;
            var opt = c.option;
            bindSortEvent(root, opt);
            bindPagingEvent(root, c);
            if (c.pagination) { c.pagination.hide() }
            var emptyData = c.emptyData;
            if (!emptyData) { emptyData = c.emptyData = root.find(".empty-data") }
            emptyData.hide();
            c.init = true;
        }

        //整理数据，相当于一个适配器
        function trimData(c, d) {
            var opt;
            if (!d || !(opt = getPagerOption(c))) return d;

            var fn = function (o, n, f) {
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
            var o = (typeof (opt.prop) == "string" ? fn(d, opt.prop, true) : null) || fn(d, ["page", "pager", "paging", "pagination"]), rows;
            if (o && (rows = (typeof (opt.rows) == "string" ? fn(d, opt.rows, true) : null) || fn(d, ["data", 'items', "rows", "list", "array", "collection"])) instanceof Array) {
                return {
                    info: {
                        total: fn(o, ["total", "records"]),
                        index: (function () { var i = fn(o, ["index", opt.indexName]); if (i == null || isNaN(i)) { i = c.pageIndex || 0 }; i = i - opt.offset; if (i < 0) { i = 0; } return i })(),
                        size: fn(o, ["size", opt.sizeName]) || c.pageSize || 10,
                        count: fn(o, ["count", "pagecount"])
                    },
                    rows: rows
                };
            }
            return d;
        }


        //获取数据
        function getData(url, data, context) {
            var root = this,
                opt = context.option || {},
                loading = opt.loading,
                filter = function (d) { return d },
                err;
            if ($.isFunction(opt.filter)) { filter = opt.filter; }
            if (context.req) { context.req.abort(); }
            setSortExpression(root, data);
            setPageSize(root, data);
            context.req = req({
                url: url,
                type: opt.type || "POST",
                dataType: "json",
                data: $.toNameValues(data),
                error: function (xhr, ts, et) { err = { xhr: xhr, textStatus: ts, errorThrown: et, message: req.responseText } },
                success: function (d) {
                    context.url = url;
                    load.call(root, filter.call(root, d, context, data), context);
                },
                complete: function () {
                    context.req = null;
                    if (loading && loading.length) { loading.hide() }
                    if (err) {
                        complete(root, opt, null, err);
                    }
                },
                beforeSend: function () {
                    if (!(loading instanceof jQuery)) {
                        var sltr = loading;
                        if (typeof (sltr) !== 'string' || ((loading = root.find(sltr)).length === 0 && ((loading = $(sltr)).length === 0))) {
                            loading = root.find(".loading");
                        }
                    }
                    loading.show();
                }
            });
        }
        //从排序元素中获取排序表达式
        function getSortExpression(e, sw) {
            var n = 'sortExpression', d = 'desc', a = " " + d, b = "";
            if (sw === true) {
                var tmp = a;
                a = b;
                b = tmp
            }
            return (e.data(n) || e.attr('data-' + n) || e.attr(n)) + (e.hasClass(d) ? a : b);
        }
        //设置当前元素
        function setCurrentSortElement(root) {
            var c = getContext(root);
            if (c.sortThead) {
                var th = c.sortThead, n = c.sortName, v = c.sortExpression, e = c.currentSortElement;
                if (v == null) return;
                var arr = v.split(' '), p = $.trim(arr[0]), desc = 'desc';
                if (!e) {
                    e = th.find('.sort[data-sortExpression="' + p + '"]');
                    if (!e.length && !(e = th.find('.sort[sortExpression="' + p + '"]')).length) { return; }
                    //if ($.trim(arr[1]) === desc) { e.addClass(desc) } else { e.removeClass(desc) }
                }
                var active = 'active'
                if (!e.hasClass(active)) {
                    th.find(".sort." + active).removeClass(active);
                    e.addClass(active)
                }
                if (c.switchSortDirection) {
                    e.toggleClass('desc', $.trim(arr[1]) === desc);
                    delete c.switchSortDirection;
                }
            }
        }
        //设置排序表达式参数值
        function setSortExpression(root, p) {
            if (!$.isPlainObject(p)) return;
            var c = getContext(root);
            if (!c.sortThead || !c.sortName) return;
            var th = c.sortThead, n = c.sortName, v = c.sortExpression;
            if (p[n]) return;
            if (v == null) {
                var e = th.find('.sort.active');
                if (e.length) {
                    c.sortExpression = v = getSortExpression(e);
                    c.currentSortElement = e;
                }
            }
            if (v != null) p[n] = v;
        }
        ///绑定排序事件
        function bindSortEvent(root, opt) {
            var context = getContext(root), sort = opt && opt.sort, thead, sortItemSltr = ".sort";
            if (sort && (thead = root.find(typeof (sort) == "string" ? sort : (sort.thead ? sort.thead : ".thead"))).length) {
                context.sortThead = thead;
                context.sortName = sort.name || "sortExpression";

                var sortHandler = function () {
                    var s = $(this),
                        currentCss = "active",
                        desc = "desc",
                        handler = $.isFunction(sort) ? sort : ($.isPlainObject(sort) && $.isFunction(sort.handler) ? sort.handler : null);
                    var switchSort = s.hasClass(currentCss), sortValue = getSortExpression(s, switchSort),
                    arg = { data: context.postparams, sortExpression: sortValue, option: opt, cancel: false };
                    if (handler) { handler.call(this, arg); }
                    if (!arg.cancel) {
                        var url = context.url;
                        if (typeof (url) != "string") { url = root.attr("data-src") }
                        if (!arg.data) { arg.data = {} }
                        context.sortExpression = arg.data[context.sortName] = sortValue;
                        context.currentSortElement = s;
                        context.switchSortDirection = switchSort;
                        root.fill(url, arg.data, arg.option);
                    }
                };

                if (thead.live) { $(sortItemSltr, thead).live("click", sortHandler) } else { thead.on("click", sortItemSltr, sortHandler); }
            }
        }

        //设置分页的最大尺寸
        function setPageSize(root, p) {
            if (!$.isPlainObject(p)) return;
            var c = getContext(root);
            if (!c.pagination) return;
            var opt = getPagerOption(c),
                size = p[opt.sizeName];

            if (size != null) {
                c.pageSize = size;
                return;
            }
            if ((size = c.pageSize) != null) {
                p[opt.sizeName] = size;
            }
        }
        ///分页器
        function renderPagination(root, c, info) {
            var el = c.pagination;

            if (!info || !el) return;
            var opt = getPagerOption(c);

            var indexName = opt.indexName,
                dpn = opt.buttonDataPage,
                btns = opt.buttons,
                offset = opt.offset,
                index = info.index,
                next = index + 1,
                prev = index - 1,
                count = info.count,
                total = info.total;
            c.pageSize = info.size;
            if (total > 0 && (isNaN(count) || count <= 0)) {
                count = Math.floor(total / info.size) + (total % info.size > 0 ? 1 : 0);
            }

            el.fill(info);
            if (count > 1) {
                el.show();
                if (!el.length) { c.pagination = el = $("<ul class='pagination'><li class='first'><a href='javascript:' aria-label='First'><span aria-hidden='true'>&laquo;</span></a></li><li class='number'><a href='javascript:'></a></li><li class='last'><a href='javascript:' aria-label='Last'><span aria-hidden='true'>&raquo;</span></a></li></ul>").appendTo(root); }

                var fn = function (cs, flg, n) {
                    var b = el.find(cs).toggleClass('disabled', flg), a = b.find('a');
                    if (!a.length) { a = b }
                    a.attr(dpn, flg ? '' : n);
                };
                fn('.first', index == 0, offset);
                fn('.last', index >= count - 1, count - 1 + offset);
                fn('.next', next >= count, next + offset);
                fn('.prev', prev < 0, prev + offset);
                var number_ck = "fill-page-number", intopoint_ck = 'fill-page-intopoint', container_ck = 'fill-page-container',
                    intopoint = el.data(intopoint_ck),
                    container = el.data(container_ck),
                    number = el.data(number_ck);
                if (!number) {
                    el.data(number_ck, number = el.find(".number").removeClass('number').attr('role', 'page-number'));
                    el.data(container_ck, container = number.parent())
                    if (number.next().length) { el.data(intopoint_ck, intopoint = number.next()) }
                    number.remove();
                }
                if (number.length) {
                    if (!btns || isNaN(btns) || btns <= 0) { btns = 10 }

                    var end = index + Math.floor(btns / 2), start, active = opt.active || 'active';
                    if (end >= count) { end = count - 1; }
                    start = end + 1 - btns;

                    if (start < 0) {
                        end += (0 - start);
                        if (end >= count) { end = count - 1; }
                        start = 0;
                    }

                    container.children('[role="page-number"]').remove();
                    for (var i = start; i <= end; i++) {
                        var clone = number.clone(), link = clone.find('a');
                        if (!link.length) { link = clone; }
                        link.text(i + 1);
                        if (index == i) { clone.addClass(active) }
                        else { link.attr(dpn, i + offset) }
                        if (intopoint) { clone.insertBefore(intopoint) } else { container.append(clone) }
                    }

                }
            }
            else { el.hide() }
        }
        //获取分页器的设置选项
        function getPagerOption(c) {
            var opt = c.option;
            opt = opt ? opt.pager : null;
            if (opt) {
                if (!$.isPlainObject(opt)) { opt = {} }
                if (opt.selector == null) {
                    opt.selector = ".pagination";
                }
                if (opt.indexName == null) {
                    opt.indexName = "pageindex";
                }
                if (opt.sizeName == null) {
                    opt.sizeName = "pagesize";
                }
                if (opt.buttonDataPage == null) {
                    opt.buttonDataPage = "data-page";
                }
                if (opt.offset == null) {
                    opt.offset = 0;
                }
                if (opt.buttons == null) { opt.buttons = 10; }
            }
            return opt;
        }
        ///绑定分页事件
        function bindPagingEvent(root, c) {
            var opt = getPagerOption(c);
            if (!opt) { return }
            var el = (opt.selector instanceof jQuery) ? opt.selector : root.find(opt.selector);
            if (!el.length) { el = $(opt.selector) };
            if (el.length) {
                var bdp = opt.buttonDataPage,
                    ev = function () {
                        var s = $(this),
                            n = Number(s.attr(bdp)),
                            arg = { page: n, data: c.postparams, container: root, option: c.option, cancel: false };
                        if ($.isFunction(opt.paging)) {
                            opt.paging.call(this, arg);
                        }
                        if (!arg.cancel) {
                            var url = c.url, d = arg.data
                            if (!d) { d = {} }
                            c.pageIndex = d[opt.indexName] = n;
                            if (typeof (url) != "string") { url = root.attr("data-src") }
                            root.fill(url, d, c.option);
                        }
                    };
                var slt = " a[" + bdp + "][" + bdp + "!='']";
                if (el.live) { $(slt, el).live("click", ev); }
                else { el.on("click", slt, ev); }
                c.pagination = el;
            }




        }
        ///查找填充字段的元素
        function findElements(el, path, name) {
            if (!el) return null;
            var fn = function (n) {
                if (!n) return $();
                var e;
                try { e = $("#" + n.replace(/\./g, "_"), el) } catch (x) { e = $() }
                if (e.length == 0) {
                    e = $("[data-fill='" + n + "']", el);
                    if (e.length == 0) {
                        e = $("[data-field='" + n + "']", el);
                        if (e.length == 0) {
                            e = $("[name='" + n + "']", el)
                        }
                    }
                }
                return e
            }
            var target = fn(path), arr;
            if (!target || target.length == 0) {
                target = (target = fn(name ? name : (arr = path.split("."))[arr.length - 1])).length ? target : null
            }
            return target;
        }

        $.prototype.fill = function (url, data, opt, cfn) {

            var root = $(this),
                context = getContext(root),
                fn = function () {
                    opt = opt || pars(root.attr("data-options"));
                    if ($.isFunction(opt)) {
                        opt = $.isFunction(cfn) ? { complete: cfn, filling: opt } : { complete: opt };
                    }
                    else if (typeof (opt) == "boolean") { opt = { pager: opt, complete: cfn } }
                    context.option = opt;
                    init(root, context);

                };
            if (arguments.length == 0) {
                url = context.url;
                data = context.postparams;
                opt = context.option;
                if (url == null) {
                    url = context.fillData;
                    if (url == null) { return; }
                    data = opt;
                }
            }
            if (typeof (url) != "string") {
                if (url) {
                    opt = data;
                    data = url;
                    url = null;
                }
                fn();
                load.call(this, data, context);
            }
            else {
                var tmp, loading = opt ? opt.loading : null;
                if ((tmp = typeof (data)) == 'function' || tmp == "boolean") { cfn = opt; opt = data; data = null; }
                data = getPostParams(root, data)
                fn();
                getData.call(root, url, data, context);
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
                        else if (j.is('select')) {
                            var o = j.children('[value="' + v + '"]');
                            if (!o.length) {
                                o = j.children('[value="0"]');
                                if (!o.length) { o = j.children(':first') }
                            }
                            if (o.length) { o[0].selected = true }
                        }
                        else if (j.is("input,textarea")) { j.val(v) }
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

                return $.ajax(url, s)
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
            var result = {
                status: xhr.status,
                readyState: xhr.readyState,
                statusText: xhr.statusText,
                abort: function () { xhr.abort(); return this },
                getAllResponseHeaders: function () { return xhr.getAllResponseHeaders() },
                getResponseHeader: function (a) { return xhr.getResponseHeader(a) }
            };
            xhr.addEventListener("error", function (e) { ex(s.error, xhr, e) }, false);
            xhr.addEventListener("readystatechange", function () {
                result.status = xhr.status;
                result.statusText = xhr.statusText;
                result.readyState = xhr.readyState;
                result.responseText = xhr.responseText;
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
            return result;
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
                var e = $(this), loadingCss = 'loading';
                if (e.hasClass(loadingCss)) return;
                var s = $(e.attr('data-target')), a = "action", d_a = 'data-' + a, u = e.attr(d_a) || s.attr(d_a) || s.attr(a) || location.href,
                    valid = pars(e.attr('data-valid') || s.attr('data-valid')), ms;
                if (!s.length) return;
                if (!(ms = $.isPlainObject(valid) ? s.modelState(valid) : s.modelState()).errors) {
                    var m = ms.model, params = parsePostParams(e), reset, result = null, err = null, prog_pnl = null, prog = e.data('progress') || pars(prog_pnl = e.attr('data-progress'));
                    if (params && $.isPlainObject(params)) { for (var i in m) { params[i] = m[i] } }
                    else { params = m }
                    e.addClass(loadingCss);
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
                            e.removeClass(loadingCss);
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
