<?php


    namespace App\Api;

    use App\Api\Client\Request as ClientRequest;
    use App\Api\Hubspot\InvalidVidException;
    use App\Api\Hubspot\ResponseStatus;
    use App\Models\Subscription;
    use App\Models\User;

    class Hubspot extends Client
    {

        /**
         * @var
         */
        public static $hubspot_site;

        public CONST PROSPER_HUBSPOT_SITE_NAME = 'prosper';

        /**
         * @param $label
         * @param $value
         * @return array
         */
        public static function getProperty(string $label, string $value): array
        {
          return ["property" => $label, "value" => $value];
        }

        /**
         * @param array $data
         * @return array
         */
        public static function getProperties(array $data): array
        {
          $properties = [];

          foreach($data as $k => $v){
            $properties[] = self::getProperty($k, $v);
          }

          return $properties;
        }

        /**
         * @param string $uri
         * @param string $type
         * @return ClientRequest
         * @throws \Exception
         */
        public static function getRequest(string $uri, $type="GET")
        {
          $conf = self::getConfig()[self::getHubspotSite()] ?? self::getConfig() ?? null;

          $bearer = $conf["token"];
          if ( !$bearer ) {
            throw new \Exception("Missing Bearer Token");
          }

          $uri = $uri ?: $conf['url'];
          $request = new ClientRequest($uri, $type);
          $request->setHeaders(['Authorization' => 'Bearer ' . $bearer]);
          return $request;
        }


      /**
       * @param string $email
       * @return mixed
       * @throws InvalidVidException
       */
        public static function getVid(string $email)
        {
          if(!$email){
            throw new \Exception("Invalid Hubspot Response: Email not provided");
          }

          $conf = self::getConfig()[self::getHubspotSite()] ?? self::getConfig() ?? null;

          $json = self::getRequest(sprintf('%s/contacts/v1/contact/email/%s/profile', $conf['url'], $email))
            ->call()
            ->json();

          if(!$json) {
            //Need to properly handle response
            throw new \Exception("Invalid Hubspot Response");
          }

          self::parseStatus($json);

          return $json['vid'];
        }

        /**
         * @param array $data
         * @throws InvalidVidException
         */
        public static function parseStatus(array $data)
        {
          if(isset($data['status']) && $data['status'] === 'error'){
            if(isset($data['category'])) {
              switch ($data['category']) {
                case ResponseStatus::OBJECT_NOT_FOUND:
                  throw new InvalidVidException("No object found");
                  break;
              }
            }
            else{
              throw new \Exception($data['message']);
            }
          }
        }

        /**
         * @param string $k
         * @return array|false
         */
        public static function getForwardingAddress(string $k): array
        {
            return [];
        }

        /**
         * Placeholder awaiting marketing to let us know what data to capture on account Upgrade
         * @param User $user
         * @param Subscription $sub
         */
        public static function updateAccount(User $user, Subscription $sub) {
            if(!self::getConfig()["enabled"]) {
                return;
            }
        }

        /**
         * @param string $email
         * @param string $first
         * @param string $last
         * @param string $company
         */
        public static function signup(string $email, string $first, string $last, string $company)
        {
            if(!self::getConfig()["enabled"]) {
                return;
            }
            return self::post("",
                [
                    'properties' => [
                        'email' => $email,
                        'firstname' => $first,
                        'lastname' => $last,
                        'company' => $company,
                        'lifecyclestage' => 'customer'
                    ]
                ]
            );
        }

      /**
       * @param string $email
       * @param array $data
       */
        public static function prosperUpdateAccount(string $email, array $data): void
        {

          $site_name = self::PROSPER_HUBSPOT_SITE_NAME;

          self::setHubspotSite($site_name);

          if(!isset(self::getConfig()[$site_name]["enabled"]) || !self::getConfig()[$site_name]["enabled"]) {
            return;
          }

          $properties = self::getProperties($data);

          try{
            $vid = self::getVid($email);
          }
          catch (InvalidVidException $vidE){
              if(isset($data['create'])) {
                  $data['email'] = $email;
                  unset($data['create']);
                  self::createProsper($data);
              }
            return;
          }
          catch (\Exception $e){
            //@TODO log this error
            return;
          }

          self::post(
            self::getConfig()[$site_name]['url'].'/contacts/v1/contact/vid/'.$vid.'/profile', [
            'properties' => $properties
          ]);

        }

        /**
         * @param array $data
         */
        public static function createProsper(array $data): void
        {
            $properties = self::getProperties($data);
            self::post( self::getConfig()[self::PROSPER_HUBSPOT_SITE_NAME]['url'].'/contacts/v1/contact/', [
                'properties' => $properties
            ]);
        }

      /**
       * @param string $site
       */
        public static function setHubspotSite(string $site)
        {
          self::$hubspot_site = $site;
        }

      /**
       * @return mixed
       */
        public static function getHubspotSite()
        {
          return self::$hubspot_site;
        }
    }
