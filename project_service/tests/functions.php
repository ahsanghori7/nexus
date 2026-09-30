<?php

/**
 * @param $key
 * @param $value
 * @param $arr
 * @return bool
 */
function checkKeyAndValueExists($key, $value, $arr): bool
{
  return array_key_exists($key, $arr) && (in_array($value, $arr, true));
}

/**
 * @param $a
 * @param $b
 * @return bool
 */
function arrays_are_similar(array $a, array$b, bool $force_type = true): bool
{
  // if the indexes don't match, return immediately
  if (count(array_diff_assoc($a, $b))) {
    return false;
  }
  // we know that the indexes, but maybe not values, match.
  // compare the values between the two arrays
  foreach($a as $k => $v) {
    if ($v !== $b[$k] && $force_type) {
      return false;
    }if ($v != $b[$k] && !$force_type) {
      return false;
    }
  }
  // we have identical indexes, and no unequal values
  return true;
}
