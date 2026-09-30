
const getInputByName = function(name) {
    let els = document.querySelectorAll('[name="'+ name +'"]');
    if(els.length === 1) {
        return els[0];
    }
}

const matchInputs = function(val, altname) {
    let altel = $('input[name='+altname+']').val();
    if(altval && altval !== val){
        return false;
    }
    return true;
}

const validators = {

    email : [
        {
            "message" : "Emails do not match",
            "func" : function(val, input) {
               let name = input.getAttribute("name");
               let alt = getInputByName(name === "email" ? "email_confirm" : "email")
               if(alt) {
                    return (input.value === alt.value);
               }
               return true;
           }
        },

        {
            "message" : "Insert a valid email address",
            "func" : function(val, input) {
                let name = input.getAttribute("name");
                let alt = getInputByName(name === "email" ? "email_confirm" : "email");
                if (alt) {
                    return true;
                }
                const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(val);
            }
        },

        {
            "message" : "Emails already exists",
            "func" : function(val, input) {
                let name = input.getAttribute("name")
                if(name === "email_confirm"){
                    //dont bother validating confirm email address
                    return true;
                }
                var response = $.ajax({
                    url: '/relay?action=account&method=emailExists&email=' + val,
                    async: false,
                    type : "GET"
                });
                try {
                    var json = JSON.parse(response.responseText);
                    return (json["exists"] !== true)
                }
                //cant valid email exists if api fails
                catch (error) {
                    return false;
                }
            }
        }
    ],
    "password" : [
        {
                "message" : "Please Confirm Password",
                "func" : function(val, input) {
                    let alt = getInputByName("password_confirm");
                    return (alt.value !== "");
                }
        },
        {
            "message" : "Passwords do not match",
            "func" : function(val, input) {
                let name = input.getAttribute("name");
                let alt = getInputByName("password_confirm")
                return (input.value === alt.value);
            }
        },
        {
            "message" : "Password is not strong enough",
            "func" : function(val, input) {
                let name = input.getAttribute("name")
                if(name === "password_confirm"){
                    //dont bother validating confirm email adrress
                    return true;
                }
                let re = /^(?=.*[A-Z])(?=.*[!@#$&*_])(?=.*[0-9]).{6,}$/
                return re.test(val);
            }
        }
    ],
    name : [
        {
            "message" : "Company name already in use",
            "func" : function(val, input) {
                var response = $.ajax({
                    url: '/relay?action=account&method=companyExists&company=' + val,
                    async: false,
                    type : "GET"
                });
                try {
                    var json = JSON.parse(response.responseText);
                    return (json["exists"] !== true)
                }
                    //cant valid email exists if api fails
                catch (error) {
                    return false;
                }
            }
        }
    ]
};

const isInvalid = function(key, value, input) {
    if(validators.hasOwnProperty(key)) {
        for(let i=0;i<validators[key].length;i++) {
            var check = validators[key][i].func(value, input);
            if(!check) {
                return validators[key][i]["message"];
            }
        }
    }
    return false;
}
