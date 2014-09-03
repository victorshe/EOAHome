/**
 * 视图显示框架
 * @author L.Z.W
 */
(function (factory) {
    if (typeof define === "function" && define.cmd) {
        define(function (require) {
            require("./viewPanel.css");
            return factory(require("jquery"));
        });
    } else {
        ("digiflow" in window ? window["digiflow"] : window.digiflow = {}).viewPanel = factory(jQuery);
    }
})(function ($) {
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
            checkboxTemplate: function (data) {
                return "<label class='checkbox'><input type='checkbox'/>" + data + "</label>";
            },
            infoReady: null,
            dataReady: null
        }, //状态储存
        state = {
            //当前页
            page: 1,
            //数据库所在服务器
            server: "",
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
        },
        SORT_TYPES = [ "", "ascending", "descending" ],//排序参数名
        TIME_TESTER = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/,//UTC日期类型测试，如：2013-09-27T00:29:43Z
        domNode, //当前框架所在DOM节点
        tableNode, theadNode, tbodyNode, //当前框架表格DOM节点
        pagerNode,//分页控件DOM节点
        dialogNode; //页选择对话框DOM节点
    var theadFixFlag = (function () {
        var browserInfo = /.+?MSIE ([^;]+);.*/.exec(navigator.userAgent);
        return browserInfo && parseInt(browserInfo[1], 0) < 9;
    })();

    /**
     * 获取视图标题并展现
     */
    function getViewInfo(refreshFlag) {
        //TODO 待实现跨域读取
        return $.get("/Produce/DigiShell.nsf/getViewInfoAgent?OpenAgent" + (!!refreshFlag ? "&timeStamp=" + new Date().getTime() : ""), {
            server: state.server,
            db: state.dbPath,
            category: state.category,
            view: state.view
        }, function (viewInfo) {
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
        var ajaxParam = {
            url: "/Produce/DigiShell.nsf/REST_Service.xsp/getViewData",
            success: function (viewJsonData) {
                if (viewJsonData.charAt(0) === "<" && viewJsonData.indexOf("<!DOCTYPE") === 0 && viewJsonData.indexOf('<input name="RedirectTo" value=') !== -1) {
                    alert("连接已超时，请重新登录");
                }
                state.viewData = eval("(" + viewJsonData + ")");
                if ($.isFunction(config.dataReady)) {
                    config.dataReady(state.viewData);
                }
            },
            dataType: "text"
        };
        if (!!noCache) {
            ajaxParam.cache = false;
        }
        ajaxParam.data = (function () {
            var param = {
                dbPath: state.server ? (state.server + "!!" + state.dbPath) : state.dbPath,
                view: state.view,
                count: config.count,
                start: (state.page - 1) * config.count
            };
            if (state.sort && state.sort.type) {
                param.sort = state.sort.item;
                param.order = state.sort.type;
            }
            if (state.category) {
                param.category = state.category;
            }
            if (state.key) {
                param.key = state.key;
            }
            return param;
        })();
        return $.ajax(ajaxParam);
    }

    /**
     * 展现视图数据
     * @param  {Object} viewData 视图数据
     */
    function showViewData(entries) {
        tbodyNode.hide().empty();
        //初始化表格体
        for (var index = 0, tbodyLength = entries.length; index < tbodyLength; index++) {
            var entry = entries[index];
            var row = $("<tr>");
            if (config.rowIndex) {
                var rowIndex = config.count * (state.page - 1) + index + 1;
                var td = $("<td>" + rowIndex + "</td>");
                if (config.checkbox) {
                    td.html(config.checkboxTemplate(rowIndex));
                }
                row.append(td);
            }
            for (var m = 0, item; item = state.viewInfo.columns[m++];) {
                if (!item.hide) {
                    row.append("<td>" + getColumnData(entry, item) + "</td>");
                }
            }
            row.append("<td><a href='/" + state.dbPath + "/" + state.view + "/" + entry["@unid"] + "?opendocument&login' target='_blank'>详细信息</a></td>");
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
     * @param  {Object} entry 视图行数据
     * @param {Object} columnInfo 视图列信息
     * @return {String}            表格数据字符串
     */
    function getColumnData(entry, columnInfo) {
        var result = entry[columnInfo.name], f = function (n) {
            return n < 10 ? "0" + n : n;
        };
        if (TIME_TESTER.test(result)) {
            var time = new Date(result);
            if (isNaN(time)) {
                time = new Date(result.replace(/-/g, "/").replace("T", " ").substring(0, result.length - 1));
                time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
            }
            return time.getFullYear() + "-" + f(time.getMonth() + 1) + "-" + f(time.getDate()) + " " + f(time.getHours()) + ":" + f(time.getMinutes()) + ":" + f(time.getSeconds());
        }
        return result;
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
            pagerNode.find("ul").click(function (event) {
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
    var switchPage = (function () {
        var handle, ready = function () {
            showViewData(state.viewData);
        };
        return function (delay) {
            if (handle) {
                clearTimeout(handle);
            }
            showPager();
            if (delay) {
                handle = setTimeout(function () {
                    getViewData().done(ready);
                }, 300);
            } else {
                getViewData().done(ready);
            }
        };
    })();

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
                    column: SORT_TYPES[typeIndex] ? thIndex : undefined,
                    item: columnInfo.name
                };
                //更新视图数据
                getViewData().done(function () {
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
        el: function () {
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
        config: function (param, value) {
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
        state: function (key) {
            var info = $.extend({}, state);
            return key ? info[key] : info;
        },
        /**
         * 初始化ViewPanel，生成所有dom节点，并绑定相关方法
         * @param {{}} [param] 初始化配置
         */
        init: function (param) {
            this.config(param);
            //为父节点添加超宽样式
            domNode = $(config.parent).addClass("viewPanelParent");
            //初始化表格
            tableNode = $("<table class='table table-bordered table-striped table-hover viewPanel'></table>").appendTo(domNode);
            theadNode = $("<thead style='width: 100%'></thead>").appendTo(tableNode).click(theadClick);
            tbodyNode = $("<tbody></tbody>").appendTo(tableNode).dblclick(function (event) {
                var rowIndex = $(event.target).closest("tr").index();
                var unid = state.viewData[rowIndex]["@unid"];
                openDocument(unid);
            });
            //初始化页码输入对话框
            dialogNode = $("<div class='modal' style='display:none'>" + "<div class='modal-header'><a class='close' data-dismiss='modal'>×</a><h3>页面跳转</h3></div>" + "<div class='modal-body'><div class='input-append'>请输入跳转的页面：<input class='pageNum input-xlarge focused' type='text' /><span class='add-on'></span></div></div>" + "<div class='modal-footer'><a href='#' class='btn btn-primary sure'>确定</a></div></div>").appendTo(domNode);
            dialogNode.find(".pageNum").keypress(function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                    if (this.value >= 1 && this.value <= state.pageCount) {
                        state.page = parseInt(this.value);
                        switchPage();
                        dialogNode.modal("hide");
                    }
                }
            });
            dialogNode.find(".sure").click(function (event) {
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
        openView: function (param) {
            //初始化视图显示框架
            if (!domNode) {
                this.init();
            }
            $.extend(state, {
                server: "",
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
        refresh: function () {
            $.when(getViewInfo(true), getViewData(true)).done(function () {
                //处理IE8下，thead无法resize的问题
                if (theadFixFlag) {
                    tableNode.css("display", "inline-table");
                    setTimeout(function () {
                        tableNode.css("display", "");
                    }, 0);
                }
                showViewControl(state.viewInfo);
                showViewData(state.viewData);
            }).fail(function () {
                    alert("错误：无法打开视图");
                });
        },
        getRowData: function (index, type) {
            var data = state.viewData[index];
            if ((type || "all") === "text" && data) {
                var entries = [];
                for (var m = 0, item; item = state.viewInfo.columns[m++];) {
                    if (!item.hide) {
                        entries.push(getColumnData(data, item));
                    }
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
        getSelected: function (filter) {
            var _this = this, result = [];
            tbodyNode.find("input:checkbox:checked").each(function () {
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