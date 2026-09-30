<?php

use Phinx\Db\Adapter\MysqlAdapter;

class Initial extends Phinx\Migration\AbstractMigration
{
    public function change()
    {
        $this->table('template_type', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_swedish_ci',
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
                'collation' => 'latin1_swedish_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->create();
        $this->table('template', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_swedish_ci',
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
                'collation' => 'latin1_swedish_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'label',
            ])
            ->addColumn('etag', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 64,
                'collation' => 'latin1_swedish_ci',
                'encoding' => 'latin1',
                'after' => 'type_id',
            ])
            ->addIndex(['label'], [
                'name' => 'unq_template_label',
                'unique' => true,
            ])
            ->addIndex(['type_id'], [
                'name' => 'template_type',
                'unique' => false,
            ])
            ->create();
        $this->table('template_mapping', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_swedish_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('template_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'template_id',
            ])
            ->addIndex(['template_id', 'user_id'], [
                'name' => 'unq_user_mapping',
                'unique' => true,
            ])
            ->addIndex(['template_id'], [
                'name' => 'template_id',
                'unique' => false,
            ])
            ->create();
        $this->table('document_expiry', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_swedish_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'document_id',
            ])
            ->addColumn('expires_at', 'datetime', [
                'null' => false,
                'after' => 'created_at',
            ])
            ->create();
        $this->table('document_signatory_status', [
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
            ->addIndex(['label', 'uid'], [
                'name' => 'uid_label',
                'unique' => true,
            ])
            ->create();
        $this->table('document_mapping', [
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
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('mapping_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'document_id',
            ])
            ->addIndex(['document_id'], [
                'name' => 'document_id_mapping',
                'unique' => false,
            ])
            ->create();
        $this->table('document_type', [
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
            ->addIndex(['uid'], [
                'name' => 'uid',
                'unique' => true,
            ])
            ->create();
        $this->table('document_categories', [
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
            ->addColumn('entity_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'label',
            ])
            ->addColumn('entity_type', 'string', [
                'null' => false,
                'default' => 'project',
                'limit' => 64,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'entity_id',
            ])
            ->addColumn('parent_id', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'entity_type',
            ])
            ->addIndex(['entity_id', 'entity_type', 'label', 'parent_id'], [
                'name' => 'label_unique',
                'unique' => true,
            ])
            ->create();
        $this->table('document_category_mapping', [
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
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('category_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'document_id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'category_id',
            ])
            ->addIndex(['document_id', 'category_id'], [
                'name' => 'unique_document_category_mapping',
                'unique' => true,
            ])
            ->addIndex(['category_id'], [
                'name' => 'category_id',
                'unique' => false,
            ])
            ->addIndex(['document_id'], [
                'name' => 'doc_id',
                'unique' => false,
            ])
            ->create();
        $this->table('document_signatory_signer', [
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
            ->addColumn('signatory_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('signer_user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'signatory_id',
            ])
            ->addColumn('signer_status_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'signer_user_id',
            ])
            ->addColumn('signer_updated_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'after' => 'signer_status_id',
            ])
            ->addColumn('signer_created_at', 'timestamp', [
                'null' => false,
                'default' => '0000-00-00 00:00:00',
                'after' => 'signer_updated_at',
            ])
            ->addIndex(['signatory_id'], [
                'name' => 'docusign_id',
                'unique' => false,
            ])
            ->addIndex(['signer_status_id'], [
                'name' => 'docusign_status',
                'unique' => false,
            ])
            ->create();
        $this->table('document_creator_metavalue', [
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
            ->addColumn('metakey_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('metakey_value', 'text', [
                'null' => false,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'metakey_id',
            ])
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'metakey_value',
            ])
            ->addIndex(['document_id'], [
                'name' => 'document_id_metavalue',
                'unique' => false,
            ])
            ->addIndex(['metakey_id'], [
                'name' => 'metakey',
                'unique' => false,
            ])
            ->create();
        $this->table('document_request', [
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
            ->addColumn('type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('subtype', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type',
            ])
            ->addColumn('request_type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'subtype',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'request_type',
            ])
            ->addColumn('document_owner', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'label',
            ])
            ->addColumn('requestor_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'document_owner',
            ])
            ->addColumn('requested_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'requestor_id',
            ])
            ->addColumn('request_fullfilled_at', 'datetime', [
                'null' => true,
                'default' => null,
                'after' => 'requested_at',
            ])
            ->addIndex(['subtype'], [
                'name' => 'request_document_subtype',
                'unique' => false,
            ])
            ->addIndex(['type'], [
                'name' => 'request_document_type',
                'unique' => false,
            ])
            ->addIndex(['request_type'], [
                'name' => 'request_type',
                'unique' => false,
            ])
            ->create();
        $this->table('document_creator', [
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
            ->addColumn('template_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('project_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'template_id',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'project_id',
            ])
            ->addColumn('etag', 'string', [
                'null' => false,
                'limit' => 64,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'tender_id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'etag',
            ])
            ->addIndex(['id'], [
                'name' => 'idx_project_id',
                'unique' => false,
            ])
            ->create();
        $this->table('document_creator_metakey', [
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
        $this->table('template_meta_defaults', [
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
            ->addColumn('template_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('metakey_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'template_id',
            ])
            ->addColumn('value', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'metakey_id',
            ])
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'value',
            ])
            ->addIndex(['template_id'], [
                'name' => 'template_meta_default',
                'unique' => false,
            ])
            ->addIndex(['metakey_id'], [
                'name' => 'template_metakey_default',
                'unique' => false,
            ])
            ->create();
        $this->table('request_type', [
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
                'limit' => MysqlAdapter::INT_TINY,
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->create();
        $this->table('document_signatory', [
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
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('signatory_id', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'document_id',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'signatory_id',
            ])
            ->addIndex(['document_id', 'signatory_id'], [
                'name' => 'document_signatory',
                'unique' => true,
            ])
            ->create();
        $this->table('document_request_mapping', [
                'id' => false,
                'primary_key' => ['request_id', 'document_id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('request_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
            ])
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'request_id',
            ])
            ->addIndex(['request_id', 'document_id'], [
                'name' => 'document_request_mapping_unique',
                'unique' => true,
            ])
            ->addIndex(['document_id'], [
                'name' => 'request_mapping_document_id',
                'unique' => false,
            ])
            ->create();
        $this->table('document_subtype', [
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
                'null' => false,
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
            ->addIndex(['uid'], [
                'name' => 'uid',
                'unique' => true,
            ])
            ->create();
        $this->table('document_status', [
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
            ->create();
        $this->table('document_owner_mapping', [
                'id' => false,
                'primary_key' => ['owner_id', 'document_id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('owner_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
            ])
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'owner_id',
            ])
            ->addColumn('hidden', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'document_id',
            ])
            ->addIndex(['owner_id', 'document_id'], [
                'name' => 'owner_doc_id',
                'unique' => true,
            ])
            ->addIndex(['document_id'], [
                'name' => 'doc_id_owner',
                'unique' => false,
            ])
            ->create();
        $this->table('tender_mapping', [
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
            ->addColumn('document_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('tender_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'document_id',
            ])
            ->addIndex(['document_id'], [
                'name' => 'document_id',
                'unique' => false,
            ])
            ->create();
        $this->table('document', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('parent_id', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('name', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'parent_id',
            ])
            ->addColumn('type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'name',
            ])
            ->addColumn('subtype', 'integer', [
                'null' => false,
                'default' => '7',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type',
            ])
            ->addColumn('status', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'subtype',
            ])
            ->addColumn('s3_key', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'utf8mb4_general_ci',
                'encoding' => 'utf8mb4',
                'after' => 'status',
            ])
            ->addColumn('s3_bucket', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'utf8mb4_general_ci',
                'encoding' => 'utf8mb4',
                'after' => 's3_key',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::TEXT_LONG,
                'collation' => 'utf8mb4_bin',
                'encoding' => 'utf8mb4',
                'after' => 's3_bucket',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'meta',
            ])
            ->addColumn('legacy_id', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'created_at',
            ])
            ->addIndex(['status'], [
                'name' => 'doc_status',
                'unique' => false,
            ])
            ->addIndex(['type'], [
                'name' => 'type',
                'unique' => false,
            ])
            ->addIndex(['subtype'], [
                'name' => 'doc_subtype',
                'unique' => false,
            ])
            ->create();
    }
}
