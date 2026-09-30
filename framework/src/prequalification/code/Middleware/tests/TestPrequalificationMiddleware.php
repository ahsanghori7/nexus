<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prequalification\Middleware\PrequalificationMiddleware;

class TestPrequalificationMiddleware extends TestCase
{

    public function setAction (array $array)
    {
        $collection = new Collection($array, Shape::class);
        $action = new Route("default", []);
        $action->set("collection", $collection);
        return $action;
    }

    public function middleware (Route $route, string $method, $params = null)
    {
        $collection = $route->get("collection");
        if ( !is_null($params) ) {
            PrequalificationMiddleware::$method($params)($route, $collection);
        } else {
            PrequalificationMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testSectionStatuses()
    {

        $action = $this->setAction([]);
        $status = [
            'statuses' => '00000001'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);


        $action = $this->setAction([]);
        $status = [
            'statuses' => '0'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");

        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '01'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '011'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '0111'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(1, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '01111'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(1, $statuses['sections']['accreditation']);
        $this->assertEquals(1, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '011111'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(1, $statuses['sections']['accreditation']);
        $this->assertEquals(1, $statuses['sections']['management-system']);
        $this->assertEquals(1, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '0111111'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(1, $statuses['sections']['accreditation']);
        $this->assertEquals(1, $statuses['sections']['management-system']);
        $this->assertEquals(1, $statuses['sections']['custom-certificate']);
        $this->assertEquals(1, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '1111111'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(1, $statuses['approved']);
        $this->assertEquals(1, $statuses['sections']['company_information']);
        $this->assertEquals(1, $statuses['sections']['insurances']);
        $this->assertEquals(1, $statuses['sections']['references']);
        $this->assertEquals(1, $statuses['sections']['accreditation']);
        $this->assertEquals(1, $statuses['sections']['management-system']);
        $this->assertEquals(1, $statuses['sections']['custom-certificate']);
        $this->assertEquals(1, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '11'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(1, $statuses['approved']);
        $this->assertEquals(1, $statuses['sections']['company_information']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '0000001'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(1, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => '0000011'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(1, $statuses['sections']['custom-certificate']);
        $this->assertEquals(1, $statuses['sections']['organisation']);


        $action = $this->setAction([]);
        $status = [
            'statuses' => '2323323232'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



        $action = $this->setAction([]);
        $status = [
            'statuses' => 'aaaa'
        ];
        $action->set("prequalification", $status);
        $this->middleware($action, 'loadSectionStatuses');
        $statuses = $action->get("prequalification.statuses");
        $this->assertEquals(0, $statuses['approved']);
        $this->assertEquals(0, $statuses['sections']['company_information']);
        $this->assertEquals(0, $statuses['sections']['insurances']);
        $this->assertEquals(0, $statuses['sections']['references']);
        $this->assertEquals(0, $statuses['sections']['accreditation']);
        $this->assertEquals(0, $statuses['sections']['management-system']);
        $this->assertEquals(0, $statuses['sections']['custom-certificate']);
        $this->assertEquals(0, $statuses['sections']['organisation']);



    }

}
