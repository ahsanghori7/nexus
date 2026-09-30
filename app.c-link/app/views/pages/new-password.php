<div class="c-wrapper pulsing-bg d-flex flex-column align-items-center justify-content-center">
    <div class="login-wrapper flex-center">
        <figure class="logo">
            <img src="<?php echo static_path('images/png/clink-logo-mobile.png');?>" alt="C-Link logo mobile">
        </figure>
        <h3>New password</h3>
        <form class="access-account" method="post" id="new-pass-form">
            <div class="col-12 input-wrapper">
                <div class="pass-wrapper" style="position:relative;">
                    <label for="pass"><i class="fas fa-key"></i> New Password</label>
                    <input type="password" id="pass" name="password" placeholder="...." required>
                    <button id="show-pass" type="button" style="position:absolute;right:0;top:12px;background-color:transparent;">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div id="pass-preview" class="element-dialog d-none bottom ">
                    <h5>Password must contain the following:</h5>
                    <p id="letter" class="invalid">A <b>lowercase</b> letter</p>
                    <p id="capital" class="invalid">A <b>capital (uppercase)</b> letter</p>
                    <p id="number" class="invalid">A <b>number</b></p>
                    <p id="special" class="invalid">A <b>special character</b></p>
                    <p id="length" class="invalid">Minimum <b>12 characters</b></p>
                </div>
            </div>
            <div class="col-12 input-wrapper">
                <div class="pass-repeat-wrapper" style="position:relative;">
                    <label for="pass-repeat"><i class="fas fa-key"></i> Repeat your new password</label>
                    <input type="password" name="repeat-password" id="pass-repeat" placeholder="...." required>
                    <button id="show-pass-repeat" type="button" style="position:absolute;right:0;top:12px;background-color:transparent;">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div id="pass-repeat-preview" class="element-dialog d-none bottom" style="height:80px;bottom:-90px;">
                    <h5 class="pass-match-not invalid">The passwords do not match. Please try again.</h5>
                    <h5 class="pass-match valid d-none">The password is correct.</h5>
                </div>
            </div>
            <div class="col-12 input-wrapper text-center">
                <button class="main-btn"><i class="fas fa-unlock-alt"></i> Confirm and Login</button>
            </div>
        </form>
        <figure class="get-keys">
            <img src="<?php echo static_path('images/svg/key.svg');?>" alt="Reset your password">
        </figure>
    </div>
</div>
