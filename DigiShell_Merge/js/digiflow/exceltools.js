(function(factory) {
    if (typeof define === "function" && define.cmd) {
        define(function(require) {
            require("gritter");
            return factory(require("jquery"));
        });
    } else {
        //当未有JSON支持时，引入json2
        if (typeof JSON === "undefined") {
            $("head").append("<script type='text/javascript' src='/sea-modules/json2/json2.js'></script>");
        }
        $(function() {
            ("digiflow" in window ? window["digiflow"] : window.digiflow = {}).exceltools = factory(jQuery);
        });
    }
})(function($) {
    var uploadCallback = null;
    var content = $("<div></div>").appendTo(document.body);
    //获取浏览器信息
    var browserInfo = /.+?MSIE ([^;]+);.*/.exec(navigator.userAgent);
    var exportIframe = $('<iframe id="excelToolsExportIframe" name="excelToolsExportIframe" style="display: none"></iframe>').appendTo(content);
    var exportForm = $('<form action="/Produce/DigiShell.nsf/excelExportXAgent.xsp" method="post" target="excelToolsExportIframe" style="display: none"><input id="method" name="method" type="text"/><textarea id="excelData" name="excelData"></textarea><input id="params" name="params" type="text"/></form>').appendTo(content);
    var importIframe = null, importForm = null, file = null;
    var initImport = function() {
        importIframe = $('<iframe id="excelToolsImportIframe" name="excelToolsImportIframe" style="display: none"></iframe>').appendTo(content);
        //根据浏览器类型（IE9以下），将form插入到不同位置
        importForm = $('<form action="/Produce/DigiShell.nsf/excelImportXAgent.xsp" method="post" target="excelToolsImportIframe" style="display: none" enctype="multipart/form-data" encoding="multipart/form-data"><input id="method" name="method" type="text"/><input id="params" name="params" type="text"/><input id="excelUploader" name="excelUploader" type="file"></form>').appendTo(browserInfo && parseInt(browserInfo[1], 0) < 9 ? importIframe : content);
        //Excel导入控件
        file = $("#excelUploader", importForm).on("change", function() {
            //判断是否2003格式的Excel文件
            var fileName = this.value;
            var extName = fileName.substring(fileName.lastIndexOf(".") + 1);
            if (extName !== "xls") {
                if ($.isFunction($.gritter)) {
                    $.gritter.add({
                        title: "提示",
                        text: "请选择Excel文件",
                        time: 1500,
                        class_name: "gritter-center gritter-info"
                    });
                } else if (window.digiflow && $.isFunction(digiflow.alert)) {
                    digiflow.alert("请选择Excel文件");
                } else {
                    alert("请选择Excel文件");
                }
                clearImport();
                return false;
            }
            var flag = null;
            while (!flag) {
                try {
                    flag = importForm.submit();
                } catch (e) {}
            }
        });
        //监听postMessage
        $(window).on("message", function(event) {
            var frameWindow = null;
            try {
                //IE10有可能出现问题，处理之
                frameWindow = importIframe[0].contentWindow;
            } catch (e) {}
            //正常情况下，再判断下消息来源
            if (!frameWindow || event.originalEvent.source === frameWindow) {
                if ($.isFunction(uploadCallback)) {
                    uploadCallback(JSON.parse(event.originalEvent.data));
                }
            }
            clearImport();
        });
    }, clearImport = function() {
        //清理导入组件
        try {
            file.remove();
            importForm.remove();
        } catch (e) {}
        importIframe.remove();
        uploadCallback = null;
    };
    return {
        /**
         * 创建一个导入按钮
         * @param selector {String} 选择器
         * @param action {String} 执行方法名，为"importToArray"或"importToMap"
         * @param define {Object} Excel定义参数
         * @param callback {Function} 回调函数
         */
        makeUploader: function(selector, action, define, callback) {
            var _this = this;
            $(selector).data("define", define).on("click", function() {
                _this[action]($(this).data("define"), callback);
            });
        },
        /**
         * 导入Excel输出为数组
         * @param param {Object} Excel定义参数
         * @param callback {Function} 回调函数
         */
        importToArray: function(param, callback) {
            initImport();
            $("#method", importForm).val("toArrayJson");
            $("#params", importForm).val(JSON.stringify(param));
            uploadCallback = callback;
            file.click();
        },
        /**
         * 导入Excel为Map
         * @param param {Object} Excel定义参数
         * @param callback {Function} 回调函数
         */
        importToMap: function(param, callback) {
            initImport();
            $("#method", importForm).val("toMapJson");
            $("#params", importForm).val(JSON.stringify(param));
            uploadCallback = callback;
            file.click();
        },
        /**
         * 导出视图内容为Excel
         * @param {} param 导出参数，为
         * {
         *  dbPath:"",
         *  view:"",
         *  columns:[],
         *  start:0,
         *  size:-1,
         *  key:"",
         *  category:""
         * }
         */
        exportView: function(param) {
            param = $.extend({
                start: 0,
                size: -1,
                fileName: param.dbPath.replace(/\//g, "_") + "_" + param.view
            }, param);
            $("#method", exportForm).val("view");
            $("#params", exportForm).val(JSON.stringify(param));
            exportForm.submit();
        },
        /**
         * 将数组导出为Excel
         * @param {Array} data 导出数据，为字符串二维数组
         * @param {Array} title 表头
         * @param {String} [fileName] 导出文件名
         */
        exportArray: function(data, title, fileName) {
            var param = {
                data: data,
                title: title,
                fileName: fileName || "ExportExcel"
            };
            $("#method", exportForm).val("array");
            $("#params", exportForm).val(JSON.stringify(param));
            exportForm.submit();
        },
        /**
         * 将JSON对象数组导出为Excel
         * @param {String|Object} data JSON对象数组字符串或对象，如[{"a":1},{"a":2}]
         * @param {Array} title 表头，如为null，则取JSON的Key值作为
         * @param fileName
         */
        exportJSON: function(data, title, fileName) {
            var param = {
                data: typeof data === "string" ? data : JSON.stringify(data),
                title: title,
                fileName: fileName || "ExportExcel"
            };
            $("#method", exportForm).val("JSON");
            $("#params", exportForm).val(JSON.stringify(param));
            exportForm.submit();
        }
    };
});