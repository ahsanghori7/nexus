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
use App\Models\Signatory;
use App\DocCreator\Document\Tender as TenderDocument;
use App\DocCreator\Document\Order as OrderDocument;
use App\DocCreator\Document\Instruction as InstructionDocument;
use App\DocCreator\Shortcode\Shortcode as Shortcode;
use App\Models\UserModel;
use Exception;

class DocCreator
{

    /**
     * @var
     */
    public Document $doc;

    /**
     * @var
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
        'attachments' => false
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
     * @param string $value
     */
    public function setOption(string $key, string $value): void
    {
        $this->options[$key] = $value;
    }

    /**
     * @param array $options
     */
    public function setOptions(array $options): void
    {
        foreach($options as $key => $value){
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
     * @return mixed|null
     */
    public function getOption(string $option): ?bool
    {
        if(isset($this->getOptions()[$option])){
            return $this->getOptions()[$option];
        }

        return null;
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
        if(!$this->content){
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
        if(is_scalar($this->getContent())){
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
        array_walk($models, function($model, $key) {
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
        if(!isset($this->models[$model]) && !$this->getOption('preview')){
            throw new \Exception("Model not found $model");
        }
        return $this->models[$model] ?? null;
    }

    /**
     * @return array|mixed|object
     */
    public function getMeta()
    {
        return (array)json_decode($this->document()->getData()['meta'] ?? [], true);
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
        if($this->document()->isTenderDocument()){
            return new TenderDocument($this);
        }
        if($this->document()->isInstructionDocument()){
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
     * @param null $default
     * @return array|null
     */
    public function getSingleShortcode(string $key, $default = null): string
    {
        $shortcodes = $this->getShortcode()->getShortcodes();
        $key = "{".$key."}";
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
        if($this->getOption('sow')) {
            $this->getShortcode()->setValues(((new SowShortcode($this))->parseShortcodes()));
        }

        /*
         * Document shortcodes + Meta shortcodes
         */
        $this->getShortcode()->setValues($this->getDocument()->parseShortcodes());
    }

    /**
     * @return array|array[]
     * @throws \App\Api\Exception
     */
    public function getSignatoriesRecipients()
    {
        $meta = $this->getMeta();
        $signatory = $meta['signatory'] ?? $this->getOption("signatory");
        $signatories = [];
        if ($signatory) {
            $values = array_filter($this->doc->getMeta()["values"], function ($key) {
                return strpos($key, "signature_") === 0;
            }, ARRAY_FILTER_USE_KEY);
            $sids = array_values($values);
            if (count($sids)) {
                $usersData = AccountApi::get(sprintf('user/[%s]', implode(",", $sids)));
                $users = [];
                if($usersData) {
                    foreach ($usersData as $user) {
                        $users = array_merge($users, $user);
                    }
                    $i = 0;
                    $total_users = count($users);
                    $signatory_order = Signatory::getSignatoryOrder();
                    $signatories = array_map(function ($user) use (&$i, $signatory_order, $total_users ) {
                        $userModel = new UserModel($user, $user['id']);
                        $account = AccountApi::getAccount(AccountApi::getAccountIdByUser($userModel->getId()));
                        $signatory_order = Signatory::getSignatoryOrderId($account['type_id'], $signatory_order, $total_users);
                        if(!filter_var($userModel->getData("email"),FILTER_VALIDATE_EMAIL)){
                            $userModel->setData("email", $account['email']);
                        }
                        $userModel->setData("signatory_area_id", $user['id']);
                        $userModel->setData("signatory_routing_order", $signatory_order + $i);
                        $i++;
                        return $userModel;
                    }, $users);
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
        return json_encode(FilesParser::parseFiles($content, $this->getShortcode()->getModels()));
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
        foreach($options as $key => $option){
            $this->setOption($key, $option);
        }
        return $this->generate();
    }

    /**
     * @return array|mixed|object|string
     * @throws Exception
     */
    public function generate ()
    {

        $this->setContent($this->getDocumentContent());

        /*
         * Replace header values
         */
        if($this->getOption('parseHeader')){
            $this->setContent($this->parseHeader());
        }

        /*
         * Replace footer values
         */
        if($this->getOption('parseFooter')){
            $this->setContent($this->parseFooter());
        }

        /*
         * Replace content with shortcodes
         */
        if($this->getOption('parseShortcodes')) {
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
        if($this->getOption('parseHtml')){
            $this->setContent($this->parseHtml());
        }

        /*
         * Replace content file type with the files from file manager
         */
        if($this->getOption('parseFiles')){
            $this->setContent($this->parseFiles());
        }

        /*
         * Schedule of attendances template embeded
         */
        if($this->getOption('soa')){
            $this->setContent($this->parseScheduleOfAttendances());
        }

        /*
         * Schedule of attendances template embeded for McLaren
         */
        if($this->getOption('soamc')){
            $this->setContent($this->parseScheduleOfAttendancesMc());
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
        return $this->document()->isTenderDocument() ? self::FOOTER_LABELS['tender'] : self::FOOTER_LABELS['order'];
    }

    /**
     * @return bool
     * @throws \App\Api\Exception
     */
    public function hasBoqEnabled(): bool
    {
        //only check boq for tenders
        if($this->document()->isTenderDocument()){
            $meta = $this->getMeta();
            $meta_values = $meta['values'] ?? [];
            foreach ($this->document()->getConfig()['data'] as $config) {
                foreach ($config as $key =>  $value) {
                    if(isset($value['boq'])){
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
