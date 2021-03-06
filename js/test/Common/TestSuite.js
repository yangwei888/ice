// **********************************************************************
//
// Copyright (c) 2003-2015 ZeroC, Inc. All rights reserved.
//
// This copy of Ice is licensed to you under the terms described in the
// ICE_LICENSE file included in this distribution.
//
// **********************************************************************

 /* global
    __runEchoServerOptions__ : false,
    __test__ : false,
    basePath : false,
    current : false,
    next : true,
    Test : false,
    TestCases : false
*/

var communicator = Ice.initialize();

$(document).foundation();
$(document).ready(
    function(){
        $("#console").height(120);
        $("#protocol").val(document.location.protocol == "https:" ? "wss" : "ws");
        for(var name in TestCases)
        {
            $("#test").append("<option value=\"" + basePath + name + "/index.html\">" + name + "</option>");
        }
        $("#test").val(basePath + current + "/index.html");

        var out =
        {
            write: function(msg)
            {
                var text = $("#console").val();
                $("#console").val((text === "") ? msg : (text + msg));
            },
            writeLine: function(msg)
            {
                out.write(msg + "\n");
                $("#console").scrollTop($("#console").get(0).scrollHeight);
            }
        };

        var protocol;

        $("#run").click(function(){
            if(!$(this).hasClass("disabled"))
            {
                $("#console").val("");
                $(this).addClass("disabled");
                $("#test").prop("disabled", "disabled");
                $("#protocol").prop("disabled", "disabled");
                $("#language").prop("disabled", "disabled");
                var defaultHost = document.location.hostname || "127.0.0.1";

                protocol = $("#protocol").val();
                var id = new Ice.InitializationData();
                id.properties = Ice.createProperties();
                id.properties.setProperty("Ice.Default.Host", defaultHost);
                id.properties.setProperty("Ice.Default.Protocol", protocol);

                var language = $("#language").val();

                var str;
                if(protocol == "ws")
                {
                    str = "controller:ws -h " + defaultHost + " -p 15002";
                }
                else
                {
                    str = "controller:wss -h " + defaultHost + " -p 15003";
                }
                var controller = Test.Common.ControllerPrx.uncheckedCast(communicator.stringToProxy(str));

                var p;
                var server;
                var options = [];
                if(typeof(__runServer__) !== "undefined" || typeof(__runEchoServer__) !== "undefined")
                {
                    var srv;
                    if(typeof(__runEchoServer__) !== "undefined")
                    {
                        srv = "Ice/echo";
                        if(typeof(__runEchoServerOptions__) !== "undefined")
                        {
                            options = options.concat(__runEchoServerOptions__);
                        }

                    }
                    else
                    {
                        srv = current;
                    }
                    out.write("starting " + srv + " server... ");
                    p = controller.runServer(language, srv, protocol, defaultHost, false, options).then(
                        function(proxy)
                        {
                            var ref = proxy.ice_getIdentity().name + ":" + protocol + " -h " + defaultHost + " -p " + 
                                (protocol == "ws" ? "15002" : "15003");
                            out.writeLine("ok");
                            server = Test.Common.ServerPrx.uncheckedCast(communicator.stringToProxy(ref));
                                
                            var testCase = TestCases[current];
                            if(testCase.configurations === undefined)
                            {
                                return server.waitForServer().then(
                                    function()
                                    {
                                        return __test__(out, id);
                                    });
                            }
                            else
                            {
                                var prev = new Ice.Promise().succeed();
                                testCase.configurations.forEach(
                                    function(configuration)
                                    {
                                        if(configuration.langs && configuration.langs.indexOf(language) == -1)
                                        {
                                            return prev;
                                        }
                                        prev = prev.then(
                                            function()
                                            {
                                                out.writeLine("Running test with " + configuration.name + ".");
                                                return server.waitForServer().then(
                                                    function()
                                                    {
                                                        var initData = id.clone();
                                                        if(configuration.args !== undefined)
                                                        {
                                                            initData.properties = Ice.createProperties(configuration.args, id.properties);
                                                        }
                                                        return __test__(out, initData);
                                                    });
                                            });
                                    });
                                return prev;
                            }
                        },
                        function(ex)
                        {
                            out.writeLine("failed! (" + ex + ")");
                            throw ex;
                        }
                    ).then(
                        function()
                        {
                            if(server)
                            {
                                return server.waitTestSuccess();
                            }
                        }
                    ).exception(
                        function(ex)
                        {
                            if(server)
                            {
                                return server.terminate().then(
                                    function()
                                    {
                                        throw ex;
                                    },
                                    function()
                                    {
                                        throw ex;
                                    });
                            }
                            else
                            {
                                throw ex;
                            }
                        });
                }
                else
                {
                    p = __test__(out, id);
                }

                p.finally(
                    function()
                    {
                        $("#test").prop("disabled", false);
                        $("#protocol").prop("disabled", false);
                        $("#language").prop("disabled", false);
                        $("#run").removeClass("disabled");
                    }
                ).then(
                    function()
                    {
                        if($("#loop").is(":checked"))
                        {
                            var href = document.location.protocol + "//" + document.location.host;
                            if(!next)
                            {
                                next = "Ice/acm";
                                if(protocol == "ws")
                                {
                                    protocol = "wss";
                                    href = href.replace("http", "https");
                                    href = href.replace("8080", "9090");
                                }
                                else
                                {
                                    protocol = "ws";
                                    href = href.replace("https", "http");
                                    href = href.replace("9090", "8080");
                                    if(language == "cpp")
                                    {
                                        language = "java";
                                    }
                                    else if(language == "java")
                                    {
                                         language = "cs";
                                    }
                                    else
                                    {
                                        language = "cpp";
                                    }
                                }
                            }

                            href += document.location.pathname.replace(current, next);
                            href += "?loop=true&language=" + language;
                            document.location.assign(href);
                        }
                    }
                ).exception(
                    function(ex, r)
                    {
                        out.writeLine("");
                        if(r instanceof Ice.AsyncResult)
                        {
                            out.writeLine("exception occurred in call to " + r.operation);
                        }
                        out.writeLine(ex.toString());
                        if(ex.stack)
                        {
                            out.writeLine(ex.stack);
                        }
                    });
            }
            return false;
        });

        (function(){

            if(basePath === "../../../")
            {
                $(".title-area a").attr("href", "../../../../index.html");
                $(".breadcrumbs li:first a").attr("href", "../../../../index.html");
            }

            //
            // Check if we should start the test loop=true
            //
            var href = document.location.href;
            var i = href.indexOf("?");

            var languageIdx = i !== -1 ? href.substr(i).indexOf("language=") : -1;
            if(languageIdx !== -1)
            {
                $("#language").val(href.substr(i + languageIdx + 9));
            }
            else
            {
                $("#language").val("cpp");
            }


            var autoStart = i !== -1 && href.substr(i).indexOf("loop=true") !== -1;
            if(autoStart)
            {
                $("#loop").prop("checked", true);
                $("#run").click();
            }
        }());

        //
        // Test case
        //
        $("#test").on("change",
            function(e)
            {
                document.location.assign($(this).val() + "?language=" + $("#language").val());
                return false;
            });
        
        $("#language").on("change",
            function(e)
            {
                document.location.assign(document.location.pathname + "?language=" + $("#language").val());
                return false;
            });

        //
        // Protocol
        //
        $("#protocol").on("change",
            function(e)
            {
                var newProtocol = $(this).val();
                if(protocol !== newProtocol)
                {
                    var href = document.location.protocol + "//" + document.location.host +
                        document.location.pathname;
                    if(newProtocol == "ws")
                    {
                        href = href.replace("https", "http");
                        href = href.replace("9090", "8080");
                    }
                    else
                    {
                        href = href.replace("http", "https");
                        href = href.replace("8080", "9090");
                    }
                    href += "?language=" + $("#language").val();
                    document.location.assign(href);
                }
            });
    });
