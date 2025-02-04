// This file is part of the FlOpEDT/FlOpScheduler project.
// Copyright (c) 2017
// Authors: Iulian Ober, Paul Renaud-Goud, Pablo Seban, et al.
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public
// License along with this program. If not, see
// <http://www.gnu.org/licenses/>.
// 
// You can be released from the requirements of the license by purchasing
// a commercial license. Buying such a license is mandatory as soon as
// you develop activities involving the FlOpEDT/FlOpScheduler software
// without disclosing the source code of your own applications.

var socket;

var opti_timestamp;

var select_opti_date, select_opti_train_prog;
var week_year_sel, train_prog_sel, txt_area;

var launchButton;
var started = false;
let errorPreAnalyse = [];

let analyseButton = document.querySelector('#analyse');
//nb pre_analyse launch each week
let nbPreAnalyse = 3;
let firstCourse = true;

function displayConsoleMessage(message){
    while (message.length > 0 && message.slice(-1) == '\n') {
        message = message.substring(0, message.length - 1);
    }

    if (message.length > 0) {
        txt_area.textContent += "\n" + message;
    }

    if (txt_area.selectionStart == txt_area.selectionEnd) {
        txt_area.scrollTop = txt_area.scrollHeight;
    }
}

function start() {
    console.log("GOOO");
    open_connection();
}

function stop() {
    console.log("STOOOOP");

    open_socket();
  
    socket.onmessage = function (e) {
        var dat = JSON.parse(e.data);
        dispatchAction(dat);
        displayConsoleMessage(dat['message']);
    }
    socket.onopen = function () {
        socket.send(JSON.stringify({
            'message': 'kill',
            'action': "stop",
            'timestamp': opti_timestamp
        }))
    }

    socket.onclose = function (e) {
        console.error('Chat socket closed unexpectedly');
    };
    // Call onopen directly if socket is already open
    if (socket.readyState == WebSocket.OPEN) socket.onopen();
}

function format_zero(x) {
    if (x < 10) {
        return "0" + x;
    }
    return x;
}

function open_socket() {
  try {
    console.log('Try ws://') ;
    socket = new WebSocket("ws://" + window.location.host + "/solver/");
  } catch (error) {
    console.log('Fail. Try wss://') ;
    socket = new WebSocket("wss://" + window.location.host + "/solver/");
  }
  console.log('Success.');
}

function open_connection() {
    var now = new Date();
    opti_timestamp = now.getFullYear() + "-"
        + format_zero(now.getMonth() + 1) + "-"
        + format_zero(now.getDate()) + "--"
        + format_zero(now.getHours()) + "-"
        + format_zero(now.getMinutes()) + "-"
        + format_zero(now.getSeconds());

    open_socket();

    socket.onmessage = function (e) {
        var dat = JSON.parse(e.data);
        dispatchAction(dat);
        displayConsoleMessage(dat['message']);
    }
    
    socket.onopen = function () {
        // Get current training program abbrev
        var tp = '';
        if (train_prog_sel != text_all) {
            tp = train_prog_sel;
        }

        // Update constraints activation state
        update_constraints_state();

        // Get solver parameters
        var solver = solver_select.value;
        var time_limit = parseInt(time_limit_select.value);
        var pre_assign_rooms = pre_assign_rooms_checkbox.checked;
        var post_assign_rooms = post_assign_rooms_checkbox.checked;
        var all_weeks_together = all_weeks_together_checkbox.checked;
        var send_log_email = send_log_email_checkbox.checked;


        // Get working copy number for stabilization
        var stabilize_working_copy = stabilize_select.value;

        socket.send(JSON.stringify({
            'message':
                "C'est ti-par.\n" + opti_timestamp + "\nSolver ok?",
            'action': "go",
            'department': department,
            'week_year_list': week_year_sel,
            'train_prog': tp,
            'constraints': constraints,
            'stabilize': stabilize_working_copy,
            'timestamp': opti_timestamp,
            'time_limit': time_limit,
            'solver': solver,
            'pre_assign_rooms': pre_assign_rooms,
            'post_assign_rooms': post_assign_rooms,
            'all_weeks_together': all_weeks_together,
            'send_log_email': send_log_email,
            'current_user_email': current_user_email
        }))
    }

    socket.onclose = function (e) {
        console.error('Chat socket closed unexpectedly');
    };
    // Call onopen directly if socket is already open
    if (socket.readyState == WebSocket.OPEN) socket.onopen();
}

/* 
	Drop dpwn list initialization
*/

function init_dropdowns() {
    // create drop down for week selection
    select_opti_date = d3.select("#opti_date");
    select_opti_date.on("change", function () { choose_week(); fetch_context(); });
    select_opti_date
        .selectAll("option")
        .data(week_list)
        .enter()
        .append("option")
        .text(d => d[1] +' - '+ d[0])

    // create drop down for training programme selection
    train_prog_list.unshift(text_all);
    select_opti_train_prog = d3.select("#opti_train_prog");
    select_opti_train_prog.on("change", function () { choose_train_prog(); fetch_context(); });
    select_opti_train_prog
        .selectAll("option")
        .data(train_prog_list)
        .enter()
        .append("option")
        .text(function (d) { return d; });

    // modify solver dropdown such that it shows log email checkbox when gurobi is selected
    select_solver = d3.select("#solver");
    select_solver.on("change", function () { show_hide_log_email_div(); fetch_context();});
    
    choose_week();
    choose_train_prog();
    show_hide_log_email_div();
}

function choose_week() {
    var di = select_opti_date.property('selectedIndex');
    var yw = select_opti_date.selectAll("option:checked").data();
    week_year_sel = yw.map(yw => {return { year: yw[0], week: yw[1] };});
}
function choose_train_prog() {
    var di = select_opti_train_prog.property('selectedIndex');
    var sa = select_opti_train_prog
        .selectAll("option")
        .filter(function (d, i) { return i == di; })
        .datum();
    train_prog_sel = sa;
}

function show_hide_log_email_div() {
    send_log_email_checkbox.checked = false;
    selected_solver_id = select_solver.property('selectedIndex');
    selected_solver_name = select_solver.selectAll("option")
    .filter(function (d, i) { return i === selected_solver_id; })
    .property("value");
    if (selected_solver_name.startsWith('GUROBI')) {
        log_email_div.style.display = "block";
    } else {
        log_email_div.style.display = "none";
    }
}

/* 
	Context view initialization
*/

function update_context_view(context) {

    if (context) {
        work_copies = context.work_copies;
        constraints = context.constraints;
    } else {
        work_copies = [];
        constraints = [];
    }

    init_work_copies(work_copies);
    init_constraints(constraints);
}

/* 
	Working copies list initialization
*/
function init_work_copies(work_copies) {

    copies = work_copies.slice(0);
    copies.unshift("-");

    // Display or hide working copies list
    stabilize_div = d3.select("#stabilize");
    if (work_copies.length == 0) {
        stabilize_div.style("display", "none");
    }
    else {
        stabilize_div.style("display", "block");
    }


    // Update working copies list
    stabilize_sel = stabilize_div.select("select");

    stabilize_sel_data = stabilize_sel 
        .selectAll("option")
        .data(copies, (x) => x);

    stabilize_sel_data
        .enter()
        .append("option")
        .attr('value', (d) => d)
        .text((d) => d);

    stabilize_sel_data.exit().remove();
}


/* 
    Constraints view initialization
*/
function init_constraints(constraints) {

    // On vérifie si le navigateur prend en charge
    // l'élément HTML template en vérifiant la présence
    // de l'attribut content pour l'élément template.
    if ("content" in document.createElement("template")) {

        // On prépare une ligne pour le tableau 
        var t = document.querySelector("#constraints_template");

        // On clone la ligne et on l'insère dans le tableau
        var container = document.querySelector("#constraints");
        var current = container.querySelector("#constraints_list");
        var target = document.createElement("div");
        target.id = "constraints_list";
        container.replaceChild(target, current);

        // Create new template for each constraint
        constraints.forEach((constraint, index) => {
            if(!constraint)
                return;
                
            var constraintId = `${constraint.model}_${constraint.pk}`;

            var clone = document.importNode(t.content, true);

            // Display state 
            var checkbox = clone.querySelector("input[type=checkbox]");
            checkbox.setAttribute('id', constraintId);
            checkbox.setAttribute('value', index);
            checkbox.checked = constraint.is_active;

            // Display title
            var label = clone.querySelector("label");
            label.setAttribute('for', constraintId);
            label.className = "title";
            label.textContent = constraint.name;

            // Display mandatory
            if (constraint.details.weight===null) {
                label.classList.add("mandatory");
            }

            // Display description
            var description = clone.querySelector("#description");
            if (constraint.description) {
                description.textContent = constraint.description;
            }

            // Display explanation
            var explanation = clone.querySelector("#explanation");
            if (constraint.explanation) {
                explanation.textContent = constraint.explanation;
            }

            // Display comment
            if (constraint.comment) {
                var comment = clone.querySelector("#comment");
                comment.textContent = constraint.comment;
            }

            // Display details items
            var details = clone.querySelector("#details");

            for (var key in constraint.details) {
                var detail = document.createElement("div")
                details.appendChild(detail)

                var content = document.createTextNode(`${key} : ${constraint.details[key]}`);
                detail.appendChild(content)
            }

            target.appendChild(clone);
        });

    } else {
        // Une autre méthode pour ajouter les lignes
        // car l'élément HTML n'est pas pris en charge.
        alert('template element are not supported')
    }
}

/* 
	Get constraints list with updated state propepety
*/
function update_constraints_state() {
    var checkboxes = document.querySelectorAll("#constraints input[type=checkbox]");
    checkboxes.forEach(c => {
        constraints[c.value].is_active = c.checked;
    });
}

/* 
	Get constraints async
*/

function get_constraints_url(train_prog, year, week) {

    let params = arguments;
    let regexp = /(tp)\/(1111)\/(11)/;
    let replacer = (match, train_prog, year, week, offset, string) => {
        return Object.values(params).join('/');
    }

    return fetch_context_url_template.replace(regexp, replacer)
}


/*
  Retrieve work_copies and constraints for a specific week
  This doesn't apply if more than one week is selected
*/
function fetch_context() {
    all_weeks_together_div = d3.select("#all-weeks-together");
    if (week_year_sel.length == 1) {
      week = week_year_sel[0].week
      year = week_year_sel[0].year
      $.ajax({
          type: "GET",
          dataType: 'json',
          url: get_constraints_url(train_prog_sel, year, week),
          async: true,
          contentType: "application/json; charset=utf-8",
          success: function (context) {
              update_context_view(context);
          },
          error: function (msg) {
              console.log("error");
          },
          complete: function (msg) {
              console.log("complete");
          }
      });
      all_weeks_together_div.style("display", "none");
    } else {
        update_context_view();
        if (week_year_sel.length > 1) {
            // Display or hide all weeks together checkbox
            all_weeks_together_div.style("display", "block");
        }
    }
}


/*
	Start or stop edt resolution
*/
function manageSolverProcess(event) {
    if (started) {
        changeState('stop');
    }
    else {
        changeState('start');
    }
}
/* 
Update interface state
*/
function changeState(targetState) {
    switch (targetState) {
        case 'start':
            launchButton.value = 'Stop';
            started = true;
            start();
            break;
        case 'stop':
            launchButton.value = 'Go';
            started = false;
            stop();
        case 'stopped':
            launchButton.value = 'Go';
            started = false;
        default:
            break;
    }
}

/*
	Dispatch websocket received action 
*/
function dispatchAction(token) {
    let action = token.action;
    let message = token.message;

    if (!action) {
        console.log('unrecognized action' + token);
        return;
    }

    if (action != 'info')
        changeState('stopped');
}

function get_analyse_url(train_prog, year, week, type) {

    let params = arguments;
    let regexp = /(tp)\/(1111)\/(11)\/(constraint)/;
    let replacer = (match, train_prog, year, week, constraint, offset, string) => {
        return Object.values(params).join('/');
    }
    return analyse_url_template.replace(regexp, replacer)
}


function launchPreanalyse(event) {
    hideFinishLabel();
    let nbAnalyse = nbPreAnalyse * week_year_sel.length;
    let nbDone = 0;
    errorPreAnalyse = [];
    displayErrorAnalyse();
    console.log("On Analyse !");
    if(week_year_sel.length !== 0){
        analyseButton.disabled = true;
    }
    //console.log(week_year_sel);
    //console.log(train_prog_sel);
    let constraint_type = "";
    week_year_sel.forEach((week_year) => {
        week = week_year.week;
        year=week_year.year;
        constraint_type = "ConsiderDependencies";
        url_get = get_analyse_url(train_prog_sel, year, week, constraint_type);
        console.log(url_get);
        $.ajax({
            type: "GET",
            dataType: 'json',
            url: url_get,
            async: true,
            contentType: "application/json; charset=utf-8",
            success: function (result) {
                console.log("ConsiderDependencies",result);
                result["ConsiderDependencies"].forEach((obj) => {
                    if (obj["status"] === "KO") {
                        errorPreAnalyse.push(obj);
                    }
                });
                displayErrorAnalyse("ConsiderDependencies");
            },
            error: function (msg) {
                console.log("error", msg);
            },
            complete: function (msg) {
                console.log("complete");
                nbDone = nbDone + 1;
                if (nbDone == nbAnalyse) {
                    displayFinishLabel();
                    analyseButton.disabled = false;
                }
            }
        });
        constraint_type = "NoSimultaneousGroupCourses";
        url_get = get_analyse_url(train_prog_sel, year, week, constraint_type);
        console.log(url_get);
        $.ajax({
            type: "GET",
            dataType: 'json',
            url: url_get,
            async: true,
            contentType: "application/json; charset=utf-8",
            success: function (result) {
                console.log("NoSimultaneous", result)
                result["NoSimultaneousGroupCourses"].forEach((obj) => {
                    if (obj["status"] === "KO") {
                        errorPreAnalyse.push(obj);
                    }
                });
                displayErrorAnalyse("NoSimultaneousGroupCourses");
            },
            error: function (msg) {
                console.log("error", msg);
            },
            complete: function (msg) {
                console.log("complete");
                nbDone = nbDone + 1;
                if (nbDone == nbAnalyse) {
                    displayFinishLabel();
                    analyseButton.disabled = false;
                }
            }
        });
        constraint_type = "ConsiderTutorsUnavailability";
        url_get = get_analyse_url(train_prog_sel, year, week, constraint_type);
        console.log(url_get);
        $.ajax({
            type: "GET",
            dataType: 'json',
            url: url_get,
            async: true,
            contentType: "application/json; charset=utf-8",
            success: function (result) {
                console.log("ConsiderTutor;", result);
                result["ConsiderTutorsUnavailability"].forEach((obj) => {
                    if (obj["status"] === "KO") {
                        errorPreAnalyse.push(obj);
                    }
                });
                displayErrorAnalyse("ConsiderTutorsUnavailability");
            },
            error: function (msg) {
                console.log("error:", msg);
            },
            complete: function (msg) {
                console.log("complete");
                nbDone = nbDone + 1;
                if (nbDone == nbAnalyse) {
                    displayFinishLabel();
                    analyseButton.disabled = false;
                }
            }
        });
    });
}

function getTextMessage(obj) {
    messageBuilder = "";
    obj["messages"].forEach((message) => {
        messageBuilder += "\n" + message;
    });
    return messageBuilder;
}

function getTextTitle(obj) {
    return 'Pour la semaine ' + obj["period"]["week"] + " de " + obj["period"]["year"] + ":";
}

function displayErrorAnalyse() {
    // NEED TO FIX THE MERGE UPDATE WITH D3 OTHERWISE SORTING MAKING A MESS WHEN DISPLAYING
    /*let messageAnalyseGroup = d3.select("#divAnalyse").selectAll(".msg_error").data(errorPreAnalyse.sort(function triMessage(a, b) {
        return a["period"]["year"] == b["period"]["year"] ? a["period"]["week"] - b["period"]["week"] : a["period"]["year"] - b["period"]["year"];
    }));
    console.log("This is analyse group", d3.select("#divAnalyse").selectAll(".msg_error").data(errorPreAnalyse.sort(function triMessage(a, b) {
        return a["period"]["year"] == b["period"]["year"] ? a["period"]["week"] - b["period"]["week"] : a["period"]["year"] - b["period"]["year"];
    })));*/
    let messageAnalyseGroup = d3.select("#divAnalyse").selectAll(".msg_error").data(errorPreAnalyse);
    
    let enter = messageAnalyseGroup.enter()
                .append("p")
                .attr("class", "msg_error");

    enter.append("h3")
        .attr("class", "msg_error_week")
        .merge(messageAnalyseGroup.select(".msg_error_week"))
        .text(getTextTitle);

    console.log("this is pre analyse error", errorPreAnalyse);
    let messages_display = enter.selectAll(".detail_analyse").data(function(d){return d["messages"]});
    console.log("this is display", enter.selectAll(".detail_analyse").data(function(d){return d["messages"]}));
    enterMessagesDisplay = messages_display.enter()
                    .append("span")
                    .attr("class", "detail_analyse")
                    .merge(messages_display.select(".detail_analyse"))
                    .text(function(d){return d["str"]});
    enterMessagesDisplay.append("a").attr("href", hrefBuilder).text(textLink);
    console.log(firstCourse);
    enterMessagesDisplay.append("span").style("visibility", hiddingSecondLink).text(",");
    enterMessagesDisplay.append("a").attr("href", hrefBuilder).style("visibility", hiddingSecondLink).text("Second Course");

    
    enterMessagesDisplay.append("br");
    messages_display.exit().remove();
    messageAnalyseGroup.exit().remove();
}

function textLink(d) {
    switch(d["type"]) {
        case "ConsiderDependencies":
            return "First Course";
            break;
        case "NoSimultaneousGroupCourses":
            return "Group";
            break;
        case "ConsiderTutorsUnavailability":
            return "Tutor";
            break
    }
}

function hiddingSecondLink(d) {
    switch(d["type"]) {
        case "ConsiderDependencies":
            return "normal";
        case "NoSimultaneousGroupCourses":
            return "hidden";
        case "ConsiderTutorsUnavailability":
            return "hidden";
    }
}

function hrefBuilder(d) {
    switch(d["type"]) {
        case "ConsiderDependencies":
            if (firstCourse) {
                firstCourse = false;
                return courses_id_url+d["course1"];
            } else {
                firstCourse = true;
                return courses_id_url+d["course2"];
            }
            break;
        case "NoSimultaneousGroupCourses":
            return group_id_url+d["group"];
            break;
        case "ConsiderTutorsUnavailability":
            return tutor_id_url+d["tutor"];
            break
    }
}

function displayFinishLabel() {
    let label = document.getElementById("completion");
    label.style.visibility = "visible";
    label.style.fontSize = "1em";
    label.style.color = "red";
}

function hideFinishLabel() {
    document.getElementById("completion").style.visibility = "hidden";
}

/*
	Main process
*/

var solver_select = document.querySelector("#solver");
var stabilize_select = document.querySelector("#stabilize select");
document.getElementById("divAnalyse").style.overflow = "scroll";
var pre_assign_rooms_checkbox = document.querySelector("#pre-assign-rooms");
var post_assign_rooms_checkbox = document.querySelector("#post-assign-rooms");
var all_weeks_together_checkbox = document.querySelector("#all-weeks-together-checkbox");
var send_log_email_checkbox = document.querySelector("#send-log-email");
var log_email_div = document.querySelector("#divEmail");


time_limit_select = document.querySelector("#limit");
txt_area = document.getElementsByTagName("textarea")[0];
launchButton = document.querySelector("#launch");
if (launchButton)
    launchButton.addEventListener("click", manageSolverProcess);
if (analyseButton){
    analyseButton.addEventListener("click", launchPreanalyse);
}

init_dropdowns();
update_context_view();
