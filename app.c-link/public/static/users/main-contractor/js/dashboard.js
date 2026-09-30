/**
 * THIS IS ONLY FOR LEARNING PURPOSE TO HELP FLORIN
 * THIS SHOULD BE CHANGED TO A BETTER WAY OF HANDLING THE AJAX REQUEST
 * @param activity
 * @returns {string}
 */

function activity_html(activity) {
    let html;
    html = '<div class="activity-feed">';
    if(typeof activity.viewed === 'undefined' || activity.viewed == "0"){
        html += '<p class="' + activity.display_class + '"><span class="new">New</span> ' + activity.display_prefix + ' ' + activity.display + '</p>';
    }else{
        html += '<p class="' + activity.display_class + '">' + activity.display_prefix + ' ' + activity.display + '</p>';
    }
    html += '<div class="d-flex justify-content-start">';
    html += '<a href="' + activity.view + '" class="read" data-toggle="popover" data-trigger="hover" data-placement="top" data-content="' + activity.tooltip + '"><i class="far fa-eye"></i></a>';
    html += '<span>OR</span>';
    html += '<a data-id="' + activity.id + '" href="javascript:void(0)" class="delete" data-toggle="popover" data-trigger="hover" data-placement="top" data-content="Dismiss this notification"><i class="far fa-trash-alt"></i></a>';
    html += '</div>';
    html += '</div>';

    return html;
}

function activities_callback(activities) {
    if(activities.length === 0)
    {
        $(".no-activities").removeClass("d-none");
        return;
    }
    $.each(activities, function (key, activity) {
        $("#activity-box .activity-feed-wrapper").append(activity_html(activity));
    });
    $(".activity-feed-wrapper").mCustomScrollbar();
}

function activity_remove(activity_id) {
    $.ajax({
        url: config.legacy_url + '/ajax',
        type: 'POST',
        data: {
            'action': 'activity_remove',
            'activity_id': activity_id,
            'user_id': config.user_id,
            'LEGACY_AJAX_TOKEN': config.legacy_ajax_token,
            'role': 'main-contractor',
            'token': getCookie('token'),
            'ghost': getCookie('ghost')
        },
        success: function (response) {
            let activity_feed = $("a[data-id='" + activity_id + "']").parents(".activity-feed");
            $(activity_feed).fadeOut(500, function () {
                $(activity_feed).remove();
            })
        },
        error: function (error) {
            console.log(error)
        }
    });

}

function calendar_callback(events) {
    var calendarEl = document.getElementById('calendar-dashboard');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        timeZone: 'local',
        themeSystem: 'standard',
        selectable: true,
        selectHelper: true,
        headerToolbar: {
            left: 'prev,next,today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        eventClick: function (calEvent, jsEvent, view) {
            $.alert({
                title: '',
                content: calEvent.event._def.extendedProps.full_title,
                type: 'green'
            });
        },
        select: function(start) {
            $.confirm({
                title: 'Add a new event',
                content: '' +
                    '<form action="" class="addEvent">' +
                    '<div class="form-group">' +
                    '<label>Type the name of your event</label>' +
                    '<input type="text" class="eventName form-control" required />' +
                    '</div>' +
                    '</form>'
                ,
                type: 'green',
                buttons: {
                    formSubmit: {
                        text: 'Submit',
                        btnClass: 'action-btn',
                        action: function () {
                            const name = this.$content.find('.eventName').val();
                            if(name){
                                $.ajax({
                                    url: config.legacy_url + '/ajax',
                                    type: 'POST',
                                    data: {
                                        'action': 'project_calendar_add_custom',
                                        'title': name,
                                        'start': start.startStr,
                                        'end': start.endStr,
                                        'LEGACY_AJAX_TOKEN': config.legacy_ajax_token,
                                        'role': 'main-contractor',
                                        'user_id': config.user_id,
                                    },
                                    success: function (response) {
                                        events = response.data.events;
                                        calendar_callback(events);
                                    },
                                    error: function (error) {
                                        console.log(error)
                                    }
                                });
                            } else {
                                $.alert('Please provide an event title');
                            }

                        }
                    },
                    cancel: function () {
                        // close button. Function does nothing, but it's needed for the cancel button to appear
                    }
                }
            });

            calendar.unselect();
        },
        editable: true,
        events: events,
        eventLimit: true,
    });
    calendar.render();
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

$(document).ready(function () {

    $.ajax({
        url: config.legacy_url + '/ajax',
        type: 'POST',
        data: {
            'action': 'project_calendar',
            'user_id': config.user_id,
            'LEGACY_AJAX_TOKEN': config.legacy_ajax_token,
            'role': 'main-contractor',
            'token': getCookie('token'),
            'ghost': getCookie('ghost')
        },
        success: function (response) {
            events = response.data.events;
            calendar_callback(events);
        },
        error: function (error) {
            $.alert({
                title: 'Oops!!!',
                content: 'There is an error with your calendar. Dont worry, this is on us.',
                type: 'red'
            });
        }
    });


    $.ajax({
        url: config.legacy_url + '/ajax',
        type: 'POST',
        data: {
            'action': 'project_activity',
            'user_id': config.user_id,
            'LEGACY_AJAX_TOKEN': config.legacy_ajax_token,
            'role': 'main-contractor',
            'token': getCookie('token'),
            'ghost': getCookie('ghost')
        },
        success: function (response) {
            activities = response.data.activities;
            if (activities) {
                activities_callback(activities);
            }
        },
        error: function (error) {
            $.alert({
                title: 'Oops!!!',
                content: 'There is an error in your activity panel. Dont worry, this is on us.',
                type: 'red'
            });
        }
    });


    $(".activity-feed-wrapper").on("click", ".activity-feed a.delete", function () {
        let activity_id = $(this).data("id");
        if (typeof activity_id === 'undefined' || !activity_id) {
            $.alert({
                title: 'Error',
                content: 'Something went wrong',
                type: 'red'
            });
            return;
        }
        activity_remove(activity_id);
    });

});
