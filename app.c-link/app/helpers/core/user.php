<?php

use App\core\Session;

if (! function_exists('user_email')) {
  function user_email(){
    $data = Session::get('data');
    return $data['user']['email'] ?? null;
  }
}

if (! function_exists('user_fullname')) {
  function user_fullname(string $separator = ' '){
    return user_firstname() . $separator .  user_lastname();
  }
}

if (! function_exists('user_firstname')) {
  function user_firstname(){
    $data = Session::get('data');
    return $data['user']['firstname'];
  }
}

if (! function_exists('user_lastname')) {
  function user_lastname(){
    $data = Session::get('data');
    return $data['user']['lastname'];
  }
}

if (! function_exists('user_logo')) {
  function user_logo(){
    $data = Session::get('data');

    $logo = $data['user']['logo'] ?? '';

    //@TODO logo needs to be also for user

    if(!file_exists($logo))
    {
      $logo = static_path('images/png/specialist-icon.png');
    }

    return $logo;
  }
}
