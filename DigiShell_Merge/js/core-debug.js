define("/DigiShell/js/core-debug", [ "./logo-debug", "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./util-debug", "./router-debug", "./widgets-debug", "./sidebar-debug", "./theme-debug" ], function(require) {
    require("./logo-debug");
    var util = require("./util-debug"), router = require("./router-debug"), widgets = require("./widgets-debug"), sidebar = require("./sidebar-debug"), theme = require("./theme-debug");
    $(function() {
        $(".user-name").text(function(name) {
            var names = name.split(" ");
            for (var n = 0, s; s = names[n]; n++) {
                names[n] = s.charAt(0).toUpperCase() + s.slice(1);
            }
            return names.join(" ");
        }(util.getUserName() || util.getUserId()));
    });
    return {
        util: util,
        router: router,
        widgets: widgets,
        sidebar: sidebar,
        theme: theme
    };
});

define("/DigiShell/js/logo-debug", [ "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug" ], function(require) {
    var Backbone = require("backbone/backbone/1.1.0/backbone-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), config = _.extend({
        speed: 500,
        delay: 5e3,
        height: $(".navbar-banner").height(),
        isExpan: true
    }, Backbone.Events);
    function controlBanner(event) {
        config.isExpan = !config.isExpan;
        $(".navbar-banner-control").toggleClass("navbar-banner-control-collapse").find("i").get(0).className = "icon-caret-" + (config.isExpan ? "up" : "down");
        controlMainContainer();
        $(".navbar-banner").slideToggle(this.speed, function() {
            config.trigger("change:isExpan");
        });
        if (event) {
            event.preventDefault();
        }
    }
    function controlMainContainer() {
        var content = $(".main-content .page-content");
        content.css("min-height", screen.availHeight - content.offset().top + "px");
    }
    var scrollControl = function() {
        var handle;
        return function() {
            if (handle) {
                clearTimeout(handle);
            }
            handle = setTimeout(function() {
                if ($(window).scrollTop() > 100) {
                    $("#btn-scroll-up").fadeIn(150);
                } else {
                    $("#btn-scroll-up").fadeOut(150);
                }
            }, 50);
        };
    }();
    $(".navbar-banner-control a").click(controlBanner);
    $(function() {
        controlMainContainer();
        $(window).scroll(scrollControl);
    });
    return config;
});

define("/DigiShell/js/router-debug", [ "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./widgets-debug", "./util-debug", "./sidebar-debug" ], function(require) {
    var Backbone = require("backbone/backbone/1.1.0/backbone-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), widgets = require("./widgets-debug"), sidebar = require("./sidebar-debug");
    function convertItemsToBreadcrumb(items, item) {
        var info = [ {
            href: item.get("href"),
            name: item.get("name")
        } ];
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
        initialize: function() {
            $(function() {
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
            config: "openConfig"
        },
        openHome: function() {
            widgets.initWidget();
            sidebar.activeMenu();
            $(".page-content >.active").removeClass("active");
            $(".page-content .widgetContent").addClass("active");
            $("#breadcrumbs .breadcrumb").html('<li class="active"><i class="icon-home home-icon"></i>首页</li>');
            document.title = "首页 - BEIJING-FANUC";
        },
        openWidget: function(param) {
            var _this = this;
            sidebar.activeMenu();
            widgets.initWidget(null, function() {
                var info = param.split("_"), id = info[0], tabId = info[1], widget = widgets.byId(id);
                _this.makeBreadcrumb([ {
                    href: "#widget_" + id + (tabId ? "_" + tabId : ""),
                    name: tabId ? _.find(widget.tabs, function(item) {
                        return item.id === tabId;
                    }).name.replace(/<.+>(\S*)<\/.+>/g, "$1") : widget.title.replace(/<.+>(\S*)<\/.+>/g, "$1")
                }, {
                    id: "root"
                } ], "widget");
                widget.open(tabId);
            });
        },
        openMenu: function(id) {
            var match;
            //由于表达式识别的问题，暂把openMore的调用放置在此。
            if (match = /^(\S+)\?more/.exec(id)) {
                this.makeBreadcrumb([ {
                    name: match[1] === "hotForm" ? "所有申请" : "所有应用",
                    href: id
                }, {
                    id: "root"
                } ], "more");
                var realId = match[1];
                require.async("./siteMap", function(siteMap) {
                    $(".page-content >.active").removeClass("active");
                    var siteMapContent = $(".page-content .siteMap").addClass("active").children().hide(), siteMapNode = siteMapContent.filter("." + realId).show();
                    siteMap.getSiteMap(realId, {
                        el: siteMapNode[0]
                    });
                });
                return sidebar.openMenu(realId);
            } else {
                return sidebar.openMenu(id);
            }
        },
        openMenuItem: function(id, itemId) {
            var menu = this.openMenu(id);
            menu.getItem(itemId, function(item, items) {
                digishell.router.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                menu.openItem(item);
            });
        },
        openAppMenuItem: function(id, itemId, appItemId) {
            var _this = this;
            sidebar.getMenu(id).getItem(itemId, function(item, items) {
                if (item) {
                    _this.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                    sidebar.openMenu("app").setSource({
                        from: "#m_" + id + "/" + itemId,
                        dbPath: item.get("dbPath"),
                        view: item.get("view"),
                        source: item.get("source") || "MenusListForm?OpenForm"
                    }).getItem(appItemId, function(appItem) {
                        this.openItem(appItem);
                    });
                }
            });
        },
        openQuery: function(id, itemId, queryId) {
            var _this = this;
            sidebar.getMenu(id).getItem(itemId, function(item, items) {
                _this.makeBreadcrumb(convertItemsToBreadcrumb(items, item), "m_" + id);
                var appMenu = sidebar.openMenu("app");
                appMenu.setSource({
                    from: "#m_" + id + "/" + itemId,
                    dbPath: item.get("dbPath"),
                    view: item.get("view"),
                    source: item.get("source") || "MenusListForm?OpenForm"
                });
                require.async([ "./viewFrame", "./databaseQuery" ], function(frame, dbQuery) {
                    frame.set({
                        queryFrame: dbQuery,
                        view: _.extend(frame.get("view"), {
                            dbPath: item.get("dbPath")
                        })
                    });
                    dbQuery.getQueryNames(item.get("dbPath"), function(data) {
                        _this.makeBreadcrumb([ {
                            name: data[queryId].name
                        }, {
                            name: "查询"
                        }, {
                            id: "root"
                        } ], "APP");
                        dbQuery.loadQuery(item.get("dbPath"), queryId);
                    });
                });
            });
        },
        openConfig: function() {
            var _this = this;
            _this.makeBreadcrumb([ {
                name: "个人设置",
                href: "#config"
            }, {
                id: "root"
            } ], "config");
            $(".page-content >.active").removeClass("active");
            $(".page-content .config").addClass("active");
            require.async("./config", function(config) {
                config.init();
            });
        },
        makeBreadcrumb: function(items, type) {
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

define("/DigiShell/js/sidebar-debug", [ "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./util-debug" ], function(require, exports) {
    var Backbone = require("backbone/backbone/1.1.0/backbone-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), util = require("./util-debug");
    //每次显示菜单深度
    var renderDeep = null, //点击事件名称
    click_event = $.fn.tap ? "tap" : "click", //菜单项模板
    itemTemplate = _.template("<li><a href='<%=href%>'><i class='<%=ico||(level===2?\"icon-double-angle-right\":\"\")%>'></i><span class='menu-text'><%=name%></span></a></li>"), //子级菜单项模板
    parentTemplate = _.template("<li><a href='<%=href%>' class='dropdown-toggle <%=obj.lazy?'lazy':''%>'><i class='<%=ico||(level===2?\"icon-double-angle-right\":\"\")%>'></i><span class='menu-text'><%=name%></span><b class='arrow icon-angle-down'></b></a><ul class='submenu'><%=childItem%></ul></li><% delete obj.childItem %>"), menuOptChecker = /GJOpt_ViewTmpGotoURL\('\S+?&login(\S+?)'\)/, menuCache = {}, moduleCache = {}, isMiniMenu;
    function convertItemsToBreadcrumb(items, item) {
        var info = [ {
            href: item.get("href"),
            name: item.get("name")
        } ];
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
    function convertIconClassName(className) {
        switch (className) {
          case "create":
          case "/DF_Res/DF_Img_Source/Img_KJ/create.gif":
            return "icon-file-alt";

          case "draft":
          case "/DF_Res/DF_Img_Source/Img_KJ/draft.gif":
            return "icon-save";

          case "doing":
          case "/DF_Res/DF_Img_Source/Img_KJ/doing.gif":
            return "icon-rocket";

          case "done":
          case "/DF_Res/DF_Img_Source/Img_KJ/done.gif":
            return "icon-flag";

          case "my":
          case "/DF_Res/DF_Img_Source/Img_KJ/my.gif":
            return "icon-user";

          case "all":
          case "/DF_Res/DF_Img_Source/Img_KJ/all.gif":
            return "icon-hdd";
        }
        return className || "";
    }
    var BaseMenuItems = Backbone.Collection.extend({
        type: "",
        source: null,
        initialize: function(models, options) {
            this.type = options ? options.type || "" : null;
            this.forForm = options ? options.forForm : false;
        },
        model: Backbone.Model.extend({
            id: "",
            ico: "",
            name: "",
            server: "",
            dbPath: "",
            view: "",
            url: "",
            opt: "",
            parentId: ""
        }),
        getItem: function(id, callback) {
            var item = this.get(id);
            if (!item) {
                this.listenToOnce(this, "add", function() {
                    this.getItem(id, callback);
                });
                return;
            }
            if (_.isFunction(callback)) {
                callback.call(this, item, this);
            }
        },
        openItem: function(item, event) {
            var _this = this, openLink = function() {
                if (item.get("url")) {
                    window.open(item.get("url"), "_blank");
                    return true;
                } else if (item.get("opt") && menuOptChecker.exec(item.get("opt")) === null) {
                    eval("(" + item.get("opt") + ")");
                    return true;
                } else if (item.get("form")) {
                    if (item.get("source") === undefined || item.get("source").indexOf(".xsp") !== -1) {
                        window.open("/" + item.get("dbPath") + "/" + item.get("form") + ".xsp", "_blank");
                    } else {
                        window.open("/" + item.get("dbPath") + "/" + item.get("form") + "?openform", "_blank");
                    }
                    return true;
                }
                return false;
            }, openView = function() {
                if (item.get("view")) {
                    var appMenu = openMenu("app"), param = {
                        from: "#m_" + _this.type + "/" + item.id,
                        dbPath: item.get("dbPath"),
                        view: item.get("view"),
                        source: item.get("source") || "MenusListForm?OpenForm",
                        stamp: new Date()
                    };
                    if (item.get("server")) {
                        param.server = item.get("server");
                    }
                    appMenu.setSource(param);
                    return true;
                }
                return false;
            };
            //因为未能实现完全的单页应用，这里尚需判断需要额外操作的类型
            var flag = this.forForm ? openLink() || openView() : openView() || openLink();
            if (event) {
                event.preventDefault();
            }
        }
    });
    var AppMenuItems = BaseMenuItems.extend({
        source: null,
        activeItem: null,
        setSource: function(source) {
            this.source = this.source || {};
            var origin = _.clone(this.source);
            if (!_.isEqual(origin, _.extend(this.source, source))) {
                this.isXsp = source.source.indexOf(".xsp") !== -1;
                this.loadItems(function() {
                    if (this.source.stamp) {
                        this.openDefaultItem();
                    } else {
                        this.activeDefaultItem();
                    }
                });
            }
            return this;
        },
        /**
         *
         * @param [callback]
         */
        loadItems: function(callback) {
            var _this = this;
            if (this.source.server) {
                //TODO 待实现
                return;
            } else {
                this.fetch(_.extend(this.isXsp ? {} : {
                    dataType: "text"
                }, {
                    url: "/" + this.source.dbPath + "/" + this.source.source,
                    reset: true,
                    success: function() {
                        if (_.isFunction(callback)) {
                            callback.apply(_this);
                        }
                    },
                    error: function(items, resp, options) {
                        //判断是否无权限或登录超时
                        if (resp.responseText.indexOf("<!DOCTYPE HTML PUBLIC") === 0 && resp.responseText.indexOf('<input name="RedirectTo" value="' + options.url + '" type=hidden>') !== -1) {
                            var info = /<span id="ReasonTextInfo">(\S+?)<\/span>/.exec(resp.responseText);
                            digishell.util.openLogin(info ? info[1] : "");
                        }
                    }
                }));
            }
        },
        getItem: function(id, callback) {
            var _this = this, item = this.get(id);
            if (!item) {
                this.loadItems(function() {
                    if (_.isFunction(callback)) {
                        item = this.get(id);
                        callback.call(_this, item, _this);
                    }
                });
                return;
            }
            if (_.isFunction(callback)) {
                callback.call(_this, item, _this);
            }
        },
        openItem: function(item, event) {
            var _this = this;
            //TODO 待优化
            if (item.get("view")) {
                this.activeItem = item.id;
                this.trigger("change:activeItem", item);
                require.async("./viewFrame", function(frame) {
                    digishell.router.makeBreadcrumb(convertItemsToBreadcrumb(_this, item), "APP");
                    frame.openView(item.attributes);
                });
            } else {
                BaseMenuItems.prototype.openItem.apply(this, [ item, event ]);
            }
        },
        openDefaultItem: function() {
            var item = this.where({
                view: this.source.view
            })[0];
            if (item) {
                digishell.router.navigate(this.source.from + "/a_" + item.id, {
                    replace: false,
                    trigger: true
                });
            }
        },
        activeDefaultItem: function() {
            var item = this.where({
                view: this.source.view
            })[0];
            if (item) {
                this.activeItem = item.id;
                this.trigger("change:activeItem", item);
            }
        },
        parse: function(response, options) {
            var _this = this, menuData = [ {
                id: "root",
                level: 0
            } ], menuXmlParser = function(menuNodes, parentId) {
                var _this = this, urlParamParser = function(url) {
                    var paramInfo = {};
                    _.forEach(url.split("&"), function(item) {
                        var key, value;
                        var index = item.indexOf("=");
                        if (index !== -1) {
                            key = item.substring(0, index);
                            value = item.substring(index + 1);
                        } else {
                            key = item;
                        }
                        if (key !== "count") {
                            paramInfo[key] = value;
                        }
                    });
                    if (paramInfo.thDir && paramInfo.thDb) {
                        paramInfo.dbPath = paramInfo.thDir + "/" + paramInfo.thDb;
                        delete paramInfo.thDir;
                        delete paramInfo.thDb;
                    }
                    if (paramInfo.thView) {
                        paramInfo.view = paramInfo.thView;
                        delete paramInfo.thView;
                    }
                    if (paramInfo.draftflag) {
                        paramInfo.draft = true;
                        delete paramInfo.draftflag;
                    }
                    /*jshint -W065 */
                    if (paramInfo.page) {
                        paramInfo.page = parseInt(paramInfo.page);
                    }
                    return paramInfo;
                };
                var result = [];
                menuNodes.each(function(index) {
                    var node = $(this), item = {
                        id: node.attr("id") || (parentId === "root" ? "" : parentId + "_") + index,
                        name: node.attr("name"),
                        ico: convertIconClassName(node.attr("ico")),
                        lazy: !!node.attr("lazy"),
                        parentId: parentId
                    }, children = node.children(), opts;
                    //当根节点声明了lazySource时，将其属性作为ajax数据源
                    if (item.id === "0" && node.attr("lazySource")) {
                        _this.url = node.attr("lazySource");
                    }
                    if ((opts = menuOptChecker.exec(node.attr("opt"))) !== null) {
                        _.extend(item, urlParamParser(opts[1]));
                    } else {
                        item.opt = node.attr("opt");
                    }
                    result.push(item);
                    if (children.size() > 0) {
                        result = result.concat(menuXmlParser(children, item.id));
                    }
                });
                return result;
            };
            if (options.dataType === "text") {
                var menuXml = /.+<[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa] id="MenuXmlList" style="display:none">(.+?)<\/[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa]>.*/.exec(response.replace(/\n|\r/g, ""))[1].replace(/&/g, "&amp;");
                menuData = menuData.concat(menuXmlParser($($.parseXML(menuXml).firstChild).children(), "root"));
            } else {
                var menuDataParser = function(data, parentId) {
                    var result = [];
                    if ("lazySource" in response) {
                        _this.url = response["lazySource"];
                    }
                    _.each(data, function(item, index) {
                        result.push(_.extend(item, {
                            id: item.id || (parentId === "root" ? "" : parentId + "_") + index,
                            ico: convertIconClassName(item.ico),
                            dbPath: dbPath,
                            parentId: parentId,
                            lazy: !!item.lazy
                        }));
                        if ("showDraftDel" in item) {
                            item.draft = true;
                            delete item["showDraftDel"];
                        }
                        if (item.children) {
                            result = result.concat(menuDataParser(item.children, item.id));
                            delete item.children;
                        }
                    });
                    return result;
                }, dbPath = /\/(\S+)\/\S*/.exec(options.url)[1];
                menuData = menuData.concat(menuDataParser(response.items, "root"));
            }
            return menuData;
        }
    });
    //全局菜单数据源
    var SiteMapSource = BaseMenuItems.extend({
        url: function() {
            return "/Produce/DigiShell.nsf/getMenuDataXAgent.xsp?parent=root";
        },
        getItem: function(id, callback) {
            var item = this.get(id), _this = this;
            if (!item) {
                this.fetch({
                    success: function() {
                        item = _this.get(id);
                        if (_.isFunction(callback)) {
                            callback.call(_this, item, _this);
                        }
                    },
                    error: function(items, resp, options) {
                        if (resp.responseText.indexOf("<!DOCTYPE HTML PUBLIC") === 0 && resp.responseText.indexOf('<input name="RedirectTo" value="' + options.url + '" type=hidden>') !== -1) {
                            digishell.util.openLogin();
                        }
                    }
                });
                return;
            }
            if (_.isFunction(callback)) {
                callback.call(this, item, this);
            }
        }
    });
    var BaseMenu = Backbone.View.extend({
        tagName: "ul",
        className: "nav nav-list",
        model: null,
        activeItemNode: null,
        events: $.fn.tap ? {
            "tap a": "sideMenuClick"
        } : {
            "click a": "sideMenuClick"
        },
        initialize: function() {
            var _this = this, localConfig = util.localConfig(this.id + "Config"), initMenu = function(menuData) {
                this.model.add(menuData);
                this.render("root");
                if ("eval_callback" in window) {
                    this.$el.find("a").click(function(event) {
                        _this.sideMenuClick.call(_this, event);
                    });
                }
            };
            $("#" + this.id + "Menu").append(this.el);
            this.model = new BaseMenuItems([], {
                type: this.id,
                forForm: this.id.indexOf("Form") !== -1
            });
            if (localConfig) {
                initMenu.call(this, localConfig);
            } else {
                require.async("./defaultConfig", function(defaults) {
                    initMenu.call(_this, defaults.DEFAULT_MENU[_this.id]);
                });
            }
        },
        sideMenuClick: function(event) {
            var link = $(event.currentTarget), _this = this;
            if (!link || link.length === 0) {
                return;
            }
            if (!link.hasClass("dropdown-toggle")) {
                if (isMiniMenu && click_event === "tap" && link.get(0).parentNode.parentNode === this.el) {
                    var textNode = link.find(".menu-text").get(0);
                    if (event.target !== textNode && !$.contains(textNode, event.target)) {
                        return false;
                    }
                }
                this.model.openItem(this.getItemByLink(link), event);
                return;
            } else if (link.hasClass("lazy")) {
                var item = this.getItemByLink(link);
                this.model.sync("read", this.model, {
                    data: {
                        parentId: item.id
                    },
                    success: function(response) {
                        _this.model.add(_.map(response, function(child, index) {
                            child.id = child.id || item.id + "_" + index;
                            child.ico = child.ico || "";
                            child.dbPath = _this.source.dbPath;
                            child.lazy = !!child.lazy;
                            child.parentId = item.id;
                            return child;
                        }));
                        _this.render(item.id);
                        link.removeClass("lazy");
                        item.set("lazy", false);
                    }
                });
                event.preventDefault();
            }
            event.preventDefault();
            //切换箭头方向
            //          link.find("b.arrow").toggleClass("icon-angle-down").toggleClass("icon-angle-up");
            var childMenuNode = link.next().get(0);
            if (!$(childMenuNode).is(":visible")) {
                var curMenuNode = $(childMenuNode.parentNode).closest("ul");
                if (isMiniMenu && curMenuNode.hasClass("nav-list")) {
                    return;
                }
                curMenuNode.find("> .open > .submenu").each(function() {
                    if (this !== childMenuNode && !$(this.parentNode).hasClass("active")) {
                        $(this).slideUp(200).parent().removeClass("open");
                    }
                });
            }
            if (isMiniMenu && $(childMenuNode.parentNode.parentNode).hasClass("nav-list")) {
                return false;
            }
            $(childMenuNode).slideToggle(200).parent().toggleClass("open");
            return;
        },
        getItemByLink: function(link) {
            return this.model.get(/#\S+\/(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function(id) {
            return this.$el.find("[href='#m_" + this.id + "/" + id + "']");
        },
        activateItem: function(item) {
            var link = this.getLinkById(item.id);
            if (this.activeItemNode) {
                this.activeItemNode.removeClass("active").removeClass("open");
            }
            link.parent("li").parents("li").addClass("open");
            this.activeItemNode = link.parents("li").addClass("active");
        },
        /**
         * 通过菜单配置数据，生成菜单DOM节点HTML
         * 出于快速实现考虑，主要使用手工解析方式拼装HTML。未来可考虑实现复杂的模板逻辑。
         * @param {*} menuData 菜单配置数据，可能为数组或菜单项
         * @param [{*}] parent 当前菜单级数
         * @returns {String} 菜单DOM节点HTML
         */
        getMenuNode: function(parentId) {
            var html = "";
            var level = this.model.get(parentId).get("level") + 1, children = this.model.where({
                parentId: parentId
            });
            if (children.length > 0) {
                for (var n = 0, child; child = children[n++]; ) {
                    child.set("level", level);
                    if (this.model.findWhere({
                        parentId: child.id
                    }) || child.get("lazy")) {
                        html += parentTemplate(_.extend({
                            href: this.getHref(child),
                            childItem: renderDeep && level > renderDeep ? "" : this.getMenuNode(child.id)
                        }, child.attributes));
                    } else {
                        html += itemTemplate(_.extend(child.attributes, {
                            href: this.getHref(child)
                        }));
                    }
                }
            }
            return html;
        },
        getHref: function(child) {
            return "#m_" + this.id + "/" + child.id;
        },
        render: function(parentId) {
            (parentId !== "root" ? this.$el.find("a.dropdown-toggle[href='" + this.getHref({
                id: parentId
            }) + "']").parent().find(".submenu") : this.$el).empty().append(this.getMenuNode(parentId));
            //渲染完毕，触发事件
            this.trigger("rendered");
            return this;
        }
    });
    moduleCache.hotForm = BaseMenu.extend({
        id: "hotForm",
        initialize: function() {
            BaseMenu.prototype.initialize.apply(this, arguments);
        }
    });
    moduleCache.hotApp = BaseMenu.extend({
        id: "hotApp",
        initialize: function() {
            BaseMenu.prototype.initialize.apply(this, arguments);
        }
    });
    moduleCache["switch"] = BaseMenu.extend({
        id: "switch"
    });
    moduleCache.app = BaseMenu.extend({
        id: "app",
        source: null,
        isXsp: false,
        initialize: function() {
            var _this = this;
            this.model = new AppMenuItems([], {
                type: this.id
            });
            $("#appMenu").append(this.el);
            this.listenTo(this.model, "reset", function() {
                _this.render("root");
                if ("eval_callback" in window) {
                    this.$el.find("a").click(function(event) {
                        _this.sideMenuClick.call(_this, event);
                    });
                }
            });
            this.listenTo(this.model, "change:activeItem", function(item) {
                _.defer(function() {
                    _this.activateItem(item);
                });
            });
        },
        getItemByLink: function(link) {
            return this.model.get(/#\S+\/a_(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function(id) {
            return this.$el.find("[href='" + this.model.source.from + "/a_" + id + "']");
        },
        getHref: function(child) {
            return this.model.source.from + "/a_" + child.id;
        }
    });
    moduleCache.siteMap = BaseMenu.extend({
        id: "siteMap",
        initialize: function() {
            this.model = new SiteMapSource([], {
                type: this.id
            });
        }
    });
    var getMenu = function(id, options) {
        var menu = menuCache[id] ? menuCache[id] : menuCache[id] = new moduleCache[id](options);
        return menu.model;
    };
    var activeMenu = function(menu) {
        var target = menu || getMenu("hotForm");
        $("#sidebar-shortcuts-large a[href='#" + target.type + "Menu']").tab("show");
        return target;
    };
    /**
     * 在两个同级Dom间实现滑动切换效果，待完成
     * @param from
     * @param to
     */
    var slideSwitch = function(from, to) {
        from.hide();
        to.show();
    };
    var openMenu = function(id) {
        return activeMenu(getMenu(id));
    };
    $(function() {
        $("#menu-toggler").on(click_event, function() {
            $("#sidebar").toggleClass("display");
            $(this).toggleClass("display");
            return false;
        });
        //边栏切换时，获取对应菜单
        $("#sidebar-shortcuts").children().on("show", function(event) {
            $(event.currentTarget).find(".active").removeClass("active");
            $(event.target).addClass("active");
            //初始化边栏菜单
            getMenu($(event.target).attr("href").replace(/Menu|#/g, ""));
        });
        $("#sidebar-collapse").on(click_event, function() {
            isMiniMenu = !$("#sidebar").hasClass("menu-min");
            ace.settings.sidebar_collapsed(isMiniMenu);
        });
    });
    exports.activeMenu = activeMenu;
    exports.slideSwitch = slideSwitch;
    exports.getMenu = getMenu;
    exports.openMenu = openMenu;
});

define("/DigiShell/js/util-debug", [ "backbone/underscore/1.5.2/underscore-debug", "backbone/backbone/1.1.0/backbone-debug", "jquery-debug" ], function(require, exports) {
    var _ = require("backbone/underscore/1.5.2/underscore-debug"), Backbone = require("backbone/backbone/1.1.0/backbone-debug");
    var userInfo = function() {
        var info = {};
        $.ajax({
            url: "/Produce/DigiShell.nsf/personalInfoXAgent.xsp",
            type: "GET",
            async: false,
            cache: false,
            dataType: "json"
        }).success(function(response) {
            info = response;
            if ("sessionStorage" in window) {
                sessionStorage.setItem("userId", info.userId);
                sessionStorage.setItem("userName", info.userName);
            }
        }).error(function(jqXHR) {
            if (jqXHR.status === 403) {
                //由于缓存或其它原因，当前用户未登录却成功执行了代码，跳转回登录页
                location.href = "/names.nsf?login";
            } else {
                throw "获取个人配置数据错误！";
            }
        });
        return info;
    }();
    var Notify = Backbone.View.extend({
        callback: null,
        handle: null,
        className: "alert digishell fade in",
        template: _.template('<a href="#" class="close" data-dismiss="alert">&times;</a><strong><i class="<%=ico%>"></i><%=title%></strong>&nbsp;&nbsp;<%=text%>'),
        initialize: function() {
            this.$el.on("closed", function() {
                if (_.isFunction(this.callback)) {
                    this.callback();
                }
            });
        },
        show: function(param) {
            param = _.extend({
                ico: "icon-exclamation-sign",
                title: "",
                text: "",
                autoClose: true
            }, param);
            var $el = this.$el;
            this.callback = param.callback;
            $el.removeClass(($el.attr("class").match(/alert-\S+/) || []).join(" "));
            if (_.isString(param.className)) {
                $el.addClass(param.className);
            }
            $el.html(this.template(param)).addClass("in").appendTo("body").alert();
            if (this.handle) {
                clearTimeout(this.handle);
            }
            /*jshint -W065 */
            if (param.autoClose) {
                this.handle = setTimeout(function() {
                    $el.alert("close");
                }, _.isNumber(param.autoClose) ? parseInt(param.autoClose) : 3e3);
            }
        }
    }), ConfirmNotify = Notify.extend({
        callback: null,
        template: _.template('<a href="#" class="close" data-dismiss="alert">&times;</a><h4><i class="<%=ico%>"></i><%=title%></h4><p><%=text%></p><p><a class="btn btn-small btn-danger sure" href="#">确定</a>&nbsp;<a class="btn btn-small cancel">取消</a></p>'),
        events: {
            "click a.btn": function(event) {
                if (_.isFunction(this.callback)) {
                    var flag = $(event.currentTarget).hasClass("sure");
                    this.callback(flag);
                    this.$el.alert("close");
                }
                event.preventDefault();
            }
        }
    });
    exports.getObject = function(name, context) {
        var obj = context || window, parts = name.split(".");
        for (var i = 0, p; obj && (p = parts[i]); i++) {
            obj = p in obj ? obj[p] : undefined;
        }
        return obj;
    };
    exports.getUserId = function() {
        var userId = "sessionStorage" in window ? sessionStorage.getItem("userId") : null, reg = /.*?userId=(\S+?)(?:;.*|$)/;
        return function() {
            if (userId) {
                return userId;
            }
            var regInfo = reg.exec(document.cookie);
            return regInfo ? userId = regInfo[1] : "anonymous";
        };
    }();
    exports.getUserName = function() {
        var userName = "sessionStorage" in window ? sessionStorage.getItem("userName") : null, reg = /.*?userName=(\S+?)(?:;.*|$)/;
        return function() {
            if (userName) {
                return userName;
            }
            var regInfo = reg.exec(document.cookie);
            return regInfo ? userName = regInfo[1] : "匿名用户";
        };
    }();
    exports.getUserLanguage = function() {
        var lang = "";
        return function() {
            return lang || function() {
                lang = window.navigator.language || window.navigator.userLanguage;
                lang.replace(/_/, "-").toLowerCase();
                if (lang.length > 3) {
                    lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
                }
                return lang;
            }();
        };
    }();
    exports.localConfig = function() {
        var _cache, _key = "digishell_config_" + exports.getUserId();
        return function(param, value) {
            if (!_cache) {
                _cache = JSON.parse(localStorage.getItem(_key));
                if (!_cache) {
                    _cache = function() {
                        var info = {};
                        if (userInfo["configLastModify"]) {
                            $.ajax({
                                url: "/Produce/DigiShell.nsf/personalInfoXAgent.xsp",
                                type: "GET",
                                async: false,
                                dataType: "json"
                            }).success(function(response) {
                                info = response;
                            }).error(function() {
                                alert("ERROR");
                                throw "获取个人配置数据错误！";
                            });
                        }
                        return info;
                    }();
                }
            }
            if (typeof param === "object") {
                localStorage.setItem(_key, JSON.stringify($.extend(_cache, param)));
                return _cache;
            } else if (typeof param !== "undefined" && typeof value !== "undefined") {
                _cache[param] = value;
                localStorage.setItem(_key, JSON.stringify(_cache));
                return _cache;
            } else {
                return param ? _cache[param] : _cache;
            }
        };
    }();
    exports.saveLocalConfig = function() {
        var data = {}, config = exports.localConfig();
        for (var key in config) {
            data[key] = JSON.stringify(config[key]);
        }
        $.post("Produce/DigiShell.nsf/personalConfigXAgent.xsp", data, function(response) {}, "json");
        return data;
    };
    exports.openLogin = function(info) {
        var url = location.href.substring(location.href.indexOf(location.host) + location.host.length), modal = $(".login");
        modal.find("form input[name='RedirectTo']").val(url);
        if (info) {
            modal.find(".login-info").text(info).show();
        } else {
            modal.find(".login-info").hide();
        }
        modal.modal();
    };
    exports.notify = function() {
        var notify = new Notify();
        return function(param) {
            notify.show(param);
        };
    }();
    exports.confirmNotify = function() {
        var confirm = new ConfirmNotify();
        return function(param) {
            confirm.show(_.extend({
                autoClose: false
            }, param));
        };
    }();
    exports.alert = function() {}();
    exports.confirm = function() {}();
});

define("/DigiShell/js/theme-debug", [ "./util-debug", "backbone/underscore/1.5.2/underscore-debug", "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "./widgets-debug" ], function(require, exports) {
    var util = require("./util-debug"), widgets = require("./widgets-debug");
    var DEFAULT_CONFIG = {
        company: {
            editable: false,
            widgets: widgets.DEFAULT_WIDGET
        },
        personal: {
            widgets: util.localConfig("widgetsConfig") || [ {
                id: "widget_rwxx",
                wId: "RWXX",
                col: 4,
                row: 1,
                size_x: 3,
                size_y: 2
            }, {
                ico: "icon-calendar",
                id: "DF_A_A_09",
                name: "工作日历",
                parentId: "DF_A_A",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 3,
                row: 1
            }, {
                ico: "icon-globe",
                id: "mylanguage",
                name: "个人语言",
                parentId: "DF_A_A",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 2,
                row: 1
            }, {
                ico: "icon-user",
                id: "Menu_PsnInfo",
                name: "通讯录",
                parentId: "DF_A_A",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 2,
                row: 2
            }, {
                ico: "icon-comments-alt",
                id: "MeetingManage",
                name: "会议室管理",
                parentId: "DF_A_C",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 3,
                row: 2
            }, {
                ico: "icon-ticket",
                id: "DF_A_GZXZ",
                name: "工作交办",
                parentId: "DF_A_C",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 1,
                row: 2
            }, {
                ico: "icon-pencil",
                id: "DF_A_C_01",
                name: "办公用品管理",
                parentId: "DF_A_C",
                wId: "shortcut",
                size_x: 1,
                size_y: 1,
                col: 1,
                row: 1
            }, {
                id: "widget_weather",
                wId: "weather",
                size_x: 3,
                size_y: 1,
                parentId: "widget",
                col: 4,
                row: 3
            } ]
        }
    };
    exports.switchConfig = function(configId) {
        var config = DEFAULT_CONFIG[configId];
        if (config.widgets) {
            digishell.widgets.destory();
            if (config.editable !== false) {
                util.localConfig("widgetsConfig", config.widgets);
            }
            digishell.widgets.initWidget(config.widgets);
            digishell.router.navigate("#", true);
        }
    };
});

define("/DigiShell/js/widgets-debug", [ "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./util-debug" ], function(require, exports) {
    var Backbone = require("backbone/backbone/1.1.0/backbone-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), util = require("./util-debug");
    var modelCache = {}, widgetCache = {}, callbackCache = [], initFlag = false;
    function initPanel(layoutConfig, parent, curWidth) {
        var node;
        $.each(layoutConfig, function(key, define) {
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
        _.each(widgetIds || widgetCache, function(item) {
            var widgetId = widgetIds ? item : item.singleton === false ? item.id : item.widgetId;
            query[widgetId] = widgetCache[widgetId].source;
        });
        return query;
    }
    exports.DEFAULT_WIDGET = [ {
        id: "widget_gsxw",
        wId: "gsxw",
        col: 1,
        row: 1,
        size_x: 3,
        size_y: 2
    }, {
        id: "widget_rwxx",
        wId: "RWXX",
        col: 4,
        row: 1,
        size_x: 3,
        size_y: 2
    } ];
    exports.addWidget = function(extendId, model) {
        modelCache[model.widgetId] = extendId ? modelCache[extendId].extend(_.extend(model, {
            events: _.extend({}, modelCache[extendId].prototype.events, model.events)
        })) : Backbone.View.extend(model);
        return this;
    };
    exports.addCallback = function(callback) {
        callbackCache.push(callback);
    };
    exports.startup = function(layoutConfig) {
        initPanel(layoutConfig, $(".widgetContent").empty(), 6);
        return this;
    };
    exports.render = function(widgetIds, verify) {
        var sourceInfo = getSourceInfo(widgetIds);
        $.post("/Produce/DigiShell.nsf/HomeDataServiceXAgent.xsp", {
            define: JSON.stringify(sourceInfo)
        }, function(data) {
            var flag = _.isFunction(verify) ? verify(widgetIds, data) : true;
            if (flag !== false) {
                for (var id in sourceInfo) {
                    widgetCache[id].render(data[id]);
                }
            }
            _.each(callbackCache, function(callback) {
                callback(data);
            });
        }, "json");
        return this;
    };
    exports.byId = function(widgetId) {
        return widgetCache[widgetId];
    };
    exports.loadWidget = function(param, callback) {
        if (_.isArray(param)) {
            _.each(param, function() {});
        } else {}
        require.async("./widgets-add-on", callback);
    };
    exports.getWidget = function(widgetId, param) {
        var Model = modelCache[widgetId];
        if (Model.prototype.singleton === false) {
            var widget = new Model(param);
            return widgetCache[widget.id] = widget;
        } else {
            return widgetCache[widgetId] ? widgetCache[widgetId] : widgetCache[widgetId] = new Model(param);
        }
    };
    exports.destory = function(widgetId) {
        if (widgetId) {} else {
            $(".widgetContent").empty();
            for (var key in widgetCache) {
                widgetCache[key].$el.remove();
                delete widgetCache[key];
            }
            initFlag = false;
        }
    };
    exports.initWidget = function(config, callback) {
        function spliteGrid(gridDefine, type) {
            var isCol = type === "col", attr = isCol ? "size_x" : "size_y", itemType = isCol ? "v" : "h";
            if (gridDefine.length > 1) {
                var splitInfo = [];
                _.chain(gridDefine).groupBy(type).each(function(defines) {
                    var mergeItem, maxItem = _.max(defines, function(define) {
                        return define[attr];
                    });
                    if (mergeItem = _.find(splitInfo, function(item) {
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
                return _.chain(splitInfo).map(function(item) {
                    item.children = spliteGrid(item.children, isCol ? "row" : "col");
                    return item;
                }).sortBy(type).value();
            } else {
                return _.chain(gridDefine).map(function(define) {
                    return _.extend({}, define, {
                        type: "w"
                    });
                }).sortBy(type).value();
            }
        }
        exports.loadWidget("", function() {
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
