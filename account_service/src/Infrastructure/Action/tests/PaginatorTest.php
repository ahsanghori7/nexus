<?php

    use App\Infrastructure\Action\Paginator;

    use App\Infrastructure\Testing\Extension\ActionDependantTestCase;


    class PaginatorTest extends ActionDependantTestCase
    {
        public function testCanGetLimitOffset()
        {
            $pager = $this->getPager(5, ["/", "limit=10"]);
            list($l, $o) = $pager->getLimitOffset();
            $this->assertTrue(($l === 10 && $o === 0));

            $pager = $this->getPager(5, ["/", "limit=50&offset=50"]);
            list($l, $o) = $pager->getLimitOffset();
            $this->assertTrue(($l === 50 && $o === 50));

            $pager = $this->getPager(5);
            list($l, $o) = $pager->getLimitOffset();

            $this->assertTrue(($l === $pager->getLimit() && $o === 0));

            $pager = $this->getPager(5, ["/", "limit=500000000000000"]);
            list($l, $o) = $pager->getLimitOffset();

            $this->assertTrue(($l === $pager::MAX_LIMIT));
        }

        public function getPager($records = [], $uri = [], $request = [], $modelname = "test")
        {

            $request = $this->mockRequest($uri, $request);
            $model = $this->getModel($modelname, $records);
            return new Paginator($request, $model);
        }


        public function testCanGetModelCount()
        {
            $pager = $this->getPager(5);
            $this->assertTrue($pager->getModelCount() === 5);
        }

        public function testCanGetLimit()
        {
            $pager = $this->getPager();
            $this->assertTrue($pager->getLimit() === 100);
        }

        public function testCanGetTotalPages()
        {
            $count = 5000;
            $pager = $this->getPager($count);
            $this->assertTrue($pager->getTotalPages() === 50);

            $count = 4950;
            $pager = $this->getPager($count);
            $this->assertTrue($pager->getTotalPages() === 50);

            $count = 4899;
            $pager = $this->getPager($count);
            $this->assertTrue($pager->getTotalPages() === 49);
        }

        public function testCanGetLink()
        {
            $pager = $this->getPager(3000, ["/v1/test"]);
            $link = $pager->getLink("next");
            $this->assertTrue($link === "/v1/test?limit=100&offset=100");

            $prev = $pager->getLink("prev");
            $this->assertTrue($prev === "");
        }

        public function testCanReplaceParam()
        {
            $pager = $this->getPager(3000, ["/v1/test", "test=100"]);

            $params = $pager->updateParams(["test" => 200, "tester" => 300]);
            $this->assertTrue($params["test"] === 200);
            $this->assertTrue($params["tester"] === 300);

        }

        public function testCanGetPrev()
        {
            $pager = $this->getPager(3000, ["/v1/test"]);
            $this->assertEquals($pager->getPrev(), null);

            $pager = $this->getPager(3000, ["/v1/test", "offset=400"]);
            $this->assertEquals($pager->getPrev(), 300);
        }


        public function testCanGetNext()
        {
            $pager = $this->getPager(3000, ["/v1/test"]);
            $this->assertEquals($pager->getNext(), 100);

            $pager = $this->getPager(3000, ["/v1/test", "offset=2999"]);
            $this->assertEquals($pager->getNext(), null);
        }

        public function testCanGetLinks()
        {
            $pager = $this->getPager(3000, ["/v1/test"]);
            $links = $pager->getLinks();

            $this->assertTrue($links["prev"] === "");
            $this->assertTrue($links["next"] === "/v1/test?limit=100&offset=100");
            $this->assertTrue($links["page"] === 0);
            $this->assertTrue($links["pages"] === 30);
            $this->assertTrue($links["total"] === 3000);


            $pager = $this->getPager(3000, ["/v1/test", "limit=50&offset=300"]);
            $links = $pager->getLinks();

            $this->assertTrue($links["prev"] === "/v1/test?limit=50&offset=250");
            $this->assertTrue($links["next"] === "/v1/test?limit=50&offset=350");
            $this->assertTrue($links["page"] === 6);
            $this->assertTrue($links["pages"] === 60);

            $pager = $this->getPager(3000, ["/v1/test", "limit=50&offset=3000"]);
            $links = $pager->getLinks();
            $this->assertTrue($links["prev"] === "/v1/test?limit=50&offset=2950");
            $this->assertTrue($links["next"] === "");
            $this->assertTrue($links["page"] === 60);
            $this->assertTrue($links["pages"] === 60);

        }
    }
