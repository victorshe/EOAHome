define(function (require, exports) {

    var Backbone = require("backbone"),
        _ = require("underscore"),
        util = require("./util");

    //每次显示菜单深度
    var renderDeep = null,
    //点击事件名称
        click_event = $.fn.tap ? "tap" : "click",
    //菜单项模板
        itemTemplate = _.template("<li><a href='<%=href%>'><i class='<%=ico||(level===2?\"icon-double-angle-right\":\"\")%>'></i><span class='menu-text'><%=name%></span></a></li>"),
    //子级菜单项模板
        parentTemplate = _.template("<li><a href='<%=href%>' class='dropdown-toggle <%=obj.lazy?'lazy':''%>'><i class='<%=ico||(level===2?\"icon-double-angle-right\":\"\")%>'></i><span class='menu-text'><%=name%></span><b class='arrow icon-angle-down'></b></a><ul class='submenu'><%=childItem%></ul></li><% delete obj.childItem %>"),
        menuOptChecker = /GJOpt_ViewTmpGotoURL\('\S+?&login(\S+?)'\)/,
        menuHrefGetter = /\S+(#m_\S+?\/[^\/]+)\S*/,
        menuCache = {},
        moduleCache = {},
        isMiniMenu;

    var DEFAULT_MENU = {
        hotForm: [
            {
                "id": "root",
                "level": 0
            },
            {
                "id": "MENU_YWB",
                "ico": "icon-road",
                "name": "业务部",
                "parentId": "root"
            },
            {
                "id": "MENU_XSB",
                "ico": "icon-truck",
                "name": "销售部",
                "parentId": "root"
            },
            {
                "id": "MENU_JSB",
                "ico": "icon-gears",
                "name": "技术部",
                "parentId": "root"
            },
            {
	            "id": "Fanuc_IT",
	            "ico": "icon-desktop",
	            "parentId": "root",
	            "name": "IT课"
	        },
            {
                "id": "BJGZReport",
                "ico": "",
                "name": "发起部件故障报告流程",
                "dbPath": "Application/Operation/BuJianGuZhangReport.nsf",
                "form": "mainformXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "BFMProductLoan",
                "ico": "",
                "name": "发起产品库物料借用申请单",
                "dbPath": "Application/Operation/ProductLoan.nsf",
                "form": "mainformxp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YWB_ShipArrNotice",
                "ico": "",
                "name": "发起装船或到货通知",
                "dbPath": "Application/Operation/ShipmentOrArrivalNotice.nsf",
                "form": "Notice",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "DF_A_03_01",
                "ico": "",
                "name": "发起国内部件\\日本资料\\维修部件到货通知流程",
                "dbPath": "Application/Operation/ArrivalNoticeApp.nsf",
                "form": "ArrivalNoticeXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YYB_YFJS",
                "ico": "",
                "name": "发起运费结算申请",
                "dbPath": "Application/Operation/FreightSettlement.nsf",
                "form": "mainformxp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YWBJB",
                "ico": "",
                "name": "发起加班请示报告申请",
                "dbPath": "Application/Operation/OverTimeQSReport.nsf",
                "form": "mainformXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "DeliveryNotice",
                "ico": "",
                "name": "发起日发货计划下达申请",
                "dbPath": "Application/Operation/DeliveryNotice.nsf",
                "form": "DeliveryNoticePage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "InventoryReportnew",
                "ico": "",
                "name": "发起盘点报告申请",
                "dbPath": "Application/Operation/InventoryReport.nsf",
                "form": "InventoryReportPage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "AdjustOrder",
                "ico": "",
                "name": "发起订货调整审批申请",
                "dbPath": "Application/Operation/AdjustOrder.nsf",
                "form": "AdjustOrderPage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "PurchaseManagement",
                "ico": "",
                "name": "发起采购需求管理申请",
                "dbPath": "Application/Operation/PurchaseManagement.nsf",
                "form": "PurchaseManagementPage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "ss01",
                "ico": "",
                "name": "发起产品销售合同变更流程",
                "dbPath": "Application/Business/selconcha.nsf",
                "form": "xpmain",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ss03",
                "ico": "",
                "name": "发起产品销售欠款申请",
                "dbPath": "Application/Business/salearrearage.nsf",
                "form": "xpmain",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_jjzjdh_fanuc",
                "ico": "",
                "name": "发起紧急追加订货审批流程",
                "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
                "form": "EmergencyAddedOrderXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_jzdhsp_fanuc",
                "ico": "",
                "name": "发起集中订货审批流程",
                "dbPath": "Application/Business/CentralizedOrderApp.nsf",
                "form": "CentralizedOrderAppXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ssb03",
                "ico": "",
                "name": "发起订发货预测数据汇总审批表",
                "dbPath": "Application/Business/DataSheetCollent.nsf",
                "form": "xpmain",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ssb04",
                "ico": "",
                "name": "发起订发货预测数据审批表",
                "dbPath": "Application/Business/DataSheetAudit.nsf",
                "form": "xpmain",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_xsfhbg_fanuc",
                "ico": "",
                "name": "发起销售发货变更流程",
                "dbPath": "Application/Business/SalesDeliveryChanges.nsf",
                "form": "SalesDeliveryChangesXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_xsxygd_fanuc",
                "ico": "",
                "name": "发起销售协议归档流程",
                "dbPath": "Application/Business/SalesAgreementArchived.nsf",
                "form": "SalesAgreementArchivedXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_jjzjdh_fanuc",
                "ico": "",
                "name": "发起紧急追加订货流程",
                "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
                "form": "EmergencyAddedOrderXp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "BFMProductOrder",
                "ico": "",
                "name": "发起发那科（天津）产品贸易订货流程",
                "dbPath": "Application/Business/DigiFlowProductOrder.nsf",
                "form": "mainformxp",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "DirectSalesOrderReview",
                "ico": "",
                "name": "发起直销系统订单审核",
                "dbPath": "Application/Business/DirectSalesOrderReview.nsf",
                "form": "mainPage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_JSB"
            },
            {
                "id": "SolvesTechnicalProblems",
                "ico": "",
                "name": "发起疑难技术问题处理申请",
                "dbPath": "Application/Business/SolvesTechnicalProblems.nsf",
                "form": "mainPage",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_JSB"
            },
            {
	            "id": "ITChangeManagement",
	            "ico": "",
	            "name": "发起IT变更管理申请",
	            "dbPath": "Application/ITChange.nsf",
	            "form": "ITChangeXp",
	            "source": "menuInfoXAgent.xsp",
	            "parentId": "Fanuc_IT"
	        },
	        {
	            "id": "ITProblemManagement",
	            "ico": "",
	            "name": "发起IT问题管理申请",
	            "dbPath": "Application/ITProblem.nsf",
	            "form": "ITProblemXp",
	            "source": "menuInfoXAgent.xsp",
	            "parentId": "Fanuc_IT"
	        }, {
				"id": "ITDemandManagement",
				"ico": "",
				"name": "发起IT需求申请",
				"dbPath": "Application/ITDemand.nsf",
				"form": "ITDemandXp",
				"source": "menuInfoXAgent.xsp",
				"parentId": "Fanuc_IT"
			}
        ],
        hotApp: [
            {
                "id": "root",
                "level": 0
            },
            {
                "id": "MENU_YWB",
                "ico": "icon-road",
                "name": "业务部",
                "parentId": "root"
            },
            {
                "id": "MENU_XSB",
                "ico": "icon-truck",
                "name": "销售部",
                "parentId": "root"
            },
            {
                "id": "MENU_JSB",
                "ico": "icon-gears",
                "name": "技术部",
                "parentId": "root"
            },
            {
	            "id": "Fanuc_IT",
	            "ico": "icon-desktop",
	            "parentId": "root",
	            "name": "IT课"
	        },
            {
                "id": "BJGZReport",
                "ico": "",
                "name": "部件故障报告流程",
                "dbPath": "Application/Operation/BuJianGuZhangReport.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "BFMProductLoan",
                "ico": "",
                "name": "产品库物料借用申请",
                "dbPath": "Application/Operation/ProductLoan.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YWB_ShipArrNotice",
                "ico": "",
                "name": "装船或到货通知",
                "dbPath": "Application/Operation/ShipmentOrArrivalNotice.nsf",
                "view": "vwDone",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "DF_A_03_01",
                "ico": "",
                "name": "国内部件\\日本资料\\维修部件到货通知",
                "dbPath": "Application/Operation/ArrivalNoticeApp.nsf",
                "view": "ArrivalNoticeDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YYB_YFJS",
                "ico": "",
                "name": "运费结算",
                "dbPath": "Application/Operation/FreightSettlement.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "YWBJB",
                "ico": "",
                "name": "加班请示报告",
                "dbPath": "Application/Operation/OverTimeQSReport.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "DeliveryNotice",
                "ico": "",
                "name": "日发货计划下达",
                "dbPath": "Application/Operation/DeliveryNotice.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "InventoryReportnew",
                "ico": "",
                "name": "盘点报告",
                "dbPath": "Application/Operation/InventoryReport.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "AdjustOrder",
                "ico": "",
                "name": "订货调整审批",
                "dbPath": "Application/Operation/AdjustOrder.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "PurchaseManagement",
                "ico": "",
                "name": "采购需求管理",
                "dbPath": "Application/Operation/PurchaseManagement.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_YWB"
            },
            {
                "id": "ss01",
                "ico": "",
                "name": "产品销售合同变更",
                "dbPath": "Application/Business/selconcha.nsf",
                "view": "vwAll",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ss03",
                "ico": "",
                "name": "产品销售欠款申请",
                "dbPath": "Application/Business/salearrearage.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_jzdhsp_fanuc",
                "ico": "",
                "name": "集中订货审批",
                "dbPath": "Application/Business/CentralizedOrderApp.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_jjzjdh_fanuc",
                "ico": "",
                "name": "紧急追加订货",
                "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_xsfhbg_fanuc",
                "ico": "",
                "name": "销售发货变更",
                "dbPath": "Application/Business/SalesDeliveryChanges.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "menu_xsxygd_fanuc",
                "ico": "",
                "name": "销售协议归档",
                "dbPath": "Application/Business/SalesAgreementArchived.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "BFMProductOrder",
                "ico": "",
                "name": "发那科（天津）产品贸易订货流程",
                "dbPath": "Application/Business/DigiFlowProductOrder.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ssb03",
                "ico": "",
                "name": "订发货预测数据汇总表",
                "dbPath": "Application/Business/DataSheetCollent.nsf",
                "view": "vwAll",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ssb04",
                "ico": "",
                "name": "订发货预测数据审批表",
                "dbPath": "Application/Business/DataSheetAudit.nsf",
                "view": "vwAll",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "ssconfig",
                "ico": "",
                "name": "业务基础数据配置",
                "dbPath": "Application/SellConfig.nsf",
                "view": "MTBConfig",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_XSB"
            },
            {
                "id": "DirectSalesOrderReview",
                "ico": "",
                "name": "直销系统订单审核",
                "dbPath": "Application/Business/DirectSalesOrderReview.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_JSB"
            },
            {
                "id": "SolvesTechnicalProblems",
                "ico": "",
                "name": "疑难技术问题处理",
                "dbPath": "Application/Business/SolvesTechnicalProblems.nsf",
                "view": "vwDoing",
                "source": "menuInfoXAgent.xsp",
                "parentId": "MENU_JSB"
            },
            {
	            "id": "ITChangeManagement",
	            "ico": "",
	            "name": "IT变更管理",
	            "dbPath": "Application/ITChange.nsf",
	            "view": "vwDoing",
	            "source": "menuInfoXAgent.xsp",
	            "parentId": "Fanuc_IT"
	        },
	        {
	            "id": "ITProblemManagement",
	            "ico": "",
	            "name": "IT问题管理",
	            "dbPath": "Application/ITProblem.nsf",
	            "view": "vwDoing",
	            "source": "menuInfoXAgent.xsp",
	            "parentId": "Fanuc_IT"
	        }, {
				"id": "ITDemandManagement",
				"ico": "",
				"name": "IT需求管理",
				"dbPath": "Application/ITDemand.nsf",
				"view": "vwDoing",
				"source": "menuInfoXAgent.xsp",
				"parentId": "Fanuc_IT"
			}
        ],
        "switch": [
            {
                "id": "root",
                "level": 0
            },
            {
                "id": "company",
                "name": "协同首页",
                "ico": "icon-building",
                "opt": "digishell.theme.switchConfig('company')",
                "parentId": "root"
            },
            {
                "id": "www_Home",
                "name": "公司首页",
                "ico": "icon-globe",
                "opt": "window.open('http://www.bj-fanuc.com.cn','_blank')",
                "parentId": "root"
            },
            {
                "id": "hrsystem",
                "name": "HR系统",
                "ico": "icon-group",
                "opt": "window.open('/Produce/DigiFlowSynchronizeData.nsf/xpHRLogin.xsp','_blank')",
                "parentId": "root"
            },
            {
                "id": "OA_HOME",
                "name": "OA首页",
                "ico":"icon-map-marker",
                "opt":"window.open('http://oa.bj-fanuc.com.cn','_blank')",
                "parentId": "root"
            }
        ]
    };

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
        initialize: function (models, options) {
            this.type = options ? (options.type || "") : null;
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
        url: function () {
            return "/Produce/DigiShell.nsf/getMenuDataXAgent.xsp?parent=root&type=" + this.type;
        }
    });

    var AppMenuItems = BaseMenuItems.extend({
        parse: function (response, options) {
            var menuData = [
                    {
                        "id": "root",
                        "level": 0
                    }
                ],
                _this = this;
            if (options.dataType === "text") {
                var menuXml = /.+<[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa] id="MenuXmlList" style="display:none">(.+?)<\/[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa]>.*/.exec(response.replace(/\n|\r/g, ""))[1].replace(/&/g, "&amp;"),
                    urlParamParser = function (url) {
                        var paramInfo = {};
                        _.forEach(url.split("&"), function (item) {
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
                        if (paramInfo.page) {
                            paramInfo.page = parseInt(paramInfo.page,0);
                        }
                        return paramInfo;
                    }, menuXmlParser = function (menuNodes, parentId) {
                        var result = [];
                        menuNodes.each(function (index) {
                            var node = $(this),
                                item = {
                                    id: node.attr("id") || (parentId === "root" ? "" : parentId + "_") + index,
                                    name: node.attr("name"),
                                    ico: convertIconClassName(node.attr("ico")),
                                    lazy: !!node.attr("lazy"),
                                    parentId: parentId
                                },
                                children = node.children(),
                                opts;
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
                menuData = menuData.concat(menuXmlParser($($.parseXML(menuXml).firstChild).children(), "root"));
            } else {
                var menuDataParser = function (data, parentId) {
                    var result = [];
                    if ("lazySource" in response) {
                        _this.url = response["lazySource"];
                    }
                    _.each(data, function (item, index) {
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
                }, dbPath = /\/(.+)\/.*/.exec(options.url)[1];
                menuData = menuData.concat(menuDataParser(response.items, "root"));
            }
            return menuData;
        }
    });

    var siteMapSource = new BaseMenuItems([]);

    //全局菜单数据源
    var SiteMap = Backbone.View.extend({
        model: null,
        selectable: false,
        mode: null,
        mapItems: [],
        initialize: function () {
            this.model = siteMapSource.clone();
        },
        events: {
            "click .widget-toolbar  > [data-action]": "clickTools",
            "click .widget-body li": "clickItem"
        },
        clickTools: function (event) {
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
                    widgetBody.slideUp(0, function () {
                        widgetBody.slideDown(downTime);
                    });
                } else {
                    if (collapseIcon) {
                        collapseIcon.addClass(downIcon).removeClass(upIcon);
                    }
                    widgetBody.slideUp(upTime, function () {
                        widget.addClass("collapsed");
                    });
                }
            }
            return true;
        },
        clickItem: function (event) {
            var target = $(event.currentTarget),
                childIndex = target.index(),
                itemIndex = target.closest(".widget-box").data("index"),
                item = this.mapItems[itemIndex].children[childIndex];
            if (!this.selectable) {
                this.openItem(item, event);
                window.scrollTo(0, 0);
            } else {
                if (event.target.tagName === "INPUT") {
                    item.set("selected", target.find("input:checkbox").prop("checked"));
                    this.$el.trigger("select", [item, this.model.where({selected: true})]);
                }
            }
        },
        getItem: function (id, callback) {
            var item = this.model.get(id),
                _this = this;
            if (!item) {
                this.model.fetch({
                    success: function () {
                        item = _this.model.get(id);
                        if (_.isFunction(callback)) {
                            callback(item, _this.model);
                        }
                    }
                });
                return;
            }
            if (_.isFunction(callback)) {
                callback(item, this.model);
            }
        },
        getMapItems: function (model, filter) {
            var items = [];
            model.each(function (item) {
                var children = model.where({parentId: item.get("id")});
                if (children.length > 0) {
                    children = _.filter(children, function (item) {
                        return !model.findWhere({parentId: item.id});
                    });
                    if (typeof filter === "function") {
                        children = _.filter(children, filter);
                    }
                    if (children.length > 0) {
                        items.push(_.extend({}, item.attributes, {children: children}));
                    }
                }
            });
            return items;
        },
        openItem: function (item, event) {
            getMenu(this.mode).openItem(item, event);
        },
        itemTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><a class="inline" href="#m_<%=mode%>/<%=info.id%>"><i class="<%=info.ico%>"></i><%=mode==="hotApp"?info.name:info.formName%></a></li><%});%></ul></div></div><div class="space-4"></div>'),
        itemSelectTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><label class="inline"><input type="checkbox" class="ace" <%=info.selected?"checked":""%>/><span class="lbl"><%=mode==="hotApp"?info.name:info.formName%></span></label></li><%});%></ul></div></div><div class="space-4"></div>'),
        refresh: function (options) {
            var _this = this;
            this.mode = options.mode;
            this.selectable = options.selectable;
            this.$el.empty().html("<div class='span4'></div><div class='span4'></div><div class='span4'></div>");
            if (this.model.length === 0) {
                this.model.fetch({
                    success: function () {
                        _this.render(options);
                    }
                });
            } else {
                this.render(options);
            }
            return this;
        },
        render: function (options) {
            var placeTarget = this.$el.find("> div"),
                _this = this;
            if (options.selected) {
                options.selected.each(function (item) {
                    var storeItem = _this.model.get(item.id);
                    if (storeItem){
                        storeItem.set("selected", true);
                    }
                });
            }
            this.mapItems = this.getMapItems(this.model, options.filter);
            _.each(this.mapItems, function (item, index) {
                $(placeTarget.get(index % 3)).append((options.selectable ? _this.itemSelectTemplate : _this.itemTemplate)(_.extend({
                    mode: options.mode,
                    index: index,
                    ico: ""
                }, item)));
            });
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
        initialize: function () {
            var _this = this;
            this.model = new BaseMenuItems(util.localConfig(this.id + "Config") || DEFAULT_MENU[this.id], { type: this.id });
            this.render("root");
            $("#" + this.id + "Menu").append(this.el);
            if ("eval_callback" in window) {
                this.$el.find("a").click(function (event) {
                    _this.sideMenuClick.call(_this, event);
                });
            }
        },
        sideMenuClick: function (event) {
            var link = $(event.currentTarget),
                _this = this;
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
                this.openItem(this.getItemByLink(link), event);
                return;
            } else if (link.hasClass("lazy")) {
                var item = this.getItemByLink(link);
                this.model.sync("read", this.model, {
                    data: {
                        parentId: item.id
                    },
                    success: function (response) {
                        _this.model.add(_.map(response, function (child, index) {
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
                curMenuNode.find("> .open > .submenu").each(function () {
                    if (this !== childMenuNode && !$(this.parentNode).hasClass("active")) {
                        $(this).slideUp(200).parent().removeClass("open"); //.find(">a b.arrow").removeClass("icon-angle-up").addClass("icon-angle-down")
                    }
                });
            }
            if (isMiniMenu && $(childMenuNode.parentNode.parentNode).hasClass("nav-list")) {
                return false;
            }
            $(childMenuNode).slideToggle(200).parent().toggleClass("open");
            return;
        },
        getItem: function (id, callback) {
            var item = this.model.get(id);
            if (!item) {
                getSiteMap({
                    el: $(".page-content .siteMap")[0]
                }).getItem(id, callback);
                return;
            }
            if (_.isFunction(callback)) {
                callback(item, this.model);
            }
        },
        getItemByLink: function (link) {
            return this.model.get(/#\S+\/(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function (id) {
            return this.$el.find("[href='#m_" + this.id + "/" + id + "']");
        },
        activeItem: function (item) {
            var link = this.getLinkById(item.id);
            if (this.activeItemNode) {
                this.activeItemNode.removeClass("active").removeClass("open");
            }
            link.parent("li").parents("li").addClass("open");
            this.activeItemNode = link.parents("li").addClass("active");
        },
        openItem: function (item, event) {
            //因为未能实现完全的单页应用，这里尚需判断需要额外操作的类型
            if (item.get("url")) {
                window.open(item.get("url"), "_blank");
            } else if (item.get("opt") && menuOptChecker.exec(item.get("opt")) === null) {
                eval("(" + item.get("opt") + ")");
            } else if (item.get("form")) {
                if (item.get("source") === undefined || item.get("source").indexOf(".xsp") !== -1) {
                    window.open("/" + item.get("dbPath") + "/" + item.get("form") + ".xsp", "_blank");
                } else {
                    window.open("/" + item.get("dbPath") + "/" + item.get("form") + "?openform", "_blank");
                }
            } else if (item.get("view")) {
                return;
            }
            if (event) {
                event.preventDefault();
            }
        },
        /**
         * 通过菜单配置数据，生成菜单DOM节点HTML
         * 出于快速实现考虑，主要使用手工解析方式拼装HTML。未来可考虑实现复杂的模板逻辑。
         * @param {*} menuData 菜单配置数据，可能为数组或菜单项
         * @param [{*}] parent 当前菜单级数
         * @returns {String} 菜单DOM节点HTML
         */
        getMenuNode: function (parentId) {
            var html = "";
            var level = this.model.get(parentId).get("level") + 1,
                children = this.model.where({parentId: parentId});

            if (children.length > 0) {
                for (var n = 0, child; child = children[n++];) {
                    child.set("level", level);
                    if (this.model.findWhere({parentId: child.id}) || child.get("lazy")) {
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
        getHref: function (child) {
            return "#m_" + this.id + "/" + child.id;
        },
        render: function (parentId) {
            //TODO 待实现延迟渲染
            (parentId !== "root" ? this.$el.find("a.dropdown-toggle[href='" + this.getHref({id: parentId}) + "']").parent().find(".submenu") : this.$el).empty().append(this.getMenuNode(parentId));
        }
    });

    moduleCache.hotForm = BaseMenu.extend({
        id: "hotForm",
        initialize: function () {
            BaseMenu.prototype.initialize.apply(this, arguments);
        },
        openMore: function () {
            $(".page-content >.active").removeClass("active");
            var $siteMapNode = $(".page-content .siteMap").addClass("active");
            var siteMap = getSiteMap({
                el: $siteMapNode[0]
            }).refresh({
                    mode: this.id,
                    filter: function (item) {
                        return item.get("form") && item.get("formName");
                    }
                });
        }
    });

    moduleCache.hotApp = BaseMenu.extend({
        id: "hotApp",
        initialize: function () {
            BaseMenu.prototype.initialize.apply(this, arguments);
        },
        openMore: function () {
            $(".page-content >.active").removeClass("active");
            var $siteMapNode = $(".page-content .siteMap").addClass("active");
            var siteMap = getSiteMap({
                el: $siteMapNode[0]
            }).refresh({
                    mode: this.id
                });
        },
        openItem: function (item, event) {
            var _this = this;
            if (item.get("view")) {
                var appMenu = openMenu("app");
                appMenu.setSource({
                    dbPath: item.get("dbPath"),
                    source: item.get("source") || "MenusListForm?OpenForm"
                }).getItemByView(item.get("view"), function (appItem) {
                        digishell.router.navigate("#m_" + _this.id + "/" + item.id + "/a_" + appItem.id, {replace: true, trigger: true});
                    });
            } else {
                BaseMenu.prototype.openItem.apply(this, [item, event]);
            }
        }
    });

    moduleCache["switch"] = BaseMenu.extend({
        id: "switch"
    });

    moduleCache.app = BaseMenu.extend({
        id: "app",
        source: null,
        isXsp: false,
        initialize: function () {
            this.model = new AppMenuItems([], {
                type: this.id
            });
            $("#appMenu").append(this.el);
        },
        setSource: function (source) {
            if (this.source && source.dbPath !== this.source.dbPath) {
                //TODO 解决切换应用时不加载新菜单的问题，考虑更为优秀的方案
                this.model.reset([]);
            }
            this.source = source;
            this.isXsp = source.source.indexOf(".xsp") !== -1;
            return this;
        },
        getItemByLink: function (link) {
            return this.model.get(/#\S+\/a_(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function (id) {
            return this.$el.find("[href='" + menuHrefGetter.exec(location.href)[1] + "/a_" + id + "']");
        },
        getItem: function (id, callback) {
            var item = this.model.get(id),
                _this = this;
            if (!item) {
                this.model.fetch(_.extend((this.isXsp ? {

                } : {
                    dataType: "text"
                }), {
                    url: "/" + this.source.dbPath + "/" + this.source.source,
                    reset: true,
                    success: function () {
                        BaseMenu.prototype.getItem.apply(_this, [id, callback]);
                    }
                }));
                return;
            }
            BaseMenu.prototype.getItem.apply(this, [id, callback]);
        },
        getItemByView: function (view, callback) {
            var _this = this,
                item = this.model.where({
                    view: view
                });
            if (!item[0]) {
                this.model.fetch(_.extend((this.isXsp ? {

                } : {
                    dataType: "text"
                }), {
                    url: "/" + this.source.dbPath + "/" + this.source.source,
                    reset: true,
                    success: function () {
                        item = _this.model.where({
                            view: view
                        });
                        if (item[0]) {
                            _this.getItem(item[0].id, callback);
                        }
                    },
                    error: function (items,resp,options) {
                        //判断是否无权限或登录超时，TODO未来将使用AJAX登录机制解决该问题
                        if(resp.responseText.indexOf("<!DOCTYPE HTML PUBLIC") === 0 && resp.responseText.indexOf('<input name="RedirectTo" value="'+options.url+'" type=hidden>')!==-1){
                            alert("无法打开应用，请重新登录");
                            location.href="/names.nsf?login";
                        }
                    }
                }));
            } else {
                this.getItem(item[0].id, callback);
            }
        },
        getHref: function (child) {
            return menuHrefGetter.exec(location.href)[1] + "/a_" + child.id;
        },
        openItem: function (item, event) {
            var _this = this;
            if (item.get("view")) {
                require.async("./viewFrame", function (frame) {
                    digishell.router.makeBreadcrumb(convertItemsToBreadcrumb(_this.model, item), "APP");
                    frame.openView(item.attributes);
                    _this.render("root");
                    _this.activeItem(item);
                    if ("eval_callback" in window) {
                        _this.$el.find("a").click(function (event) {
                            _this.sideMenuClick.call(_this, event);
                        });
                    }
                });
            } else {
                BaseMenu.prototype.openItem.apply(this, [item, event]);
            }
        }
    });

    var getMenu = function (id, options) {
        return menuCache[id] ? menuCache[id] : (menuCache[id] = new moduleCache[id](options));
    };

    var getSiteMap = (function () {
        var singleton = null;
        return function (option) {
            if (option.create) {
                return new SiteMap(option);
            } else {
                return singleton ? singleton : singleton = new SiteMap(option);
            }
        };
    })();

    var activeMenu = function (menu) {
        if (!menu) {
            menu = menu || getMenu("hotForm");
        }
        $("#sidebar-shortcuts-large a[href='#" + menu.id + "Menu']").tab("show");
        return menu;
    };
    /**
     * 在两个同级Dom间实现滑动切换效果，待完成
     * @param from
     * @param to
     */
    var slideSwitch = function (from, to) {
        from.hide();
        to.show();
    };

    var openMenu = function (id) {
        return activeMenu(getMenu(id));
    };

    $(function () {
        $("#menu-toggler").on(click_event, function () {
            $("#sidebar").toggleClass("display");
            $(this).toggleClass("display");
            return false;
        });
        //边栏切换时，获取对应菜单
        $("#sidebar-shortcuts").children().on('show', function (event) {
            $(event.currentTarget).find(".active").removeClass("active");
            $(event.target).addClass("active");
            getMenu($(event.target).attr("href").replace(/Menu|#/g, ""));
        });
        $("#sidebar-collapse").on(click_event, function () {
            isMiniMenu = !$("#sidebar").hasClass("menu-min");
            ace.settings.sidebar_collapsed(isMiniMenu);
        });
    });

    exports.activeMenu = activeMenu;
    exports.slideSwitch = slideSwitch;
    exports.getMenu = getMenu;
    exports.openMenu = openMenu;
    exports.getSiteMap = getSiteMap;
});