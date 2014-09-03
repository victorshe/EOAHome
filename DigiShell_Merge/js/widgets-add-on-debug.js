define("/DigiShell/js/widgets-add-on-debug", [ "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./widgets-debug", "backbone/backbone/1.1.0/backbone-debug", "./util-debug", "./sidebar-debug" ], function(require) {
    var $ = require("jquery-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), widgets = require("./widgets-debug"), util = require("./util-debug"), sidebar = require("./sidebar-debug");
    widgets.addWidget(null, {
        widgetId: "BASE",
        className: "widget-box",
        initialize: function(options) {
            this.id = options.id || this.widgetId;
            this.$el.attr("id", this.id).html(this.content(this));
        },
        refresh: function(callback) {
            widgets.render([ this.widgetId ], callback);
        },
        beforeRender: function(data) {},
        afterRender: function() {},
        render: function(data) {
            this.beforeRender(data);
            this.$el.find(".widget-body").html(this.template(_.extend(this, {
                model: data
            })));
            this.afterRender();
        },
        events: {
            "click .widget-toolbar  > [data-action]": "clickTools"
        },
        open: function() {
            if (typeof this.source === "object") {
                var param = {
                    dbPath: this.source.path,
                    view: this.source.view,
                    category: this.source.key ? this.source.key[0] : "",
                    showHeader: false
                };
                require.async("./viewFrame", function(frame) {
                    frame.openView(param);
                    $(".page-content >.active").removeClass("active");
                    $(".page-content .view").addClass("active");
                });
            }
        },
        clickTools: function(event) {
            event.preventDefault();
            var target = $(event.currentTarget);
            var action = target.data("action");
            var widget = target.closest(".widget-box");
            if (widget.hasClass("ui-sortable-helper")) {
                return;
            }
            if (action === "collapse") {
                var widgetBody = widget.find(".widget-body");
                var collapseIcon = target.find("[class*=icon-]").eq(0);
                var iconState = collapseIcon.attr("class").match(/icon\-(.*)\-(up|down)/);
                var downIcon = "icon-" + iconState[1] + "-down";
                var upIcon = "icon-" + iconState[1] + "-up";
                var widgetInner = widgetBody.find(".widget-body-inner");
                if (widgetInner.length === 0) {
                    widgetBody = widgetBody.wrapInner('<div class="widget-body-inner"></div>').find(":first-child").eq(0);
                } else {
                    widgetBody = widgetInner.eq(0);
                }
                var downTime = 300;
                var upTime = 200;
                if (widget.hasClass("collapsed")) {
                    if (collapseIcon) {
                        collapseIcon.addClass(upIcon).removeClass(downIcon);
                    }
                    widget.removeClass("collapsed");
                    widgetBody.slideUp(0, function() {
                        widgetBody.slideDown(downTime);
                    });
                } else {
                    if (collapseIcon) {
                        collapseIcon.addClass(downIcon).removeClass(upIcon);
                    }
                    widgetBody.slideUp(upTime, function() {
                        widget.addClass("collapsed");
                    });
                }
            } else if (action === "reload") {
                target.blur();
                var loadState = false;
                if (widget.css("position") === "static") {
                    loadState = true;
                    widget.addClass("position-relative");
                }
                widget.append('<div class="widget-box-layer"><i class="icon-spinner icon-spin icon-2x white"></i></div>');
                this.refresh(function() {
                    widget.find(".widget-box-layer").remove();
                    if (loadState) {
                        widget.removeClass("position-relative");
                    }
                });
            }
            return true;
        },
        ico: "",
        title: "",
        content: _.template('<div class="widget-header"><h5 class="widget-title"><i><%=ico%></i><%=title%></h5><div class="widget-toolbar"><a href="#" data-action="reload"><i class="icon-refresh"></i></a><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"></div>')
    });
    widgets.addWidget("BASE", {
        widgetId: "TABS_BASE",
        events: {
            "click .widget-toolbar.no-border a": function(event) {
                event.preventDefault();
                digishell.router.navigate($(event.target).closest("a").attr("href"), true);
                window.scrollTo(0, 0);
            },
            "mouseover .widget-toolbar.no-border a": _(function(event) {
                $(event.currentTarget).tab("show");
            }).debounce(200)
        },
        refresh: function(callback) {
            var _this = this;
            widgets.render([ this.widgetId ], function() {
                _this.$el.find(".nav.nav-tabs .active").removeClass("active").find("a").tab("show");
                if (_.isFunction(callback)) {
                    callback.apply(_this, arguments);
                }
            });
        },
        open: function(id) {
            if (typeof this.source === "object") {
                var param = {
                    dbPath: this.source.children[id].path,
                    view: this.source.children[id].view,
                    category: this.source.children[id]["class"],
                    showHeader: false
                };
                require.async("./viewFrame", function(frame) {
                    frame.openView(param);
                });
            }
        },
        content: _.template('<div class="widget-header"><h5 class="widget-tabs-title hidden"><i class="<%=ico%>"></i><%=title%></h5><div class="widget-toolbar"><a href="#" data-action="reload"><i class="icon-refresh"></i></a><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div><div class="widget-toolbar no-border" style="float:left;padding-left: 5px;"><ul class="nav nav-tabs"><% _.each(tabs,function(tab,key){ %><li class="<%=(key===0?\'active\':\'\') %>"><a data-toggle="tab" href="#widget_<%=widgetId+\'_\'+tab.id%>"><%=tab.name%><span class="badge"></span></a></li><% }); %></ul></div></div><div class="widget-body" style="height:258px"></div>')
    });
    widgets.addWidget("TABS_BASE", {
        widgetId: "RWXX",
        title: "任务消息",
        tabs: [ {
            id: "todo",
            name: "待办<span class='hidden-1024'>任务</span>"
        }, {
            id: "msg",
            name: "<span class='hidden-1024'>我的</span>消息"
        }, {
            id: "app",
            name: "我的申请"
        } ],
        template: _.template($("#TEMPLATE_WIDGET_RWXX_BODY").html()),
        events: {
            "click .tab-pane a": "clickControl"
        },
        clickControl: function(event) {
            var _this = this, panel = $(event.currentTarget).closest(".tab-pane"), refreshPanel = function() {
                var handle = null;
                return function() {
                    if (handle) {
                        clearTimeout(handle);
                    }
                    handle = setTimeout(function() {
                        _this.refresh();
                    }, 2e3);
                };
            }();
            if (panel.attr("id").indexOf("msg") !== -1) {
                refreshPanel();
            }
        },
        open: function(id) {
            sidebar.getMenu("siteMap").getItem("PERSONAL_MESSAGE_DATABASE", function(item) {
                switch (id) {
                  case "todo":
                    item.set("view", "taskByDateDownView");
                    break;

                  case "msg":
                    item.set("view", "msgByDateDownView");
                    break;

                  case "app":
                    item.set("view", "FlowUndoView");
                    break;
                }
                this.openItem(item);
            });
        },
        render: function() {
            var _this = this;
            $.post("/Produce/GeneralMessage.nsf/GetAllMsgInfoAgent?openagent", "yes^~^app|7|taskByDateDownUnDoneView|taskByDateDownDoneView^~^msg|7|msgByDateDownUnRdView|msgByDateDownRdView^~^flowinfo|7|FlowUndoView|FlowDoneView", function(xml) {
                var data = {}, info = $(xml.firstChild), parseInfo = function(itemName) {
                    var result = {
                        items: []
                    };
                    var node = info.find(itemName);
                    result.count = node.attr("num1");
                    node.find("info").each(function() {
                        var info = $(this), item = {};
                        item.title = info.find("ititle").text();
                        item.date = info.find("idate").text();
                        item.url = info.find("iurl").text();
                        result.items.push(item);
                    });
                    return result;
                };
                data.todo = parseInfo("app");
                data.msg = parseInfo("msg");
                data.app = parseInfo("flowinfo");
                _this.beforeRender(data);
                var activedTabIndex = _this.$el.find(".tab-content .active").index();
                _this.$el.find(".widget-body").html(_this.template(_.extend(_this, {
                    model: data
                })));
                if (activedTabIndex !== -1) {
                    _this.$el.find(".nav.nav-tabs .active").removeClass("active").find("a").tab("show");
                }
                _this.afterRender();
            }, "xml");
        },
        afterRender: function() {
            var color = [ "badge-yellow", "badge-info", "badge-success" ], model = this.model;
            this.$el.find(".nav.nav-tabs li>a").each(function(index) {
                var link = $(this), span = link.find("span.badge"), href = link.attr("href"), id = href.substring(href.lastIndexOf("_") + 1);
                span.addClass(color[index]).text(model[id].count);
            });
        }
    });
    widgets.addWidget("TABS_BASE", {
        widgetId: "xzgg",
        title: "公告",
        tabs: [ {
            id: "xzgg",
            name: "行政公告"
        }, {
            id: "tz",
            name: "通知"
        } ],
        source: {
            type: "multiple",
            children: {
                xzgg: {
                    type: "base",
                    path: "Application/DigiFlowInfoPublish.nsf",
                    view: "InfoByDateView_2",
                    field: [ "STPUBTIME", "StTitle", "@UNID" ],
                    "class": "Dir03$",
                    top: 3
                },
                tz: {
                    type: "base",
                    path: "Application/DigiFlowInfoPublish.nsf",
                    view: "InfoByDateView_2",
                    field: [ "STPUBTIME", "StTitle", "@UNID" ],
                    "class": "Dir02$",
                    top: 3
                }
            }
        },
        beforeRender: function() {
            this.$el.find(".widget-body").css("height", "88px");
        },
        template: _.template($("#TEMPLATE_WIDGET_XZGG_BODY").html())
    });
    widgets.addWidget("TABS_BASE", {
        widgetId: "hydt",
        title: "制度",
        tabs: [ {
            id: "zdlc",
            name: "制度与流程"
        }, {
            id: "cyzl",
            name: "常用资料"
        } ],
        source: {
            type: "multiple",
            children: {
                zdlc: {
                    type: "base",
                    path: "Application/DigiFlowInfoPublish.nsf",
                    view: "InfoByDateView_2",
                    field: [ "STPUBTIME", "StTitle", "StMainDocUnid" ],
                    "class": "Dir01$",
                    top: 3
                },
                cyzl: {
                    type: "base",
                    path: "Application/DigiFlowInfoPublish.nsf",
                    view: "InfoByDateView_2",
                    field: [ "STPUBTIME", "StTitle", "StMainDocUnid" ],
                    "class": "Dir04$",
                    top: 3
                }
            }
        },
        beforeRender: function() {
            this.$el.find(".widget-body").css("height", "88px");
        },
        template: _.template($("#TEMPLATE_WIDGET_XZGG_BODY").html())
    });
    widgets.addWidget("TABS_BASE", {
        widgetId: "bbs",
        title: "企业论坛",
        tabs: [ {
            id: "communicate",
            name: "技术交流"
        }, {
            id: "new",
            name: "最新贴"
        }, {
            id: "distillate",
            name: "精华贴"
        } ],
        source: {
            type: "multiple",
            children: {
                "new": {
                    type: "base",
                    path: "bbs/DigiFlowBBSNew.nsf",
                    view: "TodayView",
                    field: [ "StPostTime", "StTitle", "StTopFlag", "StBestFlag", "@UNID" ],
                    top: 3
                },
                distillate: {
                    type: "base",
                    path: "bbs/DigiFlowBBSNew.nsf",
                    view: "TopTopicView",
                    field: [ "StPostTime", "StTitle", "StTopFlag", "StBestFlag", "@UNID" ],
                    top: 3
                },
                communicate: {
                    type: "base_with_count",
                    path: "bbs/DigiFlowBBSNew.nsf",
                    view: "TopTopicView",
                    field: [ "StPostTime", "StTitle", "StTopFlag", "StBestFlag", "@UNID" ],
                    top: 3
                }
            }
        },
        beforeRender: function() {
            this.$el.find(".widget-body").css("height", "88px");
        },
        template: _.template($("#TEMPLATE_WIDGET_BBS_BODY").html())
    });
    widgets.addWidget("BASE", {
        widgetId: "cppx",
        title: "产品培训",
        source: {
            type: "base",
            path: "Application/DigiFlowInfoPublish.nsf",
            view: "InfoByDateView_2",
            field: [ "STPUBTIME", "StTitle", "@UNID" ],
            "class": "Dir01$",
            top: 3
        },
        beforeRender: function() {
            this.$el.find(".widget-body").css("height", "88px");
        },
        template: _.template($("#TEMPLATE_WIDGET_XXFB_BODY").html())
    });
    widgets.addWidget("BASE", {
        widgetId: "gsxw",
        title: "公司新闻",
        source: {
            type: "base",
            path: "Application/DigiFlowInfoPublish.nsf",
            view: "InfoPicView",
            field: [ "StTitle", "ThisFlowAtDocUID", "StPicAttachment" ],
            top: 5
        },
        template: _.template($("#TEMPLATE_WIDGET_TPXW_BODY").html()),
        beforeRender: function(data) {
            this.$el.find(".widget-body").css("height", "258px");
        },
        afterRender: function() {
            $("#" + this.id + "_slide").carousel();
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "weather",
        title: "天气",
        render: function() {
            this.$el.find(".widget-body").css("height", "121px").html('<div class="widget-main"><iframe src="http://www.thinkpage.cn/weather/weather.aspx?uid=&cid=101010100&l=&p=CMA&a=1&u=C&s=3&m=0&x=1&d=3&fc=&bgc=&bc=&ti=1&in=1&li=2&ct=iframe" frameborder="0" scrolling="no" width="475" height="110" allowTransparency="true"></iframe></div>');
            return false;
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "mail",
        title: "邮件",
        template: _.template($("#TEMPLATE_WIDGET_MAIL_BODY").html()),
        events: {
            "click .widget-header": "open",
            "click .carousel-inner": "open"
        },
        open: function() {
            window.open("/mail/" + util.getUserId() + ".nsf", "_blank");
            return false;
        },
        render: function() {
            var _this = this;
            $.get("http://dev01.bj-fanuc.com.cn/mail/" + util.getUserId() + ".nsf/iNotes/Proxy/?OpenDocument", {
                Form: "s_ReadViewEntries",
                outputformat: "json",
                PresetFields: "FolderName;($Inbox),hc;$98,UnreadCountInfo;1",
                resortdescendingpn: "$70"
            }, function(xml) {
                var data = eval("(" + xml.documentElement.firstChild.data + ")");
                _this.$el.find(".widget-body").css("height", "121px").html(_this.template(_.extend(_this, {
                    model: data
                })));
                _this.$el.find(".carousel").carousel({
                    interval: 1e4
                });
                _this.$el.find(".badge").text(data["@toplevelentries"]);
            }, "xml");
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "calendar",
        title: "个人日历",
        render: function() {
            this.$el.find(".widget-body").html("<div class='widget-main'><div class='space-20'></div><div class='calendar'></div></div>");
            var calendarNode = this.$el.find(".calendar");
            seajs.use([ "jquery/jquery-ui/jquery-ui/1.10.3/jquery-ui.custom", "jquery/bootstrap/bootbox/3.3.0/bootbox", "jquery/fullcalendar/1.6.4/fullcalendar" ], function() {
                var date = new Date();
                var d = date.getDate();
                var m = date.getMonth();
                var y = date.getFullYear();
                var calendar = calendarNode.fullCalendar({
                    buttonText: {
                        prev: '<i class="icon-chevron-left"></i>',
                        next: '<i class="icon-chevron-right"></i>',
                        today: "今天",
                        month: "按月",
                        week: "按周",
                        day: "按日"
                    },
                    header: {
                        left: "prev,next today",
                        center: "title",
                        right: "month,agendaWeek,agendaDay"
                    },
                    monthNames: [ "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月" ],
                    monthNamesShort: [ "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二" ],
                    dayNames: [ "周日", "周一", "周二", "周三", "周四", "周五", "周六" ],
                    dayNamesShort: [ "周日", "周一", "周二", "周三", "周四", "周五", "周六" ],
                    events: [ {
                        title: "整日事件",
                        start: new Date(y, m, 1),
                        className: "label-important"
                    }, {
                        title: "长期事件",
                        start: new Date(y, m, d - 5),
                        end: new Date(y, m, d - 2),
                        className: "label-success"
                    }, {
                        title: "某事件",
                        start: new Date(y, m, d - 3, 16, 0),
                        className: "label-info",
                        allDay: false
                    } ],
                    editable: true,
                    droppable: true,
                    selectable: true,
                    selectHelper: true,
                    select: function(start, end, allDay) {
                        bootbox.prompt("新建事件:", function(title) {
                            if (title !== null) {
                                calendar.fullCalendar("renderEvent", {
                                    title: title,
                                    start: start,
                                    end: end,
                                    allDay: allDay
                                }, true);
                            }
                        });
                        calendar.fullCalendar("unselect");
                    },
                    eventClick: function(calEvent, jsEvent, view) {
                        var form = $("<form class='form-inline'><label>修改事件 &nbsp;</label></form>");
                        form.append("<input class='middle' autocomplete=off type=text value='" + calEvent.title + "' /> ");
                        form.append("<button type='submit' class='btn btn-sm btn-success'><i class='icon-ok'></i> 保存</button>");
                        var div = bootbox.dialog(form, [ {
                            label: "<i class='icon-trash'></i> 删除事件",
                            className: "btn-sm btn-danger",
                            callback: function() {
                                calendar.fullCalendar("removeEvents", function(ev) {
                                    return ev._id === calEvent._id;
                                });
                            }
                        }, {
                            label: "<i class='icon-remove'></i> 取消",
                            className: "btn-sm"
                        } ]);
                        form.on("submit", function() {
                            calEvent.title = form.find("input[type=text]").val();
                            calendar.fullCalendar("updateEvent", calEvent);
                            div.modal("hide");
                            return false;
                        });
                    }
                });
            });
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "flot-pie",
        title: "比率",
        render: function() {
            this.$el.find(".widget-body").html("<div class='widget-main'><div class='pie'></div></div>");
            var pieNode = this.$el.find(".pie");
            seajs.use([ "jquery/flot/0.8.1/jquery.flot-debug", "jquery/flot/0.8.1/jquery-flot.resize-debug", "jquery/flot/0.8.1/jquery.flot.pie-debug" ], function() {
                var placeholder = pieNode.css({
                    width: "90%",
                    "min-height": "150px"
                });
                var data = [ {
                    label: "social networks",
                    data: 38.7,
                    color: "#68BC31"
                }, {
                    label: "search engines",
                    data: 24.5,
                    color: "#2091CF"
                }, {
                    label: "ad campaigns",
                    data: 8.2,
                    color: "#AF4E96"
                }, {
                    label: "direct traffic",
                    data: 18.6,
                    color: "#DA5430"
                }, {
                    label: "other",
                    data: 10,
                    color: "#FEE074"
                } ];
                function drawPieChart(placeholder, data, position) {
                    $.plot(placeholder, data, {
                        series: {
                            pie: {
                                show: true,
                                tilt: .8,
                                highlight: {
                                    opacity: .25
                                },
                                stroke: {
                                    color: "#fff",
                                    width: 2
                                },
                                startAngle: 2
                            }
                        },
                        legend: {
                            show: true,
                            position: position || "ne",
                            labelBoxBorderColor: null,
                            margin: [ -30, 15 ]
                        },
                        grid: {
                            hoverable: true,
                            clickable: true
                        }
                    });
                }
                drawPieChart(placeholder, data);
                /**
                 we saved the drawing function and the data to redraw with different position later when switching to RTL mode dynamically
                 so that's not needed actually.
                 */
                placeholder.data("chart", data);
                placeholder.data("draw", drawPieChart);
                var $tooltip = $("<div class='tooltip top in'><div class='tooltip-inner'></div></div>").hide().appendTo("body");
                var previousPoint = null;
                placeholder.on("plothover", function(event, pos, item) {
                    if (item) {
                        if (previousPoint !== item.seriesIndex) {
                            previousPoint = item.seriesIndex;
                            var tip = item.series["label"] + " : " + item.series["percent"] + "%";
                            $tooltip.show().children(0).text(tip);
                        }
                        $tooltip.css({
                            top: pos.pageY + 10,
                            left: pos.pageX + 10
                        });
                    } else {
                        $tooltip.hide();
                        previousPoint = null;
                    }
                });
            });
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "flot-trend",
        title: "趋势",
        render: function() {
            this.$el.find(".widget-body").html("<div class='widget-main'><div class='trend'></div></div>");
            var trendNode = this.$el.find(".trend");
            seajs.use([ "jquery/flot/0.8.1/jquery.flot-debug", "jquery/flot/0.8.1/jquery-flot.resize-debug" ], function() {
                var d1 = [], i;
                for (i = 0; i < Math.PI * 2; i += .5) {
                    d1.push([ i, Math.sin(i) ]);
                }
                var d2 = [];
                for (i = 0; i < Math.PI * 2; i += .5) {
                    d2.push([ i, Math.cos(i) ]);
                }
                var d3 = [];
                for (i = 0; i < Math.PI * 2; i += .2) {
                    d3.push([ i, Math.tan(i) ]);
                }
                var sales_charts = trendNode.css({
                    width: "100%",
                    height: "220px"
                });
                $.plot(sales_charts, [ {
                    label: "Domains",
                    data: d1
                }, {
                    label: "Hosting",
                    data: d2
                }, {
                    label: "Services",
                    data: d3
                } ], {
                    hoverable: true,
                    shadowSize: 0,
                    series: {
                        lines: {
                            show: true
                        },
                        points: {
                            show: true
                        }
                    },
                    xaxis: {
                        tickLength: 0
                    },
                    yaxis: {
                        ticks: 10,
                        min: -2,
                        max: 2,
                        tickDecimals: 3
                    },
                    grid: {
                        backgroundColor: {
                            colors: [ "#fff", "#fff" ]
                        },
                        borderWidth: 1,
                        borderColor: "#555"
                    }
                });
            });
        }
    });
    widgets.addWidget("BASE", {
        widgetId: "knowledge",
        title: "最新知识Top10",
        source: {
            type: "base",
            path: "km/DigiFlowKMDocInfo.nsf",
            view: "DocInfoByScoreView",
            field: [ "StTitle", "StCreaterEN" ],
            top: 10
        },
        thead: [ {
            name: "标题"
        }, {
            name: "创建人"
        } ],
        template: _.template($("#TEMPLATE_WIDGET_KNOWLEDGE_BODY").html())
    });
    widgets.addWidget("BASE", {
        widgetId: "task_model",
        title: "任务管理",
        source: {
            type: "base",
            path: "TMS/TaskIndex.nsf",
            view: "VDocIndexByZxrDoingView",
            field: [ "StTaskName", "StTaskStart", "StTaskEnd", "StXdrCN" ],
            top: 10
        },
        thead: [ {
            name: "任务名称"
        }, {
            name: "计划开始时间"
        }, {
            name: "计划结束时间"
        }, {
            name: "下达人"
        } ],
        template: _.template($("#TEMPLATE_WIDGET_TASK_BODY").html())
    });
    widgets.addWidget(null, {
        widgetId: "shortcut",
        singleton: false,
        className: "widget-shortcut",
        initialize: function(options) {
            this.id = options.id || this.widgetId + $(".widget-shortcut").size();
            this.$el.attr("id", this.id).html(this.content(options));
        },
        events: {
            "click a": function(event) {
                //TODO 待实现
                //sidebar.getMenu("siteMap").openItem({}, event);
                event.preventDefault();
            }
        },
        content: _.template('<a href="#m_hotApp/<%=id%>" class="btn btn-app btn-primary no-radius"><i class="<%=ico%> bigger-230"></i><%=name%><span class="badge badge-warning badge-left"></span></a>')
    });
    widgets.addWidget(null, {
        widgetId: "ace-nav-msg",
        tagName: "li",
        className: "light-blue2",
        ico: "icon-bullhorn icon-animated-vertical",
        countClass: "badge-info",
        source: "$refer:RWXX.msg",
        content: _.template('<a data-toggle="dropdown" class="dropdown-toggle" href="#"><i class="<%=ico%>"></i><span class="badge <%=countClass%>"></span></a>'),
        template: _.template($("#TEMPLATE_ACE_NAV_MSG_BODY").html()),
        events: {
            "click a.dropdown-toggle": function(event) {
                var animationIcon = $(event.target).find("i[class*='icon-animated-']").eq(0);
                if (animationIcon.size() > 0) {
                    var classInfo = animationIcon.attr("class").match(/icon\-animated\-([\d\w]+)/);
                    animationIcon.removeClass(classInfo[0]);
                    $(event.target).off("click");
                }
            },
            "click .dropdown-navbar a": function(event) {
                var href = $(event.currentTarget).attr("href"), link = href.substring(href.lastIndexOf("#") + 1);
                if (link === "more") {} else {
                    window.open("/DFMessage/dfmsg_" + util.getUserId() + ".nsf/0/" + link + "?opendocument&login", "_blank");
                }
            }
        },
        initialize: function() {
            $(".nav.ace-nav").prepend(this.$el.html(this.content(this)));
            return false;
        },
        render: function(data) {
            this.$el.append(this.template(data));
            this.$el.find("span.badge").text(data.count);
            if (data.count === 0) {
                this.$el.find("i").removeClass("icon-animated-vertical");
                this.$el.find("a.dropdown-toggle").off("click");
            }
        }
    });
    widgets.addWidget("ace-nav-msg", {
        widgetId: "ace-nav-todo",
        className: "dark-orange",
        ico: "icon-bell-alt icon-animated-bell",
        countClass: "badge-yellow",
        template: _.template($("#TEMPLATE_ACE_NAV_TODO_BODY").html()),
        render: function(data) {
            this.$el.append(this.template(data));
            this.$el.find("span.badge").text(data.count);
            if (data.count === 0) {
                this.$el.find("i").removeClass("icon-animated-bell");
                this.$el.find("a.dropdown-toggle").off("click");
            }
        }
    });
});