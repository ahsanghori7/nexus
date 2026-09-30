<?php

namespace App\Models;

use App\Api\S3;
use App\Factory\Shortcodes;
use App\Api\Document as DocumentApi;
use App\Api\Project\Validator as ProjectValidator;

class Document extends Abstraction
{

    /**
     * @param User $user
     * @return bool
     */
    public function isOwner(User $user): bool
    {
        return in_array(
            $user->getAccountId(),
            $this->getOwnerIds()
        );
    }

    /**
     * @param User $user
     * @return bool
     */
    public function isHidden(User $user): bool
    {
        return in_array(
            $user->getAccountId(),
            $this->getHiddenIds()
        );
    }

    /**
     * @param array $types
     * @return bool
     */
    public function isOfType(array $types): bool
    {
        return in_array((int)$this->getData("type"), $types);
    }

    /**
     * @param array $types
     * @return bool
     */
    public function isOfSubType(array $types): bool
    {
        return in_array((int)$this->getData("subtype"), $types);
    }

    /**
     * @return array
     */
    public function getOwnerIds(): array
    {
        $owners = [];
        foreach ($this->getData("owner") as $owner) {
            $owners[] = $owner["owner_id"];
        }
        return $owners;
    }

    /**
     * @return array
     */
    public function getHiddenIds(): array
    {
        $hidden = [];
        foreach ($this->getData("owner") as $owner) {
            if ($owner["hidden"]) {
                $hidden[] = $owner["owner_id"];
            }
        }
        return $hidden;
    }

    /**
     * @param array $data
     * @return $this
     */
    public function setChildren(array $data)
    {
        $this->data['children'] = new Collection($data, self::class);
        return $this;
    }

    /**
     * @return bool
     */
    public function hasChildren(array $subTypes = []): bool
    {
        if (isset($this->data['children'])) {
            $children = $this->data['children'];
            if ($subTypes) {
                $children = $children->filterByModelFunction("isOfSubType", true, $subTypes);
            }

            return ($children->count() > 0);
        }
        return false;
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    public function getShortcodes()
    {
        $config   = $this->getMetaValue("config");
        list("slug" => $slug, "version" => $v) = $config;
        return Shortcodes::getBySlug($slug)->getVersion($v);
    }

    /**
     * @param string $k
     * @return array|mixed
     * @throws \Exception
     */
    public function getMetaValue(string $k)
    {
        $meta   = $this->getMeta();
        $data   = $meta[$k] ?? [];
        if (!$data) {
            throw new \Exception("Document has no meta $k");
        }
        return $data;
    }


    /**
     * @return array
     */
    public function getConfig(): array
    {
        $meta   = $this->getMeta();
        $config = $this->getMetaValue("config");

        list("slug" => $slug, "version" => $v) = $config;
        $values = $meta["values"] ?? [];
        $shortcodes = $this->getShortcodes();
        $results = [
            "version" => $v,
            "slug" => $slug,
            "data" => []
        ];

        foreach ($shortcodes as $gid => $items) {
            foreach ($items as $k => $item) {
                $item["value"] = $values[$k] ?? null;
                $results["data"][$gid][$k] = $item;
            }
        }
        return $results;
    }

    /**
     * @return array|mixed
     */
    public function getChildren()
    {
        return $this->data['children'] ?? [];
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getContent(): string
    {
        /*
         * Check if the download return anything
         */
        $download = S3::download(S3::getBucket('document'), $this->getData('s3_key', ''));
        if (isset($download['Body'])) {
            $result = $download['Body']->getContents();
        }
        return $result ?? '';
    }

    /**
     * @return bool
     */
    public function isS3Configured(): bool
    {
        $key    = $this->getData("s3_key");
        $bucket = $this->getData("s3_bucket");
        return ($key && $bucket);
    }

    /**
     * @param string $content
     * @return void
     */
    public function setContent(string $content)
    {
        if (!$this->isS3Configured()) {
            throw new \Exception("Document has no s3 key or bucket");
        }
        S3::uploadContent(
            $this->getData("s3_bucket"),
            $this->getData("s3_key"),
            $content,
        );
    }

    /**
     * @param string $to
     * @param string $bucket
     * @return \Aws\Result|false
     * @throws \Exception
     */
    public function download(string $to, string $bucket = '')
    {
        if (!$bucket) {
            $bucket = $this->getData("s3_bucket");
        }
        return S3::save(
            S3::getBucket($bucket),
            $this->getData("s3_key"),
            $to . "/" . $this->getData("name")
        );
    }

    /**
     * @return false|mixed
     * @throws \App\Api\Exception
     */
    public function delete()
    {
        $bucket = S3::getBucket($this->getData("s3_bucket"));
        $key    = $this->getData("s3_key");
        if ($bucket && $key && S3::objectExists($bucket, $key)) {
            return S3::remove($key, $bucket);
        }
    }

    /**
     * @return string
     */
    public function getS3FileName(): string
    {
        $key = $this->getData("s3_key", "");
        $parts = explode("/", $key);
        return array_pop($parts);
    }

    /**
     * @param string $prefix
     * @return string
     * @throws \Exception
     */
    public function getS3Path(string $prefix = ''): string
    {
        if (!$this->getId()) {
            throw new \Exception("Document model must be loaded to get s3 key name");
        }

        $key = $this->getData("s3_key", "");
        $parts = explode("/", $key);
        array_pop($parts);
        return implode("/", $parts) . "/" . $prefix;
    }


    /**
     * @param string $prefix
     * @return string
     * @throws \Exception
     */
    public function getS3Name(string $prefix = ""): string
    {
        if (!$this->getId()) {
            throw new \Exception("Document model must be loaded to get s3 key name");
        }
        $name = str_replace(" ", "_", $this->getData("name"));
        return $this->getId() . "-" . $name . $prefix;
    }

    /**
     * @param array $newData
     * @param array $keysToWipe
     * @return Document
     */
    public function clone(array $newData, array $keysToWipe = []): Document
    {
        $clone = new Document(
            array_filter($this->getData(), function ($i, $k) use ($keysToWipe) {
                return !in_array($k, $keysToWipe);
            }, ARRAY_FILTER_USE_BOTH)
        );

        foreach ($newData as $k => $v) {
            $clone->setData($k, $v);
        }
        return $clone;
    }

    /**
     * @return array
     */
    public function getMeta(): array
    {
        $meta = $this->getData("meta");
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        return $meta ?? [];
    }

    /**
     * @return array
     * @throws \App\Api\Exception
     */
    public function getDocData()
    {
        $categories = DocumentApi::getTemplateCategories(intval($this->getId()));
        $category = $categories->filterByField('entity_type', $this->getSubtype())->getFirst();
        $project = ProjectValidator::getProjectContext($category->getData('parent_id') ?? false);
        $tender = $project->getTender($category->getData('entity_id') ?? 0);
        return [
            'project' => $project,
            'tender'  => $tender
        ];
    }

    /**
     * @param Tender $tender
     * @param array $values
     * @param array $shortcodes
     * @return array
     */
    public function parseDocumentTenderValues(Tender $tender, array $values, array $shortcodes)
    {
        foreach ($values as $k => $v) {
            $data = $shortcodes[$k] ?? null;
            if (isset($data['sync'])) {
                $sync = $data['sync'];
                if ($tender->getData($sync['key']) !== $v) {
                    if ($data['type'] === 'date') {
                        $v = Util::createDateFromFormat($v, $sync['format_received_as'], $sync['format_saved_as']);
                    }
                    $tender_update_values[$sync['key']] = $v;
                }
            }
        }
        return $tender_update_values ?? [];
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getAllShortcodes()
    {
        return array_reduce($this->getShortcodes(), 'array_merge', array());
    }

    /**
     * @param Tender $tender
     * @param array $values
     * @return mixed
     * @throws \Exception
     */
    public function getSyncTenderValues(Tender $tender, array $values)
    {
        return $this->parseDocumentTenderValues($tender, $values, $this->getAllShortcodes());
    }

    /**
     * @return string
     */
    public function getType(): string
    {
        return DocumentApi::getTypeUid($this->getData('type'));
    }

    /**
     * @return string
     * @throws \App\Api\Exception
     */
    public function getSubType(): string
    {
        $type = DocumentApi::getSubTypes()->filterById($this->getData('subtype'))->getFirst();
        return $type->getData('uid');
    }

    /**
     * @return bool
     * @throws \App\Api\Exception
     */
    public function isTenderDocument(): bool
    {
        $tender_types = DocumentApi::getSubTypes()->filterByRegex('uid', '.*tender')->getIds();
        return $this->isOfSubType($tender_types);
    }

    /**
     * @return bool
     * @throws \App\Api\Exception
     */
    public function isInstructionDocument(): bool
    {
        $tender_types = DocumentApi::getSubTypes()->filterByRegex('uid', '.*instruction')->getIds();
        return $this->isOfSubType($tender_types);
    }

    /**
     * @param string $delimiter
     * @return string
     */
    public function getDocumentPrefix(string $delimiter = '/'): string
    {
        return ((strpos(DocumentApi::PO_PREFIX_LABEL, $this->getData('name')) !== false)) ? "PO$delimiter" : "SC$delimiter";
    }

    /**
     * @return string|string[]
     */
    public function getExt()
    {
        return pathinfo($this->getData('name'), PATHINFO_EXTENSION);
    }

    /**
     * @return array
     */
    public function getTemplateShortcodes(): array
    {
        $template_data = $this->getConfig()['data'];
        $shortcodes = [];
        foreach ($template_data as $value) {
            $shortcodes[] = array_keys($value);
        }
        return array_merge([], ...$shortcodes);
    }

    /**
     * @param array $shortcodes
     * @return array
     */
    public function getMatchingShortcodesForTemplate(array $shortcodes): array
    {
        $meta = $this->getMeta();
        if (isset($meta['values'])) {
            $shortcodes = array_intersect_key($meta['values'], array_flip($shortcodes));
        }
        return $shortcodes;
    }

    /**
     * @param array $document
     * @param int $sow_entity_type_id
     * @return bool
     */
    public function checkForSow(array $document, int $sow_entity_type_id): bool
    {
        $status         = true;
        $need_check_sow = false;
        // Check if the document has a sow type from the doc config
        foreach ($this->getConfig()['data'] as $configs) {
            foreach ($configs as $config) {
                if (isset($config['sourceOptions']['args']['type'])) {
                    if ($config['sourceOptions']['args']['type'] === "sow") {
                        $need_check_sow = true;
                        break;
                    }
                }
            }
        }
        if ($need_check_sow) {
            $children = $this->setChildren($document["children"] ?? [])->getChildren();
            $has_sow = $children->filterByField("subtype", $sow_entity_type_id)->getFirst();
            if (!$has_sow) {
                $status = false;
            }
        }
        return $status;
    }
}
