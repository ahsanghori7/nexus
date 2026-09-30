<?php

$user = $data["user"] ?? false;
if (!is_object($user)) {
    //Something bad to happen here..
}

$team_role = $data['team_role'] ?? '';
?>
<?php
if (!isset($this)) {
    die();
}
$app = $this->getContext("react_app");
$react = config("tools.react");
$v = $this->getContext("version");
$version = !is_null($v) ?  "_v" . $v : "";
$service = $react["service_url" . $version];
?>


<?php
//Required logic for logo and profile image uploads
include(APP . "views/users/main-contractor/layout/logo.php");
?>

<style type="text/css">
    .error {
        color: #c51244;
        padding-top: 2px;
        padding-left: 10px;
        font-size: 13px;
    }

    .submit:disabled {
        background-color: #ddd;
        color: #000;
        font-weight: bold;
    }

    label {
        font-family: "sofia_pro_softlight";
        font-weight: bold;
        font-style: normal;
        font-size: 0.8rem;
        margin-bottom: 10px;
    }

    #account_image,
    a.fileUpload input.upload {
        position: absolute;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 0;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        width: 100%;
        height: 100%;
        filter: alpha(opacity=0);
    }

    .jconfirm-box {
        font-family: 'sofia_pro_softlight';
    }

    .jconfirm-box .jconfirm-content {
        overflow: hidden;
        padding: 5px;
    }
</style>

<div id='app' style='width:100%; height:64px;'></div>
<script>
    var config = <?= json_encode(App\core\Config::getJsConfig()); ?>;
</script>
<script src="<?php echo $service; ?>/common-app/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/vendors/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service; ?>/runtime/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
<script src="<?php echo $service . "/" . $app; ?>/bundle.js?v=<?php echo date("Y-m-d-h:i:s") ?>"></script>
</body>
<div class="c-main">
    <div id="account-container" class="col-12 layout-wrapper d-flex flex-wrap justify-content-between">
        <div class="c-box d-flex flex-wrap" id="profile-box">
            <div class="col-12 c-box-heading">
                <p>Personal Information</p>
            </div>
            <div class="col-12 c-box-content">
                <form class="d-flex flex-wrap" method="post">
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="far fa-user"></i> First Name</label>
                        <input name="user[firstname]" value="<?php
                                                                echo $user->getData("firstname"); ?>" type="text" required>
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="far fa-user"></i> Last Name</label>
                        <input name="user[lastname]" value="<?php
                                                            echo $user->getData("lastname");; ?>" type="text" required>
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="fas fa-phone-alt"></i> Contact Number</label>
                        <input name="user[contact_number]" value="<?php
                                                                    echo $user->getData("contact_number"); ?>" type="text">
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="far fa-envelope"></i> Email</label>
                        <input name="user[email]" value="<?php
                                                            echo $user->getData("email"); ?>" type="email" required>
                    </div>
                    <div class="col-12 field-holder">
                        <label><i class="fas fa-toolbox"></i> Job Title</label>
                        <input name="user[job_title]" value="<?php
                                                                echo $user->getData("job_title"); ?>" type="text">
                    </div>
                </form>
            </div>

            <div class="col-12 c-box-heading">
                <p>Account Settings</p>
            </div>

            <div class="col-12 c-box-content">
                <form class="d-flex flex-wrap">
                    <div class="col-12 field-holder">
                        <label><i class="far fa-user"></i> Display Name</label>
                        <input name="user[display_name]" value="<?php
                                                                echo $user->getData("display_name"); ?>" type="text">
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <div class="pass-wrapper" style="position:relative;">
                            <label><i class="fas fa-lock"></i> New Password</label>
                            <input name="user[password]" type="password">
                            <button id="show-pass" type="button" style="position:absolute;right:0;top:12px;background-color:transparent;">
                                <i class="fas fa-eye" style="color:#2B3946;"></i>
                            </button>
                        </div>
                        <div id="pass-preview" class="element-dialog d-none bottom">
                            <h5>Password must contain the following:</h5>
                            <p id="letter" class="invalid">A <b>lowercase</b> letter</p>
                            <p id="capital" class="invalid">A <b>capital (uppercase)</b> letter</p>
                            <p id="number" class="invalid">A <b>number</b></p>
                            <p id="special" class="invalid">A <b>special character</b></p>
                            <p id="length" class="invalid">Minimum <b>12 characters</b></p>
                        </div>
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <div class="pass-repeat-wrapper" style="position:relative;">
                            <label><i class="fas fa-unlock-alt"></i> Repeat New Password</label>
                            <input name="password_confirm" type="password">
                            <button id="show-pass-repeat" type="button" style="position:absolute;right:0;top:12px;background-color:transparent;">
                                <i class="fas fa-eye" style="color:#2B3946;"></i>
                            </button>
                        </div>
                        <div id="pass-repeat" class="element-dialog d-none bottom" style="height:80px;bottom:-90px;">
                            <h5 class="pass-match-not invalid">The passwords do not match. Please try again.</h5>
                            <h5 class="pass-match valid d-none">The password is correct.</h5>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <?php
        $company_profile_css = '';
        if ($team_role === 'team_assistant') {
            $company_profile_css = 'opacity:0.5;pointer-events:none';
        }
        ?>
        <div class="c-box d-flex flex-wrap" id="company-profile-box" style="<?php echo $company_profile_css; ?>">

            <div class="col-12 c-box-heading">
                <p>Company Information</p>
            </div>

            <div class="col-12 c-box-content">

                <form class="d-flex flex-wrap" method="POST">
                    <div class="col-12 field-holder">
                        <label><i class="far fa-user"></i> Company Name</label>
                        <input type="text" name="account[name]" value="<?php
                                                                        echo $user->getData("name", "account"); ?>" required>
                    </div>
                    <div class="col-12 field-holder">
                        <label><i class="fas fa-hard-hat"></i> Logo</label>
                        <figure class="company-logo">
                            <img src="<?php echo $user->getCompanyLogo() . "?time=" . time(); ?>">
                            <script type="text/javascript">
                                var cludge = function() {
                                    var e = document.getElementById("account_image");
                                    e.click();
                                    return false;
                                }
                            </script>
                            <input id="account_image" name="account[logo]" type="file" class="upload" accept=".png, .jpg, .jpeg" onchange="previewFile(this, 'account')">
                            <button class="fileUpload" data-toggle="popover" style="" data-trigger="hover" data-placement="top"
                                data-content="Add your company logo" onclick="return cludge(); ">
                                <span><i class="fas fa-camera-retro"></i></span>

                            </button>
                        </figure>
                    </div>
                    <div class="col-12 field-holder">
                        <label><i class="far fa-registered"></i> Registration Number</label>
                        <input name="account[reg_number]" type="text" value="<?php
                                                                                echo $user->getData("reg_number", "account"); ?>">
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="fas fa-map-marker-alt"></i> Company Address</label>
                        <input name="account[address]" type="text" value="<?php
                                                                            echo $user->getData("address", "account"); ?>">
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="fas fa-phone-square-alt"></i> Company Landline Number</label>
                        <input name="account[landline]" type="text" value="<?php
                                                                            echo $user->getData("landline", "account"); ?>">
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="far fa-envelope"></i> Company Email</label>
                        <input name="account[email]" type="email" value="<?php
                                                                            echo $user->getData("email", "account"); ?>" required>
                    </div>
                    <div class="col-12 col-lg-6 field-holder">
                        <label><i class="fab fa-chrome"></i> Company Website</label>
                        <input name="account[website]" type="text" value="<?php
                                                                            echo $user->getData("website", "account"); ?>">
                    </div>
                </form>
            </div>
        </div>

        <div class="c-box full">
            <button class="submit danger-btn">Save</button>
        </div>

    </div>
</div>
<script type="text/javascript">
    $("document").ready(function() {
        const passShow = $("#show-pass");
        const passRepeatShow = $("#show-pass-repeat");
        const expressions = {
            letter: /[a-z]/,
            capital: /[A-Z]/,
            number: /[0-9]/,
            special: /[!%@#$&*_]/,
            length: /[a-zA-Z0-9!@#$&*_]{12,}/
        };

        // Show pass-preview dialog and validate password
        function validatePassword() {
            let password = $("input[name='user[password]']").val();

            // Show the password preview box when typing or focused
            $("#pass-preview").removeClass("d-none");

            // Validate each condition and update the class
            $("#letter").toggleClass("valid", expressions.letter.test(password));
            $("#capital").toggleClass("valid", expressions.capital.test(password));
            $("#number").toggleClass("valid", expressions.number.test(password));
            $("#special").toggleClass("valid", expressions.special.test(password));
            $("#length").toggleClass("valid", expressions.length.test(password));

            $("#letter").toggleClass("invalid", !expressions.letter.test(password));
            $("#capital").toggleClass("invalid", !expressions.capital.test(password));
            $("#number").toggleClass("invalid", !expressions.number.test(password));
            $("#special").toggleClass("invalid", !expressions.special.test(password));
            $("#length").toggleClass("invalid", !expressions.length.test(password));
        };

        function validatePasswordMatch() {
            let password = $("input[name='user[password]']").val();
            let passwordConfirm = $("input[name='password_confirm']").val();

            // Show the password repeat box when focused
            $("#pass-repeat").removeClass("d-none");

            // Check if passwords match
            if (password !== passwordConfirm) {
                $(".submit").attr('disabled', 'disabled');
                $("h5.pass-match").addClass("d-none");
                $("h5.pass-match-not").removeClass("d-none");
            } else {
                $(".submit").removeAttr('disabled');
                $("h5.pass-match").removeClass("d-none");
                $("h5.pass-match-not").addClass("d-none");
            }
        }

        $("input[name='user[password]']").on("keyup focus", () => {
            validatePassword();
        });

        $("input[name='password_confirm']").on("keyup focus", () => {
            if ($("input[name='password_confirm']").val().length) {
                validatePasswordMatch();
            } else {
                $("#pass-repeat").addClass("d-none");
            }
        });

        passShow.on("click", () => {
            const passwordInput = $("input[name='user[password]']");
            const type = passwordInput.prop('type') === 'password' ? 'text' : 'password';
            passwordInput.prop('type', type);
            passShow.find("i").toggleClass("fa-eye-slash");
            passShow.find("i").toggleClass("fa-eye");
        });

        passRepeatShow.on("click", () => {
            const passwordInput = $("input[name='password_confirm']");
            const type = passwordInput.prop('type') === 'password' ? 'text' : 'password';
            passwordInput.prop('type', type);
            passRepeatShow.find("i").toggleClass("fa-eye-slash");
            passShow.find("i").toggleClass("fa-eye");
        });

        $(document).on("click", function(e) {
            const passPreview = $("#pass-preview");
            const passRepeat = $("#pass-repeat");
            const passwordInput = $("input[name='user[password]']");
            const passwordConfirmInput = $("input[name='password_confirm']");
            let password = $("input[name='user[password]']").val();
            let passwordConfirm = $("input[name='password_confirm']").val();

            if (!password.length && !passwordConfirm.length) {
                $(".submit").removeAttr('disabled');
            }

            if (!passPreview.is(e.target) &&
                !passwordInput.is(e.target) &&
                passPreview.has(e.target).length === 0) {
                passPreview.addClass("d-none");
            }

            if (!passRepeat.is(e.target) &&
                !passwordConfirmInput.is(e.target) &&
                passRepeat.has(e.target).length === 0) {
                passRepeat.addClass("d-none");
            }
        });

        // Data object for form handling
        const data = {
            values: {},
            setValues: function() {
                let values = this.getValues();
                $.each(values, (i, e) => {
                    if (!this.values.hasOwnProperty(e.k)) {
                        this.values[e.k] = {};
                    }
                    this.values[e.k][e.p] = {
                        "value": e.v,
                        e: e.e
                    };
                });
            },
            getDeltas: function() {
                let values = this.getValues();
                const deltas = [];
                $.each(values, (i, e) => {
                    let props = this.values[e.k];
                    let initial = props[e.p].value;
                    let val = $(e.e).val();
                    if (val !== initial) {
                        deltas.push(e);
                    }
                });
                return deltas;
            },
            match: function(name) {
                if (name) {
                    let re = /([a-z]+)\[([a-z_]+)\]/;
                    let match = name.match(re);
                    if (match) {
                        return {
                            k: match[1],
                            p: match[2]
                        };
                    }
                }
            },
            getValues: function() {
                var values = [];
                $("#account-container input").each((i, e) => {
                    let match = this.match($(e).attr("name"))
                    let value;
                    if (match) {
                        let type = $(e).attr("type");
                        if (type === 'file') {
                            if (typeof e.files[0] !== 'undefined') {
                                value = e.files[0].name;
                            }
                        } else {
                            value = $(e).val();
                        }
                        match["v"] = value;
                        match["e"] = e;
                        values.push(match);
                    }
                });
                return values;
            },
            hasErrors: function() {
                return ($("#account-container .error").length > 0);
            },
            validate: function(deltas) {
                if (deltas.length > 0) {
                    $.each(deltas, (i, e) => {
                        let required = $(e.e).attr("required");
                        if (required && !e.v) {
                            this.toggleError(e.e, false, "Required Field");
                        }

                        //Custom Validators are defined in validators.js
                        if (e.v && validators.hasOwnProperty(e.p)) {
                            var invalid = isInvalid(e.p, e.v, e.e);
                            this.toggleError(e.e, (invalid === false), invalid);
                        }
                    });
                    return (this.hasErrors() === false);
                }
            },
            toggleError: function(input, valid, message) {
                let parent = $(input).parent();
                let errors = $(parent).find(".error");
                if (!valid) {
                    if (!errors.length) {
                        parent.append("<p class='error'>" + message + "</p>");
                    } else {
                        $(errors[0]).text(message);
                    }
                } else {
                    for (let i = 0; i < errors.length; i++) {
                        $(errors[i]).remove();
                    }
                }
            },
            save: function() {
                var deltas = this.getDeltas();
                if (this.validate(deltas)) {
                    var buckets = {};
                    $.each(deltas, function(i, e) {
                        if (!buckets.hasOwnProperty(e.k)) {
                            buckets[e.k] = {};
                        }
                        buckets[e.k][e.p] = e.v;
                    });

                    $(".submit").toggleClass("btn-success").text("Saved")
                    $.ajax({
                        url: '/relay?action=account&method=update',
                        data: JSON.stringify(buckets),
                        type: 'PATCH',
                        contentType: 'application/json'

                    }).done((msg) => {
                        this.setValues();
                        setTimeout(function() {
                            $(".submit").toggleClass("btn-success").text("Save");
                        }, 2000);
                    });
                }
            }
        }

        $("#account-container button").click(() => {
            data.save()
        });

        // Populate initial values
        data.setValues();
    });
</script>
