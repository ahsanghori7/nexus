<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class AccountMeta extends AbstractTypeModel
{

    /**
     * @var array
     */
    protected $meta_cache = [];

    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "meta_key_id" => [
            "type" => 'int',
            "required" => true
        ],
        'value' => [
            'type' => 'string',
            'required' => false
        ],
    ];

    /**
     * @param array|string[] $cols
     * @return string
     * @throws \ReflectionException
     */
    public function getSelect (array $cols = ["*"]): string
    {
        $columns = [
            'meta.id',
            'meta.value',
            'meta_key.key as label'
        ];
        $sql = sprintf("SELECT %s FROM %s",
            implode(",", $columns), $this->getName() . " meta"
        );
        $sql .= ' join account_meta_key meta_key on meta.meta_key_id = meta_key.id';

        return $sql;
    }

    /**
     * @param int $id
     * @return array
     * @throws \ReflectionException
     */
    public function loadMetaById (int $id): array
    {
        $sql = $this->getSelect();
        $sql .= ' where meta.account_id = ' . $id;

        $meta = [];
        if(method_exists($this->getDB(), 'getAll')) {

            foreach ($this->getDB()::getAll($sql) as $value) {
                $meta[$value['label']] = $value['value'];
            }
        }
        return $meta;
    }

    /**
     * @return array
     * @throws \ReflectionException
     */
    public function loadMetaKeys(): array
    {
        $sql = sprintf("SELECT * FROM %s", $this->getName() . "_key");
        $meta = [];
        if(method_exists($this->getDB(), 'getAll')) {
            foreach ($this->getDB()::getAll($sql) as $value) {
                $meta[$value['key']] = $value['id'];
            }
        }
        return $meta;
    }

    /**
     * @param string $key
     * @return bool
     * @throws \ReflectionException
     */
    public function isValidMetaKey(string $key): bool
    {
        if(empty($this->meta_cache)){
            $this->meta_cache = $this->loadMetaKeys();
        }

        return isset($this->meta_cache[$key]);
    }
}
