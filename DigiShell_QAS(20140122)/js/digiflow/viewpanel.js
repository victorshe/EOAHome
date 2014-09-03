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
        },
    //状态储存
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
        },
    //排序参数名
        SORT_TYPES = ["", "ResortAscending", "ResortDescending"],
    //当前框架所在DOM节点
        domNode,
    //当前框架表格DOM节点
        tableNode,
        theadNode,
        tbodyNode,
    //分页控件DOM节点
        pagerNode,
    //页选择对话框DOM节点
        dialogNode;

    /**
     * 获取视图标题并展现
     */
    function getViewInfo(refreshFlag) {
        //TODO 待实现跨域读取
        $.get("/Produce/DigiShell.nsf/getViewInfoAgent?OpenAgent" + (!!refreshFlag ? "&timeStamp=" + new Date().getTime() : ""), {
            "db": state.dbPath,
            "category": state.category,
            "view": state.view
        },function (viewJsonInfo) {
            state.viewInfo = eval("(" + viewJsonInfo + ")");
            //处理IE8下，thead无法resize的问题
            tableNode.css("display", "inline-table");
            setTimeout(function () {
                tableNode.css("display", "");
            }, 0);
            showViewControl(state.viewInfo);
            if ($.isFunction(config.infoReady)) {
                config.infoReady.call(viewPanel, state.viewInfo);
            }
        }, "text").error(function () {
                //TODO 异常信息待完善
                alert("连接已断开，请重新登录");
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
                th.addClass("checkbox").html(config.checkboxTemplate('序号'));
            }
            headRow.append(th);
        }

        var columns = viewInfo.columns;
        for (var n = 0, column; column = columns[n]; n++) {
            if (!column.hide) {
                var width = parseInt(column.width / config.thWidthMultiple);
                var thNode = $("<th style='width:" +
                    width + "em'>" + column.title + "</th>");
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
        $.get("/" + state.dbPath + "/" + state.view + "?ReadViewEntries&outputformat=json" + (!!noCache ? "&timeStamp=" + new Date().getTime() : ""), (function () {
            var param = {
                "count": config.count,
                "start": (state.page - 1) * config.count + 1
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
        })(),function (viewJsonData) {
            state.viewData = eval("(" + viewJsonData + ")");
            showViewData(state.viewData);
            if ($.isFunction(config.dataReady)) {
                config.dataReady(state.viewData);
            }
        }, "text").error(function () {
                //TODO 异常信息待完善
                alert("连接已断开，请重新登录");
            });
    }

    /**
     * 展现视图数据
     * @param  {Object} viewData 视图数据
     */

    function showViewData(viewData) {
        var viewEntrys = viewData.viewentry || [];
        var entryDatas, entryData;
        //如果表头尚未加载完成，则自行构建表头
        if (theadNode.children().size() === 0 && viewEntrys.length > 0) {
            var headRow = $("<tr>").appendTo(theadNode);
            entryDatas = viewEntrys[0].entrydata;
            if (config.rowIndex) {
                var th = $("<th class='index'>序号</th>");
                if (config.checkbox) {
                    th.addClass("checkbox").html(config.checkboxTemplate('序号'));
                }
                headRow.append(th);
            }
            for (var n = 0; entryData = entryDatas[n++];) {
                headRow.append("<th>" + entryData["@name"] + "</th>");
            }
            headRow.append("<th class='detail'>查看</th>");
            theadNode.show();
        }
        tbodyNode.hide().empty();
        //初始化表格体
        for (var index = 0, tbodyLength = viewEntrys.length; index < tbodyLength; index++) {
            var viewEntry = viewEntrys[index];
            entryDatas = viewEntry.entrydata;
            var row = $("<tr>");
            if (config.rowIndex) {
                var rowIndex = (config.count * (state.page - 1) + index + 1);
                var td = $("<td>" + rowIndex + "</td>");
                if (config.checkbox) {
                    td.html(config.checkboxTemplate(rowIndex));
                }
                row.append(td);
            }
            for (var m = 0; entryData = entryDatas[m++];) {
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
        window.open("/" + state.dbPath + "/" + state.view + "/" + unid + "?opendocument&login", '_blank');
    }

    /**
     * 通过JSON中的表格数据，返回其中内容
     * @param  {Object} columnData 表格Cell数据
     * @return {String}            表格数据字符串
     */

    function getColumnData(columnData) {
        var result = [],
            fix = function (s) {
                if (s < 10)return "0" + s;
                return s;
            };
        for (var key in columnData) {
            switch (key) {
                case "textlist":
                    //多值域类型
                    var dataTextList = columnData.textlist.text;
                    for (var n = 0, texts; texts = dataTextList[n++];) {
                        var text = [];
                        for (var index in texts) {
                            text.push(texts[index]);
                        }
                        result.push(text.join(","));
                    }
                    break;
                case "datetime":
                    //日期类型，截取字符串并转型
                    var dataTexts = columnData[key];
                    for (var dataKey in dataTexts) {
                        var dateInfo = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}),(\d{2})([+-]\d{2})/.exec(dataTexts[dataKey]),
                            date = new Date(dateInfo[1] + "/" + dateInfo[2] + "/" + dateInfo[3] + " " + dateInfo[4] + ":" + dateInfo[5] + ":" + dateInfo[6] + "." + dateInfo[7] + "0 GMT" + dateInfo[8] + "00");
                        //IE8下不支持毫秒参数
                        if (isNaN(date)) {
                            date = new Date(dateInfo[1] + "/" + dateInfo[2] + "/" + dateInfo[3] + " " + dateInfo[4] + ":" + dateInfo[5] + ":" + dateInfo[6] + " GMT" + dateInfo[8] + "00");
                        }
                        result.push(date.getFullYear() + "-" + fix(date.getMonth() + 1) + "-" + fix(date.getDate()) + " " + fix(date.getHours()) + ":" + fix(date.getMinutes()) + ":" + fix(date.getSeconds()));
                    }
                    break;
                default :
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
        var docNum = parseInt(state.viewInfo["entriesCount"] || 0),
        //当前页
            curPage = state.page,
        //分页页数
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
        var pager = pagerNode.hide().find("ul").empty(),
            startPage = 1,
            half = parseInt(config.pagerSize / 2),
            pagerHtml = "";
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
            } else if (n === config.pagerSize - 2 && pageNum > config.pagerSize && (pageNum - curPage) > (2 + parseInt(half / 2))) {
                pagerHtml += "<li><a href='#more'>...</a></li>";
            } else if (n === config.pagerSize - 1 && pageNum > config.pagerSize && curPage != pageNum) {
                pagerHtml += "<li><a href='#" + pageNum + "'>" + pageNum + "</a></li>";
            } else {
                pagerHtml += "<li " + (curPage === pageNumber ? " class='active'" : "") + "><a href='#" + pageNumber + "'>" + pageNumber + "</a></li>"
            }
        }
        pagerHtml += "<li" + String((curPage === pageNum) || (pageNum === 0) ? " class='disabled'" : "") + "><a href='#after'>后一页</a></li>";
        pager.html(pagerHtml);
        //更新文档总数
        pagerNode.find(".sum .badge").text(docNum);
        pagerNode.show();
    }

    //页面切换事件，使用延迟过滤机制
    var switchPage = (function () {
        var handle;
        return function (delay) {
            if (handle) {
                clearTimeout(handle);
            }
            showPager();
            if (delay) {
                handle = setTimeout(function () {
                    getViewData();
                }, 300);
            } else {
                getViewData();
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
            var th = $(event.target).closest("th"),
                columnIndex = th.index() - 1,
                columnInfo = state.viewInfo.columns[columnIndex];
            //如当前列可排序
            if (columnInfo && (columnInfo.sortAsc || columnInfo.sortDesc)) {
                //判断当前排序状态，如有已排序列且不为当前点击列，清除之
                if (state.sort.column !== undefined && state.sort.column !== columnIndex) {
                    $(event.target).closest("thead").find("th span.sorting").removeClass("sorting").find("i").get(0).className = "icon-sort";
                    state.viewInfo.columns[state.sort.column].sortState = 0;
                }
                var span = th.find("span"),
                    icon = span.find("i")[0],
                    typeIndex;
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
                    column: SORT_TYPES[typeIndex] ? columnIndex : undefined
                };
                //更新视图数据
                getViewData();
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
                var unid = state.viewData.viewentry[rowIndex]["@unid"];
                openDocument(unid);
            });
            //初始化页码输入对话框
            dialogNode = $("<div class='modal' style='display:none'>" +
                "<div class='modal-header'><a class='close' data-dismiss='modal'>×</a><h3>页面跳转</h3></div>" +
                "<div class='modal-body'><div class='input-append'>请输入跳转的页面：<input class='pageNum input-xlarge focused' type='text' /><span class='add-on'></span></div></div>" +
                "<div class='modal-footer'><a href='#' class='btn btn-primary sure'>确定</a></div></div>").appendTo(domNode);
            dialogNode.find(".pageNum").keypress(function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                    if (this.value >= 1 && this.value <= state.pageCount) {
                        state.page = parseInt(this.value);
                        switchPage();
                        dialogNode.modal('hide');
                    }
                }
            });
            dialogNode.find(".sure").click(function (event) {
                event.preventDefault();
                var value = parseInt(dialogNode.find(".pageNum").val());
                if (value >= 1 && value <= state.pageCount) {
                    state.page = value;
                    switchPage();
                    dialogNode.modal('hide');
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
            getViewInfo(true);
            getViewData(true);
        },
        getRowData: function (index, type) {
            var data = state.viewData["viewentry"][index];
            if ((type || "all") === "text" && data) {
                var entries = [];
                for (var m = 0, entry; entry = data.entrydata[m++];) {
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
        getSelected: function (filter) {
            var _this = this,
                result = [];
            tbodyNode.find("input:checkbox:checked").each(function () {
                var tr = $(this).closest("tr"),
                    index = tr.index(),
                    data = _this.getRowData(index);
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
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      