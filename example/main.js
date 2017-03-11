$(document).ready(function () {
    var loadingPage = $(".loading-page");
    var signinPage = $(".signin-page");
    var resourcePage = $(".resource-page");
    var monitorPage = $(".monitor-page");
    
    var asanaUser = null;

    function _onClickedHandle(type , id) {
        return function () {
            if (type === "projects") {
                $.ajax({
                    url: 'https://localhost:18081/asana/resource/upload/shujuguan/projects',
                    type: "POST",
                    timeout: 0,
                    contentType: "application/json",
                    data: JSON.stringify({
                        datatableId: "" ,
                        projectId: id
                    })
                }).then(function(result) {
                    console.log(result);
                });
            }
        }
    }

    function renderList(type , value) {
        var list = resourcePage.find("." + type + " .content");
        list.find("li").off();
        list.empty();
        var ul = $('<ul></ul>') , li;
        value = value || [];
        for (var i = 0; i < value.length; i++) {
            var item = value[i];
            li = $('<li data-id="'+item.id+'">'+item.name+'</li>');
            li.click(_onClickedHandle(type , item.id));
            ul.append(li);
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
        $.ajax({
            url: 'https://localhost:18081/asana/resource/projects',
            type: "GET",
            timeout: 0
        }).then(function(result) {
            renderList("projects",result);
        });

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
    function renderMonitoring(progressTasks , noTaskMsg) {
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
    // fetch connected user
    function detectUser() {
        if (asanaUser) {
            return;
        }
        $.ajax({
            type: "GET",
            url: "https://localhost:18081/asana/currentuser"
        })
        .then(function (result) {
            var user = (result && result.connected) ? result.user : null;
            setAsanaUser(user);
        })
        .always(function () {
            setTimeout(detectUser , 1500);
        });
    }
    signinPage.find(".loginBtn").click(function () {
        window.open("https://localhost:18081/asana/connect" , "Asana Connector" , "location=no,menubar=no,toolbar=no,copyhistory=no");
    });
    // monitoring
    function monitoring() {
        $.ajax({
            type: "GET",
            url: "https://localhost:18081/asana/resource/monitoring"
        }).then(function (result) {
            renderMonitoring(result);
        }).always(function (xhr) {
            if (xhr && xhr.status === 0) {
                renderMonitoring({} , "offline");
            }
            setTimeout(monitoring , 1500);
        })
    }
    detectUser();
    monitoring();
})