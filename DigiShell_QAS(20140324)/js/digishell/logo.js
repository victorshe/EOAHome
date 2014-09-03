define(function (require) {

    var Backbone = require("backbone"),
        _ = require("underscore"),
        config = _.extend({
            speed: 500,
            delay: 5000,
            height: $(".navbar-banner").height(),
            isExpan: true
        }, Backbone.Events);

    function controlBanner(event) {
        config.isExpan = !config.isExpan;
        $(".navbar-banner-control").toggleClass("navbar-banner-control-collapse").find("i").get(0).className = "icon-caret-" + (config.isExpan ? "up" : "down");
        controlMainContainer();
        $(".navbar-banner").slideToggle(this.speed, function () {
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

    $(".navbar-banner-control a").click(controlBanner);

    $(function () {
        //setTimeout(controlBanner, config.delay);
        controlMainContainer();

        $(window).scroll(function () {
            var handle;
            return function () {
                if (handle)clearTimeout(handle);
                handle = setTimeout(function () {
                    if ($(window).scrollTop() > 100) {
                        $("#btn-scroll-up").fadeIn(150);
                    } else {
                        $("#btn-scroll-up").fadeOut(150);
                    }
                }, 50);
            };
        }());
    });

    return config;
});
