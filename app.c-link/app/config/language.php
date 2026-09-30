<?php

    /**
     * Class LanguageControl
     * For all messages to be show to the user via the frontend
     */
class LanguageControl {

    protected static $strings = [
        //Errors
        "fatal_error" => "An error has occurred staff have been notified and will be in contact",
        "generic_error" => "An error has occurred",
        "no_access"=> "You don\'t have access to do this",
        "required_password" => "The password is required",
        "required_email" => "The email address is required",
        "invalid_credentials" => "Invalid password or username",
        "terms_not_accepted" => "Terms not accepted",
        "email_exists" => "Email already exists",
        "disabled_account" => "Your account is disabled",
        "sso_login_failed" => "SSO login has temporarily failed. Our team has been notified. If the issue persists, please contact support."
    ];

    /**
     * @param string $k
     * @return string
     */
    public static function get(string $k): string {
        return self::$strings[$k] ?? "";
    }
}
