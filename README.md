
jQuery.fill 介绍

jQuery.fill是一组填充数据的jQuery扩展方法，它试图将html、css与数据分离，减少大量的html拼接代码，提高web前端的工作效率，主要功能有：fill向匹配DOM对象填充来自服务器数据或者json对象；modelState将匹配的DOM对象反序列化为json对象，它可以和表单、jQuery.validtion协同工作，toNameValues是一个很有趣jQuery静态方法，它将复杂的js对象，数组等转换成一组键/值对提交给服务端，它和asp.net mvc的默认模型绑定器协同工作。
约定

数据填充使用了属性约定和ID约定，分页、排序和模板使用了css类选择器约定
数据填充约定

向一个jQuery对象填充数据时，查找带有data-fill | data-field | name属性的DOM对象并将json对象与之匹配的属性值向其填充，如果同时出现这个三个属性那么就按照前面的顺序进行优先填充，填充的默认规则由其标签类型决定，默认填充规则如下：
1、input:checbox,input:radio （复选框和单选框） 如果元素的value是空的或者未设置value，那么值填充给value，如果value与填充的值相等，那么将checked属性设为true，否则false；
2、input,textarea,select 这种类型的元素直接将值填充给它的value属性；
3、img 默认填充值给它的src属性；
4、其他的标签默认填充text属性；
5、text标签和data-replace属性，（text不是一个有效的html标签）当遇到text标签，或者标签包含有data-replace属性时，它将被填充的值替换掉；
也可以通过data-property属性指定个填充属性来改变以上的默认规则，例如：<a data-fill="url" data-property="href">点击这里</a>； data-property属性的":text"和":html"有特殊的意义，:text表示填充文本内容也是大多数非表单标签（img除外）的默认填充规则，而:html则是用来指定填充元素的innerHTML属性，在填充富文本时很有用。
通过这个例子演示一下数据填充约定
CSS类选择器约定

当填充一个列表或者树形结构的数据时，需要在填充的容器中定义模板，用“template”CSS类选择器指定当前块是模板；
列表的分页选择器约定：分页模板用：pager、第一页：first、最后页：last、下一页：next、上一页：prev、数字：number，其他信息遵循数据填充约定，分页按钮包含有data-page属性指定页面数；
列表的排序需要指定一个表头，表头的默认类选择器是“thead”，可排序列由“sort”指定，包含“active”类选择器的表示当前排序列，默认是升序，“desc”类选择器指定降序，每个可排序列需要通过sortExpression（或者data-sortExpression）属性指定排序的字段，暂时不支持多字段排序规则。
触发器约定

触发器是当用户触发click事件时才填充页面上的元素，或者提交表单，使用触发器减少大量重复的代码。
data-toggle属性指定触发器的类型，是必须的，可选值有：fill | action | load,其实只有两种类型：填充和动作，load是填充的扩展形式，指定只在页面装载时自动填充元素，它必须和data-src属性一起使用，data-src指定数据来源的路径；
data-target属性指定事件触发后填充的目标或者要提交的表单（非表单元素也可以）
方法

了解了前面的一些约定，再来看方法的使用和案例就容易理解多了
fill(url,params,options)方法

描述：向jQuery对象填充来自服务端的数据，服务端必须返回json格式的数据。
参数

url: string 类型， 远程服务器的地址,将post请求这个地址获取数据

params: PlainObject 类型，post请求时提交的参数

options: PlainObject 类型，填充选项，下面将详细说明
options（填充选项）

    loading: string 类型 || jQuery 对象，表示在发送请求后等候响应的一个提示模板，默认值：".loading"。
    append: bool 类型，如果是填充列表是，指定是否追加填充，默认是false
    tree: bool 类型，指示填充的数据是否为树形数据，默认是false
    children:string 类型，仅在填充树形数据时有效，指定子集的属性名称，默认是“children”

    filling: function(v,arg) 类型，在填充字段前触发的事件。
        this:根元素的jQuery对象
        v: 填充的值。
        arg: PlainObject 类型，事件传递的上下文参数。
            cancel: bool 类型，默认值false，如果设为true，将取消底层的操作
            item: PlainObject 类型，取值的对象
            propertyName:string 类型，当前填充的字段名称
            path:string 类型，当前值的访问路径
            target:jQuery 对象，表示当前匹配的节点，如果为找到匹配的节点，那么可能为null或者是长度为零的jQuery对象
            sender:上下文对象

    formatter: function(v,arg) 类型，在找到匹配的填充元素，并对其内容进行填充时执行的方法，此方法需要返回将要填充的内容，有一些复杂的数据格式可以通过这个方法来修改最终的填充内容。
        this:当前被填充的元素
        v:填充的值
        arg: PlainObject 类型，事件传递的上下文参数。
            item:PlainObject 类型，取值的对象
            path:string 类型，当前值的访问路径
            propertyName:string 类型，当前填充的字段名称
    creatingNodes:function(arg) 类型，当创建树形的下一级节点时触发此事件，前提是tree选项设置为true
        this:根元素的jQuery对象
        arg: PlainObject 类型，事件传递的上下文参数。
            cancel: bool 类型，默认值false，如果设为true，将取消底层的操作
            target: jQuery 对象，表示当前匹配的节点，如果为找到匹配的节点，那么可能为null或者是长度为零的jQuery对象
            item: PlainObject 类型，取值的对象
            children: Array 类型，子集的数据
    creating:function(arg,e) 类型，绑定列表时，当创建行时触发的事件
        this:jQuery 对象，表示当前匹配的节点，如果为找到匹配的节点，那么就是根节点
        arg: PlainObject 类型，事件传递的上下文参数。
            cancel: bool 类型，默认值false，如果设为true，将取消底层的操作
            item: 当前的行数据对象
            index: number 类型，当前行的索引
        e: jQuery 对象，将要插入的节点，此节点根据模板克隆出来的，默认情况下插在模板的前面。

    complete: function(data) 类型 填充完成后触发的事件。
        this: jQuery对象
        data: 已经填充的数据。
    pager: PlainObject 类型，分页选项
        prop: string 类型，获取返回数据分页信息的属性名称，如果为指定，那么自动识别,如：page、pager、paging、pagination。
        例如： {page:{total:50,index:2,size:10},rows:[{name:'dd',id:1}]},那么将会自动获取page的值
        rows: string 类型， 获取返回的数据行的属性名称，如果为指定，那么自动识别,如：data、rows、list、array、collection。
        例如： {page:{total:50,index:2,size:10},rows:[{name:'dd',id:1}]},那么将会自动获取rows的值
        buttons: number 类型，设置分页的数字按钮的数量，默认是10个数字按钮
        paging: function(arg) 类型，当点击分页按钮时触发此事件。
            this:jQuery对象，被点击的按钮
            arg:PlainObject 类型，事件传递的上下文参数。
                page: number 类型，将要转到页面索引。
                data: PlainObject 类型，上下文的提交参数
                option: PlainObject 类型，上下文的填充选项
                cancel: bool 类型，默认值false，如果设为true，将取消底层的操作
        offset: number 类型，页面索引的偏远数量，默认是0，有些时候页面的索引是从1开始，那么应该设置1，表示从1开始计算索引。
        selector: string 类型，表示分页模板的jQuery选择器，通过这个选择器查找分页模板,默认是".pagination"
        active:string 类型，表示当前索引页的css类选择器，默认是"active"
    分页数据的其他约定：
        总数量：用 total 或者 records 表示，不区分大小写。
        页索引：用 index 或者 pageindex 表示，不区分大小写。
        总页数：用 count 或者 pagecount 表示，不区分大小写。
        单页总数：用 size 或者 pagesize 表示，不区分大小写。
    例如：
    {page:{total:50,index:2,size:10,count:5},rows:[{name:'dd',id:1}....]}
    {page:{records:50,pageindex:2,pagesize:10,pagecount:5},rows:[{name:'dd',id:1}....]}
    {page:{total:50,pageindex:2,size:10,pagecount:5},rows:[{name:'dd',id:1}....]}
    以上都是符合约定的。

    sort: PlainObject 类型 || string 类型 || function(arg) 类型，排序选项。
        name:string 类型，排序表达式提交的参数名称，默认是“sortExpression”。
        thead: string 类型，排序表头的选择器，通过这个选择器查找排序表头的模板，默认值是“.thead”。
        handler: function(arg) 类型， 当点击排序按钮时触发此事件。
            this: jQuery 对象，表示触发排序事件的按钮。
            arg: PlainObject 类型，事件传递的上下文参数。
                cancel: bool 类型，默认值false，如果设为true，将取消底层的操作。
                data: PlainObject 类型，上下文的提交参数。
                option: PlainObject 类型，上下文的填充选项。
                sortExpression: string 类型，排序表达式。

    sting 类型： 等同于 sort:{thead:'xxxx'}；

    function(arg) 类型：等同于 sort:{handler:function(arg){...}}；

fill(data,options)方法

描述：向jQuery对象填充来指定的数据。
参数

data:PlainObject 类型|| number 类型 || bool 类型 || datetime 类型 || array 类型，将要填充的数据。

options: PlainObject 类型，填充选项，详细说明同上
fill(url,allowPaging,complete)方法
参数

url: string 类型， 远程服务器的地址,将post请求这个地址获取数据

allowPaging: bool 类型，是否允许分页

complete: function(data) 类型 填充完成后触发的事件。

注：等同于fill(url,null,{complete:complete,pager:allowPaging})
fill(url,params,filling,complete)方法
参数

url: string 类型， 远程服务器的地址,将post请求这个地址获取数据

params: PlainObject 类型，post请求时提交的参数

filling: function(v,arg) 类型，在填充字段前触发的事件

complete: function(data) 类型 填充完成后触发的事件。

注：等同于fill(url,params,{complete:complete,filling:filling})
modelState(a)方法

描述：将表单或者DOM对象反序列化为json对象，如果浏览器支持h5的文件IO，那么此方法可以读取文件上传控件（input[type='file']）的文件信息。
参数

a:PlainObject 类型,一组验证函数,例如：{"字段名":function(v,arg){ ... return error;}[,....]}

    this: jQuery对象，表示调用modelState方法的jQuery对象。
    v: object 类型，获取的值。
    arg:PlainObject 类型,上下文传递的参数。
        element: jQuery对象，表示被验证的元素
        errors: Array 类型，表示经过jQuery.validate框架验证失败的错误信息
        value: object 类型,和v是同一个值，但是可以修改它以影响底层的值。
    如果验证失败应该返回false，否则返回其他值或者void。

返回值: PlainObject 类型

    errors: Array 类型，表示验证失败的信息，如果null，表示没有错误。
    数组的元数类型为：PlainObject 类型
        element: jQuery 对象，表示被验证失败的DOM对象。
        value: string 类型，表示获取的值
        name: string 类型，表示字段名称
        labels: jQuery 对象，表示错误提示的标签
    model:PlainObject 类型,表示已经通过的数据。

clearModel(a)方法

描述：调用此方法清空模型的值。
参数

    this:jQuery 对象，表示当前调用方法的jQuery对象。
    a::PlainObject 类型,一组包含初始值的键值对,例如：{"字段名":function(v,arg){ ... return '初始值';}[,....]} 或者 {"字段名":"初始值"[,....]}
        this: jQuery对象，表示调用modelState方法的jQuery对象。
        v: object 类型，当前的值。
        arg:PlainObject 类型,上下文传递的参数。
            cancel: bool 类型，默认值false，如果设为true，将取消底层的操作
            element: jQuery对象，表示被验证的元素
        返回一个初始值。

[static] toNameValues(model,isFormData)方法

这是一个静态方法，将模型转换成键值对字典。提交复杂的数据模型时需要转换成键值对，服务端可以直接使用mvc的默认模型绑定器绑定到对应的模型，如果data参数中包含文件，那么自动转换为表单数据包（FormData）。
参数

    model: PlainObject 类型 || Array 类型，将要转换的数据。
    isFormData: bool类型，true 表示在没有文件的情况下也返回 FormData 类型

返回

    类型：PlainObject 类型 || FormData 类型，仅仅包含键和值。

[static] ajaxFormData(url,settings)方法

这个方法是对ajax方法的一个补充,它以数据流的方式提交FormData类型的数据，如果当前浏览器不支持FormData类型，那么调用ajax方法。
参数

    url: string 类型,远程处理程序的地址。
    settings: PlainObject 类型，请求的设置，如果是非FormData类型，请参照原来的ajax方法的设置，否则参照下面的配置：
        data: FormData类型,提交的数据包
        dataType:string 类型，指定服务端返回的数据类型（json || text || html || xml），参照ajax方法
        async: bool 类型，表示是否异步提交，默认是true，参照ajax方法
        headers: PlainObject 类型，简单的键值对，请求头的设置，参照ajax方法
        error: function(XMLHttpRequest,arg) 类型，出错时触发的事件，参照ajax方法
        dataFilter: function(data,dataType) 类型，返回过滤后的结果，参照ajax方法
        success: function(data,statusText,XMLHttpRequest) 类型，请求成功后触发的事件，参照ajax方法
        complete: function(XMLHttpRequest,statusText,status) 类型，请求完成后触发的事件，参照ajax方法
        beforeSend: function(XMLHttpRequest) 类型，请求发送前触发的事件，参照ajax方法
        progress: function(e,XMLHttpRequest) 类型，数据发送中触发的事件，这个事件用于更新进度条的，新增的一个事件。
        参数
            e: event类型，有两个重要的属性：loaded 和 total 通过这两个属性来计算已经完成的百分比

触发器

当点击页面上的某个按钮时填充或者提交表单，而无需编写重复的javascript代码。
触发器属性

    data-toggle: 枚举类型 必填的 枚举值：fill | load | action
    data-target: string类型 必填的 必须是有效的jQuery选择器，如：#xxx、.xxxx、form
    data-postparams: PlainObject 类型或者function类型 可选的，表示触发时提交至服务端的数据，如果是函数，那么回执行这个函数，函数的返回值将作为参数提交。

填充触发器

当点击触发器控件时填充指定的板面,触发器类型是：data-toggle="fill"
属性

    data-options: PlainObject 类型，可选的，填充选项，优先选用触发器控件的填充选项，如果为指定触发器控件的填充选项，那么自动解析填充目标的填充选项。
    data-src:string 类型，可选的，远程数据源，如果未指定，那么获取填充目标的远程数据源。

页面装载时填充

页面装载时填充板面,触发器类型是：data-toggle="load"，这种触发器忽略data-target属性，data-src是必填的，页面装载时自动填充当前板面。
动作触发器

当点击触发器控件时，那么将反序列化目标板面，并提交数据的服务端，用于提交表单很合适，触发器类型是：data-toggle="action"

    data-action:string 类型，可选的，远程处理程序路径，如果未指定，那么获取目标的远程处理程序路径，如果目标元素是form标签，那么会自动获取action属性指定的路径
    data-callback:function(result,arg) 类型， 回调函数名称，可选的，执行完毕时将执行这个回调函数，在这里可以做一些自定义的逻辑操作。
    参数
        result:PlainObject 类型或者string类型，服务端返回的结果
        arg: PlainObject 类型，事件传递的上下文参数。
            error: PlainObject 类型，错误信息，如果没有错误那么是null。
            属性
                textStatus:错误描述
                errorThrown:状态码
                req:XMLHttpRequest对象
            context:上下文对象
            posted: PlainObject 类型，已经提交了的参数
            cancel: bool 类型，默认值false，如果设为true，将取消底层的操作

