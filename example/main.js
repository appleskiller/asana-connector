$(document).ready(function () {
    var loadingPage = $(".loading-page");
    var signinPage = $(".signin-page");
    var resourcePage = $(".resource-page");
    var monitorPage = $(".monitor-page");
    
    var asanaUser = null;

    function _onProjectClickedHandle(item) {
        return function () {
            var ret = window.confirm("抽取数据 [ "+item.name+" ] 到数据观");
            if (ret) {
                $.ajax({
                    url: 'https://localhost:18081/asana/resource/schedule',
                    type: "POST",
                    timeout: 0,
                    contentType: "application/json",
                    data: JSON.stringify({
                        projectId: item.id
                    })
                }).then(function(result) {
                    console.log(result);
                });
            }
        }
    }
    function renderListItem(type , item) {
        var li = $('<li data-id="'+item.id+'">'+item.name+'</li>');
        if (type === "projects") {
            li.html("<a href='javascript:void(0);'>upload</a>" + "<span>"+item.name+"</span>")
            li.find("a").click(_onProjectClickedHandle(item));
        }
        return li;
    }
    function renderList(type , value) {
        var list = resourcePage.find("." + type + " .content");
        list.empty();
        var ul = $('<ul></ul>');
        value = value || [];
        for (var i = 0; i < value.length; i++) {
            ul.append(renderListItem(type , value[i]));
        }
        list.append(ul);
    }
    
    function renderResourcePage() {
        var userInfo = resourcePage.find(".user-info");
        userInfo.find(".image").css("background-image" , "url("+asanaUser.photo.image_60x60+")");
        userInfo.find(".name").text(asanaUser.name);
        userInfo.find(".email").text(asanaUser.email);
        userInfo.find(".signout").off().click(function() {
            $.ajax({
                url: "https://localhost:18081/asana/disconnect",
                type: "GET"
            });
        });

        // $.ajax({
        //     url: 'https://localhost:18081/asana/resource/workspaces',
        //     type: "GET",
        //     timeout: 0,
        // }).then(function(result) {
        //     renderList("workspaces",result);
        // });
        // $.ajax({
        //     url: 'https://localhost:18081/asana/resource/teams',
        //     type: "GET",
        //     timeout: 0,
        // }).then(function(result) {
        //     renderList("teams",result);
        // });

        // $.ajax({
        //     url: 'https://localhost:18081/asana/resource/upload/shujuguan/projects',
        //     type: "POST",
        //     timeout: 0,
        //     contentType: "application/json",
        //     data: JSON.stringify({
        //         projectId: 275995325944865
        //     })
        // }).then(function(result) {
        //     console.log(result);
        // });

        // $.ajax({
        //     url: "https://localhost:18081/asana/resource/projects",
        //     type: "POST",
        //     timeout: 0,
        //     contentType: "application/json",
        //     data: JSON.stringify({
        //         ids: [275995325944865]
        //     })
        // })
        // $.ajax({
        //     url: "https://localhost:18081/asana/resource/tasks",
        //     type: "POST",
        //     timeout: 0,
        //     contentType: "application/json",
        //     data: JSON.stringify({
        //         ids: [240126117951142]
        //     })
        // })
    }
    function renderLogList(logs) {
        var list = monitorPage.find(".log-list").empty();
        if (logs && logs.length) {
            for (var i = logs.length - 1; i >= 0; i--) {
                list.append("<div>" + logs[i] + "</div>");
            }
        }
        list.scrollTop(10000);
    }
    function renderProgressing(progressTasks , noTaskMsg) {
        var tasks = [];
        if (progressTasks) {
            for (var key in progressTasks) {
                tasks.push(progressTasks[key]);
            }
        }
        var taskList = monitorPage.find(".task-list");
        monitorPage.find(".title span").html("");
        if (!tasks.length) {
            taskList.empty();
            monitorPage.find(".title span").html(noTaskMsg ? " - " + noTaskMsg : " - Not any tasks.");
        } else {
            taskList.find(".task-item").addClass("deprecated");
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                var item = taskList.find(".task-item[task-id="+task.id+"]");
                if (!item.length) {
                    item = $('<div class="task-item" task-id="'+task.id+'"></div>');
                    item.append('<div class="task-name"></div>');
                    item.append('<div class="task-progress"><div class="progress"></div></div>');
                    taskList.prepend(item);
                } else {
                    item.removeClass("deprecated");
                }
                var loadInfo = [" | loaded: "+ task.loaded , "error: " + task.error , "total: " + task.total + " | "].join(" | ");
                item.find(".task-name").html([task.info.name , loadInfo , task.current].join(" - "));
                item.find(".progress").css("width" , 100*task.loaded/task.total + "%");
            }
            taskList.find(".task-item.deprecated").remove();
        }
    }
    function setAsanaUser(user) {
        loadingPage.hide();
        if (!user) {
            asanaUser = null;
            signinPage.show();
            resourcePage.hide();
        } else {
            signinPage.hide();
            resourcePage.show();
            
            if (!asanaUser || JSON.stringify(asanaUser) !== JSON.stringify(user)) {
                asanaUser = user;
                renderResourcePage();
            }
        }
    }
    signinPage.find(".loginBtn").click(function () {
        window.open("https://localhost:18081/asana/connect" , "Asana Connector" , "location=no,menubar=no,toolbar=no,copyhistory=no");
        signinPage.find(".loginBtn").html("Authorized in Asana...").attr("disabled" , "disabled");
    });
    resourcePage.find(".start-schedule").click(function () {
        $.ajax({
            type: "GET",
            url: "https://localhost:18081/asana/resource/schedule/sbi"
        })
    })
    resourcePage.find(".projects-refresh").click(function () {
        $.ajax({
            url: 'https://localhost:18081/asana/resource/projects',
            type: "GET",
            timeout: 0
        }).then(function(result) {
            renderList("projects",result);
        });
    })
    // monitoring
    function monitoring() {
        $.ajax({
            type: "GET",
            url: "https://localhost:18081/asana/resource/monitoring"
        }).then(function (result) {
            // 进度监控
            renderProgressing(result.progress);
            // log
            renderLogList(result.logs);
            // 用户监控
            setAsanaUser(result.user);
        }).always(function (xhr) {
            var time = 2000;
            if (xhr && xhr.status === 0) {
                time = 4000;
                renderProgressing({} , "offline");
            }
            setTimeout(monitoring , time);
        })
    }
    monitoring();
})