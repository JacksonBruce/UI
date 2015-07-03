

///组合框
$(function () {

    function getData(s, o, srcoll) {
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
                l.show();
                if (pageIndex == 0) { s.removeClass('end'); l.scrollTop(0) }
                if (pageIndex == 0 && (r ? r.length : 0) < pageSize || srcoll && !(r ? r.length : 0)) { s.addClass('end') }
                s.attr(dpi, ++pageIndex);
                setTimeout(function () { l.scroll() }, 10)

            }
        })
    }
    $(".combobox[data-src]>ul.droplist>li:not(.empty-data)").live("click", function () {
        var s = $(this), u = s.parent(), c = u.parent(), v = $.trim(s.attr("data-value") || ""), t = c.children(":text"), h = c.children("input:hidden");
        t.val($.trim(s.text())); if (h.length) { h.val(v) } else { c.attr("data-value", v) } u.hide();
    });
    $(".combobox[data-src]>:text")
        .live('input', function () {
            var tn = 'timespan', o = $(this), t = o.data(tn);
            if (t) { clearTimeout(t) }
            o.data(tn, setTimeout(function () { getData(o.parent(), o) }, 100));
        })
        .live("blur", function () {
            var v, t = $(this), c = t.parent(), s = c.children("ul.droplist"), vi = s.is(":visible"), h = c.children("input:hidden");
            if (vi) {
                setTimeout(function () {
                    s.hide();
                    if (h.length) {
                        if (s.children("li").length) {
                            if (s.children(".empty-data").length) { v = "" }
                            else { v = s.children("li[title='" + t.val() + "']").attr("data-value") || "" }
                            if (v != h.val()) { h.val(v) }
                        }

                    }

                }, 200)
            }

        })
        .live("focus", function () {
            var t = $(this), s = t.parent(), ul = s.children("ul.droplist");
            if (ul.children().length) { ul.show() } else { getData(s, t) }
        })
        .live('dblclick', function () { var t = $(this), s = t.parent(); getData(s); });
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