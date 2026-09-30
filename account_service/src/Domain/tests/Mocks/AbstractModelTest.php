<?php

//require_once(__DIR__ . '/../../../Domain/AbstractModel.php');

use App\Domain\AbstractModel;


class MockModel extends AbstractModel
{
  public $columns = [
    'dqs',
    'dan',
    'id' => [
      'type' => 'int'
    ],
    'account_id' => [
      'type' => 'int',
      'required' => true
    ],
    'firstname' => [
      'type' => 'string',
      'required' => true,
      'validate' => 'minlength:2|maxlength:22'
    ],
    'lastname' => [
      'type' => 'string',
      'required' => true,
      'validate' => 'minlength:2|maxlength:22'
    ],
    'email' => [
      'type' => 'email',
      'required' => true
    ],
    'password' => [
      "type" => 'string',
      'required' => true,
      'validate' => 'minlength:1'
    ],
    'type_id' => [
      'type' => 'int',
      'required' => true
    ],
    'migrated' => [
      'type' => 'int',
    ],
  ];

  public $errors = [];

}



class ModelTest extends \PHPUnit\Framework\TestCase
{

  /** @test */
  public function type_cast()
  {
    $m = new MockModel();
    $value = '1';
    $m->typeCastValue($value,'int');
    $this->assertEquals(1,$value);

    $m = new MockModel();
    $value = '1s';
    $m->typeCastValue($value,'int');
    $this->assertEquals(1,$value);

    $m = new MockModel();
    $value = 'ss';
    $m->typeCastValue($value,'int');
    $this->assertEquals(0,$value);

    $m = new MockModel();
    $value = 12;
    $m->typeCastValue($value,'bool');
    $this->assertEquals(true,$value);

    $m = new MockModel();
    $value = 0;
    $m->typeCastValue($value,'bool');
    $this->assertEquals(false,$value);

    $m = new MockModel();
    $value = -1;
    $m->typeCastValue($value,'bool');
    $this->assertEquals(true,$value);
  }

  /** @test */
  public function validate_columns()
  {
    $m = new MockModel();

    $m->columns = [
      'firstname' => [
        'validate' => 'minlength:2|maxlength:3'
      ]
    ];

    $m->errors = [];
    $data = ['firstname' => 'ss'];
    $column = 'firstname';
    $m->validateColumn($data, $m->columns[$column], $column);
    $this->assertEquals([],$m->errors);

    $m->errors = [];
    $data = ['firstname' => 'sss'];
    $column = 'firstname';
    $m->validateColumn($data, $m->columns[$column], $column);
    $this->assertEquals([],$m->errors);

    $m->errors = [];
    $data = ['firstname' => 's'];
    $column = 'firstname';
    $m->validateColumn($data, $m->columns[$column], $column);
    $this->assertNotEquals([],$m->errors);


    $m->errors = [];
    $data = ['firstname' => 'ssss'];
    $column = 'firstname';
    $m->validateColumn($data, $m->columns[$column], $column);
    $this->assertNotEquals([],$m->errors);
  }

  /** @test */

  public function can_sanitize_value ()
  {
    $m = new MockModel();
    $value = $m->sanitizeValue("<b>sdsdds</b>");
    $this->assertEquals($value, "'sdsdds'");
    $value = $m->sanitizeValue("<b></b>");
    $this->assertEquals($value, "''");
    $value = $m->sanitizeValue("'");
    $this->assertEquals($value, "'\\''");
    try {
      $m->sanitizeValue(str_pad('robert', 257, "*"));
      $this->assertTrue(false);
    } catch (\Exception $e) {
      $this->assertEquals("invalid string length value", $e->getMessage());
    }
  }

  /** @test */
  public function can_filter_columns ()
  {
    $m = new MockModel();
    $this->assertTrue($m->canFilter('dqs'));
    $this->assertFalse($m->canFilter('dan111'));
    $this->assertTrue($m->canFilter('id'));
    $this->assertFalse($m->canFilter('d23232an'));
  }

}
