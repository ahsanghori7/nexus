<?php
namespace App\Models;

use App\Api\Account as ApiAccount;
use App\Api\Api;
use App\Api\Prequalification;
use App\Api\V2\Account as AccountV2;

class Subcontractor extends UserModel {

    /**
     * @return mixed
     */
    public function firstName()
    {
        return $this->getData('user')['firstname'];
    }

    /**
     * @return mixed
     */
    public function lastName()
    {
        return $this->getData('user')['lastname'];
    }

    /**
     * @return mixed
     */
    public function displayName()
    {
        return $this->getData('user')['display_name'];
    }

    /**
     * @param string $separator
     * @return string
     * @throws \Exception
     */
    public function fullName(string $separator = ' '): string
    {
        $user_contact = $this->getSupplyChainContact((int)$this->getData('main_contractor_id'));
        $name = $user_contact['display_name'] ?? $user_contact['firstname'] ?? '';
        if(!$name){
            $name = $this->firstName();
            if($this->lastName()){
                $name .= $separator . $this->lastName();
            }
        }
        return $name;
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getPhone(): string
    {
        $mobile = $this->getSupplyChainContact((int)$this->getData('main_contractor_id'));
        return $mobile['contact_number'] ?? parent::getPhone();
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getVatNumber(): string
    {
        $json = Prequalification::get("prequalification/".$this->getData('id'));
        return (string) ($json['company_information']['vat_number'] ?? '');
    }

    /**
     * @return string
     * @throws \Exception
     */
    public function getOrganisationPosition(): string
    {
        $json = Prequalification::get("prequalification/".$this->getData('id'));
        $user = $this->getData("user");
        foreach($json['organisation'] ?? [] as $organisation){
            if((int)$organisation['user_id'] === (int)$user['id']){
                return $organisation['title'] ?? '';
            }
        }
        return '';
    }

    /**
     * @param int $main_contractor_id
     * @return array|null
     */
    public function getExternalUserMeta(int $main_contractor_id): ?array
    {
        $meta = json_decode($this->getData('meta', ''), true);
        if(is_array($meta)) {
            return $meta[$main_contractor_id] ?? [];
        }

        return [];
    }

    /**
     * @param int $main_contractor_id
     * @return array|null
     * @throws \Exception
     */
    public function getSupplyChainContact(int $main_contractor_id): ?array
    {
        $user_id = $this->getData('user_id') ?? 0;
        try{
            if($user_id){
                // Fetching the supply chain user data
                $supply_chain_user =  AccountV2::get(sprintf("account/%s/supply-chain/%s/user/%s", $main_contractor_id, $this->getData("id"), $user_id));
            }
        }catch (\Exception $e){
            //in doc creator for docusign we show all the users from the organisation but not all the users from the subcontractor organisation will be in the supply chain and that means that we will not find that user mapped to the contractor supply chain, and the default user data will be used
        }
        return $supply_chain_user ?? [];
    }

    /**
     * @param int $user_id
     * @return mixed
     * @throws \App\Api\Exception
     */
    public function createAutoLoaderToken(int $user_id)
    {
        return ApiAccount::get("user/$user_id/token/auto_loader");
    }

    /**
     * @return array|mixed|null
     */
    public function getTeamMembers()
    {
        return $this->getData("team");
    }

    /**
     * @return array
     */
    public function getTeamMembersEmail(): array
    {
        $emails = [];
        foreach($this->getTeamMembers() as $member){
            $emails[] = $member['email'];
        }
        return array_unique($emails);
    }

    /**
     * @return array|mixed|null
     * @throws \Exception
     */
    public function getEmail()
    {
        $contact = $this->getSupplyChainContact($this->getData("main_contractor_id"));
        return $contact['email'] ?? $this->getData("email");
    }
}
