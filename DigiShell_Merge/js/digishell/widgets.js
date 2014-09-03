define(function (require, exports) {
    var Backbone = require("backbone"),
        _ = require("underscore"),
        util = require("./util");

    var modelCache = {},
        widgetCache = {},
        callbackCache = [],
        initFlag = false;

    function initPanel(layoutConfig, parent, curWidth) {
        var node;
        $.each(layoutConfig, function (key, define) {
            switch (define.type) {
                case "v":
                    node = $("<div class='span" + 12 / (curWidth / define.size_x) + " widget-container-span'></div>");
                    break;
                case "h":
                    node = $("<div class='row-fluid'></div>");
                    if (parent.children().size() > 0) {
                        parent.append("<div class='space-6'></div>");
                    }
                    break;
                case "w":
                    var widget = exports.getWidget(define.wId, define);
                    parent.append(widget.el);
                    break;
                default:
                    node = $("<div>");
            }
            if (define.children) {
                initPanel(define.children, node, define.type === "v" ? define.size_x : curWidth);
            }
            parent.append(node);
        });
    }

    function getSourceInfo(widgetIds) {
        var query = {};
        _.each(widgetIds || widgetCache, function (item) {
            var widgetId = widgetIds ? item : (item.singleton === false ? item.id : item.widgetId);
            query[widgetId] = widgetCache[widgetId].source;
        });
        return query;
    }

    exports.DEFAULT_WIDGET = [
        {id: "widget_gsxw", "wId": "gsxw", "col": 1, "row": 1, "size_x": 4, "size_y": 2},
        {id: "widget_xzgg", "wId": "xzgg", "col": 1, "row": 3, "size_x": 3, "size_y": 2},
        {id: "widget_rwxx", "wId": "RWXX", "col": 4, "row": 1, "size_x": 2, "size_y": 2},
        {id: "widget_hydt", "wId": "hydt", "col": 4, "row": 3, "size_x": 3, "size_y": 2},
        {id: "widget_bbs", "wId": "bbs", "col": 1, "row": 5, "size_x": 4, "size_y": 2}
    ];

    exports.addWidget = function (extendId, model) {
        modelCache[model.widgetId] = extendId ? modelCache[extendId].extend(_.extend(model, {events: _.extend({}, modelCache[extendId].prototype.events, model.events)})) : Backbone.View.extend(model);
        return this;
    };
    exports.addCallback = function (callback) {
        callbackCache.push(callback);
    };
    exports.startup = function (layoutConfig) {
        initPanel(layoutConfig, $(".widgetContent").empty(), 6);
        return this;
    };
    exports.render = function (widgetIds, verify) {
        var sourceInfo = getSourceInfo(widgetIds);
        $.post("/Produce/DigiShell.nsf/HomeDataServiceXAgent.xsp", {
            define: JSON.stringify(sourceInfo)
        }, function (data) {
            var flag = _.isFunction(verify) ? verify(widgetIds, data) : true;
            if (flag !== false) {
                for (var id in sourceInfo) {
                    widgetCache[id].render(data[id]);
                }
            }
            _.each(callbackCache, function (callback) {
                callback(data);
            });
        }, "json");
        return this;
    };
    exports.byId = function (widgetId) {
        return widgetCache[widgetId];
    };
    exports.loadWidget = function (param, callback) {
        if (_.isArray(param)) {
            _.each(param, function () {

            });
        } else {

        }
        require.async("./widgets-add-on", callback);
    };
    exports.getWidget = function (widgetId, param) {
        var Model = modelCache[widgetId];
        if (Model.prototype.singleton === false) {
            var widget = new Model(param);
            return widgetCache[widget.id] = widget;
        } else {
            return widgetCache[widgetId] ? widgetCache[widgetId] : (widgetCache[widgetId] = new Model(param));
        }
    };
    exports.destory = function (widgetId) {
        if (widgetId) {

        } else {
            $(".widgetContent").empty();
            for (var key in widgetCache) {
                widgetCache[key].$el.remove();
                delete widgetCache[key];
            }
            initFlag = false;
        }
    };
    exports.initWidget = function (config, callback) {

        function spliteGrid(gridDefine, type) {
            var isCol = type === "col",
                attr = isCol ? "size_x" : "size_y",
                itemType = isCol ? "v" : "h";
            if (gridDefine.length > 1) {
                var splitInfo = [];
                _.chain(gridDefine).groupBy(type).each(function (defines) {
                    var mergeItem,
                        maxItem = _.max(defines, function (define) {
                            return define[attr];
                        });
                    if (mergeItem = _.find(splitInfo, function (item) {
                        return item[type] < maxItem[type] && item[type] + item[attr] > maxItem[type];
                    })) {
                        if (maxItem[type] + maxItem[attr] > mergeItem[type] + mergeItem[attr]) {
                            mergeItem[attr] = mergeItem[attr] + maxItem[attr] - maxItem[type];
                        }
                        mergeItem.children = mergeItem.children.concat(defines);
                    } else {
                        splitInfo.push(_.extend({
                            type: itemType,
                            children: defines
                        }, isCol ? {
                            col: defines[0].col,
                            size_x: maxItem.size_x
                        } : {
                            row: defines[0].row,
                            size_y: maxItem.size_y
                        }));
                    }
                });

                return _.chain(splitInfo).map(function (item) {
                    item.children = spliteGrid(item.children, isCol ? "row" : "col");
                    return item;
                }).sortBy(type).value();
            } else {
                return _.chain(gridDefine).map(function (define) {
                    return _.extend({}, define, {
                        type: "w"
                    });
                }).sortBy(type).value();
            }
        }

        exports.loadWidget("", function () {
            if (!initFlag) {
                exports.startup(spliteGrid(config || util.localConfig("widgetsConfig") || exports.DEFAULT_WIDGET, "col"));
                exports.render();
                initFlag = true;
            }
            if (_.isFunction(callback)) {
                callback();
            }
        });
    };
    var Backbone = require("backbone"),
        _ = require("underscore"),
        util = require("./util");

    var modelCache = {},
        widgetCache = {},
        callbackCache = [],
        initFlag = false;

    function initPanel(layoutConfig, parent, curWidth) {
        var node;
        $.each(layoutConfig, function (key, define) {
            switch (define.type) {
                case "v":
                    node = $("<div class='span" + 12 / (curWidth / define.size_x) + " widget-container-span'></div>");
                    break;
                case "h":
                    node = $("<div class='row-fluid'></div>");
                    if (parent.children().size() > 0) {
                        parent.append("<div class='space-6'></div>");
                    }
                    break;
                case "w":
                    var widget = exports.getWidget(define.wId, define);
                    parent.append(widget.el);
                    break;
                default:
                    node = $("<div>");
            }
            if (define.children) {
                initPanel(define.children, node, define.type === "v" ? define.size_x : curWidth);
            }
            parent.append(node);
        });
    }

    function getSourceInfo(widgetIds) {
        var query = {};
        _.each(widgetIds || widgetCache, function (item) {
            var widgetId = widgetIds ? item : (item.singleton === false ? item.id : item.widgetId);
            query[widgetId] = widgetCache[widgetId].source;
        });
        return query;
    }

    exports.DEFAULT_WIDGET = [
        {id: "widget_gsxw", "wId": "gsxw", "col": 1, "row": 1, "size_x": 3, "size_y": 2},
        {id: "widget_xzgg", "wId": "xzgg", "col": 1, "row": 3, "size_x": 3, "size_y": 2},
        {id: "widget_rwxx", "wId": "RWXX", "col": 4, "row": 1, "size_x": 3, "size_y": 2},
        {id: "widget_hydt", "wId": "hydt", "col": 4, "row": 3, "size_x": 3, "size_y": 2},
        //{id: "widget_bbs", "wId": "bbs", "col": 1, "row": 5, "size_x": 3, "size_y": 2}
    ];

    exports.addWidget = function (extendId, model) {
        modelCache[model.widgetId] = extendId ? modelCache[extendId].extend(_.extend(model, {events: _.extend({}, modelCache[extendId].prototype.events, model.events)})) : Backbone.View.extend(model);
        return this;
    };
    exports.addCallback = function (callback) {
        callbackCache.push(callback);
    };
    exports.startup = function (layoutConfig) {
        initPanel(layoutConfig, $(".widgetContent").empty(), 6);
        return this;
    };
    exports.render = function (widgetIds, verify) {
        var sourceInfo = getSourceInfo(widgetIds);
        $.post("/Produce/DigiShell.nsf/HomeDataServiceXAgent.xsp", {
            define: JSON.stringify(sourceInfo)
        }, function (data) {
            var flag = _.isFunction(verify) ? verify(widgetIds, data) : true;
            if (flag !== false) {
                for (var id in sourceInfo) {
                    widgetCache[id].render(data[id]);
                }
            }
            _.each(callbackCache, function (callback) {
                callback(data);
            });
        }, "json");
        return this;
    };
    exports.byId = function (widgetId) {
        return widgetCache[widgetId];
    };
    exports.loadWidget = function (param, callback) {
        if (_.isArray(param)) {
            _.each(param, function () {

            });
        } else {

        }
        require.async("./widgets-add-on", callback);
    };
    exports.getWidget = function (widgetId, param) {
        var Model = modelCache[widgetId];
        if (Model.prototype.singleton === false) {
            var widget = new Model(param);
            return widgetCache[widget.id] = widget;
        } else {
            return widgetCache[widgetId] ? widgetCache[widgetId] : (widgetCache[widgetId] = new Model(param));
        }
    };
    exports.destory = function (widgetId) {
        if (widgetId) {

        } else {
            $(".widgetContent").empty();
            for (var key in widgetCache) {
                widgetCache[key].$el.remove();
                delete widgetCache[key];
            }
            initFlag = false;
        }
    };
    exports.initWidget = function (config, callback) {

        function spliteGrid(gridDefine, type) {
            var isCol = type === "col",
                attr = isCol ? "size_x" : "size_y",
                itemType = isCol ? "v" : "h";
            if (gridDefine.length > 1) {
                var splitInfo = [];
                _.chain(gridDefine).groupBy(type).each(function (defines) {
                    var mergeItem,
                        maxItem = _.max(defines, function (define) {
                            return define[attr];
                        });
                    if (mergeItem = _.find(splitInfo, function (item) {
                        return item[type] < maxItem[type] && item[type] + item[attr] > maxItem[type];
                    })) {
                        if (maxItem[type] + maxItem[attr] > mergeItem[type] + mergeItem[attr]) {
                            mergeItem[attr] = mergeItem[attr] + maxItem[attr] - maxItem[type];
                        }
                        mergeItem.children = mergeItem.children.concat(defines);
                    } else {
                        splitInfo.push(_.extend({
                            type: itemType,
                            children: defines
                        }, isCol ? {
                            col: defines[0].col,
                            size_x: maxItem.size_x
                        } : {
                            row: defines[0].row,
                            size_y: maxItem.size_y
                        }));
                    }
                });

                return _.chain(splitInfo).map(function (item) {
                    item.children = spliteGrid(item.children, isCol ? "row" : "col");
                    return item;
                }).sortBy(type).value();
            } else {
                return _.chain(gridDefine).map(function (define) {
                    return _.extend({}, define, {
                        type: "w"
                    });
                }).sortBy(type).value();
            }
        }

        exports.loadWidget("", function () {
            if (!initFlag) {
                exports.startup(spliteGrid(config || util.localConfig("widgetsConfig") || exports.DEFAULT_WIDGET, "col"));
                exports.render();
                initFlag = true;
            }
            if (_.isFunction(callback)) {
                callback();
            }
        });
    };
});
