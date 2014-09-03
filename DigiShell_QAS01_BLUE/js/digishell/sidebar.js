define(function(require, exports) {
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
        hotForm: [{
            "id": "root",
            "level": 0
        }, {
            "id": "MENU_YWB",
            "ico": "icon-road",
            "name": "业务部",
            "parentId": "root"
        }, {
            "id": "MENU_XSB",
            "ico": "icon-truck",
            "name": "销售部",
            "parentId": "root"
        }, {
            "id": "MENU_JSB",
            "ico": "icon-gears",
            "name": "技术部",
            "parentId": "root"
        }, {
            "id": "MENU_WXB",
            "ico": "icon-gears",
            "name": "维修部",
            "parentId": "root"
        }, {
            "id": "MENU_GLB",
            "ico": "icon-gears",
            "name": "管理部",
            "parentId": "root"
        }, {
            "id": "XPAGEFICO",
            "ico": "icon-credit-card",
            "name": "财务",
            "parentId": "root"
        }, {
            "id": "Fanuc_IT",
            "ico": "icon-desktop",
            "parentId": "root",
            "name": "IT部"
        }, {
            "id": "Fanuc_SCB",
            "ico": "icon-desktop",
            "parentId": "root",
            "name": "市场部"
        }, {
            "id": "BJGZReport",
            "ico": "",
            "name": "发起部件故障报告流程",
            "dbPath": "Application/Operation/BuJianGuZhangReport.nsf",
            "form": "mainformXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "BFMProductLoan",
            "ico": "",
            "name": "发起产品库物料借用申请单",
            "dbPath": "Application/Operation/ProductLoan.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YWB_ShipArrNotice",
            "ico": "",
            "name": "发起装船或到货通知",
            "dbPath": "Application/Operation/ShipmentOrArrivalNotice.nsf",
            "form": "Notice",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "DF_A_03_01",
            "ico": "",
            "name": "发起国内部件\\日本资料\\维修部件到货通知流程",
            "dbPath": "Application/Operation/ArrivalNoticeApp.nsf",
            "form": "ArrivalNoticeXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YYB_YFJS",
            "ico": "",
            "name": "发起运费结算申请",
            "dbPath": "Application/Operation/FreightSettlement.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YWBJB",
            "ico": "",
            "name": "发起加班请示报告申请",
            "dbPath": "Application/Operation/OverTimeQSReport.nsf",
            "form": "mainformXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "DeliveryNotice",
            "ico": "",
            "name": "发起日发货计划下达申请",
            "dbPath": "Application/Operation/DeliveryNotice.nsf",
            "form": "DeliveryNoticePage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "InventoryReportnew",
            "ico": "",
            "name": "发起盘点报告申请",
            "dbPath": "Application/Operation/InventoryReport.nsf",
            "form": "InventoryReportPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "AdjustOrder",
            "ico": "",
            "name": "发起订货调整审批申请",
            "dbPath": "Application/Operation/AdjustOrder.nsf",
            "form": "AdjustOrderPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "PurchaseManagement",
            "ico": "",
            "name": "发起采购需求管理申请",
            "dbPath": "Application/Operation/PurchaseManagement.nsf",
            "form": "PurchaseManagementPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "DirectProductPricing",
            "ico": "",
            "name": "发起直销产品报价全过程申请",
            "dbPath": "Application/Operation/DirectProductPricing.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "ProductPriceFlow",
            "ico": "",
            "name": "发起产品报价全过程申请",
            "dbPath": "Application/Operation/ProductPriceFlow.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "ss01",
            "ico": "",
            "name": "发起产品销售合同变更流程",
            "dbPath": "Application/Business/selconcha.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ss03",
            "ico": "",
            "name": "发起产品销售欠款申请",
            "dbPath": "Application/Business/salearrearage.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_jjzjdh_fanuc",
            "ico": "",
            "name": "发起紧急追加订货审批流程",
            "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
            "form": "EmergencyAddedOrderXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_jzdhsp_fanuc",
            "ico": "",
            "name": "发起集中订货审批流程",
            "dbPath": "Application/Business/CentralizedOrderApp.nsf",
            "form": "CentralizedOrderAppXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ssb03",
            "ico": "",
            "name": "发起订发货预测数据汇总审批表",
            "dbPath": "Application/Business/DataSheetCollent.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ssb04",
            "ico": "",
            "name": "发起订发货预测数据审批表",
            "dbPath": "Application/Business/DataSheetAudit.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_xsfhbg_fanuc",
            "ico": "",
            "name": "发起销售发货变更流程",
            "dbPath": "Application/Business/SalesDeliveryChanges.nsf",
            "form": "SalesDeliveryChangesXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_xsxygd_fanuc",
            "ico": "",
            "name": "发起销售协议归档流程",
            "dbPath": "Application/Business/SalesAgreementArchived.nsf",
            "form": "SalesAgreementArchivedXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_jjzjdh_fanuc",
            "ico": "",
            "name": "发起紧急追加订货流程",
            "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
            "form": "EmergencyAddedOrderXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "BFMProductOrder",
            "ico": "",
            "name": "发起发那科（天津）产品贸易订货流程",
            "dbPath": "Application/Business/DigiFlowProductOrder.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ProQueDel",
            "ico": "",
            "name": "发起产品异常问题处理流程",
            "dbPath": "Application/Business/ProQueDel.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "SaleAccSinkTicket",
            "ico": "",
            "name": "发起销售承兑汇票流程",
            "dbPath": "Application/Finance/SaleAccSinkTicket.nsf",
            "form": "mainXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "DirectSalesOrderReview",
            "ico": "",
            "name": "发起直销系统订单审核",
            "dbPath": "Application/Business/DirectSalesOrderReview.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "SolvesTechnicalProblems",
            "ico": "",
            "name": "发起疑难技术问题处理申请",
            "dbPath": "Application/Business/SolvesTechnicalProblems.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "SAPMDataIntegration1200",
            "ico": "",
            "name": "发起SAP物料主数据集成1200工厂申请",
            "dbPath": "Application/Business/SAPMDataIntegration1200.nsf",
            "form": "SAPMDataIntegrationXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "repairdocument",
            "ico": "",
            "name": "发起维修技术文档管理流程",
            "dbPath": "Application/Services/repairdocument.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "DealServiceManager",
            "ico": "",
            "name": "发起服务协议管理流程",
            "dbPath": "Application/Services/DealServiceManager.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "payafterarrival",
            "ico": "",
            "name": "发起先发货后付款申请流程",
            "dbPath": "Application/Services/payafterarrival.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Repairtechsupport",
            "ico": "",
            "name": "发起维修技术支持流程",
            "dbPath": "Application/Services/Repairtechsupport.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "sparepartssalesprice",
            "ico": "",
            "name": "发起备件销售价格优惠申请流程",
            "dbPath": "Application/Services/sparepartssalesprice.nsf",
            "form": "xpCreate",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Spotservicediscount",
            "ico": "",
            "name": "发起现场服务价格优惠申请流程",
            "dbPath": "Application/Services/Spotservicediscount.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Sparepartsrepairprice",
            "ico": "",
            "name": "发起备件修理价格优惠申请流程",
            "dbPath": "Application/Services/Sparepartsrepairprice.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "WeekWordSummary",
            "ico": "",
            "name": "发起周工作总结",
            "dbPath": "Application/WeekWordSummary.nsf",
            "form": "AppMainForm",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "officeBerNumApp",
            "ico": "",
            "name": "发起办公号码申请",
            "dbPath": "Application/officeBerNumApp.nsf",
            "form": "officeAppXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "BusinessCardApp",
            "ico": "",
            "name": "发起名片申请",
            "dbPath": "Application/BusinessCardApp.nsf",
            "form": "CardAppXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowMeetingRoomMng",
            "ico": "",
            "name": "发起会议室预定申请",
            "dbPath": "Application/DigiFlowMeetingRoomMng.nsf",
            "form": "MeetingAppForm",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowMeetSummary",
            "ico": "",
            "name": "发起会议纪要申请",
            "dbPath": "Application/DigiFlowMeetSummary.nsf",
            "form": "MainForm",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowOfficeMan",
            "ico": "",
            "name": "发起物品领用申请",
            "dbPath": "Application/DigiFlowOfficeMan.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "digflowjdsq",
            "ico": "",
            "name": "发起接待申请流程",
            "dbPath": "Application/digflowjdsq.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowGiftMan",
            "ico": "",
            "name": "发起礼品领用申请",
            "dbPath": "Application/DigiFlowGiftMan.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "officeresourceborrow",
            "ico": "",
            "name": "发起办公资源借用申请",
            "dbPath": "Application/officeresourceborrow.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "ProjectManagement",
            "ico": "",
            "name": "项目管理",
            "parentId": "MENU_GLB"
        }, {
            "id": "ProUsersApp",
            "ico": "",
            "name": "01.发起项目主要成员任命申请",
            "dbPath": "Application/ProUsersApp.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectTrial",
            "ico": "",
            "name": "02.发起项目立项初审申请",
            "dbPath": "Application/ProjectTrial.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "PreImplementationPR",
            "ico": "",
            "name": "03.发起项目实施立项申请报告申请",
            "dbPath": "Application/PreImplementationPR.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProSupplierReview",
            "ico": "",
            "name": "04.发起项目供应商评审申请",
            "dbPath": "Application/ProSupplierReview.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProAchievementEva",
            "ico": "",
            "name": "05.发起项目成果评审申请",
            "dbPath": "Application/ProAchievementEva.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProMilestoneAR",
            "ico": "",
            "name": "06.发起项目里程碑阶段性成果评审申请",
            "dbPath": "Application/ProMilestoneAR.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProAdminJHBGYS",
            "ico": "",
            "name": "07.发起项目管理计划/变更/预算申请",
            "dbPath": "Application/ProAdminJHBGYS.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectAchievementsReport",
            "ico": "",
            "name": "08.发起项目绩效报告申请",
            "dbPath": "Application/ProjectAchievementsReport.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectTmAchievements",
            "ico": "",
            "name": "09.发起项目团队绩效申请",
            "dbPath": "Application/ProjectTmAchievements.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProDocAdmin",
            "ico": "",
            "name": "10.发起项目文档申请",
            "dbPath": "Application/ProDocAdmin.nsf",
            "form": "ProjectTrialXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "UsefundsEarly_MainPage",
            "ico": "",
            "name": "发起资金提前使用申请",
            "dbPath": "Finance/UsefundsEarly.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "DF_A_04_16",
            "ico": "",
            "name": "发起再评估预算执行流程",
            "dbPath": "Finance/ReEvaluateBudget.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "OutOfBudget",
            "ico": "",
            "name": "发起预算外申请",
            "dbPath": "Finance/OutOfBudget.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "CHUCHAI",
            "ico": "",
            "name": "出差申请",
            "parentId": "XPAGEFICO"
        }, {
            "id": "TechnicEvecReport",
            "ico": "",
            "name": "发起技术部出差报告",
            "dbPath": "Finance/TechnicEvecReport.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TechnicEvecApp",
            "ico": "",
            "name": "发起技术部出差申请",
            "dbPath": "Finance/TechnicEvecApp.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TravelApplicationOfFinance",
            "ico": "",
            "name": "发起出差申请（通用）",
            "dbPath": "Finance/TravelApplicationOfFinance.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TravelApplicationOfMaintenance",
            "ico": "",
            "name": "发起出差申请（现场维修）",
            "dbPath": "Finance/TravelApplicationOfMaintenance.nsf",
            "form": "",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "BFMLoanFund",
            "ico": "",
            "name": "发起借款审批流程",
            "dbPath": "Finance/LoanFunds.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "DF_A_04_cl",
            "ico": "",
            "name": "发起差旅费报销申请",
            "dbPath": "Finance/TravelReim.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "EntertainmentReim",
            "ico": "",
            "name": "发起业务招待费报销申请",
            "dbPath": "Finance/EntertainmentReim.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "LostInvoiceApp",
            "ico": "",
            "name": "发起发票丢失申请",
            "dbPath": "Finance/LostInvoiceApp.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "AccruedExpenses_MainFormXp",
            "ico": "",
            "name": "发起费用计提申请",
            "dbPath": "Finance/AccruedExpenses.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "source": "",
            "formName": "",
            "id": "GONGYINGSHANG",
            "url": "",
            "form": "",
            "view": "",
            "dbPath": "/",
            "ico": "",
            "parentId": "XPAGEFICO",
            "server": "",
            "name": "供应商付款"
        }, {
            "id": "SPTradPayDomestic",
            "ico": "",
            "name": "发起供应商付款(贸易_国内付款)申请",
            "dbPath": "Finance/SPTradPayDomestic.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        },{
            "id": "SPTradePay",
            "ico": "",
            "name": "发起供应商付款(贸易_国外付款)申请",
            "dbPath": "Finance/SPTradePay.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "FixedAssetsAdvance",
            "ico": "",
            "name": "发起供应商付款(固资_预付)申请",
            "dbPath": "Finance/FixedAssetsAdvance.nsf",
            "form": "AdvancePaymentXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "FixedAssetsPay",
            "ico": "",
            "name": "发起供应商付款(固资_付款)申请",
            "dbPath": "Finance/FixedAssetsPay.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "BFMSPTradProcureSurcharge",
            "ico": "",
            "name": "发起供应商付款（贸易_采购附加费）申请",
            "dbPath": "Finance/SPTradProcureSurcharge.nsf",
            "form": "mainformxp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "YFTradePay",
            "name": "发起供应商付款(费用-预付)申请",
            "ico": "",
            "dbPath": "Finance/YFTradePay.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "source": "",
            "formName": "",
            "id": "HUAIZHANG",
            "url": "",
            "form": "",
            "view": "",
            "dbPath": "/",
            "ico": "",
            "parentId": "XPAGEFICO",
            "server": "",
            "name": "坏账相关"
        }, {
            "id": "BadFinanceLoss",
            "ico": "",
            "name": "发起坏账损失审批申请",
            "dbPath": "Finance/BadFinanceLoss.nsf",
            "form": "xpmain",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "DF_A_04_09",
            "ico": "",
            "name": "发起坏账计提申请",
            "dbPath": "Finance/BadDebtsProvision.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "GatherBadAccrual",
            "ico": "",
            "name": "发起坏账计提汇总审批申请",
            "dbPath": "Finance/GatherBadAccrual.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "menuG_FixedAsset_Fanuc",
            "ico": "",
            "parentId": "XPAGEFICO",
            "name": "固定资产"
        }, {
            "id": "menu_fashengou_fanuc",
            "ico": "",
            "name": "发起固定资产申购申请",
            "dbPath": "Finance/FixedAsset/FixedAssetPurchase.nsf",
            "form": "FixedAssetPurchaseXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fayanshou_fanuc",
            "ico": "",
            "name": "发起固定资产验收申请",
            "dbPath": "Finance/FixedAsset/FixedAssetAcceptance.nsf",
            "form": "FixedAssetAcceptanceXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fadiaobo_fanuc",
            "ico": "",
            "name": "发起固定资产调拨转移申请",
            "dbPath": "Finance/FixedAsset/FixedAssetChange.nsf",
            "form": "MainAppPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_borrow_fanuc",
            "ico": "",
            "name": "发起固定资产借用申请",
            "form": "MainAppPage",
            "dbPath": "Finance/FixedAsset/FixedAssetBorrow.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_return_fanuc",
            "ico": "",
            "name": "发起固定资产归还申请",
            "form": "MainAppPage",
            "dbPath": "Finance/FixedAsset/FixedAssetReturn.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fahandle_fanuc",
            "ico": "",
            "name": "发起固定资产处置申请",
            "dbPath": "Finance/FixedAsset/FixedAssetHandle.nsf",
            "form": "FixedAssetHandleXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_Maintain_fanuc",
            "ico": "",
            "name": "发起固定资产维修申请",
            "dbPath": "Finance/FixedAsset/FixedAssetMaintain.nsf",
            "form": "MainAppPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fadamage_fanuc",
            "ico": "",
            "name": "发起固定资产损失赔偿申请",
            "dbPath": "Finance/FixedAsset/FixedAssetDamage.nsf",
            "form": "FixedAssetDamageXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        },{
            "id": "menuG_CustomerBaseData_Fanuc",
            "ico": "",
            "parentId": "XPAGEFICO",
            "name": "客户主数据"
        },{
            "id": "SalesCreateData",
            "ico": "",
            "name": "发起客户主数据创建申请(销售)",
            "dbPath": "Finance/SalesCreateData.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "SalesModifyData",
            "ico": "",
            "name": "发起客户主数据修改申请(销售)",
            "dbPath": "Finance/SalesModifyData.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "MaintainCreateData",
            "ico": "",
            "name": "发起客户主数据创建申请(维修)",
            "dbPath": "Finance/MaintainCreateData.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "MaintainModifyData",
            "ico": "",
            "name": "发起客户主数据修改申请(维修)",
            "dbPath": "Finance/MaintainModifyData.nsf",
            "form": "MainFormXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "Taxbillannounce",
            "ico": "",
            "name": "发起产品金税发票开票通知流程（北京）",
            "dbPath": "Finance/Taxbillannounce.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "Taxbillannounceforsh",
            "ico": "",
            "name": "发起产品金税发票开票通知流程（上海）",
            "dbPath": "Finance/Taxbillannounceforsh.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "GoldenTaxInvoice",
            "ico": "",
            "name": "发起金税发票（红字、作废）申请流程",
            "dbPath": "Finance/GoldenTaxInvoice.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "OrderModifyApply",
            "ico": "",
            "name": "发起订单修改申请流程",
            "dbPath": "Finance/OrderModifyApply.nsf",
            "form": "mainPage",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "RefundApply",
            "ico": "",
            "name": "发起退款申请流程",
            "dbPath": "Finance/RefundApply.nsf",
            "form": "xpCreate",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "returnofgoods",
            "ico": "",
            "name": "发起客户资料有误、订单金额有误、退货(红字、作废)申请",
            "dbPath": "Finance/returnofgoods.nsf",
            "form": "mainPage", 
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "ITProblemManagement",
            "ico": "",
            "name": "发起IT问题管理申请",
            "dbPath": "Application/ITProblem.nsf",
            "form": "ITProblemXp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "Fanuc_IT"
        }, {
            "id": "ITChangeManagement",
            "ico": "",
            "name": "发起IT变更管理申请",
            "dbPath": "Application/ITChange.nsf",
            "form": "ITChangeXp",
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
		}, {
			"id": "XpageOfficeApp",
			"ico": "",
			"name": "发起IT用品管理",
			"dbPath": "Application/XpageOfficeApp.nsf",
			"form": "ITofficeAppXp",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_IT"
		}, {
	            "id": "DigiFlowBookMng",
	            "ico": "",
	            "name": "发起图书借阅申请",
	            "dbPath": "Application/DigiFlowBookMng.nsf",
	            "form": "psnResAppForm",
	            "source": "MenusListForm",
	            "parentId": "Fanuc_IT"
	    }, {
			"id": "SCBGetMarketPropaganda",
			"ico": "",
			"name": "发起对外宣传资料领用申请",
			"dbPath": "Application/Business/GetMarketPropaganda.nsf",
			"form": "GetMarketPropaPage",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		},{
			"id": "PublicTraining",
			"ico": "",
			"name": "发起公开课培训申请",
			"dbPath": "Application/Business/PublicTraining.nsf",
			"form": "mainformxp",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		},{
			"id": "Publicimplementation",
			"ico": "",
			"name": "发起公开课实施申请",
			"dbPath": "Application/Business/Publicimplementation.nsf",
			"form": "mainformxp",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		},{
			"id": "digiflowkhbf",
			"ico": "",
			"name": "发起客户拜访报告申请",
			"dbPath": "Application/Business/digiflowkhbf.nsf",
			"form": "mainPage",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		},{
			"id": "UserInfoButt",
			"ico": "",
			"name": "发起用户信息表提交申请",
			"dbPath": "Application/Business/UserInfoButt.nsf",
			"form": "UserMainAppXP",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}],
        hotApp: [{
            "id": "root",
            "level": 0
        }, {
            "id": "MENU_YWB",
            "ico": "icon-road",
            "name": "业务部",
            "parentId": "root"
        }, {
            "id": "MENU_XSB",
            "ico": "icon-truck",
            "name": "销售部",
            "parentId": "root"
        }, {
            "id": "MENU_JSB",
            "ico": "icon-gears",
            "name": "技术部",
            "parentId": "root"
        }, {
            "id": "MENU_WXB",
            "ico": "icon-gears",
            "name": "维修部",
            "parentId": "root"
        }, {
            "id": "MENU_GLB",
            "ico": "icon-gears",
            "name": "管理部",
            "parentId": "root"
        }, {
            "id": "XPAGEFICO",
            "ico": "icon-credit-card",
            "name": "财务",
            "parentId": "root"
        }, {
            "id": "Fanuc_IT",
            "ico": "icon-desktop",
            "parentId": "root",
            "name": "IT课"
        }, {
            "id": "Fanuc_SCB",
            "ico": "icon-desktop",
            "parentId": "root",
            "name": "市场部"
        }, {
            "id": "BJGZReport",
            "ico": "",
            "name": "部件故障报告流程",
            "dbPath": "Application/Operation/BuJianGuZhangReport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "BFMProductLoan",
            "ico": "",
            "name": "产品库物料借用申请",
            "dbPath": "Application/Operation/ProductLoan.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YWB_ShipArrNotice",
            "ico": "",
            "name": "装船或到货通知",
            "dbPath": "Application/Operation/ShipmentOrArrivalNotice.nsf",
            "view": "vwDone",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "DF_A_03_01",
            "ico": "",
            "name": "国内部件\\日本资料\\维修部件到货通知",
            "dbPath": "Application/Operation/ArrivalNoticeApp.nsf",
            "view": "ArrivalNoticeDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YYB_YFJS",
            "ico": "",
            "name": "运费结算",
            "dbPath": "Application/Operation/FreightSettlement.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "YWBJB",
            "ico": "",
            "name": "加班请示报告",
            "dbPath": "Application/Operation/OverTimeQSReport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "DeliveryNotice",
            "ico": "",
            "name": "日发货计划下达",
            "dbPath": "Application/Operation/DeliveryNotice.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "InventoryReportnew",
            "ico": "",
            "name": "盘点报告",
            "dbPath": "Application/Operation/InventoryReport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "AdjustOrder",
            "ico": "",
            "name": "订货调整审批",
            "dbPath": "Application/Operation/AdjustOrder.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "PurchaseManagement",
            "ico": "",
            "name": "采购需求管理",
            "dbPath": "Application/Operation/PurchaseManagement.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        },{
            "id": "DirectProductPricing",
            "ico": "",
            "name": "直销产品报价全过程",
            "dbPath": "Application/Operation/DirectProductPricing.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "ProductPriceFlow",
            "ico": "",
            "name": "产品报价全过程",
            "dbPath": "Application/Operation/ProductPriceFlow.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_YWB"
        }, {
            "id": "ss01",
            "ico": "",
            "name": "产品销售合同变更",
            "dbPath": "Application/Business/selconcha.nsf",
            "view": "vwAll",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ss03",
            "ico": "",
            "name": "产品销售欠款申请",
            "dbPath": "Application/Business/salearrearage.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_jzdhsp_fanuc",
            "ico": "",
            "name": "集中订货审批",
            "dbPath": "Application/Business/CentralizedOrderApp.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_jjzjdh_fanuc",
            "ico": "",
            "name": "紧急追加订货",
            "dbPath": "Application/Business/EmergencyAddedOrder.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_xsfhbg_fanuc",
            "ico": "",
            "name": "销售发货变更",
            "dbPath": "Application/Business/SalesDeliveryChanges.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "menu_xsxygd_fanuc",
            "ico": "",
            "name": "销售协议归档",
            "dbPath": "Application/Business/SalesAgreementArchived.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "BFMProductOrder",
            "ico": "",
            "name": "发那科（天津）产品贸易订货流程",
            "dbPath": "Application/Business/DigiFlowProductOrder.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ProQueDel",
            "ico": "",
            "name": "产品异常问题处理",
            "dbPath": "Application/Business/ProQueDel.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ssb03",
            "ico": "",
            "name": "订发货预测数据汇总表",
            "dbPath": "Application/Business/DataSheetCollent.nsf",
            "view": "vwAll",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ssb04",
            "ico": "",
            "name": "订发货预测数据审批表",
            "dbPath": "Application/Business/DataSheetAudit.nsf",
            "view": "vwAll",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "SaleAccSinkTicket",
            "ico": "",
            "name": "销售承兑汇票",
            "dbPath": "Application/Finance/SaleAccSinkTicket.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "ssconfig",
            "ico": "",
            "name": "业务基础数据配置",
            "dbPath": "Application/SellConfig.nsf",
            "view": "MTBConfig",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_XSB"
        }, {
            "id": "DirectSalesOrderReview",
            "ico": "",
            "name": "直销系统订单审核",
            "dbPath": "Application/Business/DirectSalesOrderReview.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "SolvesTechnicalProblems",
            "ico": "",
            "name": "疑难技术问题处理",
            "dbPath": "Application/Business/SolvesTechnicalProblems.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "SAPMDataIntegration1200",
            "ico": "",
            "name": "SAP物料主数据集成1200工厂",
            "dbPath": "Application/Business/SAPMDataIntegration1200.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_JSB"
        }, {
            "id": "repairdocument",
            "ico": "",
            "name": "维修技术文档管理",
            "dbPath": "Application/Services/repairdocument.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "DealServiceManager",
            "ico": "",
            "name": "服务协议管理",
            "dbPath": "Application/Services/DealServiceManager.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "payafterarrival",
            "ico": "",
            "name": "先发货后付款申请",
            "dbPath": "Application/Services/payafterarrival.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Repairtechsupport",
            "ico": "",
            "name": "维修技术支持",
            "dbPath": "Application/Services/Repairtechsupport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "sparepartssalesprice",
            "ico": "",
            "name": "备件销售价格优惠申请",
            "dbPath": "Application/Services/sparepartssalesprice.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Spotservicediscount",
            "ico": "",
            "name": "现场服务价格优惠申请",
            "dbPath": "Application/Services/Spotservicediscount.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "Sparepartsrepairprice",
            "ico": "",
            "name": "备件修理价格优惠申请",
            "dbPath": "Application/Services/Sparepartsrepairprice.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_WXB"
        }, {
            "id": "WeekWordSummary",
            "ico": "",
            "name": "周工作总结",
            "dbPath": "Application/WeekWordSummary.nsf",
            "view": "AppDoneView",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "officeBerNumApp",
            "ico": "",
            "name": "办公号码申请",
            "dbPath": "Application/officeBerNumApp.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "BusinessCardApp",
            "ico": "",
            "name": "名片申请",
            "dbPath": "Application/BusinessCardApp.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowMeetingRoomMng",
            "ico": "",
            "name": "会议管理",
            "dbPath": "Application/DigiFlowMeetingRoomMng.nsf",
            "view": "MeetingAppDoingView",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowMeetingRoomMng01",
            "ico": "",
            "name": "会议纪要管理",
            "dbPath": "Application/DigiFlowMeetingRoomMng.nsf",
            "view": "MFormDoingView",
            "source": "MenusListForm",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowOfficeMan",
            "ico": "",
            "name": "办公用品管理",
            "dbPath": "Application/DigiFlowOfficeMan.nsf",
            "view": "vwDoingForGoodRec",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "digflowjdsq",
            "ico": "",
            "name": "接待申请",
            "dbPath": "Application/digflowjdsq.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "DigiFlowGiftMan",
            "ico": "",
            "name": "礼品领用",
            "dbPath": "Application/DigiFlowGiftMan.nsf",
            "view": "vwDoingForGoodRec",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "officeresourceborrow",
            "ico": "",
            "name": "办公资源借用",
            "dbPath": "Application/officeresourceborrow.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "MENU_GLB"
        }, {
            "id": "ProjectManagement",
            "ico": "",
            "parentId": "MENU_GLB",
            "name": "项目管理"
        }, {
            "id": "ProUsersApp",
            "ico": "",
            "name": "01.项目主要成员任命",
            "dbPath": "Application/ProUsersApp.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectTrial",
            "ico": "",
            "name": "02.项目立项初审",
            "dbPath": "Application/ProjectTrial.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "PreImplementationPR",
            "ico": "",
            "name": "03.项目实施立项申请报告",
            "dbPath": "Application/PreImplementationPR.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProSupplierReview",
            "ico": "",
            "name": "04.项目供应商评审",
            "dbPath": "Application/ProSupplierReview.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProAchievementEva",
            "ico": "",
            "name": "05.项目成果评审",
            "dbPath": "Application/ProAchievementEva.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProMilestoneAR",
            "ico": "",
            "name": "06.项目里程碑阶段性成果评审",
            "dbPath": "Application/ProMilestoneAR.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProAdminJHBGYS",
            "ico": "",
            "name": "07.项目管理计划/变更/预算",
            "dbPath": "Application/ProAdminJHBGYS.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectAchievementsReport",
            "ico": "",
            "name": "08.项目绩效报告",
            "dbPath": "Application/ProjectAchievementsReport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProjectTmAchievements",
            "ico": "",
            "name": "09.项目团队绩效",
            "dbPath": "Application/ProjectTmAchievements.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "ProDocAdmin",
            "ico": "",
            "name": "10.项目文档管理",
            "dbPath": "Application/ProDocAdmin.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "ProjectManagement"
        }, {
            "id": "UsefundsEarly_MainPage",
            "ico": "",
            "name": "资金提前使用",
            "dbPath": "Finance/UsefundsEarly.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "DF_A_04_16",
            "ico": "",
            "name": "再评估预算执行流程",
            "dbPath": "Finance/ReEvaluateBudget.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "OutOfBudget",
            "ico": "",
            "name": "预算外申请",
            "dbPath": "Finance/OutOfBudget.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "CHUCHAI",
            "ico": "",
            "parentId": "XPAGEFICO",
            "name": "出差申请"
        }, {
            "id": "TechnicEvecReport",
            "ico": "",
            "name": "技术部出差报告",
            "dbPath": "Finance/TechnicEvecReport.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TechnicEvecApp",
            "ico": "",
            "name": "技术部出差申请",
            "view": "vwDoing",
            "dbPath": "Finance/TechnicEvecApp.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TravelApplicationOfFinance",
            "ico": "",
            "name": "出差申请（通用）",
            "view": "vwDoing",
            "dbPath": "Finance/TravelApplicationOfFinance.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "TravelApplicationOfMaintenance",
            "ico": "",
            "name": "出差申请（现场维修）",
            "view": "vwDoing",
            "dbPath": "Finance/TravelApplicationOfMaintenance.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "CHUCHAI"
        }, {
            "id": "BFMLoanFund",
            "ico": "",
            "name": "借款审批流程",
            "dbPath": "Finance/LoanFunds.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "DF_A_04_cl",
            "ico": "",
            "name": "差旅费报销申请",
            "dbPath": "Finance/TravelReim.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "EntertainmentReim",
            "ico": "",
            "name": "业务招待费报销",
            "dbPath": "Finance/EntertainmentReim.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "LostInvoiceApp",
            "ico": "",
            "name": "发票丢失申请",
            "dbPath": "Finance/LostInvoiceApp.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "AccruedExpenses_MainFormXp",
            "ico": "",
            "name": "费用计提", 
            "dbPath": "Finance/AccruedExpenses.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "BUDGETQUERY",
            "ico": "",
            "name": "预算查询",
            "url": "/Finance/DigiFlowBudgetManager.nsf/BudgetQueryForm.xsp",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "source": "",
            "formName": "",
            "id": "GONGYINGSHANG",
            "url": "",
            "form": "",
            "view": "",
            "dbPath": "/",
            "ico": "",
            "parentId": "XPAGEFICO",
            "server": "",
            "name": "供应商付款"
        }, {
            "id": "BFMSPD",
            "ico": "",
            "name": "供应商付款(贸易(国内)_付款)",
            "dbPath": "Finance/SPTradPayDomestic.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "SPTradePay",
            "ico": "",
            "name": "供应商付款(贸易_国外付款)",
            "dbPath": "Finance/SPTradePay.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "FixedAssetsAdvance",
            "ico": "",
            "name": "供应商付款(固资_预付)",
            "dbPath": "Finance/FixedAssetsAdvance.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "FixedAssetsPay",
            "ico": "",
            "name": "供应商付款(固资_付款)",
            "dbPath": "Finance/FixedAssetsPay.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "BFMSPTradProcureSurcharge",
            "ico": "",
            "name": "供应商付款（贸易_采购附加费）",
            "dbPath": "Finance/SPTradProcureSurcharge.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "id": "YFTradePay",
            "ico": "",
            "name": "供应商付款(费用-预付)",
            "dbPath": "Finance/YFTradePay.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "GONGYINGSHANG"
        }, {
            "source": "",
            "formName": "",
            "id": "HUAIZHANG",
            "url": "",
            "form": "",
            "view": "",
            "dbPath": "/",
            "ico": "",
            "parentId": "XPAGEFICO",
            "server": "",
            "name": "坏账相关"
        }, {
            "id": "BadFinanceLoss",
            "ico": "",
            "name": "坏账损失审批",
            "dbPath": "Finance/BadFinanceLoss.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "DF_A_04_09",
            "ico": "",
            "name": "坏账计提申请",
            "dbPath": "Finance/BadDebtsProvision.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "GatherBadAccrual",
            "ico": "",
            "name": "坏账计提汇总审批",
            "dbPath": "Finance/GatherBadAccrual.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "HUAIZHANG"
        }, {
            "id": "menuG_FixedAsset_Fanuc",
            "ico": "",
            "parentId": "XPAGEFICO",
            "name": "固定资产"
        }, {
            "id": "menu_fixedasset_fanuc",
            "ico": "",
            "name": "固定资产卡片",
            "dbPath": "Finance/FixedAsset/FixedAssetCard.nsf",
            "view": "OtherCardView",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_faPurchase_fanuc",
            "ico": "",
            "name": "固定资产申购",
            "dbPath": "Finance/FixedAsset/FixedAssetPurchase.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_faAcceptance_fanuc",
            "ico": "",
            "name": "固定资产验收",
            "dbPath": "Finance/FixedAsset/FixedAssetAcceptance.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fadiaobo_fanuc",
            "ico": "",
            "name": "固定资产调拨转移",
            "dbPath": "Finance/FixedAsset/FixedAssetChange.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_borrow_fanuc",
            "ico": "",
            "name": "固定资产借用",
            "view": "vwDoing",
            "dbPath": "Finance/FixedAsset/FixedAssetBorrow.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_return_fanuc",
            "ico": "",
            "name": "固定资产归还",
            "view": "vwDoing",
            "dbPath": "Finance/FixedAsset/FixedAssetReturn.nsf",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fahandle_fanuc",
            "ico": "",
            "name": "固定资产处置",
            "dbPath": "Finance/FixedAsset/FixedAssetHandle.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_Maintain_fanuc",
            "ico": "",
            "name": "固定资产维修",
            "dbPath": "Finance/FixedAsset/FixedAssetMaintain.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        }, {
            "id": "menu_fadamage_fanuc",
            "ico": "",
            "name": "固定资产损失赔偿",
            "dbPath": "Finance/FixedAsset/FixedAssetDamage.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_FixedAsset_Fanuc"
        },{
            "id": "menuG_CustomerBaseData_Fanuc",
            "ico": "",
            "parentId": "XPAGEFICO",
            "name": "客户主数据"
        }, {
            "id": "SalesCreateData",
            "ico": "",
            "name": "客户主数据创建(销售)",
            "dbPath": "Finance/SalesCreateData.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        }, {
            "id": "SalesModifyData",
            "ico": "",
            "name": "客户主数据修改(销售)",
            "dbPath": "Finance/SalesModifyData.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "MaintainCreateData",
            "ico": "",
            "name": "客户主数据创建(维修)",
            "dbPath": "Finance/MaintainCreateData.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "MaintainModifyData",
            "ico": "",
            "name": "客户主数据修改(维修)",
            "dbPath": "Finance/MaintainModifyData.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "CustomerBaseDataConfig",
            "ico": "",
            "name": "客户主数据基础数据配置(销售)",
            "dbPath": "Finance/CustomerBaseData.nsf",
            "view": "vwSubjectGroup",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "CustomerBaseDataService",
            "ico": "",
            "name": "客户主数据基础数据配置(维修)",
            "dbPath": "Finance/CustomerBaseDataService.nsf",
            "view": "vwSubjectGroup",
            "source": "menuInfoXAgent.xsp",
            "parentId": "menuG_CustomerBaseData_Fanuc"
        },{
            "id": "Taxbillannounce",
            "ico": "",
            "name": "产品金税发票开票通知（北京）",
            "dbPath": "Finance/Taxbillannounce.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "Taxbillannounceforsh",
            "ico": "",
            "name": "产品金税发票开票通知（上海）",
            "dbPath": "Finance/Taxbillannounceforsh.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "GoldenTaxInvoice",
            "ico": "",
            "name": "金税发票（红字、作废）申请",
            "dbPath": "Finance/GoldenTaxInvoice.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "OrderModifyApply",
            "ico": "",
            "name": "订单修改申请",
            "dbPath": "Finance/OrderModifyApply.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "RefundApply",
            "ico": "",
            "name": "退款申请",
            "dbPath": "Finance/RefundApply.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "returnofgoods",
            "ico": "",
            "name": "客户资料有误、订单金额有误、退货(红字、作废)流程",
            "dbPath": "Finance/returnofgoods.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "XPAGEFICO"
        }, {
            "id": "ITProblemManagement",
            "ico": "",
            "name": "IT问题管理",
            "dbPath": "Application/ITProblem.nsf",
            "view": "vwDoing",
            "source": "menuInfoXAgent.xsp",
            "parentId": "Fanuc_IT"
        }, {
            "id": "ITChangeManagement",
            "ico": "",
            "name": "IT变更管理",
            "dbPath": "Application/ITChange.nsf",
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
		}, {
			"id": "XpageOfficeApp",
			"ico": "",
			"name": "IT用品管理",
			"dbPath": "Application/XpageOfficeApp.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_IT"
		}, {
			"id": "DigiFlowBookMng",
			"ico": "",
			"name": "图书管理",
			"dbPath": "Application/DigiFlowBookMng.nsf",
			"view": "ResAppInfoDoingView",
			"source": "MenusListForm",
			"parentId": "Fanuc_IT"
	    }, {
			"id": "SCBGetMarketPropaganda",
			"ico": "",
			"name": "对外宣传资料领用",
			"dbPath": "Application/Business/GetMarketPropaganda.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}, {
			"id": "PublicTraining",
			"ico": "",
			"name": "公开课培训申请",
			"dbPath": "Application/Business/PublicTraining.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}, {
			"id": "Publicimplementation",
			"ico": "",
			"name": "公开课培训实施",
			"dbPath": "Application/Business/Publicimplementation.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}, {
			"id": "digiflowkhbf",
			"ico": "",
			"name": "客户拜访报告",
			"dbPath": "Application/Business/digiflowkhbf.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}, {
			"id": "UserInfoButt",
			"ico": "",
			"name": "用户信息表提交",
			"dbPath": "Application/Business/UserInfoButt.nsf",
			"view": "vwDoing",
			"source": "menuInfoXAgent.xsp",
			"parentId": "Fanuc_SCB"
		}],
        "switch": [{
            "id": "root",
            "level": 0
        }, {
            "id": "company",
            "name": "协同首页",
            "ico": "icon-building",
            "opt": "digishell.theme.switchConfig('company')",
            "parentId": "root"
        }, {
            "id": "www_Home",
            "name": "公司首页",
            "ico": "icon-globe",
            "opt": "window.open('http://www.bj-fanuc.com.cn','_blank')",
            "parentId": "root"
        }, {
            "id": "hrsystem",
            "name": "HR系统",
            "ico": "icon-group",
            "opt": "window.open('/Produce/DigiFlowSynchronizeData.nsf/xpHRLogin.xsp','_blank')",
            "parentId": "root"
        }, {
            "id": "OA_HOME",
            "name": "OA首页",
            "ico": "icon-map-marker",
            "opt": "window.open('http://oa.bj-fanuc.com.cn','_blank')",
            "parentId": "root"
        }]
    };

    function convertItemsToBreadcrumb(items, item) {
        var info = [{
            href: item.get("href"),
            name: item.get("name")
        }];
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
            case "config":
                return "icon-cog";
        }
        return className || "";
    }
    var BaseMenuItems = Backbone.Collection.extend({
        type: "",
        source: null,
        initialize: function(models, options) {
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
        url: function() {
            return "/Produce/DigiShell.nsf/getMenuDataXAgent.xsp?parent=root&type=" + this.type;
        }
    });
    var AppMenuItems = BaseMenuItems.extend({
        parse: function(response, options) {
            var menuData = [{
                "id": "root",
                "level": 0
            }],
                _this = this;
            if (options.dataType === "text") {
                var menuXml = /.+<[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa] id="MenuXmlList" style="display:none">(.+?)<\/[Tt][Ee][Xx][Tt][Aa][Rr][Ee][Aa]>.*/.exec(response.replace(/\n|\r/g, ""))[1].replace(/&/g, "&amp;"),
                    urlParamParser = function(url) {
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
                        if (paramInfo.page) {
                            paramInfo.page = parseInt(paramInfo.page, 0);
                        }
                        return paramInfo;
                    }, menuXmlParser = function(menuNodes, parentId) {
                        var result = [];
                        menuNodes.each(function(index) {
                            var node = $(this),
                                item = {
                                    id: node.attr("id") || (parentId === "root" ? "" : parentId + "_") + index,
                                    name: node.attr("name"),
                                    ico: convertIconClassName(node.attr("ico")),
                                    lazy: !! node.attr("lazy"),
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
                            lazy: !! item.lazy
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
        initialize: function() {
            this.model = siteMapSource.clone();
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
                    this.$el.trigger("select", [item, this.model.where({
                        selected: true
                    })]);
                }
            }
        },
        getItem: function(id, callback) {
            var item = this.model.get(id),
                _this = this;
            if (!item) {
                this.model.fetch({
                    success: function() {
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
        getMapItems: function(model, filter) {
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
        },
        openItem: function(item, event) {
            getMenu(this.mode).openItem(item, event);
        },
        itemTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><a class="inline" href="#m_<%=mode%>/<%=info.id%>"><i class="<%=info.ico%>"></i><%=mode==="hotApp"?info.name:info.formName%></a></li><%});%></ul></div></div><div class="space-4"></div>'),
        itemSelectTemplate: _.template('<div class="widget-box" data-index="<%=index%>"><div class="widget-header"><h5 class="widget-title"><i class="<%=ico%>"></i><%=name%></h5><div class="widget-toolbar"><a href="#" data-action="collapse"><i class="icon-chevron-up"></i></a></div></div><div class="widget-body"><ul class="item-list"><%_.each(children,function(child){var info = child.attributes;%><li class="item-none"><label class="inline"><input type="checkbox" class="ace" <%=info.selected?"checked":""%>/><span class="lbl"><%=mode==="hotApp"?info.name:info.formName%></span></label></li><%});%></ul></div></div><div class="space-4"></div>'),
        refresh: function(options) {
            var _this = this;
            this.mode = options.mode;
            this.selectable = options.selectable;
            this.$el.empty().html("<div class='span4'></div><div class='span4'></div><div class='span4'></div>");
            if (this.model.length === 0) {
                this.model.fetch({
                    success: function() {
                        _this.render(options);
                    }
                });
            } else {
                this.render(options);
            }
            return this;
        },
        render: function(options) {
            var placeTarget = this.$el.find("> div"),
                _this = this;
            if (options.selected) {
                options.selected.each(function(item) {
                    var storeItem = _this.model.get(item.id);
                    if (storeItem) {
                        storeItem.set("selected", true);
                    }
                });
            }
            this.mapItems = this.getMapItems(this.model, options.filter);
            _.each(this.mapItems, function(item, index) {
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
        initialize: function() {
            var _this = this;
            this.model = new BaseMenuItems(util.localConfig(this.id + "Config") || DEFAULT_MENU[this.id], {
                type: this.id
            });
            this.render("root");
            $("#" + this.id + "Menu").append(this.el);
            if ("eval_callback" in window) {
                this.$el.find("a").click(function(event) {
                    _this.sideMenuClick.call(_this, event);
                });
            }
        },
        sideMenuClick: function(event) {
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
                    success: function(response) {
                        _this.model.add(_.map(response, function(child, index) {
                            child.id = child.id || item.id + "_" + index;
                            child.ico = child.ico || "";
                            child.dbPath = _this.source.dbPath;
                            child.lazy = !! child.lazy;
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
        getItem: function(id, callback) {
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
        getItemByLink: function(link) {
            return this.model.get(/#\S+\/(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function(id) {
            return this.$el.find("[href='#m_" + this.id + "/" + id + "']");
        },
        activeItem: function(item) {
            var link = this.getLinkById(item.id);
            if (this.activeItemNode) {
                this.activeItemNode.removeClass("active").removeClass("open");
            }
            link.parent("li").parents("li").addClass("open");
            this.activeItemNode = link.parents("li").addClass("active");
        },
        openItem: function(item, event) {
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
        getMenuNode: function(parentId) {
            var html = "";
            var level = this.model.get(parentId).get("level") + 1,
                children = this.model.where({
                    parentId: parentId
                });
            if (children.length > 0) {
                for (var n = 0, child; child = children[n++];) {
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
            //TODO 待实现延迟渲染
            (parentId !== "root" ? this.$el.find("a.dropdown-toggle[href='" + this.getHref({
                id: parentId
            }) + "']").parent().find(".submenu") : this.$el).empty().append(this.getMenuNode(parentId));
        }
    });
    moduleCache.hotForm = BaseMenu.extend({
        id: "hotForm",
        initialize: function() {
            BaseMenu.prototype.initialize.apply(this, arguments);
        },
        openMore: function() {
            $(".page-content >.active").removeClass("active");
            var $siteMapNode = $(".page-content .siteMap").addClass("active");
            var siteMap = getSiteMap({
                el: $siteMapNode[0]
            }).refresh({
                mode: this.id,
                filter: function(item) {
                    return item.get("form") && item.get("formName");
                }
            });
        }
    });
    moduleCache.hotApp = BaseMenu.extend({
        id: "hotApp",
        initialize: function() {
            BaseMenu.prototype.initialize.apply(this, arguments);
        },
        openMore: function() {
            $(".page-content >.active").removeClass("active");
            var $siteMapNode = $(".page-content .siteMap").addClass("active");
            var siteMap = getSiteMap({
                el: $siteMapNode[0]
            }).refresh({
                mode: this.id
            });
        },
        openItem: function(item, event) {
            var _this = this;
            if (item.get("view")) {
                var appMenu = openMenu("app");
                appMenu.setSource({
                    dbPath: item.get("dbPath"),
                    source: item.get("source") || "MenusListForm?OpenForm"
                }).getItemByView(item.get("view"), function(appItem) {
                    digishell.router.navigate("#m_" + _this.id + "/" + item.id + "/a_" + appItem.id, {
                        replace: true,
                        trigger: true
                    });
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
        initialize: function() {
            this.model = new AppMenuItems([], {
                type: this.id
            });
            $("#appMenu").append(this.el);
        },
        setSource: function(source) {
            if (this.source && source.dbPath !== this.source.dbPath) {
                //TODO 解决切换应用时不加载新菜单的问题，考虑更为优秀的方案
                this.model.reset([]);
            }
            this.source = source;
            this.isXsp = source.source.indexOf(".xsp") !== -1;
            return this;
        },
        getItemByLink: function(link) {
            return this.model.get(/#\S+\/a_(\S+)/.exec(link.attr("href"))[1]);
        },
        getLinkById: function(id) {
            return this.$el.find("[href='" + menuHrefGetter.exec(location.href)[1] + "/a_" + id + "']");
        },
        getItem: function(id, callback) {
            var item = this.model.get(id),
                _this = this;
            if (!item) {
                this.model.fetch(_.extend((this.isXsp ? {} : {
                    dataType: "text"
                }), {
                    url: "/" + this.source.dbPath + "/" + this.source.source,
                    reset: true,
                    success: function() {
                        BaseMenu.prototype.getItem.apply(_this, [id, callback]);
                    }
                }));
                return;
            }
            BaseMenu.prototype.getItem.apply(this, [id, callback]);
        },
        getItemByView: function(view, callback) {
            var _this = this,
                item = this.model.where({
                    view: view
                });
            if (!item[0]) {
                this.model.fetch(_.extend((this.isXsp ? {} : {
                    dataType: "text"
                }), {
                    url: "/" + this.source.dbPath + "/" + this.source.source,
                    reset: true,
                    success: function() {
                        item = _this.model.where({
                            view: view
                        });
                        if (item[0]) {
                            _this.getItem(item[0].id, callback);
                        }
                    },
                    error: function(items, resp, options) {
                        //判断是否无权限或登录超时，TODO未来将使用AJAX登录机制解决该问题
                        if (resp.responseText.indexOf("<!DOCTYPE HTML PUBLIC") === 0 && resp.responseText.indexOf('<input name="RedirectTo" value="' + options.url + '" type=hidden>') !== -1) {
                            alert("无法打开应用，请重新登录");
                            location.href = "/names.nsf?login";
                        }
                    }
                }));
            } else {
                this.getItem(item[0].id, callback);
            }
        },
        getHref: function(child) {
            return menuHrefGetter.exec(location.href)[1] + "/a_" + child.id;
        },
        openItem: function(item, event) {
            var _this = this;
            if (item.get("view")) {
                require.async("./viewFrame", function(frame) {
                    digishell.router.makeBreadcrumb(convertItemsToBreadcrumb(_this.model, item), "APP");
                    frame.openView(item.attributes);
                    _this.render("root");
                    _this.activeItem(item);
                    if ("eval_callback" in window) {
                        _this.$el.find("a").click(function(event) {
                            _this.sideMenuClick.call(_this, event);
                        });
                    }
                });
            } else {
                BaseMenu.prototype.openItem.apply(this, [item, event]);
            }
        }
    });
    var getMenu = function(id, options) {
        return menuCache[id] ? menuCache[id] : (menuCache[id] = new moduleCache[id](options));
    };
    var getSiteMap = (function() {
        var singleton = null;
        return function(option) {
            if (option.create) {
                return new SiteMap(option);
            } else {
                return singleton ? singleton : singleton = new SiteMap(option);
            }
        };
    })();
    var activeMenu = function(menu) {
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
        $("#sidebar-shortcuts").children().on('show', function(event) {
            $(event.currentTarget).find(".active").removeClass("active");
            $(event.target).addClass("active");
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
    exports.getSiteMap = getSiteMap;
});