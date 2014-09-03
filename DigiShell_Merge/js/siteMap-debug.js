define("/DigiShell/js/siteMap-debug", [ "backbone/backbone/1.1.0/backbone-debug", "jquery-debug", "backbone/underscore/1.5.2/underscore-debug", "./sidebar-debug", "./util-debug" ], function(require, exports) {
    var Backbone = require("backbone/backbone/1.1.0/backbone-debug"), _ = require("backbone/underscore/1.5.2/underscore-debug"), sidebar = require("./sidebar-debug"), cache = {};
    function getMapItems(model, filter) {
        var items = [];
        model.each(function(item) {
            var children = model.where({
                parentId: item.get("id")
            });
            if (children.length > 0) {
                children = _.filter(children, function(item) {
                    return !model.findWhere({
                        parentId: item.id
                    });
                });
                if (typeof filter === "function") {
                    children = _.filter(children, filter);
                }
                if (children.length > 0) {
                    items.push(_.extend({}, item.attributes, {
                        children: children
                    }));
                }
            }
        });
        return items;
    }
    var SiteMap = Backbone.View.extend({
        mapItems: null,
        initialize: function(options) {
            var _this = this;
            this.$el.html('<div class="span4"></div><div class="span4"></div><div class="span4"></div>');
            sidebar.getMenu("siteMap").getItem("root", function() {
                _this.model = this.clone();
                _this.model.type = this.type;
                _this.model.forForm = options.mode === "form";
                if (options.filter) {
                    _this.model.reset(_this.model.filter(options.filter));
                }
                _this.render(options);
            });
        },
        events: {
            "click .widget-toolbar  > [data-action]": "clickTools",
            "click .widget-body li": "clickItem"
        },
        clickTools: function(event) {
            event.preventDefault();
            var target = $(event.currentTarget);
            var action = target.data("action");
            var widget = target.closest(".widget-box");
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
            }
            return true;
        },
        clickItem: function(event) {
            var target = $(event.currentTarget), childIndex = target.index(), itemIndex = target.closest(".widget-box").data("index"), item = this.mapItems[itemIndex].children[childIndex];
            if (!this.selectable) {
                this.model.openItem(item, event);
                window.scrollTo(0, 0);
            } else {
                if (event.target.tagName === "INPUT") {
                    item.set("selected", target.find("input:checkbox").prop("checked"));
                    this.$el.trigger("select", [ item, this.model.where({
                        selected: true
                    }) ]);
                }
            }
        },
        itemTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><a class="inline" href="#m_siteMap/<%=info.id%>"><i class="<%=info.ico%>"></i><%=mode!=="form"?info.name:info.formName%></a></li><%});%></ul></div></div><div class="space-4"></div>'),
        itemSelectTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><label class="inline"><input type="checkbox" class="ace" <%=info.selected?"checked":""%>/><span class="lbl"><%=mode!=="form"?info.name:info.formName%></span></label></li><%});%></ul></div></div><div class="space-4"></div>'),
        render: function(options) {
            var placeTarget = this.$el.find("> div"), _this = this;
            if (options.selected) {
                options.selected.each(function(item) {
                    var storeItem = options.model.get(item.id);
                    if (storeItem) {
                        storeItem.set("selected", true);
                    }
                });
            }
            _this.mapItems = getMapItems(_this.model);
            _.each(this.mapItems, function(item, index) {
                $(placeTarget.get(index % 3)).append((options.selectable ? _this.itemSelectTemplate : _this.itemTemplate)(_.extend({
                    menuId: options.id,
                    mode: options.mode,
                    index: index,
                    ico: ""
                }, item)));
            });
            return this;
        }
    });
    exports.getSiteMap = function(id, options) {
        return cache[id] ? cache[id] : function() {
            options = options || {};
            if (id.indexOf("Form") !== -1) {
                _.defaults(options, {
                    mode: "form",
                    filter: function(item) {
                        return item.get("form") && item.get("formName") || item.get("view") === "";
                    }
                });
            }
            cache[id] = new SiteMap(options);
            return cache[id];
        }();
    };
});