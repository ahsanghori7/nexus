<?php

namespace App\DocCreator\Shortcode;

use App\Api\Document;
use App\Api\Tender\Enquiry;
use App\DocCreator\DownloadManager\DownloadManagerFactory;
use App\Factory\Shortcodes;
use App\DocCreator\RelayLoader\RelayLoader;
use App\DocCreator\RelayLoader\RelayUserModel;
use App\DocCreator\Shortcode\Select\Select;
use App\DocCreator\Shortcode\Select\SelectEdit;
use App\DocCreator\Shortcode\Select\SelectInput;
use App\DocCreator\Shortcode\Select\SelectMultiLabel;
use App\DocCreator\Snapshot\SnapshotService;
use App\Models\DownloadManager as DownloadManagerModel;
use App\Models\Project;
use App\Models\Util;

class DocumentShortcode extends Shortcode
{

    public const CUSTOM_TYPES = [
        'select' => Select::class,
        'select_edit' => SelectEdit::class,
        'select_multilabel' => SelectMultiLabel::class,
        'select_input' => SelectInput::class,
        'money' => Util::class . '::getTextPennyValue',
    ];

    public const SHORTCODE_WRAPPER = '{}';

    private const DEFAULT_PROVIDER = 'asite';

    /**
     * Check if this is a preview request (PDF generation)
     * @return bool
     */
    private function isPreviewRequest(): bool
    {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($requestUri, '/preview') !== false ||
            (strpos($requestUri, 'action=template') !== false && strpos($requestUri, 'method=preview') !== false);
    }

    /**
     * Detect DocQueue (CLI) execution.
     * @return bool
     */
    private function isDocQueueRequest(): bool
    {
        if (PHP_SAPI === 'cli') {
            return true;
        }
        $argv = $_SERVER['argv'] ?? [];
        return is_array($argv) && stripos(implode(' ', $argv), 'DocQueue') !== false;
    }

    /**
     * True when this run is generating a tender addendum.
     * @return bool
     */
    private function isAddendumRequest(): bool
    {
        return strtolower((string) $this->getDocCreator()->getOptionValue('snapshot_mode')) === 'addendum';
    }

    /**
     * Numbered documents to snapshot, keyed "<provider>:<nd>". The package
     * group is added once per provider that has a tender folder configured.
     *
     * @param array $config
     * @param array $meta
     * @return array
     */
    private function collectSnapshotGroups(array $config, array $meta): array
    {
        $groups = [];
        foreach ($config as $sectionIdx => $section) {
            foreach ($section as $k => $v) {
                if (!isset($v['parent_code'], $v['reference']) || !DownloadManagerFactory::supports(strtolower($v['reference']))) {
                    continue;
                }

                $pVal = $this->getParentValue($config, $sectionIdx, $v['parent_code'], [], $meta);
                if ($pVal !== ($v['conditional_value'] ?? 'Yes')) {
                    continue;
                }

                $ref = strtolower($v['reference']);
                $nd  = (string) ($v['args']['numbered_document'] ?? '');
                if ($nd !== '') {
                    $groups[$ref . ':' . $nd] = true;
                }

                $ctx = $this->getSnapshotContext($ref);
                if ($ctx && ($ctx['provider_folder'] ?? '') !== '') {
                    $groups[$ref . ':_package_'] = true;
                }
            }
        }

        return $groups;
    }

    /**
     * Queues one snapshot job per group, mirroring what the mapping loop does
     * for a template that declares its own numbered documents. The "_package_"
     * group is the tender folder, which the provider identifies by an empty nd.
     *
     * @param array $groups Keys shaped "<provider>:<nd>".
     */
    private function dispatchSnapshotGroups(array $groups): void
    {
        foreach (array_keys($groups) as $key) {
            [$ref, $nd] = array_pad(explode(':', (string) $key, 2), 2, '');

            $context = $this->getSnapshotContext($ref);
            if ($context === null) {
                continue;
            }

            $context['nd'] = ($nd === '_package_') ? '' : $nd;

            try {
                DownloadManagerFactory::make($ref)->dispatch($context, 'snapshot');
            } catch (\Exception $e) {
                error_log("DocumentShortcode: snapshot dispatch failed for $key: " . $e->getMessage());
            }
        }
    }

    /**
     * Takes the numbered documents from the last issuance of this tender - the
     * previous addendum, or the original enquiry - and applies them to the
     * addendum being generated, as if they had been selected on it.
     *
     * The values are written onto the addendum so it keeps its own record of
     * what was re-issued; the definitions that drive the snapshot come from the
     * template of that earlier issuance, since the addendum template declares
     * no numbered-document fields.
     *
     * @param array $meta
     * @return array The meta to work from, with the selections merged in.
     */
    private function inheritIssuedNumberedDocuments(array $meta): array
    {
        try {
            $currentId  = (int) $this->getDocCreator()->doc->getId();
            $documentId = $this->resolvePreviousDocumentId();
            if (!$documentId) {
                return $meta;
            }

            $document = Document::getDocument($documentId);
            if ($document) {
                $previousMeta = (array) json_decode($document['meta'] ?? '{}', true);
                $inherited    = $this->extractNumberedDocumentValues(
                    $this->numberedDocumentConfig(),
                    $previousMeta['values'] ?? []
                );

                if ($inherited) {
                    $meta['values'] = array_merge($meta['values'] ?? [], $inherited);
                    $this->persistInheritedValues($currentId, $meta);
                }
            }
        } catch (\Exception $e) {
            error_log('DocumentShortcode: failed to inherit numbered documents: ' . $e->getMessage());
        }

        return $meta;
    }

    /**
     * The document issued for this tender immediately before the one being
     * generated - the previous addendum, or the original enquiry.
     *
     * Resolved once and cached: it is needed both for inheriting the numbered
     * documents and for recording which snapshot this addendum is measured
     * against.
     *
     * @return int Zero when there is no earlier issuance.
     */
    private function resolvePreviousDocumentId(): int
    {
        static $resolved = [];

        $currentId = (int) $this->getDocCreator()->doc->getId();
        if (array_key_exists($currentId, $resolved)) {
            return $resolved[$currentId];
        }

        $resolved[$currentId] = 0;

        try {
            $models = $this->getDocCreator()->getShortcode()->getModels();
            $pid    = (int) (($models['project'] ?? null)?->getData('id') ?? 0);
            $tid    = (int) (($models['tender'] ?? null)?->getId() ?? 0);

            if ($pid && $tid) {
                foreach (Enquiry::getIssuedDocumentIds($pid, $tid) as $documentId) {
                    if ($documentId !== $currentId) {
                        $resolved[$currentId] = $documentId;
                        break;
                    }
                }
            }
        } catch (\Exception $e) {
            error_log('DocumentShortcode: previous document lookup failed: ' . $e->getMessage());
        }

        return $resolved[$currentId];
    }

    /**
     * The numbered-document shortcodes, as a single config section.
     *
     * They are declared globally rather than per template, so an addendum can
     * resolve them without borrowing the config of the issuance it came from.
     *
     * @return array
     */
    private function numberedDocumentConfig(): array
    {
        $version = (string) ($this->getDocCreator()->getMeta()['config']['version'] ?? '1.0');

        return [Shortcodes::getCodes($version)];
    }

    /**
     * True once the document carries numbered-document selections of its own.
     *
     * @param array $meta
     * @return bool
     */
    private function hasNumberedDocumentValues(array $meta): bool
    {
        foreach (array_keys($meta['values'] ?? []) as $key) {
            if (preg_match('/^nd_\d+$/', (string) $key)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Values of the parent shortcodes that gate a numbered document, taken from
     * an earlier issuance.
     *
     * @param array $config
     * @param array $values
     * @return array
     */
    private function extractNumberedDocumentValues(array $config, array $values): array
    {
        $inherited = [];
        foreach ($config as $section) {
            if (!is_array($section)) {
                continue;
            }

            foreach ($section as $key => $definition) {
                if (!is_array($definition) || !isset($definition['parent_code'], $definition['reference'])) {
                    continue;
                }

                $parentCode = $definition['parent_code'];
                if (array_key_exists($parentCode, $values)) {
                    $inherited[$parentCode] = $values[$parentCode];
                }
            }
        }

        return $inherited;
    }

    /**
     * @param int $documentId
     * @param array $meta
     */
    private function persistInheritedValues(int $documentId, array $meta): void
    {
        $this->getDocCreator()->setMeta($meta);

        if ($documentId) {
            Document::patch("document/{$documentId}", ['meta' => json_encode($meta)]);
        }
    }

    /**
     * Get parent shortcode value (Yes/No)
     * @param array $config
     * @param int $index
     * @param string $parent_code
     * @param array $mapping
     * @param array $meta
     * @return string|null
     */
    private function getParentValue(array $config, int $index, string $parent_code, array $mapping, array $meta): ?string
    {
        $parent_key = $config[$index][$parent_code] ?? null;
        $parent_value = null;

        // Normalize parent_code format: "nd_12" -> "ND12" (uppercase, no underscore)
        $normalized_parent_code = strtoupper(str_replace(['nd_', '_'], ['ND', ''], $parent_code));

        // First try to get from mapping (already processed) - check both formats
        if (isset($mapping[$parent_code]) && is_array($mapping[$parent_code])) {
            $parent_value = $mapping[$parent_code]['value'] ?? null;
            // If it's "Yes" or "No", return it directly
            if ($parent_value === 'Yes' || $parent_value === 'No') {
                return $parent_value;
            }
        }

        // Also try normalized format in mapping
        if (!$parent_value) {
            // Find the mapping key that matches normalized format
            foreach ($mapping as $map_key => $map_value) {
                if (is_array($map_value)) {
                    $map_code = trim($map_value['code'] ?? '', '{}');
                    if (
                        strtoupper(str_replace(['nd_', '_'], ['ND', ''], $map_code)) === $normalized_parent_code ||
                        strtoupper(str_replace(['nd_', '_'], ['ND', ''], $map_key)) === $normalized_parent_code
                    ) {
                        $parent_value = $map_value['value'] ?? null;
                        if ($parent_value === 'Yes' || $parent_value === 'No') {
                            return $parent_value;
                        }
                    }
                }
            }
        }

        // Try normalized format in meta values (e.g., "ND12")
        if (!$parent_value && isset($meta['values'][$normalized_parent_code])) {
            $parent_value = $meta['values'][$normalized_parent_code];
            if ($parent_value === 'Yes' || $parent_value === 'No') {
                return $parent_value;
            }
        }

        // Try original format in meta values (e.g., "nd_12")
        if (!$parent_value && isset($meta['values'][$parent_code])) {
            $parent_value = $meta['values'][$parent_code];
            if ($parent_value === 'Yes' || $parent_value === 'No') {
                return $parent_value;
            }
        }

        // Get parent value from config and convert if needed
        if (!$parent_value) {
            $parent_shortcode = $config[$index][$parent_code] ?? null;
            if ($parent_shortcode) {
                // Try normalized format first
                $parent_value = $meta['values'][$normalized_parent_code] ?? $meta['values'][$parent_code] ?? null;

                // Convert index to label if it's a select type
                if (
                    isset($parent_shortcode['type']) && $parent_shortcode['type'] === 'select' &&
                    isset($parent_shortcode['options']) && is_array($parent_shortcode['options'])
                ) {
                    // If parent_value is a number (index), get the option value
                    if (is_numeric($parent_value) && isset($parent_shortcode['options'][$parent_value])) {
                        $parent_value = $parent_shortcode['options'][$parent_value];
                    }
                }
            }
        }

        return $parent_value;
    }

    /**
     * @return array
     */
    public function getMapping(): array
    {
        $meta = $this->getDocCreator()->getMeta();
        $config = $this->getConfig();
        $models = $this->getDocCreator()->getShortcode()->getModels();
        $isPreview = $this->isPreviewRequest();
        $isDocQueue = $this->isDocQueueRequest();

        // Inject the DownloadManager model
        if (!$this->getDocCreator()->modelExists('downloadManager') && $this->getDocCreator()->doc->hasData()) {
            $source  = $isPreview ? 'preview' : ($isDocQueue ? 'queue' : null);
            $doc     = $this->getDocCreator()->doc;
            $dmModel = new DownloadManagerModel([], (string) $doc->getId());
            $dmModel->setSource($source);
            $dmModel->setUser($models['user'] ?? null);
            $this->getDocCreator()->setModel('downloadManager', $dmModel);
            $models['downloadManager'] = $dmModel;
        }

        if ($this->getDocCreator()->modelExists('downloadManager')) {
            $dm = $this->getDocCreator()->getModel('downloadManager');
            $dm->setRecipient($models['subcontractor'] ?? null);
            $dm->setTenderId((int) (($models['tender'] ?? null)?->getId() ?? 0));
        }

        // Initialize Snapshot State if in Queue mode
        if ($isDocQueue) {
            $snapshotGroups = $this->collectSnapshotGroups($config, $meta);

            // An addendum carries no numbered-document fields of its own, so it
            // re-issues whatever was selected for it. The selections are copied
            // over from the previous issuance the first time it is generated,
            // and read back off its own meta on every run after that.
            $inheritedGroups = false;
            if (empty($snapshotGroups) && $this->isAddendumRequest()) {
                if (!$this->hasNumberedDocumentValues($meta)) {
                    $meta = $this->inheritIssuedNumberedDocuments($meta);
                }

                $snapshotGroups  = $this->collectSnapshotGroups($this->numberedDocumentConfig(), $meta);
                $inheritedGroups = !empty($snapshotGroups);
            }

            if (empty($snapshotGroups) && $this->isAddendumRequest()) {
                $ctx = $this->getSnapshotContext(self::DEFAULT_PROVIDER);
                if ($ctx) {
                    $ctx['baseline_document_id'] = $this->resolvePreviousDocumentId();
                    SnapshotService::initializeUploadOnlySnapshot($this->getDocCreator()->doc->getId(), $ctx);
                }
            }

            if (!empty($snapshotGroups)) {
                $firstKey = array_key_first($snapshotGroups);
                $firstRef = explode(':', $firstKey)[0];
                $ctx = $this->getSnapshotContext($firstRef);
                if ($ctx) {
                    // Recorded up front so everything downstream - the Schedule
                    // of Changes and the addendum download page - knows which
                    // issuance this one is measured against, without having to
                    // walk the tender history again.
                    if ($this->isAddendumRequest()) {
                        $ctx['baseline_document_id'] = $this->resolvePreviousDocumentId();
                    }

                    SnapshotService::initializeSnapshot($this->getDocCreator()->doc->getId(), count($snapshotGroups), $ctx);

                    // Inherited groups have no matching fields in this template,
                    // so the mapping loop below will never reach them - queue
                    // them here instead.
                    if ($inheritedGroups) {
                        $this->dispatchSnapshotGroups($snapshotGroups);
                    }
                }
            }
        }

        $mapping = [];
        foreach ($config as $index => $value) {
            foreach ($value as $k => $v) {
                $code = trim($k, self::SHORTCODE_WRAPPER);
                $value = $v['default'] ?? null;

                // Handle numbered document link shortcodes with conditional values based on incorporation type
                if (isset($v['parent_code'], $v['reference'])) {
                    $reference_type = strtolower($v['reference']);
                    $parent_value = $this->getParentValue($config, $index, $v['parent_code'], $mapping, $meta);
                    $conditional_value = $v['conditional_value'] ?? 'Yes';
                    $is_condition_met = ($parent_value === $conditional_value);

                    if ($reference_type === 'json') {
                        if (!$parent_value) {
                            continue;
                        }
                        // Use transformation metadata directly
                        $transformation = $v['transformation'] ?? [];
                        $yes_text = $transformation['yes_text'] ?: "included in document";
                        $no_text = $transformation['no_text'] ?: "not included in document";

                        $v['value'] = $is_condition_met ? $yes_text : $no_text;

                        // CRITICAL: Ensure code is ALWAYS preserved from config
                        // The code property is essential for shortcodesValues to work correctly
                        // Code should already be in $v from config, but ensure it's set
                        if (empty($v['code']) && isset($config[$index][$k]['code'])) {
                            $v['code'] = $config[$index][$k]['code'];
                        } elseif (empty($v['code'])) {
                            // Fallback: generate from key if not in config
                            $code_from_key = strtoupper(str_replace('nd_', 'ND', $k));
                            $v['code'] = '{' . $code_from_key . '}';
                        }
                        $mapping[$k] = $v;
                        continue;
                    } elseif (DownloadManagerFactory::supports($reference_type)) {
                        // Use transformation metadata directly
                        $transformation = $v['transformation'] ?? [];
                        $yes_text = !empty($transformation['yes_text']) ? $transformation['yes_text'] : "Document Downloads";
                        $no_text  = !empty($transformation['no_text'])  ? $transformation['no_text']  : "Not Available";
                        if (!$parent_value) {
                            continue;
                        } elseif (!$is_condition_met) {
                            $v['value'] = $no_text;
                            $mapping[$k] = $v;
                            continue;
                        }

                        // Dispatch snapshot job for ND when running in queue mode
                        if ($isDocQueue) {
                            $nd = (string) ($v['args']['numbered_document'] ?? '');
                            $snapshotContext = $this->getSnapshotContext($reference_type);
                            if ($snapshotContext !== null) {
                                // Dispatch ND-specific snapshot
                                if ($nd !== '') {
                                    try {
                                        $snapshotContext['nd'] = $nd;
                                        DownloadManagerFactory::make($reference_type)->dispatch($snapshotContext, 'snapshot');
                                    } catch (\Exception $e) {
                                        error_log('DocumentShortcode: snapshot dispatch failed for ND ' . $nd . ': ' . $e->getMessage());
                                    }
                                }

                                // One-time dispatch for Tender Package Documents if provider_folder exists
                                $providerFolder = $snapshotContext['provider_folder'] ?? '';
                                static $packageDispatched = [];
                                $docId = $this->getDocCreator()->doc->getId();
                                if ($providerFolder !== '' && !isset($packageDispatched[$docId])) {
                                    try {
                                        $snapshotContext['nd'] = '';
                                        DownloadManagerFactory::make($reference_type)->dispatch($snapshotContext, 'snapshot');
                                        $packageDispatched[$docId] = true;
                                    } catch (\Exception $e) {
                                        error_log('DocumentShortcode: tender package dispatch failed: ' . $e->getMessage());
                                    }
                                }
                            }
                        }

                        // Store transformation text for dataref processing
                        if ($isPreview || $isDocQueue) {
                            $v['transformation_text'] = $yes_text;
                            // Continue to dataref processing below
                        } else {
                            // Frontend runtime: use transformation text directly
                            $v['value'] = $yes_text;
                            $mapping[$k] = $v;
                            continue;
                        }
                    } elseif ($reference_type === 'attachment') {
                        // Use transformation metadata directly
                        $transformation = $v['transformation'] ?? [];
                        $yes_text = $transformation['yes_text'] ?: "attached in document";
                        $no_text = $transformation['no_text'] ?: "not attached in document";

                        $v['value'] = $is_condition_met ? $yes_text : $no_text;
                        $mapping[$k] = $v;
                        continue;
                    }
                }

                if (isset($v['dataref']) && $v['dataref']) {
                    $datarefs = [$v['dataref']];
                    if (is_array($v['dataref'])) {
                        $datarefs = $v['dataref'];
                    }
                    foreach ($datarefs as $dataref) {
                        list($source, $key) = explode(".", $dataref);
                        $model = $models[$source] ?? false;
                        if (isset($v['args']['models']) && is_array($v['args']['models'])) {
                            foreach ($v['args']['models'] as $arg_model) {
                                $v['args'][$arg_model] = $models[$arg_model] ?? null;
                            }
                        }
                        if ($model) {
                            if (method_exists($model, $key)) {
                                // Inject shortcode-level 'reference' into args so the
                                // model method (e.g. getDownloadLink) can select the right provider.
                                if (isset($v['reference']) && !isset($v['args']['reference'])) {
                                    $v['args']['reference'] = $v['reference'];
                                }
                                $value = $model->$key($v['args'] ?? []);
                                // Prevent meta['values'] from overwriting a generated download link
                                if (isset($v['reference']) && DownloadManagerFactory::supports((string) $v['reference'])) {
                                    $v['transformed'] = true;
                                }
                            } else {
                                $value = $model->getData($key);
                            }
                        }
                    }
                }
                /*
                 * Get the changed value if is the case
                 * Skip if we've already transformed the value (e.g., for Asite links)
                 */
                if (isset($meta['values'][$code]) && !isset($v['sync']) && $v['type'] !== 'editor' && !isset($v['transformed'])) {
                    $value = $meta['values'][$code];
                }

                /*
                 * Get the label value for select elements as the value will actually be the index key
                 */
                $type = $v['type'] ?? null;

                if ($type && isset(self::CUSTOM_TYPES[$v['type']])) {
                    $cls = self::CUSTOM_TYPES[$v['type']];
                    if (class_exists($cls) && method_exists($cls, 'getSelectedValue')) {
                        $value = (new $cls($v['options']))->getSelectedValue($value);
                    } else {
                        $value = $v['type'] === 'money' && key_exists("just_number", $v) && $v["just_number"] ? $value : $cls($value);
                    }
                }

                if (isset($v['source'])) {
                    if (isset($meta['values'][$code]) && !isset($v['transformed'])) {
                        $value = $meta['values'][$code];
                    }
                }

                $v['value'] = $value;

                // Do NOT transform base fields (like nd_12) - they should show Yes/No
                // Only transformation fields (like nd_12_incorporation) with parent_code and reference are transformed
                // Those are handled in the section above (around line 130-200)

                $mapping[$k] = $v;
            }
        }

        // Second pass: Process any incorporation fields that might have been missed
        // This ensures fields are processed even if parent wasn't available in first pass
        foreach ($config as $index => $value) {
            foreach ($value as $k => $v) {
                // Process JSON type incorporation fields
                if (isset($v['parent_code'], $v['reference'])) {
                    $reference_type = strtolower($v['reference']);

                    if ($reference_type === 'json') {
                        // Re-check parent value (might be available now after first pass)
                        $parent_value = $this->getParentValue($config, $index, $v['parent_code'], $mapping, $meta);
                        if (!$parent_value) {
                            continue;
                        }
                        $conditional_value = $v['conditional_value'] ?? 'Yes';
                        $is_condition_met = ($parent_value === $conditional_value);

                        // Use transformation metadata directly
                        $transformation = $v['transformation'] ?? [];
                        $yes_text = $transformation['yes_text'] ?: "included in document";
                        $no_text = $transformation['no_text'] ?: "not included in document";

                        // Always update if we have a valid parent value OR if mapping doesn't exist
                        // This ensures the field is always in the mapping with correct code
                        if (
                            !isset($mapping[$k]) ||
                            ($parent_value !== null && ($parent_value === 'Yes' || $parent_value === 'No'))
                        ) {

                            $v['value'] = $is_condition_met ? $yes_text : $no_text;

                            // CRITICAL: Ensure code is ALWAYS preserved from config
                            // The code property is essential for shortcodesValues to work correctly
                            if (empty($v['code']) && isset($config[$index][$k]['code'])) {
                                $v['code'] = $config[$index][$k]['code'];
                            } elseif (empty($v['code'])) {
                                // Fallback: generate from key if not in config
                                $code_from_key = strtoupper(str_replace('nd_', 'ND', $k));
                                $v['code'] = '{' . $code_from_key . '}';
                            }

                            $mapping[$k] = $v;
                        } elseif (
                            isset($mapping[$k]) &&
                            isset($mapping[$k]['value']) &&
                            $mapping[$k]['value'] !== $yes_text &&
                            $mapping[$k]['value'] !== $no_text
                        ) {
                            // Update if current value doesn't match expected transformation text
                            $v['value'] = $is_condition_met ? $yes_text : $no_text;

                            // Ensure code is preserved
                            if (empty($v['code']) && isset($config[$index][$k]['code'])) {
                                $v['code'] = $config[$index][$k]['code'];
                            } elseif (empty($v['code'])) {
                                $code_from_key = strtoupper(str_replace('nd_', 'ND', $k));
                                $v['code'] = '{' . $code_from_key . '}';
                            }

                            $mapping[$k] = $v;
                        }
                    }
                }
            }
        }

        return $mapping;
    }

    /**
     * @param string $referenceType
     * @return array|null
     */
    private function getSnapshotContext(string $referenceType): ?array
    {
        static $cache = [];

        $cacheKey = $referenceType . ':' . $this->getDocCreator()->doc->getId();
        if (array_key_exists($cacheKey, $cache)) {
            return $cache[$cacheKey];
        }

        try {
            $docCreator = $this->getDocCreator();
            $models     = $docCreator->getShortcode()->getModels();

            $doc        = $docCreator->doc;
            $aid        = (int) ($models['account'] ?? null)?->getId();
            $uid        = (int) ($models['user']    ?? null)?->getId();
            $projectId  = (int) ($models['project'] ?? null)?->getId();
            $tenderId   = (int) ($models['tender']  ?? null)?->getId();

            // Determine mode from DocQueue
            $mode = (string) $docCreator->getOptionValue('snapshot_mode');

            $providerId = SnapshotService::getProviderIdForAccount($aid, $referenceType);
            if (!$providerId) {
                return $cache[$cacheKey] = null;
            }

            // Check project has an integration for this provider
            $integration = SnapshotService::getProjectIntegration($projectId, $providerId);
            if (!$integration) {
                return $cache[$cacheKey] = null;
            }

            $parentDocumentId = (int) $doc->getId();
            $providerFolder   = (string) ($models['tender'] ?? null)?->getData('provider_folder');

            return $cache[$cacheKey] = [
                'aid'               => $aid,
                'uid'               => $uid,
                'project_id'        => $projectId,
                'tender_id'         => $tenderId,
                'provider_id'       => $providerId,
                'provider'          => $referenceType,
                'provider_folder'   => $providerFolder,
                'mode'              => $mode,
                'parent_document_id'=> $parentDocumentId,
                'project_reference' => (string) ($models['project'] ?? null)?->getData('reference'),
                'package_name'      => (string) ($models['tender'] ?? null)?->getData('label'),
            ];
        } catch (\Exception $e) {
            error_log('DocumentShortcode::getSnapshotContext failed: ' . $e->getMessage());
            return $cache[$cacheKey] = null;
        }
    }

    /**
     * Collect Asite numbered documents for a bulk call.
     *
     * @param array $config
     * @param array $meta
     * @param array $models
     * @return array
     */
    private function collectAsiteLinks(array $config, array $meta, array $models): mixed
    {
        if (!isset($models['project']) || !method_exists($models['project'], 'getAsiteFile')) {
            return [];
        }

        $asiteNumbers = [];
        foreach ($config as $key => $value) {
            foreach ($value as $k => $v) {
                if (
                    isset($v['reference']) &&
                    strtolower((string)$v['reference']) === 'asite' &&
                    isset($v['args']['numbered_document'])
                ) {
                    $include = true;
                    if (isset($v['parent_code'])) {
                        $parent = $config[$key][$v['parent_code']] ?? null;
                        $parentValue = $meta['values'][$v['parent_code']] ?? ($parent['default'] ?? null);
                        if (isset($parent['options']) && is_array($parent['options'])) {
                            $options = array_values($parent['options']);
                            if (is_numeric($parentValue) && isset($options[(int)$parentValue])) {
                                $parentValue = $options[(int)$parentValue];
                            }
                        }
                        $conditional = $v['conditional_value'] ?? null;
                        if ($conditional !== null && strcasecmp((string)$parentValue, (string)$conditional) !== 0) {
                            $include = false;
                        }
                    }
                    if ($include) {
                        $asiteNumbers[] = (string)$v['args']['numbered_document'];
                    }
                }
            }
        }

        if ($asiteNumbers) {
            $source = $this->getDocCreator()->getOption('preview') ? 'preview' : 'queue';
            $asiteNumbers = array_unique($asiteNumbers);
            return $models['project']->getAsiteFile([
                'numbered_document' => $asiteNumbers,
                'user' => $models['user'] ?? null,
                'source' => $source,
            ]);
        }
        return [];
    }

    /**
     * Retrieve Asite link value from bulk response.
     *
     * @param array $asiteBulk
     * @param array $shortcode
     * @return mixed
     */
    private function retrieveAsiteLinks(mixed $asiteBulk, array $shortcode): mixed
    {
        $nd = (string)($shortcode['args']['numbered_document'] ?? '');
        if ($nd !== '' && isset($asiteBulk[$nd])) {
            return $asiteBulk[$nd];
        }
        Project::$error_number_document = 'Asite numbered document not found: ' . $nd;
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (preg_match('#document-creator/template/\\d+/preview#', $uri)) {
            $parsed = parse_url($uri);
            $path = $parsed['path'] ?? '';
            $query = [];
            if (isset($parsed['query'])) {
                parse_str($parsed['query'], $query);
            }
            $query['error'] = $query['error'] ?? 'asite';
            if ($nd) {
                $query['nd'] = $nd;
            }
            $redirect = $path . '?' . http_build_query($query);
            header("Location: {$redirect}");
            exit;
        }
        return null;
    }
}
