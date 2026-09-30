<?php

use Phinx\Db\Adapter\MysqlAdapter;

class Initial extends Phinx\Migration\AbstractMigration
{
    public function change()
    {
        $this->table('project_ownership_mapping', [
                'id' => false,
                'primary_key' => ['project_id', 'owner_id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('project_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
            ])
            ->addColumn('owner_id', 'integer', [
                'null' => false,
                'limit' => '10',
                'signed' => false,
                'after' => 'project_id',
            ])
            ->addColumn('type', 'enum', [
                'null' => false,
                'default' => 'Author',
                'limit' => 9,
                'values' => ['Author', 'Co-author'],
                'after' => 'owner_id',
            ])
            ->addIndex(['project_id', 'owner_id'], [
                'name' => 'project_owner',
                'unique' => true,
            ])
            ->create();
        $this->table('tender_dependency', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('tender_parent_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_id',
            ])
            ->addColumn('tender_dependency_key', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_parent_id',
            ])
            ->addColumn('tender_dependency_parent_key', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_dependency_key',
            ])
            ->addIndex(['tender_id'], [
                'name' => 'tender_dependency_id',
                'unique' => false,
            ])
            ->addIndex(['tender_dependency_key'], [
                'name' => 'tender_dependency_key',
                'unique' => false,
            ])
            ->addIndex(['tender_dependency_parent_key'], [
                'name' => 'tender_dependency_parent_key',
                'unique' => false,
            ])
            ->addIndex(['tender_parent_id'], [
                'name' => 'tender_dependency_parent_id',
                'unique' => false,
            ])
            ->create();
        $this->table('tender', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('project_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'project_id',
            ])
            ->addColumn('is_custom', 'boolean', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'label',
            ])
            ->addColumn('size', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'is_custom',
            ])
            ->addColumn('service', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'size',
            ])
            ->addColumn('send_date', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'service',
            ])
            ->addColumn('tender_return', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 20,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'send_date',
            ])
            ->addColumn('start_on_site', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 20,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'tender_return',
            ])
            ->addColumn('decision_date', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'start_on_site',
            ])
            ->addColumn('subcontract_work_finish', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'decision_date',
            ])
            ->addColumn('awarded', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'subcontract_work_finish',
            ])
            ->addColumn('has_document', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'awarded',
            ])
            ->addColumn('has_tender_addendum', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'has_document',
            ])
            ->addColumn('budget', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => '13',
                'after' => 'has_tender_addendum',
            ])
            ->addColumn('budget_updated_at', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'budget',
            ])
            ->addColumn('state', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'budget_updated_at',
            ])
            ->addColumn('was_suggestion', 'boolean', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'state',
            ])
            ->addColumn('published_at', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'was_suggestion',
            ])
            ->addIndex(['project_id', 'label'], [
                'name' => 'Unique Project Package Label',
                'unique' => true,
            ])
            ->addIndex(['project_id'], [
                'name' => 'Project',
                'unique' => false,
            ])
            ->create();
        $this->table('transaction_type', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->create();
        $this->table('transaction', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('subcontractor_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_id',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'subcontractor_id',
            ])
            ->addColumn('compliant', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'type_id',
            ])
            ->addColumn('price', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => '13',
                'after' => 'compliant',
            ])
            ->addColumn('price_selected', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'price',
            ])
            ->addColumn('measured_work', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'price_selected',
            ])
            ->addColumn('prelims', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => '13',
                'after' => 'measured_work',
            ])
            ->addColumn('other_items', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => '13',
                'after' => 'prelims',
            ])
            ->addColumn('programme', 'string', [
                'null' => false,
                'default' => '0.00',
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'other_items',
            ])
            ->addColumn('order_price', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'programme',
            ])
            ->addColumn('status_id', 'integer', [
                'null' => true,
                'default' => '1',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'order_price',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'status_id',
            ])
            ->addColumn('order_number', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'meta',
            ])
            ->addColumn('archived', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'order_number',
            ])
            ->addColumn('quote_created', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'archived',
            ])
            ->addColumn('order_created', 'datetime', [
                'null' => true,
                'default' => null,
                'after' => 'quote_created',
            ])
            ->addColumn('order_updated', 'datetime', [
                'null' => true,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'order_created',
            ])
            ->addIndex(['tender_id'], [
                'name' => 'quote',
                'unique' => false,
            ])
            ->addIndex(['subcontractor_id'], [
                'name' => 'sub_id',
                'unique' => false,
            ])
            ->create();
        $this->table('tender_history_archive', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('specialist_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_id',
            ])
            ->addIndex(['tender_id', 'specialist_id'], [
                'name' => 'unique_tender_archive',
                'unique' => true,
            ])
            ->create();
        $this->table('project', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('name', 'string', [
                'null' => false,
                'limit' => 100,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addColumn('slug', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'name',
            ])
            ->addColumn('group_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'slug',
            ])
            ->addColumn('author_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'group_id',
            ])
            ->addColumn('logo', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 150,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'author_id',
            ])
            ->addColumn('reference', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'logo',
            ])
            ->addColumn('description', 'text', [
                'null' => false,
                'limit' => MysqlAdapter::TEXT_MEDIUM,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'reference',
            ])
            ->addColumn('region', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'description',
            ])
            ->addColumn('type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'region',
            ])
            ->addColumn('phase', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type',
            ])
            ->addColumn('start', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'phase',
            ])
            ->addColumn('end', 'date', [
                'null' => true,
                'default' => null,
                'after' => 'start',
            ])
            ->addColumn('status', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'end',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'status',
            ])
            ->addColumn('site_address_one', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'created_at',
            ])
            ->addColumn('site_address_two', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'site_address_one',
            ])
            ->addColumn('site_address_city', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 100,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'site_address_two',
            ])
            ->addColumn('site_address_postcode', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 10,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'site_address_city',
            ])
            ->addColumn('employer_liabilty_insurance', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'site_address_postcode',
            ])
            ->addColumn('public_product_insurance', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'employer_liabilty_insurance',
            ])
            ->addColumn('pricing_doc_required', 'boolean', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'public_product_insurance',
            ])
            ->addColumn('gia', 'string', [
                'null' => false,
                'default' => '0',
                'limit' => 12,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'pricing_doc_required',
            ])
            ->addColumn('archived', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'gia',
            ])
            ->addIndex(['name'], [
                'name' => 'name',
                'unique' => true,
            ])
            ->addIndex(['group_id'], [
                'name' => 'group_id',
                'unique' => false,
            ])
            ->create();
        $this->table('tender_history_status', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
            ])
            ->addColumn('uid', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'uid',
            ])
            ->addColumn('clink_label', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'label',
            ])
            ->addColumn('prosper_label', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'clink_label',
            ])
            ->create();
        $this->table('tender_dependency_key', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('uid', 'string', [
                'null' => false,
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addIndex(['uid'], [
                'name' => 'uid',
                'unique' => true,
            ])
            ->create();
        $this->table('tender_history', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('status_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'tender_id',
            ])
            ->addColumn('author_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'status_id',
            ])
            ->addColumn('specialist_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'author_id',
            ])
            ->addColumn('tender_history_type', 'enum', [
                'null' => false,
                'limit' => 8,
                'values' => ['Order', 'Interest', 'Quote', 'Enquiry', 'Awarded'],
                'after' => 'specialist_id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'tender_history_type',
            ])
            ->addColumn('meta', 'text', [
                'null' => false,
                'limit' => MysqlAdapter::TEXT_LONG,
                'collation' => 'utf8mb4_bin',
                'encoding' => 'utf8mb4',
                'after' => 'created_at',
            ])
            ->addIndex(['tender_id'], [
                'name' => 'tender_id',
                'unique' => false,
            ])
            ->addIndex(['status_id'], [
                'name' => 'status_id',
                'unique' => false,
            ])
            ->create();
        $this->table('package_mapping', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('package_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'package_id',
            ])
            ->addIndex(['tender_id'], [
                'name' => 'Tender',
                'unique' => false,
            ])
            ->create();
        $this->table('instruction', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8',
                'collation' => 'utf8_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('transaction_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'transaction_id',
            ])
            ->addColumn('price', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type_id',
            ])
            ->addColumn('description', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'price',
            ])
            ->addColumn('status', 'integer', [
                'null' => false,
                'default' => '2',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'description',
            ])
            ->addColumn('date', 'datetime', [
                'null' => true,
                'default' => null,
                'after' => 'status',
            ])
            ->addIndex(['type_id'], [
                'name' => 'iv_type',
                'unique' => false,
            ])
            ->addIndex(['status'], [
                'name' => 'iv_status',
                'unique' => false,
            ])
            ->addIndex(['transaction_id'], [
                'name' => 'iv_transaction',
                'unique' => false,
            ])
            ->create();
        $this->table('instruction_status', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8',
                'collation' => 'utf8_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
            ])
            ->addColumn('uid', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'id',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'uid',
            ])
            ->create();
        $this->table('instruction_type', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8',
                'collation' => 'utf8_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
            ])
            ->addColumn('uid', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'id',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'uid',
            ])
            ->create();
    }
}
