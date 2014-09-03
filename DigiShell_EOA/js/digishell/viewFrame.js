define(function(require, exports, module) {
    var viewPanel = require("digiflow.viewpanel"),
        Backbone = require("backbone"),
        logo = require("./logo"),
        util = require("./util");
    require("gritter");
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
    var getCount = (function() {
        var headerHeight,
            pagerHeight;
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
            return result > 8 ? parseInt(result) - 1 : 8;
        };
    })();
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
            if ( !! param["draft"]) {
                this.set({
                    allowDelete: true,
                    isDraft: true
                });
            }
            if ("showHeader" in param) {
                this.set("showHeader", !! param.showHeader);
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
            var _this = this,
                parent = $(".view");
            parent.append(this.$el.append('<div class="page-header"><div class="view-breadcrumb"></div><div class="view-toolbar btn-toolbar"></div></div><div class="viewData"></div>'));
            viewPanel.init({
                checkbox: true,
                count: getCount(parent.offset().top || $(".widgetContent").offset().top, $("#breadcrumbs"), 38 / 40, true),
                checkboxTemplate: function(data) {
                    return '<label><input type="checkbox" class="ace"/><span class="lbl">' + data + '</span></label>';
                },
                infoReady: function(info) {
                    _this.model.set({
                        allowDelete: !! info['allowDelete'] || _this.model.get("isDraft"),
                        allowDeleteCache: !! info['allowDelete'] || _this.model.get("isDraft")
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
            "click .view-toolbar button": 'toolsAction',
            "click .view-toolbar ul.export": 'exportAction'
        },
        render: function() {
            viewPanel.openView(this.model.get("view"));
        },
        showToolbar: function(allowDelete) {
            var toolbar = this.$el.find(".view-toolbar");
            var deleteButtonHtml = '<div class="btn-group"><button class="btn btn-danger" data-action="delete" title="删除"><i class="icon-trash"></i></button></div>';
            toolbar.html('<div class="btn-group"><button class="btn btn-info" data-toggle="dropdown" data-action="query" title="查找"><i class="icon-search"></i></button><ul class="dropdown-menu dropdown-default query"></ul></div>' + (allowDelete ? deleteButtonHtml : '') + '<div class="btn-group"><button class="btn btn-success" data-action="refresh" title="刷新"><i class="icon-refresh"></i></button></div><div class="btn-group"><button class="btn btn-grey dropdown-toggle" data-action="export" data-toggle="dropdown" title="导出"><i class="icon-share"></i></button><ul class="dropdown-menu dropdown-default pull-right export"><li><a href="#current">导出当前页</a></li><li><a href="#all">导出所有页</a></li></ul></div>');
        },
        toolsAction: _.debounce(function(event) {
            var button = $(event.currentTarget),
                action = button.data("action"),
                _this = this;
            switch (action) {
                case 'query':
                    if (!button.parent().hasClass("open")) {
                        require.async("./databaseQuery", function(query) {
                            //读取查询配置，组装下拉菜单
                            query.getQueryNames(_this.model.get("view").dbPath, function(data) {
                                var html = "",
                                    count = 0;
                                for (var id in data) {
                                    html += "<li><a href='" + /\S+(#m_\S+?\/[^\/]+)\S*/.exec(location.href)[1] + "/q_" + id + "'>" + data[id].name + "</a></li>";
                                    count++;
                                }
                                html += "";
                                var queryMenu = _this.$el.find(".dropdown-menu.query").html(count > 0 ? html : '<li><a>无查询配置</a></li>');
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
                case 'delete':
                    var selected = _this.model.get("queryFrame") ? _this.model.get("queryFrame").getSelected(function(item) {
                        return item[item.length - 1];
                    }) : viewPanel.getSelected(function(item) {
                        return item["@unid"];
                    });
                    if (selected.length === 0) {
                        $.gritter.add({
                            title: '提示',
                            text: '请先选择文档',
                            time: 1500,
                            class_name: 'gritter-center gritter-info'
                        });
                        return false;
                    }
                    var dialogId = $.gritter.add({
                        title: '提示',
                        text: '<p>是否删除所选文档？</p><p style="text-align: right"><a class="btn btn-small btn-danger sure" href="#">确定</a>&nbsp;<a class="btn btn-small cancel">取消</a></p>',
                        class_name: 'gritter-center gritter-info'
                    });
                    $("#gritter-notice-wrapper").one("click", "a.btn", function(event) {
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
                case 'refresh':
                    if (_this.model.get("queryFrame")) return;
                    viewPanel.refresh();
                    break;
                case 'export':
                    break;
            }
        }, 200),
        exportAction: function(event) {
            var action = $(event.target).attr("href").substring(1),
                queryFrame = this.model.get("queryFrame");
            require.async("digiflow.exceltools", function(tools) {
                if (queryFrame) {
                    var aoColumns = queryFrame.dataTable.fnSettings().aoColumns,
                        title = _.map(aoColumns.slice(1, aoColumns.length - 1), function(item) {
                            return item.sTitle;
                        }),
                        data = [];
                    switch (action) {
                        case "current":
                            queryFrame.dataTable.find("tbody tr").each(function() {
                                var rowData = queryFrame.dataTable.fnGetData(this);
                                data.push(rowData.slice(1, rowData.length - 1))
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
                            tools.exportArray((function() {
                                var result = [];
                                for (var i = 0, data; data = viewPanel.getRowData(i++, "text");) {
                                    result.push(data);
                                }
                                return result;
                            }()), (function(info) {
                                var result = [];
                                for (var i = 0, column; column = info.columns[i]; i++) {
                                    if (!column.hide) {
                                        result.push(column.title);
                                    }
                                }
                                return result;
                            })(viewPanel.state("viewInfo")), fileName);
                            break;
                        case "all":
                            var param = {
                                dbPath: viewPanel.state("dbPath"),
                                view: viewPanel.state("view"),
                                columns: (function(info) {
                                    var result = [];
                                    for (var i = 0, column; column = info.columns[i]; i++) {
                                        if (!column.hide) {
                                            result.push(i);
                                        }
                                    }
                                    return result;
                                })(viewPanel.state("viewInfo")),
                                fileName: fileName
                            };
                            if (viewPanel.state("category")) {
                                param.category = viewPanel.state("category")
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