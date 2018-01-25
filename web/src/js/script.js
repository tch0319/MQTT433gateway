$(function () {
    var DEBUG_FLAGS = {
        protocolRaw: "Enable Raw RF message logging",
        systemLoad: "Show the processed loop() iterations for each second",
        freeHeap: "Show the free heap memory every second"
    };

    function logLevelInputFactory(item) {
        return '<label for="config-' + item.name + '">' + item.name + '</label>' +
            '<select class="config-item" id="config-' + item.name + '" name="' + item.name + '">' +
            '<option value="">None</option>' +
            '<option value="error">Error</option>' +
            '<option value="warning">Warning</option>' +
            '<option value="info">Info</option>' +
            '<option value="debug">Debug</option>' +
            '</select>' +
            '<span class="pure-form-message">' + item.help + '</span>';
    }

    function inputFieldFactory(item) {
        return '<label for="config-' + item.name + '">' + item.name + '</label>' +
            '<input type="text" class="pure-input-1 config-item" id="config-' + item.name + '" name="' + item.name + '">' +
            '<span class="pure-form-message">' + item.help + '</span>';
    }

    function passwordFieldFactory(item) {
        return '<label for="config-' + item.name + '">' + item.name + '</label>' +
            '<input type="password" class="pure-input-1 config-item" id="config-' + item.name + '" name="' + item.name + '">' +
            '<span class="pure-form-message">' + item.help + '</span>';
    }

    function checkboxFactory(item) {
        return '<label class="pure-checkbox">' +
            '<input type="checkbox" class="config-item" id="config-' + item.name + '" name="' + item.name + '"> ' +
            item.name +
            '<span class="pure-form-message">' + item.help + '</span>' +
            '</label>';
    }

    function legendFactory(item) {
        return '<legend>' + item.name + '</legend>';
    }

    function protocolInputField(item) {
        return '<div id="config-' + item.name + '" class="pure-g"></div>';
    }

    function inputApply(itemName, data) {
        $('#config-' + itemName).val(data);
    }

    function checkboxApply(itemName, data) {
        $('#config-' + itemName).prop("checked", data);
    }

    function protocolApply(itemName, data) {
        function fillProtocolData(protos) {
            $("#config-rfProtocols").empty();
            protos.forEach(function (value) {
                var elem = '<div class="pure-u-1 pure-u-md-1-2 pure-u-lg-1-3 pure-u-xl-1-4"><label class="pure-checkbox">' +
                    '<input type="checkbox" class="config-item protocols-item" id="config-proto-' + value + '"name="' + itemName + '" value="' + value + '">' +
                    ' Protocol ' + value +
                    '</label></div>';
                $("#config-rfProtocols").append(elem);
                registerConfigUi('#config-proto-' + value);
            });
            if (data.length == 0) {
                data = protos;
            }
            data.forEach(function (value) {
                $('#config-proto-' + value).prop('checked', true);
            });
        }

        $.ajax({
                   url: "/protocols",
                   type: "GET",
                   contentType: 'application/json',
                   success: fillProtocolData
               });
    }

    function inputGet(itemName) {
        return $('#config-' + itemName).val();
    }

    function passwordGet(itemName) {
        var pwd = $('#config-' + itemName).val();
        if (pwd.length < 8) {
            alert("Password must have at least 8 characters");
            return undefined;
        }
        return pwd;
    }

    function inputGetInt(itemName) {
        return parseInt(inputGet(itemName));
    }

    function checkboxGet(itemName) {
        return $('#config-' + itemName).prop("checked");
    }

    function protocolGet(itemName) {
        var checked = $('.protocols-item:checked');
        if ($('.protocols-item').length === checked.length) {
            return [];
        }
        return $.map(checked, function (x) {
            return $(x).val();
        });
    }

    function ConfigItem(name, factory, apply, fetch, help) {
        this.name = name;
        this.factory = factory;
        this.apply = apply;
        this.fetch = fetch;
        this.help = help;
    }

    function GroupItem(name, factory) {
        this.name = name;
        this.factory = factory;
    }

    var CONFIG_ITEMS = [
        new GroupItem("General Config", legendFactory),
        new ConfigItem("deviceName", inputFieldFactory, inputApply, inputGet, "The general name of the device"),
        new ConfigItem("configPassword", passwordFieldFactory, inputApply, passwordGet, "The admin password for the web UI (min. 8 characters)"),

        new GroupItem("MQTT Config", legendFactory),
        new ConfigItem("mqttBroker", inputFieldFactory, inputApply, inputGet, "MQTT Broker host"),
        new ConfigItem("mqttBrokerPort", inputFieldFactory, inputApply, inputGetInt, "MQTT Broker port"),
        new ConfigItem("mqttUser", inputFieldFactory, inputApply, inputGet, "MQTT username (optional)"),
        new ConfigItem("mqttPassword", passwordFieldFactory, inputApply, inputGet, "MQTT password (optional)"),
        new ConfigItem("mqttRetain", checkboxFactory, checkboxApply, checkboxGet, "Retain MQTT messages"),

        new GroupItem("MQTT Topic Config", legendFactory),
        new ConfigItem("mqttReceiveTopic", inputFieldFactory, inputApply, inputGet, "Topic to publish received signal"),
        new ConfigItem("mqttSendTopic", inputFieldFactory, inputApply, inputGet, "Topic to get signals to send from"),

        new GroupItem("433MHz RF Config", legendFactory),
        new ConfigItem("rfEchoMessages", checkboxFactory, checkboxApply, checkboxGet, "Echo sent rf messages back"),
        new ConfigItem("rfReceiverPin", inputFieldFactory, inputApply, inputGetInt, "The GPIO pin used for the rf receiver"),
        new ConfigItem("rfReceiverPinPullUp", checkboxFactory, checkboxApply, checkboxGet, "Activate pullup on rf receiver pin (required for 5V protection with reverse diode)"),
        new ConfigItem("rfTransmitterPin", inputFieldFactory, inputApply, inputGetInt, "The GPIO pin used for the RF transmitter"),

        new GroupItem("Enabled RF protocols", legendFactory),
        new ConfigItem("rfProtocols", protocolInputField, protocolApply, protocolGet, ""),

        new GroupItem("Log Config", legendFactory),
        new ConfigItem("serialLogLevel", logLevelInputFactory, inputApply, inputGet, "Level for serial logging"),
        new ConfigItem("webLogLevel", logLevelInputFactory, inputApply, inputGet, "Level for logging to the web UI"),
        new ConfigItem("syslogLevel", logLevelInputFactory, inputApply, inputGet, "Level for syslog logging"),
        new ConfigItem("syslogHost", inputFieldFactory, inputApply, inputGet, "Syslog server (optional)"),
        new ConfigItem("syslogPort", inputFieldFactory, inputApply, inputGetInt, "Syslog port (optional)"),

        new GroupItem("Status LED", legendFactory),
        new ConfigItem("ledPin", inputFieldFactory, inputApply, inputGetInt, "The GPIO pin used for the status LED"),
        new ConfigItem("ledActiveHigh", checkboxFactory, checkboxApply, checkboxGet, "The way how the LED is connected to the pin (false for built-in led)")
    ];

    var uiMap = {};
    CONFIG_ITEMS.forEach(function (value) {
        if (value.fetch !== undefined) {
            uiMap[value.name] = value;
        }
    });

    var closeWebSocket; // definition in openWebSocket()

    function openWebSocket() {
        var container = $('#log-container');
        var pre = container.find('pre');

        var webSocket = new WebSocket("ws://" + location.hostname + ":81");
        var tm;

        closeWebSocket = function () {
            clearTimeout(tm);
            webSocket.close();
        };

        function ping() {
            tm = setTimeout(function () {
                webSocket.send("__PING__");

                tm = setTimeout(function () {
                    webSocket.close();
                    openWebSocket();
                }, 2000);
            }, 5000);
        }

        webSocket.onmessage = function (e) {
            var message = e.data;

            if (message === "__PONG__") {
                clearTimeout(tm);
                ping();
                return;
            }

            pre.append(message);
            if (message === '\n' || (typeof message === "string" && message.indexOf('\n') !== -1)) {
                container.scrollTop(pre.get(0).scrollHeight);
            }
        };

        webSocket.onerror = function (ev) {
            webSocket.close();
            clearTimeout(tm);
            setTimeout(function () {
                openWebSocket();
            });
        };

        webSocket.onopen = function (ev) {
            ping();
        };
    }


    var lastCfg = {};
    var changes = {};

    function throttle(callback, limit) {
        var wait = false;
        return function () {
            if (!wait) {
                callback.apply(this, arguments);
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, limit);
            }
        };
    }


    function registerConfigUi(itemName) {
        $('#config-' + itemName).change(function () {
            var newData = uiMap[itemName].fetch(itemName);
            if (newData !== undefined && JSON.stringify(lastCfg[itemName]) !== JSON.stringify(newData)) {
                changes[itemName] = newData;
            }
        });
    }

    function loadConfig() {
        function applyConfig(data) {
            $.each(data, function (key, value) {
                uiMap[key].apply(key, value);
            });
            changes = {};
            lastCfg = data;
        }

        $.ajax({
                   url: '/config',
                   type: 'GET',
                   contentType: 'application/json',
                   success: applyConfig
               });
    }

    var SystemCommandActions = {
        restart: function () {
            var body = $("body");
            body.empty();
            body.append("<p>Device will reboot!</p><p>Try to reconnect in 15 seconds.</p>");
            setTimeout(function () {
                window.location.reload(true);
            }, 15000);
        },
        reset_wifi: function () {
            var body = $("body");
            body.empty();
            body.append("<p>Devices WIFI settings where cleared!</p><p>Please reconfigure it.</p>");
        },
        reset_config: function () {
            var body = $("body");
            body.empty();
            body.append("<p>Devices Config was reset - reboot device!</p>" +
                "<p>You might have to reconfigure the wifi!</p>" +
                "<p>Reload page in 10 seconds...</p>");
            setTimeout(function () {
                window.location.reload(true);
            }, 10000);
        }
    };

    var sendCommand = throttle(
        function (params) {
            $.ajax({
                       url: '/system',
                       type: 'POST',
                       data: JSON.stringify(params),
                       contentType: 'application/json',
                       success: function () {
                           SystemCommandActions[params.command]();
                       }
                   }
            );
        },
        1000
    );


    function initConfigUi() {
        var settings = "";
        CONFIG_ITEMS.forEach(function (item) {
            settings += item.factory(item);
        });
        $("#settings").prepend(settings);
        CONFIG_ITEMS.forEach(function (item) {
            registerConfigUi(item.name);
        });
        loadConfig();
    }

    function initDebugUi(debugFlags, container) {
        function create(debugFlag, helpText) {
            var checkbox = $('<input>', {
                type: 'checkbox',
                class: 'debug-item',
                id: 'debug-' + debugFlag,
                name: debugFlag,
            });
            checkbox.change(function (env) {
                submit(this);
            });
            return $('<div>', {
                class: 'pure-u-1 pure-u-md-1-3'
            }).append($('<label>', {class: 'pure-checkbox'}).append([
                checkbox,
                ' ' + debugFlag,
                $('<span>', {
                    class: 'pure-form-message',
                    text: helpText,
                }),
            ]));
        }

        function apply(data) {
            $.each(data, function (key, value) {
                $('#debug-' + key).prop("checked", value);
            });
        }

        function submit(item) {
            var data = {};
            data[item.name] = item.checked;
            $.ajax({
                url: '/debug',
                type: "PUT",
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: apply
            });
        }

        $.each(debugFlags, function(debugFlag, helpText) {
            container.append(create(debugFlag, helpText));
        });
        $.ajax({
            url: "/debug",
            type: "GET",
            contentType: 'application/json',
            success: apply
        });
    }

    function loadFwVersion() {
        $.ajax({
                   url: "/firmware",
                   type: "GET",
                   contentType: 'application/json',
                   success: function (data) {
                       $('#current-fw-version').append('Current version: ' + data.version);
                   }
               });
    }

    $('.system-btn').click(function () {
        sendCommand({command: $(this).data('command')});
    });

    $('#settings-form').submit(function (e) {
        e.preventDefault();
        $.ajax({
                   url: "/config",
                   type: 'PUT',
                   contentType: 'application/json',
                   data: JSON.stringify(changes),
                   success: loadConfig

               });

        return false;
    });

    $('#cfg-form-reset').click(function (e) {
        e.preventDefault();
        loadConfig();
        return false;
    });

    // Clear log
    $('#btn-clear-log').click(function (e) {
        $('#log-container').find('pre').empty();
    });

    $('#update-form').submit(function () {
        closeWebSocket();
    });

    initConfigUi();
    initDebugUi(DEBUG_FLAGS, $("#debugflags"));
    loadFwVersion();
    openWebSocket();
});
