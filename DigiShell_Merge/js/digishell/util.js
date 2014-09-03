define(function (require, exports) {

    var _ = require("underscore"),
        Backbone = require("backbone");

    var userInfo = function () {
        var info = {};
        $.ajax({
            url: "/Produce/DigiShell.nsf/personalInfoXAgent.xsp",
            type: "GET",
            async: false,
            cache: false,
            dataType: "json"
        }).success(function (response) {
                info = response;
                if ("sessionStorage" in window) {
                    sessionStorage.setItem("userId", info.userId);
                    sessionStorage.setItem("userName", info.userName);
                }
            }).error(function (jqXHR) {
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
            initialize: function () {
                this.$el.on("closed", function () {
                    if (_.isFunction(this.callback)) {
                        this.callback();
                    }
                });
            },
            show: function (param) {
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
                if (param.autoClose) {
                    this.handle = setTimeout(function () {
                        $el.alert("close");
                    }, _.isNumber(param.autoClose) ? parseInt(param.autoClose) : 3000);
                }
            }
        }),
        ConfirmNotify = Notify.extend({
            callback: null,
            template: _.template('<a href="#" class="close" data-dismiss="alert">&times;</a><h4><i class="<%=ico%>"></i><%=title%></h4><p><%=text%></p><p><a class="btn btn-small btn-danger sure" href="#">确定</a>&nbsp;<a class="btn btn-small cancel">取消</a></p>'),
            events: {
                "click a.btn": function (event) {
                    if (_.isFunction(this.callback)) {
                        var flag = $(event.currentTarget).hasClass("sure");
                        this.callback(flag);
                        this.$el.alert("close");
                    }
                    event.preventDefault();
                }
            }
        });

    exports.getObject = function (name, context) {
        var obj = context || window,
            parts = name.split(".");
        for (var i = 0, p; obj && (p = parts[i]); i++) {
            obj = (p in obj ? obj[p] : undefined);
        }
        return obj;
    };

    exports.getUserId = (function () {
        var userId = "sessionStorage" in window ? sessionStorage.getItem("userId") : null,
            reg = /.*?userId=(\S+?)(?:;.*|$)/;
        return function () {
            if (userId) {
                return userId;
            }
            var regInfo = reg.exec(document.cookie);
            return regInfo ? userId = regInfo[1] : "anonymous";
        };
    })();

    exports.getUserName = (function () {
        var userName = "sessionStorage" in window ? sessionStorage.getItem("userName") : null,
            reg = /.*?userName=(\S+?)(?:;.*|$)/;
        return function () {
            if (userName) {
                return userName;
            }
            var regInfo = reg.exec(document.cookie);
            return regInfo ? userName = regInfo[1] : "匿名用户";
        };
    })();

    exports.localConfig = (function () {
        var _cache, _key = "digishell_config_" + exports.getUserId();

        return function (param, value) {
            if (!_cache) {
                _cache = JSON.parse(localStorage.getItem(_key));
                if (!_cache) {
                    _cache = (function () {
                        var info = {};
                        if (userInfo["configLastModify"]) {
                            $.ajax({
                                url: "/Produce/DigiShell.nsf/personalInfoXAgent.xsp",
                                type: "GET",
                                async: false,
                                dataType: "json"
                            }).success(function (response) {
                                    info = response;
                                }).error(function () {
                                    alert("ERROR");
                                    throw "获取个人配置数据错误！";
                                });
                        }
                        return info;
                    })();
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
    })();

    exports.saveLocalConfig = function () {
        var data = {}, config = exports.localConfig();
        for (var key in config) {
            data[key] = JSON.stringify(config[key]);
        }
        $.post("Produce/DigiShell.nsf/personalConfigXAgent.xsp", data, function (response) {

        }, "json");
        return data;
    };

    exports.notify = (function () {
        var notify = new Notify();
        return function (param) {
            notify.show(param);
        };
    })();

    exports.confirmNotify = (function () {
        var confirm = new ConfirmNotify();
        return function (param) {
            confirm.show(_.extend({
                autoClose: false
            }, param));
        };
    })();

    exports.alert = (function () {

    })();

    exports.confirm = (function () {

    })();
});