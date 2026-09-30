<?php


    namespace App\Models;

    /**
     * Example Data
     * Class Membership
     * @package App\Models
     *  [id] => 1
     *  [label] => Free Trial
     *  [price_label] => 0
     *  [interval_type] => yearly
     *  [interval_unit] => yearly
     *  [interval_amount] => 1
     *  [subscription][price] => 0
     */

    class Subscription
    {
        /**
         * @var array
         */
        protected $data = [];

        /**
         * Subscription constructor.
         * @param array $data
         */
        public function __construct(array $data) {
            $this->data = $data;
        }

        /**
         * @return false|mixed
         */
        public function getId() {
            return $this->data["id"] ?? false;
        }

        /**
         * @return int
         */
        public function getPrice(): int {
            return intval($this->data["price"] ?? 0);
        }

        /**
         * @return bool
         */
        public function isPaid(): bool {
            return ($this->getPrice() > 0);
        }

        /**
         * @return bool
         */
        public function isUpgradeable($websiteFilter=null): bool {

            if(!$this->isPaid()) {
                return false;
            }

            /**Check if Clink Only **/
            if($websiteFilter) {
                $site = $this->data["website"] ?? [];
                return (strcasecmp($site["label"], $websiteFilter) === 0);
            }
            return true;
        }

        /**
         * @param string $prefix
         * @return string
         */
        public function getDescription($prefix = ""): string {

            $desc       = $this->data["description"] ?? "";
            $label      = $this->data["label"] ?? "";
            $priceLabel = $this->data["price_label"] ?? "";
            if($desc) {
                return sprintf("%s %s %s ", $prefix, $label, $desc);
            }

            return trim(
                sprintf("%s %s | %s GBP inc. Vat", $prefix, $label, $priceLabel)
            );
        }

        /**
         * @return array
         */
        public function getData() {
            return $this->data;
        }
    }
