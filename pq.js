var log = true;
var points;
var point_centres = [];
var last_mouse_location = [0,0];
var selected_rank = -1;

//Table-clicking function

function format(d) {
    d[3] = d[3].replace(/&lt;(.+?)&gt;/g, '<' + '$1' + '>');
    return '<div style=\"background-color:#eee; padding: 1em; margin: 1em; word-wrap:break-word;\"><h4>Question</h4><p>' +
                d[2] +
                '</p><h4>Answer</h4><p>' + d[3] + '</p></div>' +
                '<div class=\"container-fluid\">' +
                '<div class=\"btn-group btn-group-justified\" role=\"group\">' +
                '<div class=\"btn-group\" role=\"group\">' +
                '<button class=\"btn btn-info\" type = \"button\" onclick = \"mp_finder(\'' + d[6] + '\')\">See all questions asked by ' + d[6].replace(/([\w\s-]+), ([\w\s]+)/, '$2' + ' ' + '$1') + '</button>' +
                '</div>' +
                '<div class=\"btn-group\" role=\"group\">' +
                '<button class=\"btn btn-info\" type = \"button\" onclick = \"topic_finder(' + d[9] + ')\">View topic ' + d[9] + ' (' + d[10] + ') </button>' +
                '</div>' +
                '</div>' +
                '</div>';
}
var table1;
function rowActivate() {
    var row = this.closest('tr');
    var showHideIcon = $(row.firstChild);
    var shinyRow = table1.row(row);
    if (shinyRow.child.isShown()) {
        shinyRow.child.hide();
        showHideIcon.html('&oplus;');
    } else {
        shinyRow.child(format(shinyRow.data())).show();
        showHideIcon.html('&ominus;');
    }
}

//Plotly point-clicking functions
function get_point_locations(e) {
    last_mouse_location = [e.clientX, e.clientY];
    if(!!similarity_plot){
        if (e.path.indexOf(similarity_plot) > -1){
            //console.log(e.clientX);
            //console.log(e);
            point_centres = [];
            points = document.getElementsByClassName("points")[0].children;
            if (point_centres.length === 0){
                
                for (var p of points){
                    let bounding_rect = p.getBoundingClientRect();
                    let c_x = bounding_rect.left + bounding_rect.width/2;
                    let c_y = bounding_rect.top + bounding_rect.height/2;
                    point_centres.push({'centre' : [c_x, c_y], 'dist' : 0});
                }
            }
        }
    }
    
    var cc = document.getElementsByClassName("cursor-crosshair")[0];
    if(cc){
        cc.addEventListener("mousedown", find_nearest_point);
    }
    $("div.active").mousemove(tidy_table)
}


function find_nearest_point(e){
    var mouse = last_mouse_location;
    var current_min = 10000000;
    var min_index = -1;
    var current_index = 0;
    point_centres.map(function(p_c){
        var current_dist = mouse.dist(p_c.centre);
        p_c.dist = current_dist;
        if (current_dist < current_min){
            current_min = current_dist;
            min_index = current_index;
        }
        current_index++;
    });
    if (min_index === selected_rank){
        selected_rank = -1;
        return ;
    }else{
        selected_rank = min_index;
    }
    
    return rank_to_selection(min_index + 1);
}



Array.prototype.dist = function(b){
    var x = this[0] - b[0];
    var y = this[1] - b[1];
    return x*x + y*y;
};


function rank_to_selection(rank){
    var page = rank % 8 ? Math.floor(rank/8) + 1 : rank/8;
    var row = rank % 8 ? rank % 8 : 8;
    return goto_page(page, row);
}

function goto_page(i, row){
    deselect_rows();
    
    var table_num = $("table")[0].getAttribute("id").split(/_/)[2];
    var next = $("#DataTables_Table_" + table_num + "_next")[0];
    var previous = $("#DataTables_Table_" + table_num + "_previous")[0];
    var current_page = document.getElementsByClassName("current")[0].innerHTML;
    var page_shift = i - parseInt(current_page);
    var button = page_shift > 0 ? next : previous;
    for (var j = 0; j < Math.abs(page_shift); j++){
        button.click();
    }
    setTimeout(function() {return toggle_row(row)}, 1000);
}

function toggle_row(i){
    var rows = i % 2 ? document.getElementsByClassName("odd") : document.getElementsByClassName("even");
    var row = i % 2 ? Math.floor(i/2) : i/2 - 1;
    rows[row].click();
}


function deselect_rows(){
    var selected = document.getElementsByClassName("selected");
    for (var s = 0; s < selected.length; s++){
        selected[s].click();
    }
}


//Cluster selecting functions

//Note the fixed indices in various things below (lines) - should be fine for now, but this is likely where any future errors may come from, supposing they do.

function mp_finder(mp){
    var mp_tab = $("a")[2]; //find link to MP tab
    mp_tab.click(); //click on link (takes us to MP tab)
    var is_lords = mp.match(/^(Baron)|(Lord)|(The )|(Viscount)/); //determine if mp is in HoL or HoC
    var radio_button = is_lords ? 0 : 1; //is_lords evalutes to true if above match is found, and false otherwise - returnin 0, 1 respectively
    $(".radio-inline")[radio_button].click(); //Click the correct radio button, as determined by is_lords
    
    setTimeout(function(){ //timeout to give radio button click enough time to execute
        $("#person_choice").append("<option value='" + mp + "'>" + mp + "</option>"); //append option to person dropdown (the mp you want)
        $("#person_choice").val(mp).change(); //change to new option
        document.getElementsByClassName("item")[1].innerHTML = mp; //change text in person dropdown
        return; }, 500);
}

function topic_finder(topic){
    var topic_tab = $("a")[1]; //find link to topic tab
    topic_tab.click(); //click on link (takes us to topic tab)
    $("#topic_choice").append("<option value='" + topic + "'>" + topic + "</option>"); //append option to topic dropdown (the topic you want)
    $("#topic_choice").val(""+topic).change(); //change to new option
    document.getElementsByClassName("item")[0].innerHTML = topic; //change text in topic dropdown
}


//Tidy up tab tables

String.prototype.format_html = function(){
    return this.replace(/&lt;(.+?)&gt;/g, '<' + '$1' + '>');
};


function tidy_table(){
    //debugger
    //Find Answer_text column
    var headers = $("div.active").find("th.sorting");
    var hl = headers.length;
    var answer_index = -1;
    var table_entries = $("div.active").find("td");
    var t_entries_length = table_entries.length;
    for(var h of headers){
        answer_index++;
        if(h.innerHTML === "Answer_Text"){
            break;
        }
    }
    for(var i = 0; i < t_entries_length; i++){
        if(i % hl !== answer_index){
            continue;
        }
        var a_text = table_entries[i].innerHTML;
        table_entries[i].innerHTML = a_text.format_html();
    }
}

