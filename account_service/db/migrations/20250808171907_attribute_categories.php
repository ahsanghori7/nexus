<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AttributeCategories extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        //ALTER TABLE `attribute_category` CHANGE `region_code` `region_code` VARCHAR(10) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL DEFAULT 'UK';
        $this->execute("ALTER TABLE `attribute_category` CHANGE `region_code` `region_code` VARCHAR(10) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL DEFAULT 'UK';
");

        $this->execute("
            INSERT INTO attribute_category (id, label, type)
            SELECT id, label, 'trade_category'
            FROM trade_category;
        ");

        // Set initial ID value based on current max(id)
        $this->execute("SET @start_id := (SELECT IFNULL(MAX(id), 0) FROM attribute_category);");

        // Insert region categories with sequential ID
        $this->execute("
            INSERT INTO attribute_category (id, label, type, region_code)
            SELECT
                @start_id := @start_id + 1 AS id,
                wr.region_code,
                'region_category',
                wr.region_code
            FROM website_region wr
            ORDER BY wr.id ASC;
        ");

        $this->execute("
            INSERT INTO attribute_category_mapping (category_id, attribute_id)
            SELECT tcm.category_id, tcm.trade_id
            FROM trade_category_mapping tcm
            WHERE tcm.trade_id IN (
                SELECT id FROM attribute
            )
            AND tcm.category_id IN (
                SELECT id FROM attribute_category
            );
        ");

        $this->execute("
            INSERT INTO attribute_category_mapping (category_id, attribute_id)
            SELECT
                CASE region_group_id
                    WHEN 1 THEN 35
                    WHEN 2 THEN 36
                    WHEN 3 THEN 37
                    WHEN 4 THEN 38
                    ELSE NULL
                END AS category_id,
                id AS attribute_id
            FROM region
            WHERE region_group_id IN (1, 2, 3, 4)
              AND id IN (SELECT id FROM attribute);
        ");
    }

    /**
     * @return void
     */
    public function down(): void
    {
        $this->table('attribute_category')
            ->changeColumn('region_code', 'string', ['limit' => 10, 'default' => null, 'null' => true])
            ->update();
        $this->execute("DELETE FROM attribute_category WHERE type = 'region';");
        $this->execute("DELETE FROM attribute_category WHERE type = 'trade';");
        $this->execute("
            DELETE FROM attribute_category_mapping
            WHERE (category_id, attribute_id) IN (
                SELECT tcm.category_id, tcm.trade_id
                FROM trade_category_mapping tcm
                WHERE tcm.trade_id IN (
                    SELECT id FROM attribute
                )
            );
        ");
        $this->execute("
            DELETE FROM attribute_category_mapping
            WHERE (category_id, attribute_id) IN (
                SELECT
                    CASE region_group_id
                        WHEN 1 THEN 35
                        WHEN 2 THEN 36
                        WHEN 3 THEN 37
                        WHEN 4 THEN 38
                    END,
                    id
                FROM region
                WHERE region_group_id IN (1, 2, 3, 4)
                  AND id IN (SELECT id FROM attribute)
            );
        ");
    }
}
