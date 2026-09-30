<?php

use App\core\Session;

if ( !function_exists('email') ) {
  function email (){
    return app()->email;
  }
}

if ( !function_exists('reset_email') ) {
  function reset_email (){
    Session::set('override_email', null);
    return Session::get('override_email') ?? Session::get('user_email') ?? null;
  }
}

if (! function_exists('prosper_email')) {
  function prosper_email(){
    $email = app()->email;
    $email->type('prosper');
    return $email;
  }
}

if (! function_exists('clink_email')) {
  function clink_email(){
    $email = app()->email;
    $email->type('main-contractor');
    return $email;
  }
}

if (! function_exists('admin_email')) {
  function admin_email(){
    $email = app()->email;
    $email->type('admin');
    return $email;
  }
}
