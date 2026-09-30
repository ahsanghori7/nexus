<?php

use Phinx\Db\Adapter\MysqlAdapter;

class Initial extends Phinx\Migration\AbstractMigration
{
    public function change()
    {
        $this->table('persona', [
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
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_swedish_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addColumn('website_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'label',
            ])
            ->addIndex(['website_id'], [
                'name' => 'website_id',
                'unique' => false,
            ])
            ->create();
        $this->table('persona_mapping', [
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
            ->addColumn('account_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('persona_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_id',
                'unique' => false,
            ])
            ->addIndex(['persona_id'], [
                'name' => 'persona_id',
                'unique' => false,
            ])
            ->create();
        $this->table('user', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('firstname', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'account_id',
            ])
            ->addColumn('lastname', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'firstname',
            ])
            ->addColumn('display_name', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'lastname',
            ])
            ->addColumn('logo', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'display_name',
            ])
            ->addColumn('job_title', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 100,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'logo',
            ])
            ->addColumn('email', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'job_title',
            ])
            ->addColumn('password', 'string', [
                'null' => false,
                'limit' => 128,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'email',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'password',
            ])
            ->addColumn('migrated', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type_id',
            ])
            ->addColumn('contact_number', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'migrated',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'contact_number',
            ])
            ->addColumn('status', 'integer', [
                'null' => false,
                'default' => '2',
                'limit' => '1',
                'after' => 'meta',
            ])
            ->addIndex(['email'], [
                'name' => 'email',
                'unique' => true,
            ])
            ->addIndex(['type_id'], [
                'name' => 'type_id',
                'unique' => false,
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_id',
                'unique' => false,
            ])
            ->create();
        $this->table('oauth_clients', [
                'id' => false,
                'primary_key' => ['client_id'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('client_id', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('client_secret', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_id',
            ])
            ->addColumn('redirect_uri', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 2000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_secret',
            ])
            ->addColumn('grant_types', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'redirect_uri',
            ])
            ->addColumn('scope', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 4000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'grant_types',
            ])
            ->addColumn('user_id', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'scope',
            ])
            ->create();
        $this->table('account_turnover', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('year', 'integer', [
                'null' => false,
                'limit' => '4',
                'after' => 'account_id',
            ])
            ->addColumn('value', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'year',
            ])
            ->addColumn('active_trading', 'boolean', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'value',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_turnover',
                'unique' => false,
            ])
            ->create();
        $this->table('account_type', [
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
            ->addIndex(['label'], [
                'name' => 'label',
                'unique' => false,
            ])
            ->create();
        $this->table('account_customer_health_score', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'fk_health_score_account_id',
                'unique' => false,
            ])
            ->create();
        $this->table('account_action_old', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('action_type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('action_date', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'action_type',
            ])
            ->addIndex(['account_id'], [
                'name' => 'action_account_id',
                'unique' => false,
            ])
            ->addIndex(['action_type'], [
                'name' => 'action_type',
                'unique' => false,
            ])
            ->create();
        $this->table('oauth_users', [
                'id' => false,
                'primary_key' => ['username'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('username', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('password', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'username',
            ])
            ->addColumn('first_name', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'password',
            ])
            ->addColumn('logo', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'first_name',
            ])
            ->addColumn('contact_number', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 15,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'logo',
            ])
            ->addColumn('last_name', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'contact_number',
            ])
            ->addColumn('email', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'last_name',
            ])
            ->addColumn('email_verified', 'boolean', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'email',
            ])
            ->addColumn('scope', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 4000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'email_verified',
            ])
            ->create();
        $this->table('user_type', [
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
            ->addIndex(['label'], [
                'name' => 'label',
                'unique' => false,
            ])
            ->create();
        $this->table('account_tracking_relationship', [
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
            ->addColumn('associated_account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('account_tracking_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'associated_account_id',
            ])
            ->addIndex(['associated_account_id'], [
                'name' => 'associated_account_id',
                'unique' => false,
            ])
            ->addIndex(['account_tracking_id'], [
                'name' => 'account_tracking_id',
                'unique' => false,
            ])
            ->create();
        $this->table('token', [
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
            ->addColumn('user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('token', 'string', [
                'null' => false,
                'limit' => 100,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'user_id',
            ])
            ->addColumn('active', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_SMALL,
                'after' => 'token',
            ])
            ->addColumn('expires', 'datetime', [
                'null' => false,
                'after' => 'active',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'expires',
            ])
            ->addColumn('expired_at', 'datetime', [
                'null' => true,
                'default' => null,
                'after' => 'created_at',
            ])
            ->addColumn('token_type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'expired_at',
            ])
            ->addColumn('token_usage', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'token_type_id',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'token_usage',
            ])
            ->addColumn('app', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'meta',
            ])
            ->addIndex(['token_type_id'], [
                'name' => 'token_type_id',
                'unique' => false,
            ])
            ->addIndex(['token'], [
                'name' => 'token',
                'unique' => false,
            ])
            ->create();
        $this->table('user_organisation', [
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
            ->addColumn('user_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('account_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'user_id',
            ])
            ->addColumn('user_firstname', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'account_id',
            ])
            ->addColumn('user_lastname', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'user_firstname',
            ])
            ->addColumn('user_email', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'user_lastname',
            ])
            ->addColumn('user_phone', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'user_email',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'user_phone',
            ])
            ->addColumn('custom_type_label', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'type_id',
            ])
            ->addIndex(['user_id'], [
                'name' => 'user_id',
                'unique' => true,
            ])
            ->addIndex(['account_id'], [
                'name' => 'organsiation_account_id',
                'unique' => false,
            ])
            ->addIndex(['type_id'], [
                'name' => 'organsiation_role_type',
                'unique' => false,
            ])
            ->create();
        $this->table('account', [
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
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'id',
            ])
            ->addColumn('email', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'name',
            ])
            ->addColumn('address', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'email',
            ])
            ->addColumn('landline', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'address',
            ])
            ->addColumn('mobile', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'landline',
            ])
            ->addColumn('reg_number', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'mobile',
            ])
            ->addColumn('logo', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'reg_number',
            ])
            ->addColumn('slogan', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'logo',
            ])
            ->addColumn('website', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'slogan',
            ])
            ->addColumn('description', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'website',
            ])
            ->addColumn('status', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_SMALL,
                'after' => 'description',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'status',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'type_id',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'created_at',
            ])
            ->addColumn('utr', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'meta',
            ])
            ->addColumn('team_seats', 'integer', [
                'null' => false,
                'default' => '5',
                'limit' => '2',
                'after' => 'utr',
            ])
            ->addIndex(['type_id'], [
                'name' => 'type_id',
                'unique' => false,
            ])
            ->create();
        $this->table('address', [
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
            ->addColumn('first_line', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addColumn('second_line', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'first_line',
            ])
            ->addColumn('postcode', 'string', [
                'null' => false,
                'limit' => 10,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'second_line',
            ])
            ->addColumn('city', 'string', [
                'null' => false,
                'limit' => 100,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'postcode',
            ])
            ->addColumn('coordonate', 'string', [
                'null' => false,
                'limit' => 25,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'city',
            ])
            ->create();
        $this->table('account_action', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('related_account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('account_user_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'related_account_id',
            ])
            ->addColumn('related_account_user_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_user_id',
            ])
            ->addColumn('action_type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'related_account_user_id',
            ])
            ->addColumn('action_date', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'action_type',
            ])
            ->addIndex(['action_type'], [
                'name' => 'action_type',
                'unique' => false,
            ])
            ->addIndex(['account_user_id'], [
                'name' => 'action_user_id',
                'unique' => false,
            ])
            ->addIndex(['related_account_user_id'], [
                'name' => 'action_related_user_id',
                'unique' => false,
            ])
            ->addIndex(['account_id'], [
                'name' => 'action_related_account_id',
                'unique' => false,
            ])
            ->create();
        $this->table('region_mapping_type', [
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
        $this->table('oauth_scopes', [
                'id' => false,
                'primary_key' => ['scope'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('scope', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('is_default', 'boolean', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'scope',
            ])
            ->create();
        $this->table('account_meta_key', [
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
            ->addColumn('key', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->addIndex(['key'], [
                'name' => 'unique_key',
                'unique' => true,
            ])
            ->create();
        $this->table('trade', [
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
            ->addIndex(['label'], [
                'name' => 'trade label',
                'unique' => true,
            ])
            ->create();
        $this->table('account_tracking', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('action_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('tracking_date', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'action_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'tracking_account_id',
                'unique' => false,
            ])
            ->addIndex(['action_id'], [
                'name' => 'tracking_action_id',
                'unique' => false,
            ])
            ->create();
        $this->table('oauth_authorization_codes', [
                'id' => false,
                'primary_key' => ['authorization_code'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('authorization_code', 'string', [
                'null' => false,
                'limit' => 40,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('client_id', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'authorization_code',
            ])
            ->addColumn('user_id', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_id',
            ])
            ->addColumn('redirect_uri', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 2000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'user_id',
            ])
            ->addColumn('expires', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'redirect_uri',
            ])
            ->addColumn('scope', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 4000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'expires',
            ])
            ->addColumn('id_token', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 1000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'scope',
            ])
            ->create();
        $this->table('oauth_access_tokens', [
                'id' => false,
                'primary_key' => ['access_token'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('access_token', 'string', [
                'null' => false,
                'limit' => 40,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('client_id', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'access_token',
            ])
            ->addColumn('user_id', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_id',
            ])
            ->addColumn('expires', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'user_id',
            ])
            ->addColumn('scope', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 4000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'expires',
            ])
            ->create();
        $this->table('region_mapping', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('region_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('group_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'region_id',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'group_id',
            ])
            ->addIndex(['type_id'], [
                'name' => 'type_id',
                'unique' => false,
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_id',
                'unique' => false,
            ])
            ->addIndex(['region_id'], [
                'name' => 'Region',
                'unique' => false,
            ])
            ->create();
        $this->table('trade_category_mapping', [
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
            ->addColumn('category_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('trade_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'category_id',
            ])
            ->addIndex(['category_id'], [
                'name' => 'category_id',
                'unique' => false,
            ])
            ->addIndex(['trade_id'], [
                'name' => 'trade_id',
                'unique' => false,
            ])
            ->create();
        $this->table('website', [
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
            ->addColumn('url', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'label',
            ])
            ->create();
        $this->table('user_organisation_type', [
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
            ->addIndex(['label'], [
                'name' => 'label',
                'unique' => true,
            ])
            ->create();
        $this->table('feedback', [
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
            ->addColumn('user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'user_id',
            ])
            ->addColumn('feedback_type', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('sentiment', 'text', [
                'null' => false,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'feedback_type',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'sentiment',
            ])
            ->addIndex(['feedback_type'], [
                'name' => 'fk_feedback_type',
                'unique' => false,
            ])
            ->addIndex(['user_id'], [
                'name' => 'fk_user_id',
                'unique' => false,
            ])
            ->addIndex(['account_id'], [
                'name' => 'fk_account_id',
                'unique' => false,
            ])
            ->create();
        $this->table('supply_chain', [
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
            ->addColumn('parent_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('child_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'parent_id',
            ])
            ->addColumn('trade_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'child_id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => true,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'trade_id',
            ])
            ->addIndex(['parent_id', 'child_id', 'trade_id'], [
                'name' => 'Trade Supply Chain',
                'unique' => true,
            ])
            ->addIndex(['child_id'], [
                'name' => 'child_account',
                'unique' => false,
            ])
            ->addIndex(['trade_id'], [
                'name' => 'trade_mapping',
                'unique' => false,
            ])
            ->create();
        $this->table('login_attempts', [
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
            ->addColumn('attempt_status', 'integer', [
                'null' => false,
                'default' => '1',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('attempt_reason', 'string', [
                'null' => false,
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'attempt_status',
            ])
            ->addColumn('data', 'text', [
                'null' => false,
                'limit' => MysqlAdapter::TEXT_LONG,
                'collation' => 'utf8mb4_bin',
                'encoding' => 'utf8mb4',
                'after' => 'attempt_reason',
            ])
            ->addColumn('request_headers', 'text', [
                'null' => false,
                'limit' => MysqlAdapter::TEXT_LONG,
                'collation' => 'utf8mb4_bin',
                'encoding' => 'utf8mb4',
                'after' => 'data',
            ])
            ->addColumn('ip_address', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'request_headers',
            ])
            ->addColumn('fingerprint', 'string', [
                'null' => false,
                'limit' => 60,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'ip_address',
            ])
            ->addColumn('attempt_date', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'fingerprint',
            ])
            ->addIndex(['fingerprint'], [
                'name' => 'fingerprint',
                'unique' => false,
            ])
            ->create();
        $this->table('client_references', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('project_name', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'account_id',
            ])
            ->addColumn('client_name', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'project_name',
            ])
            ->addColumn('contract_value', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_name',
            ])
            ->addColumn('contact_name', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'contract_value',
            ])
            ->addColumn('contact_email', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'contact_name',
            ])
            ->addColumn('completion_date', 'date', [
                'null' => false,
                'after' => 'contact_email',
            ])
            ->addColumn('reference_pdf', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'completion_date',
            ])
            ->addColumn('sow', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'reference_pdf',
            ])
            ->addColumn('status', 'enum', [
                'null' => false,
                'default' => 'pending',
                'limit' => 8,
                'values' => ['pending', 'approved', 'deleted'],
                'after' => 'sow',
            ])
            ->addColumn('client_summary', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'status',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'client_summary',
            ])
            ->addColumn('updated_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'after' => 'created_at',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_references',
                'unique' => false,
            ])
            ->create();
        $this->table('token_type', [
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
            ->addColumn('expiry_hours', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_SMALL,
                'after' => 'label',
            ])
            ->create();
        $this->table('oauth_refresh_tokens', [
                'id' => false,
                'primary_key' => ['refresh_token'],
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('refresh_token', 'string', [
                'null' => false,
                'limit' => 40,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('client_id', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'refresh_token',
            ])
            ->addColumn('user_id', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_id',
            ])
            ->addColumn('expires', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'user_id',
            ])
            ->addColumn('scope', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 4000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'expires',
            ])
            ->create();
        $this->table('trade_category', [
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
            ->addColumn('icon', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'label',
            ])
            ->addColumn('rules', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 3,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'icon',
            ])
            ->addIndex(['label'], [
                'name' => 'category label',
                'unique' => true,
            ])
            ->create();
        $this->table('account_action_type', [
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
        $this->table('account_organisation', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('title', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'account_id',
            ])
            ->addColumn('fullname', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'title',
            ])
            ->addColumn('email', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'fullname',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_organisation',
                'unique' => false,
            ])
            ->create();
        $this->table('region', [
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
            ->addIndex(['label'], [
                'name' => 'label',
                'unique' => true,
            ])
            ->create();
        $this->table('oauth_jwt', [
                'id' => false,
                'engine' => 'InnoDB',
                'encoding' => 'latin1',
                'collation' => 'latin1_general_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('client_id', 'string', [
                'null' => false,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
            ])
            ->addColumn('subject', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 80,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'client_id',
            ])
            ->addColumn('public_key', 'string', [
                'null' => false,
                'limit' => 2000,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'subject',
            ])
            ->create();
        $this->table('feedback_type', [
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
                'limit' => 50,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'id',
            ])
            ->create();
        $this->table('account_meta', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('meta_key_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('value', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'meta_key_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_references',
                'unique' => false,
            ])
            ->addIndex(['meta_key_id'], [
                'name' => 'account_meta_key',
                'unique' => false,
            ])
            ->create();
        $this->table('trade_group', [
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
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('trade_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'type_id',
            ])
            ->addIndex(['trade_id'], [
                'name' => 'fk_trade_id',
                'unique' => false,
            ])
            ->create();
        $this->table('account_prequalification_status', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('status', 'boolean', [
                'null' => false,
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'account_id',
            ])
            ->addColumn('section_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'status',
            ])
            ->addColumn('section_message', 'text', [
                'null' => true,
                'default' => null,
                'limit' => 65535,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'section_id',
            ])
            ->addIndex(['account_id', 'section_id'], [
                'name' => 'aid_section',
                'unique' => true,
            ])
            ->addIndex(['section_id'], [
                'name' => 'section_id',
                'unique' => false,
            ])
            ->create();
        $this->table('trade_mapping', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('trade_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_fk',
                'unique' => false,
            ])
            ->addIndex(['trade_id'], [
                'name' => 'trade_fk',
                'unique' => false,
            ])
            ->create();
        $this->table('account_prequalification_sections', [
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
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'id',
            ])
            ->create();
        $this->table('email_log', [
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
            ->addColumn('email_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'email_id',
            ])
            ->addColumn('sent_date', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'user_id',
            ])
            ->addIndex(['email_id'], [
                'name' => 'email_id',
                'unique' => false,
            ])
            ->addIndex(['user_id'], [
                'name' => 'user_id',
                'unique' => false,
            ])
            ->create();
        $this->table('token_used', [
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
            ->addColumn('token_type', 'enum', [
                'null' => false,
                'limit' => 4,
                'values' => ['free', 'paid'],
                'after' => 'id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'token_type',
            ])
            ->addColumn('account_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'signed' => false,
                'after' => 'created_at',
            ])
            ->addColumn('user_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'signed' => false,
                'after' => 'account_id',
            ])
            ->addColumn('project_id', 'integer', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::INT_REGULAR,
                'signed' => false,
                'after' => 'user_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'index_foreignkey_token_used_account',
                'unique' => false,
            ])
            ->addIndex(['project_id'], [
                'name' => 'index_foreignkey_token_used_project',
                'unique' => false,
            ])
            ->addIndex(['user_id'], [
                'name' => 'index_foreignkey_token_used_user',
                'unique' => false,
            ])
            ->create();
        $this->table('token_issued', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('token_amount', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_SMALL,
                'after' => 'account_id',
            ])
            ->addColumn('cost', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'token_amount',
            ])
            ->addColumn('timestamp', 'timestamp', [
                'null' => false,
                'default' => 'current_timestamp()',
                'after' => 'cost',
            ])
            ->addIndex(['account_id'], [
                'name' => 'token',
                'unique' => false,
            ])
            ->create();
        $this->table('email_blacklisted', [
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
            ->addColumn('email_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('user_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'email_id',
            ])
            ->addColumn('added_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'user_id',
            ])
            ->addIndex(['email_id', 'user_id'], [
                'name' => 'email_user',
                'unique' => true,
            ])
            ->addIndex(['user_id'], [
                'name' => 'b_user_id',
                'unique' => false,
            ])
            ->create();
        $this->table('email', [
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
            ->addIndex(['uid', 'label'], [
                'name' => 'uid_label',
                'unique' => true,
            ])
            ->create();
        $this->table('project_type', [
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
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8_general_ci',
                'encoding' => 'utf8',
                'after' => 'id',
            ])
            ->addIndex(['label'], [
                'name' => 'label',
                'unique' => true,
            ])
            ->create();
        $this->table('project_type_mapping', [
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
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('type_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_fk',
                'unique' => false,
            ])
            ->addIndex(['type_id'], [
                'name' => 'trade_fk',
                'unique' => false,
            ])
            ->create();
        $this->table('subscription', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
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
                'collation' => 'utf8mb4_unicode_ci',
                'encoding' => 'utf8mb4',
                'after' => 'id',
            ])
            ->addColumn('label', 'string', [
                'null' => false,
                'limit' => 255,
                'collation' => 'utf8mb4_unicode_ci',
                'encoding' => 'utf8mb4',
                'after' => 'uid',
            ])
            ->addColumn('price', 'integer', [
                'null' => true,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'label',
            ])
            ->addColumn('price_label', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 30,
                'collation' => 'utf8mb4_unicode_ci',
                'encoding' => 'utf8mb4',
                'after' => 'price',
            ])
            ->addColumn('interval_type', 'enum', [
                'null' => true,
                'default' => 'yearly',
                'limit' => 9,
                'values' => ['yearly', 'monthly', 'weekly', 'quarterly', 'bi-annual'],
                'after' => 'price_label',
            ])
            ->addColumn('interval_unit', 'string', [
                'null' => false,
                'default' => 'yearly',
                'limit' => 255,
                'collation' => 'utf8mb4_unicode_ci',
                'encoding' => 'utf8mb4',
                'after' => 'interval_type',
            ])
            ->addColumn('interval_amount', 'integer', [
                'null' => true,
                'default' => '1',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'interval_unit',
            ])
            ->addColumn('expires', 'integer', [
                'null' => false,
                'default' => '0',
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'interval_amount',
            ])
            ->addColumn('website_id', 'integer', [
                'null' => true,
                'default' => '1',
                'limit' => MysqlAdapter::INT_TINY,
                'after' => 'expires',
            ])
            ->addColumn('description', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 255,
                'collation' => 'latin1_general_ci',
                'encoding' => 'latin1',
                'after' => 'website_id',
            ])
            ->addIndex(['label', 'interval_type', 'website_id'], [
                'name' => 'label',
                'unique' => true,
            ])
            ->addIndex(['website_id'], [
                'name' => 'fk_web_id',
                'unique' => false,
            ])
            ->create();
        $this->table('membership', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'identity' => 'enable',
            ])
            ->addColumn('account_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'id',
            ])
            ->addColumn('subscription_id', 'integer', [
                'null' => false,
                'limit' => MysqlAdapter::INT_REGULAR,
                'after' => 'account_id',
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'subscription_id',
            ])
            ->addColumn('updated_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'after' => 'created_at',
            ])
            ->addColumn('expires_at', 'datetime', [
                'null' => true,
                'default' => null,
                'after' => 'updated_at',
            ])
            ->addColumn('meta', 'text', [
                'null' => true,
                'default' => null,
                'limit' => MysqlAdapter::TEXT_LONG,
                'collation' => 'utf8mb4_bin',
                'encoding' => 'utf8mb4',
                'after' => 'expires_at',
            ])
            ->addIndex(['account_id'], [
                'name' => 'account_id',
                'unique' => true,
            ])
            ->addIndex(['subscription_id'], [
                'name' => 'subscriptionFk',
                'unique' => false,
            ])
            ->create();
        $this->table('distance', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_520_ci',
                'comment' => '',
                'row_format' => 'DYNAMIC',
            ])
            ->addColumn('id', 'integer', [
                'null' => false,
                'limit' => '10',
                'signed' => false,
                'identity' => 'enable',
            ])
            ->addColumn('origin', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'utf8mb4_unicode_520_ci',
                'encoding' => 'utf8mb4',
                'after' => 'id',
            ])
            ->addColumn('destination', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'utf8mb4_unicode_520_ci',
                'encoding' => 'utf8mb4',
                'after' => 'origin',
            ])
            ->addColumn('distance', 'string', [
                'null' => true,
                'default' => null,
                'limit' => 191,
                'collation' => 'utf8mb4_unicode_520_ci',
                'encoding' => 'utf8mb4',
                'after' => 'destination',
            ])
            ->create();
    }
}
