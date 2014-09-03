define(function (require) {
    var Backbone = require("backbone"),
        _ = require("underscore"),
        widgets = require("./widgets"),
        sidebar = require("./sidebar");

    function convertItemsToBreadcrumb(items, item) {
        var info = [
            {
                href: item.get("href"),
                name: item.get("name")
            }
        ];
        item = items.get(item.get("parentId"));
        while (item && item.id !== "root") {
            info.push({
                href: item.get("href"),
                name: item.get("name")
            });
            item = items.get(item.get("parentId"));
        }
        info.push({
            id: "root",
            href: "#",
            name: "首页"
        });
        return info;
    }

    var Router = Backbone.Router.extend({
        initialize: function () {
            $(function () {
                Backbone.history.start();
            });
        },
        routes: {
            "": "openHome",
            "widget_:id": "openWidget",
            "m_:id": "openMenu",
            "m_:id/:itemId": "openMenuItem",
            "m_:id/:itemId/a_:appItemId": "openAppMenuItem",
            "m_:id/:itemId/q_:queryId": "openQuery",
            "config": "openConfig"
        },
        openHome: function () {
            widgets.initWidget();
            sidebar.activeMenu();
            $(".page-content >.active").removeClass("active");
            $(".page-content .widgetContent").addClass("active");
            $("#breadcrumbs .breadcrumb").html('<li class="active"><i class="icon-home home-icon"></i>首页</li>');
            document.title = "首页 - BEIJING-FANUC";
        },
        openWidget: function (param) {
            var _this = this;
            sidebar.activeMenu();
            widgets.initWidget(null, function () {
                var info = param.split("_"),
                    id = info[0],
                    tabId = info[1],
                    widget = widgets.byId(id);
                _this.makeBreadcrumb([
                    {
                        href: "#widget_" + id + (tabId ? "_" + tabId : ""),
                        name: tabId ? _.find(widget.tabs,function (item) {
                            return item.id === tabId;
                        }).name.replace(/<.+>(\S*)<\/.+>/g, "$1") : widget.title.replace(/<.+>(\S*)<\/.+>/g, "$1")
                    },
                    {
                        id: "root"
                    }
                ], "widget");
                widget.open(tabId);
            });
        },
        openMenu: function (id) {
            var match;
            //由于表达式识别的问题，暂把openMore的调用放置在此。
            if (match = /^(\S+)\?more/.exec(id)) {
                this.makeBreadcrumb([
                    {
                        name: match[1] === "hotForm" ? "所有申请" : "所有应用",
                        href: id
                    },
                    {
                        id: "root"
                    }
                ], "more");
                return sidebar.openMenu(match[1]).openMore();
            } else {
                return sidebar.openMenu(id);
            }
        },
        openMenuItem: function (id, itemId) {
            var menu = this.openMenu(id);
            menu.getItem(itemId, function (item, items) {
                digishell.router.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                menu.openItem(item);
            });
        },
        openAppMenuItem: function (id, itemId, appItemId) {
            var _this = this;
            sidebar.getMenu(id).getItem(itemId, function (item, items) {
                if (item) {
                    _this.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                    var appMenu = sidebar.openMenu("app");
                    appMenu.setSource({
                        dbPath: item.get("dbPath"),
                        source: item.get("source") || "MenusListForm?OpenForm"
                    }).getItem(appItemId, function (appItem) {
                            appMenu.openItem(appItem);
                        })
                }
            });
        },
        openQuery: function (id, itemId, queryId) {
            var _this = this;
            sidebar.getMenu(id).getItem(itemId, function (item, items) {
                _this.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                var appMenu = sidebar.openMenu("app");
                appMenu.setSource({
                    dbPath: item.get("dbPath"),
                    source: item.get("source") || "MenusListForm?OpenForm"
                }).getItemByView(item.get("view"), function (item) {
                        appMenu.render("root");
                        appMenu.activeItem(item);
                        appMenu.$el.find("li.active:last").removeClass("active");
                        if ("eval_callback" in window) {
                            appMenu.$el.find("a").click(function (event) {
                                appMenu.sideMenuClick.call(appMenu, event);
                            });
                        }
                    });

                require.async(["./viewFrame", "./databaseQuery"], function (frame, dbQuery) {
                    frame.set({
                            "queryFrame": dbQuery,
                            "view": _.extend(frame.get("view"), {
                                dbPath: item.get("dbPath")
                            })}
                    );
                    dbQuery.getQueryNames(item.get("dbPath"), function (data) {
                        _this.makeBreadcrumb([
                            {
                                name: data[queryId].name
                            },
                            {
                                name: "查询"
                            },
                            {
                                id: "root"
                            }
                        ], "APP");
                        dbQuery.loadQuery(item.get("dbPath"), queryId);
                    });
                });
            });
        },
        openConfig: function () {
            var _this = this;
            _this.makeBreadcrumb([
                {
                    name: "个人设置",
                    href: "#config"
                },
                {
                    id: "root"
                }
            ], "config");
            $(".page-content >.active").removeClass("active");
            $(".page-content .config").addClass("active");
            require.async("./config", function (config) {
                config.init();
            });
        },
        makeBreadcrumb: function (items, type) {
            var info = [], headTitle = "首页", item = items[0], n = 1;
            if (type !== "APP") {
                info.push("<li class='active'>" + item.name + "</li>");
                headTitle = item.name;
                while ((item = items[n++]) && item.id !== "root") {
                    info.push("<li><a href='#" + type + "'>" + item.name + "</a><span class='divider'><i class='icon-angle-right arrow-icon'></i></span></li>");
                }
                info.push("<li><i class='icon-home home-icon'></i><a href='#'>首页</a><span class='divider'><i class='icon-angle-right arrow-icon'></i></span></li>");
            } else {
                headTitle = item.name;
                info.push("&nbsp;" + item.name + "</small></h1>");
                while ((item = items[n++]) && items[n].id !== "root") {
                    info.push("&nbsp;" + item.name + "&nbsp;<i class='icon-double-angle-right'></i>");
                }
                info.push("<h1>" + item.name + "&nbsp;<small><i class='icon-double-angle-right'></i>");
            }

            if (type !== "APP") {
                $("#breadcrumbs .breadcrumb").html(info.reverse().join(""));
                document.title = headTitle + " - BEIJING-FANUC";
            } else {
                var titles = document.title.split(" - ");
                $(".view-breadcrumb").html(info.reverse().join(""));
                document.title = headTitle + " - " + (titles.length > 2 ? titles.slice(1) : titles).join(" - ");
            }
        }
    });

    var router = new Router();
    return router;
});
