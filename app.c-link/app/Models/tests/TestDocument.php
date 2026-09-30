<?php

use App\Models\Document;
use App\Models\User;
use PHPUnit\Framework\TestCase;

class MockUser extends User {

    public function __construct($id, $aid, $token) {
        $this->id = $id;
        $this->accountId = $aid;
        $this->token = $token;
    }

    /**
     * @throws \App\Api\Exception
     */
    public function loadFromApi() {}

}

class MockDocument extends Document{

    protected array $shortcodes = [];
    public function setShortcodes(array $shortcodes)
    {
        $this->shortcodes = $shortcodes;
    }

    public function getShortcodes()
    {
        return $this->shortcodes;
    }

}

class TestDocument extends TestCase {

    public function getDocument()
    {
        return new MockDocument();
    }

    public function testGetAllShortcodes()
    {
        $document = $this->getDocument();


        $document->setShortcodes([
            [
                'employer_agent'     => ['type' => 'string'],
                'principal_designer' => ['type' => 'string']
            ],
            [   'sub_works_finish'   => ['type' => 'date']],
            [   'completion_date'    => ['type' => 'date']],
        ]);
        $all_shortcodes = [
            'employer_agent'     => ['type' => 'string'],
            'principal_designer' => ['type' => 'string'],
            'sub_works_finish'   => ['type' => 'date'],
            'completion_date'    => ['type' => 'date'],
        ];
        $this->assertEquals($all_shortcodes, $document->getAllShortcodes());



        $document->setShortcodes([
            [
                'employer_agent' => ['test'],
            ],
            [
                'employer_agent' => ['test1'],
            ],
        ]);
        $all_shortcodes = [
            'employer_agent' => ['test1']
        ];
        $this->assertEquals($all_shortcodes, $document->getAllShortcodes());



        $document->setShortcodes([]);
        $all_shortcodes = [];
        $this->assertEquals($all_shortcodes, $document->getAllShortcodes());
    }

    public function testParseDocumentTenderValues()
    {
        $document = $document = $this->getDocument();


        $dates = [
            'tender'               => '2025-05-12',
            'from_document_values' => '18/01/2033',
            'new_tender_value'     => '2033-01-18'
        ];
        $tender = new \App\Models\Tender(['subcontract_work_finish' => $dates['tender']]);
        $document->setShortcodes([
            [
                'sub_works_finish'   => [
                    'type' => 'date',
                    'sync' => [
                        "key"                => "subcontract_work_finish",
                        "format_saved_as"    => "Y-m-d",
                        "format_received_as" => "d/m/Y"
                    ]
                ]
            ]
        ]);
        $values = ['sub_works_finish' => $dates['from_document_values']];
        $this->assertEquals(
            ['subcontract_work_finish' => $dates['new_tender_value']],
            $document->parseDocumentTenderValues($tender, $values, $document->getAllShortcodes())
        );



        $dates = [
            'tender'               => '2025-05-12',
            'from_document_values' => '18/01/2033'
        ];
        $tender = new \App\Models\Tender(['subcontract_work_finish' => $dates['tender']]);
        $document->setShortcodes([
            [
                'sub_works_finish'   => [
                    'type' => 'date'
                ]
            ]
        ]);
        $values = ['sub_works_finish' => $dates['from_document_values']];
        $this->assertEquals(
            [],
            $document->parseDocumentTenderValues($tender, $values, $document->getAllShortcodes())
        );



        $dates = [
            'tender'          => '2025-05-12',
            'format_received' => '2016-08-30',
            'format'          => '2016-08-30'
        ];
        $tender = new \App\Models\Tender(['subcontract_work_finish' => $dates['tender']]);
        $document->setShortcodes([
            [
                'sub_works_finish'   => [
                    'type' => 'date',
                    'sync' => [
                        "key"                => "subcontract_work_finish",
                        "format_saved_as"    => "Y-m-d",
                        "format_received_as" => "Y-m-d"
                    ]
                ]
            ]
        ]);
        $values = ['sub_works_finish' => $dates['format_received']];
        $this->assertEquals(
            ['subcontract_work_finish' => $dates['format']],
            $document->parseDocumentTenderValues($tender, $values, $document->getAllShortcodes())
        );



        $dates = [
            'tender'          => '2025-05-12',
            'format_received' => '08-19-2021',
            'format'          => '19-08-2021'
        ];
        $tender = new \App\Models\Tender(['subcontract_work_finish' => $dates['tender']]);
        $document->setShortcodes([
            [
                'sub_works_finish'   => [
                    'type' => 'date',
                    'sync' => [
                        "key"                => "subcontract_work_finish",
                        "format_received_as" => "m-d-Y",
                        "format_saved_as"    => "d-m-Y",
                    ]
                ]
            ]
        ]);
        $values = ['sub_works_finish' => $dates['format_received']];
        $this->assertEquals(
            ['subcontract_work_finish' => $dates['format']],
            $document->parseDocumentTenderValues($tender, $values, $document->getAllShortcodes())
        );




        $dates = [
            'tender'          => '2025-05-12',
            'format_received' => '08-19-2021',
            'format'          => '19-08-2021'
        ];
        $tender = new \App\Models\Tender([
            'subcontract_work_finish' => $dates['tender'],
            'testKey'                 => $dates['tender'],
        ]);
        $document->setShortcodes([
            [
                'sub_works_finish'   => [
                    'type' => 'date',
                    'sync' => [
                        "key"                => "subcontract_work_finish",
                        "format_received_as" => "m-d-Y",
                        "format_saved_as"    => "d-m-Y",
                    ]
                ],
                'test'   => [
                    'type' => 'date',
                    'sync' => [
                        "key"                => "testKey",
                        "format_received_as" => "m-d-Y",
                        "format_saved_as"    => "d-m-Y",
                    ]
                ]
            ]
        ]);

        $values = [
            'sub_works_finish' => $dates['format_received'],
            'test'             => $dates['format_received']
        ];
        $this->assertEquals(
            ['subcontract_work_finish' => $dates['format'], 'testKey' => $dates['format']],
            $document->parseDocumentTenderValues($tender, $values, $document->getAllShortcodes())
        );




    }


    public function testS3File() {
        $doc = new Document(["s3_key" => "/development/document/2/52.pdf"], "66");
        $this->assertEquals("52.pdf", $doc->getS3FileName());

        $doc = new Document(["s3_key" => "52.pdf"], "66");
        $this->assertEquals("52.pdf", $doc->getS3FileName());
    }

    public function testCanGetOwnerIds() {
        $doc = new Document(["owner" => [["owner_id" => 2]]], "66");
        $this->assertEquals([2], $doc->getOwnerIds());
    }

    public function testCanCheckOwnerShip() {
        $doc = new Document(["owner" => [["owner_id" => 2]]], "66");
        $user = new MockUser(1,2,3);
        $this->assertTrue($doc->isOwner($user));
        $user = new MockUser(1,1,3);
        $this->assertFalse($doc->isOwner($user));
    }

    public function testCanClone() {

        $data = [
            "id" => "66",
            "name" => "tester",
            "status"=> 1,
            "type"=> 1,
            "created_at"=> "2021-12-01 12:07:37",
            "s3_key"=> null,
            "s3_bucket"=> null,
            "parent"=> null,
            "meta"=> null,
            "owner" => [["owner_id" => 2]]
        ];

        $doc = new Document($data);
        $clone = $doc->clone([]);
        $this->assertTrue($clone->getData() === $doc->getData());

        $clone = $doc->clone(["name" => "New Test Name"]);
        $this->assertEquals("New Test Name", $clone->getData("name"));
        $this->assertEquals($doc->getData("id"), $clone->getData("id"));

        $clone = $doc->clone(["name" => "New Test Name2"], ["id", "created_at", "s3_key", "owner"]);
        $this->assertTrue(count($clone->getData()) === 6);
        $this->assertTrue($clone->getData("name") === "New Test Name2");
    }

    public function testCanGetChildCount() {
        $doc = new Document([]);
        $this->assertFalse($doc->hasChildren());
        $doc->setChildren([]);
        $this->assertFalse($doc->hasChildren());
        $doc->setChildren([["test" => 1]]);
        $this->assertTrue($doc->hasChildren());
    }

    public function testIsS3Enabled() {
        $doc = new Document([]);
        $this->assertFalse($doc->isS3Configured());
        $doc->setData("s3_bucket", "test_bucket");
        $this->assertFalse($doc->isS3Configured());
        $doc->setData("s3_key", "test_key");
        $this->assertTrue($doc->isS3Configured());
    }

    public function testS3FilePath ()
    {
        $s3_key_path = 'development/structural/';
        $name = "potato-original.pdf";
        $doc = new Document(
            ['s3_key' => $s3_key_path . $name], "1"
        );
        $clone_id = 2;
        $clone_name = $clone_id . "-" . $doc->getData("name");
        $s3_key = $doc->getS3Path($clone_name);
        $this->assertEquals($s3_key_path . $clone_name, $s3_key);


        $s3_key_path = 'development/documents/structural/';
        $name = "12345.png";
        $doc = new Document(
            ['s3_key' => $s3_key_path . $name], "1"
        );
        $clone_id = "2345";
        $clone_name = $clone_id . "-" . $doc->getData("name");
        $s3_key = $doc->getS3Path($clone_name);
        $this->assertEquals($s3_key_path . $clone_name, $s3_key);
    }

}
