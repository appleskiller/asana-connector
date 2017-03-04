$(document).ready(function () {
    var signinPage = $(".signin-page");
    var resourcePage = $(".resource-page");
    signinPage.find(".loginBtn").click(function () {
        window.open("https://localhost:18081/asana" , "_blank");
    })
})