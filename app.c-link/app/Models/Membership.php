<?php


    namespace App\Models;

    /**
     * Example Data
     * Class Membership
     * @package App\Models
     *  [id] => 1
     *  [account_id] => 4040
     *  [subscription_id] => 1
     *  [created_at] => 2021-01-07 15:37:20
     *  [updated_at] => 2021-01-07 15:37:20
     *  [meta] => []
     *  [label] => Free Trial
     *  [price_label] => 0
     *  [interval_type] => yearly
     *  [interval_unit] => yearly
     *  [interval_amount] => 1
     *  [subscription][price] => 0
     */

    class Membership
    {

        /**
         * @var array
         */
        protected $data = [];

        /**
         * @var bool
         */
        protected $isAdmin = false;

        /**
         * Membership constructor.
         * @param array $data
         */
        public function __construct(array $data, $isAdmin=false) {
            $this->data = $data;
            $this->isAdmin = $isAdmin;
        }

        /**
         * @return false|mixed
         */
        public function getData() {
          return $this->data;
      }

        /**
         * @param string $key
         * @return false|mixed
         */
        public function getMeta(string $key) {
            return $this->data["meta"][$key] ?? false;
        }

        /**
         * @return bool
         */
        public function isFreeTrial() : bool {
            if($this->isAdmin) {
                return false;
            }

            return ($this->getPrice() === 0);
        }

        /**
         * @return bool
         */
        public function isCPT() : bool {
          if($this->isAdmin) {
              return false;
          }
          return $this->data["subscription"]["uid"] === "cost_planning_tool";
      }

      /**
       * @param string $key
       */
      public function getMetaByKey(string $key)
      {
          $meta = json_decode($this->data['meta'] ?? '', true);
          return $meta[$key] ?? null;
      }

        /**
         * @return array
         */
      public function getMenuOptions(): array
      {
          return $this->getMetaByKey("menu") ?? [];
      }

      /**
       * @param string $key
       */
      public function getMenuOption(string $key)
      {
          return $this->getMenuOptions()[$key] ?? null;
      }

      /**
       * @return string[]
       */
      public function getDefaultAllowedMenupages(): array
      {
          //@TODO store this in a db
          return [
              'index', 'inbox', 'dashboard', 'profile', 'add_team', 'suggestion', 'back_to_admin', 'project_dashboard',
              'supply_chain', 'project', 'add_project', 'edit_project', "quotes_tender",  'form_instruction',
              "company_assets", "issue_order", "issue_enquiry", "file_manager", "download", "document_creator",
              "tender_templates", "draft_orders", "team_manager", 'instructions-variations', 'ncr', 'forecast-final',
              "error_page", "cost_planning_tool", "cost_planning_tool_failure", "orders", "boq"
          ];
      }

        /**
         * @return array
         */
      public function getAllowedPages(): array
      {
          if($this->isCPT()){
              $allowedPages = ['index', 'back_to_admin', 'profile', 'suggestion', 'cost_planning_tool', 'cost_planning_tool_failure'];
          }
          else{
              $allowedPages =  $this->getDefaultAllowedMenupages();
          }

          $restrictedPages = $this->getMenuOption("restricted") ?? [];

          //global restricted pages for a free trial if he doesnt have custom restricted pages
          if(!$restrictedPages && $this->isFreeTrial()){
              $restrictedPages = ['add_team', 'team_manager', 'suggestion', 'supply_chain', 'company_assets', 'cost_planning_tool', 'cost_planning_tool_failure'];
          }

          return array_filter($allowedPages, function ($page) use ($restrictedPages) {
              return !in_array($page, $restrictedPages, true);
          });
      }

      /**
       * @return false
       * This is used to determine if we need to hide or diabled the restricted menu pages
       * Currently this is a global settings and is not possible to hide certain pages and disable others
       * @TODO make this settings to be applied for every page that is restricted
       */
      public function hidePages(): bool
      {
          return $this->getMenuOption("hide") ?? false;
      }

      /**
       * @return mixed
       */
        public function getExpiryDate()
        {
          return $this->data['subscription']["expires_at"];
        }

      /**
       * @return int
       * @throws \Exception
       */
        public function getRemainingDays()
        {
          /*
           * @TODO not all subscription has an expiry date.
           * @TODO currently on free trial has an expiry days
           * If the account has not expiry date than we will assume he is not expired
           */
          if(is_null($this->getExpiryDate())){
            return 1;
          }

          $current_date = new \DateTime(date("Y-m-d H:i:s"));
          $created_at = new \DateTime($this->getExpiryDate());

          /**
           * Because the real time expiration date is in hours minutes and seconds
           * The 14 days will become 13 days 23 hours 59 minutes 59 seconds so
           * we need to adjust the days by +1 because we only display the remaining days
           */
          $remaining = 0;
          $days = 0;

          if($current_date < $created_at){
            $diff = $created_at->diff($current_date);
            $days = $diff->days;
            $remaining += $diff->y;
            $remaining += $diff->m;
            $remaining += $diff->h;
            $remaining += $diff->i;
            $remaining += $diff->s;

            if($remaining && $diff->invert){
              ++$days;
            }
          }

          return $days;
        }

      /**
       * @return bool
       * @throws \Exception
       */
        public function hasExpired()
        {
          return ($this->getRemainingDays() <= 0);
        }

        /**
         * @return int
         */
        public function getPrice() {
            return (int) $this->data['subscription']["price"];
        }
    }
