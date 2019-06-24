var start_id = 1;
var progress;
var initstr;
var totalWidth = 600;
var user_answer;
var start_time;
var end_time;
var user_time;
var final_result="";
$("#start").click(function () {
    init(1);
   
});



$("#submit").click(function () {
    var FileSaver = require('file-saver');
    var blob = new Blob([final_result], {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "hello world.txt");
    console.log(final_result);
    
});
function init(id) { 
    $("#panel" + id).css("display", "block");
    $('#progress_div').css("display", "block");
    start_time=new Date();
     progress = 1;
     initstr = '';
    initstr = setInterval("change('progress')", 100);
 }
function change(id) {
   
    $('#' + id).css({
        width: progress
    })
    if (progress == totalWidth) {
        clearInterval(initstr);
    }
    progress = progress + 1;
}
function loadInfo() {


        var jsonData_circle;
        try {
            jsonData_circle = JSON.parse(document.getElementById("jsonInputField").value);
        } catch (e) {}

        $("#panel_group").html("");//清空info内容
        console.log(jsonData_circle);
        jsonData_circle.children.forEach(classs => {
            var class_name = classs.class;
            classs.children.forEach(question => {
                var item = question.item;
                var id = question.id;
                var question_content = question.question;
                var answer = question.answer;
                var options = question.options;
                $("#panel_group").append(
                    "<div id ='panel" + id + "'" + "class='panel panel-primary' style='display:none'>"
                    + "<div class='panel-heading'>"
                    + "<h3 class='panel-title'>" + class_name + "  问题" + item + "</h3>"
                    + "</div>"
                    + "<div class='panel-body'>"
                    + "<div id='question'>"
                    + "<span>题目：</span>" + question_content + "</div>"
                    + "<div id='answer"+id+"'"+"style='display:none'>"
                    + "<span>选项：</span>"
                    + "<div class='btn-group' data-toggle='buttons'>"
                    + "<label class='btn btn-default '>"
                    + "<input type='radio' name='options' value="+options[0]+"> " + options[0]
                    + "</label>"
                    + "<label class='btn btn-default '>"
                    + "<input type='radio' name='options' value="+options[1]+">" + options[1]
                    + "</label>"
                    + "<label class='btn btn-default '>"
                    + "<input type='radio' name='options' value="+options[2]+">" + options[2]
                    + "</label>"
                    + "<label class='btn btn-default '>"
                    + "<input type='radio' name='options'value="+options[3]+">" + options[3]
                    + "</label>"
                    + "</div>"
                    + "</div>"
                    + "</div>"
                    + "<div class='panel-footer'>"
                    + "<button id='start_answer"+id+"'"+"type='button' class='btn btn-success'>开始选择</button>"
                    + " </div>"
                );
                $("#start_answer"+id).click(function () {
                    end_time=new Date();
                    user_time=(end_time-start_time)/1000;
                    if(user_time>10){
                        user_time=user_time+"超时";
                    }
                    if( $("#start_answer"+id).val()=="提交答案"){
                        user_answer = $("#panel"+id+" input:radio:checked").val();
                        console.log(user_answer);
                        final_result+="第"+id+"题"+","+"用户选项"+user_answer+","+"所用时间"+user_time+"秒"+"\r\n";
                        start_id=start_id+1;
                        $('#progress_div').css("display", "none");
                        if(start_id>8){
                            alert("答题完毕！请按提交按钮！");
                            start_id=1;
                        }else{
                            $("#panel" + id).css("display", "none");
                            
                            init(start_id);
                        }
                       

                    }
                    else{
                       
                        $("#answer"+start_id).css("display","block");
                        $("#start_answer"+start_id).val("提交答案");
                        $("#start_answer"+start_id).html("提交答案");
                    }

                 });

            });
        });


}
loadInfo();
