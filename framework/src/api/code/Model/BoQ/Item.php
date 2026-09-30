<?php

namespace Api\Model\BoQ;

use Core\Data\Collection;
use Core\Service\Manager;
use Core\Data\Shape;

class Item
{

    protected const STATUSES = [
        'initialized' => 1,
        'draft' => 2,
        'published' => 3,
        'deleted' => 4,
        'archived' => 5,
        'tendered' => 6,
    ];

    /**
     * @param array $items
     * @return array
     */
    public static function sortByLatestVersion(array $items): array
    {
        usort($items, function ($a, $b) {
            return $b['item_version']['version'] - $a['item_version']['version'];
        });
        return $items;
    }

    /**
     * @param Shape $entry
     * @param array $result
     * @param array $history
     * @return array
     * @throws \Exception
     */
    public static function setDefaultEntryData(Shape $entry, array &$result, array $history = []): array
    {
        $id  = $entry->int("id");
        $tid = $entry->int("tender_id");
        $version = $result[$tid]['version'] = Entity::getLatestVersionByEntityId($id);
        return $result[$tid] = [
            'id'         => $id,
            'tender_id'  => $tid,
            'created_at' => $entry->get("created_at"),
            'updated_at' => $entry->get("updated_at"),
            'note'       => $entry->get("note"),
            'status'     => self::getStatusByLabel("draft"),
            'tender'     => ['id' => $tid, 'label' => $entry->get("tender.label")],
            'has_published_version' => false,
            'has_enquiry' => isset($history['Enquiry'][$tid]),
            'version'    => $version,
            'entries'    => []
        ];
    }

    /**
     * @param Collection $entries
     * @param array $exclude
     * @param array $history
     * @return array
     * @throws \Exception
     */
    public static function parseEntries(Collection $entries, array $exclude, array $history = []): array
    {
        $result = [];
        $entries->map(function ($entry) use (&$result, $exclude, $history) {
            $tid = (int)$entry->get("tender_id");
            self::setDefaultEntryData($entry, $result, $history);
            (new Collection($entry->get("entries", []), Shape::class))->map(function ($item) use (&$result, $tid, $exclude) {
                $max_version = null;
                $mappings = $item->get("item_mappings", []);
                $mappings = array_filter($mappings, function ($item) {
                    return $item['item_version'];
                });
                Item::parseEntriesItems($result, $mappings, $tid, $max_version, $exclude);
                return $result;
            });
            return $result;
        });

        return $result;
    }

    /**
     * @param array $result
     * @param array $items
     * @param int $tid
     * @param $max_version
     * @param array $exclude
     * @return array
     * @throws \Exception
     */
    public static function parseEntriesItems(array &$result, array $items, int $tid, &$max_version, array $exclude): array
    {

        $items = self::sortByLatestVersion($items);
        (new Collection($items, Shape::class))->map(function ($mapping) use (&$result, $tid, &$max_version, $exclude) {
            //exclude keys
            array_map(function ($i) use (&$mapping) {
                $mapping->set($i, null);
            }, $exclude);

            $version = new Shape($mapping->get("item_version"));
            $version_id = $version->get("version", 0);
            if ($version->get("status") === Item::getStatusByLabel('deleted')) {
                $max_version = $version_id;
                return $mapping;
            }
            if ($version_id && (($version_id > $max_version) || !$max_version)) {
                $result[$tid]['entries'][$mapping->get("boq_item_id")] = $mapping;
                $result[$tid]['status'] = $version->get("status");
                $max_version = $version_id;
            }
            if (in_array($version->get("status"), [Item::getStatusByLabel('published'), Item::getStatusByLabel('tendered')], true)) {
                $result[$tid]['has_published_version'] = true;
            }
            $result[$tid]['entries'] = array_values($result[$tid]['entries'] ?? []);
            $result[$tid]['entries'] = array_map(function ($entry) {
                return $entry;
            }, $result[$tid]['entries']);

            return $result;
        });

        return $result ?? [];
    }

    /**
     * @param array $items
     * @param array $differences
     * @return array
     * @throws \Exception
     */
    public static function getItemsDifferences(array $items, array &$differences): array
    {
        (new Collection($items, Shape::class))->map(function ($mapping) use (&$differences) {
            if ($mapping->get("type") !== "item") {
                return $mapping;
            }
            $boq_item_id = $mapping->get("boq_item_id");
            if (!isset($differences[$boq_item_id])) {
                $differences[$boq_item_id] = [];
            }
            //get the differences between the last and the one before that
            if (count($differences[$boq_item_id]) < 2) {
                $differences[$boq_item_id][] = $mapping;
            }
            return $mapping;
        });
        return $differences ?? [];
    }

    /**
     * @param array $items
     * @param int $latest_version
     * @return array
     * @throws \Exception
     */
    public static function getItemsLatestVersionDifferences(array $items, int $latest_version): array
    {
        foreach ($items as $item) {
            if (count($item) === 1) {
                $new = array_shift($item);
                if ($new->int("item_version.version") === $latest_version) {
                    $differences[] = [
                        'item'      => $new->get("boq_item_id"),
                        'original'  => [],
                        'new' => [
                            'description' => $new->get("description"),
                            'quantity'    => $new->get("quantity"),
                            'created_at'  => $new->get("created_at"),
                            'rate'        => $new->get("rate"),
                            'note'        => $new->get("note"),
                            'total'       => $new->get("price"),
                        ],
                        'type' => 'addition'
                    ];
                }
            } else {
                [$new, $original] = $item;
                if ($new->get("item_version.status") === Item::getStatusByLabel('deleted')) {
                    $differences[] = [
                        'item'     => $new->get("boq_item_id"),
                        'original' => [
                            'description' => $original->get("description"),
                            'quantity'    => $original->get("quantity"),
                            'created_at'  => $original->get("created_at"),
                            'rate'        => $original->get("rate"),
                            'note'        => $original->get("note"),
                            'total'       => $original->get("price"),
                        ],
                        'new' => [
                            'description' => '',
                            'quantity'    => '',
                            'created_at'  => '',
                        ],
                        'type' => "deletion"
                    ];
                } elseif ($new->int("item_version.version") === $latest_version) {
                    $new->set("item_version", null);
                    $original->set("item_version", null);

                    $fields = [
                        'unit_id',
                        'item_no',
                        'budget_rate',
                        'budget_total',
                        'tenderee_note',
                        'description',
                        'quantity',
                        'rate',
                        'note',
                        'price'
                    ];

                    $original_data = [];
                    $new_data = [];
                    foreach ($fields as $field) {
                        $original_data[$field] = $original->get($field, "");
                        $new_data[$field] = $new->get($field, "");
                    }

                    if (md5(json_encode($original_data)) != md5(json_encode($new_data))) {
                        $differences[] = [
                            'item'     => $new->get("boq_item_id"),
                            'original' => $original_data + ['created_at' => $original->get("created_at")],
                            'new'      => $new_data + ['created_at' => $new->get("created_at")],
                            'type'     => "modification"
                        ];
                    }
                }
            }
        }
        return $differences ?? [];
    }

    /**
     * @param Shape $item
     * @throws \Exception
     */
    public static function updateItem(Shape $item): void
    {
        $quantity = $item->get("quantity") ? $item->get("quantity") : 0;
        $rate = $item->get("budget_rate") ? $item->get("budget_rate") : 0;
        $total = $item->get("budget_total") ? $item->get("budget_total") : 0;
        Manager::getService("project")->update("boq/item/" . $item->get("id"), new Shape(["data" => [
            'item_no'       => $item->get("item_no"),
            'boq_entity_id' => $item->get("boq_entity_id"),
            'description'   => $item->get("description"),
            'type'          => $item->get("type"),
            'unit_id'       => $item->get("unit_id"),
            'tenderee_note' => $item->get("tenderee_note", ""),
            'quantity'      => $quantity,
            'budget_rate'   => $rate,
            'budget_total'  => $total,
            'position'      => $item->get("position")
        ]]));
    }

    /**
     * @param Shape $item
     * @param array $status
     * @throws \Exception
     */
    public static function updateItemMapping(Shape $item, array $data = []): void
    {
        Manager::getService("project")->update("boq/item/" . $item->get("id") . "/mapping", new Shape(["data" => $data]));
    }

    /**
     * @param Shape $item
     * @return int
     * @throws \Exception
     */
    public static function addItem(Shape $item): int
    {
        try {
            $res = Manager::getService("project")->write("boq/item", new Shape(["data" => [
                'item_no'       => $item->get("item_no", ""),
                'boq_entity_id' => $item->get("boq_entity_id"),
                'description'   => $item->get("description"),
                'type'          => $item->get("type"),
                'unit_id'       => $item->get("unit_id"),
                'quantity'      => $item->get("quantity"),
                'budget_rate'   => $item->get("budget_rate"),
                'budget_total'  => $item->get("budget_total"),
                'position'      => $item->get("position"),
                'tenderee_note' => $item->get("tenderee_note", ""),
                'status'        => $item->get("status"),
                'version_id'    => $item->get("version"),
            ]]));
            if ($res->get("info.http_code") === 200) {
                $json = $res->json("content");
                if (is_array($json) && isset($json["data"])) {
                    $id = $json['data']['id'];
                }
            }
        } catch (\Exception $e) {
            $id = 0;
        }

        return $id ?? 0;
    }

    /**
     * @param Shape $item
     * @return int
     */
    public static function createNewVersion(Shape $item): int
    {
        try {
            $boq_item_id = $item->get("boq_item_id");
            $res = Manager::getService("project")->write("boq/item/$boq_item_id/version", new Shape(["data" => [
                'boq_item_id'   => $item->get("boq_item_id"),
                'item_no'       => $item->get("item_no"),
                'boq_entity_id' => $item->get("boq_entity_id"),
                'description'   => $item->get("description"),
                'type'          => $item->get("type"),
                'unit_id'       => $item->get("unit_id"),
                'quantity'      => $item->get("quantity"),
                'budget_rate'   => $item->get("budget_rate"),
                'budget_total'  => $item->get("budget_total"),
                'tenderee_note' => $item->get("tenderee_note", ""),
                'position'      => $item->get("position"),
                'status'        => $item->get("status"),
                'version_id'    => $item->get("version"),
            ]]));
            if ($res->get("info.http_code") === 200) {
                $json = $res->json("content");
                if (is_array($json) && isset($json["data"])) {
                    $id = $json['data']['id'];
                }
            }
        } catch (\Exception $e) {
            $id = 0;
        }

        return $id ?? 0;
    }



    /**
     * @param int $versionId
     * @throws \Exception
     */
    public static function deleteByVersionId(int $versionId): void
    {
        Manager::getService("project")->delete("boq/item/$versionId");
    }

    /**
     * @param string $label
     * @return mixed|string|null
     */
    public static function getStatusByLabel(string $label): mixed
    {
        return self::STATUSES[$label] ?? null;
    }
}
