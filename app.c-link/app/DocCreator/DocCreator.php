<?php

namespace App\DocCreator;

use App\Api\Account as AccountApi;
use App\DocCreator\Shortcode\JitShortcode;
use App\DocCreator\Shortcode\SettingsShortcode;
use App\DocCreator\Shortcode\SowShortcode;
use App\Models\Abstraction as AbstractModel;
use App\Models\Document;
use App\Models\Account;
use App\Models\Subcontractor;
use App\DocCreator\Document\Tender as TenderDocument;
use App\DocCreator\Document\Order as OrderDocument;
use App\DocCreator\Document\Instruction as InstructionDocument;
use App\DocCreator\Shortcode\Shortcode as Shortcode;
use App\Models\UserModel;
use Exception;

class DocCreator
{

    const ANZ_REGION_IDS = [2, 4];
    const ORDERED_SIGNATORY_KEYS = [
        'signature_main_contractor',
        'signature_main_contractor_witness',
        'signature_subcontractor',
        'signature_subcontractor_witness',
        'signature_main_contractor_bank',
        'signature_main_contractor_bank_witness',
    ];

    /**
     * @var Document
     */
    public Document $doc;

    /**
     * @var mixed
     */
    public $shortcode;

    /**
     * @var array
     */
    public $models = [];

    /**
     * @var string
     */
    public $content;

    /**
     * @var array
     */
    public $options = [
        'parseShortcodes' => true,
        'parseHtml' => true,
        'parseFiles' => true,
        'parseHeader' => true,
        'parseFooter' => true,
        'sow' => true,
        'pageNr' => true,
        'attachments' => false,
        "parseMiniBoq" => false,
        'parseSimpleRowQuotePrice' => false,
        'vat' => 20
    ];

    public const FOOTER_LABELS = [
        'tender' => 'Tender Documents',
        'order' => 'Order Documents'
    ];

    /**
     * DocCreator constructor.
     * @param Document $doc
     */
    public function __construct(Document $doc)
    {
        $this->doc = $doc;
        $this->shortcode = new Shortcode($this);
    }

    /**
     * @return Document
     */
    public function document(): Document
    {
        return $this->doc;
    }

    /**
     * @param Account $account
     * @param int $main_contractor_aid
     */
    public function setSubcontractor(Account $account, int $main_contractor_aid = 0): void
    {
        /*
         * Set subcontractor user model
         */
        $account_data = $account->getData() + ['main_contractor_id' => $main_contractor_aid];
        $subcontractor = new Subcontractor($account_data, $account->getId());
        $this->setModel('subcontractor', $subcontractor);
    }

    /**
     * @param string $key
     * @param mixed $value
     */
    public function setOption(string $key, mixed $value): void
    {
        $this->options[$key] = $value;
    }

    /**
     * @param array $options
     */
    public function setOptions(array $options): void
    {
        foreach ($options as $key => $value) {
            $this->setOption($key, $value);
        }
    }

    /**
     * @return array
     */
    public function getOptions(): array
    {
        return $this->options;
    }

    /**
     * @param string $option
     * @return bool|null
     */
    public function getOption(string $option): ?bool
    {
        if (isset($this->getOptions()[$option])) {
            return $this->getOptions()[$option];
        }

        return null;
    }

    /**
     * @param string $option
     * @param mixed $default
     * @return mixed
     */
    public function getOptionValue(string $option, $default = null)
    {
        return $this->getOptions()[$option] ?? $default;
    }

    /**
     * @param string $content
     */
    public function setContent(string $content): void
    {
        $this->content = $content;
    }

    /**
     * @throws Exception
     */
    public function getDocumentContent(): string
    {
        return $this->document()->getContent();
    }

    /**
     * @return string
     * @throws Exception
     */
    public function getContent(): string
    {
        /*
         * Cache the document json content
         */
        if (!$this->content) {
            $this->setContent($this->document()->getContent());
        }

        return $this->content;
    }

    /**
     * @return array|mixed|object|string
     * @throws Exception
     */
    public function getContentAsArray()
    {
        if (is_scalar($this->getContent())) {
            return json_decode($this->getContent(), true);
        }

        return $this->getContent();
    }

    /**
     * @return Shortcode
     */
    public function getShortcode(): Shortcode
    {
        return $this->shortcode;
    }

    /**
     * @param array $models
     */
    public function setModels(array $models): void
    {
        array_walk($models, function ($model, $key) {
            $this->setModel($key, $model);
        });
    }

    /**
     * @param string $name
     * @param AbstractModel $model
     */
    public function setModel(string $name, AbstractModel $model): void
    {
        $this->models[$name] = $model;
    }

    /**
     * @param string $model
     * @return mixed|null
     * @throws Exception
     */
    public function getModel(string $model)
    {
        if (!isset($this->models[$model]) && !$this->getOption('preview')) {
            throw new \Exception("Model not found $model");
        }
        return $this->models[$model] ?? null;
    }

    /**
     * @param string $model
     * @return mixed|null
     * @throws Exception
     */
    public function modelExists(string $model)
    {
        return isset($this->models[$model]);
    }

    /**
     * @return array|mixed|object
     */
    public function getMeta()
    {
        return $this->document()->hasData() ? (array)json_decode($this->document()->getData()['meta'] ?? [], true) : [];
    }

    /**
     * @param array $meta
     */
    public function setMeta(array $meta): void
    {
        $this->document()->setData('meta', json_encode($meta));
    }

    /**
     * @return string
     */
    public function getType(): string
    {
        return $this->document()->getType();
    }

    /**
     * @return string
     */
    public function getSubType(): string
    {
        return $this->document()->getSubType();
    }

    /**
     * @return OrderDocument|TenderDocument|InstructionDocument
     * @throws Exception
     */
    public function getDocument()
    {
        if ($this->document()->isTenderDocument()) {
            return new TenderDocument($this);
        }
        if ($this->document()->isInstructionDocument()) {
            return new InstructionDocument($this);
        }
        return new OrderDocument($this);
    }

    /**
     * @return array
     */
    public function getShortcodes(): array
    {
        return $this->getShortcode()->getShortcodes();
    }

    /**
     * @param string $key
     * @param string $default
     * @return string|null
     */
    public function getSingleShortcode(string $key, ?string $default = null): ?string
    {
        $shortcodes = $this->getShortcode()->getShortcodes();
        $key = "{" . $key . "}";
        return $shortcodes[$key] ?? $default;
    }

    /**
     * @throws Exception
     */
    public function setShortcodes(): void
    {
        /*
         * Just In Time shortcodes
         */
        $this->getShortcode()->setValues(((new JitShortcode($this))->parseShortcodes()));

        /*
         * Settings shortcodes that are set from company assets settings
         */
        $this->getShortcode()->setValues(((new SettingsShortcode($this))->parseShortcodes()));

        /*
         * Scope of Works
         */
        if ($this->getOption('sow')) {
            $this->getShortcode()->setValues(((new SowShortcode($this))->parseShortcodes()));
        }

        /*
         * Document shortcodes + Meta shortcodes
         */
        $this->getShortcode()->setValues($this->getDocument()->parseShortcodes());
    }

    /**
     * @return array
     * @throws \App\Api\Exception
     */
    public function getSignatoryFromDocumentCreator(): array
    {
        $metaValues = $this->doc->getMeta()["values"] ?? [];
        $uids = array_values(array_filter(array_map(function ($key) use ($metaValues) {
            return $metaValues[$key] ?? null;
        }, self::ORDERED_SIGNATORY_KEYS)));

        return $this->getSignatoryOrderFromDocumentCreator($uids);
    }

    /**
     * @param string $accountType
     * @return array
     * @throws \App\Api\Exception
     */
    public function getSignatoryAccountsIdFromDocumentCreator(string $accountType): array
    {
        $metaValues = $this->doc->getMeta()["values"] ?? [];
        $uids = array_values(array_filter(array_map(function ($key) use ($metaValues) {
            return $metaValues[$key] ?? null;
        }, self::ORDERED_SIGNATORY_KEYS)));

        return $this->getSignatoryOrderFromDocumentCreator(array_values($uids), $accountType);
    }

    /**
     * @param array $uids
     * @param string $returnAccountByType
     * @return array|int[]
     * @throws \App\Api\Exception
     */
    public function getSignatoryOrderFromDocumentCreator(array $uids = [], string $returnAccountByType = '')
    {
        $document_creator_order = [
            'contractor'    => [],
            'subcontractor' => []
        ];
        $users = AccountApi::loadUsersByIds($uids);
        $accounts = AccountApi::getAccounts(array_unique(array_column($users, 'account_id')));
        $specialist_types = AccountApi::getSpecialistTypes();
        $docusign_order = [];
        foreach ($accounts as $account) {
            $type = (!AccountApi::isTypeOf($account['type_id'], $specialist_types)) ? 'contractor' : 'subcontractor';
            $docusign_order[$type] = (int)$account['id'];
        }
        foreach ($users as $user) {
            $type = ((int)$user['account_id'] === $docusign_order['contractor']) ? 'contractor' : 'subcontractor';
            $index = array_search($user['id'], $uids);
            $document_creator_order[$type][$index] = $user['id'];
        }

        ksort($document_creator_order);
        foreach ($document_creator_order as &$subArray) {
            ksort($subArray);
        }
        unset($subArray);

        if (in_array($returnAccountByType, ['contractor', 'subcontractor'])) {
            return ["aid" => $docusign_order[$returnAccountByType]];
        }

        return array_merge($document_creator_order['contractor'], $document_creator_order['subcontractor']);
    }

    /**
     * @return bool
     */
    public function isSignatoryDocument(): bool
    {
        if (isset($this->getMeta()['signatory_wet']) && $this->getMeta()['signatory_wet']) {
            return false;
        }
        return (bool)($this->getMeta()['signatory'] ?? $this->getOption("signatory"));
    }

    /**
     * @return array
     * @throws \App\Api\Exception
     */
    public function getSignatoriesRecipients(): array
    {
        $signatories = [];
        if ($this->isSignatoryDocument()) {
            $signatories_user_ids = $this->getSignatoryFromDocumentCreator();
            if ($signatories_user_ids) {
                $usersData = AccountApi::get(sprintf('user/[%s]', implode(",", $signatories_user_ids)));
                if ($usersData) {
                    $users = array_column(array_merge(...$usersData), null, 'id');
                    $orderedUsers = array_values(array_filter(array_map(function ($userId) use ($users) {
                        return $users[$userId] ?? null;
                    }, $signatories_user_ids)));

                    $main_contractor_id = 0;
                    $signatories = array_map(function ($user) use (&$main_contractor_id) {

                        $userModel = new UserModel($user, $user['id']);
                        $account = AccountApi::getAccount(AccountApi::getAccountIdByUser(intval($userModel->getId())));

                        //get the main contractor account id
                        //so we can retrieve the the email for subcontractors from the "supply chain"
                        if (!$main_contractor_id && !AccountApi::isTypeOf($account['type_id'], AccountApi::getSpecialistTypes())) {
                            $main_contractor_id = $account['id'];
                        }

                        $userModel->setSupplyChainDataFromMainContractor($main_contractor_id);

                        /*
                         * @TODO we still have supply chain emails that are md5 based as from the supply chain legacy version where we used to store the emails as md5 until the user activated their account
                           This is no longer the case as right now when someone gets invited to supply chain we set the email as it is in the user table
                           There is need to be a task to update all md5 email addresses with the ones from the account meta table
                         */
                        if (!filter_var($userModel->getData("email"), FILTER_VALIDATE_EMAIL)) {
                            $userModel->setData("email", $account['email']);
                        }

                        $userModel->setData("signatory_area_id", $user['id']);
                        $userModel->setData("signatory_routing_order", 1);

                        return $userModel;
                    }, $orderedUsers);
                }
            }
        }
        return $signatories;
    }

    /**
     * @return array|mixed|object
     * @throws Exception
     */
    public function parseContent()
    {
        return json_encode($this->getShortcode()->replaceShortcodes($this->getContent()));
    }

    /**
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     * @throws Exception
     */
    public function parseFiles()
    {
        $content = json_decode($this->getContent(), true);
        $this->document()->setData("boq_enabled", $this->hasBoqEnabled());
        $this->setModel("document", $this->document());
        return json_encode(FilesParser::parseFiles(
            $content,
            $this->getShortcode()->getModels(),
            $this->getOptionValue('skipFileManagerSources', [])
        ));
    }

    /**
     * @return false|string
     * @throws Exception
     */
    public function parseMiniBoq()
    {
        $content = json_decode($this->getContent(), true);
        return json_encode(MiniBoqTemplate::parse($content, $this->getShortcode()->getModels()));
    }

    /**
     * @return false|string
     * @throws Exception
     */
    public function parseSimpleRowQuotePrice()
    {
        $content = json_decode($this->getContent(), true);
        $this->setModel("document", $this->document());
        $meta = $this->getModel("document")->getMeta();
        $price = 0;
        if (isset($meta["quote"]["price"])) {
            $price = intval($meta["quote"]["price"]) / 100;
        }
        $vat = $meta["vat"] ?? SimpleRowQuotePriceTemplate::DEFAULT_VAT;
        return json_encode(SimpleRowQuotePriceTemplate::parse($content, $this->getShortcode()->getModels(), $price, $vat));
    }

    /**
     * @return false|string
     * @throws Exception
     */
    public function parseHiddenFields()
    {
        $content = json_decode($this->getContent(), true);
        return json_encode(HiddenFields::parse($content, $this->document()->getAllShortcodes(), $this->getShortcodes()));
    }

    /**
     * @return false|string
     * @throws Exception
     */
    public function parseScheduleOfAttendances()
    {
        $content = json_decode($this->getContent(), true);
        return json_encode(SOATemplate::parse($content, $this->getShortcode()->getModels()));
    }

    /**
     * @return false|string
     * @throws Exception
     */
    public function parseScheduleOfAttendancesMc()
    {
        $content = json_decode($this->getContent(), true);
        return json_encode(SOAMCTemplate::parse($content, $this->getShortcode()->getModels()));
    }

    /**
     * @return string
     * @throws Exception
     */
    public function parseHtml(): string
    {
        return json_encode(HtmlParser::parseAllTags($this->getContentAsArray()));
    }

    /**
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     * @throws Exception
     */
    public function parseHeader()
    {
        $data = [
            'content' => $this->getContentAsArray(),
            'account' => $this->getModel('account'),
        ];

        return HtmlParser::parseHeader($data);
    }

    /**
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     * @throws Exception
     */
    public function parseFooter()
    {
        return HtmlParser::parseFooter($this);
    }

    /**
     * @param array $options
     * @return array|mixed|object|string
     * @throws Exception
     */
    public function preview(array $options = [])
    {
        $this->setOption('preview', true);
        foreach ($options as $key => $option) {
            $this->setOption($key, $option);
        }
        return $this->generate();
    }

    /**
     * @return array|mixed|object|string
     * @throws Exception
     */
    public function generate()
    {

        $this->setContent($this->getDocumentContent());

        /*
         * Replace footer values
         */
        if ($this->getOption('parseFooter')) {
            $this->setContent($this->parseFooter());
        }

        /*
         * Replace content with shortcodes
         */
        if ($this->getOption('parseShortcodes')) {
            /*
             * Set shortcodes values
             */
            $this->setShortcodes();
            $this->setContent($this->parseContent());
        }

        /*
        * Replace content html tags
        * br tag will convert to <br>
        * b tag will convert to <strong></strong>
        */
        if ($this->getOption('parseHtml')) {
            $this->setContent($this->parseHtml());
        }

        /*
         * Replace content file type with the files from file manager
         */
        if ($this->getOption('parseFiles')) {
            $this->setContent($this->parseFiles());
        }

        /*
         * Purchase Order table calculation
         */
        if ($this->getOption('parseMiniBoq')) {
            $this->setContent($this->parseMiniBoq());
        }

        /*
         * Simple Row Quote Price
         */
        if ($this->getOption('parseSimpleRowQuotePrice')) {
            $this->setContent($this->parseSimpleRowQuotePrice());
        }

        /*
         * Schedule of attendances template embeded
         */
        if ($this->getOption('soa')) {
            $this->setContent($this->parseScheduleOfAttendances());
        }

        /*
         * Schedule of attendances template embeded for McLaren
         */
        if($this->getOption('soamc')){
            $this->setContent($this->parseScheduleOfAttendancesMc());
        }

        /*
          * Replace header values
          */
        if ($this->getOption('parseHeader')) {
            $this->setContent($this->parseHeader());
        }


        /**
         * Hide fields based on hidden key in the document
         */
        $this->setContent($this->parseHiddenFields());

        return json_decode($this->parseContent(), true);
    }

    /**
     * @return string
     * @throws \App\Api\Exception
     */
    public function getFooterLabel(): string
    {
        $label = $this->document()->isTenderDocument() ? self::FOOTER_LABELS['tender'] : self::FOOTER_LABELS['order'];
        if (in_array((int)$this->getModel("account")->getData("region_group_id"), self::ANZ_REGION_IDS, true)) {
            $label = "Subcontract " . $label;
        }
        return $label;
    }

    /**
     * @return bool
     * @throws \App\Api\Exception
     */
    public function hasBoqEnabled(): bool
    {
        //only check boq for tenders
        if ($this->document()->isTenderDocument()) {
            $meta = $this->getMeta();
            $meta_values = $meta['values'] ?? [];
            foreach ($this->document()->getConfig()['data'] as $config) {
                foreach ($config as $key =>  $value) {
                    if (isset($value['boq'])) {
                        $selected_option = $meta_values[$key] ?? null;
                        $index = $value['boq']['option_index'] ?? null;
                        return ($index && $selected_option && $selected_option === $index);
                    }
                }
            }
        }
        return false;
    }
}
