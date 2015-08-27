///组合框
$(function () {
    var active = 'active', activeMenus = 'combobox_active', timespan = 'timespan'
    function getData(s, o, srcoll, callback) {
        s = $(s);

        var xhrn = 'xhr', dpi = 'data-pageindex', dps = 'data-pagesize',
            pageIndex = srcoll ? (s.attr(dpi) || 0) - 0 : 0,
            pageSize = (s.attr(dps) || 20) - 0,
            d = { pageIndex: pageIndex, pageSize: pageSize }
            , url = s.attr("data-src");
        if (!url) return;
        var context = s.data(xhrn);
        if (context) {
            s.data(xhrn, null);
            context.abort()
        }
        if (!o) { o = s.children(":text") }
        d[o.attr('name') || "keyword"] = o.val();
        $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: d,
            complete: function () { s.data(xhrn, null) },
            beforeSend: function (xhr) {
                s.data(xhrn, xhr);
            },
            success: function (r) {
                var l = s.children("ul.droplist");
                if (s.children('.empty-data').length || !srcoll) { l.empty() }
                if (r && r.length) {
                    for (var i = 0; i < r.length; i++) {
                        var it = r[i], v = it.value || it.Value || it.id || it.ID, n = it.text || it.Text || it.name || it.Name;
                        l.append("<li" + (v ? " data-value='" + v + "'" : "") + " title='" + n + "' ><span>" + n + "</span></li>")
                    }

                }
                else {
                    if (pageIndex == 0) { l.empty().append("<li class='empty-data'><span>没有匹配的数据。。。</span></li>"); }
                }
                if ($.isFunction(callback)) { callback(l); }
                if (pageIndex == 0) { s.removeClass('end'); l.scrollTop(0) }
                if (pageIndex == 0 && (r ? r.length : 0) < pageSize || srcoll && !(r ? r.length : 0)) { s.addClass('end') }
                s.attr(dpi, ++pageIndex);
                setTimeout(function () { l.scroll() }, 10)

            }
        })
    }

    function bodyBindEv(e) {
        e = window.event || e;
        var el = $(e.srcElement || e.target);
        if (el.is('.combobox,.combobox *')) { return; }
        var d = $('body'), ul = d.data(activeMenus);
        hide(ul, d);
    }
    function hide(ul, d, h, v) {
        if (ul) {
            ul.hide();
            d.data(activeMenus, null)
            var c = ul.parent().removeClass(active), time = c.data(timespan);
            if (time) { clearTimeout(time); c.data(timespan, null); }
            if (!h) h = c.children("input:hidden");
            if (h.length) {
                if (v == null) {
                    if (ul.children(":not(.empty-data)").length) {
                        v = ul.children("li[title='" + $.trim(c.children(':text').val()) + "']").attr("data-value") || "";
                    }
                    else { v = ""; }
                }
                if (v != h.val()) { h.val(v) }
            }

        }
        d.unbind('click', bodyBindEv);
    }
    function show(ul) {
        ul.show().parent().addClass(active);
        var d = $('body');
        d.data(activeMenus, ul);
        d.bind('click', bodyBindEv);
    }
    $(".combobox[data-src]>ul.droplist>li:not(.empty-data)").live("click", function () {
        var s = $(this), u = s.parent(), c = u.parent(), v = $.trim(s.attr("data-value") || ""), t = c.children(":text"), h = c.children("input:hidden");
        t.val($.trim(s.text())); if (!h.length) { c.attr("data-value", v) } hide(u, $('body'), h, v);
    });
    $(".combobox[data-src]>:text")
        .live('input', function () {
            var tn = timespan, o = $(this), c = o.parent(), t = c.data(tn);
            if (t) { clearTimeout(t); }
            c.data(tn, setTimeout(function () { getData(c, o) }, 100));
        })
        .live("focus", function () {
            var t = $(this), s = t.parent(), ul = s.children("ul.droplist");
            if (ul.children().length) { show(ul); return false; } else { getData(s, t, false, show) }
        })
        .live('dblclick', function () { var t = $(this), s = t.parent(); getData(s, t, false, show); });

    $('.combobox.allowscroll[data-src]>ul.droplist').scroll(function () {

        var n = 'time', ul = $(this), t = ul.data(n);
        if (t) { clearTimeout(t) }
        ul.data(n, setTimeout(function () {
            var h = ul.height(), top = ul.scrollTop(), h1 = ul[0].scrollHeight;
            if (top >= h1 - h) {
                var s = ul.parent();
                if (!s.hasClass('end')) { getData(s, null, true) }
            }
        }, 50));

    });

});