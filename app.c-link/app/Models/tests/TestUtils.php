<?php

use PHPUnit\Framework\TestCase;
use \App\Models\Util;

class TestUtils extends TestCase
{

    public function testCreateDateFromFormat()
    {

        $date = '27/01/2022';
        $this->assertEquals('2022-01-27', Util::createDateFromFormat($date, 'd/m/Y', 'Y-m-d'));

        $date = '27/01/2022';
        $this->assertEquals('27-01-2022', Util::createDateFromFormat($date, 'd/m/Y', 'd-m-Y'));

        $date = '27/01/2022';
        $this->assertEquals('01/27/2022', Util::createDateFromFormat($date, 'd/m/Y', 'm/d/Y'));

        $date = '27-01-2022';
        $this->assertEquals('01/27/2022', Util::createDateFromFormat($date, 'd-m-Y', 'm/d/Y'));

        $date = '2022-01-26';
        $this->assertEquals('26/01/2022', Util::createDateFromFormat($date, 'Y-m-d', 'd/m/Y'));

        $date = '2022-01-26';
        $this->assertEquals('2022', Util::createDateFromFormat($date, 'Y-m-d', 'Y'));

        $date = '2022-01-26';
        $this->assertEquals('01', Util::createDateFromFormat($date, 'Y-m-d', 'm'));

        $date = '2022-01-26';
        $this->assertEquals('2022-01-26', Util::createDateFromFormat($date, 'test', 'Y'));
    }

    public function testgGetDaysBetweenTwoDates()
    {
        $start_date = '2025-12-01';
        $end_date   = '2026-01-01';
        $this->assertEquals(31, Util::getDaysBetweenTwoDates($start_date, $end_date));


        $start_date = '2022-07-01';
        $end_date   = '2022-08-15';
        $this->assertEquals(45, Util::getDaysBetweenTwoDates($start_date, $end_date));


        $start_date = '2022-07-01';
        $end_date   = '2022-07-01';
        $this->assertEquals(0, Util::getDaysBetweenTwoDates($start_date, $end_date));


        $start_date = '2022-07-01';
        $end_date   = '2022-06-01';
        $this->assertEquals(30, Util::getDaysBetweenTwoDates($start_date, $end_date));
    }

    public function testFormatDate (): void
    {

        $date = '2022-01-31';
        $this->assertEquals('01/31/2022', Util::formatDate($date, 'm/d/Y'));
        $this->assertEquals('01/2022/31', Util::formatDate($date, 'm/Y/d'));
        $this->assertEquals('31/01/2022', Util::formatDate($date, 'd/m/Y'));
        $this->assertEquals('31/2022/01', Util::formatDate($date, 'd/Y/m'));
        $this->assertEquals('2022/01/31', Util::formatDate($date, 'Y/m/d'));
        $this->assertEquals('2022/31/01', Util::formatDate($date, 'Y/d/m'));



        $this->assertEquals('01 31 2022', Util::formatDate($date, 'm d Y'));
        $this->assertEquals('01 2022 31', Util::formatDate($date, 'm Y d'));
        $this->assertEquals('31 01 2022', Util::formatDate($date, 'd m Y'));
        $this->assertEquals('31 2022 01', Util::formatDate($date, 'd Y m'));
        $this->assertEquals('2022 01 31', Util::formatDate($date, 'Y m d'));
        $this->assertEquals('2022 31 01', Util::formatDate($date, 'Y d m'));



        $this->assertEquals('01-31-2022', Util::formatDate($date, 'm-d-Y'));
        $this->assertEquals('01-2022-31', Util::formatDate($date, 'm-Y-d'));
        $this->assertEquals('31-01-2022', Util::formatDate($date, 'd-m-Y'));
        $this->assertEquals('31-2022-01', Util::formatDate($date, 'd-Y-m'));
        $this->assertEquals('2022-01-31', Util::formatDate($date, 'Y-m-d'));
        $this->assertEquals('2022-31-01', Util::formatDate($date, 'Y-d-m'));



        $date = '2022-31-31';
        $this->assertEquals('', Util::formatDate($date, 'm/d/Y'));
    }

    public function testaddUrlScheme(): void
    {
        $url = 'www.c-link.com';
        $this->assertEquals('https://www.c-link.com', Util::addUrlScheme($url));


        $url = 'https://www.c-link.com';
        $this->assertEquals('https://www.c-link.com', Util::addUrlScheme($url));


        $url = 'http://www.c-link.com';
        $this->assertEquals('http://www.c-link.com', Util::addUrlScheme($url, 'http://'));


        $url = 'c-link.com';
        $this->assertEquals('https://c-link.com', Util::addUrlScheme($url));


        $url = 'https://c-link.com';
        $this->assertEquals('https://c-link.com', Util::addUrlScheme($url));
    }

    public function testSanitizeURL(): void
    {
        $url = 'potato name with spaces name.pdf';
        $this->assertEquals('potato-name-with-spaces-name.pdf', Util::sanitizeStringURL($url));


        $url = 'potato       d';
        $this->assertEquals('potato-d', Util::sanitizeStringURL($url));


        $url = ' potato name with spaces name.pdf ';
        $this->assertEquals('potato-name-with-spaces-name.pdf', Util::sanitizeStringURL($url));


        $url = '<&*^$#&(_+potato>';
        $this->assertEquals('potato', Util::sanitizeStringURL($url));


        $url = '123 456 potato';
        $this->assertEquals('123-456-potato', Util::sanitizeStringURL($url));


        $url = 'Â¼»³ÉÙ»Ô';
        $this->assertEquals('', Util::sanitizeStringURL($url));

    }
}
