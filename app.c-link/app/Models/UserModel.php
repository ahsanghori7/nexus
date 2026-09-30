<?php

namespace App\Models;

use App\Api\Account as ApiAccount;
use \App\Api\V2\Account as AccountV2;

class UserModel extends Abstraction
{

    /**
     * @param array $data
     * @return string
     */
    public function getAddress(array $data): string
    {
        $separator = $data['separator'] ?? "\n";
        $address = $this->getData('address');
        if (!isset($address)) {
            return '';
        }
        $address = explode(",", $address);
        return implode($separator, $address);
    }

    /**
     * @return string
     */
    public function getPhone(): string
    {
        $phone = '';
        if ($this->getData('landline')) {
            $phone = $this->getData('landline');
        } elseif ($this->getData('mobile')) {
            $phone = $this->getData('mobile');
        } elseif ($this->getData('user')['contact_number']) {
            $phone = $this->getData('user')['contact_number'];
        }

        return $phone;
    }

    /**
     * @return mixed
     */
    public function firstName()
    {
        return $this->getData('firstname');
    }

    /**
     * @return mixed
     */
    public function lastName()
    {
        return $this->getData('lastname');
    }

    /**
     * @param string $separator
     * @return mixed|string
     */
    public function fullName(string $separator = ' ')
    {
        $name = $this->firstName();
        if ($this->lastName()) {
            $name .= $separator . $this->lastName();
        }
        return $name;
    }

    /**
     * @return bool
     */
    public function isExternalAccount()
    {
        return ApiAccount::isTypeOf($this->getData('type_id'), ApiAccount::getSpecialistExternalTypes());
    }

    /**
     * @param string $uid
     * @return bool
     * @throws \App\Api\Exception
     */
    public function isMembershipType(string $uid): bool
    {
        $membership = ApiAccount::get(sprintf("account/%s", $this->getId()));
        $subscription_id = $membership['membership']['subscription_id'] ?? 0;
        $matched = array_filter(ApiAccount::getSubscriptions(), function ($subscription) use ($subscription_id, $uid) {
            return (
                ((int)$subscription['id'] === (int)$subscription_id)
                &&
                ($subscription['uid'] === $uid)
            );
        });
        return count($matched) === 1;
    }

    /**
     * @param int $user_id
     * @param string $label
     * @param array $meta
     * @return mixed
     * @throws \Exception
     */
    public function createTokenByLabel(int $user_id, string $label, array $meta = [])
    {
        $token_id = ApiAccount::getTypes("token")[$label] ?? null;
        if (!is_null($token_id)) {
            return ApiAccount::post("token", [
                'user_id' => $user_id,
                'type_id' => $token_id,
                'meta' => $meta
            ]);
        }
        throw new \Exception("The token was not created for label $label");
    }

    /**
     * @param string $key
     * @param string $value
     * @return array
     */
    public function existsByKey(string $key, string $value, bool $skipAccount = false)
    {
        $account = (!$skipAccount) ? $this->getAccountByKey($key, $value) : null;
        return ($account ?: $this->getUserByKey($key, $value));
    }

    public function getAccountByKey(string $key, string $value)
    {
        $account = ApiAccount::get('account', [$key => urldecode($value)]);
        return array_shift($account);
    }

    public function getUserByKey(string $key, string $value)
    {
        $user = ApiAccount::get('user', [$key => urldecode($value)]);
        $user = array_shift($user);
        if ($user) {
            $this->setId(intval($user["id"]));
            $this->setData("user_id", $user["id"]);
        }
        return $user;
    }

    public function getUserTypes()
    {
        return ApiAccount::get('user/type');
    }

    public function getTokenTypes(string $label = "")
    {
        $types = ApiAccount::get('token/type');
        if ($label) {
            $types = array_filter($types, function ($type) use ($label) {
                return $label === $type["label"];
            });
            return array_shift($types);
        }
        return $types;
    }

    public function getOrganizationTypes()
    {
        return ApiAccount::get('account/organisation/type');
    }

    public function createOrganizationMember($aid)
    {
        $uid = $this->getId();
        $data = $this->getData();
        $request = ApiAccount::post("account/$aid/organisation", [
            'type_id'           => $data["role_id"],
            'user_id'           => $uid,
            'user_firstname'    => $data["firstname"] ?? null,
            'user_lastname'     => $data["lastname"] ?? null,
            'user_email'        => $data["email"],
            'user_phone'        => null,
            'account_id'        => $aid,
            'custom_type_label' => null,
        ]);
        $json = $request->json()["data"] ?? [];
        return $json;
    }

    /**
     * @param int $main_contractor
     * @return void
     * @throws \Exception
     */
    public function setSupplyChainDataFromMainContractor(int $main_contractor): void
    {
        $data = $this->getData();
        $aid  = (int)$data['account_id'];
        $id   = (int)$data['id'];
        //if the user is a subcontractor, get the subcontractor data from the main contractor supply chain
        if($aid !== $main_contractor){
            try{
                $supply_chain = AccountV2::get("account/$main_contractor/supply-chain/$aid/user/$id");
                if($supply_chain){
                    foreach($supply_chain as $key => $value){
                        $this->setData($key, $value);
                    }
                }
            }catch (\Exception $e){
                //in doc creator for docusign we show all the users from the organisation but not all the users from the subcontractor organisation will be in the supply chain and that means that we will not find that user mapped to the contractor supply chain, and the default user data will be used
            }
        }
    }
}
