define(function (require, exports) {

    var util = require("./util"),
        widgets = require("./widgets");

    var DEFAULT_CONFIG = {
        "company": {
            editable: false,
            widgets: widgets.DEFAULT_WIDGET
        },
        "personal": {
            widgets: util.localConfig("widgetsConfig") || [
                {"id": "widget_rwxx", "wId": "RWXX", "col": 4, "row": 1, "size_x": 3, "size_y": 2},
                {"ico": "icon-calendar", "id": "DF_A_A_09", "name": "工作日历", "parentId": "DF_A_A", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 3, "row": 1},
                {"ico": "icon-globe", "id": "mylanguage", "name": "个人语言", "parentId": "DF_A_A", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 2, "row": 1},
                {"ico": "icon-user", "id": "Menu_PsnInfo", "name": "通讯录", "parentId": "DF_A_A", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 2, "row": 2},
                {"ico": "icon-comments-alt", "id": "MeetingManage", "name": "会议室管理", "parentId": "DF_A_C", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 3, "row": 2},
                {"ico": "icon-ticket", "id": "DF_A_GZXZ", "name": "工作交办", "parentId": "DF_A_C", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 1, "row": 2},
                {"ico": "icon-pencil", "id": "DF_A_C_01", "name": "办公用品管理", "parentId": "DF_A_C", "wId": "shortcut", "size_x": 1, "size_y": 1, "col": 1, "row": 1},
                {"id": "widget_weather", "wId": "weather", "size_x": 3, "size_y": 1, "parentId": "widget", "col": 4, "row": 3}
            ]
        }
    };

    exports.switchConfig = function (configId) {
        var config = DEFAULT_CONFIG[configId];
        if (config.widgets) {
            digishell.widgets.destory();
            if (config.editable !== false) {
                util.localConfig("widgetsConfig", config.widgets);
            }
            digishell.widgets.initWidget(config.widgets);
            digishell.router.navigate("#",true);
        }
    };

});