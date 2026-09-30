
var config = {};

/*
 * Ajax
 */

var ajax = {

    /**
     * Default ajax function.
     *
     * @param  string   url             URL to send ajax call
     * @param  mixed    postData        data that will be sent to the server(PHP)
     * @param  function callback        Callback Function that will be called upon success or failure
     * @param  string   spinnerBlock    An element where the spinner will be next to it
     *
     */
    send: function(url, postData, callback, spinnerBlock, spinnerCenter){
        $.ajax({
            url: config.root + url,
            type: "POST",
            data: helpers.appendCsrfToken(postData),
            dataType: "json",
            beforeSend: function() {
                ajax.runSpinner(spinnerBlock,spinnerCenter);
            }
        })
            .done(function(data) {
                ajax.stopSpinner(spinnerBlock);
                if(typeof data.success != 'undefined' && data.success === true)
                {
                    if(typeof data.message != 'undefined')
                    {
                        helpers.displaySuccess(data.message);
                    }else{
                        helpers.displaySuccess();
                    }
                    callback(data);
                }else if(typeof data.message != 'undefined')
                {
                        helpers.displayError(data.message);
                }else{
                    helpers.displayError();
                }

            })
            .fail(function(jqXHR) {
                ajax.stopSpinner(spinnerBlock);
                switch (jqXHR.status){
                    case 0:
                        callback(null);
                    case 302:
                        helpers.redirectTo(config.root);
                        break;
                    default:
                        if(typeof jqXHR.responseJSON != 'undefined' && typeof jqXHR.responseJSON.success != 'undefined')
                        {
                            if(jqXHR.responseJSON.success === false && jqXHR.responseJSON.message != '')
                            {
                                helpers.displayError(jqXHR.responseJSON.message);
                            }
                        }else{
                            helpers.displayError();
                        }
                }
            })
            .always(function() {
                ajax.stopSpinner(spinnerBlock);
            });
    },

    /**
     * Ajax call - ONLY for files.
     *
     * @param  string   url             URL to send ajax call
     * @param  object   fileData        data(formData) that will be sent to the server(PHP)
     * @param  function callback        Callback Function that will be called upon success or failure
     *
     */
    upload: function(url, fileData, callback, spinnerBlock, spinnerCenter){
        $.ajax({
            url: config.root + url,
            type: "POST",
            data: helpers.appendCsrfToken(fileData),
            dataType: "json",
            beforeSend: function () {
                // reset the progress bar
                $(".progress .progress-bar").css("width", "0%").html("0%");

            },
            xhr: function() {
                var myXhr = $.ajaxSettings.xhr();
                // check if upload property exists
                if(myXhr.upload){
                    myXhr.upload.addEventListener('progress', ajax.progressbar, false);
                    $(".progress").removeClass("display-none");
                }
                return myXhr;
            },
            contentType: false,
            cache: false,
            processData:false
        })
            .done(function(data) {
                ajax.stopSpinner(spinnerBlock);
                if(typeof data.success != 'undefined' && data.success === true)
                {
                    if(typeof data.message != 'undefined')
                    {
                        helpers.displaySuccess(data.message);
                    }else{
                        helpers.displaySuccess();
                    }
                    callback(data);
                }else if(typeof data.message != 'undefined')
                {
                        helpers.displayError(data.message);
                }else{
                    helpers.displayError();
                }

            })
            .fail(function(jqXHR) {
                ajax.stopSpinner(spinnerBlock);
                switch (jqXHR.status){
                    case 0:
                        callback(null);
                    case 302:
                        helpers.redirectTo(config.root);
                        break;
                    default:
                        if(typeof jqXHR.responseJSON != 'undefined' && typeof jqXHR.responseJSON.success != 'undefined')
                        {
                            if(jqXHR.responseJSON.success === false && jqXHR.responseJSON.message != '')
                            {
                                helpers.displayError(jqXHR.responseJSON.message);
                            }
                        }else{
                            helpers.displayError();
                        }
                }
            })
            .always(function() {
                ajax.stopSpinner(spinnerBlock);
            });
    },
    progressbar: function(e){
        if(e.lengthComputable){
            var meter = parseInt((e.loaded/e.total) * 100);
            $(".progress .progress-bar").css("width", meter+"%").html(meter + "%");
        }
    },
    runSpinner: function(spinnerBlock, spinnerCenter){
        helpers.loader(spinnerBlock,spinnerCenter);
    },
    stopSpinner: function(spinnerBlock, spinnerEle){
        $(spinnerBlock).find(".overlay-loader").fadeOut(300);
    }
};

/*
 * App
 *
 */
var app = {
    init: function (){

    }
};


/*
 * Helpers
 *
 */


var helpers = {

    /**
     * append csrf token to data that will be sent in ajax
     *
     * @param  mixed  data
     *
     */
    appendCsrfToken: function (data){

        if(typeof (data) === "string"){
            if(data.length > 0){
                data = data + "&framework_csrf_token=" + config.csrfToken;
            }else{
                data = data + "framework_csrf_token=" + config.csrfToken;
            }
        }

        else if(data.constructor.name === "FormData"){
            data.append("framework_csrf_token", config.csrfToken);
        }

        else if(typeof(data) === "object"){
            data.framework_csrf_token = config.csrfToken;
        }

        return data;
    },

    /**
     * Extend the serialize() function in jQuery.
     * This function is designed to add extra data(name => value) to the form.
     *
     * @param   object  ele     Form element
     * @param   string  str     String to be appended to the form data.
     * @return  string          The serialized form data in form of: "name=value&name=value"
     *
     */
    serialize: function (ele, str){
        if(helpers.empty(str)){
            return $(ele).serialize();
        } else {
            return $(ele).serialize()  + "&" + str;
        }
    },

    /**
     * This function is used to redirect.
     *
     * @param string location
     */
    redirectTo: function (location){
        window.location.href = location;
    },

    /**
     * encode potential text
     * All encoding are done and must be done on the server side,
     * but you can use this function in case it's needed on client.
     *
     * @param string  str
     */
    encodeHTML: function (str){
        return $('<div />').text(str).html();
    },

};
