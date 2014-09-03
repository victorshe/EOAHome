define("/DigiShell/js/viewFrame-debug", [ "digiflow/0.2/viewPanel-debug", "jquery-debug", "backbone/backbone/1.1.0/backbone-debug", "backbone/underscore/1.5.2/underscore-debug", "./logo-debug", "./util-debug" ], function(require, exports, module) {
    var viewPanel = require("digiflow/0.2/viewPanel-debug"), Backbone = require("backbone/backbone/1.1.0/backbone-debug"), logo = require("./logo-debug"), util = require("./util-debug");
    require("jquery/gritter/1.7.4/jquery.gritter-debug");
    /**
     * 按unid删除文档
     * @param {Array} unids unid数组
     * @param {Integer} docType 文档类型。0表示所有文档，1表示草稿，2表示非流程文档
     * @param {Function} [callback] 执行成功后的回调函数
     */
    function deleteDocument(unids, docType, callback) {
        $.post("/Produce/DigiShell.nsf/deleteDocumentXAgent.xsp", {
            u: unids.join(","),
            p: view.get("view").dbPath,
            d: docType
        }, function() {
            if ($.isFunction(callback)) {
                callback();
            }
        }, "json").error(function() {
            //TODO 异常信息待完善
            alert("连接已断开，请重新登录");
        });
    }
    var getCount = function() {
        var headerHeight, pagerHeight;
        return function(offsetTop, baseNode, radio, showHeader) {
            if (showHeader && !headerHeight) {
                headerHeight = $("#viewFrame .page-header").outerHeight(true);
                if (headerHeight < 30) {
                    headerHeight = 67;
                }
            }
            if (!pagerHeight) {
                pagerHeight = $("#viewFrame .pagination").outerHeight(true) || 75;
            }
            var result = ($(window).height() - offsetTop - (showHeader ? headerHeight : 0) - pagerHeight) / ($(baseNode).height() * radio);
            /*jshint -W065 */
            return result > 8 ? parseInt(result) - 1 : 8;
        };
    }();
    var View = Backbone.Model.extend({
        defaults: {
            view: {
                dbPath: "",
                view: "",
                category: "",
                key: "",
                page: 1
            },
            queryFrame: false,
            showHeader: true,
            allowDelete: null,
            allowDeleteCache: null,
            isDraft: false
        },
        frame: null,
        initialize: function() {
            this.frame = new Frame({
                model: this
            });
        },
        openView: function(param) {
            this.set({
                queryFrame: null,
                isDraft: false,
                allowDelete: this.get("allowDeleteCache")
            });
            if ("class" in param) {
                param.category = param["class"];
                delete param["class"];
            }
            if (!!param["draft"]) {
                this.set({
                    allowDelete: true,
                    isDraft: true
                });
            }
            if ("showHeader" in param) {
                this.set("showHeader", !!param.showHeader);
                delete param.showHeader;
            } else {
                this.set("showHeader", true);
            }
            this.set("view", $.extend({
                dbPath: "",
                view: ""
            }, param));
            $(".page-content >.active").removeClass("active");
            $(".page-content .view").addClass("active").slideDown();
            $(".databaseQuery").hide();
            $(".viewData").slideDown();
        }
    });
    var Frame = Backbone.View.extend({
        id: "viewFrame",
        className: "viewFrame span12",
        model: null,
        initialize: function() {
            var _this = this, parent = $(".view");
            parent.append(this.$el.append('<div class="page-header"><div class="view-breadcrumb"></div><div class="view-toolbar btn-toolbar"></div></div><div class="viewData"></div>'));
            viewPanel.init({
                checkbox: true,
                count: getCount(parent.offset().top || $(".widgetContent").offset().top, $("#breadcrumbs"), 38 / 40, true),
                checkboxTemplate: function(data) {
                    return '<label><input type="checkbox" class="ace"/><span class="lbl">' + data + "</span></label>";
                },
                infoReady: function(info) {
                    _this.model.set({
                        allowDelete: !!info["allowDelete"] || _this.model.get("isDraft"),
                        allowDeleteCache: !!info["allowDelete"] || _this.model.get("isDraft")
                    });
                }
            });
            this.listenTo(this.model, "change:view", function() {
                this.render();
            });
            this.listenTo(logo, "change:isExpan", function() {
                viewPanel.config({
                    count: getCount(parent.offset().top || $(".widgetContent").offset().top, $("#breadcrumbs"), 38 / 40, this.model.get("showHeader"))
                });
                //如视图显示中，刷新之
                if ($(".viewData:visible").size() > 0) {
                    viewPanel.refresh();
                }
            });
            this.listenTo(this.model, "change:allowDelete", function() {
                if (_this.model.get("showHeader")) {
                    _this.showToolbar(_this.model.get("allowDelete"));
                }
            });
            this.listenTo(this.model, "change:showHeader", function() {
                var showHeader = this.model.get("showHeader");
                this.$el.find(".page-header").css("display", showHeader ? "block" : "none");
                viewPanel.config({
                    checkbox: showHeader ? true : false,
                    count: getCount(parent.offset().top || $(".widgetContent").offset().top, $("#breadcrumbs"), 38 / 40, showHeader)
                });
            });
        },
        events: {
            "click .view-toolbar button": "toolsAction",
            "click .view-toolbar ul.export": "exportAction"
        },
        render: function() {
            viewPanel.openView(this.model.get("view"));
        },
        showToolbar: function(allowDelete) {
            var toolbar = this.$el.find(".view-toolbar");
            var deleteButtonHtml = '<div class="btn-group"><button class="btn btn-danger" data-action="delete" title="删除"><i class="icon-trash"></i></button></div>';
            toolbar.html('<div class="btn-group"><button class="btn btn-info" data-toggle="dropdown" data-action="query" title="查找"><i class="icon-search"></i></button><ul class="dropdown-menu dropdown-default query"></ul></div>' + (allowDelete ? deleteButtonHtml : "") + '<div class="btn-group"><button class="btn btn-success" data-action="refresh" title="刷新"><i class="icon-refresh"></i></button></div><div class="btn-group"><button class="btn btn-grey dropdown-toggle" data-action="export" data-toggle="dropdown" title="导出"><i class="icon-share"></i></button><ul class="dropdown-menu dropdown-default pull-right export"><li><a href="#current">导出当前页</a></li><li><a href="#all">导出所有页</a></li></ul></div>');
        },
        toolsAction: function(event) {
            var button = $(event.currentTarget), action = button.data("action"), _this = this;
            switch (action) {
              case "query":
                if (!button.parent().hasClass("open")) {
                    require.async("./databaseQuery", function(query) {
                        //读取查询配置，组装下拉菜单
                        query.getQueryNames(_this.model.get("view").dbPath, function(data) {
                            var html = "", count = 0;
                            for (var id in data) {
                                html += "<li><a href='" + /\S+(#m_\S+?\/[^\/]+)\S*/.exec(location.href)[1] + "/q_" + id + "'>" + data[id].name + "</a></li>";
                                count++;
                            }
                            html += "";
                            var queryMenu = _this.$el.find(".dropdown-menu.query").html(count > 0 ? html : "<li><a>无查询配置</a></li>");
                            //仅有一个查询配置时，直接跳转至查询界面
                            if (count === 1) {
                                _.defer(function() {
                                    button.parent().removeClass("open");
                                });
                                digishell.router.navigate(queryMenu.find("a:first").attr("href"), true);
                            }
                        });
                    });
                }
                break;

              case "delete":
                var selected = this.model.get("queryFrame") ? _this.model.get("queryFrame").getSelected(function(item) {
                    return item[item.length - 1];
                }) : viewPanel.getSelected(function(item) {
                    return item["@unid"];
                });
                if (selected.length === 0) {
                    $.gritter.add({
                        title: "提示",
                        text: "请先选择文档",
                        time: 1500,
                        class_name: "gritter-center gritter-info"
                    });
                    return false;
                }
                var dialogId = $.gritter.add({
                    title: "提示",
                    text: '<p>是否删除所选文档？</p><p style="text-align: right"><a class="btn btn-small btn-danger sure" href="#">确定</a>&nbsp;<a class="btn btn-small cancel">取消</a></p>',
                    class_name: "gritter-center gritter-info"
                });
                $("#gritter-notice-wrapper").on("click", "a.btn", function(event) {
                    var btn = $(event.target);
                    if (btn.hasClass("sure")) {
                        deleteDocument(selected, _this.model.get("isDraft") ? 1 : 0, function() {
                            viewPanel.refresh();
                        });
                        event.preventDefault();
                    }
                    $.gritter.remove(dialogId);
                });
                break;

              case "refresh":
                if (this.model.get("queryFrame")) {
                    return;
                }
                viewPanel.refresh();
                break;

              case "export":
                break;
            }
        },
        exportAction: function(event) {
            var action = $(event.target).attr("href").substring(1), queryFrame = this.model.get("queryFrame");
            require.async("digiflow.excelTools", function(tools) {
                if (queryFrame) {
                    var aoColumns = queryFrame.dataTable.fnSettings().aoColumns, title = _.map(aoColumns.slice(1, aoColumns.length - 1), function(item) {
                        return item.sTitle;
                    }), data = [];
                    switch (action) {
                      case "current":
                        queryFrame.dataTable.find("tbody tr").each(function() {
                            var rowData = queryFrame.dataTable.fnGetData(this);
                            data.push(rowData.slice(1, rowData.length - 1));
                        });
                        break;

                      case "all":
                        data = _.map(queryFrame.dataTable.fnGetData(), function(rowData) {
                            return rowData.slice(1, rowData.length - 1);
                        });
                        break;
                    }
                    tools.exportArray(data, title);
                } else {
                    var fileName = viewPanel.state("name");
                    switch (action) {
                      case "current":
                        tools.exportArray(function() {
                            var result = [];
                            for (var i = 0, data; data = viewPanel.getRowData(i++, "text"); ) {
                                result.push(data);
                            }
                            return result;
                        }(), function(info) {
                            var result = [];
                            for (var i = 0, column; column = info.columns[i]; i++) {
                                if (!column.hide) {
                                    result.push(column.title);
                                }
                            }
                            return result;
                        }(viewPanel.state("viewInfo")), fileName);
                        break;

                      case "all":
                        var param = {
                            dbPath: viewPanel.state("dbPath"),
                            view: viewPanel.state("view"),
                            columns: function(info) {
                                var result = [];
                                for (var i = 0, column; column = info.columns[i]; i++) {
                                    if (!column.hide) {
                                        result.push(i);
                                    }
                                }
                                return result;
                            }(viewPanel.state("viewInfo")),
                            fileName: fileName
                        };
                        if (viewPanel.state("category")) {
                            param.category = viewPanel.state("category");
                        }
                        if (viewPanel.state("key")) {
                            param.key = viewPanel.state("key");
                        }
                        tools.exportView(param);
                        break;
                    }
                }
            });
            event.preventDefault();
        }
    });
    var view = new View();
    module.exports = view;
});

/**
 * 视图显示框架
 * @author L.Z.W
 */
(function(factory) {
    if (typeof define === "function" && define.cmd) {
        define("digiflow/0.2/viewPanel-debug", [ "jquery-debug" ], function(require) {
            require.async("digiflow/0.2/viewPanel-debug.css");
            return factory(require("jquery-debug"));
        });
    } else {
        ("digiflow" in window ? window["digiflow"] : window.digiflow = {}).viewPanel = factory(jQuery);
    }
})(function($) {
    /*jshint -W065 */
    //可配置属性
    var config = {
        //父节点选择器
        parent: ".viewData",
        //是否显示序号
        rowIndex: true,
        //是否显示复选框
        checkbox: false,
        //表头宽度与视图数据间的比率
        thWidthMultiple: 1.5,
        //加载文档条目数
        count: 30,
        //分页控件显示数目
        pagerSize: 7,
        checkboxTemplate: function(data) {
            return "<label class='checkbox'><input type='checkbox'/>" + data + "</label>";
        },
        infoReady: null,
        dataReady: null
    }, //状态储存
    state = {
        //当前页
        page: 1,
        //数据库路径
        dbPath: "",
        //视图名称
        view: "",
        //筛选类别
        category: null,
        //查询关键字
        key: null,
        //当前排序状态
        sort: {},
        //当前分页页数
        pageCount: 1,
        //视图数据
        viewData: null,
        //视图表头
        viewInfo: null
    }, //排序参数名
    SORT_TYPES = [ "", "ResortAscending", "ResortDescending" ], //当前框架所在DOM节点
    domNode, //当前框架表格DOM节点
    tableNode, theadNode, tbodyNode, //分页控件DOM节点
    pagerNode, //页选择对话框DOM节点
    dialogNode;
    /**
     * 获取视图标题并展现
     */
    function getViewInfo(refreshFlag) {
        //TODO 待实现跨域读取
        return $.get("/Produce/DigiShell.nsf/getViewInfoAgent?OpenAgent" + (!!refreshFlag ? "&timeStamp=" + new Date().getTime() : ""), {
            db: state.dbPath,
            category: state.category,
            view: state.view
        }, function(viewInfo) {
            state.viewInfo = viewInfo;
            if ($.isFunction(config.infoReady)) {
                config.infoReady.call(viewPanel, state.viewInfo);
            }
        });
    }
    /**
     * 展现视图标题和分页控制
     * @param  {Array} viewInfo 视图标题信息数组
     */
    function showViewControl(viewInfo) {
        theadNode.hide().empty();
        var headRow = $("<tr>").appendTo(theadNode);
        if (config.rowIndex) {
            var th = $("<th class='index'>序号</th>");
            if (config.checkbox) {
                th.addClass("checkbox").html(config.checkboxTemplate("序号"));
            }
            headRow.append(th);
        }
        var columns = viewInfo.columns;
        for (var n = 0, column; column = columns[n]; n++) {
            if (!column.hide) {
                var width = parseInt(column.width / config.thWidthMultiple);
                var thNode = $("<th data-index='" + n + "' style='width:" + width + "em'>" + column.title + "</th>");
                if ((column.sortAsc || column.sortDesc) && !state.category) {
                    thNode.addClass("sort");
                    if (column.sortAsc && column.sortDesc) {
                        thNode.append("<span><i class='icon-sort'></i></span>");
                    } else if (column.sortAsc) {
                        thNode.append("<span><i class='icon-sort-up'></i></span>");
                    } else {
                        thNode.append("<span><i class='icon-sort-down'></i></span>");
                    }
                }
                headRow.append(thNode);
            }
        }
        headRow.append("<th class='detail'>查看</th>");
        theadNode.show();
        //显示分页控件
        showPager();
    }
    /**
     * 获取视图数据并展现
     */
    function getViewData(noCache) {
        //TODO 待实现跨域读取
        return $.get("/" + state.dbPath + "/" + state.view + "?ReadViewEntries&outputformat=json" + (!!noCache ? "&timeStamp=" + new Date().getTime() : ""), function() {
            var param = {
                count: config.count,
                start: (state.page - 1) * config.count + 1
            };
            if (state.sort && state.sort.type) {
                param[state.sort.type] = state.sort.column;
            }
            if (state.category) {
                param.RestrictToCategory = state.category;
            }
            if (state.key) {
                param.StartKey = state.key;
                param.UntilKey = state.key;
            }
            return param;
        }(), function(viewJsonData) {
            if (viewJsonData.charAt(0) === "<" && viewJsonData.indexOf("<!DOCTYPE") === 0 && viewJsonData.indexOf('<input name="RedirectTo" value=') !== -1) {
                alert("连接已超时，请重新登录");
                location.href = "/name.nsf?login";
            }
            state.viewData = eval("(" + viewJsonData + ")");
            if ($.isFunction(config.dataReady)) {
                config.dataReady(state.viewData);
            }
        }, "text");
    }
    /**
     * 展现视图数据
     * @param  {Object} viewData 视图数据
     */
    function showViewData(viewData) {
        var viewEntrys = viewData.viewentry || [];
        var entryDatas, entryData;
        tbodyNode.hide().empty();
        //初始化表格体
        for (var index = 0, tbodyLength = viewEntrys.length; index < tbodyLength; index++) {
            var viewEntry = viewEntrys[index];
            entryDatas = viewEntry.entrydata;
            var row = $("<tr>");
            if (config.rowIndex) {
                var rowIndex = config.count * (state.page - 1) + index + 1;
                var td = $("<td>" + rowIndex + "</td>");
                if (config.checkbox) {
                    td.html(config.checkboxTemplate(rowIndex));
                }
                row.append(td);
            }
            for (var m = 0; entryData = entryDatas[m++]; ) {
                row.append("<td>" + getColumnData(entryData) + "</td>");
            }
            row.append("<td><a href='/" + state.dbPath + "/" + state.view + "/" + viewEntry["@unid"] + "?opendocument&login' target='_blank'>详细信息</a></td>");
            tbodyNode.append(row);
        }
        tbodyNode.show();
    }
    /**
     * 根据表格行索引，打开关联的文档
     * @param unid 文档UNID
     */
    function openDocument(unid) {
        window.open("/" + state.dbPath + "/" + state.view + "/" + unid + "?opendocument&login", "_blank");
    }
    /**
     * 通过JSON中的表格数据，返回其中内容
     * @param  {Object} columnData 表格Cell数据
     * @return {String}            表格数据字符串
     */
    function getColumnData(columnData) {
        var result = [], fix = function(s) {
            if (s < 10) {
                return "0" + s;
            }
            return s;
        };
        for (var key in columnData) {
            switch (key) {
              case "textlist":
                //多值域类型
                var dataTextList = columnData.textlist.text;
                for (var n = 0, texts; texts = dataTextList[n++]; ) {
                    var text = [];
                    for (var index in texts) {
                        text.push(texts[index]);
                    }
                    result.push(text.join(","));
                }
                break;

              case "datetime":
                //日期类型，截取字符串并转型
                var dateTexts = columnData[key];
                for (var dateKey in dateTexts) {
                    var dateInfo = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}),(\d{2})([+-]\d{2})/.exec(dateTexts[dateKey]), date = new Date(dateInfo[1] + "/" + dateInfo[2] + "/" + dateInfo[3] + " " + dateInfo[4] + ":" + dateInfo[5] + ":" + dateInfo[6] + "." + dateInfo[7] + "0 GMT" + dateInfo[8] + "00");
                    //IE8下不支持毫秒参数
                    if (isNaN(date)) {
                        date = new Date(dateInfo[1] + "/" + dateInfo[2] + "/" + dateInfo[3] + " " + dateInfo[4] + ":" + dateInfo[5] + ":" + dateInfo[6] + " GMT" + dateInfo[8] + "00");
                    }
                    result.push(date.getFullYear() + "-" + fix(date.getMonth() + 1) + "-" + fix(date.getDate()) + " " + fix(date.getHours()) + ":" + fix(date.getMinutes()) + ":" + fix(date.getSeconds()));
                }
                break;

              default:
                if (key.indexOf("@") !== 0) {
                    var dataTexts = columnData[key];
                    for (var dataKey in dataTexts) {
                        result.push(dataTexts[dataKey]);
                    }
                }
            }
        }
        return result.join(";");
    }
    /**
     * 显示分页控件
     */
    function showPager() {
        //视图文档总数
        var docNum = parseInt(state.viewInfo["entriesCount"] || 0), //当前页
        curPage = state.page, //分页页数
        pageNum = state.pageCount = parseInt(docNum / config.count) + (docNum % config.count > 0 ? 1 : 0);
        //初始化分页控件
        if (!pagerNode) {
            pagerNode = $("<div class='pagination'><ul></ul><span class='sum'>共<span class='badge'>" + docNum + "</span>条文档</span>").appendTo(domNode);
            pagerNode.find("ul").click(function(event) {
                event.preventDefault();
                var target = $(event.target);
                var li = target.parent();
                if (!(li.hasClass("active") || li.hasClass("disabled"))) {
                    var tag = target.attr("href").substring(1), needDelay = false;
                    switch (tag) {
                      case "first":
                        state.page = 1;
                        break;

                      case "before":
                        state.page = state.page > 1 ? state.page - 1 : 1;
                        needDelay = true;
                        break;

                      case "after":
                        state.page = state.page < state.pageCount ? state.page + 1 : state.pageCount;
                        needDelay = true;
                        break;

                      case "last":
                        state.page = state.pageCount;
                        break;

                      case "more":
                        dialogNode.find(".pageNum").val(state.page).focus();
                        dialogNode.find(".add-on").text(state.pageCount);
                        dialogNode.modal();
                        break;

                      default:
                        state.page = parseInt(tag);
                    }
                    switchPage(needDelay);
                }
            });
        }
        //重新渲染页面选择按钮
        var pager = pagerNode.find("ul").hide().empty(), startPage = 1, half = parseInt(config.pagerSize / 2), pagerHtml = "";
        if (curPage < half && curPage + config.pagerSize > pageNum && pageNum > config.pagerSize) {
            startPage = pageNum - config.pagerSize + 1;
        } else if (curPage + half >= pageNum && pageNum > config.pagerSize) {
            startPage = pageNum - half - parseInt(half / 2);
        } else if (curPage >= half && pageNum > config.pagerSize) {
            startPage = curPage - parseInt(half / 2);
        }
        pagerHtml += "<li" + (curPage === 1 ? " class='disabled'" : "") + "><a href='#before'>前一页</a></li>";
        for (var n = 0; n < config.pagerSize && n < pageNum; n++) {
            var pageNumber = n + startPage;
            if (n === 0 && pageNumber > 1 && pageNum > config.pagerSize) {
                pagerHtml += "<li><a href='#1'>1</a></li>";
                startPage--;
            } else if (n === 1 && curPage > half && pageNum > config.pagerSize) {
                pagerHtml += "<li><a href='#more'>...</a></li>";
                startPage--;
            } else if (n === config.pagerSize - 2 && pageNum > config.pagerSize && pageNum - curPage > 2 + parseInt(half / 2)) {
                pagerHtml += "<li><a href='#more'>...</a></li>";
            } else if (n === config.pagerSize - 1 && pageNum > config.pagerSize && curPage !== pageNum) {
                pagerHtml += "<li><a href='#" + pageNum + "'>" + pageNum + "</a></li>";
            } else {
                pagerHtml += "<li " + (curPage === pageNumber ? " class='active'" : "") + "><a href='#" + pageNumber + "'>" + pageNumber + "</a></li>";
            }
        }
        pagerHtml += "<li" + String(curPage === pageNum || pageNum === 0 ? " class='disabled'" : "") + "><a href='#after'>后一页</a></li>";
        pager.html(pagerHtml).show();
        //更新文档总数
        pagerNode.find(".sum .badge").text(docNum);
    }
    //页面切换事件，使用延迟过滤机制
    var switchPage = function() {
        var handle, ready = function() {
            showViewData(state.viewData);
        };
        return function(delay) {
            if (handle) {
                clearTimeout(handle);
            }
            showPager();
            if (delay) {
                handle = setTimeout(function() {
                    getViewData().done(ready);
                }, 300);
            } else {
                getViewData().done(ready);
            }
        };
    }();
    /**
     * 绑定视图表头，切换视图排序模式
     * @param  {Event} event 表头点击事件
     */
    function theadClick(event) {
        var target = event.target;
        //全选事件
        if (target.tagName === "INPUT") {
            tableNode.find("tbody input:checkbox").prop("checked", target.checked);
        } else {
            //排序操作
            var th = $(event.target).closest("th"), thIndex = th.index() - 1, columnInfo = state.viewInfo.columns[th.data("index")];
            //如当前列可排序
            if (columnInfo && (columnInfo.sortAsc || columnInfo.sortDesc)) {
                //判断当前排序状态，如有已排序列且不为当前点击列，清除之
                if (state.sort.column !== undefined && state.sort.column !== thIndex) {
                    $(event.target).closest("thead").find("th span.sorting").removeClass("sorting").find("i").get(0).className = "icon-sort";
                    state.viewInfo.columns[state.sort.column].sortState = 0;
                }
                var span = th.find("span"), icon = span.find("i")[0], typeIndex;
                columnInfo.sortState = columnInfo.sortState || 0;
                columnInfo.sortState++;
                //根据排序配置，修改图标类型和排序状态参数
                if (columnInfo.sortAsc && columnInfo.sortDesc) {
                    typeIndex = columnInfo.sortState % 3;
                    switch (typeIndex) {
                      case 0:
                        span.removeClass("sorting");
                        icon.className = "icon-sort";
                        break;

                      case 1:
                        span.addClass("sorting");
                        icon.className = "icon-sort-up";
                        break;

                      case 2:
                        icon.className = "icon-sort-down";
                        break;
                    }
                } else {
                    typeIndex = columnInfo.sortState % 2;
                    span.toggleClass("sorting");
                    if (columnInfo.sortDesc) {
                        typeIndex = typeIndex === 1 ? 2 : typeIndex;
                    }
                }
                var sort = state.sort = {
                    type: SORT_TYPES[typeIndex],
                    column: SORT_TYPES[typeIndex] ? thIndex : undefined
                };
                //更新视图数据
                getViewData().done(function() {
                    showViewData(state.viewData);
                });
            }
        }
    }
    //公开方法
    var viewPanel = {
        /**
         *返回表格DOM节点
         */
        el: function() {
            return tableNode;
        },
        /**
         * 配置ViewPanel，有以下使用方法
         * config({count:12}) 批量设置属性
         * config("count",12) 单项设置属性
         * config("count") 获取属性值
         * config() 获取全部属性
         * @param {*} param 属性Map/属性key
         * @param {*} [value] 属性值
         * @returns {*} 属性值
         */
        config: function(param, value) {
            if (typeof param === "object") {
                return $.extend(config, param);
            } else if (typeof param !== "undefined" && typeof value !== "undefined") {
                return config[param] = value;
            } else {
                return param ? config[param] : config;
            }
        },
        /**
         * 获取视图状态信息
         * @param {String} key 属性名
         * @returns {*} 视图状态/状态值
         */
        state: function(key) {
            var info = $.extend({}, state);
            return key ? info[key] : info;
        },
        /**
         * 初始化ViewPanel，生成所有dom节点，并绑定相关方法
         * @param {{}} [param] 初始化配置
         */
        init: function(param) {
            this.config(param);
            //为父节点添加超宽样式
            domNode = $(config.parent).addClass("viewPanelParent");
            //初始化表格
            tableNode = $("<table class='table table-bordered table-striped table-hover viewPanel'></table>").appendTo(domNode);
            theadNode = $("<thead style='width: 100%'></thead>").appendTo(tableNode).click(theadClick);
            tbodyNode = $("<tbody></tbody>").appendTo(tableNode).dblclick(function(event) {
                var rowIndex = $(event.target).closest("tr").index();
                var unid = state.viewData.viewentry[rowIndex]["@unid"];
                openDocument(unid);
            });
            //初始化页码输入对话框
            dialogNode = $("<div class='modal' style='display:none'>" + "<div class='modal-header'><a class='close' data-dismiss='modal'>×</a><h3>页面跳转</h3></div>" + "<div class='modal-body'><div class='input-append'>请输入跳转的页面：<input class='pageNum input-xlarge focused' type='text' /><span class='add-on'></span></div></div>" + "<div class='modal-footer'><a href='#' class='btn btn-primary sure'>确定</a></div></div>").appendTo(domNode);
            dialogNode.find(".pageNum").keypress(function(event) {
                if (event.which === 13) {
                    event.preventDefault();
                    if (this.value >= 1 && this.value <= state.pageCount) {
                        state.page = parseInt(this.value);
                        switchPage();
                        dialogNode.modal("hide");
                    }
                }
            });
            dialogNode.find(".sure").click(function(event) {
                event.preventDefault();
                var value = parseInt(dialogNode.find(".pageNum").val());
                if (value >= 1 && value <= state.pageCount) {
                    state.page = value;
                    switchPage();
                    dialogNode.modal("hide");
                }
            });
        },
        /**
         * 根据参数，打开指定视图
         * @param  {} param 打开视图信息
         */
        openView: function(param) {
            //初始化视图显示框架
            if (!domNode) {
                this.init();
            }
            $.extend(state, {
                page: 1,
                category: null,
                key: null,
                sort: {}
            }, param);
            this.refresh();
        },
        /**
         * 刷新视图
         */
        refresh: function() {
            $.when(getViewInfo(true), getViewData(true)).done(function() {
                //处理IE8下，thead无法resize的问题
                tableNode.css("display", "inline-table");
                setTimeout(function() {
                    tableNode.css("display", "");
                }, 0);
                showViewControl(state.viewInfo);
                showViewData(state.viewData);
            }).fail(function() {
                alert("错误：无法打开视图");
            });
        },
        getRowData: function(index, type) {
            var data = state.viewData["viewentry"][index];
            if ((type || "all") === "text" && data) {
                var entries = [];
                for (var m = 0, entry; entry = data.entrydata[m++]; ) {
                    entries.push(getColumnData(entry));
                }
                data = entries;
            }
            return data;
        },
        /**
         * 获取当前选择行信息
         * @param {Function} filter 过滤器；当其返回为null或undefined时跳过当前项，否则将返回值加入列表中
         * @returns {Array}
         */
        getSelected: function(filter) {
            var _this = this, result = [];
            tbodyNode.find("input:checkbox:checked").each(function() {
                var tr = $(this).closest("tr"), index = tr.index(), data = _this.getRowData(index);
                if (filter) {
                    data = filter(data, index, tr);
                    if (data != null) {
                        result.push(data);
                    }
                } else {
                    result.push(data);
                }
            });
            return result;
        }
    };
    return viewPanel;
});

(function(factory) {
    if (typeof define === "function" && define.cmd) {
        define("jquery/gritter/1.7.4/jquery.gritter-debug", [ "jquery-debug" ], function(require) {
            require.async("jquery/gritter/1.7.4/css/jquery.gritter-debug.css");
            factory(require("jquery-debug"));
        });
    } else {
        factory(jQuery);
    }
})(function(jQuery) {
    /*
     * Gritter for jQuery
     * http://www.boedesign.com/
     *
     * Copyright (c) 2012 Jordan Boesch
     * Dual licensed under the MIT and GPL licenses.
     *
     * Date: February 24, 2012
     * Version: 1.7.4
     */
    (function($) {
        /**
         * Set it up as an object under the jQuery namespace
         */
        $.gritter = {};
        /**
         * Set up global options that the user can over-ride
         */
        $.gritter.options = {
            position: "",
            class_name: "",
            // could be set to 'gritter-light' to use white notifications
            fade_in_speed: "medium",
            // how fast notifications fade in
            fade_out_speed: 1e3,
            // how fast the notices fade out
            time: 6e3
        };
        /**
         * Add a gritter notification to the screen
         * @see Gritter#add();
         */
        $.gritter.add = function(params) {
            try {
                return Gritter.add(params || {});
            } catch (e) {
                var err = "Gritter Error: " + e;
                typeof console != "undefined" && console.error ? console.error(err, params) : alert(err);
            }
        };
        /**
         * Remove a gritter notification from the screen
         * @see Gritter#removeSpecific();
         */
        $.gritter.remove = function(id, params) {
            Gritter.removeSpecific(id, params || {});
        };
        /**
         * Remove all notifications
         * @see Gritter#stop();
         */
        $.gritter.removeAll = function(params) {
            Gritter.stop(params || {});
        };
        /**
         * Big fat Gritter object
         * @constructor (not really since its object literal)
         */
        var Gritter = {
            // Public - options to over-ride with $.gritter.options in "add"
            position: "",
            fade_in_speed: "",
            fade_out_speed: "",
            time: "",
            // Private - no touchy the private parts
            _custom_timer: 0,
            _item_count: 0,
            _is_setup: 0,
            _tpl_close: '<a class="gritter-close" href="#" tabindex="1">Close Notification</a>',
            _tpl_title: '<span class="gritter-title">[[title]]</span>',
            _tpl_item: '<div id="gritter-item-[[number]]" class="gritter-item-wrapper [[item_class]]" style="display:none" role="alert"><div class="gritter-top"></div><div class="gritter-item">[[close]][[image]]<div class="[[class_name]]">[[title]]<p>[[text]]</p></div><div style="clear:both"></div></div><div class="gritter-bottom"></div></div>',
            _tpl_wrap: '<div id="gritter-notice-wrapper"></div>',
            /**
             * Add a gritter notification to the screen
             * @param {Object} params The object that contains all the options for drawing the notification
             * @return {Integer} The specific numeric id to that gritter notification
             */
            add: function(params) {
                // Handle straight text
                if (typeof params == "string") {
                    params = {
                        text: params
                    };
                }
                // We might have some issues if we don't have a title or text!
                if (params.text === null) {
                    throw 'You must supply "text" parameter.';
                }
                // Check the options and set them once
                if (!this._is_setup) {
                    this._runSetup();
                }
                // Basics
                var title = params.title, text = params.text, image = params.image || "", sticky = params.sticky || false, item_class = params.class_name || $.gritter.options.class_name, position = $.gritter.options.position, time_alive = params.time || "";
                this._verifyWrapper();
                this._item_count++;
                var number = this._item_count, tmp = this._tpl_item;
                // Assign callbacks
                $([ "before_open", "after_open", "before_close", "after_close" ]).each(function(i, val) {
                    Gritter["_" + val + "_" + number] = $.isFunction(params[val]) ? params[val] : function() {};
                });
                // Reset
                this._custom_timer = 0;
                // A custom fade time set
                if (time_alive) {
                    this._custom_timer = time_alive;
                }
                var image_str = image != "" ? '<img src="' + image + '" class="gritter-image" />' : "", class_name = image != "" ? "gritter-with-image" : "gritter-without-image";
                // String replacements on the template
                if (title) {
                    title = this._str_replace("[[title]]", title, this._tpl_title);
                } else {
                    title = "";
                }
                tmp = this._str_replace([ "[[title]]", "[[text]]", "[[close]]", "[[image]]", "[[number]]", "[[class_name]]", "[[item_class]]" ], [ title, text, this._tpl_close, image_str, this._item_count, class_name, item_class ], tmp);
                // If it's false, don't show another gritter message
                if (this["_before_open_" + number]() === false) {
                    return false;
                }
                $("#gritter-notice-wrapper").addClass(position).append(tmp);
                var item = $("#gritter-item-" + this._item_count);
                item.fadeIn(this.fade_in_speed, function() {
                    Gritter["_after_open_" + number]($(this));
                });
                if (!sticky) {
                    this._setFadeTimer(item, number);
                }
                // Bind the hover/unhover states
                $(item).bind("mouseenter mouseleave", function(event) {
                    if (event.type == "mouseenter") {
                        if (!sticky) {
                            Gritter._restoreItemIfFading($(this), number);
                        }
                    } else {
                        if (!sticky) {
                            Gritter._setFadeTimer($(this), number);
                        }
                    }
                    Gritter._hoverState($(this), event.type);
                });
                // Clicking (X) makes the perdy thing close
                $(item).find(".gritter-close").click(function() {
                    Gritter.removeSpecific(number, {}, null, true);
                    return false;
                });
                return number;
            },
            /**
             * If we don't have any more gritter notifications, get rid of the wrapper using this check
             * @private
             * @param {Integer} unique_id The ID of the element that was just deleted, use it for a callback
             * @param {Object} e The jQuery element that we're going to perform the remove() action on
             * @param {Boolean} manual_close Did we close the gritter dialog with the (X) button
             */
            _countRemoveWrapper: function(unique_id, e, manual_close) {
                // Remove it then run the callback function
                e.remove();
                this["_after_close_" + unique_id](e, manual_close);
                // Check if the wrapper is empty, if it is.. remove the wrapper
                if ($(".gritter-item-wrapper").length == 0) {
                    $("#gritter-notice-wrapper").remove();
                }
            },
            /**
             * Fade out an element after it's been on the screen for x amount of time
             * @private
             * @param {Object} e The jQuery element to get rid of
             * @param {Integer} unique_id The id of the element to remove
             * @param {Object} params An optional list of params to set fade speeds etc.
             * @param {Boolean} unbind_events Unbind the mouseenter/mouseleave events if they click (X)
             */
            _fade: function(e, unique_id, params, unbind_events) {
                var params = params || {}, fade = typeof params.fade != "undefined" ? params.fade : true, fade_out_speed = params.speed || this.fade_out_speed, manual_close = unbind_events;
                this["_before_close_" + unique_id](e, manual_close);
                // If this is true, then we are coming from clicking the (X)
                if (unbind_events) {
                    e.unbind("mouseenter mouseleave");
                }
                // Fade it out or remove it
                if (fade) {
                    e.animate({
                        opacity: 0
                    }, fade_out_speed, function() {
                        e.animate({
                            height: 0
                        }, 300, function() {
                            Gritter._countRemoveWrapper(unique_id, e, manual_close);
                        });
                    });
                } else {
                    this._countRemoveWrapper(unique_id, e);
                }
            },
            /**
             * Perform actions based on the type of bind (mouseenter, mouseleave)
             * @private
             * @param {Object} e The jQuery element
             * @param {String} type The type of action we're performing: mouseenter or mouseleave
             */
            _hoverState: function(e, type) {
                // Change the border styles and add the (X) close button when you hover
                if (type == "mouseenter") {
                    e.addClass("hover");
                    // Show close button
                    e.find(".gritter-close").show();
                } else {
                    e.removeClass("hover");
                    // Hide close button
                    e.find(".gritter-close").hide();
                }
            },
            /**
             * Remove a specific notification based on an ID
             * @param {Integer} unique_id The ID used to delete a specific notification
             * @param {Object} params A set of options passed in to determine how to get rid of it
             * @param {Object} e The jQuery element that we're "fading" then removing
             * @param {Boolean} unbind_events If we clicked on the (X) we set this to true to unbind mouseenter/mouseleave
             */
            removeSpecific: function(unique_id, params, e, unbind_events) {
                if (!e) {
                    var e = $("#gritter-item-" + unique_id);
                }
                // We set the fourth param to let the _fade function know to
                // unbind the "mouseleave" event.  Once you click (X) there's no going back!
                this._fade(e, unique_id, params || {}, unbind_events);
            },
            /**
             * If the item is fading out and we hover over it, restore it!
             * @private
             * @param {Object} e The HTML element to remove
             * @param {Integer} unique_id The ID of the element
             */
            _restoreItemIfFading: function(e, unique_id) {
                clearTimeout(this["_int_id_" + unique_id]);
                e.stop().css({
                    opacity: "",
                    height: ""
                });
            },
            /**
             * Setup the global options - only once
             * @private
             */
            _runSetup: function() {
                for (opt in $.gritter.options) {
                    this[opt] = $.gritter.options[opt];
                }
                this._is_setup = 1;
            },
            /**
             * Set the notification to fade out after a certain amount of time
             * @private
             * @param {Object} item The HTML element we're dealing with
             * @param {Integer} unique_id The ID of the element
             */
            _setFadeTimer: function(e, unique_id) {
                var timer_str = this._custom_timer ? this._custom_timer : this.time;
                this["_int_id_" + unique_id] = setTimeout(function() {
                    Gritter._fade(e, unique_id);
                }, timer_str);
            },
            /**
             * Bring everything to a halt
             * @param {Object} params A list of callback functions to pass when all notifications are removed
             */
            stop: function(params) {
                // callbacks (if passed)
                var before_close = $.isFunction(params.before_close) ? params.before_close : function() {};
                var after_close = $.isFunction(params.after_close) ? params.after_close : function() {};
                var wrap = $("#gritter-notice-wrapper");
                before_close(wrap);
                wrap.fadeOut(function() {
                    $(this).remove();
                    after_close();
                });
            },
            /**
             * An extremely handy PHP function ported to JS, works well for templating
             * @private
             * @param {String/Array} search A list of things to search for
             * @param {String/Array} replace A list of things to replace the searches with
             * @return {String} sa The output
             */
            _str_replace: function(search, replace, subject, count) {
                var i = 0, j = 0, temp = "", repl = "", sl = 0, fl = 0, f = [].concat(search), r = [].concat(replace), s = subject, ra = r instanceof Array, sa = s instanceof Array;
                s = [].concat(s);
                if (count) {
                    this.window[count] = 0;
                }
                for (i = 0, sl = s.length; i < sl; i++) {
                    if (s[i] === "") {
                        continue;
                    }
                    for (j = 0, fl = f.length; j < fl; j++) {
                        temp = s[i] + "";
                        repl = ra ? r[j] !== undefined ? r[j] : "" : r[0];
                        s[i] = temp.split(f[j]).join(repl);
                        if (count && s[i] !== temp) {
                            this.window[count] += (temp.length - s[i].length) / f[j].length;
                        }
                    }
                }
                return sa ? s : s[0];
            },
            /**
             * A check to make sure we have something to wrap our notices with
             * @private
             */
            _verifyWrapper: function() {
                if ($("#gritter-notice-wrapper").length == 0) {
                    $("body").append(this._tpl_wrap);
                }
            }
        };
    })(jQuery);
});
