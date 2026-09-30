<?php
namespace App\Models;

use DateTime;

class Util{

    /**
     * @return false|string
     */
    public static function getFullDate()
    {
        return date("Y-m-d H:i:s");
    }

    /**
     * @param array $data
     * @return false|string
     */
    public static function getDateByFormat(array $data)
    {
        if(isset($data['format'])){
            return date($data['format']);
        }

        return self::getFullDate();
    }

    /**
     * @param string $date_from
     * @param string $date_to
     * @param string $format_date
     * @return string
     */
    public static function getDaysBetweenTwoDates(string $date_from, string $date_to, string $format_date = 'd-m-Y')
    {
        $date_from = DateTime::createFromFormat($format_date,$date_from);
        $date_to = DateTime::createFromFormat($format_date,$date_to);
        return $date_from->diff($date_to)->format('%a');
    }

    /**
     * @param string|null $date
     * @param string $format
     * @return string
     */
    public static function formatDate(?string $date, string $format): string
    {
        if(is_null($date) || !date_create($date)){
            return '';
        }
        return date_format(date_create($date), $format);
    }

    /**
     * @param string $date
     * @param string $format_from
     * @param string $format_to
     * @return string
     */
    public static function createDateFromFormat(string $date, string $format_from, string $format_to): string
    {
        $createDate = DateTime::createFromFormat($format_from, $date);
        if($createDate){
            $date = $createDate->format($format_to);
        }
        return $date;
    }

    /**
     * @param string $url
     * @param string $scheme
     * @return string
     */
    public static function addUrlScheme(string $url, string $scheme = 'https://'): string
    {
        return parse_url($url, PHP_URL_SCHEME) === null ? $scheme . $url : $url;
    }

    /**
     * @param string $url
     * @return mixed
     */
    public static function sanitizeStringURL(string $url)
    {
        return trim(preg_replace('/[^a-zA-Z0-9-.]+/', '-', $url),'-');
    }

    /**
     * @param $val
     * @return string
     */
    public static function getTextPennyValue($val) : string {
        return '£'.number_format($val/100, 2, ".", ",");
    }
}
