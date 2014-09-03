define(function (require) {

    var Backbone = require("backbone"),
        _ = require("underscore"),
        viewFrame = require("./viewFrame");
    require("jquery.dataTables");
    require("jquery.datetimepicker");

    var configCache = {};

    function getQueryConfig(dbPath, id, callback) {
        var dbCache = configCache[dbPath] ? configCache[dbPath] : configCache[dbPath] = {},
            configItem = dbCache[id] ? dbCache[id] : dbCache[id] = {};
        if (configItem.config) {
            callback(configItem.config);
            return true;
        }
        $.get("/Produce/DigiShell.nsf/getDatabaseQueryConfig.xsp", {
            id: id
        },function (data) {
            configItem.config = data;
            callback(data);
        }, "json").error(function () {
                //TODO 异常信息待完善
                alert("连接已断开，请重新登录");
            });
    }

    function getTableIndexColHtml(data) {
        return '<label><input type="checkbox" class="ace"/><span class="lbl">' + data + '</span></label>';
    }

    //IE8下，默认方法无法正常转换“2013-10-15”此类的信息，在此进行优化
    $.extend($.fn.dataTableExt.oSort, {
        "date-pre": function (a) {
            var x = Date.parse(a);
            if (isNaN(x) || x === "") {
                x = Date.parse(a.replace(/-/g, "/"));
                if (isNaN(x) || x === "") {
                    x = Date.parse("01/01/1970 00:00:00");
                }
            }
            return x;
        }
    });

    //Form https://datatables.net/plug-ins/sorting, Chinese(sort)
    $.extend($.fn.dataTableExt.oSort, {
        "chinese-string-asc": function (s1, s2) {
            return s1.localeCompare(s2);
        },
        "chinese-string-desc": function (s1, s2) {
            return s2.localeCompare(s1);
        }
    });

    //From http://datatables.net/plug-ins/api, funReloadAjax
    $.fn.dataTableExt.oApi.fnReloadAjax = function (oSettings, sNewSource, fnCallback, bStandingRedraw) {
        if (sNewSource !== undefined && sNewSource !== null) {
            oSettings.sAjaxSource = sNewSource;
        }
        // Server-side processing should just call fnDraw
        if (oSettings.oFeatures.bServerSide) {
            this.fnDraw();
            return;
        }

        this.oApi._fnProcessingDisplay(oSettings, true);
        var that = this;
        var iStart = oSettings._iDisplayStart;
        var aData = [];

        this.oApi._fnServerParams(oSettings, aData);

        oSettings.fnServerData.call(oSettings.oInstance, oSettings.sAjaxSource, aData, function (json) {
            /* Clear the old information from the table */
            that.oApi._fnClearTable(oSettings);
            /* Got the data - add it to the table */
            var aData = (oSettings.sAjaxDataProp !== "") ?
                that.oApi._fnGetObjectDataFn(oSettings.sAjaxDataProp)(json) : json;

            for (var i = 0; i < aData.length; i++) {
                that.oApi._fnAddData(oSettings, aData[i]);
            }

            oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

            that.fnDraw();

            if (bStandingRedraw === true) {
                oSettings._iDisplayStart = iStart;
                that.oApi._fnCalculateEnd(oSettings);
                that.fnDraw(false);
            }

            that.oApi._fnProcessingDisplay(oSettings, false);
            /* Callback user function - for event handlers etc */
            if (typeof fnCallback == 'function' && fnCallback !== null) {
                fnCallback(oSettings);
            }
        }, oSettings);
    };

    var Query = Backbone.View.extend({
        className: "databaseQuery",
        toolbarTemplate: _.template('<div class="span11"><% _.each(queryFields,function(field){ var id = field.id; %><label><span class="title" title="<%=field.des%>"><%=field.des%>:</span><% if(field.type==="text"){ %><input type="text" data-bind="<%=id%>" class="input-medium" /><% }else if(field.type==="select"){ %><select data-bind="<%=id%>" class="input-medium"><% _.each(field.opt.split(";"),function(options){ var info=options.split("|");%><option value="<%=info[1]%>"><%=info[0]%></option><% }); %></select><% }else if(field.type==="date"){%><div class="input-append date" data-date-format="yyyy-mm-dd"><input class="input-medium" data-bind="<%=id%>" size="16" type="text" value=""><span class="add-on"><i class="icon-calendar"></i></span></div><% }else if(field.type==="chg"){ %><div class="input-append"><input type="text" data-bind="<%=id%>" class="input-medium" readonly /><span class="add-on"><i class="icon-plus"></i></span></div><% } %></label><%});%></div><div class="span1"><button class="btn btn-small btn-info" type="submit">查询</button></div>'),
        table: null,
        dataTable: null,
        loadedId: null,
        initialize: function () {
            var _this = this;
            _this.$el.html('<div class="query-toolbar"><form class="form-inline row-fluid"></form></div><div class="hr hr-18 hr-double dotted"></div><div class="query-result"><div class="table-responsive span12"></div></div>').appendTo($("#viewFrame"));
            _this.$el.find("form").on("submit", function (event) {
                var param = {};
                $(event.target).find("[data-bind]").each(function () {
                    var input = $(this),
                        bind = input.data("bind");
                    param[bind] = input.val();
                });
                _this.executeQuery(_this.loadedId, param);
                event.preventDefault();
            });
        },
        loadQuery: function (dbPath, id) {
            var _this = this;
            _this.loadedId = id;
            function getLanguage() {
                var lang = window.navigator.language || window.navigator.userLanguage;
                lang.replace(/_/, '-').toLowerCase();
                if (lang.length > 3) {
                    lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
                }
                return lang;
            }

            getQueryConfig(dbPath, id, function (queryConfig) {
                //控制视图框架操作按钮
                viewFrame.set({
                    allowDelete: queryConfig.allowDelete
                });
                _this.$el.find("form").empty().html(_this.toolbarTemplate(queryConfig));
                _this.$el.find("form .date").datetimepicker({
                    minView: "2",
                    todayBtn: true,
                    autoclose: true,
                    language: getLanguage(),
                    pickerPosition: "bottom-left"
                });
                if (_this.dataTable) {
                    _this.dataTable.fnDestroy(true);
                }
                _this.table = $('<table class="table table-striped table-bordered table-hover"></table>').appendTo(_this.$el.find(".table-responsive"));
                _this.table.on("dblclick", "tr", function (event) {
                    var link = $("td:last a", event.currentTarget).attr("href");
                    if (link) {
                        window.open($("td:last a", event.currentTarget).attr("href"), "_blank");
                    }
                    event.preventDefault();
                });
                _this.table.on('click', "th input:checkbox", function () {
                    var box = this;
                    _this.table.find('tr > td:first-child input:checkbox')
                        .each(function () {
                            $(this).prop("checked", box.checked).closest('tr').toggleClass('selected');
                        });
                });

                _this.dataTable = _this.table.dataTable({
                    aoColumns: [
                        {
                            sTitle: (queryConfig["allowDelete"] ? getTableIndexColHtml('<b>序号</b>') : '序号'),
                            bSortable: false
                        }
                    ].concat(queryConfig["showColumns"], queryConfig["allowOpen"] ? [
                            {
                                sTitle: "查看",
                                bSortable: false,
                                bSearchable: false,
                                mRender: function (data) {
                                    return "<a href='/" + dbPath + "/0/" + data + "?opendocument' target='_blank'>详细信息</a>";
                                }
                            }
                        ] : []),
                    bDeferRender: true,
                    bProcessing: true,
                    fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                        $('td:eq(0)', nRow).html(queryConfig["allowDelete"] ? getTableIndexColHtml(iDisplayIndexFull + 1) : iDisplayIndexFull + 1);
                    },
                    fnDrawCallback: function () {
                        //当表格渲染完成后，清空所有复选框（主要是表头的全选框）
                        _this.table.find("input:checkbox").prop("checked", false);
                    }
                });
                _this.table.css({"width": ""}).wrap("<div style='overflow-x:auto;' ></div>");
                _this.table.find("thead tr th").each(function (index, item) {
                    var th = $(item);
                    if (index === 0) {
                        th.css("width", (queryConfig["allowDelete"] ? "50px" : "30px"));
                    }
                    if (th.css("width") === "0px") {
                        th.css("width", "");
                    }
                });
                _this.table.find("thead tr th:last").css("width", "55px");
                _this.$el.show();
                $(".page-content >.active").removeClass("active");
                $(".page-content .view").addClass("active").slideDown();
                $(".databaseQuery").show();
                $("#viewFrame .viewData").slideUp();
            });
        },
        executeQuery: function (id, param) {
            this.dataTable.fnReloadAjax("/Produce/DigiShell.nsf/executeDatabaseQuery.xsp?id=" + id + "&param=" + encodeURI(JSON.stringify(param)));
        },
        getQueryNames: function (dbPath, callback) {
            if (dbPath in configCache) {
                callback(configCache[dbPath]);
                return true;
            }
            $.get("/Produce/DigiShell.nsf/getDatabaseQueryConfig.xsp", {
                dbPath: dbPath
            },function (data) {
                configCache[dbPath] = data;
                callback(data);
            }, "json").error(function () {
                    //TODO 异常信息待完善
                    alert("连接已断开，请重新登录");
                });
        },
        getSelected: function (filter) {
            var _this = this,
                result = [];
            this.dataTable.find("tbody input:checkbox:checked").each(function () {
                var tr = $(this).closest("tr"),
                    index = tr.index(),
                    data = _this.dataTable.fnGetData(tr.get(0));
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
    });

    var query = new Query();
    return query;
});