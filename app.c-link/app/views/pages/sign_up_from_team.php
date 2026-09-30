<link rel="stylesheet" href="<?php echo static_path('css/sign_up_from_team.css') ?>">

<?php if (isset($data) && !$data["is_ANZ"]){ ?>
<header id="masthead" class="site-header" role="banner">
    <div class="header-block" id="sticky-header">
        <div class="center">
            <div class="header-inner">
                <div class="logo">
                    <a href="<?php echo clink_url();?>">
                        <img src="<?php echo static_path('images/svg/logo.svg'); ?>" alt="">
                    </a>
                </div>
                <div class="menu-toogle">
                    <div class="bar"></div>
                </div>

                <div class="header-nav side-header">
                    <div class="menu-close"><div class="bar"></div> </div>
                    <ul>
                        <li class="menu-item-has-children">
                            <a href="javascript:void(0)">Products</a>
                            <ul class="sub-menu">
                                <li id="menu-item-26" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-26"><a href="<?php echo clink_url('/product/what-is-c-link');?>">What is C-Link?</a></li>
                                <li id="menu-item-25" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-25"><a href="<?php echo clink_url('/product/everything-in-one-place');?>">Everything in One Place</a></li>
                                <li id="menu-item-255" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-255"><a href="<?php echo clink_url('/product/pool-of-vetted-subcontractors');?>">A Pool of Vetted Subcontractors</a></li>
                                <li id="menu-item-373" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-373"><a href="<?php echo clink_url('/product/streamline-procurement');?>">Streamline and Automate your Procurement</a></li>
                                <li id="menu-item-372" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-372"><a href="<?php echo clink_url('/product/control-quality-and-deliverability');?>">Control quality and deliverability</a></li>
                                <li id="menu-item-433" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-433"><a href="<?php echo clink_url('/product/improve-profitability');?>">Improve profitability</a></li>
                                <li id="menu-item-432" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-432"><a href="<?php echo clink_url('/boq-package-preparation');?>">Bill of Quantities and Package Preparation</a></li>
                                <li id="menu-item-518" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-518"><a href="<?php echo clink_url('/one-to-one-training');?>">One to One Training</a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/pricing');?>">Pricing</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/resources');?>">Resources</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/blog');?>">Blog</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/contact-us');?>">Contact</a>
                        </li>
                    </ul>
                    <div class="login-block">
                        <a href="/login" class="login">Login</a>
                        <a href="/pricing" class="signup">Sign up</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="header-block" id="sticky-menu">
        <div class="center">
            <div class="header-inner">
                <div class="logo">
                    <a href="<?php echo clink_url();?>">
                        <img src="<?php echo static_path('images/svg/logo.svg'); ?>" alt="">
                    </a>
                </div>
                <div class="menu-toogle">
                    <div class="bar"></div>
                </div>
                <div class="header-nav side-header">
                    <div class="menu-close"><div class="bar"></div> </div>
                    <ul>
                        <li>
                            <a href="javascript:void(0)">Products</a>
                            <ul class="sub-menu">
                                <li id="menu-item-26" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-26"><a href="<?php echo clink_url('/product/what-is-c-link');?>">What is C-Link?</a></li>
                                <li id="menu-item-25" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-25"><a href="<?php echo clink_url('/product/everything-in-one-place');?>">Everything in One Place</a></li>
                                <li id="menu-item-255" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-255"><a href="<?php echo clink_url('/product/pool-of-vetted-subcontractors');?>">A Pool of Vetted Subcontractors</a></li>
                                <li id="menu-item-373" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-373"><a href="<?php echo clink_url('/product/streamline-procurement');?>">Streamline and Automate your Procurement</a></li>
                                <li id="menu-item-372" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-372"><a href="<?php echo clink_url('/product/control-quality-and-deliverability');?>">Control quality and deliverability</a></li>
                                <li id="menu-item-433" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-433"><a href="<?php echo clink_url('/product/improve-profitability');?>">Improve profitability</a></li>
                                <li id="menu-item-432" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-432"><a href="<?php echo clink_url('/boq-package-preparation');?>">Bill of Quantities and Package Preparation</a></li>
                                <li id="menu-item-518" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-518"><a href="<?php echo clink_url('/one-to-one-training');?>">One to One Training</a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/pricing');?>">Pricing</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/resources');?>">Resources</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/blog');?>">Blog</a>
                        </li>
                        <li>
                            <a href="<?php echo clink_url('/contact-us');?>">Contact</a>
                        </li>
                    </ul>
                    <div class="login-block">
                        <a href="/login" class="login">Login</a>
                        <a href="/pricing" class="signup">Sign up</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>
<?php } ?>

<div id="content" class="site-content">
	<div id="primary" class="content-area">
		<main id="main" class="site-main" role="main">

                <?php
                    if(!isset($data['team_validation']) || !$data['team_validation']):
                ?>
				<div class="cms-inner-block">
					<form method="POST" class="form-wrap-block" id="sign-up-team-email">
						<div class="cms-page-spacing cms-banner-block team-get-started-block deep-gredient-bottom">
							<div class="center">
								<h2>Get started</h2>
								<h3>Simply enter your email below</h3>
								<p>This helps us match what team you are looking to join.</p>
								<div class="team-get-started-form">
									<input type="text" data-validate="email" name="email" value="" placeholder="Enter your Email address here...">
									<input type="hidden" name="team_validation" value="1">
								</div>
							</div>
						</div>
						<div class="book-demo-block team-create-button-one">
							<div class="center">
								<div class="button-block">
									<a href="javascript:void(0)" class="button button-pink button-submit">Continue to the next step</a>
								</div>
							</div>
						</div>
					</form>
				</div>
			<?php
			else :
			?>
				<div class="cms-inner-block">
					<div class="cms-page-spacing cms-banner-block deep-gredient-bottom">
						<div class="center">
							<h2>You’re invited to join</h2>
							<h3><?php echo $data['company']; ?>’s team</h3>
							<p>Please fill out the details below making sure that you use a <b>capital letter</b>, a <b>number</b> <br>
								and a <b>special character</b>, and is at least <b>12 characters</b> long. </p>
						</div>
					</div>
					<div class="marketplace-prosper-block download-resource-form">
						<div class="center">
							<div class="marketplace-prosper-block-form team-form">
								<form method="POST" class="form-wrap-block" id="sign-up-team">
									<ul>
										<li>
											<label>First name <span>*</span></label>
											<input type="text" id="" value="<?php echo $data['firstname']; ?>" name="first_name" maxlength="50">
										</li>
										<li>
											<label>Last name <span>*</span></label>
											<input type="text" id="" value="" name="last_name" maxlength="50">
										</li>
										<li>
											<label>Phone number <span>*</span></label>
											<input type="tel" id="" value="" name="phone_number" maxlength="30">
										</li>
										<li class="chosen-pass">
											<div class="pass-wrapper" style="position:relative;">
												<label>Password <span>*</span></label>
												<input type="password" value="" data-validate="password" id="" name="password">
												<button id="show-pass" type="button" style="position:absolute;right:0;top:35%;background-color:transparent;">
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
										</li>
										<li class="repeat-chosen-pass">
											<div class="pass-repeat-wrapper" style="position:relative;">
												<label>Repeat password <span>*</span></label>
												<input type="password" value="" data-validate="password" id="" name="repeat-password">
												<button id="show-pass-repeat" type="button" style="position:absolute;right:0;top:35%;background-color:transparent;">
													<i class="fas fa-eye" style="color:#2B3946;"></i>
												</button>
											</div>
											<div id="pass-repeat" class="element-dialog d-none bottom" style="height:80px;bottom:-90px;">
                        <h5 class="pass-match-not invalid">The passwords do not match. Please try again.</h5>
                        <h5 class="pass-match valid d-none">The password is correct.</h5>
                    	</div>
										</li>
										<li>
											<p>
												<span class="checkbox-wrap">
													<label class="custom-checkbox">
														<input type="checkbox" name="terms_accepted" id="">
														<span class="checkmark"></span>
													</label>
												</span>
												Accept terms & add me to your email list <a href="<?php echo clink_url('terms-conditions'); ?>" target="_blank">View terms & conditions</a>
											</p>
										</li>
									</ul>
									<input type="hidden" name="email" value="<?php echo $data['email']; ?>">
									<input type="hidden" name="team_sign_up" value="1">
								</form>
							</div>
						</div>
					</div>
					<div class="book-demo-block team-create-button-two">
						<div class="center">
							<div class="button-block">
								<a href="javascript:void(0)" class="button button-pink button-create-account">Create account</a>
							</div>
						</div>
					</div>
				</div>
				<script type="text/javascript">
					$("document").ready(function () {
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
							let password = $("input[name='password']").val();

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
							let password = $("input[name='password']").val();
							let passwordConfirm = $("input[name='repeat-password']").val();

							// Show the password repeat box when focused
							$("#pass-repeat").removeClass("d-none");

							// Check if passwords match
							if (password !== passwordConfirm) {
									$("h5.pass-match").addClass("d-none");
									$("h5.pass-match-not").removeClass("d-none");
							} else {
									$("h5.pass-match").removeClass("d-none");
									$("h5.pass-match-not").addClass("d-none");
							}
						}

						$("input[name='password']").on("keyup focus", () => {
							validatePassword();
						});

						$("input[name='repeat-password']").on("keyup focus", () => {
							if($("input[name='repeat-password']").val().length){
								validatePasswordMatch();
							} else {
								$("#pass-repeat").addClass("d-none");
							}
						});

						passShow.on("click", () => {
							const passwordInput = $("input[name='password']");
							const type = passwordInput.prop('type') === 'password' ? 'text' : 'password';
							passwordInput.prop('type', type);
							passShow.find("i").toggleClass("fa-eye-slash");
							passShow.find("i").toggleClass("fa-eye");
						});

						passRepeatShow.on("click", () => {
							const passwordInput = $("input[name='repeat-password']");
							const type = passwordInput.prop('type') === 'password' ? 'text' : 'password';
							passwordInput.prop('type', type);
							passRepeatShow.find("i").toggleClass("fa-eye-slash");
							passShow.find("i").toggleClass("fa-eye");
						});

						$(document).on("click", function (e) {
							const passPreview = $("#pass-preview");
							const passRepeat = $("#pass-repeat");
							const passwordInput = $("input[name='password']");
							const passwordConfirmInput = $("input[name='repeat-password']");
							let password = $("input[name='password']").val();
							let passwordConfirm = $("input[name='repeat-password']").val();

							if (!passPreview.is(e.target)
							&& !passwordInput.is(e.target)
							&& passPreview.has(e.target).length === 0) {
								passPreview.addClass("d-none");
							}

							if (!passRepeat.is(e.target)
							&& !passwordConfirmInput.is(e.target)
							&& passRepeat.has(e.target).length === 0) {
								passRepeat.addClass("d-none");
							}
						});
					});
				</script>
			<?php
			endif;
			?>

			<script type="text/javascript">
				const emptyInputMessage = "Required field";
				const noMatchPasswordMessage = "Passwords do not match";

				// Keep in sync with the account service, it rejects anything looser
				const nameMaxLength = 50;
				const phoneMaxLength = 30;
				const passwordMinLength = 12;

				const passwordRules = [
					{ pattern: /[a-z]/, message: "Password needs a lowercase letter" },
					{ pattern: /[A-Z]/, message: "Password needs a capital letter" },
					{ pattern: /[0-9]/, message: "Password needs a number" },
					{ pattern: /[!%@#$&*_]/, message: "Password needs a special character" }
				];

				// Length uses the raw value since that is what gets posted
				function validateText(val, maxLength) {
					if (val.trim() === '') {
						return emptyInputMessage;
					}
					if (val.length > maxLength) {
						return `Must be ${maxLength} characters or fewer`;
					}
					return '';
				}

				const validators = [{
						name: "first_name",
						valid: (val) => validateText(val, nameMaxLength)

					},
					{
						name: "last_name",
						valid: (val) => validateText(val, nameMaxLength)
					},
					{
						name: "phone_number",
						valid: (val) => validateText(val, phoneMaxLength)
					},
					{
						name: "password",
						valid: function(val) {
							if (val.trim() === '') {
								return emptyInputMessage;
							}
							if (val.length < passwordMinLength) {
								return `Password must be at least ${passwordMinLength} characters`;
							}
							const unmet = passwordRules.find((rule) => !rule.pattern.test(val));
							return unmet ? unmet.message : '';
						}
					},
					{
						name: "repeat-password",
						valid: function(val) {
							if (val.trim() === '') {
								return emptyInputMessage;
							}
							if (val.trim() !== $('[name=password]').val().trim()) {
								return noMatchPasswordMessage;
							}
							return '';
						}
					},
					{
						name: "terms_accepted",
						valid: () => {
							return $(`[name=terms_accepted]`).is(':checked') ? '' : emptyInputMessage;
						}
					},
				];

				function isInputValid(input) {
					const type = $(`[name=${input.name}]`).prop('type');
					switch (type) {
						case 'text':
						case 'password':
						case 'tel':
							const inputName = $(`[name=${input.name}]`);
							return input.valid ? input.valid(inputName.val()) : true;
						case 'checkbox':
							return input.valid ? input.valid() : true;
						default:
							return false;
					}
				}

				function showValidInput(input) {
					const inputName = $(`[name=${input.name}]`);
					inputName.css('border', '1px solid #DFDFEA');
					inputName.parent().children('span').remove();
				}

				function showInvalidInput(input, message) {
					const inputName = $(`[name=${input.name}]`);
					showValidInput(input);
					inputName.css('border', '1px solid #ed1164');
					inputName.parent().append(`<span class="error">${message}</span>`)
				}

				function showValidChechbox(input) {
					const inputName = $(`[name=${input.name}]`);
					inputName.parent().parent().parent().children('span.error').remove();
				}

				function ShowInvalidChechbox(input, message) {
					const inputName = $(`[name=${input.name}]`);
					showValidChechbox(input);
					inputName.parent().parent().parent().append(`<span class="error checkbox-error">${message}</span>`)
				}

				function isFormValid() {
					let valid = true;

					validators.forEach(validator => {
						const type = $(`[name=${validator.name}]`).prop('type');
						const errorMessage = isInputValid(validator);
						const textTypes = ['text', 'password', 'tel'];

						if (errorMessage) {
							valid = false;
							if (textTypes.includes(type)) {
								showInvalidInput(validator, errorMessage)
							} else if (type === 'checkbox') {
								ShowInvalidChechbox(validator, errorMessage)
							}
						} else {
							if (textTypes.includes(type)) {
								showValidInput(validator, errorMessage)
							} else if (type === 'checkbox') {
								showValidChechbox(validator, errorMessage)
							}
						}
					});

					return valid;
				}

				$(".button-create-account").click(function() {
					if (isFormValid()) {
						$("#sign-up-team").submit();
					}
				});

				$( "#sign-up-team-email .button-submit" ).click(function(){
				    $("#sign-up-team-email").submit();
				});
			</script>
		</main>
	</div>
</div>

<footer id="colophon" class="site-footer" role="contentinfo">
    <div class="footer-block">
        <div class="center">
            <div class="footer-link">
                <h5>Features</h5>
                <ul>
                    <li>
                        <a href="<?php echo clink_url('/product/what-is-c-link');?>">All features</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/product/pool-of-vetted-subcontractors');?>">Subcontractors</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/one-to-one-training');?>">Training</a>
                    </li>
                </ul>
            </div>
            <div class="footer-link">
                <h5>Resources</h5>
                <ul>
                    <li>
                        <a href="<?php echo clink_url('/3-minutes-demo');?>">3 Minute demo</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/blog');?>">Blog</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/resources');?>">Ebooks and templates</a>
                    </li>
                    <li>
                        <a title="Opens in a new tab" target="_blank" rel="noopener" href="https://www.buzzsprout.com/1788151">Own the build podcast</a>
                    </li>
                    <li>
                        <a title="Opens in a new tab" target="_blank" rel="noopener" href="https://otb-videos.c-link.com/">Own the build videos</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/roi-calculator');?>">ROI calculator</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/cost-planning-tool');?>">Cost planning tool</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/blog-sign-up');?>">Subscribe to the newsletter</a>
                    </li>
                </ul>
            </div>
            <div class="footer-link">
                <h5>Information</h5>
                <ul>
                    <li>
                        <a href="<?php echo clink_url('/about-page');?>">About us</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/our-customers');?>">Our Network</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/our-guarantee');?>">The C-Link guarantee</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/book-demo');?>">Book a demo</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/terms-conditions');?>">Terms and Conditions</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/privacy-policy');?>">Privacy Policy</a>
                    </li>
                    <li>
                        <a href="<?php echo clink_url('/contact-us');?>">Contact</a>
                    </li>
                </ul>
            </div>
            <div class="footer-link social-link">
                <div class="social-inner">
                    <h5>Socials</h5>
                    <ul class="footer-social">
                        <li>
                            <a href="https://www.youtube.com/channel/UCuoaR0Dx9-I1tRWBKfjzrNA">
                                <img src="<?php echo static_path('images/svg/footer-youtube-icon.svg'); ?>" alt="">
                            </a>
                        </li>
                        <li>
                            <a href="https://www.linkedin.com/company/construction-link-limited">
                                <img src="<?php echo static_path('images/svg/footer-linkdin-icon.svg'); ?>" alt="">
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="clink-footer-logo">
                    <a href="<?php echo clink_url();?>">
                        <img src="<?php echo static_path('images/svg/footer-logo.svg'); ?>" alt="">
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="copyright-block">
        <div class="center">
            <div class="copyright-clink-footer-logo">
                <a href="<?php echo clink_url();?>">
                    <img src="<?php echo static_path('images/svg/footer-logo.svg'); ?>" alt="">
                </a>
            </div>
            <p>Copyright 2022 C-Link. All rights reserved</p>
        </div>
    </div>
</footer>

<script type="text/javascript">
	jQuery(document).ready(function(){
		jQuery(window).scroll(function(){
			var scrollTop = jQuery(window).scrollTop();
			if (scrollTop > 100) {
				jQuery('#sticky-menu').addClass('fadeInDown');
				jQuery('#sticky-menu').addClass('fixed');
				jQuery('#sticky-menu').fadeIn(300);
			} else {
				jQuery('#sticky-menu').removeClass('fixed');
				jQuery('#sticky-menu').removeClass('fadeInDown');
				jQuery('#sticky-menu').fadeOut(300);
			}
		})
		jQuery('.menu-toogle').click(function() {
			jQuery('.side-header').addClass('show');
			jQuery('body').addClass('scroll-hidden');
		});
		jQuery('.menu-close').click(function() {
			jQuery('.side-header').removeClass('show');
			jQuery('body').removeClass('scroll-hidden');
		});
		jQuery('.side-header ul li.menu-item-has-children').click(function() {
			jQuery('.side-header.show ul li .sub-menu').slideToggle(500);
		});
	});
</script>
