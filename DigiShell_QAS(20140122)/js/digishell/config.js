define(function (require, exports) {
    var sidebar = require("./sidebar"),
        widgets = require("./widgets"),
        _ = require("underscore"),
        util = require("./util");

    require("tree");
    require("gridster");

    var DataSourceTree = function (items, selectedItems) {
        this._items = items;
        this._selectedItems = selectedItems;
    };

    DataSourceTree.prototype.data = function (options, callback) {
        function getParents(selectedItem, items) {
            if (selectedItem.get("id") === "root") {
                return [];
            }
            var parentId = selectedItem.get("parentId"),
                parentIds = [],
                parent;
            if (parentId !== "root") {
                parentIds.push(parentId);
                if (parent = items.get(parentId)) {
                    parentIds = parentIds.concat(getParents(parent, items));
                }
            }
            return parentIds;
        }


        var items = this._items,
            selected = this._selectedItems,
            parentIds = selected ? (function () {
                var parentIds = [];
                selected.each(function (item) {
                    parentIds = _.unique(parentIds.concat(getParents(items.get(item.get("id")), items)));
                });
                return parentIds;
            })() : null,
            result = {};

        if (!("name" in options) && !("type" in options)) {
            _.each(items.where({parentId: "root"}), function (item) {
                var type = items.findWhere({parentId: item.id}) ? "folder" : "item";
                result[item.id] = _.extend({}, item.attributes, {
                    type: type,
                    expanded: type === "folder" ? _.indexOf(parentIds, item.id) !== -1 : null
                });
            });
            callback({ data: result });
            return;
        } else if ("type" in options && options.type === "folder") {
            _.each(items.where({parentId: options.id}), function (item) {
                var type = items.findWhere({parentId: item.id}) ? "folder" : "item";
                result[item.id] = _.extend({}, item.attributes, {
                    type: type,
                    checked: type === "folder" ? null : (selected ? !!selected.findWhere({id: item.id}) : false),
                    expanded: type === "folder" ? _.indexOf(parentIds, item.id) !== -1 : null
                });
            });
        }

        if (items != null) {//this setTimeout is only for mimicking some random delay
            setTimeout(function () {
                callback({ data: result });
            }, parseInt(Math.random() * 500, 0) + 200);
        }

    };

    var initFlag = false;

    exports.init = function () {
        if (!initFlag) {
            $(".page-content .config").html('<div class="span12"><div class="tabbable"><ul class="nav nav-tabs" id="config_Tab"><li class="active"><a data-toggle="tab" href="#config_hotFormConfig_Tab">常用申请</a></li><li><a data-toggle="tab" href="#config_hotAppConfig_Tab">常用应用</a></li><li><a data-toggle="tab" href="#config_WidgetConfig_Tab">首页组件</a></li></ul><div class="tab-content"><div id="config_hotFormConfig_Tab" class="tab-pane in active"></div><div id="config_hotAppConfig_Tab" class="tab-pane"></div><div id="config_WidgetConfig_Tab" class="tab-pane"><h3 class="header smaller lighter green">配置首页组件</h3><div class="row-fluid"><div class="gridster span10"><ul></ul></div><div class="span2" style="overflow-x: auto;white-space: nowrap;"><div class="tree"></div></div></div></div></div></div></div>');

            var hotForm = sidebar.openMenu("hotForm"),
                hotApp = sidebar.getMenu("hotApp"),
                formMap = sidebar.getSiteMap({
                    el: $("#config_hotFormConfig_Tab")[0],
                    create: true
                }).refresh({
                        mode: "hotForm",
                        selectable: true,
                        selected: hotForm.model,
                        filter: function (item) {
                            return item.get("form") && item.get("formName");
                        }
                    }),
                appMap = sidebar.getSiteMap({
                    el: $("#config_hotAppConfig_Tab")[0],
                    create: true
                }).refresh({
                        mode: "hotApp",
                        selectable: true,
                        selected: hotApp.model
                    }),
                gridster;

            function addWidget(item) {
                var widget = widgets.getWidget(item.wId, item),
                    widgetNode = widget.$el.clone();
                widgetNode.addClass("mini").removeAttr("id").find("[id]").removeAttr("id");
                widgetNode.find(".badge").text("");
                var $el = gridster.add_widget($("<li></li>").append(widgetNode), item.size_x, item.size_y, item.col || 1, item.row || 1);
                $el.data("widgetConfig", item);
            }

            formMap.$el.on('select', function (event, item, items) {
                var menuData = [
                    {id: "root", level: 0}
                ].concat(_.map(items, function (item) {
                        return {
                            id: item.id,
                            ico: item.get("ico"),
                            name: item.get("formName") || item.get("name"),
                            dbPath: item.get("dbPath"),
                            form: item.get("form"),
                            source: item.get("source"),
                            parentId: "root"
                        };
                    }));
                util.localConfig("hotFormConfig", menuData);
                hotForm.model.reset(menuData);
                hotForm.render("root");
            });

            appMap.$el.on("select", function (event, item, items) {
                var menuData = [
                    {id: "root", level: 0}
                ].concat(_.map(items, function (item) {
                        return {
                            id: item.id,
                            ico: item.get("ico"),
                            name: item.get("name"),
                            dbPath: item.get("dbPath"),
                            view: item.get("view"),
                            source: item.get("source"),
                            parentId: "root"
                        };
                    }));
                util.localConfig("hotAppConfig", menuData);
                hotApp.model.reset(menuData);
                hotApp.render("root");
            });


            $("#config_Tab").on("shown", function (event) {
                var index = $(event.target).closest("li").index();
                switch (index) {
                    case 0:
                        $("#sidebar-shortcuts-large a:eq(" + index + ")").tab("show");
                        break;
                    case 1:
                        $("#sidebar-shortcuts-large a:eq(" + index + ")").tab("show");
                        break;
                    case 2:
                        if ($("#config_WidgetConfig_Tab .gridster li").size() === 0) {
                            var size = $(document).width() < 1200 ? 90 : 120;
                            gridster = $("#config_WidgetConfig_Tab .gridster > ul").gridster({
                                widget_margins: [5, 5],
                                widget_base_dimensions: [size, size],
                                max_cols: 6,
                                serialize_params: function ($w, wgd) {
                                    return _.extend($w.data("widgetConfig"), { col: wgd.col, row: wgd.row, size_x: wgd.size_x, size_y: wgd.size_y });
                                },
                                draggable: {
                                    stop: function () {
                                        util.localConfig("widgetsConfig", gridster.serialize());
                                        digishell.widgets.destory();
                                    }
                                }
                            }).data('gridster');
                            widgets.loadWidget("", function () {
                                _.each(util.localConfig("widgetsConfig") || widgets.DEFAULT_WIDGET, function (item) {
                                    addWidget(item);
                                });
                            });
                        }
                        $("#sidebar-shortcuts-large a:first").tab("show");
                        break;
                }
            });

            $("#config_WidgetConfig_Tab .gridster").on("click", function (event) {
                event.stopPropagation();
                event.preventDefault();
                return;
            });

            formMap.getItem("root", function (item, items) {
                var widgetsConfig = new Backbone.Collection(items.map(function (item) {
                    var newItem = item.clone();
                    newItem.attributes = {
                        ico: item.get("ico"),
                        id: item.get("id"),
                        name: item.get("name"),
                        parentId: item.get("parentId")
                    };
                    if (item.get("parentId") === "root") {
                        newItem.set("parentId", "widget_menu");
                    }
                    newItem.set({
                        "wId": "shortcut",
                        "size_x": 1,
                        "size_y": 1
                    });
                    return newItem;
                }));
                widgetsConfig.add([
                    {
                        id: "widget_gsxw",
                        wId: "gsxw",
                        name: "公司新闻",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_rwxx",
                        wId: "RWXX",
                        name: "任务消息",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_xzgg",
                        wId: "xzgg",
                        name: "行政公告",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_hydt",
                        wId: "hydt",
                        name: "制度流程",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_bbs",
                        wId: "bbs",
                        name: "企业论坛",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_cppx",
                        wId: "cppx",
                        name: "企业培训",
                        size_x: 3,
                        size_y: 2,
                        parentId: "widget"
                    },
                    {
                        id: "widget_mail",
                        wId: "mail",
                        name: "邮件",
                        size_x: 3,
                        size_y: 1,
                        parentId: "widget"
                    },
                    {
                        id: "widget_weather",
                        wId: "weather",
                        name: "天气",
                        size_x: 3,
                        size_y: 1,
                        parentId: "widget"
                    },
                    {
                        id: "widget_menu",
                        name: "菜单",
                        parentId: "root"
                    },
                    {
                        id: "widget",
                        name: "组件",
                        parentId: "root"
                    }
                ]);

                $("#config_WidgetConfig_Tab .tree").ace_tree({
                    dataSource: new DataSourceTree(widgetsConfig, new Backbone.Collection(util.localConfig("widgetsConfig") || widgets.DEFAULT_WIDGET)),
                    multiSelect: true,
                    loadingHTML: '<div class="tree-loading"><i class="icon-refresh icon-spin blue"></i></div>',
                    'open-icon': 'icon-minus',
                    'close-icon': 'icon-plus',
                    'selectable': true,
                    'selected-icon': 'icon-ok',
                    'unselected-icon': 'icon-remove'
                }).on('selected', function (evt, data) {
                        var widgetNodes = $(".gridster .gs_w"),
                            removeWidgets = widgetNodes.filter(function () {
                                return !_.findWhere(data.info, {id: $(this).data("widgetConfig").id});
                            }),
                            newWidgets = _.filter(data.info, function (item) {
                                return widgetNodes.filter(function () {
                                    return $(this).data("widgetConfig").id === item.id;
                                }).size() === 0;
                            });

                        removeWidgets.each(function () {
                            gridster.remove_widget(this);
                        });

                        _.each(newWidgets, function (item) {
                            var config = _.extend({}, item);
                            delete config.type;
                            delete config.checked;
                            delete config.expanded;
                            addWidget(config);
                        });

                        util.localConfig("widgetsConfig", gridster.serialize());
                        digishell.widgets.destory();
                    });
            });
        }
    }
});