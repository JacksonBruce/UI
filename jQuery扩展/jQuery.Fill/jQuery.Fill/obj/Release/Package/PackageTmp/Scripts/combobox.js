
///组合框
$(function () {
    $.each($(".combobox[data-src]")
        , function (i, e) {
            var s = $(e), t = s.children(":text")
            if (t.length) {
                t = t[0];
                t.oninput = function () {
                    var o = this, url = s.attr("data-src")
                    clearTimeout(o.timespan)
                    o.timespan = setTimeout(function () {
                        var d = {};
                        d[o.name || "keyword"] = o.value;
                        $.ajax({
                            url: url, type: "POST", dataType: "json", data: d, success: function (r) {
                                var l = s.children("ul.droplist").empty().show();
                                if (r && r.length) {
                                    for (var i = 0; i < r.length; i++) {
                                        var it = r[i], v = it.value || it.Value || it.id || it.ID, n = it.text || it.Text || it.name || it.Name;
                                        l.append("<li" + (v ? " data-value='" + v + "'" : "") + " title='" + n + "' ><span>" + n + "</span></li>")
                                    }
                                }
                                else { l.append("<li class='empty-data'><span>没有匹配的数据。。。</span></li>") }
                            }
                        })
                    }, 500)
                }
            }
        });
    $(".combobox[data-src]>ul.droplist>li:not(.empty-data)").live("click", function () {
        var s = $(this), u = s.parent(), c = u.parent(), v = $.trim(s.attr("data-value") || ""), t = c.children(":text"), h = c.children("input:hidden");
        t.val($.trim(s.text())); if (h.length) { h.val(v) } else { c.attr("data-value", v) } u.hide();
    });
    $(".combobox[data-src]>:text").live("blur", function () {
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

    }).live("dblclick", function () { var t = $(this), s = t.parent().children("ul.droplist").show() });
});
