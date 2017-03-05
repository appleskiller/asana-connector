$(document).ready(function () {
    var loadingPage = $(".loading-page");
    var signinPage = $(".signin-page");
    var resourcePage = $(".resource-page");
    var asanaUser = null;

    function renderList(type , value) {
        var list = resourcePage.find("." + type + " .content");
        list.find("li").off();
        list.empty();
        var ul = $('<ul></ul>') , li;
        value = value || [];
        for (var i = 0; i < value.length; i++) {
            var item = value[i];
            li = $('<li data-id="'+item.id+'">'+item.name+'</li>');
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

        $.ajax({
            url: 'https://localhost:18081/asana/resource/workspaces',
            type: "GET"
        }).then(function(result) {
            renderList("workspaces",result);
        });
        $.ajax({
            url: 'https://localhost:18081/asana/resource/projects',
            type: "GET"
        }).then(function(result) {
            renderList("projects",result);
        });
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
            setTimeout(detectUser , 1000);
        });
    }
    signinPage.find(".loginBtn").click(function () {
        window.open("https://localhost:18081/asana/connect" , "Asana Connector" , "location=no,menubar=no,toolbar=no,copyhistory=no");
    });

    detectUser();
})